import { Typography, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useParams } from 'react-router'; // Import useParams

const ProjectDetailPage = () => {
  // Get the projectId from the URL parameters
  const { projectId } = useParams();

  // Dynamic Breadcrumb based on projectId
  const BCrumb = [
    {
      to: '/',
      title: 'Home',
    },
    {
      to: '/dashboard', // Link back to the main dashboard
      title: 'Projects Dashboard',
    },
    {
      // Display the current project ID, maybe fetch project name later
      title: `Project ${projectId}`,
    },
  ];

  return (
    <PageContainer title={`Project ${projectId}`} description={`Details for project ${projectId}`}>
      <Breadcrumb title={`Project Details`} items={BCrumb} />
      <Box>
        <Typography variant="h4" gutterBottom>
          Project Detail Page
        </Typography>
        <Typography variant="body1">Displaying details for Project ID: {projectId}</Typography>
        {/* Add more project-specific components and details here */}
      </Box>
    </PageContainer>
  );
};

export default ProjectDetailPage;
