import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchInventoryTransactions } from '../../../services/api';
import { InventoryItem, InventoryTransaction } from '../../../types/Inventory';

interface TransactionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  open,
  onClose,
  item,
}) => {
  const {
    data: transactionData,
    isLoading,
    error,
  } = useQuery<InventoryTransaction[]>({
    queryKey: ['inventory-transactions', item.inventory_item_id],
    queryFn: () => fetchInventoryTransactions(item.inventory_item_id.toString()),
    enabled: open,
  });

  // Handle different response formats and ensure transactions is always an array
  const transactions = React.useMemo(() => {
    if (!transactionData) return [];

    // If the response is already an array
    if (Array.isArray(transactionData)) {
      return transactionData;
    }

    // If the response has a data property with an array
    if (transactionData && typeof transactionData === 'object' && 'data' in transactionData) {
      const dataArray = (transactionData as any).data;
      return Array.isArray(dataArray) ? dataArray : [];
    }

    // Default to empty array if format is unexpected
    return [];
  }, [transactionData]);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'warning';
      case 'adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Stock In';
      case 'out':
        return 'Stock Out';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatRelatedEntity = (transaction: InventoryTransaction) => {
    if (!transaction.related_entity_id) return '-';

    // If transaction is from project consumption, show project info
    if (
      transaction.transaction_type === 'out' &&
      transaction.related_entity_id.startsWith('PRJ-')
    ) {
      return `Project: ${transaction.related_entity_id}`;
    }

    // If transaction has notes that indicate step consumption
    if (transaction.notes?.includes('step')) {
      return `${transaction.related_entity_id} (${transaction.notes})`;
    }

    return transaction.related_entity_id;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="info" />
          <Typography variant="h6">Transaction History - {item.item_name}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load transaction history. Please try again.
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quantity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Notes</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Related Entity</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No transaction history found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id} hover>
                      <TableCell>
                        {transaction.transaction_date
                          ? formatDate(transaction.transaction_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeLabel(transaction.transaction_type)}
                          color={getTransactionTypeColor(transaction.transaction_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={transaction.quantity > 0 ? 'success.main' : 'error.main'}
                        >
                          {transaction.quantity > 0 ? '+' : ''}
                          {transaction.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.notes || '-'}</TableCell>
                      <TableCell>{formatRelatedEntity(transaction)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionHistoryModal;
