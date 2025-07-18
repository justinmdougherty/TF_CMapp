import { Typography, Box, CircularProgress, Chip, Paper } from '@mui/material';
import {
  PlayArrow as ActiveIcon,
  Pause as InactiveIcon,
  Schedule as PlanningIcon,
  CheckCircle as CompletedIcon,
  Archive as ArchivedIcon,
  PauseCircle as OnHoldIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useParams } from 'react-router';
import { useGetProjectById, useGetProjectSteps } from 'src/hooks/api/useProjectHooks';
import { ProjectStatus } from 'src/types/Project';
import BatchTrackingComponent from './BatchTrackingComponent';

// Enhanced status configuration with better colors and meanings
const getStatusConfig = (status: ProjectStatus) => {
  switch (status) {
    case 'Active':
      return {
        color: 'success' as const,
        icon: <ActiveIcon fontSize="small" />,
        description: 'Production is currently ongoing',
      };
    case 'Inactive':
      return {
        color: 'default' as const,
        icon: <InactiveIcon fontSize="small" />,
        description: 'No current production planned',
      };
    case 'Planning':
      return {
        color: 'info' as const,
        icon: <PlanningIcon fontSize="small" />,
        description: 'Project is being planned',
      };
    case 'Completed':
      return {
        color: 'primary' as const,
        icon: <CompletedIcon fontSize="small" />,
        description: 'All production completed',
      };
    case 'Archived':
      return {
        color: 'secondary' as const,
        icon: <ArchivedIcon fontSize="small" />,
        description: 'Project has been archived',
      };
    case 'On Hold':
      return {
        color: 'warning' as const,
        icon: <OnHoldIcon fontSize="small" />,
        description: 'Production temporarily paused',
      };
    default:
      return {
        color: 'default' as const,
        icon: null,
        description: '',
      };
  }
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  console.log('🔍 ProjectDetailPage: Component rendered with projectId:', projectId);

  // Hooks for project data
  const {
    data: project,
    isLoading: isLoadingProject,
    isError: isErrorProject,
    error: errorProject,
  } = useGetProjectById(projectId);

  const {
    data: stepsData,
    isLoading: isLoadingSteps,
    isError: isErrorSteps,
    error: errorSteps,
  } = useGetProjectSteps(projectId);

  console.log('🔍 ProjectDetailPage: Project data state:', {
    projectId,
    project,
    isLoadingProject,
    isErrorProject,
    errorProject: errorProject?.message,
    isLoadingSteps,
    isErrorSteps,
    errorSteps: errorSteps?.message,
  });

  const steps = stepsData || [];

  const BCrumb = [
    { to: '/dashboard', title: 'Home' },
    {
      title: isLoadingProject
        ? 'Loading Project...'
        : project
        ? project.project_name
        : projectId || 'Project Details',
    },
  ];

  if (isLoadingProject || isLoadingSteps) {
    return (
      <PageContainer title="Loading Project..." description="Loading project details">
        <Breadcrumb title="Loading..." items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (isErrorProject || isErrorSteps) {
    return (
      <PageContainer title="Error" description="Error loading project">
        <Breadcrumb title="Error" items={BCrumb} />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            🚨 Detailed Error Information
          </Typography>

          <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Primary Error Message:
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
              {errorProject?.message || errorSteps?.message || 'An unknown error occurred'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              🔍 Debug Information:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Project ID from URL:</strong> {projectId || 'undefined'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Project API Error:</strong> {isErrorProject ? 'YES' : 'NO'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Steps API Error:</strong> {isErrorSteps ? 'YES' : 'NO'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Current URL:</strong> {window.location.href}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Expected API URLs:</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', ml: 2, mb: 1 }}>
              • Project: /api/projects/{projectId}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', ml: 2, mb: 1 }}>
              • Steps: /api/projects/{projectId}/steps
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              🔧 Full Error Objects:
            </Typography>

            {errorProject && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Project API Error:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}
                >
                  {JSON.stringify(errorProject, null, 2)}
                </Typography>
              </Box>
            )}

            {errorSteps && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Steps API Error:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}
                >
                  {JSON.stringify(errorSteps, null, 2)}
                </Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, mb: 3, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              🛜 Network Information:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Base URL:</strong> {window.location.origin}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>API Base:</strong> {window.location.origin}/api
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Browser:</strong> {navigator.userAgent}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              🔨 Debugging Steps:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. Check the browser's Network tab for the actual API requests
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              2. Verify the backend API server is running on port 3000
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              3. Check if the project ID exists in the database
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              4. Verify authentication headers are being sent
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              5. Check console logs for additional debug information
            </Typography>
          </Paper>
        </Box>
      </PageContainer>
    );
  }

  if (!project) {
    const notFoundCrumb = [...BCrumb.slice(0, 2), { title: `Project ${projectId} Not Found` }];
    return (
      <PageContainer
        title="Project Not Found"
        description="The requested project could not be found."
      >
        <Breadcrumb title="Not Found" items={notFoundCrumb} />
        <Typography>Project with ID '{projectId}' not found.</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Project: ${project.project_name}`}
      description={`Production tracking for project ${project.project_name}`}
    >
      <Breadcrumb title={project.project_name} items={BCrumb} />

      {/* Simple Project Header for Technicians */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {project.project_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {project.project_description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {getStatusConfig(project.status).icon ? (
            <Chip
              icon={getStatusConfig(project.status).icon!}
              label={project.status}
              color={getStatusConfig(project.status).color}
              size="small"
            />
          ) : (
            <Chip
              label={project.status}
              color={getStatusConfig(project.status).color}
              size="small"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {getStatusConfig(project.status).description}
          </Typography>
        </Box>
      </Paper>

      {/* Production Tracking Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Production Tracking
      </Typography>

      {steps && steps.length > 0 ? (
        <BatchTrackingComponent project={project} steps={steps} />
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Production Steps Defined
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This project doesn't have any production steps configured yet. Production steps define
            the workflow and tracking for this project.
          </Typography>
        </Paper>
      )}
    </PageContainer>
  );
};

export default ProjectDetailPage;
