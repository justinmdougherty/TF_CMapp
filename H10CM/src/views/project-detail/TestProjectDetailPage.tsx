import React from 'react';
import { useParams } from 'react-router';
import { Typography, Box, Paper } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';

const TestProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  console.log('🔍 TestProjectDetailPage: Component rendered with projectId:', projectId);

  const BCrumb = [{ to: '/dashboard', title: 'Home' }, { title: `Test Project ${projectId}` }];

  return (
    <PageContainer title={`Test Project: ${projectId}`} description="Test project detail page">
      <Breadcrumb title={`Test Project ${projectId}`} items={BCrumb} />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Test Project Detail Page
        </Typography>
        <Typography variant="body1" gutterBottom>
          Project ID from URL: <strong>{projectId}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page is working correctly if you can see this message.
        </Typography>
      </Paper>
    </PageContainer>
  );
};

export default TestProjectDetailPage;
