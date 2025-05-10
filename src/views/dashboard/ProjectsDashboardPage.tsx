// src/views/dashboard/ProjectsDashboardPage.tsx
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  CardActionArea,
  CircularProgress, // For loading state
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { Link } from 'react-router';
import { Project } from 'src/types/Project'; // Adjust the import path as necessary
import { useGetProjects } from 'src/hooks/useProjects'; // Import the custom hook

// Remove or comment out the static sampleProjects array and getStatusColor function if it's not used elsewhere
// const sampleProjects: Project[] = [ ... ];

const getStatusColor = (status: Project['status']): 'success' | 'warning' | 'error' | 'primary' => {
  switch (status) {
    case 'On Track':
      return 'primary';
    case 'Completed':
      return 'success';
    case 'At Risk':
      return 'warning';
    case 'Delayed':
      return 'error';
    default:
      return 'primary';
  }
};

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Projects Dashboard' }];

const ProjectsDashboardPage = () => {
  const { data: projects, isLoading, isError, error } = useGetProjects();

  if (isLoading) {
    return (
      <PageContainer title="Projects Dashboard" description="Overview of all projects">
        <Breadcrumb title="Projects Dashboard" items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Projects Dashboard" description="Overview of all projects">
        <Breadcrumb title="Projects Dashboard" items={BCrumb} />
        <Typography color="error">
          Error fetching projects: {error?.message || 'An unknown error occurred'}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Projects Dashboard" description="Overview of all projects">
      <Breadcrumb title="Projects Dashboard" items={BCrumb} />
      <Box>
        <Grid container spacing={3}>
          {projects?.map(
            (
              project, // Use projects from the hook (projects?)
            ) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea
                    component={Link}
                    to={`/project/${project.id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Typography variant="h5" component="div" gutterBottom>
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        color={getStatusColor(project.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        PO Qty: {project.productionOrderQty}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress variant="determinate" value={project.currentProgress} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(
                            project.currentProgress,
                          )}%`}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Due Date: {new Date(project.dueDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ),
          )}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ProjectsDashboardPage;
