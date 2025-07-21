import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  TextField,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useRBAC } from '../../context/RBACContext';
import UserManagementDashboard from '../../components/admin/UserManagementDashboard';
import LoginComponent from '../../components/auth/LoginComponent';
import APIDocumentation from '../../components/admin/APIDocumentation';
import DebugControlPanel from '../../components/admin/DebugControlPanel';
import { notifications } from '../../services/notificationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Site Administration' }];

const SiteAdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    getAllUsers,
    getPendingAccessRequests,
    approveUserAccess,
    denyUserAccess,
    hasRole,
  } = useRBAC();

  const [currentTab, setCurrentTab] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Program Management State
  const [programs, setPrograms] = useState<any[]>([]);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  });
  const [programAccessRequests, setProgramAccessRequests] = useState<any[]>([]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Load programs data
  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        console.error('Failed to load programs:', response.statusText);
        // Fallback to mock data if API fails
        const mockPrograms = [
          {
            program_id: 1,
            program_name: 'TF Operations',
            program_code: 'TF',
            program_description: 'TF production management and inventory tracking operations',
            is_active: true,
            date_created: '2025-01-15',
            project_count: 1,
            user_count: 3,
          },
          {
            program_id: 2,
            program_name: 'Aerospace Division',
            program_code: 'AER',
            program_description: 'Aerospace systems and components production',
            is_active: true,
            date_created: '2025-01-10',
            project_count: 0,
            user_count: 0,
          },
        ];
        setPrograms(mockPrograms);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      // Fallback to mock data
      const mockPrograms = [
        {
          program_id: 1,
          program_name: 'TF Operations',
          program_code: 'TF',
          program_description: 'TF production management and inventory tracking operations',
          is_active: true,
          date_created: '2025-01-15',
          project_count: 1,
          user_count: 3,
        },
        {
          program_id: 2,
          program_name: 'Aerospace Division',
          program_code: 'AER',
          program_description: 'Aerospace systems and components production',
          is_active: true,
          date_created: '2025-01-10',
          project_count: 0,
          user_count: 0,
        },
      ];
      setPrograms(mockPrograms);
    }
  };

  // Load program access requests
  const loadProgramAccessRequests = async () => {
    try {
      const response = await fetch('/api/users/access-requests', {
        headers: {
          'x-arr-clientcert': 'development-fallback',
        },
      });

      if (response.ok) {
        const requests = await response.json();
        setProgramAccessRequests(requests);
      } else {
        console.error('Failed to fetch access requests:', response.status);
        notifications.error('Failed to load program access requests');
        setProgramAccessRequests([]);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      notifications.error('Error loading program access requests');
      setProgramAccessRequests([]);
    }
  };

  // Handle program creation
  const handleCreateProgram = async () => {
    try {
      // Add API call here
      console.log('Creating program:', programForm);

      // Mock success - replace with actual API call
      const newProgram = {
        id: Date.now(),
        ...programForm,
        created_date: new Date().toISOString().split('T')[0],
        project_count: 0,
        user_count: 0,
      };

      setPrograms([...programs, newProgram]);
      setProgramForm({ name: '', code: '', description: '', status: 'Active' });
      setShowCreateProgram(false);
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  // Handle access request approval
  const handleApproveAccess = async (requestId: number) => {
    try {
      // Add API call here
      console.log('Approving access request:', requestId);
      setProgramAccessRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: 'Approved' } : req)),
      );
    } catch (error) {
      console.error('Error approving access:', error);
    }
  };

  // Handle access request denial
  const handleDenyAccess = async (requestId: number) => {
    try {
      // Add API call here
      console.log('Denying access request:', requestId);
      setProgramAccessRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: 'Denied' } : req)),
      );
    } catch (error) {
      console.error('Error denying access:', error);
    }
  };

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!isAuthenticated || !hasRole('Admin')) return;

      setIsLoadingData(true);
      try {
        const [users, requests] = await Promise.all([getAllUsers(), getPendingAccessRequests()]);
        setAllUsers(users);
        setPendingRequests(requests);

        // Load program data
        await loadPrograms();
        await loadProgramAccessRequests();
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAdminData();
  }, [isAuthenticated, hasRole, getAllUsers, getPendingAccessRequests]);

  // Show loading state
  if (isLoading) {
    return (
      <PageContainer
        title="Site Administration"
        description="System administration and user management"
      >
        <Breadcrumb title="Site Administration" items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <PageContainer
        title="Site Administration"
        description="System administration and user management"
      >
        <Breadcrumb title="Site Administration" items={BCrumb} />
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Administrator authentication required to access site administration features.
          </Alert>
          <LoginComponent
            onLoginSuccess={(user) => {
              console.log('Admin logged in:', user.full_name);
            }}
          />
        </Box>
      </PageContainer>
    );
  }

  // Check admin permissions
  if (!hasRole('Admin')) {
    return (
      <PageContainer
        title="Site Administration"
        description="System administration and user management"
      >
        <Breadcrumb title="Site Administration" items={BCrumb} />
        <Alert severity="error" sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            Only administrators can access the Site Administration dashboard. Current role:{' '}
            {currentUser?.role || 'Unknown'}
          </Typography>
        </Alert>
      </PageContainer>
    );
  }

  const getSystemStats = () => {
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.status === 'Active').length,
      pendingApprovals: pendingRequests.length,
      adminUsers: allUsers.filter((u) => u.role === 'Admin').length,
      recentActivity: allUsers.filter(
        (u) => u.last_login && new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      ).length,
    };
    return stats;
  };

  const stats = getSystemStats();

  return (
    <PageContainer
      title="Site Administration"
      description="System administration and user management"
    >
      <Breadcrumb title="Site Administration" items={BCrumb} />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <AdminIcon color="primary" />
            Site Administration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {currentUser?.full_name}
          </Typography>
        </Box>
        <Badge badgeContent={stats.pendingApprovals} color="warning">
          <NotificationIcon />
        </Badge>
      </Stack>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {stats.totalUsers}
              </Typography>
              <Typography variant="caption">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.activeUsers}
              </Typography>
              <Typography variant="caption">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {stats.pendingApprovals}
              </Typography>
              <Typography variant="caption">Pending Approvals</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {stats.adminUsers}
              </Typography>
              <Typography variant="caption">Administrators</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.recentActivity}
              </Typography>
              <Typography variant="caption">Active Today</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              label={
                <Badge badgeContent={stats.pendingApprovals} color="warning">
                  User Management
                </Badge>
              }
              icon={<UsersIcon />}
            />
            <Tab label="System Security" icon={<SecurityIcon />} />
            <Tab label="System Settings" icon={<SettingsIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
            <Tab label="API Documentation" icon={<CodeIcon />} />
            <Tab label="Debug Control" icon={<BugReportIcon />} />
          </Tabs>
        </Box>

        {/* User Management Tab */}
        <TabPanel value={currentTab} index={0}>
          {isLoadingData ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <UserManagementDashboard
              currentUser={currentUser!}
              allUsers={allUsers}
              pendingAccessRequests={pendingRequests}
              onApproveUser={async (userId, role, notes) => {
                await approveUserAccess(userId, role, notes);
                // Reload data
                const [users, requests] = await Promise.all([
                  getAllUsers(),
                  getPendingAccessRequests(),
                ]);
                setAllUsers(users);
                setPendingRequests(requests);
              }}
              onDenyUser={async (userId, notes) => {
                await denyUserAccess(userId, notes);
                // Reload data
                const requests = await getPendingAccessRequests();
                setPendingRequests(requests);
              }}
              onUpdateUserRole={async (userId, newRole) => {
                // Note: updateUserRole not available in current RBAC context
                console.log('Update user role:', userId, newRole);
                // Reload data
                const users = await getAllUsers();
                setAllUsers(users);
              }}
              onSuspendUser={async (userId, reason) => {
                console.log('Suspend user:', userId, reason);
                // Reload data
                const users = await getAllUsers();
                setAllUsers(users);
              }}
              onActivateUser={async (userId) => {
                console.log('Activate user:', userId);
                // Reload data
                const users = await getAllUsers();
                setAllUsers(users);
              }}
              onUpdateUserPermissions={async (userId, permissions) => {
                // Implement if needed
                console.log('Update permissions for user:', userId, permissions);
              }}
            />
          )}
        </TabPanel>

        {/* System Security Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            System Security
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Certificate Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Certificate-based authentication is enabled for administrator access.
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Status: Active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Role-Based Access Control
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    RBAC system with 4 role levels: Admin, ProjectManager, Technician, Visitor.
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Status: Active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            H10CM Platform - Program Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            H10CM is a multi-tenant platform where Programs are tenants. Each Program operates as an
            independent organization with complete data isolation. Users can request access to
            specific Programs with specific access levels.
          </Typography>

          <Grid container spacing={3}>
            {/* Platform Overview */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">H10CM Platform Overview</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {programs.length}
                        </Typography>
                        <Typography variant="caption">Active Programs</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {programs.reduce((sum, p) => sum + p.project_count, 0)}
                        </Typography>
                        <Typography variant="caption">Total Projects</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {programs.reduce((sum, p) => sum + p.user_count, 0)}
                        </Typography>
                        <Typography variant="caption">Program Users</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {programAccessRequests.filter((r) => r.status === 'Pending').length}
                        </Typography>
                        <Typography variant="caption">Pending Requests</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Program Management Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Program Management</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowCreateProgram(true)}
                    >
                      Create New Program
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {programs.map((program) => (
                      <Grid item xs={12} md={6} lg={4} key={program.program_id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 1,
                              }}
                            >
                              <Box>
                                <Typography variant="h6" gutterBottom>
                                  {program.program_name}
                                </Typography>
                                <Chip
                                  label={program.program_code}
                                  size="small"
                                  color="primary"
                                  sx={{ mb: 1 }}
                                />
                              </Box>
                              <IconButton size="small">
                                <MoreVertIcon />
                              </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                              {program.program_description}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Projects: {program.project_count || 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Users: {program.user_count || 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Status: {program.is_active ? 'Active' : 'Inactive'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Created: {new Date(program.date_created).toLocaleDateString()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Access Requests Management */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Program Access Requests</Typography>
                    <Badge
                      badgeContent={
                        programAccessRequests.filter((r) => r.status === 'Pending').length
                      }
                      color="warning"
                    >
                      <NotificationIcon />
                    </Badge>
                  </Box>

                  {programAccessRequests.length === 0 ? (
                    <Alert severity="info">No access requests at this time.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {programAccessRequests.map((request) => (
                        <Grid item xs={12} key={request.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                  <Typography variant="subtitle1">{request.user_name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {request.user_email}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                  <Typography variant="body2">
                                    Program: <strong>{request.program_name}</strong>
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                  <Chip
                                    label={request.access_level}
                                    size="small"
                                    color={
                                      request.access_level === 'Admin'
                                        ? 'error'
                                        : request.access_level === 'Write'
                                        ? 'warning'
                                        : 'info'
                                    }
                                  />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.justification}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                  {request.status === 'Pending' ? (
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleApproveAccess(request.id)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleDenyAccess(request.id)}
                                      >
                                        Deny
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <Chip
                                      label={request.status}
                                      size="small"
                                      color={request.status === 'Approved' ? 'success' : 'error'}
                                    />
                                  )}
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Create Program Dialog */}
          <Dialog
            open={showCreateProgram}
            onClose={() => setShowCreateProgram(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Create New Program</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a new Program tenant within the H10CM platform. Each Program operates as an
                independent organization with complete data isolation.
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Program Name"
                    value={programForm.name}
                    onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Aerospace Division"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Program Code"
                    value={programForm.code}
                    onChange={(e) =>
                      setProgramForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g., AER"
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={programForm.description}
                    onChange={(e) =>
                      setProgramForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the program's purpose"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={programForm.status}
                      onChange={(e) =>
                        setProgramForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateProgram(false)}>Cancel</Button>
              <Button
                onClick={handleCreateProgram}
                variant="contained"
                disabled={!programForm.name || !programForm.code}
              >
                Create Program
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            System Analytics
          </Typography>
          <Alert severity="info">
            System analytics and reporting will be available in a future update.
          </Alert>
        </TabPanel>

        {/* API Documentation Tab */}
        <TabPanel value={currentTab} index={4}>
          <APIDocumentation isVisible={currentTab === 4} />
        </TabPanel>

        {/* Debug Control Panel Tab */}
        <TabPanel value={currentTab} index={5}>
          <DebugControlPanel currentUser={currentUser} />
        </TabPanel>
      </Card>
    </PageContainer>
  );
};

export default SiteAdminDashboard;
