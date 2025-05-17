// src/views/project-detail/ProjectDetailPage.tsx

import { Typography, Box, CircularProgress, Paper, LinearProgress } from '@mui/material'; // Added Paper
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useParams } from 'react-router';
import { useGetProjectById } from 'src/hooks/useProjects'; // This fetches general project info

// Import your PRBatchTrackingComponent
import PRBatchTrackingComponent from './PRBatchTrackingComponent';

const ProjectDetailPage = () => {


  const { projectId: currentProjectIdFromUrl } = useParams<{ projectId: string }>(); // Renamed for clarity
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
    // Adjust BCrumb for "Not Found" state as project.name is unavailable
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

  // --- Project Found - Display Details and Conditionally the PR Batch Tracker ---

  // Condition to show PR Batch Tracking UI if the project's name is "PR"
  const isThePRProject = project.name === 'PR';

  return (
    <PageContainer
      title={`Project: ${project.name}`}
      description={`Details for project ${project.name}`}
    >
      <Breadcrumb title={`Project: ${project.name}`} items={BCrumb} />

      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {project.name}
        </Typography>
        {/* Display some general project details - these come from projectService.ts mock */}
        {/* <Typography variant="body1">ID: {project.id}</Typography> */}

        <Box sx={{ display: 'flex', alignItems: 'center', my: 1, maxWidth: '300px' }}>
          {' '}
          {/* Added my and maxWidth */}
          <Typography variant="body1" sx={{ mr: 2, minWidth: '80px' }}>
            {' '}
            {/* Added minWidth for label */}
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
        {/* Add any other general details you want to show for ALL projects */}
      </Box>

      {/* Conditionally render the PRBatchTrackingComponent */}
      {isThePRProject && (
        <Box mt={4}>
          {/* PRBatchTrackingComponent is self-contained with its UI and mock data */}
          <PRBatchTrackingComponent projectId={project.id} />
        </Box>
      )}

      {/* Optional: Display a message or different components if it's NOT the PR project */}
      {!isThePRProject && (
        <Box mt={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body1">
              This project ({project.name}) does not have a specific batch tracking view.
              {/* You could render other project-specific details or components here */}
            </Typography>
          </Paper>
        </Box>
      )}
    </PageContainer>
  );
};

export default ProjectDetailPage;
