import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Divider,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useCartStore, cartHelpers } from 'src/store/cartStore';
import { CartItem } from 'src/types/Cart';
import {
  createInventoryItem,
  bulkAdjustInventoryStock,
  addToCart,
  createOrderFromCart,
  checkInventoryStock,
} from 'src/services/api';
import { useInventoryStock, canOrderQuantity } from 'src/hooks/api/useStockHooks';

const CartDrawer: React.FC = () => {
  const theme = useTheme();
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateItemQuantity,
    updateItemCost,
    clearCart,
    getCartSummary,
  } = useCartStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const summary = getCartSummary();

  const handleQuantityChange = useCallback(
    (cartItemId: string, newQuantity: number) => {
      // Allow any non-negative quantity during editing
      if (newQuantity >= 0) {
        updateItemQuantity(cartItemId, newQuantity);
      }
    },
    [updateItemQuantity],
  );

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Filter out any items with 0 quantity before processing
      const validItems = items.filter((item) => item.quantity > 0);

      if (validItems.length === 0) {
        setSubmitResult(
          'No valid items to submit. Please ensure all items have quantity greater than 0.',
        );
        setIsSubmitting(false);
        return;
      }

      // Check stock validation for reorder items before submitting
      const stockValidationErrors: string[] = [];

      for (const item of validItems) {
        if (item.type === 'reorder' && item.inventory_item_id) {
          try {
            const stockData = await checkInventoryStock(item.inventory_item_id);
            const validation = canOrderQuantity(stockData, item.quantity);

            if (!validation.canOrder) {
              stockValidationErrors.push(`${item.item_name}: ${validation.message}`);
            }
          } catch (error) {
            console.warn(`Could not validate stock for ${item.item_name}:`, error);
            // Continue with submission even if stock check fails
          }
        }
      }

      // If there are stock validation errors, warn the user but allow submission
      if (stockValidationErrors.length > 0) {
        const proceed = window.confirm(
          `Stock validation warnings:\n\n${stockValidationErrors.join(
            '\n',
          )}\n\nDo you want to proceed anyway?`,
        );

        if (!proceed) {
          setIsSubmitting(false);
          return;
        }
      }

      const newItems = validItems.filter((item) => item.type === 'new');
      const reorderItems = validItems.filter((item) => item.type === 'reorder');
      const adjustmentItems = validItems.filter((item) => item.type === 'adjustment');

      let allSuccessful = true;
      const errors: string[] = [];

      // Process new items - create inventory items first, then add to cart
      if (newItems.length > 0) {
        try {
          const createdItems: number[] = [];

          // First create inventory items
          for (const item of newItems) {
            const newInventoryItem = {
              item_name: item.item_name,
              part_number: item.part_number || '',
              description: item.description || '',
              category: 'General',
              unit_of_measure: item.unit_of_measure,
              current_stock_level: 0, // Start with 0 stock
              reorder_point: item.reorder_point || 0,
              max_stock_level: undefined,
              supplier_info: item.supplier || '',
              cost_per_unit: item.estimated_cost || 0,
              location: 'Main Warehouse',
              program_id: 1,
              created_by: 1,
            };

            console.log('Creating inventory item:', newInventoryItem);
            const createdItem = await createInventoryItem(newInventoryItem);
            console.log('Created item response:', createdItem);
            createdItems.push(createdItem.inventory_item_id);
          }

          // Then add each new item to cart for ordering
          for (let i = 0; i < newItems.length; i++) {
            const cartItem = {
              inventory_item_id: createdItems[i],
              quantity_requested: newItems[i].quantity,
              estimated_cost: newItems[i].estimated_cost || 0,
              notes: `New item: ${newItems[i].item_name}`,
            };

            await addToCart(cartItem);
          }

          console.log('Successfully created and added new items to cart:', newItems.length);
        } catch (error) {
          allSuccessful = false;
          console.error('New items creation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to create ${newItems.length} new items: ${errorMessage}`);
        }
      }

      // Process reorder items - add directly to cart
      if (reorderItems.length > 0) {
        try {
          for (const item of reorderItems) {
            if (item.inventory_item_id) {
              const cartItem = {
                inventory_item_id: item.inventory_item_id,
                quantity_requested: item.quantity,
                estimated_cost: item.estimated_cost || 0,
                notes: item.notes || 'Reorder request',
              };

              await addToCart(cartItem);
            }
          }

          console.log('Successfully added reorder items to cart:', reorderItems.length);
        } catch (error) {
          allSuccessful = false;
          console.error('Reorder items cart error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to add ${reorderItems.length} reorder items to cart: ${errorMessage}`,
          );
        }
      }

      // Process adjustment items - direct inventory adjustments
      if (adjustmentItems.length > 0) {
        try {
          const adjustments = adjustmentItems.map((item) => ({
            inventory_item_id: item.inventory_item_id!,
            quantity_changed: item.quantity,
            transaction_type:
              item.adjustment_type === 'add' ? ('add' as const) : ('subtract' as const),
            user_name: 'Current User',
            notes: item.adjustment_reason || item.notes || 'Bulk adjustment',
          }));

          await bulkAdjustInventoryStock(adjustments);
          console.log('Successfully processed adjustments:', adjustments.length);
        } catch (error) {
          allSuccessful = false;
          console.error('Adjustment processing error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process ${adjustmentItems.length} adjustments: ${errorMessage}`);
        }
      }

      // Create order from cart if there are new items or reorder items
      if ((newItems.length > 0 || reorderItems.length > 0) && allSuccessful) {
        try {
          const orderData = {
            project_id: 1,
            supplier_info: 'Various Suppliers',
            order_notes: `Bulk order from cart: ${newItems.length} new items, ${reorderItems.length} reorder items`,
          };

          const orderResult = await createOrderFromCart(orderData);

          if (orderResult.success) {
            console.log('Successfully created order from cart');
          } else {
            console.warn('Order creation had issues:', orderResult.message);
          }
        } catch (error) {
          console.error('Order creation error:', error);
          // Don't fail the whole operation for order creation issues
        }
      }

      if (allSuccessful) {
        let successMsg = 'Successfully processed all items! ';
        if (newItems.length > 0)
          successMsg += `${newItems.length} new items created and added to cart. `;
        if (reorderItems.length > 0)
          successMsg += `${reorderItems.length} reorder items added to cart. `;
        if (adjustmentItems.length > 0)
          successMsg += `${adjustmentItems.length} inventory adjustments made. `;

        setSubmitResult(successMsg);
        clearCart();
      } else {
        setSubmitResult(`Completed with errors: ${errors.join(', ')}`);
      }
    } catch (error) {
      setSubmitResult('Error submitting items. Please try again.');
      console.error('Bulk submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
    // Local state for quantity input to prevent focus loss
    const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
    const [isEditing, setIsEditing] = useState(false);

    // Local state for cost input to prevent focus loss
    const [localCost, setLocalCost] = useState((item.estimated_cost || 0).toString());
    const [isCostEditing, setIsCostEditing] = useState(false);

    // Stock checking for reorder items
    const {
      data: stockData,
      isLoading: stockLoading,
      isError: stockError,
    } = useInventoryStock(
      item.type === 'reorder' && item.inventory_item_id ? item.inventory_item_id : null,
      {
        enabled: item.type === 'reorder' && !!item.inventory_item_id,
        refetchInterval: 30000, // Check stock every 30 seconds
      },
    );

    // Calculate stock validation for current quantity
    const stockValidation = stockData ? canOrderQuantity(stockData, item.quantity) : null;

    // Update local state when item quantity changes externally (e.g., from buttons)
    React.useEffect(() => {
      if (!isEditing) {
        setLocalQuantity(item.quantity.toString());
      }
    }, [item.quantity, isEditing]);

    // Update local state when item cost changes externally
    React.useEffect(() => {
      if (!isCostEditing) {
        setLocalCost((item.estimated_cost || 0).toString());
      }
    }, [item.estimated_cost, isCostEditing]);

    const handleQuantityInputChange = (value: string) => {
      setLocalQuantity(value);
      setIsEditing(true);

      // DON'T update store immediately - only update local state
      // Store will be updated on blur to prevent focus loss during typing
    };

    const handleQuantityInputBlur = () => {
      setIsEditing(false);
      let finalQuantity = parseInt(localQuantity) || 0;

      // Validate against stock for reorder items
      if (item.type === 'reorder' && stockValidation && !stockValidation.canOrder) {
        // Automatically adjust to max available if exceeding stock
        if (stockValidation.maxAvailable > 0 && finalQuantity > stockValidation.maxAvailable) {
          finalQuantity = stockValidation.maxAvailable;
          setLocalQuantity(finalQuantity.toString());
        }
      }

      // If quantity is 0 when user finishes editing, remove the item
      if (finalQuantity === 0) {
        removeItem(item.id);
      } else {
        // Ensure store has the correct final value
        updateItemQuantity(item.id, finalQuantity);
        setLocalQuantity(finalQuantity.toString());
      }
    };

    const handleQuantityKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    };

    const handleCostInputChange = (value: string) => {
      setLocalCost(value);
      setIsCostEditing(true);

      // DON'T update store immediately - only update local state
      // Store will be updated on blur to prevent focus loss during typing
    };

    const handleCostInputBlur = () => {
      setIsCostEditing(false);
      const finalCost = parseFloat(localCost) || 0;

      // Update store with final cost value
      updateItemCost(item.id, finalCost);
      setLocalCost(finalCost.toString());
    };

    const handleCostKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    };

    return (
      <ListItem
        sx={{
          flexDirection: 'column',
          alignItems: 'stretch',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          mb: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {cartHelpers.getItemDisplayName(item)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={
                  item.type === 'new'
                    ? 'New Item'
                    : item.type === 'reorder'
                    ? 'Reorder'
                    : `${item.adjustment_type === 'add' ? 'Add' : 'Remove'} Stock`
                }
                color={
                  item.type === 'new'
                    ? 'primary'
                    : item.type === 'reorder'
                    ? 'secondary'
                    : item.adjustment_type === 'add'
                    ? 'success'
                    : 'error'
                }
                size="small"
              />
              <Chip label={item.unit_of_measure} variant="outlined" size="small" />

              {/* Stock status indicator for reorder items */}
              {item.type === 'reorder' && stockData && (
                <Tooltip title={stockData.stock_message}>
                  <Chip
                    icon={
                      stockValidation?.canOrder ? (
                        <CheckCircleIcon />
                      ) : stockData.available_quantity <= 0 ? (
                        <ErrorIcon />
                      ) : (
                        <WarningIcon />
                      )
                    }
                    label={
                      stockValidation?.canOrder
                        ? `✓ Available (${stockData.available_quantity})`
                        : stockData.available_quantity <= 0
                        ? 'Out of Stock'
                        : `Limited (${stockData.available_quantity})`
                    }
                    color={
                      stockValidation?.canOrder
                        ? 'success'
                        : stockData.available_quantity <= 0
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              )}

              {/* Loading indicator for stock check */}
              {item.type === 'reorder' && stockLoading && (
                <Chip
                  icon={<CircularProgress size={12} />}
                  label="Checking stock..."
                  size="small"
                  variant="outlined"
                />
              )}

              {/* Error indicator for stock check */}
              {item.type === 'reorder' && stockError && (
                <Tooltip title="Unable to check stock availability">
                  <Chip
                    icon={<ErrorIcon />}
                    label="Stock check failed"
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Box>
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.description}
              </Typography>
            )}
            {item.type === 'reorder' && item.current_stock_level !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Current Stock: {item.current_stock_level}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => removeItem(item.id)} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              size="small"
              type="number"
              value={localQuantity}
              onChange={(e) => handleQuantityInputChange(e.target.value)}
              onBlur={handleQuantityInputBlur}
              onKeyPress={handleQuantityKeyPress}
              sx={{
                width: 80,
                '& .MuiOutlinedInput-root': {
                  // Add red border if quantity exceeds available stock
                  ...(item.type === 'reorder' &&
                    stockValidation &&
                    !stockValidation.canOrder && {
                      '& fieldset': {
                        borderColor: theme.palette.error.main,
                      },
                    }),
                },
              }}
              inputProps={{ min: 0, style: { textAlign: 'center' } }}
              error={item.type === 'reorder' && stockValidation ? !stockValidation.canOrder : false}
            />
            <IconButton
              size="small"
              onClick={() => {
                const newQuantity = item.quantity + 1;
                // Check stock limits for reorder items
                if (
                  item.type === 'reorder' &&
                  stockValidation &&
                  newQuantity > stockValidation.maxAvailable &&
                  stockValidation.maxAvailable > 0
                ) {
                  // Don't allow exceeding available stock
                  return;
                }
                handleQuantityChange(item.id, newQuantity);
              }}
              disabled={
                item.type === 'reorder' && stockValidation
                  ? item.quantity >= stockValidation.maxAvailable &&
                    stockValidation.maxAvailable > 0
                  : false
              }
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Stock validation message */}
          {item.type === 'reorder' && stockValidation && !stockValidation.canOrder && (
            <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
              {stockValidation.message}
            </Typography>
          )}

          <TextField
            size="small"
            label="Est. Cost"
            type="number"
            value={localCost}
            onChange={(e) => handleCostInputChange(e.target.value)}
            onBlur={handleCostInputBlur}
            onKeyPress={handleCostKeyPress}
            sx={{ width: 100 }}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <Typography variant="body2">$</Typography>,
            }}
          />

          <Typography variant="body2" fontWeight={500}>
            {cartHelpers.formatCurrency((item.estimated_cost || 0) * item.quantity)}
          </Typography>
        </Box>
      </ListItem>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={closeCart}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CartIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flex: 1 }}>
            Inventory Cart
          </Typography>
          <IconButton onClick={closeCart}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Summary */}
        {summary.totalItems > 0 && (
          <Box
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Cart Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Items:</Typography>
              <Typography variant="body2">{summary.totalItems}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Total Quantity:</Typography>
              <Typography variant="body2">{summary.totalQuantity}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600}>
                Estimated Total:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {cartHelpers.formatCurrency(summary.estimatedTotalCost)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Items List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <CartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2">
                Add inventory items or reorders to get started
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </List>
          )}
        </Box>

        {/* Action Buttons */}
        {items.length > 0 && (
          <Box sx={{ pt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {submitResult && (
              <Alert
                severity={
                  submitResult.toLowerCase().includes('error') || submitResult.includes('Failed')
                    ? 'error'
                    : 'success'
                }
                sx={{ mb: 2 }}
                onClose={() => setSubmitResult(null)}
              >
                {submitResult}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={clearCart}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              >
                Clear Cart
              </Button>
              <Button
                variant="contained"
                onClick={handleBulkSubmit}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <ReceiptIcon />}
                sx={{ flex: 2 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit All Items'}
              </Button>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', display: 'block' }}
            >
              {summary.newItemsCount} new items • {summary.reorderItemsCount} reorders •{' '}
              {summary.adjustmentItemsCount} adjustments
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
