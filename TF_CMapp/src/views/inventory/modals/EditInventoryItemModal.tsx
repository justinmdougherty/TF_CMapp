import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useUpdateInventoryItem } from '../../../hooks/api/useInventoryHooks';
import { InventoryItem } from '../../../types/Inventory';

interface EditInventoryItemModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const validationSchema = yup.object({
  item_name: yup.string().required('Name is required'),
  part_number: yup.string().required('Part number is required'),
  description: yup.string(),
  current_stock_level: yup
    .number()
    .required('Stock level is required')
    .positive('Stock must be positive')
    .integer('Stock must be an integer'),
  unit_of_measure: yup.string().required('Unit of measure is required'),
  reorder_point: yup
    .number()
    .positive('Reorder point must be positive')
    .integer('Reorder point must be an integer'),
});

const EditInventoryItemModal: React.FC<EditInventoryItemModalProps> = ({ open, onClose, item }) => {
  const updateInventoryItemMutation = useUpdateInventoryItem();

  const formik = useFormik({
    initialValues: {
      item_name: item?.item_name || '',
      part_number: item?.part_number || '',
      description: item?.description || '',
      current_stock_level: item?.current_stock_level || 0,
      unit_of_measure: item?.unit_of_measure || '',
      reorder_point: item?.reorder_point || 0,
    },
    enableReinitialize: true,
    validationSchema: validationSchema,
    onSubmit: (values) => {
      if (item) {
        updateInventoryItemMutation.mutate(
          { ...item, ...values },
          {
            onSuccess: () => {
              onClose();
            },
          },
        );
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Inventory Item</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: '1rem' }}>
            <TextField
              fullWidth
              id="item_name"
              name="item_name"
              label="Item Name"
              value={formik.values.item_name}
              onChange={formik.handleChange}
              error={formik.touched.item_name && Boolean(formik.errors.item_name)}
              helperText={formik.touched.item_name && formik.errors.item_name}
            />
            <TextField
              fullWidth
              id="part_number"
              name="part_number"
              label="Part Number"
              value={formik.values.part_number}
              onChange={formik.handleChange}
              error={formik.touched.part_number && Boolean(formik.errors.part_number)}
              helperText={formik.touched.part_number && formik.errors.part_number}
            />
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
            />
            <TextField
              fullWidth
              id="current_stock_level"
              name="current_stock_level"
              label="Current Stock Level"
              type="number"
              value={formik.values.current_stock_level}
              onChange={formik.handleChange}
              error={
                formik.touched.current_stock_level &&
                Boolean(formik.errors.current_stock_level)
              }
              helperText={
                formik.touched.current_stock_level && formik.errors.current_stock_level
              }
            />
            <TextField
              fullWidth
              id="unit_of_measure"
              name="unit_of_measure"
              label="Unit of Measure"
              value={formik.values.unit_of_measure}
              onChange={formik.handleChange}
              error={
                formik.touched.unit_of_measure && Boolean(formik.errors.unit_of_measure)
              }
              helperText={formik.touched.unit_of_measure && formik.errors.unit_of_measure}
            />
            <TextField
              fullWidth
              id="reorder_point"
              name="reorder_point"
              label="Reorder Point"
              type="number"
              value={formik.values.reorder_point}
              onChange={formik.handleChange}
              error={formik.touched.reorder_point && Boolean(formik.errors.reorder_point)}
              helperText={formik.touched.reorder_point && formik.errors.reorder_point}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button color="primary" variant="contained" type="submit">
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInventoryItemModal;
