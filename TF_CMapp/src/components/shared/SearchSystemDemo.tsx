import React from 'react';
import { Box, Typography, Button, Paper, Alert, Chip, Stack } from '@mui/material';
import { Search, CheckCircle, Settings } from '@mui/icons-material';
import { useGlobalSearch, useSearchFilters } from '../../hooks/api/useGlobalSearch';
import { getSearchSystemStatus } from '../../services/searchInitializer';

const SearchSystemDemo: React.FC = () => {
  const { searchTerm, results, isLoading, recentSearches, search, clear, removeRecentSearch } =
    useGlobalSearch();

  const { activeFilters, availableFilters, addFilter } = useSearchFilters();

  const systemStatus = getSearchSystemStatus();

  const handleTestSearch = () => {
    search('test project', []);
  };

  const handleTestWithFilter = () => {
    // Add a test filter and search
    addFilter({
      filterId: 'project_status',
      value: 'Active',
      operator: 'equals',
    });
    search('project', activeFilters);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search color="primary" />
        Global Search System Demo
      </Typography>

      {/* System Status */}
      <Alert
        severity={systemStatus.isInitialized ? 'success' : 'warning'}
        sx={{ mb: 3 }}
        icon={<CheckCircle />}
      >
        <Typography variant="subtitle1">
          Search System Status: {systemStatus.isInitialized ? 'Initialized' : 'Not Ready'}
        </Typography>
        <Typography variant="body2">
          Filters: {systemStatus.filtersCount} | Presets: {systemStatus.presetsCount} | Recent:{' '}
          {systemStatus.recentSearchesCount}
        </Typography>
      </Alert>

      <Stack spacing={3}>
        {/* Test Controls */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test Controls
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleTestSearch} disabled={isLoading}>
              Test Basic Search
            </Button>
            <Button variant="outlined" onClick={handleTestWithFilter} disabled={isLoading}>
              Test with Filter
            </Button>
            <Button variant="text" onClick={clear}>
              Clear Results
            </Button>
          </Stack>
        </Paper>

        {/* Current Search State */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Search State
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Search Term: <strong>{searchTerm || 'None'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Results: <strong>{results.length}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading: <strong>{isLoading ? 'Yes' : 'No'}</strong>
            </Typography>
          </Box>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeFilters.map((filter) => (
                  <Chip
                    key={filter.filterId}
                    label={`${filter.filterId}: ${filter.value}`}
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Recent Searches:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {recentSearches.map((term, index) => (
                  <Chip
                    key={index}
                    label={term}
                    size="small"
                    variant="outlined"
                    onClick={() => search(term, [])}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Search Results */}
        {results.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Search Results ({results.length})
            </Typography>
            {results.slice(0, 5).map((result) => (
              <Box
                key={result.id}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2">{result.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip label={result.type} size="small" />
                  <Chip label={result.category} size="small" color="primary" />
                  {result.score && (
                    <Chip label={`Score: ${Math.round(result.score)}`} size="small" />
                  )}
                </Stack>
              </Box>
            ))}
          </Paper>
        )}

        {/* Available Filters */}
        <Paper sx={{ p: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Settings />
            Available Filters ({availableFilters.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {availableFilters.map((filter) => (
              <Chip
                key={filter.id}
                label={filter.label}
                size="small"
                variant="outlined"
                color={
                  filter.category === 'project'
                    ? 'primary'
                    : filter.category === 'inventory'
                    ? 'secondary'
                    : 'default'
                }
              />
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default SearchSystemDemo;
