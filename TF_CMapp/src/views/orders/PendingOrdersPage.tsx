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
  Tabs,
  Tab,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ReceiveIcon,
  CheckCircle,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingOrders,
  receiveOrderItems,
  deletePendingOrder,
  updatePendingOrderStatus,
} from '../../services/api';
import { PendingOrderStatus } from '../../types/PendingOrders';
import { notifications } from '../../services/notificationService';
import certificateService from '../../services/certificateService';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Pending Orders' }];

const PendingOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedOrderForStatusUpdate, setSelectedOrderForStatusUpdate] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<PendingOrderStatus>('ordered');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [receivingItems, setReceivingItems] = useState<{ [key: number]: number }>({});
  const [partialReasons, setPartialReasons] = useState<{ [key: number]: string }>({});

  const queryClient = useQueryClient();

  // Fetch pending orders
  const {
    data: pendingOrders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: fetchPendingOrders,
  });

  // Mutations
  const receiveItemsMutation = useMutation({
    mutationFn: receiveOrderItems,
    onSuccess: () => {
      notifications.success('Items received successfully!');
      setReceiveDialogOpen(false);
      setSelectedItems(new Set());
      setReceivingItems({});
      setPartialReasons({});
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
    onError: () => {
      notifications.error('Failed to receive items');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePendingOrder,
    onSuccess: () => {
      notifications.success('Order deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
    onError: () => {
      notifications.error('Failed to delete order');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: PendingOrderStatus;
      notes?: string;
    }) => updatePendingOrderStatus(id, status, notes),
    onSuccess: () => {
      notifications.success('Status updated successfully!');
      setStatusUpdateDialogOpen(false);
      setStatusUpdateNotes('');
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
    onError: () => {
      notifications.error('Failed to update status');
    },
  });

  // Filter orders by status and search term
  const getFilteredOrders = (status?: PendingOrderStatus) => {
    let filtered = status
      ? pendingOrders.filter((order) => order.status === status)
      : pendingOrders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  };

  const getStatusColor = (status: PendingOrderStatus) => {
    switch (status) {
      case 'requested':
        return 'default';
      case 'ordered':
        return 'info';
      case 'shipped':
        return 'warning';
      case 'partial':
        return 'secondary';
      case 'received':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: PendingOrderStatus) => {
    switch (status) {
      case 'requested':
        return <OrderIcon />;
      case 'ordered':
        return <OrderIcon />;
      case 'shipped':
        return <ShippingIcon />;
      case 'partial':
        return <ReceiveIcon />;
      case 'received':
        return <CheckCircle />;
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <OrderIcon />;
    }
  };

  const getStatusPersonAndDate = (order: any, status: PendingOrderStatus) => {
    switch (status) {
      case 'requested':
        return {
          person: order.requested_by,
          date: order.date_requested,
        };
      case 'ordered':
        return {
          person: order.ordered_by || 'N/A',
          date: order.date_ordered || 'N/A',
        };
      case 'shipped':
        return {
          person: order.shipped_by || 'N/A',
          date: order.date_shipped || 'N/A',
        };
      case 'partial':
      case 'received':
        return {
          person: order.received_by || 'N/A',
          date: order.date_received || 'N/A',
        };
      default:
        return {
          person: order.requested_by,
          date: order.date_requested,
        };
    }
  };

  const handleReceiveItems = async () => {
    // Get current user
    const currentUser = await certificateService.getCurrentUser();

    // Validate that all partial receipts have reasons
    const itemsToReceive = Array.from(selectedItems).map((id) => {
      const order = pendingOrders.find((o) => o.pending_order_id === id);
      const receivedQty = receivingItems[id] || 0;
      const isPartial = receivedQty < (order?.quantity_requested || 0);

      return {
        pending_order_id: id,
        quantity_received: receivedQty,
        isPartial,
        order,
        reason: partialReasons[id] || '',
      };
    });

    // Check if any partial receipts are missing reasons
    const partialWithoutReason = itemsToReceive.filter(
      (item) => item.isPartial && item.quantity_received > 0 && !item.reason.trim(),
    );

    if (partialWithoutReason.length > 0) {
      notifications.error('Please provide a reason for all partial receipts');
      return;
    }

    // Prepare the mutation data
    const mutationData = {
      pending_order_ids: Array.from(selectedItems),
      items: itemsToReceive.map((item) => ({
        pending_order_id: item.pending_order_id,
        quantity_received: item.quantity_received,
        notes: item.isPartial ? `Partial receipt: ${item.reason}` : 'Full receipt',
      })),
      received_by: currentUser.displayName || 'Unknown User',
    };

    receiveItemsMutation.mutate(mutationData);
  };

  const toggleItemSelection = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleStatusUpdate = async (order: any, newStatusValue: PendingOrderStatus) => {
    // Get current user
    const currentUser = await certificateService.getCurrentUser();

    setSelectedOrderForStatusUpdate(order);
    setNewStatus(newStatusValue);
    setStatusUpdateDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedOrderForStatusUpdate) return;

    // Get current user
    const currentUser = await certificateService.getCurrentUser();

    // First update the status via API
    const updatedOrder = await updatePendingOrderStatus(
      selectedOrderForStatusUpdate.pending_order_id,
      newStatus,
      statusUpdateNotes,
    );

    // Then update localStorage with the correct user information
    const orders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    const updatedOrders = orders.map((order: any) => {
      if (order.pending_order_id === selectedOrderForStatusUpdate.pending_order_id) {
        const updated = { ...order, ...updatedOrder };

        // Set the correct user based on status
        if (newStatus === 'ordered') {
          updated.ordered_by = currentUser.displayName || 'Unknown User';
        } else if (newStatus === 'shipped') {
          updated.shipped_by = currentUser.displayName || 'Unknown User';
        }

        return updated;
      }
      return order;
    });

    localStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));

    // Close dialog and refresh data
    setStatusUpdateDialogOpen(false);
    setStatusUpdateNotes('');
    queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    notifications.success('Status updated successfully!');
  };

  const tabs = [
    { label: 'All Orders', value: undefined },
    { label: 'Requested', value: 'requested' as PendingOrderStatus },
    { label: 'Ordered', value: 'ordered' as PendingOrderStatus },
    { label: 'Shipped', value: 'shipped' as PendingOrderStatus },
    { label: 'Partial', value: 'partial' as PendingOrderStatus },
    { label: 'Received', value: 'received' as PendingOrderStatus },
  ];

  const currentTabOrders = getFilteredOrders(tabs[selectedTab].value);

  if (error) {
    return (
      <PageContainer title="Pending Orders" description="Manage pending inventory orders">
        <Breadcrumb title="Pending Orders" items={BCrumb} />
        <Alert severity="error">Failed to load pending orders. Please try again.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Pending Orders" description="Manage pending inventory orders">
      <Breadcrumb title="Pending Orders" items={BCrumb} />

      <Card>
        <CardContent>
          {/* Header */}
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Pending Orders</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
                disabled={isLoading}
              >
                Refresh
              </Button>
              {selectedItems.size > 0 && (
                <Button
                  variant="contained"
                  startIcon={<ReceiveIcon />}
                  onClick={() => setReceiveDialogOpen(true)}
                  color="success"
                >
                  Receive {selectedItems.size} Items
                </Button>
              )}
            </Box>
          </Box>

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search orders by item name, part number, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ mb: 2 }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={`${tab.label} (${getFilteredOrders(tab.value).length})`} />
            ))}
          </Tabs>

          {/* Loading */}
          {isLoading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Orders Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        selectedItems.size === currentTabOrders.length &&
                        currentTabOrders.length > 0
                      }
                      indeterminate={
                        selectedItems.size > 0 && selectedItems.size < currentTabOrders.length
                      }
                      onChange={() => {
                        if (selectedItems.size === currentTabOrders.length) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(
                            new Set(currentTabOrders.map((order) => order.pending_order_id)),
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Qty Requested</TableCell>
                  <TableCell>Qty Received</TableCell>
                  <TableCell>Est. Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Person / Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTabOrders.map((order) => (
                  <TableRow key={order.pending_order_id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.has(order.pending_order_id)}
                        onChange={() => toggleItemSelection(order.pending_order_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {order.item_name}
                        </Typography>
                        {order.part_number && (
                          <Typography variant="caption" color="text.secondary">
                            {order.part_number}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{order.supplier || 'N/A'}</TableCell>
                    <TableCell>
                      {order.quantity_requested} {order.unit_of_measure}
                    </TableCell>
                    <TableCell>
                      {order.quantity_received} {order.unit_of_measure}
                    </TableCell>
                    <TableCell>
                      {order.estimated_cost ? `$${order.estimated_cost.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusInfo = getStatusPersonAndDate(order, order.status);
                        return (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {statusInfo.person}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {statusInfo.date instanceof Date
                                ? statusInfo.date.toLocaleDateString()
                                : typeof statusInfo.date === 'string' && statusInfo.date !== 'N/A'
                                ? new Date(statusInfo.date).toLocaleDateString()
                                : statusInfo.date}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {order.status === 'requested' && (
                          <Tooltip title="Mark as Ordered">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleStatusUpdate(order, 'ordered')}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'ordered' && (
                          <Tooltip title="Mark as Shipped">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleStatusUpdate(order, 'shipped')}
                            >
                              <ShippingIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Order">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteMutation.mutate(order.pending_order_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {currentTabOrders.length === 0 && !isLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No pending orders found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Receive Items Dialog */}
      <Dialog
        open={receiveDialogOpen}
        onClose={() => setReceiveDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Receive Items</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the quantity received for each selected item:
          </Typography>
          {Array.from(selectedItems).map((id) => {
            const order = pendingOrders.find((o) => o.pending_order_id === id);
            if (!order) return null;

            const receivedQty = receivingItems[id] || 0;
            const isPartial = receivedQty > 0 && receivedQty < order.quantity_requested;

            return (
              <Box
                key={id}
                sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Typography variant="subtitle2">{order.item_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Requested: {order.quantity_requested} {order.unit_of_measure}
                </Typography>
                <TextField
                  label="Quantity Received"
                  type="number"
                  value={receivingItems[id] || ''}
                  onChange={(e) =>
                    setReceivingItems((prev) => ({
                      ...prev,
                      [id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  inputProps={{ min: 0, max: order.quantity_requested }}
                  sx={{ mt: 1, mr: 1 }}
                  size="small"
                />

                {isPartial && (
                  <TextField
                    label="Reason for Partial Receipt"
                    multiline
                    rows={2}
                    value={partialReasons[id] || ''}
                    onChange={(e) =>
                      setPartialReasons((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                    placeholder="e.g., Supplier delay, damaged items, backordered..."
                    sx={{ mt: 1, width: '100%' }}
                    size="small"
                    required
                    error={receivedQty > 0 && !partialReasons[id]?.trim()}
                    helperText={
                      receivedQty > 0 && !partialReasons[id]?.trim()
                        ? 'Reason required for partial receipts'
                        : ''
                    }
                  />
                )}

                {isPartial && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    ⚠️ Partial receipt: Item will remain in pending orders
                  </Typography>
                )}
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setReceiveDialogOpen(false);
              setReceivingItems({});
              setPartialReasons({});
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReceiveItems}
            variant="contained"
            disabled={receiveItemsMutation.isPending}
          >
            Receive Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onClose={() => setStatusUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          {selectedOrderForStatusUpdate && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{selectedOrderForStatusUpdate.item_name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current Status:{' '}
                {selectedOrderForStatusUpdate.status.charAt(0).toUpperCase() +
                  selectedOrderForStatusUpdate.status.slice(1)}
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PendingOrderStatus)}
                  label="New Status"
                >
                  <MenuItem value="requested">Requested</MenuItem>
                  <MenuItem value="ordered">Ordered</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
                placeholder="Add any relevant notes about this status change..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmStatusUpdate}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PendingOrdersPage;
