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
  Card,
  CardContent,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Divider,
} from '@mui/material';
import { SwapHoriz as ReplaceIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '../../../types/Inventory';
import certificateService from '../../../services/certificateService';

interface PartReplacementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
}

interface PartReplacementRequest {
  old_part_id: string;
  new_part_id: string;
  replacement_reason: string;
  replacement_category: string;
  stock_handling: 'transfer' | 'dispose' | 'return';
  quantity_to_replace: number;
  technician_name: string;
  notes?: string;
}

const PartReplacementModal: React.FC<PartReplacementModalProps> = ({
  open,
  onClose,
  onSuccess,
  item,
}) => {
  const [newPartName, setNewPartName] = useState<string>('');
  const [newPartNumber, setNewPartNumber] = useState<string>('');
  const [newPartDescription, setNewPartDescription] = useState<string>('');
  const [replacementReason, setReplacementReason] = useState<string>('');
  const [replacementCategory, setReplacementCategory] = useState<string>('');
  const [stockHandling, setStockHandling] = useState<'transfer' | 'dispose' | 'return'>('transfer');
  const [quantityToReplace, setQuantityToReplace] = useState<number>(item.current_stock_level);
  const [technician, setTechnician] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const queryClient = useQueryClient();

  // Auto-populate technician field when modal opens
  useEffect(() => {
    if (open && !technician) {
      certificateService
        .getCurrentUser()
        .then((user) => {
          if (user.displayName) {
            setTechnician(user.displayName);
          }
        })
        .catch((error) => {
          console.error('Failed to get current user:', error);
        });
    }
  }, [open, technician]);

  // This would be a real API call in practice
  const replacementMutation = useMutation({
    mutationFn: async (replacement: PartReplacementRequest) => {
      // Simulate API call - in real implementation this would call the backend
      console.log('Part replacement request:', replacement);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return replacement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to process part replacement');
    },
  });

  const handleClose = () => {
    setNewPartName('');
    setNewPartNumber('');
    setNewPartDescription('');
    setReplacementReason('');
    setReplacementCategory('');
    setStockHandling('transfer');
    setQuantityToReplace(item.current_stock_level);
    setTechnician('');
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!newPartName.trim()) {
      setError('Please enter the new part name');
      return;
    }

    if (!newPartNumber.trim()) {
      setError('Please enter the new part number');
      return;
    }

    if (!replacementCategory) {
      setError('Please select a replacement category');
      return;
    }

    if (!replacementReason.trim()) {
      setError('Please enter the replacement reason');
      return;
    }

    if (!technician.trim()) {
      setError('Please enter the technician name');
      return;
    }

    if (quantityToReplace <= 0 || quantityToReplace > item.current_stock_level) {
      setError(`Quantity must be between 1 and ${item.current_stock_level}`);
      return;
    }

    const replacement: PartReplacementRequest = {
      old_part_id: item.inventory_item_id.toString(),
      new_part_id: 'new_part_id', // In real implementation, this would be determined by the backend
      replacement_reason: replacementReason,
      replacement_category: replacementCategory,
      stock_handling: stockHandling,
      quantity_to_replace: quantityToReplace,
      technician_name: technician,
      notes: notes || undefined,
    };

    replacementMutation.mutate(replacement);
  };

  const replacementCategories = [
    'End of Life',
    'Quality Issue',
    'Obsolescence',
    'Supplier Change',
    'Cost Reduction',
    'Performance Upgrade',
    'Availability Issue',
    'Compatibility',
    'Other',
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReplaceIcon color="info" />
          <Typography variant="h6">Replace Part - {item.item_name}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Part Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Part Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Name: ${item.item_name}`} />
              <Chip label={`Part #: ${item.part_number || 'N/A'}`} />
              <Chip label={`Stock: ${item.current_stock_level} ${item.unit_of_measure}`} />
            </Box>
          </CardContent>
        </Card>

        {/* New Part Information */}
        <Typography variant="h6" gutterBottom>
          New Part Information
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="New Part Name"
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            fullWidth
            required
            placeholder="Enter new part name"
          />
          <TextField
            label="New Part Number"
            value={newPartNumber}
            onChange={(e) => setNewPartNumber(e.target.value)}
            fullWidth
            required
            placeholder="Enter new part number"
          />
        </Box>

        <TextField
          label="New Part Description"
          value={newPartDescription}
          onChange={(e) => setNewPartDescription(e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mb: 3 }}
          placeholder="Describe the new part"
        />

        <Divider sx={{ mb: 3 }} />

        {/* Replacement Details */}
        <Typography variant="h6" gutterBottom>
          Replacement Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Replacement Category</InputLabel>
            <Select
              value={replacementCategory}
              onChange={(e) => setReplacementCategory(e.target.value)}
              label="Replacement Category"
            >
              {replacementCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Quantity to Replace"
            type="number"
            value={quantityToReplace}
            onChange={(e) => setQuantityToReplace(parseInt(e.target.value) || 0)}
            inputProps={{ min: 1, max: item.current_stock_level }}
            fullWidth
            required
          />
        </Box>

        <TextField
          label="Replacement Reason"
          value={replacementReason}
          onChange={(e) => setReplacementReason(e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mb: 2 }}
          required
          placeholder="Explain why this part needs to be replaced"
        />

        <TextField
          label="Technician Name"
          value={technician}
          onChange={(e) => setTechnician(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          required
          placeholder="Enter technician name"
          InputProps={{ readOnly: true }}
        />

        {/* Stock Handling */}
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Old Stock Handling</FormLabel>
          <RadioGroup
            row
            value={stockHandling}
            onChange={(e) => setStockHandling(e.target.value as 'transfer' | 'dispose' | 'return')}
          >
            <FormControlLabel value="transfer" control={<Radio />} label="Transfer to new part" />
            <FormControlLabel value="dispose" control={<Radio />} label="Dispose old stock" />
            <FormControlLabel value="return" control={<Radio />} label="Return to supplier" />
          </RadioGroup>
        </FormControl>

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
        <Button onClick={handleClose} disabled={replacementMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="info"
          disabled={replacementMutation.isPending}
        >
          {replacementMutation.isPending ? 'Processing...' : 'Replace Part'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartReplacementModal;
