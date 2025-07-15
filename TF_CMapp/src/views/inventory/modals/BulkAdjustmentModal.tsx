import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
  Autocomplete,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchInventoryItems } from '../../../services/api';
import { InventoryItem } from '../../../types/Inventory';
import { useCartStore } from '../../../store/cartStore';
import { notifications } from '../../../services/notificationService';

interface BulkAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
}

const BulkAdjustmentModal: React.FC<BulkAdjustmentModalProps> = ({ open, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('');

  const { addItem, openCart } = useCartStore();

  // Fetch inventory items for selection
  const {
    data: inventoryItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: fetchInventoryItems,
    enabled: open,
  });

  // Ensure we always have an array for the Autocomplete
  const safeInventoryItems = Array.isArray(inventoryItems) ? inventoryItems : [];

  const reasonCategories = [
    'Stock Count Correction',
    'Damaged Items',
    'Lost Items',
    'Returned Items',
    'Quality Control',
    'Transfer Between Locations',
    'Other',
  ];

  const handleAddToCart = () => {
    if (!selectedItem) {
      notifications.error('Please select an inventory item');
      return;
    }

    if (quantity <= 0) {
      notifications.error('Quantity must be greater than 0');
      return;
    }

    if (!reasonCategory) {
      notifications.error('Please select a reason category');
      return;
    }

    // Add item to cart as adjustment type
    addItem({
      type: 'adjustment',
      item_name: selectedItem.item_name,
      part_number: selectedItem.part_number,
      description: selectedItem.description,
      unit_of_measure: selectedItem.unit_of_measure,
      quantity: quantity,
      inventory_item_id: selectedItem.inventory_item_id,
      current_stock_level: selectedItem.current_stock_level,
      adjustment_type: adjustmentType,
      adjustment_reason: reason || reasonCategory,
      notes: `${adjustmentType === 'add' ? 'Add' : 'Remove'} ${quantity} ${
        selectedItem.unit_of_measure
      } - ${reasonCategory}${reason ? `: ${reason}` : ''}`,
    });

    notifications.success(`Added ${selectedItem.item_name} to adjustment cart`);

    // Reset form
    setSelectedItem(null);
    setQuantity(1);
    setReason('');
    setReasonCategory('');
  };

  const handleAddToCartAndClose = () => {
    handleAddToCart();
    onClose();
    openCart(); // Open cart to show added items
  };

  const handleReset = () => {
    setSelectedItem(null);
    setAdjustmentType('add');
    setQuantity(1);
    setReason('');
    setReasonCategory('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CartIcon color="primary" />
            <Typography variant="h6">Bulk Inventory Adjustments</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info">
            Use this tool to add multiple inventory items to your cart for bulk adjustments. You can
            set different adjustment types and reasons for each item, then process them all at once.
          </Alert>

          {error && (
            <Alert severity="error">
              Error loading inventory items. Please try refreshing the page.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Item Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={safeInventoryItems}
                getOptionLabel={(option) =>
                  `${option.item_name}${
                    option.part_number ? ` (${option.part_number})` : ''
                  } - Current: ${option.current_stock_level}`
                }
                value={selectedItem}
                onChange={(_, newValue) => setSelectedItem(newValue)}
                loading={isLoading}
                disabled={isLoading || !!error}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Inventory Item"
                    placeholder="Search by name or part number..."
                    fullWidth
                    error={!!error}
                    helperText={error ? 'Unable to load inventory items' : ''}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.item_name}
                        {option.part_number && (
                          <Chip label={option.part_number} size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Stock: {option.current_stock_level} {option.unit_of_measure}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Adjustment Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Adjustment Type</InputLabel>
                <Select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')}
                  label="Adjustment Type"
                >
                  <MenuItem value="add">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddIcon color="success" />
                      Add Stock
                    </Box>
                  </MenuItem>
                  <MenuItem value="remove">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RemoveIcon color="error" />
                      Remove Stock
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Reason Category */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Reason Category *</InputLabel>
                <Select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  label="Reason Category *"
                  required
                >
                  {reasonCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Additional Reason */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Details (Optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={2}
                placeholder="Provide additional details about this adjustment..."
              />
            </Grid>
          </Grid>

          {selectedItem && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Item Summary:
              </Typography>
              <Typography variant="body2">
                <strong>{selectedItem.item_name}</strong>
                {selectedItem.part_number && ` (${selectedItem.part_number})`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Stock: {selectedItem.current_stock_level} {selectedItem.unit_of_measure}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After Adjustment:{' '}
                {adjustmentType === 'add'
                  ? selectedItem.current_stock_level + quantity
                  : Math.max(0, selectedItem.current_stock_level - quantity)}{' '}
                {selectedItem.unit_of_measure}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} disabled={!selectedItem}>
          Reset
        </Button>
        <Button onClick={handleClose}>Close</Button>
        <Button
          onClick={handleAddToCart}
          variant="outlined"
          disabled={!selectedItem || !reasonCategory}
          startIcon={<CartIcon />}
        >
          Add to Cart
        </Button>
        <Button
          onClick={handleAddToCartAndClose}
          variant="contained"
          disabled={!selectedItem || !reasonCategory}
          startIcon={<CartIcon />}
        >
          Add to Cart & Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkAdjustmentModal;
