// src/views/project-detail/ProjectDetailPage.tsx

import { Typography, Box, CircularProgress, Paper, LinearProgress } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useParams } from 'react-router';
import { useGetProjectById } from 'src/hooks/useProjects';

// Import the new generic BatchTrackingComponent
import BatchTrackingComponent from './BatchTrackingComponent';

const ProjectDetailPage = () => {
  const { projectId: currentProjectIdFromUrl } = useParams<{ projectId: string }>();
  const { data: project, isLoading, isError, error } = useGetProjectById(currentProjectIdFromUrl);

  // Dynamic Breadcrumb construction
  const BCrumb = [
    { to: '/', title: 'Home' },
    { to: '/dashboard', title: 'Projects Dashboard' },
    {
      title: isLoading
        ? 'Loading Project...'
        : project
        ? project.name
        : currentProjectIdFromUrl || 'Project Details',
    },
  ];

  // Loading State
  if (isLoading) {
    return (
      <PageContainer title="Loading Project..." description="Loading project details">
        <Breadcrumb title="Loading..." items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  // Error State
  if (isError) {
    return (
      <PageContainer title="Error" description="Error loading project">
        <Breadcrumb title="Error" items={BCrumb} />
        <Typography color="error">
          Error fetching project: {error?.message || 'An unknown error occurred'}
        </Typography>
      </PageContainer>
    );
  }

  // Project Not Found State
  if (!project) {
    const notFoundBCrumb = [
      { to: '/', title: 'Home' },
      { to: '/dashboard', title: 'Projects Dashboard' },
      { title: `Project ${currentProjectIdFromUrl} Not Found` },
    ];
    return (
      <PageContainer
        title="Project Not Found"
        description="The requested project could not be found."
      >
        <Breadcrumb title="Not Found" items={notFoundBCrumb} />
        <Typography>Project with ID '{currentProjectIdFromUrl}' not found.</Typography>
      </PageContainer>
    );
  }

  // --- Project Found - Display Details and Conditionally the Batch Tracker ---

  // Check if project has batch tracking capability
  // This could be based on project.type, project.name, or a specific field like project.hasBatchTracking
  const supportedBatchTypes = ['PR', 'ASSEMBLY']; // Add more types as needed
  const projectType = project.name; // Assuming project name indicates type, could be project.type
  const hasBatchTracking = supportedBatchTypes.includes(projectType.toUpperCase());

  return (
    <PageContainer
      title={`Project: ${project.name}`}
      description={`Details for project ${project.name}`}
    >
      <Breadcrumb title={`Project: ${project.name}`} items={BCrumb} />

      <Box
        mb={3}
        sx={{
          width: hasBatchTracking
            ? { xs: '100%', sm: '110%', md: '120%', lg: '130%', xl: '140%' }
            : '100%',
          maxWidth: hasBatchTracking ? 'none' : undefined,
          mx: hasBatchTracking ? { xs: -1, sm: -3, md: -6, lg: -12, xl: -20 } : 0,
          px: hasBatchTracking ? 2 : 0,
          overflow: 'visible',
        }}
      >
        <Typography variant="h4" gutterBottom>
          {project.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', my: 1, maxWidth: '300px' }}>
          <Typography variant="body1" sx={{ mr: 2, minWidth: '80px' }}>
            Progress:
          </Typography>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={project.currentProgress} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(
              project.currentProgress,
            )}%`}</Typography>
          </Box>
        </Box>
        <Typography variant="body1">Current Progress: {project.currentProgress}%</Typography>
        <Typography variant="body1">Status: {project.status}</Typography>
        <Typography variant="body1">
          Due Date: {new Date(project.dueDate).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Conditionally render the Generic BatchTrackingComponent */}
      {hasBatchTracking && (
        <Box
          mt={4}
          sx={{
            width: { xs: '100%', sm: '110%', md: '120%', lg: '130%', xl: '140%' },
            maxWidth: 'none',
            mx: { xs: -1, sm: -3, md: -6, lg: -12, xl: -20 },
            px: 2,
            overflow: 'visible',
          }}
        >
          {/* Generic BatchTrackingComponent configured by project type */}
          <BatchTrackingComponent projectId={project.id} projectType={projectType} />
        </Box>
      )}

      {/* Display message for projects without batch tracking */}
      {!hasBatchTracking && (
        <Box mt={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              This project ({project.name}) does not have batch tracking functionality enabled.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supported batch tracking types: {supportedBatchTypes.join(', ')}
            </Typography>
          </Paper>
        </Box>
      )}
    </PageContainer>
  );
};

export default ProjectDetailPage;
