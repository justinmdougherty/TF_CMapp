import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useUpdateInventoryItem } from '../../../hooks/api/useInventoryHooks';
import { InventoryItem } from '../../../types/Inventory';

interface EditInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
}

const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  item,
}) => {
  const [formData, setFormData] = useState({
    item_name: '',
    part_number: '',
    description: '',
    unit_of_measure: '',
    current_stock_level: 0,
    reorder_point: 0,
  });
  const [error, setError] = useState<string>('');

  const updateInventoryMutation = useUpdateInventoryItem();

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        part_number: item.part_number || '',
        description: item.description || '',
        unit_of_measure: item.unit_of_measure,
        current_stock_level: item.current_stock_level,
        reorder_point: item.reorder_point || 0,
      });
    }
  }, [item]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!formData.unit_of_measure.trim()) {
      setError('Unit of measure is required');
      return;
    }

    try {
      const updatedItem: InventoryItem = {
        ...item,
        ...formData,
      };

      await updateInventoryMutation.mutateAsync(updatedItem);
      onSuccess();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update inventory item');
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6">Edit Inventory Item</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Item Name"
            value={formData.item_name}
            onChange={(e) => handleChange('item_name', e.target.value)}
            fullWidth
            required
            placeholder="Enter item name"
          />
          <TextField
            label="Part Number"
            value={formData.part_number}
            onChange={(e) => handleChange('part_number', e.target.value)}
            fullWidth
            placeholder="Enter part number"
          />
        </Box>

        <TextField
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mb: 2 }}
          placeholder="Enter description"
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Unit of Measure"
            value={formData.unit_of_measure}
            onChange={(e) => handleChange('unit_of_measure', e.target.value)}
            fullWidth
            required
            placeholder="e.g., pcs, kg, m"
          />
          <TextField
            label="Current Stock Level"
            type="number"
            value={formData.current_stock_level}
            onChange={(e) => handleChange('current_stock_level', parseInt(e.target.value) || 0)}
            inputProps={{ min: 0 }}
            fullWidth
          />
        </Box>

        <TextField
          label="Reorder Point"
          type="number"
          value={formData.reorder_point}
          onChange={(e) => handleChange('reorder_point', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          fullWidth
          placeholder="Minimum stock level before reorder"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={updateInventoryMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={updateInventoryMutation.isPending}
        >
          {updateInventoryMutation.isPending ? 'Updating...' : 'Update Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInventoryModal;
