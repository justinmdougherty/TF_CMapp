import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  CardActionArea, // Import CardActionArea
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { Link } from 'react-router'; // Import Link

// ... (Keep the Project interface, sampleProjects array, getStatusColor function) ...
interface Project {
  id: string;
  name: string;
  productionOrderQty: number;
  currentProgress: number; // Percentage 0-100
  dueDate: string; // YYYY-MM-DD
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
}

const sampleProjects: Project[] = [
  {
    id: 'proj1',
    name: 'Project Alpha',
    productionOrderQty: 150,
    currentProgress: 60,
    dueDate: '2025-07-15',
    status: 'On Track',
  },
  {
    id: 'proj2',
    name: 'Project Beta',
    productionOrderQty: 75,
    currentProgress: 30,
    dueDate: '2025-08-01',
    status: 'At Risk',
  },
  {
    id: 'proj3',
    name: 'Project Charlie',
    productionOrderQty: 200,
    currentProgress: 95,
    dueDate: '2025-06-20',
    status: 'On Track',
  },
  {
    id: 'proj4',
    name: 'Project Delta',
    productionOrderQty: 100,
    currentProgress: 15,
    dueDate: '2025-09-10',
    status: 'Delayed',
  },
  {
    id: 'proj5',
    name: 'Project Epsilon',
    productionOrderQty: 250,
    currentProgress: 70,
    dueDate: '2025-07-30',
    status: 'On Track',
  },
  {
    id: 'proj6',
    name: 'Project Zeta',
    productionOrderQty: 50,
    currentProgress: 100,
    dueDate: '2025-05-30',
    status: 'Completed',
  },
];

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
  return (
    <PageContainer title="Projects Dashboard" description="Overview of all projects">
      <Breadcrumb title="Projects Dashboard" items={BCrumb} />
      <Box>
        <Grid container spacing={3}>
          {sampleProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              {/* Use CardActionArea wrapped in Card */}
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea
                  component={Link} // Make the area behave like a Link
                  to={`/project/${project.id}`} // Set the destination URL
                  sx={{ flexGrow: 1 }} // Ensure it fills the card height if needed
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
          ))}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ProjectsDashboardPage;
