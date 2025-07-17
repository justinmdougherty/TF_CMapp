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
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BugReport,
  Settings,
  Refresh,
  Delete,
  Info,
  Error as ErrorIcon,
  Code,
  Storage,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { debugService, DebugSettings } from '../../services/debugService';
import { toast } from 'react-hot-toast';

interface DebugControlPanelProps {
  currentUser?: any;
}

const DebugControlPanel: React.FC<DebugControlPanelProps> = ({ currentUser }) => {
  const [debugSettings, setDebugSettings] = useState<DebugSettings>(
    debugService.getDebugSettings(),
  );
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  useEffect(() => {
    // Load current debug settings
    setDebugSettings(debugService.getDebugSettings());

    // Listen for debug logs (in a real implementation, you might use a more sophisticated logging system)
    const handleDebugLog = (event: any) => {
      if (event.detail && debugService.shouldUseVerboseLogging()) {
        setDebugLogs((prev) => [...prev.slice(-99), event.detail]); // Keep last 100 logs
      }
    };

    window.addEventListener('debug-log', handleDebugLog);
    return () => window.removeEventListener('debug-log', handleDebugLog);
  }, []);

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

  const handleClearLogs = () => {
    setDebugLogs([]);
    toast.success('Debug logs cleared');
  };

  const handleTestError = () => {
    try {
      // Simulate an error for testing
      throw new Error('Test error from Debug Control Panel');
    } catch (error) {
      console.error('Test error:', error);
      debugService.debugError('Test error triggered', error);
      toast.error('Test error triggered - check console for debug output');
    }
  };

  const getDebugStatusColor = () => {
    if (debugSettings.enabled) {
      return debugSettings.showErrorDetails ? 'error' : 'warning';
    }
    return 'default';
  };

  const getDebugStatusText = () => {
    if (!debugSettings.enabled) return 'Disabled';
    if (debugSettings.showErrorDetails) return 'Full Debug';
    return 'Basic Debug';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BugReport color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Debug Control Panel
          </Typography>
          <Chip label={getDebugStatusText()} color={getDebugStatusColor()} sx={{ ml: 2 }} />
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Debug Mode Information</AlertTitle>
          <Typography variant="body2">
            Debug mode enables detailed error logging and technical information display. This is
            useful for troubleshooting issues but should be disabled in production to avoid exposing
            sensitive information to users.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Main Debug Toggle */}
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
                      onChange={(e) => handleSettingChange('enabled', e.target.checked)}
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
                        onChange={(e) => handleSettingChange('showErrorDetails', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show Error Details"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.verboseLogging}
                        onChange={(e) => handleSettingChange('verboseLogging', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Verbose Console Logging"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.showSqlErrors}
                        onChange={(e) => handleSettingChange('showSqlErrors', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show SQL Errors"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.showNetworkErrors}
                        onChange={(e) => handleSettingChange('showNetworkErrors', e.target.checked)}
                        disabled={!debugSettings.enabled}
                      />
                    }
                    label="Show Network Errors"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={debugSettings.enableApiDebugHeaders}
                        onChange={(e) =>
                          handleSettingChange('enableApiDebugHeaders', e.target.checked)
                        }
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleToggleDebugMode}
                    startIcon={debugSettings.enabled ? <VisibilityOff /> : <Visibility />}
                    color={debugSettings.enabled ? 'secondary' : 'primary'}
                  >
                    {debugSettings.enabled ? 'Disable' : 'Enable'} Debug Mode
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleTestError}
                    startIcon={<ErrorIcon />}
                    color="warning"
                  >
                    Test Error Handling
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setShowResetDialog(true)}
                    startIcon={<Refresh />}
                    color="secondary"
                  >
                    Reset to Defaults
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Debug Logs */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Debug Logs"
                subheader={`${debugLogs.length} log entries`}
                avatar={<Storage color="primary" />}
                action={
                  <Box>
                    <Tooltip title="Toggle log view">
                      <IconButton onClick={() => setShowDebugLogs(!showDebugLogs)}>
                        {showDebugLogs ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear logs">
                      <IconButton onClick={handleClearLogs}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <CardContent>
                {showDebugLogs ? (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {debugLogs.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No debug logs yet. Enable verbose logging to see debug information.
                      </Typography>
                    ) : (
                      <List dense>
                        {debugLogs.slice(-10).map((log, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={log}
                              primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Click the eye icon to view debug logs
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Current Environment Info */}
        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="h6" gutterBottom>
            Environment Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={`NODE_ENV: ${process.env.NODE_ENV || 'unknown'}`}
                color={process.env.NODE_ENV === 'development' ? 'success' : 'default'}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={`Debug Mode: ${debugSettings.enabled ? 'ON' : 'OFF'}`}
                color={debugSettings.enabled ? 'error' : 'success'}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={`User: ${currentUser?.display_name || 'Unknown'}`}
                color="primary"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={`Admin: ${currentUser?.is_system_admin ? 'Yes' : 'No'}`}
                color={currentUser?.is_system_admin ? 'success' : 'default'}
                variant="outlined"
              />
            </Grid>
          </Grid>
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
