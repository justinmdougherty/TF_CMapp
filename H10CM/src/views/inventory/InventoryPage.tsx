import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as PlusIcon,
  Remove as MinusIcon,
  SwapHoriz as ReplaceIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ShoppingCart as ReorderIcon,
  PlaylistAdd as BulkIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useGetAllInventory, useDeleteInventoryItem } from 'src/hooks/api/useInventoryHooks';
import { InventoryItem } from 'src/types/Inventory';
// Import modals - let IDE autocomplete suggest the correct paths
import AddInventoryModal from './modals/AddInventoryItemModal';
import EditInventoryModal from './modals/EditInventoryItemModal';
import InventoryAdjustmentModal from './modals/InventoryAdjustmentModal';
import BulkAdjustmentModal from './modals/BulkAdjustmentModal';
import PartReplacementModal from './modals/PartReplacementModal';
import TransactionHistoryModal from './modals/TransactionHistoryModal';
import InventoryStatsCards from './components/InventoryStatsCards';
import { useCartStore, cartHelpers } from 'src/store/cartStore';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Inventory' }];

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [bulkAdjustmentModalOpen, setBulkAdjustmentModalOpen] = useState(false);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [transactionHistoryModalOpen, setTransactionHistoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  const { data, isLoading, error, refetch } = useGetAllInventory();
  // API returns { data: [...] }
  const inventoryItems = Array.isArray(data?.data) ? data.data : [];
  const deleteInventoryMutation = useDeleteInventoryItem();
  const { addItem, openCart } = useCartStore();

  // Filter inventory items based on search term
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.item_name}"?`)) {
      try {
        await deleteInventoryMutation.mutateAsync(item.inventory_item_id);
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const handleAdjustment = (item: InventoryItem, type: 'add' | 'subtract') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setAdjustmentModalOpen(true);
  };

  const handleReplacement = (item: InventoryItem) => {
    setSelectedItem(item);
    setReplacementModalOpen(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransactionHistoryModalOpen(true);
  };

  const handleReorderToCart = (item: InventoryItem) => {
    // Check if item is already in cart
    if (cartHelpers.isItemInCart(item.inventory_item_id)) {
      // If already in cart, just open the cart
      openCart();
      return;
    }

    // Calculate suggested reorder quantity
    const reorderPoint = item.reorder_point || 5;
    const currentStock = item.current_stock_level;
    const suggestedQuantity = Math.max(reorderPoint * 2 - currentStock, reorderPoint);

    addItem({
      type: 'reorder',
      inventory_item_id: item.inventory_item_id,
      item_name: item.item_name,
      part_number: item.part_number || '',
      description: item.description || '',
      unit_of_measure: item.unit_of_measure,
      quantity: suggestedQuantity,
      estimated_cost: 10, // Default estimated cost
      current_stock_level: item.current_stock_level,
      reorder_point: item.reorder_point,
      notes: `Reorder for ${item.item_name} - Current stock: ${currentStock}, Reorder point: ${reorderPoint}`,
    });

    // Open cart to show the added item
    openCart();
  };

  const getStockLevelColor = (currentStock: number, minStock: number) => {
    if (currentStock <= 0) return 'error';
    if (currentStock <= minStock) return 'warning';
    if (currentStock <= minStock * 2) return 'info';
    return 'success';
  };

  const getStockLevelProgress = (currentStock: number, minStock: number) => {
    const maxStock = minStock * 3; // Assume max stock is 3x min stock for progress calculation
    return Math.min((currentStock / maxStock) * 100, 100);
  };

  const handleCloseModals = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setAdjustmentModalOpen(false);
    setReplacementModalOpen(false);
    setTransactionHistoryModalOpen(false);
    setSelectedItem(null);
  };

  const handleSuccess = () => {
    handleCloseModals();
    refetch(); // Refresh the inventory list
  };

  // Only show error if it's a real error AND we don't have any data
  if (error && !inventoryItems.length && !isLoading) {
    return (
      <PageContainer title="Inventory" description="Inventory Management Page">
        <Breadcrumb title="Inventory" items={BCrumb} />
        <Alert severity="error">
          Failed to load inventory items: {error.message || 'An unknown error occurred'}. Please try
          again.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inventory" description="Inventory Management Page">
      <Breadcrumb title="Inventory" items={BCrumb} />

      {/* Statistics Cards */}
      <InventoryStatsCards inventoryItems={inventoryItems} isLoading={isLoading} />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Inventory Management</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<BulkIcon />}
              onClick={() => setBulkAdjustmentModalOpen(true)}
            >
              Bulk Adjustments
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" gutterBottom>
                Loading inventory items...
              </Typography>
              <LinearProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Item Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Part Number</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Description</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Current Stock</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Min Stock</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Unit</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Stock Level</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {searchTerm ? 'No items match your search' : 'No inventory items found'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {searchTerm
                              ? 'Try adjusting your search terms'
                              : 'Start by adding your first inventory item'}
                          </Typography>
                          {!searchTerm && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => setAddModalOpen(true)}
                              size="small"
                            >
                              Add First Item
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.inventory_item_id} hover>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.part_number || '-'}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.current_stock_level}
                            color={getStockLevelColor(
                              item.current_stock_level,
                              item.reorder_point || 0,
                            )}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.reorder_point || '-'}</TableCell>
                        <TableCell>{item.unit_of_measure}</TableCell>
                        <TableCell sx={{ width: 150 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={getStockLevelProgress(
                                item.current_stock_level,
                                item.reorder_point || 0,
                              )}
                              color={getStockLevelColor(
                                item.current_stock_level,
                                item.reorder_point || 0,
                              )}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(
                                getStockLevelProgress(
                                  item.current_stock_level,
                                  item.reorder_point || 0,
                                ),
                              )}
                              %
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Add to Reorder Cart">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleReorderToCart(item)}
                                sx={{
                                  backgroundColor: cartHelpers.isItemInCart(item.inventory_item_id)
                                    ? 'primary.light'
                                    : 'transparent',
                                }}
                              >
                                <ReorderIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Stock">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAdjustment(item, 'add')}
                              >
                                <PlusIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Stock">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleAdjustment(item, 'subtract')}
                              >
                                <MinusIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewHistory(item)}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Replace Part">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleReplacement(item)}
                              >
                                <ReplaceIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(item)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(item)}
                                disabled={deleteInventoryMutation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddInventoryModal open={addModalOpen} onClose={handleCloseModals} />

      <BulkAdjustmentModal
        open={bulkAdjustmentModalOpen}
        onClose={() => setBulkAdjustmentModalOpen(false)}
      />

      {selectedItem && (
        <>
          <EditInventoryModal
            open={editModalOpen}
            onClose={handleCloseModals}
            item={selectedItem}
          />

          <InventoryAdjustmentModal
            open={adjustmentModalOpen}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
            item={selectedItem}
            adjustmentType={adjustmentType}
          />

          <PartReplacementModal
            open={replacementModalOpen}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
            item={selectedItem}
          />

          <BulkAdjustmentModal
            open={bulkAdjustmentModalOpen}
            onClose={() => setBulkAdjustmentModalOpen(false)}
          />

          <TransactionHistoryModal
            open={transactionHistoryModalOpen}
            onClose={handleCloseModals}
            item={selectedItem}
          />
        </>
      )}
    </PageContainer>
  );
};

export default InventoryPage;
