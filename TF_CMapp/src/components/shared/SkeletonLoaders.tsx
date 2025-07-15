import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid, Stack, useTheme } from '@mui/material';

// Generic skeleton card for project cards
export const ProjectCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%', p: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Project title */}
          <Skeleton variant="text" height={32} width="80%" />

          {/* Status badge */}
          <Skeleton variant="rounded" height={24} width={80} />

          {/* Progress section */}
          <Box>
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="rounded" height={8} sx={{ mt: 1 }} />
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton variant="text" height={20} width="30%" />
            <Skeleton variant="text" height={20} width="30%" />
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" height={36} width={100} />
            <Skeleton variant="circular" height={36} width={36} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Dashboard grid skeleton
export const DashboardSkeleton: React.FC<{ cardCount?: number }> = ({ cardCount = 6 }) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Page title */}
      <Skeleton variant="text" height={40} width={300} sx={{ mb: 3 }} />

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Skeleton variant="text" height={20} width="60%" />
                <Skeleton variant="text" height={32} width="40%" />
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project cards grid */}
      <Grid container spacing={3}>
        {Array.from({ length: cardCount }, (_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <ProjectCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Table skeleton for inventory and other lists
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}> = ({ rows = 10, columns = 5, showHeader = true }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {showHeader && (
        <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} variant="text" height={24} width={`${100 / columns}%`} />
          ))}
        </Box>
      )}

      {Array.from({ length: rows }, (_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '&:last-child': { borderBottom: 0 },
          }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height={20}
              width={`${100 / columns}%`}
              sx={{ opacity: Math.random() * 0.5 + 0.3 }} // Varying opacity for realism
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Calendar skeleton
export const CalendarSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Calendar header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" height={32} width={200} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={32} width={80} />
          ))}
        </Box>
      </Box>

      {/* Calendar grid */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        {/* Days of week header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Box
              key={day}
              sx={{ p: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}
            >
              <Skeleton variant="text" height={20} />
            </Box>
          ))}
        </Box>

        {/* Calendar days */}
        {Array.from({ length: 5 }, (_, weekIndex) => (
          <Box key={weekIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <Box
                key={dayIndex}
                sx={{
                  minHeight: 120,
                  p: 1,
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Skeleton variant="text" height={16} width={20} />
                {Math.random() > 0.7 && <Skeleton variant="rounded" height={20} sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Form skeleton for modals and forms
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => {
  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      {Array.from({ length: fields }, (_, i) => (
        <Box key={i}>
          <Skeleton variant="text" height={20} width="30%" sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={56} />
        </Box>
      ))}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Skeleton variant="rounded" height={36} width={80} />
        <Skeleton variant="rounded" height={36} width={100} />
      </Box>
    </Stack>
  );
};

// Loading overlay for existing content
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ loading, children, message = 'Loading...' }) => {
  if (!loading) return <>{children}</>;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ opacity: 0.3, pointerEvents: 'none' }}>{children}</Box>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'background.paper',
          opacity: 0.9,
          zIndex: 1,
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={120} />
      </Box>
    </Box>
  );
};
