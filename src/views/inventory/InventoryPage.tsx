import { Typography, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Inventory' }];

const InventoryPage = () => {
  return (
    <PageContainer title="Inventory" description="Inventory Management Page">
      <Breadcrumb title="Inventory" items={BCrumb} />
      <Box>
        <Typography variant="h4">Inventory Page</Typography>
        {/* Add inventory components here later */}
      </Box>
    </PageContainer>
  );
};
export default InventoryPage;
