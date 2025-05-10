// src/views/project-detail/ProjectDetailPage.tsx
import { Typography, Box, CircularProgress } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useParams } from 'react-router';
import { useGetProjectById } from 'src/hooks/useProjects'; // Import the custom hook

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>(); // Ensure projectId is typed
  const { data: project, isLoading, isError, error } = useGetProjectById(projectId);

  const BCrumb = [
    { to: '/', title: 'Home' },
    { to: '/dashboard', title: 'Projects Dashboard' },
    { title: isLoading ? 'Loading Project...' : project ? project.name : 'Project Details' },
  ];

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

  if (!project) {
    return (
      <PageContainer
        title="Project Not Found"
        description="The requested project could not be found."
      >
        <Breadcrumb title="Not Found" items={BCrumb} />
        <Typography>Project with ID '{projectId}' not found.</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Project ${project.name}`}
      description={`Details for project ${project.name}`}
    >
      <Breadcrumb title={`Project: ${project.name}`} items={BCrumb} />
      <Box>
        <Typography variant="h4" gutterBottom>
          {project.name}
        </Typography>
        <Typography variant="body1">ID: {project.id}</Typography>
        <Typography variant="body1">Production Order Qty: {project.productionOrderQty}</Typography>
        <Typography variant="body1">Progress: {project.currentProgress}%</Typography>
        <Typography variant="body1">
          Due Date: {new Date(project.dueDate).toLocaleDateString()}
        </Typography>
        <Typography variant="body1">Status: {project.status}</Typography>
        {/* Add more project-specific components and details here */}
      </Box>
    </PageContainer>
  );
};

export default ProjectDetailPage;
