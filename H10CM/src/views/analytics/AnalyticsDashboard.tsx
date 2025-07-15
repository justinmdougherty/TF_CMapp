import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  People,
  Inventory,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useProjects } from 'src/hooks/api/useProjectHooks';
import { useGetAllInventory } from 'src/hooks/api/useInventoryHooks';
import { useRBAC } from 'src/context/RBACContext';

// Breadcrumb data
const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Analytics Dashboard',
  },
];

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Helper function to calculate project velocity metrics
const calculateProjectVelocity = (
  projects: any[],
  allTrackedItems: any[],
  allProjectSteps: any[],
) => {
  if (!projects.length || !allTrackedItems.length || !allProjectSteps.length) {
    return {
      averageProjectDuration: 0,
      averageStepDuration: 0,
      completionRate: 0,
      bottleneckSteps: [],
      fastestProjects: [],
      slowestProjects: [],
    };
  }

  const projectMetrics = projects
    .map((project) => {
      const projectSteps = allProjectSteps.filter((step) => step.project_id === project.project_id);
      const trackedItems = allTrackedItems.filter((item) => item.project_id === project.project_id);

      if (!trackedItems.length || !projectSteps.length) {
        return null;
      }

      // Calculate step completion times
      const stepCompletionTimes: { [stepId: number]: number[] } = {};
      let totalCompletedSteps = 0;
      let totalProjectTime = 0;

      trackedItems.forEach((item) => {
        if (item.step_statuses && Array.isArray(item.step_statuses)) {
          item.step_statuses.forEach((stepStatus: any) => {
            if (stepStatus.status === 'Complete' && stepStatus.completion_timestamp) {
              const stepId = stepStatus.step_id;

              // For simplicity, assume each step takes 1 day on average
              // In real implementation, you'd calculate actual duration
              const durationHours = 24; // Placeholder - implement actual calculation

              if (!stepCompletionTimes[stepId]) {
                stepCompletionTimes[stepId] = [];
              }
              stepCompletionTimes[stepId].push(durationHours);
              totalCompletedSteps++;
            }
          });
        }
      });

      return {
        project,
        stepCompletionTimes,
        totalCompletedSteps,
        totalUnits: trackedItems.length,
        averageStepDuration: totalCompletedSteps > 0 ? totalProjectTime / totalCompletedSteps : 0,
      };
    })
    .filter(Boolean);

  // Calculate bottleneck steps (steps that take longest on average)
  const allStepDurations: { [stepId: number]: { durations: number[]; stepName: string } } = {};

  projectMetrics.forEach((metric) => {
    if (metric) {
      Object.entries(metric.stepCompletionTimes).forEach(([stepId, durations]) => {
        if (!allStepDurations[parseInt(stepId)]) {
          // Find step name from project steps
          const stepInfo = allProjectSteps.find((step) => step.step_id === parseInt(stepId));
          allStepDurations[parseInt(stepId)] = {
            durations: [],
            stepName: stepInfo?.step_name || `Step ${stepId}`,
          };
        }
        allStepDurations[parseInt(stepId)].durations.push(...durations);
      });
    }
  });

  const bottleneckSteps = Object.entries(allStepDurations)
    .map(([stepId, data]) => ({
      stepId: parseInt(stepId),
      stepName: data.stepName,
      averageDuration: data.durations.reduce((a, b) => a + b, 0) / data.durations.length,
      completionCount: data.durations.length,
    }))
    .sort((a, b) => b.averageDuration - a.averageDuration)
    .slice(0, 5);

  return {
    averageProjectDuration: 30, // Placeholder - implement actual calculation
    averageStepDuration: 2.5, // Placeholder
    completionRate: 85, // Placeholder
    bottleneckSteps,
    fastestProjects: projectMetrics.slice(0, 3),
    slowestProjects: projectMetrics.slice(-3),
  };
};

const AnalyticsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { currentUser, hasRole, hasAnyRole } = useRBAC();

  // Check if user has required permissions (Admin or ProjectManager)
  if (!hasAnyRole(['Admin', 'ProjectManager'])) {
    return (
      <PageContainer title="Analytics Dashboard" description="Production analytics and insights">
        <Breadcrumb title="Analytics Dashboard" items={BCrumb} />
        <Alert severity="error" sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            Only administrators and project managers can access the Analytics Dashboard. Current
            role: {currentUser?.role || 'Unknown'}
          </Typography>
        </Alert>
      </PageContainer>
    );
  }

  // Fetch all data needed for analytics
  const { data: projects = [] } = useProjects();
  const { data: inventoryResponse } = useGetAllInventory();

  // Extract inventory items from response
  const inventoryItems = inventoryResponse?.data || [];

  // For velocity analysis, we need to fetch tracked items and steps for all projects
  // In a real implementation, you might want to create a specific analytics API endpoint
  const activeProjects = projects.filter((p) => p.status === 'Active' || p.status === 'Completed');

  // Placeholder for aggregated data - in real implementation, fetch all at once
  const allTrackedItems: any[] = []; // Would aggregate from all projects
  const allProjectSteps: any[] = []; // Would aggregate from all projects

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate velocity metrics
  const velocityMetrics = calculateProjectVelocity(
    activeProjects,
    allTrackedItems,
    allProjectSteps,
  );

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalValue: 0, // Would need cost data to calculate
    lowStockCount: inventoryItems.filter(
      (item) => item.reorder_point && item.current_stock_level <= item.reorder_point,
    ).length,
    totalItems: inventoryItems.length,
    categories: [...new Set(inventoryItems.map((item) => item.unit_of_measure))].length, // Using unit_of_measure as category proxy
  };

  return (
    <PageContainer title="Analytics Dashboard" description="Production analytics and reporting">
      <Breadcrumb title="Analytics Dashboard" items={BCrumb} />

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Speed />
                </Avatar>
                <Typography variant="h6">Avg Project Duration</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {velocityMetrics.averageProjectDuration} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on completed projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Typography variant="h6">Completion Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {velocityMetrics.completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Projects delivered on time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h6">Avg Step Duration</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {velocityMetrics.averageStepDuration} hrs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average time per production step
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Inventory />
                </Avatar>
                <Typography variant="h6">Inventory Value</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {inventoryMetrics.totalItems.toLocaleString()} items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total inventory items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different analytics views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Project Velocity" icon={<TrendingUp />} />
          <Tab label="Bottleneck Analysis" icon={<Warning />} />
          <Tab label="Resource Utilization" icon={<People />} />
          <Tab label="Inventory Analytics" icon={<Assessment />} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Velocity Trends
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Average completion time analysis across all projects
                </Typography>
                {/* Placeholder for velocity chart */}
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    📊 Velocity Chart will be implemented here
                    <br />
                    (Line chart showing project completion trends over time)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Active Projects"
                      secondary={`${
                        activeProjects.filter((p) => p.status === 'Active').length
                      } in progress`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Completed Projects"
                      secondary={`${
                        activeProjects.filter((p) => p.status === 'Completed').length
                      } total`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Low Stock Items"
                      secondary={`${inventoryMetrics.lowStockCount} need reorder`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Production Bottleneck Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Steps taking longest to complete across all projects
                </Typography>

                {velocityMetrics.bottleneckSteps.length > 0 ? (
                  velocityMetrics.bottleneckSteps.map((step, index) => (
                    <Box key={step.stepId} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {step.stepName}
                        </Typography>
                        <Chip
                          label={`${step.averageDuration.toFixed(1)} hrs avg`}
                          color={index === 0 ? 'error' : index === 1 ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((step.averageDuration / 8) * 100, 100)} // Normalize to 8 hours max
                        color={index === 0 ? 'error' : index === 1 ? 'warning' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {step.completionCount} completions tracked
                      </Typography>
                      {index < velocityMetrics.bottleneckSteps.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      📊 Gathering bottleneck data...
                      <br />
                      Complete more production steps to see analysis
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Resource Utilization
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Team productivity and capacity analysis (Coming Soon)
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          Inventory Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consumption patterns and forecasting (Coming Soon)
        </Typography>
      </TabPanel>
    </PageContainer>
  );
};

export default AnalyticsDashboard;
