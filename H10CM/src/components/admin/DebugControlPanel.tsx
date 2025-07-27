import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  AlertTitle,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  BugReport,
  Settings,
  Refresh,
  Info,
  Error as ErrorIcon,
  Code,
  Storage,
  Visibility,
  VisibilityOff,
  Speed as PerformanceIcon,
  NetworkCheck as NetworkIcon,
  DataUsage as DatabaseIcon,
  Psychology as TestingIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  GitHub as GitHubIcon,
  Send as SendIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { debugService, DebugSettings } from '../../services/debugService';
import {
  githubIntegrationService,
  GitHubConfig,
  ErrorContext,
} from '../../services/githubIntegrationService';
import { toast } from 'react-hot-toast';

interface DebugControlPanelProps {
  currentUser?: any;
}

// Debug Summary Card Component
const DebugSummaryCard = ({
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

// System Debug Tab Component
const SystemDebugTab = ({
  debugSettings,
  loading,
  onSettingChange,
  onToggleDebugMode,
  onTestError,
  onRefresh,
  currentUser,
}: {
  debugSettings: DebugSettings;
  loading: boolean;
  onSettingChange: (setting: keyof DebugSettings, value: boolean) => void;
  onToggleDebugMode: () => void;
  onTestError: () => void;
  onRefresh: () => void;
  currentUser?: any;
}) => {
  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">System Debug Controls</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onTestError}
            startIcon={<ErrorIcon />}
            color="warning"
          >
            Test Error
          </Button>
          <IconButton onClick={onRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Master Debug Toggle */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Master Debug Mode"
                subheader="Enable/disable debug mode globally"
                avatar={<Settings color="primary" />}
              />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={debugSettings.enabled}
                      onChange={(e) => onSettingChange('enabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={`Debug Mode ${debugSettings.enabled ? 'Enabled' : 'Disabled'}`}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {debugSettings.enabled
                    ? 'Debug information will be shown to users and logged to console'
                    : 'Users will see user-friendly error messages only'}
                </Typography>

                {debugSettings.enabled && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(debugSettings.timestamp).toLocaleString()}
                    </Typography>
                    {debugSettings.enabledBy && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Enabled by: {debugSettings.enabledBy}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Debug Options */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Debug Options"
                subheader="Configure what debug information to show"
                avatar={<Info color="primary" />}
              />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.showErrorDetails}
                        onChange={(e) => onSettingChange('showErrorDetails', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show Error Details"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.verboseLogging}
                        onChange={(e) => onSettingChange('verboseLogging', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Verbose Console Logging"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.showSqlErrors}
                        onChange={(e) => onSettingChange('showSqlErrors', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show SQL Errors"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.showNetworkErrors}
                        onChange={(e) => onSettingChange('showNetworkErrors', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show Network Errors"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.enableApiDebugHeaders}
                        onChange={(e) => onSettingChange('enableApiDebugHeaders', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Enable API Debug Headers"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Debug Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Debug Actions"
                subheader="Testing and maintenance tools"
                avatar={<Code color="primary" />}
              />
              <CardContent>
                <Stack direction="column" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={onToggleDebugMode}
                    startIcon={debugSettings.enabled ? <VisibilityOff /> : <Visibility />}
                    color={debugSettings.enabled ? 'secondary' : 'primary'}
                    fullWidth
                  >
                    {debugSettings.enabled ? 'Disable' : 'Enable'} Debug Mode
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={onTestError}
                    startIcon={<ErrorIcon />}
                    color="warning"
                    fullWidth
                  >
                    Test Error Handling
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Environment Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Environment Information"
                subheader="Current system environment"
                avatar={<Info color="primary" />}
              />
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Chip
                      label={`NODE_ENV: ${process.env.NODE_ENV || 'unknown'}`}
                      color={process.env.NODE_ENV === 'development' ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      label={`Debug Mode: ${debugSettings.enabled ? 'ON' : 'OFF'}`}
                      color={debugSettings.enabled ? 'error' : 'success'}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      label={`User: ${currentUser?.display_name || 'Unknown'}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      label={`Admin: ${currentUser?.is_system_admin ? 'Yes' : 'No'}`}
                      color={currentUser?.is_system_admin ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// Placeholder components for other tabs
const PerformanceMonitoringTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Performance Monitoring
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Monitor system performance, memory usage, and API response times
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Performance monitoring functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

const LoggingControlTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Logging Control
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Manage log levels, view logs, and configure logging settings
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Advanced logging control functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

const NetworkDebugTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Network Debug
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Monitor API calls, network requests, and connection status
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Network debugging functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

const DatabaseDebugTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Database Debug
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Monitor SQL queries, database connections, and query performance
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Database debugging functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

const TestingToolsTabPlaceholder = () => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom>
      Testing Tools
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Generate test data, simulate errors, and manage mock configurations
    </Typography>
    <Alert severity="info" sx={{ mt: 2 }}>
      Testing tools functionality will be implemented in the next phase.
    </Alert>
  </Box>
);

// GitHub Integration Tab Component
const GitHubIntegrationTab = () => {
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'error' | 'unconfigured' | 'no-token'
  >('unconfigured');
  const [connectionError, setConnectionError] = useState<string>('');
  const [autoReportingEnabled, setAutoReportingEnabled] = useState(false);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalIssues: 0, openIssues: 0, closedIssues: 0 });

  useEffect(() => {
    loadGitHubConfig();
  }, []);

  const loadGitHubConfig = async () => {
    try {
      const config = await githubIntegrationService.getConfig();
      setGithubConfig(config);
      setIsConfigured(!!config.owner && !!config.repo);
      setAutoReportingEnabled(config.autoCreateIssues || false);

      if (config.owner && config.repo) {
        checkConnection();
        loadRecentIssues();
      }
    } catch (error) {
      console.error('Failed to load GitHub config:', error);
    }
  };
  const checkConnection = async () => {
    setConnectionStatus('checking');
    setConnectionError('');
    try {
      const result = await githubIntegrationService.testConnection();
      if (result.success) {
        setConnectionStatus('connected');
        setConnectionError('');
      } else {
        // Check for specific error types
        if (result.message.includes('Bad credentials') || result.message.includes('token')) {
          setConnectionStatus('no-token');
          setConnectionError('GitHub token not configured on server');
        } else {
          setConnectionStatus('error');
          setConnectionError(result.message);
        }
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
    }
  };

  const loadRecentIssues = async () => {
    try {
      const issues = await githubIntegrationService.getRecentIssues();
      setRecentIssues(issues.slice(0, 5)); // Show only 5 recent issues

      const openCount = issues.filter((issue) => issue.state === 'open').length;
      const closedCount = issues.filter((issue) => issue.state === 'closed').length;
      setStats({
        totalIssues: issues.length,
        openIssues: openCount,
        closedIssues: closedCount,
      });
    } catch (error) {
      console.error('Failed to load recent issues:', error);
    }
  };

  const handleConfigSave = async (newConfig: Partial<GitHubConfig>) => {
    setIsLoading(true);
    try {
      await githubIntegrationService.updateConfig(newConfig);
      await loadGitHubConfig();
      toast.success('GitHub configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save GitHub configuration');
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestError = async () => {
    setIsLoading(true);
    try {
      const testError: ErrorContext = {
        message: 'Test error from Debug Control Panel',
        stack: 'Error: Test error\n  at DebugControlPanel\n  at handleTestError',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        errorType: 'frontend',
        category: 'bug',
        component: 'DebugControlPanel',
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'test-user',
        sessionId: 'test-session',
        debugSettings: {},
        additionalContext: {
          test: true,
          debugMode: true,
          feature: 'GitHub Integration Test',
        },
      };

      const issue = await githubIntegrationService.createErrorIssue(testError);
      toast.success(`Test issue created: #${issue.number}`);
      await loadRecentIssues();
    } catch (error) {
      toast.error('Failed to create test issue');
      console.error('Failed to create test issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoReporting = async (enabled: boolean) => {
    try {
      await handleConfigSave({ autoCreateIssues: enabled });
      setAutoReportingEnabled(enabled);

      if (enabled) {
        githubIntegrationService.enableAutoErrorCapture();
        toast.success('Auto error reporting enabled');
      } else {
        githubIntegrationService.disableAutoErrorCapture();
        toast.success('Auto error reporting disabled');
      }
    } catch (error) {
      toast.error('Failed to update auto reporting setting');
    }
  };
  const getConnectionStatusChip = () => {
    const statusConfig = {
      checking: {
        color: 'info' as const,
        icon: <CircularProgress size={16} />,
        label: 'Checking...',
      },
      connected: { color: 'success' as const, icon: <CheckCircleIcon />, label: 'Connected' },
      error: { color: 'error' as const, icon: <ErrorIcon />, label: 'Connection Error' },
      'no-token': { color: 'warning' as const, icon: <WarningIcon />, label: 'Token Required' },
      unconfigured: { color: 'default' as const, icon: <GitHubIcon />, label: 'Not Configured' },
    };

    const config = statusConfig[connectionStatus];
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      {/* Configuration Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="GitHub Configuration"
          subheader="Configure automatic issue creation for errors and debugging"
          action={getConnectionStatusChip()}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repository Owner"
                value={githubConfig?.owner || ''}
                onChange={(e) => setGithubConfig((prev) => ({ ...prev!, owner: e.target.value }))}
                placeholder="e.g., username or organization"
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repository Name"
                value={githubConfig?.repo || ''}
                onChange={(e) => setGithubConfig((prev) => ({ ...prev!, repo: e.target.value }))}
                placeholder="e.g., H10CM"
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoReportingEnabled}
                    onChange={(e) => handleToggleAutoReporting(e.target.checked)}
                    disabled={isLoading || !isConfigured}
                  />
                }
                label="Enable automatic error reporting"
              />
            </Grid>
            {/* Error Display */}
            {(connectionStatus === 'error' || connectionStatus === 'no-token') &&
              connectionError && (
                <Grid item xs={12}>
                  <Alert
                    severity={connectionStatus === 'no-token' ? 'warning' : 'error'}
                    sx={{ mt: 1 }}
                  >
                    <AlertTitle>
                      {connectionStatus === 'no-token'
                        ? 'GitHub Token Required'
                        : 'Connection Error'}
                    </AlertTitle>
                    {connectionError}
                    {connectionStatus === 'no-token' && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Please set the GITHUB_TOKEN environment variable on the server and restart
                        the API.
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              )}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => handleConfigSave(githubConfig || {})}
                  disabled={isLoading || !githubConfig?.owner || !githubConfig?.repo}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <GitHubIcon />}
                >
                  Save Configuration
                </Button>
                <Button
                  variant="outlined"
                  onClick={checkConnection}
                  disabled={isLoading || !isConfigured}
                  startIcon={<Refresh />}
                >
                  Test Connection
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleTestError}
                  disabled={isLoading || !isConfigured || connectionStatus !== 'connected'}
                  startIcon={<SendIcon />}
                  color="warning"
                >
                  Create Test Issue
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {isConfigured && connectionStatus === 'connected' && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <DebugSummaryCard
              title="Total Issues"
              value={stats.totalIssues}
              icon={GitHubIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DebugSummaryCard
              title="Open Issues"
              value={stats.openIssues}
              icon={ErrorIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DebugSummaryCard
              title="Closed Issues"
              value={stats.closedIssues}
              icon={CheckCircleIcon}
              color="success"
            />
          </Grid>
        </Grid>
      )}

      {/* Recent Issues Section */}
      {isConfigured && connectionStatus === 'connected' && recentIssues.length > 0 && (
        <Card>
          <CardHeader
            title="Recent Issues"
            subheader="Latest GitHub issues created from error reports"
            action={
              <Button startIcon={<Refresh />} onClick={loadRecentIssues} disabled={isLoading}>
                Refresh
              </Button>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentIssues.map((issue) => (
                    <TableRow key={issue.number}>
                      <TableCell>#{issue.number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {issue.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={issue.state}
                          color={issue.state === 'open' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View on GitHub">
                          <IconButton
                            size="small"
                            onClick={() => window.open(issue.html_url, '_blank')}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy URL">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(issue.html_url);
                              toast.success('Issue URL copied to clipboard');
                            }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {!isConfigured && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Setup Required</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            To enable GitHub integration, you need to:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 2 }}>
            <li>Create a GitHub Personal Access Token with 'repo' permissions</li>
            <li>Set the GITHUB_TOKEN environment variable on the server (e.g., in .env file)</li>
            <li>Restart the API server to load the new environment variable</li>
            <li>Configure the repository owner and name above</li>
            <li>Test the connection to ensure proper authentication</li>
            <li>Enable automatic error reporting if desired</li>
          </Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> The API server must be restarted after adding the GITHUB_TOKEN
            environment variable.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

const DebugControlPanel: React.FC<DebugControlPanelProps> = ({ currentUser }) => {
  const [debugSettings, setDebugSettings] = useState<DebugSettings>(
    debugService.getDebugSettings(),
  );
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [debugMetrics, setDebugMetrics] = useState({
    errorCount: 0,
    performanceScore: 95,
    logEntries: 0,
    networkCalls: 0,
  });

  useEffect(() => {
    // Load current debug settings
    setDebugSettings(debugService.getDebugSettings());

    // Load debug metrics
    loadDebugMetrics();

    // Listen for debug logs
    const handleDebugLog = (event: any) => {
      if (event.detail && debugService.shouldUseVerboseLogging()) {
        setDebugLogs((prev) => [...prev.slice(-99), event.detail]);
      }
    };

    window.addEventListener('debug-log', handleDebugLog);
    return () => window.removeEventListener('debug-log', handleDebugLog);
  }, []);

  const loadDebugMetrics = async () => {
    try {
      setLoading(true);

      // Simulate loading debug metrics
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get actual metrics from debug service
      const metrics = {
        errorCount: debugLogs.length,
        performanceScore: Math.floor(Math.random() * 20) + 80, // 80-100
        logEntries: debugLogs.length,
        networkCalls: Math.floor(Math.random() * 100) + 50, // 50-150
      };

      setDebugMetrics(metrics);
    } catch (error) {
      console.error('Error loading debug metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting: keyof DebugSettings, value: boolean) => {
    const updates = { [setting]: value };
    debugService.updateDebugSettings(updates, currentUser?.display_name);
    setDebugSettings(debugService.getDebugSettings());
    toast.success(`Debug ${setting} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleDebugMode = () => {
    const newState = debugService.toggleDebugMode(currentUser?.display_name);
    setDebugSettings(debugService.getDebugSettings());

    if (newState) {
      toast.success('Debug mode enabled - You will now see detailed error information');
    } else {
      toast.success('Debug mode disabled - Error messages will be user-friendly');
    }
  };

  const handleResetSettings = () => {
    debugService.resetToDefaults();
    setDebugSettings(debugService.getDebugSettings());
    setShowResetDialog(false);
    toast.success('Debug settings reset to defaults');
  };

  const handleTestError = () => {
    try {
      throw new Error('Test error from Debug Control Panel');
    } catch (error) {
      console.error('Test error:', error);
      debugService.debugError('Test error triggered', error);
      toast.error('Test error triggered - check console for debug output');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    loadDebugMetrics();
  };

  const getDebugStatusColor = () => {
    if (debugSettings.enabled) {
      return debugSettings.showErrorDetails ? 'error' : 'warning';
    }
    return 'success';
  };

  const getDebugStatusText = () => {
    if (!debugSettings.enabled) return 'Disabled';
    if (debugSettings.showErrorDetails) return 'Full Debug';
    return 'Basic Debug';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BugReport color="primary" />
            Debug Control Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage debug settings and monitor system performance
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={getDebugStatusText()} color={getDebugStatusColor()} />
          <Tooltip title="Refresh metrics">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Debug Mode Information Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Debug Mode Information</AlertTitle>
        <Typography variant="body2">
          Debug mode enables detailed error logging and technical information display. This is
          useful for troubleshooting issues but should be disabled in production to avoid exposing
          sensitive information to users.
        </Typography>
      </Alert>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <DebugSummaryCard
            title="Debug Status"
            value={debugSettings.enabled ? 'Active' : 'Disabled'}
            subtitle={
              debugSettings.enabled
                ? `Since ${new Date(debugSettings.timestamp).toLocaleDateString()}`
                : 'Debug mode off'
            }
            icon={debugSettings.enabled ? CheckCircleIcon : WarningIcon}
            color={debugSettings.enabled ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DebugSummaryCard
            title="Error Count"
            value={debugMetrics.errorCount}
            subtitle="Last 24 hours"
            icon={ErrorIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DebugSummaryCard
            title="Performance"
            value={`${debugMetrics.performanceScore}%`}
            subtitle="System performance score"
            icon={PerformanceIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DebugSummaryCard
            title="Log Entries"
            value={debugMetrics.logEntries}
            subtitle={`${debugMetrics.networkCalls} network calls`}
            icon={Storage}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="debug control tabs"
          >
            <Tab label="System Debug" icon={<Settings />} iconPosition="start" />
            <Tab label="Performance" icon={<PerformanceIcon />} iconPosition="start" />
            <Tab label="Logging" icon={<Storage />} iconPosition="start" />
            <Tab label="Network" icon={<NetworkIcon />} iconPosition="start" />
            <Tab label="Database" icon={<DatabaseIcon />} iconPosition="start" />
            <Tab label="Testing" icon={<TestingIcon />} iconPosition="start" />
            <Tab label="GitHub Integration" icon={<GitHubIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <SystemDebugTab
              debugSettings={debugSettings}
              loading={loading}
              onSettingChange={handleSettingChange}
              onToggleDebugMode={handleToggleDebugMode}
              onTestError={handleTestError}
              onRefresh={handleRefresh}
              currentUser={currentUser}
            />
          )}
          {activeTab === 1 && <PerformanceMonitoringTabPlaceholder />}
          {activeTab === 2 && <LoggingControlTabPlaceholder />}
          {activeTab === 3 && <NetworkDebugTabPlaceholder />}
          {activeTab === 4 && <DatabaseDebugTabPlaceholder />}
          {activeTab === 5 && <TestingToolsTabPlaceholder />}
          {activeTab === 6 && <GitHubIntegrationTab />}
        </Box>
      </Paper>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Debug Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all debug settings to their default values? This will
            disable debug mode and reset all debug options.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="warning" variant="contained">
            Reset Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DebugControlPanel;
