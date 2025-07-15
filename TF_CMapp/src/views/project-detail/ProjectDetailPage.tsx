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
        <Typography color="error">
          Error fetching project data:{' '}
          {errorProject?.message || errorSteps?.message || 'An unknown error occurred'}
        </Typography>
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

      <BatchTrackingComponent project={project} steps={steps} />
    </PageContainer>
  );
};

export default ProjectDetailPage;
