import React, { useState, useEffect } from 'react';
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
  Button,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useRBAC } from '../../context/RBACContext';
import FundingDocumentManagement from '../../components/procurement/FundingDocumentManagement';
import {
  fetchSponsors,
  fetchSponsorFunds,
  getFundUsageSummary,
  getExpiringDocuments,
} from '../../services/procurementApi';
import type { Sponsor, SponsorFund, FundUsageSummary } from '../../types/ProcurementTypes';

// Fund Summary Card Component
const FundSummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: 'up' | 'down' | 'stable';
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: `${color}.light`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`,
          }}
        >
          <Icon fontSize="large" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              {trend === 'up' && <TrendingUpIcon fontSize="small" color="success" />}
              {trend === 'down' && <TrendingDownIcon fontSize="small" color="error" />}
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Fund Management Tab Component
const FundManagementTab = ({
  sponsors,
  funds,
  usageSummary,
  loading,
  onRefresh,
}: {
  sponsors: Sponsor[];
  funds: SponsorFund[];
  usageSummary: FundUsageSummary[];
  loading: boolean;
  onRefresh: () => void;
}) => {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPercentage = (spent: number, total: number) =>
    total > 0 ? `${((spent / total) * 100).toFixed(1)}%` : '0%';

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Fund Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              /* TODO: Open new fund dialog */
            }}
          >
            Add Fund
          </Button>
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Fund Summary Cards */}
          <Grid item xs={12} md={3}>
            <FundSummaryCard
              title="Total Funds"
              value={formatCurrency(usageSummary.reduce((sum, item) => sum + item.total_amount, 0))}
              subtitle={`${usageSummary.length} active sponsors`}
              icon={FundIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FundSummaryCard
              title="Available Funds"
              value={formatCurrency(
                usageSummary.reduce((sum, item) => sum + item.remaining_amount, 0),
              )}
              subtitle={`${usageSummary.reduce(
                (sum, item) => sum + item.total_funds,
                0,
              )} fund sources`}
              icon={FundIcon}
              color="success"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FundSummaryCard
              title="Expiring Soon"
              value={formatCurrency(
                usageSummary.reduce((sum, item) => sum + item.expiring_funds, 0),
              )}
              subtitle="Next 30 days"
              icon={WarningIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FundSummaryCard
              title="Active Orders"
              value={usageSummary.reduce((sum, item) => sum + item.active_orders, 0)}
              subtitle="Pending processing"
              icon={OrderIcon}
              color="info"
            />
          </Grid>

          {/* Sponsor Funds Detail */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sponsor Fund Details
                </Typography>
                {usageSummary.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      No sponsor funds found. Click "Add Fund" to create your first sponsor funding
                      source.
                    </Typography>
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sponsor</TableCell>
                          <TableCell align="right">Total Funds</TableCell>
                          <TableCell align="right">Available</TableCell>
                          <TableCell align="right">Spent</TableCell>
                          <TableCell align="right">Utilization</TableCell>
                          <TableCell align="right">Expiring</TableCell>
                          <TableCell align="right">Active Orders</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {usageSummary.map((sponsor) => (
                          <TableRow key={sponsor.sponsor_id}>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2">{sponsor.sponsor_name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {sponsor.total_funds} fund{sponsor.total_funds !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(sponsor.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="success.main">
                                {formatCurrency(sponsor.remaining_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(sponsor.spent_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ width: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(sponsor.spent_amount / sponsor.total_amount) * 100}
                                  sx={{ mb: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {formatPercentage(sponsor.spent_amount, sponsor.total_amount)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {sponsor.expiring_funds > 0 ? (
                                <Chip
                                  label={formatCurrency(sponsor.expiring_funds)}
                                  color="warning"
                                  size="small"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  None
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{sponsor.active_orders}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// Placeholder components for other tabs
const TaskAllocationTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Task Allocation
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Allocate funds to specific tasks and track cross-sponsor payments
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Task allocation functionality will be implemented in the next phase.
    </Alert>
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
    <Alert severity="info" sx={{ mt: 2 }}>
      Order processing functionality will be implemented in the next phase.
    </Alert>
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
    <Alert severity="info" sx={{ mt: 2 }}>
      Receiving functionality will be implemented in the next phase.
    </Alert>
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
    <Alert severity="info" sx={{ mt: 2 }}>
      Audit and reporting functionality will be implemented in the next phase.
    </Alert>
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
    <Alert severity="info" sx={{ mt: 2 }}>
      Vendor management functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Procurement Management' }];

const ProcurementManagementDashboard: React.FC = () => {
  const { currentUser, hasRole } = useRBAC();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [funds, setFunds] = useState<SponsorFund[]>([]);
  const [usageSummary, setUsageSummary] = useState<FundUsageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check access permissions
  const hasAccess = hasRole('Admin') || hasRole('ProjectManager') || hasRole('Technician');

  // Load procurement data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sponsorsData, fundsData, usageData] = await Promise.all([
        fetchSponsors(),
        fetchSponsorFunds(),
        getFundUsageSummary(),
      ]);

      setSponsors(sponsorsData);
      setFunds(fundsData);
      setUsageSummary(usageData);
    } catch (err) {
      console.error('Error loading procurement data:', err);
      setError('Failed to load procurement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  // Access control
  if (!hasAccess) {
    return (
      <PageContainer title="Procurement Management" description="Access denied">
        <Breadcrumb title="Procurement Management" items={BCrumb} />
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have permission to access the Procurement Management system. Access is
          restricted to Admin, Project Manager, and Technician roles.
        </Alert>
      </PageContainer>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    loadData();
  };

  // Calculate dashboard statistics
  const activeFunds = funds.filter((f) => f.status === 'Active').length;
  const totalAmount = usageSummary.reduce((sum, item) => sum + item.total_amount, 0);
  const remainingAmount = usageSummary.reduce((sum, item) => sum + item.remaining_amount, 0);
  const expiringFunds = usageSummary.reduce((sum, item) => sum + item.expiring_funds, 0);
  const activeOrders = usageSummary.reduce((sum, item) => sum + item.active_orders, 0);

  if (loading) {
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
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FundSummaryCard
            title="Total Funds"
            value={`$${totalAmount.toLocaleString()}`}
            subtitle={`${sponsors.length} sponsors`}
            icon={FundIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FundSummaryCard
            title="Available"
            value={`$${remainingAmount.toLocaleString()}`}
            subtitle={`${activeFunds} active funds`}
            icon={FundIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FundSummaryCard
            title="Expiring Soon"
            value={`$${expiringFunds.toLocaleString()}`}
            subtitle="Next 30 days"
            icon={WarningIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FundSummaryCard
            title="Active Orders"
            value={activeOrders}
            subtitle="In progress"
            icon={OrderIcon}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Alerts */}
      {expiringFunds > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />${expiringFunds.toLocaleString()}{' '}
            in funds expiring within 30 days. Review fund management tab.
          </Typography>
        </Alert>
      )}

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
          {activeTab === 0 && (
            <FundManagementTab
              sponsors={sponsors}
              funds={funds}
              usageSummary={usageSummary}
              loading={loading}
              onRefresh={handleRefresh}
            />
          )}
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
