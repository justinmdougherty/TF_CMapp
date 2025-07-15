import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  CardActionArea,
  CircularProgress,
  Stack,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as ActiveIcon,
  Pause as InactiveIcon,
  Schedule as PlanningIcon,
  CheckCircle as CompletedIcon,
  Archive as ArchivedIcon,
  PauseCircle as OnHoldIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { Link } from 'react-router'; // Using react-router-dom is standard for modern React apps with Vite
import { ProjectStatus } from 'src/types/Project';
import { useGetProjects, useGetProjectSteps } from 'src/hooks/api/useProjectHooks';
import { useTrackedItems } from 'src/hooks/api/useTrackedItemHooks';

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

const getStatusColor = (
  status: ProjectStatus,
): 'success' | 'warning' | 'primary' | 'default' | 'info' | 'secondary' => {
  return getStatusConfig(status).color;
};

// Component to show project progress info
const ProjectProgressInfo = ({ projectId }: { projectId: string }) => {
  const { data: projectSteps } = useGetProjectSteps(projectId);
  const { data: trackedItems } = useTrackedItems(projectId);

  // Calculate step-based progress (similar to Manager Dashboard)
  const projectStats = (() => {
    if (!trackedItems || !projectSteps) {
      return {
        totalUnits: 0,
        totalSteps: 0,
        completedSteps: 0,
        averageStepProgress: 0,
        shippedUnits: 0,
        lastTimeActive: null as Date | null,
      };
    }

    const totalSteps = projectSteps.length;
    const totalUnits = trackedItems.length;

    if (totalSteps === 0 || totalUnits === 0) {
      return {
        totalUnits: 0,
        totalSteps: 0,
        completedSteps: 0,
        averageStepProgress: 0,
        shippedUnits: 0,
        lastTimeActive: null as Date | null,
      };
    }

    // Count completed steps across all units and find last activity
    let totalCompletedSteps = 0;
    let shippedUnits = 0;
    let lastActivityDate: Date | null = null;

    trackedItems.forEach((unit) => {
      if (unit.is_shipped) {
        shippedUnits++;
        return;
      }

      const unitStepStatuses = unit.step_statuses || [];
      const completedStepsForUnit = unitStepStatuses.filter(
        (stepStatus) => stepStatus.status === 'Complete',
      ).length;

      totalCompletedSteps += completedStepsForUnit;

      // Check for last activity (most recent completion_timestamp)
      unitStepStatuses.forEach((stepStatus) => {
        if (stepStatus.status === 'Complete' && stepStatus.completion_timestamp) {
          const completionDate = new Date(stepStatus.completion_timestamp);
          if (!lastActivityDate || completionDate > lastActivityDate) {
            lastActivityDate = completionDate;
          }
        }
      });
    });

    // Calculate average step completion percentage
    const activeUnits = totalUnits - shippedUnits;
    const averageStepProgress =
      activeUnits > 0 ? Math.round((totalCompletedSteps / (activeUnits * totalSteps)) * 100) : 0;

    return {
      totalUnits,
      totalSteps,
      completedSteps: totalCompletedSteps,
      averageStepProgress,
      shippedUnits,
      lastTimeActive: lastActivityDate,
    };
  })();

  return { projectStats };
};

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Production Dashboard' }];

const ProjectsDashboardPage = () => {
  const { data: projects, isLoading, isError, error, refetch } = useGetProjects();

  const handleRefreshClick = () => {
    console.log('🔄 Manual refresh triggered');
    refetch();
  };

  // Define status priority order for sorting and filter to show only Active and On Hold
  const statusPriority: Record<ProjectStatus, number> = {
    Active: 1,
    'On Hold': 2,
    Planning: 3,
    Completed: 4,
    Inactive: 5,
    Archived: 6,
  };

  // Filter and sort projects to show only Active and On Hold
  const filteredProjects = projects
    ? [...projects]
        .filter((project) => project.status === 'Active' || project.status === 'On Hold')
        .sort((a, b) => {
          const aPriority = statusPriority[a.status] || 999;
          const bPriority = statusPriority[b.status] || 999;

          // If same status priority, sort by project name
          if (aPriority === bPriority) {
            return a.project_name.localeCompare(b.project_name);
          }

          return aPriority - bPriority;
        })
    : [];

  if (isLoading) {
    return (
      <PageContainer
        title="Production Dashboard"
        description="Select a project to begin production work"
      >
        <Breadcrumb title="Production Dashboard" items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer
        title="Production Dashboard"
        description="Select a project to begin production work"
      >
        <Breadcrumb title="Production Dashboard" items={BCrumb} />
        <Typography color="error">
          Error fetching projects: {error?.message || 'An unknown error occurred'}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Production Dashboard"
      description="Select a project to begin production work"
    >
      <Breadcrumb title="Production Dashboard" items={BCrumb} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Active Projects
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select an active or on-hold project to begin production tracking
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleRefreshClick} disabled={isLoading} title="Refresh projects">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box>
        <Grid container spacing={3}>
          {filteredProjects && filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))
          ) : (
            <Grid item xs={12}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: '200px', textAlign: 'center' }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Active Projects Available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No projects are currently active or on hold. Use Project Management in the sidebar
                  to view all projects and manage their status.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </PageContainer>
  );
};

// Individual project card component
const ProjectCard = ({ project }: { project: any }) => {
  const { projectStats } = ProjectProgressInfo({ projectId: project.project_id.toString() });

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea component={Link} to={`/project/${project.project_id}`} sx={{ flexGrow: 1 }}>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              {project.project_name}
            </Typography>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusConfig(project.status).icon ? (
                <Chip
                  icon={getStatusConfig(project.status).icon!}
                  label={project.status}
                  color={getStatusColor(project.status)}
                  size="small"
                />
              ) : (
                <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {project.project_description}
            </Typography>

            {/* Step Progress Information */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Step Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {projectStats.averageStepProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={projectStats.averageStepProgress}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {projectStats.totalUnits} units • {projectStats.completedSteps} of{' '}
                {projectStats.totalUnits * projectStats.totalSteps} steps completed
              </Typography>
            </Box>

            {/* Project Timeline Information */}
            {(project.project_start_date ||
              project.project_end_date ||
              project.estimated_completion_date) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  Timeline
                </Typography>
                {project.project_start_date && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Start: {new Date(project.project_start_date).toLocaleDateString()}
                  </Typography>
                )}
                {project.project_end_date && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    End: {new Date(project.project_end_date).toLocaleDateString()}
                  </Typography>
                )}
                {project.estimated_completion_date && !project.project_end_date && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Est. Completion:{' '}
                    {new Date(project.estimated_completion_date).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            )}

            {/* Status description */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                fontStyle: 'italic',
                mb: 1,
              }}
            >
              {getStatusConfig(project.status).description}
            </Typography>

            {/* Last Time Active */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Last Time Active:{' '}
              {projectStats.lastTimeActive
                ? projectStats.lastTimeActive.toLocaleDateString()
                : 'No recent activity'}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
};

export default ProjectsDashboardPage;
