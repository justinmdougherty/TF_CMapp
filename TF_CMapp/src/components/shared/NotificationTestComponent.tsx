import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Alert,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  Factory as ProductionIcon,
  Person as UserIcon,
  Settings as SystemIcon,
  AccessTime as DeadlineIcon,
  Approval as ApprovalIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { notifications, projectNotifications } from '../../services/notificationService';
import smartNotifications from 'src/services/smartNotificationService';
import { NotificationSummary } from 'src/types/Notifications';

const NotificationTestComponent: React.FC = () => {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshSummary();

    // Subscribe to notification updates
    const unsubscribe = smartNotifications.subscribe(() => {
      refreshSummary();
    });

    // Start periodic cleanup
    smartNotifications.startPeriodicCleanup();

    return unsubscribe;
  }, []);

  const refreshSummary = () => {
    setSummary(smartNotifications.getSummary());
  };

  // Original toast notification tests
  const handleTestSuccess = () => {
    notifications.success('Success! The notification system is working perfectly!');
  };

  const handleTestError = () => {
    notifications.error('Error notification test - this shows how errors will appear');
  };

  const handleTestWarning = () => {
    notifications.warning('Warning! Low stock detected for Test Part (5 remaining)');
  };

  const handleTestInfo = () => {
    notifications.info('Info: Project status has been updated to Active');
  };

  const handleTestProjectCreated = () => {
    projectNotifications.projectCreated('Test Project Alpha');
  };

  const handleTestStatusUpdate = () => {
    projectNotifications.statusUpdated('Manufacturing Unit Beta', 'Active');
  };

  const handleTestLowStock = () => {
    projectNotifications.inventoryLowStock('Resistor 10K Ohm', 3, 10);
  };

  const handleTestStepCompleted = () => {
    projectNotifications.stepCompleted('Project Gamma', 'Assembly Complete', 5);
  };

  // Smart notification tests
  const createTestNotifications = async () => {
    setIsLoading(true);

    try {
      // Inventory low stock alert
      await smartNotifications.createNotification({
        type: 'warning',
        category: 'inventory',
        title: 'Low Stock Alert',
        message: 'RK73Z1HTTC 10kΩ resistor is running low (3 pieces remaining)',
        actionRequired: true,
        relatedEntityType: 'inventory',
        relatedEntityId: 123,
        actionUrl: '/inventory/123',
        actionLabel: 'Reorder Now',
        metadata: { currentStock: 3, reorderPoint: 10 },
        icon: '📦',
      });

      // Order status update
      await smartNotifications.createNotification({
        type: 'info',
        category: 'orders',
        title: 'Order Shipped',
        message: 'Your order for capacitors (50 pieces) has been shipped',
        relatedEntityType: 'order',
        relatedEntityId: 456,
        actionUrl: '/orders/pending',
        actionLabel: 'Track Order',
        icon: '🚚',
      });

      // Production milestone
      await smartNotifications.createNotification({
        type: 'success',
        category: 'production',
        title: 'Production Milestone',
        message: 'Unit PR-2024-001 completed soldering step',
        relatedEntityType: 'production',
        relatedEntityId: 789,
        actionUrl: '/projects/1',
        actionLabel: 'View Progress',
        icon: '🏭',
      });

      // Critical system alert
      await smartNotifications.createNotification({
        type: 'critical',
        category: 'system',
        title: 'Database Connection Issue',
        message: 'Intermittent connection issues detected with inventory database',
        actionRequired: true,
        metadata: { errorCount: 5, lastError: new Date() },
        icon: '⚠️',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllNotifications = () => {
    smartNotifications.clearAllNotifications();
  };

  const categoryIcons = {
    inventory: <InventoryIcon />,
    orders: <OrderIcon />,
    production: <ProductionIcon />,
    quality: <ProductionIcon />,
    system: <SystemIcon />,
    user: <UserIcon />,
    deadlines: <DeadlineIcon />,
    approvals: <ApprovalIcon />,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      {/* Original Toast Notifications */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          🎉 Toast Notifications (React Hot Toast)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These are temporary popup notifications that appear and disappear automatically
        </Typography>

        <Stack spacing={2}>
          <Typography variant="subtitle2">Basic Notifications:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Button variant="contained" color="success" onClick={handleTestSuccess} size="small">
              Success
            </Button>
            <Button variant="contained" color="error" onClick={handleTestError} size="small">
              Error
            </Button>
            <Button variant="contained" color="warning" onClick={handleTestWarning} size="small">
              Warning
            </Button>
            <Button variant="contained" color="info" onClick={handleTestInfo} size="small">
              Info
            </Button>
          </Stack>

          <Typography variant="subtitle2">Project-Specific Notifications:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Button variant="outlined" onClick={handleTestProjectCreated} size="small">
              Project Created
            </Button>
            <Button variant="outlined" onClick={handleTestStatusUpdate} size="small">
              Status Updated
            </Button>
            <Button variant="outlined" onClick={handleTestLowStock} size="small">
              Low Stock Alert
            </Button>
            <Button variant="outlined" onClick={handleTestStepCompleted} size="small">
              Step Completed
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Smart Notification System */}
      <Card>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h6" color="primary">
              📧 Smart Notifications System
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={refreshSummary} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            This is the new smart notifications system that tracks manufacturing events, stores
            notifications persistently, and provides actionable alerts. Check the bell icon in the
            header!
          </Alert>

          {summary && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="primary">
                      {summary.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="warning.main">
                      {summary.unread}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unread
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="error.main">
                      {summary.critical}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Critical
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="h6" color="info.main">
                      {summary.actionRequired}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Action Required
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {summary && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                By Category:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {Object.entries(summary.byCategory).map(([category, count]) => (
                  <Chip
                    key={category}
                    icon={categoryIcons[category as keyof typeof categoryIcons]}
                    label={`${category}: ${count}`}
                    variant={count > 0 ? 'filled' : 'outlined'}
                    color={count > 0 ? 'primary' : 'default'}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
            <Button
              variant="contained"
              onClick={createTestNotifications}
              disabled={isLoading}
              size="small"
            >
              Create Smart Notifications
            </Button>
            <Button variant="outlined" color="error" onClick={clearAllNotifications} size="small">
              Clear All
            </Button>
          </Stack>

          <Alert severity="success" sx={{ mt: 2 }}>
            ✅ Smart notifications are integrated with your manufacturing workflow!
            <br />• Automatic low stock alerts
            <br />• Order status updates
            <br />• Production milestone tracking
            <br />• Deadline reminders
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationTestComponent;
