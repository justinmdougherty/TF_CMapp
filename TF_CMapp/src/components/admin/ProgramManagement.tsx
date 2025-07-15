import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useRBAC } from '../../context/RBACContext';
import {
  Program,
  ProgramAccess,
  ProjectAccess,
  ProgramUserAssignment,
  ProjectUserAssignment,
  ProgramAccessLevel,
  ProjectAccessLevel,
} from '../../types/ProgramAccess';
import { UserProfile, UserRole } from '../../types/UserPermissions';

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
      id={`program-tabpanel-${index}`}
      aria-labelledby={`program-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ProgramManagementProps {
  onClose?: () => void;
}

const ProgramManagement: React.FC<ProgramManagementProps> = ({ onClose }) => {
  const {
    currentUser,
    getAllUsers,
    getAllPrograms,
    assignUserToProgram,
    assignUserToProject,
    removeUserFromProgram,
    removeUserFromProject,
    hasRole,
  } = useRBAC();

  const [activeTab, setActiveTab] = useState(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignmentType, setAssignmentType] = useState<'program' | 'project'>('program');

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    user_id: '',
    program_id: '',
    project_id: '',
    role: 'Technician' as UserRole,
    access_level: 'Read' as ProgramAccessLevel | ProjectAccessLevel,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsData, usersData] = await Promise.all([getAllPrograms(), getAllUsers()]);
      setPrograms(programsData);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load program data');
      console.error('Error loading program data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async () => {
    try {
      if (assignmentType === 'program') {
        await assignUserToProgram(
          assignmentForm.user_id,
          assignmentForm.program_id,
          assignmentForm.role,
          assignmentForm.access_level,
        );
      } else {
        await assignUserToProject(
          assignmentForm.user_id,
          assignmentForm.project_id,
          assignmentForm.role,
          assignmentForm.access_level,
        );
      }

      setAssignModalOpen(false);
      loadData(); // Refresh data
    } catch (err) {
      setError('Failed to assign user');
      console.error('Error assigning user:', err);
    }
  };

  const handleRemoveUser = async (userId: string, programId?: string, projectId?: string) => {
    try {
      if (projectId) {
        await removeUserFromProject(userId, projectId);
      } else if (programId) {
        await removeUserFromProgram(userId, programId);
      }
      loadData(); // Refresh data
    } catch (err) {
      setError('Failed to remove user');
      console.error('Error removing user:', err);
    }
  };

  const openAssignModal = (program?: Program, type: 'program' | 'project' = 'program') => {
    setSelectedProgram(program || null);
    setAssignmentType(type);
    setAssignmentForm({
      ...assignmentForm,
      program_id: program?.program_id || '',
    });
    setAssignModalOpen(true);
  };

  if (!hasRole('Admin')) {
    return <Alert severity="error">You don't have permission to access Program Management.</Alert>;
  }

  if (loading) {
    return <Typography>Loading program data...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<SettingsIcon />} label="Programs" />
          <Tab icon={<PeopleIcon />} label="User Access" />
          <Tab icon={<SecurityIcon />} label="Access Matrix" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Programs Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Program Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              /* Add new program logic */
            }}
          >
            Add Program
          </Button>
        </Box>

        <Grid container spacing={3}>
          {programs.map((program) => (
            <Grid item xs={12} md={6} lg={4} key={program.program_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{program.program_name}</Typography>
                    <Chip
                      label={program.status}
                      color={program.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {program.description}
                  </Typography>

                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Code: {program.program_code}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<PeopleIcon />}
                      onClick={() => openAssignModal(program, 'program')}
                    >
                      Assign Users
                    </Button>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* User Access Tab */}
      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          User Access Management
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Programs</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {user.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.program_access.map((programAccess) => (
                        <Chip
                          key={programAccess.program_id}
                          label={`${programAccess.program_name} (${programAccess.access_level})`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.accessible_projects.length} projects
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => openAssignModal(undefined, 'program')}>
                      Manage Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Access Matrix Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Access Control Matrix
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive view of user permissions across all programs and projects.
        </Typography>
        {/* Access matrix implementation would go here */}
      </TabPanel>

      {/* Assignment Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign User to {assignmentType === 'program' ? 'Program' : 'Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={users}
              getOptionLabel={(user) => `${user.full_name} (${user.email})`}
              value={users.find((u) => u.user_id === assignmentForm.user_id) || null}
              onChange={(_, newValue) =>
                setAssignmentForm((prev) => ({ ...prev, user_id: newValue?.user_id || '' }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Select User" variant="outlined" />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Program</InputLabel>
              <Select
                value={assignmentForm.program_id}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({ ...prev, program_id: e.target.value }))
                }
                label="Program"
              >
                {programs.map((program) => (
                  <MenuItem key={program.program_id} value={program.program_id}>
                    {program.program_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={assignmentForm.role}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                }
                label="User Role"
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="ProjectManager">Project Manager</MenuItem>
                <MenuItem value="Technician">Technician</MenuItem>
                <MenuItem value="Visitor">Visitor</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Access Level</InputLabel>
              <Select
                value={assignmentForm.access_level}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({ ...prev, access_level: e.target.value as any }))
                }
                label="Access Level"
              >
                {assignmentType === 'program' ? (
                  <>
                    <MenuItem value="Limited">Limited - Assigned projects only</MenuItem>
                    <MenuItem value="Program">Program - All projects in program</MenuItem>
                    <MenuItem value="Admin">Admin - Full program control</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="Read">Read - View only</MenuItem>
                    <MenuItem value="Write">Write - Can modify</MenuItem>
                    <MenuItem value="Manage">Manage - Team management</MenuItem>
                    <MenuItem value="Admin">Admin - Full control</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignUser}
            variant="contained"
            disabled={!assignmentForm.user_id || !assignmentForm.program_id}
          >
            Assign Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramManagement;
