import React, { useState } from "react";
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
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { useCartStore, cartHelpers } from "src/store/cartStore";
import { CartItem } from "src/types/Cart";
import {
  createPendingOrders,
  bulkAddInventoryItems,
  bulkAdjustInventoryStock,
} from "../../services/api";
import certificateService from "src/services/certificateService";

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

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity >= 0) {
      updateItemQuantity(cartItemId, newQuantity);
    }
  };

  const handleCostChange = (cartItemId: string, newCost: string) => {
    const cost = parseFloat(newCost) || 0;
    updateItemCost(cartItemId, cost);
  };

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const newItems = useCartStore.getState().getNewItems();
      const reorderItems = useCartStore.getState().getReorderItems();
      const adjustmentItems = useCartStore.getState().getAdjustmentItems();

      let allSuccessful = true;
      const errors: string[] = [];

      // Process new items
      if (newItems.length > 0) {
        try {
          const itemsToAdd = newItems.map((item) => ({
            item_name: item.item_name,
            part_number: item.part_number || "",
            description: item.description || "",
            unit_of_measure: item.unit_of_measure,
            reorder_point: item.reorder_point || 0,
            estimated_cost: item.estimated_cost || 0,
            supplier: item.supplier || "",
            notes: item.notes || "",
          }));

          const result = await bulkAddInventoryItems(itemsToAdd);
          console.log("Successfully added items to inventory:", result);
        } catch (error) {
          allSuccessful = false;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to add ${newItems.length} new items: ${errorMessage}`
          );
          console.error("Bulk add inventory error:", error);
        }
      }

      // Process reorder items - create pending orders instead of direct adjustments
      if (reorderItems.length > 0) {
        try {
          // Get current user from certificate service
          const currentUser = await certificateService.getCurrentUser();

          const pendingOrderItems = reorderItems
            .filter((item) => item.inventory_item_id) // Only process items with valid IDs
            .map((item) => ({
              item_name: item.item_name,
              part_number: item.part_number || "",
              quantity_requested: item.quantity,
              unit_of_measure: item.unit_of_measure,
              supplier: item.supplier || "",
              estimated_cost: item.estimated_cost || 0,
              notes: item.notes || "Bulk reorder request",
              inventory_item_id: item.inventory_item_id!,
              requested_by: currentUser.displayName || "Unknown User",
            }));

          await createPendingOrders(pendingOrderItems);
          console.log("Created pending orders for:", pendingOrderItems);
        } catch (error) {
          allSuccessful = false;
          console.error("Pending orders creation error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to create pending orders for ${reorderItems.length} items: ${errorMessage}`
          );
        }
      }

      // Process adjustment items
      if (adjustmentItems.length > 0) {
        try {
          const adjustments = adjustmentItems.map((item) => ({
            inventory_item_id: item.inventory_item_id!,
            quantity_changed: item.quantity,
            transaction_type:
              item.adjustment_type === "add"
                ? ("add" as const)
                : ("subtract" as const),
            user_name: "Current User", // TODO: Get from auth context
            notes: item.adjustment_reason || item.notes || "Bulk adjustment",
          }));

          const result = await bulkAdjustInventoryStock(adjustments);
          console.log("Successfully processed adjustments:", result);
        } catch (error) {
          allSuccessful = false;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to process ${adjustmentItems.length} adjustments: ${errorMessage}`
          );
          console.error("Bulk adjustment error:", error);
        }
      }

      if (allSuccessful) {
        let successMsg = "Successfully processed all items! ";
        if (newItems.length > 0)
          successMsg += `${newItems.length} new items added to inventory. `;
        if (reorderItems.length > 0)
          successMsg += `${reorderItems.length} reorder requests sent to pending orders. `;
        if (adjustmentItems.length > 0)
          successMsg += `${adjustmentItems.length} inventory adjustments made.`;

        setSubmitResult(successMsg);
        clearCart();
      } else {
        setSubmitResult(`Completed with errors: ${errors.join(", ")}`);
      }
    } catch (error) {
      setSubmitResult("Error submitting items. Please try again.");
      console.error("Bulk submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => (
    <ListItem
      sx={{
        flexDirection: "column",
        alignItems: "stretch",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "flex-start", width: "100%", mb: 1 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {cartHelpers.getItemDisplayName(item)}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <Chip
              label={
                item.type === "new"
                  ? "New Item"
                  : item.type === "reorder"
                  ? "Reorder"
                  : `${item.adjustment_type === "add" ? "Add" : "Remove"} Stock`
              }
              color={
                item.type === "new"
                  ? "primary"
                  : item.type === "reorder"
                  ? "secondary"
                  : item.adjustment_type === "add"
                  ? "success"
                  : "error"
              }
              size="small"
            />
            <Chip
              label={item.unit_of_measure}
              variant="outlined"
              size="small"
            />
          </Box>
          {item.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {item.description}
            </Typography>
          )}
          {item.type === "reorder" &&
            item.current_stock_level !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Current Stock: {item.current_stock_level}
              </Typography>
            )}
        </Box>
        <IconButton
          onClick={() => removeItem(item.id)}
          size="small"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            value={item.quantity}
            onChange={(e) =>
              handleQuantityChange(item.id, parseInt(e.target.value) || 0)
            }
            sx={{ width: 80 }}
            inputProps={{ min: 1, style: { textAlign: "center" } }}
          />
          <IconButton
            size="small"
            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        <TextField
          size="small"
          label="Est. Cost"
          type="number"
          value={item.estimated_cost || ""}
          onChange={(e) => handleCostChange(item.id, e.target.value)}
          sx={{ width: 100 }}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{
            startAdornment: <Typography variant="body2">$</Typography>,
          }}
        />

        <Typography variant="body2" fontWeight={500}>
          {cartHelpers.formatCurrency(
            (item.estimated_cost || 0) * item.quantity
          )}
        </Typography>
      </Box>
    </ListItem>
  );

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={closeCart}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 450 },
          maxWidth: "100vw",
        },
      }}
    >
      <Box
        sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CartIcon sx={{ mr: 1, color: "primary.main" }} />
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2">Items:</Typography>
              <Typography variant="body2">{summary.totalItems}</Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2">Total Quantity:</Typography>
              <Typography variant="body2">{summary.totalQuantity}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {items.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
                color: "text.secondary",
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
                severity={submitResult.includes("Error") ? "error" : "success"}
                sx={{ mb: 2 }}
                onClose={() => setSubmitResult(null)}
              >
                {submitResult}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
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
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ReceiptIcon />
                  )
                }
                sx={{ flex: 2 }}
              >
                {isSubmitting ? "Submitting..." : "Submit All Items"}
              </Button>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", display: "block" }}
            >
              {summary.newItemsCount} new items • {summary.reorderItemsCount}{" "}
              reorders • {summary.adjustmentItemsCount} adjustments
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
