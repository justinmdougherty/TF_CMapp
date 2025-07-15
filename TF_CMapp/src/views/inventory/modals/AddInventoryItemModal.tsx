import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Divider,
  Typography,
  Alert,
} from '@mui/material';
import { Add as AddIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAddInventoryItem } from '../../../hooks/api/useInventoryHooks';
import { useCartStore } from 'src/store/cartStore';
import UrlScrapingComponent from '../../../components/shared/UrlScrapingComponent';
import { ScrapedItemData } from '../../../services/vendorScrapingService';

interface AddInventoryItemModalProps {
  open: boolean;
  onClose: () => void;
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
  estimated_cost: yup.number().positive('Cost must be positive').nullable(),
  supplier: yup.string(),
  source_url: yup.string().url('Must be a valid URL'),
});

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ open, onClose }) => {
  const addInventoryItemMutation = useAddInventoryItem();
  const { addItem, openCart } = useCartStore();
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      item_name: '',
      part_number: '',
      description: '',
      current_stock_level: 0,
      unit_of_measure: '',
      reorder_point: 0,
      estimated_cost: 0,
      supplier: '',
      source_url: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      addInventoryItemMutation.mutate(values, {
        onSuccess: () => {
          onClose();
          formik.resetForm();
        },
      });
    },
  });

  const handleAddToCart = () => {
    // Add validation check
    if (!formik.values.item_name || !formik.values.part_number || !formik.values.unit_of_measure) {
      formik.setTouched({
        item_name: true,
        part_number: true,
        unit_of_measure: true,
      });
      return;
    }

    addItem({
      type: 'new',
      item_name: formik.values.item_name,
      part_number: formik.values.part_number,
      description: formik.values.description || '',
      unit_of_measure: formik.values.unit_of_measure,
      quantity: formik.values.current_stock_level,
      estimated_cost: formik.values.estimated_cost || 0,
      supplier: formik.values.supplier || '',
      notes: 'New inventory item to be added',
    });

    setShowCartSuccess(true);
    setTimeout(() => setShowCartSuccess(false), 3000);

    // Reset form and close modal
    formik.resetForm();
    onClose();

    // Open cart to show the added item
    openCart();
  };

  const handleScrapedData = (data: ScrapedItemData) => {
    if (data.success) {
      // Auto-populate form fields with scraped data
      formik.setValues({
        item_name: data.item_name || '',
        part_number: data.part_number || '',
        description: data.description || '',
        current_stock_level: formik.values.current_stock_level, // Keep existing value
        unit_of_measure: data.unit_of_measure || 'pcs',
        reorder_point: formik.values.reorder_point, // Keep existing value
        estimated_cost: data.estimated_cost || 0,
        supplier: data.supplier || '',
        source_url: data.source_url || '',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6">Add New Inventory Item</Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {showCartSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowCartSuccess(false)}>
              Item added to cart successfully!
            </Alert>
          )}

          {/* URL Scraping Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Auto-fill from Product URL
            </Typography>
            <UrlScrapingComponent
              onDataScraped={handleScrapedData}
              placeholder="Paste a product URL from Digi-Key, McMaster-Carr, Mouser, etc."
            />
          </Box>

          <Divider sx={{ my: 2 }} />

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
                formik.touched.current_stock_level && Boolean(formik.errors.current_stock_level)
              }
              helperText={formik.touched.current_stock_level && formik.errors.current_stock_level}
            />
            <TextField
              fullWidth
              id="unit_of_measure"
              name="unit_of_measure"
              label="Unit of Measure"
              value={formik.values.unit_of_measure}
              onChange={formik.handleChange}
              error={formik.touched.unit_of_measure && Boolean(formik.errors.unit_of_measure)}
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

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Additional Information (Optional)
            </Typography>

            <TextField
              fullWidth
              id="estimated_cost"
              name="estimated_cost"
              label="Estimated Cost per Unit"
              type="number"
              value={formik.values.estimated_cost}
              onChange={formik.handleChange}
              error={formik.touched.estimated_cost && Boolean(formik.errors.estimated_cost)}
              helperText={formik.touched.estimated_cost && formik.errors.estimated_cost}
              InputProps={{
                startAdornment: <Typography variant="body2">$</Typography>,
              }}
            />
            <TextField
              fullWidth
              id="supplier"
              name="supplier"
              label="Supplier/Manufacturer"
              value={formik.values.supplier}
              onChange={formik.handleChange}
              placeholder="e.g., Digi-Key, McMaster-Carr, Mouser"
            />
            <TextField
              fullWidth
              id="source_url"
              name="source_url"
              label="Source URL"
              value={formik.values.source_url}
              onChange={formik.handleChange}
              error={formik.touched.source_url && Boolean(formik.errors.source_url)}
              helperText={formik.touched.source_url && formik.errors.source_url}
              placeholder="https://example.com/product-page"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAddToCart}
            variant="outlined"
            startIcon={<CartIcon />}
            sx={{ mr: 1 }}
          >
            Add to Cart
          </Button>
          <Button color="primary" variant="contained" type="submit">
            Add Item
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddInventoryItemModal;
