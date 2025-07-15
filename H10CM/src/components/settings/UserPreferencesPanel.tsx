// src/components/settings/UserPreferencesPanel.tsx
import React, { useContext } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Divider,
  Paper,
} from '@mui/material';
import {
  Settings,
  Refresh,
  Delete,
  Person,
  Palette,
  ViewQuilt,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { CustomizerContext } from '../../context/CustomizerContext';
import { userPreferencesService } from '../../services/userPreferencesService';

const UserPreferencesPanel: React.FC = () => {
  const {
    activeDir,
    setActiveDir,
    activeMode,
    setActiveMode,
    activeTheme,
    setActiveTheme,
    activeLayout,
    setActiveLayout,
    isCardShadow,
    setIsCardShadow,
    isLayout,
    setIsLayout,
    isBorderRadius,
    setIsBorderRadius,
    isCollapse,
    setIsCollapse,
    preferencesLoaded,
    currentUser,
    clearUserPreferences,
    resetToDefaults,
  } = useContext(CustomizerContext);

  const themeOptions = [
    { value: 'BLUE_THEME', label: 'Blue Theme', color: '#1976d2' },
    { value: 'GREEN_THEME', label: 'Green Theme', color: '#2e7d32' },
    { value: 'PURPLE_THEME', label: 'Purple Theme', color: '#7b1fa2' },
    { value: 'ORANGE_THEME', label: 'Orange Theme', color: '#f57c00' },
    { value: 'CYAN_THEME', label: 'Cyan Theme', color: '#0097a7' },
  ];

  const handleClearPreferences = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all your preferences? This action cannot be undone.',
      )
    ) {
      clearUserPreferences();
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all preferences to defaults?')) {
      resetToDefaults();
    }
  };

  const getAllStoredPreferences = () => {
    const allPrefs = userPreferencesService.getAllStoredPreferences();
    console.log('All stored preferences:', allPrefs);
    alert('Check the browser console for all stored preferences data');
  };

  if (!preferencesLoaded) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading user preferences...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Settings sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            User Preferences
          </Typography>
        </Box>

        {currentUser ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} />
              Preferences are saved for user: <strong>{currentUser}</strong>
            </Box>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            User not identified. Preferences will be saved as fallback user.
          </Alert>
        )}

        <Typography variant="body1" color="text.secondary">
          Your theme and layout preferences are automatically saved and will persist across
          sessions.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Theme Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Palette sx={{ mr: 2 }} />
                <Typography variant="h6">Theme Settings</Typography>
              </Box>

              {/* Dark/Light Mode */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Display Mode
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={activeMode === 'dark'}
                      onChange={(e) => setActiveMode(e.target.checked ? 'dark' : 'light')}
                      icon={<LightMode />}
                      checkedIcon={<DarkMode />}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {activeMode === 'dark' ? (
                        <DarkMode sx={{ mr: 1 }} />
                      ) : (
                        <LightMode sx={{ mr: 1 }} />
                      )}
                      {activeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Box>
                  }
                />
              </Box>

              {/* Color Theme */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Color Theme
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={activeTheme}
                    label="Theme"
                    onChange={(e) => setActiveTheme(e.target.value)}
                  >
                    {themeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: option.color,
                              mr: 2,
                            }}
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Card Shadow */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isCardShadow}
                    onChange={(e) => setIsCardShadow(e.target.checked)}
                  />
                }
                label="Card Shadows"
              />

              {/* Border Radius */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Border Radius: {isBorderRadius}px
                </Typography>
                <Slider
                  value={isBorderRadius}
                  onChange={(_, value) => setIsBorderRadius(value as number)}
                  min={0}
                  max={24}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Layout Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ViewQuilt sx={{ mr: 2 }} />
                <Typography variant="h6">Layout Settings</Typography>
              </Box>

              {/* Layout Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Layout Type
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Layout</InputLabel>
                  <Select
                    value={activeLayout}
                    label="Layout"
                    onChange={(e) => setActiveLayout(e.target.value)}
                  >
                    <MenuItem value="vertical">Vertical</MenuItem>
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Container Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Container Type
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Container</InputLabel>
                  <Select
                    value={isLayout}
                    label="Container"
                    onChange={(e) => setIsLayout(e.target.value)}
                  >
                    <MenuItem value="boxed">Boxed</MenuItem>
                    <MenuItem value="full">Full Width</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Sidebar Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sidebar Type
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Sidebar</InputLabel>
                  <Select
                    value={isCollapse}
                    label="Sidebar"
                    onChange={(e) => setIsCollapse(e.target.value)}
                  >
                    <MenuItem value="full-sidebar">Full Sidebar</MenuItem>
                    <MenuItem value="mini-sidebar">Mini Sidebar</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Direction */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Text Direction
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={activeDir}
                    label="Direction"
                    onChange={(e) => setActiveDir(e.target.value)}
                  >
                    <MenuItem value="ltr">Left to Right</MenuItem>
                    <MenuItem value="rtl">Right to Left</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preference Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preference Management
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Chip
                  label={`Current User: ${currentUser || 'Unknown'}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip label={`Theme: ${activeTheme}`} color="secondary" variant="outlined" />
                <Chip label={`Mode: ${activeMode}`} color="info" variant="outlined" />
                <Chip label={`Layout: ${activeLayout}`} color="success" variant="outlined" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleResetToDefaults}
                  color="warning"
                >
                  Reset to Defaults
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={handleClearPreferences}
                  color="error"
                >
                  Clear All Preferences
                </Button>

                <Button variant="outlined" onClick={getAllStoredPreferences} color="info">
                  Debug: Show All Stored
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserPreferencesPanel;
