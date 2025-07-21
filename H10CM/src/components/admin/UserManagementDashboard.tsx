import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Badge,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  PendingActions as PendingIcon,
  Check as ApproveIcon,
  Close as DenyIcon,
  Edit as EditIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import {
  UserProfile,
  UserAccessRequest,
  UserRole,
  Permission,
  DEFAULT_ROLE_PERMISSIONS,
} from 'src/types/UserPermissions';

interface UserManagementDashboardProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  pendingAccessRequests: UserAccessRequest[];
  onApproveUser: (userId: string, role: UserRole, notes?: string) => Promise<void>;
  onDenyUser: (userId: string, notes?: string) => Promise<void>;
  onUpdateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  onSuspendUser: (userId: string, reason?: string) => Promise<void>;
  onActivateUser: (userId: string) => Promise<void>;
  onUpdateUserPermissions: (userId: string, permissions: Permission[]) => Promise<void>;
}

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
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({
  currentUser,
  allUsers,
  pendingAccessRequests,
  onApproveUser,
  onDenyUser,
  onUpdateUserRole,
  onSuspendUser,
  onActivateUser,
  onUpdateUserPermissions,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<UserAccessRequest | null>(
    null,
  );
  const [newRole, setNewRole] = useState<UserRole>('Visitor');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role !== newRole) {
        await onUpdateUserRole(selectedUser.user_id, newRole);
      }
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleApproveAccess = async (request: UserAccessRequest) => {
    setSelectedAccessRequest(request);
    setNewRole(request.requested_role);
    setIsApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedAccessRequest) return;

    try {
      await onApproveUser(selectedAccessRequest.user_id, newRole, reviewNotes);
      setIsApprovalDialogOpen(false);
      setSelectedAccessRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleDenyAccess = async (request: UserAccessRequest) => {
    try {
      await onDenyUser(request.user_id, 'Access denied by administrator');
    } catch (error) {
      console.error('Error denying user:', error);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'ProjectManager':
        return 'primary';
      case 'Technician':
        return 'success';
      case 'Visitor':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: UserProfile['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'PendingApproval':
        return 'warning';
      case 'Suspended':
        return 'error';
      case 'Inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getUserStats = () => {
    const stats = {
      total: allUsers.length,
      active: allUsers.filter((u) => u.status === 'Active').length,
      pending: allUsers.filter((u) => u.status === 'PendingApproval').length,
      suspended: allUsers.filter((u) => u.status === 'Suspended').length,
      admins: allUsers.filter((u) => u.role === 'Admin').length,
      managers: allUsers.filter((u) => u.role === 'ProjectManager').length,
      technicians: allUsers.filter((u) => u.role === 'Technician').length,
      visitors: allUsers.filter((u) => u.role === 'Visitor').length,
    };
    return stats;
  };

  const stats = getUserStats();

  // Check if current user is admin
  if (currentUser.role !== 'Admin') {
    return (
      <Alert severity="error">Access Denied. Only administrators can access user management.</Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color="primary">
            <AdminIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            User Management Dashboard
          </Typography>
          <Badge badgeContent={pendingAccessRequests.length} color="warning">
            <NotificationIcon />
          </Badge>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="caption">Total Users</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="caption">Active</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="caption">Pending</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {stats.suspended}
              </Typography>
              <Typography variant="caption">Suspended</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label={`All Users (${stats.total})`} icon={<GroupIcon />} />
            <Tab
              label={`Pending Approval (${pendingAccessRequests.length})`}
              icon={<PendingIcon />}
            />
            <Tab label="Role Management" icon={<SecurityIcon />} />
          </Tabs>
        </Box>

        {/* All Users Tab */}
        <TabPanel value={currentTab} index={0}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: getRoleColor(user.role) + '.main' }}>
                          {(user.full_name || user.display_name || user.user_name || 'U').charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.full_name ||
                              user.display_name ||
                              user.user_name ||
                              'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email || 'No email'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                          disabled={user.user_id === currentUser.user_id}
                        >
                          <EditIcon />
                        </IconButton>
                        {user.status === 'Active' ? (
                          <IconButton
                            size="small"
                            onClick={() => onSuspendUser(user.user_id)}
                            disabled={user.user_id === currentUser.user_id}
                            color="error"
                          >
                            <SuspendIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => onActivateUser(user.user_id)}
                            color="success"
                          >
                            <ActivateIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Pending Approval Tab */}
        <TabPanel value={currentTab} index={1}>
          {pendingAccessRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No pending access requests
              </Typography>
            </Box>
          ) : (
            <List>
              {pendingAccessRequests.map((request) => {
                const user = allUsers.find((u) => u.user_id === request.user_id);
                return (
                  <ListItem key={request.request_id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <PendingIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">
                            {user?.full_name || 'Unknown User'}
                          </Typography>
                          <Chip
                            label={`Requesting: ${request.requested_role}`}
                            color={getRoleColor(request.requested_role)}
                            size="small"
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{user?.email}</Typography>
                          <Typography variant="caption">
                            Requested: {new Date(request.requested_date).toLocaleDateString()}
                          </Typography>
                          {request.justification && (
                            <Typography variant="caption">
                              Reason: {request.justification}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleApproveAccess(request)}
                          color="success"
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDenyAccess(request)}
                          color="error"
                        >
                          <DenyIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </TabPanel>

        {/* Role Management Tab */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Role Distribution
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {stats.admins}
                </Typography>
                <Typography variant="caption">Admins</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">
                  {stats.managers}
                </Typography>
                <Typography variant="caption">Project Managers</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {stats.technicians}
                </Typography>
                <Typography variant="caption">Technicians</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {stats.visitors}
                </Typography>
                <Typography variant="caption">Visitors</Typography>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Default Role Permissions
          </Typography>
          {DEFAULT_ROLE_PERMISSIONS.map((roleConfig) => (
            <Card key={roleConfig.role} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {roleConfig.role}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {roleConfig.permissions.map((permission, index) => (
                    <Chip
                      key={index}
                      label={`${permission.resource}: ${permission.actions.join(', ')}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* Edit User Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit User: {selectedUser?.full_name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="ProjectManager">Project Manager</MenuItem>
                    <MenuItem value="Technician">Technician</MenuItem>
                    <MenuItem value="Visitor">Visitor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Note: Changing a user's role will update their permissions immediately.
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveUserChanges}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog
          open={isApprovalDialogOpen}
          onClose={() => setIsApprovalDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Approve Access Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Role</InputLabel>
                  <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                    <MenuItem value="ProjectManager">Project Manager</MenuItem>
                    <MenuItem value="Technician">Technician</MenuItem>
                    <MenuItem value="Visitor">Visitor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Review Notes (Optional)"
                  multiline
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsApprovalDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitApproval}>
              Approve Access
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagementDashboard;
