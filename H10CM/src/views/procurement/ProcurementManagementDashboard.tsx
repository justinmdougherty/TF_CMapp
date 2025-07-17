import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  AccountBalance as FundIcon,
  Assignment as TaskIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  Assessment as ReportIcon,
  Business as VendorIcon,
  Refresh as RefreshIcon,
  SwapHoriz as CrossPaymentIcon,
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useRBAC } from '../../context/RBACContext';
import FundingDocumentManagement from '../../components/procurement/FundingDocumentManagement';
import {
  useSponsorFunds,
  useTaskFundAllocations,
  useProcurementOrders,
  useNotifications,
  useExpiringDocuments,
} from '../../hooks/api/useProcurementHooks';

// Placeholder components
const FundManagementTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Fund Management
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Manage sponsor funds and track fund allocations
    </Typography>
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        <strong>Database Ready:</strong> The procurement funding system has been added to the
        database with comprehensive tables for:
      </Typography>
      <ul style={{ textAlign: 'left', marginTop: 8 }}>
        <li>
          <strong>Sponsors:</strong> Organizations providing funding
        </li>
        <li>
          <strong>SponsorFunds:</strong> Specific funding sources with expiration tracking
        </li>
        <li>
          <strong>FundingDocuments:</strong> Contracts and agreements
        </li>
        <li>
          <strong>TaskFundAllocations:</strong> Allocate funds to specific tasks
        </li>
        <li>
          <strong>OrderFundAllocations:</strong> Allocate funds to procurement orders
        </li>
        <li>
          <strong>Cross-payment tracking:</strong> Cross-sponsor payment management
        </li>
      </ul>
    </Alert>
    <Typography variant="body2" color="text.secondary">
      API endpoints are configured and ready for implementation.
    </Typography>
  </Box>
);

const TaskAllocationTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Task Allocation
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Allocate funds to specific tasks and track cross-sponsor payments
    </Typography>
  </Box>
);

const OrderProcessingTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Order Processing
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Process procurement orders and manage fund assignments
    </Typography>
  </Box>
);

const ReceivingTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Receiving
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Track received orders and notify requestors
    </Typography>
  </Box>
);

const AuditReportingTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Audit & Reporting
    </Typography>
    <Typography variant="body2" color="text.secondary">
      View audit trails and generate procurement reports
    </Typography>
  </Box>
);

const VendorManagementTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Vendor Management
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Manage vendor information and requirements
    </Typography>
  </Box>
);

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Procurement Management' }];

const ProcurementManagementDashboard: React.FC = () => {
  const { currentUser, hasRole } = useRBAC();
  const [activeTab, setActiveTab] = useState(0);

  // Check access permissions - Admin, ProjectManager, and Technicians with procurement access
  const hasAccess = hasRole('Admin') || hasRole('ProjectManager') || hasRole('Technician');

  // Data hooks
  const { data: sponsorFunds, isLoading: fundsLoading, refetch: refetchFunds } = useSponsorFunds();
  const { data: taskAllocations, isLoading: allocationsLoading } = useTaskFundAllocations();
  const { data: procurementOrders, isLoading: ordersLoading } = useProcurementOrders();
  const { data: notifications } = useNotifications(parseInt(currentUser?.user_id || '0'));
  const { data: expiringDocuments = [] } = useExpiringDocuments(30);

  const isLoading = fundsLoading || allocationsLoading || ordersLoading;

  // Access control
  if (!hasAccess) {
    return (
      <PageContainer title="Procurement Management" description="Access denied">
        <Breadcrumb title="Procurement Management" items={BCrumb} />
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have permission to access the Procurement Management system. Access is
          restricted to Admin, Procurement Manager, and Project Manager roles.
        </Alert>
      </PageContainer>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refetchFunds();
  };

  // Calculate dashboard statistics
  const activeFunds = sponsorFunds?.filter((f) => f.status === 'Active').length || 0;
  const expiringFunds =
    sponsorFunds?.filter((f) => {
      if (!f.expiration_date) return false;
      const expiryDate = new Date(f.expiration_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && f.status === 'Active';
    }).length || 0;

  const totalAllocations = taskAllocations?.length || 0;
  const crossPaymentAllocations = taskAllocations?.filter((a) => a.is_cross_payment).length || 0;

  const activeOrders =
    procurementOrders?.filter((o) => ['Pending', 'Ordered', 'Shipped'].includes(o.status)).length ||
    0;

  const unreadNotifications = notifications?.filter((n) => !n.read_date).length || 0;

  if (isLoading) {
    return (
      <PageContainer title="Procurement Management" description="Loading procurement data...">
        <Breadcrumb title="Procurement Management" items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Procurement Management"
      description="Sponsor fund management and procurement tracking"
    >
      <Breadcrumb title="Procurement Management" items={BCrumb} />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Procurement Management
          </Typography>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              Welcome back, {currentUser.full_name} ({currentUser.role})
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {unreadNotifications > 0 && (
            <Tooltip title={`${unreadNotifications} unread notifications`}>
              <IconButton color="primary">
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Key Metrics Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <FundIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  {activeFunds}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Funds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <TaskIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" gutterBottom>
                  {totalAllocations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Task Allocations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <OrderIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {activeOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CrossPaymentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {crossPaymentAllocations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cross-Payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alerts */}
        {expiringFunds > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {expiringFunds} fund(s) expiring within 30 days. Review fund management tab.
            </Typography>
          </Alert>
        )}

        {expiringDocuments.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {expiringDocuments.length} funding document(s) expiring within 30 days. Review
              documents immediately to ensure compliance.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="procurement management tabs"
          >
            <Tab label="Fund Management" icon={<FundIcon />} iconPosition="start" />
            <Tab label="Task Allocation" icon={<TaskIcon />} iconPosition="start" />
            <Tab label="Order Processing" icon={<OrderIcon />} iconPosition="start" />
            <Tab label="Receiving" icon={<ShippingIcon />} iconPosition="start" />
            <Tab label="Audit & Reports" icon={<ReportIcon />} iconPosition="start" />
            <Tab label="Vendor Management" icon={<VendorIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <FundingDocumentManagement />}
          {activeTab === 1 && <TaskAllocationTabPlaceholder />}
          {activeTab === 2 && <OrderProcessingTabPlaceholder />}
          {activeTab === 3 && <ReceivingTabPlaceholder />}
          {activeTab === 4 && <AuditReportingTabPlaceholder />}
          {activeTab === 5 && <VendorManagementTabPlaceholder />}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default ProcurementManagementDashboard;
