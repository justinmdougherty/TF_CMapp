import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustInventoryStock } from '../../../services/api';
import { InventoryItem, InventoryAdjustment } from '../../../types/Inventory';
import certificateService from '../../../services/certificateService';

interface InventoryAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
  adjustmentType: 'add' | 'subtract';
}

const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({
  open,
  onClose,
  onSuccess,
  item,
  adjustmentType,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [technician, setTechnician] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('');
  const [error, setError] = useState<string>('');

  const queryClient = useQueryClient();

  // Auto-populate technician field when modal opens
  useEffect(() => {
    if (open && !technician) {
      console.log('Modal opened, attempting to populate technician...');

      const populateTechnician = async () => {
        try {
          const user = await certificateService.getCurrentUser();
          console.log('Certificate service returned user:', user);

          if (user?.displayName) {
            console.log('Setting technician to:', user.displayName);
            setTechnician(user.displayName);
          } else {
            console.warn('No display name found in user data:', user);
            // Fallback to username if displayName is not available
            if (user?.username) {
              setTechnician(user.username);
            }
          }
        } catch (error) {
          console.error('Failed to get current user from certificate service:', error);
          // Don't show error to user for this, just log it
        }
      };

      populateTechnician();
    }
  }, [open, technician]);

  const adjustmentMutation = useMutation({
    mutationFn: (adjustment: InventoryAdjustment) => adjustInventoryStock(adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      console.error('Adjustment error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      // More detailed error handling
      let errorMessage = 'Failed to adjust inventory';

      if (error.response?.data) {
        const responseData = error.response.data;

        // Handle string error messages
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
        // Handle object error responses
        else if (typeof responseData === 'object') {
          errorMessage =
            responseData.message ||
            responseData.error ||
            responseData.details ||
            JSON.stringify(responseData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add status code context
      if (error.response?.status) {
        errorMessage = `${errorMessage} (Status: ${error.response.status})`;
      }

      setError(errorMessage);
    },
  });

  const handleClose = () => {
    setQuantity(1);
    setReason('');
    setTechnician('');
    setPoNumber('');
    setNotes('');
    setReasonCategory('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (adjustmentType === 'subtract' && quantity > item.current_stock_level) {
      setError(
        `Cannot subtract ${quantity} items. Only ${item.current_stock_level} items available.`,
      );
      return;
    }

    if (!technician.trim()) {
      setError('Please enter the technician name');
      return;
    }

    // Make reason mandatory for subtract operations
    if (adjustmentType === 'subtract' && !reason.trim()) {
      setError('Reason is required when removing stock');
      return;
    }

    const finalReason = reasonCategory ? `${reasonCategory}: ${reason}` : reason;

    const adjustment: InventoryAdjustment = {
      inventory_item_id: item.inventory_item_id, // Send as number instead of string
      quantity_changed: adjustmentType === 'add' ? quantity : -quantity,
      transaction_type: adjustmentType,
      reason: finalReason || undefined,
      user_name: technician,
      po_number: poNumber || undefined,
      notes: notes || undefined,
    };

    console.log('Submitting adjustment:', adjustment); // Debug log
    adjustmentMutation.mutate(adjustment);
  };

  const getNewStockLevel = () => {
    if (adjustmentType === 'add') {
      return item.current_stock_level + quantity;
    } else {
      return Math.max(0, item.current_stock_level - quantity);
    }
  };

  const reasonCategories = [
    'Purchase Order',
    'Production Use',
    'Damaged/Defective',
    'Expired/Obsolete',
    'Cycle Count',
    'Correction',
    'Transfer',
    'Return',
    'Loss/Theft',
    'Other',
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {adjustmentType === 'add' ? <AddIcon color="success" /> : <RemoveIcon color="warning" />}
          <Typography variant="h6">
            {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'} - {item.item_name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Stock Level
            </Typography>
            <Chip
              label={`${item.current_stock_level} ${item.unit_of_measure}`}
              color="info"
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Projected Stock Level
            </Typography>
            <Chip
              label={`${getNewStockLevel()} ${item.unit_of_measure}`}
              color={adjustmentType === 'add' ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            inputProps={{ min: 1 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">{item.unit_of_measure}</InputAdornment>,
            }}
            fullWidth
            required
          />
          <TextField
            label="Technician/User"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            fullWidth
            required
            placeholder="Enter technician name"
            InputProps={{ readOnly: true }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Reason Category</InputLabel>
            <Select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              label="Reason Category"
            >
              <MenuItem value="">
                <em>Select a category</em>
              </MenuItem>
              {reasonCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="PO Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            fullWidth
            placeholder="Optional"
          />
        </Box>

        <TextField
          label={`Reason/Description${adjustmentType === 'subtract' ? ' *' : ''}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mb: 2 }}
          required={adjustmentType === 'subtract'}
          placeholder={
            adjustmentType === 'subtract'
              ? 'Required: Enter reason for removing stock'
              : 'Enter reason for adjustment'
          }
          error={
            adjustmentType === 'subtract' && !reason.trim() && error.includes('Reason is required')
          }
        />

        <TextField
          label="Additional Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          fullWidth
          placeholder="Optional additional notes"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={adjustmentMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={adjustmentType === 'add' ? 'success' : 'warning'}
          disabled={adjustmentMutation.isPending}
        >
          {adjustmentMutation.isPending
            ? 'Processing...'
            : adjustmentType === 'add'
            ? 'Add Stock'
            : 'Remove Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryAdjustmentModal;
