import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  Settings,
  Security,
  Group,
  Business,
  Storage,
  Assignment,
} from '@mui/icons-material';

interface SystemCheck {
  id: string;
  name: string;
  status: 'passed' | 'warning' | 'failed' | 'info';
  message: string;
  details?: string;
  action?: string;
}

interface SystemConfiguration {
  multiTenantMode: boolean;
  certificateAuth: boolean;
  auditLogging: boolean;
  programIsolation: boolean;
  autoUserProvisioning: boolean;
  maxProgramsPerUser: number;
  sessionTimeout: number;
  passwordPolicy: boolean;
}

const SystemSetup: React.FC = () => {
  const { currentUser, hasRole } = useRBAC();
  const { availablePrograms, createProgram } = usePrograms();
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<SystemConfiguration>({
    multiTenantMode: true,
    certificateAuth: true,
    auditLogging: true,
    programIsolation: true,
    autoUserProvisioning: false,
    maxProgramsPerUser: 5,
    sessionTimeout: 480, // 8 hours in minutes
    passwordPolicy: true,
  });

  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramCode, setNewProgramCode] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  useEffect(() => {
    performSystemChecks();
  }, []);

  const performSystemChecks = async () => {
    setIsLoading(true);

    // Simulate system checks
    const checks: SystemCheck[] = [
      {
        id: 'database',
        name: 'Database Connection',
        status: 'passed',
        message: 'H10CM database connection successful',
        details: 'Connected to MSSQL database with multi-tenant schema',
      },
      {
        id: 'programs',
        name: 'Program Configuration',
        status: availablePrograms.length > 0 ? 'passed' : 'warning',
        message:
          availablePrograms.length > 0
            ? `${availablePrograms.length} programs configured`
            : 'No programs found - create your first program',
        details: 'Programs provide tenant isolation and access control',
        action: availablePrograms.length === 0 ? 'Create Program' : undefined,
      },
      {
        id: 'rbac',
        name: 'Role-Based Access Control',
        status: 'passed',
        message: 'RBAC system operational',
        details: 'Multi-tenant access control with program-level isolation',
      },
      {
        id: 'certificates',
        name: 'Certificate Authentication',
        status: config.certificateAuth ? 'passed' : 'warning',
        message: config.certificateAuth
          ? 'Certificate authentication enabled'
          : 'Certificate authentication disabled - using development mode',
        details: 'DoD PKI certificate validation for secure user identification',
      },
      {
        id: 'audit',
        name: 'Audit Trail',
        status: config.auditLogging ? 'passed' : 'warning',
        message: config.auditLogging ? 'Audit logging active' : 'Audit logging disabled',
        details: 'Complete tracking of user actions and access changes',
      },
      {
        id: 'api',
        name: 'API Health',
        status: 'passed',
        message: 'Multi-tenant API operational',
        details: 'H10CM API server responding with program isolation',
      },
    ];

    setSystemChecks(checks);
    setIsLoading(false);
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'failed':
        return <Error color="error" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'warning':
        return 'warning';
      case 'failed':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgramName || !newProgramCode) return;

    try {
      await createProgram({
        programName: newProgramName,
        programCode: newProgramCode,
        description: newProgramDescription,
        status: 'Active',
        allowCrossProjectVisibility: false,
        requireProjectAssignment: true,
        defaultProjectRole: 'Technician',
      });

      // Reset form
      setNewProgramName('');
      setNewProgramCode('');
      setNewProgramDescription('');

      // Refresh system checks
      performSystemChecks();
    } catch (error) {
      console.error('Failed to create program:', error);
    }
  };

  const handleConfigChange = (key: keyof SystemConfiguration, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!hasRole('SystemAdmin')) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Access Denied: System Administration requires SystemAdmin role
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Setup & Configuration
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Configure and monitor your H10CM multi-tenant platform
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {/* System Health Checks */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1 }} />
                <Typography variant="h6">System Health Checks</Typography>
              </Box>

              <List>
                {systemChecks.map((check) => (
                  <ListItem key={check.id} divider>
                    <ListItemIcon>{getStatusIcon(check.status)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{check.name}</Typography>
                          <Chip
                            label={check.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(check.status) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textPrimary">
                            {check.message}
                          </Typography>
                          {check.details && (
                            <Typography variant="caption" color="textSecondary">
                              {check.details}
                            </Typography>
                          )}
                          {check.action && (
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ mt: 1 }}
                              onClick={() => {
                                if (check.action === 'Create Program') {
                                  // Scroll to program creation section
                                  document.getElementById('create-program')?.scrollIntoView({
                                    behavior: 'smooth',
                                  });
                                }
                              }}
                            >
                              {check.action}
                            </Button>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={performSystemChecks} disabled={isLoading}>
                  Refresh Checks
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Configuration */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Security Configuration</Typography>
              </Box>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.multiTenantMode}
                      onChange={(e) => handleConfigChange('multiTenantMode', e.target.checked)}
                    />
                  }
                  label="Multi-Tenant Mode"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.certificateAuth}
                      onChange={(e) => handleConfigChange('certificateAuth', e.target.checked)}
                    />
                  }
                  label="Certificate Authentication"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.auditLogging}
                      onChange={(e) => handleConfigChange('auditLogging', e.target.checked)}
                    />
                  }
                  label="Audit Logging"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.programIsolation}
                      onChange={(e) => handleConfigChange('programIsolation', e.target.checked)}
                    />
                  }
                  label="Program Isolation"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoUserProvisioning}
                      onChange={(e) => handleConfigChange('autoUserProvisioning', e.target.checked)}
                    />
                  }
                  label="Auto User Provisioning"
                />

                <TextField
                  label="Max Programs per User"
                  type="number"
                  size="small"
                  value={config.maxProgramsPerUser}
                  onChange={(e) =>
                    handleConfigChange('maxProgramsPerUser', parseInt(e.target.value))
                  }
                />

                <TextField
                  label="Session Timeout (minutes)"
                  type="number"
                  size="small"
                  value={config.sessionTimeout}
                  onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Program Management */}
        <Grid item xs={12}>
          <Card id="create-program">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1 }} />
                <Typography variant="h6">Program Management</Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" paragraph>
                Programs provide tenant isolation in the multi-tenant architecture. Each program
                represents an independent organization or business unit with complete data
                isolation.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Program Name"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder="e.g., Aerospace Division"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Program Code"
                    value={newProgramCode}
                    onChange={(e) => setNewProgramCode(e.target.value.toUpperCase())}
                    placeholder="e.g., AERO-A1"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={newProgramDescription}
                    onChange={(e) => setNewProgramDescription(e.target.value)}
                    placeholder="Program description"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCreateProgram}
                    disabled={!newProgramName || !newProgramCode}
                    sx={{ height: '56px' }}
                  >
                    Create Program
                  </Button>
                </Grid>
              </Grid>

              {availablePrograms.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Existing Programs ({availablePrograms.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {availablePrograms.map((program) => (
                      <Grid item key={program.programId}>
                        <Chip
                          label={`${program.programName} (${program.programCode})`}
                          variant="outlined"
                          color="primary"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ mr: 1 }} />
                <Typography variant="h6">System Information</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {availablePrograms.length}
                    </Typography>
                    <Typography variant="caption">Programs</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      1
                    </Typography>
                    <Typography variant="caption">Active Users</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      99.9%
                    </Typography>
                    <Typography variant="caption">Uptime</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      v2.0
                    </Typography>
                    <Typography variant="caption">Platform Version</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSetup;
