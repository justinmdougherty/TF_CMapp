import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import { Search, Home, FilterList } from '@mui/icons-material';
import { useSearchParams } from 'react-router';
import { useGlobalSearch, useSearchFilters } from '../../hooks/api/useGlobalSearch';
import SearchResultItem from '../../components/shared/SearchResultItem';
import QuickFilters from '../../components/shared/QuickFilters';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  const { results, isLoading, search } = useGlobalSearch();

  const { activeFilters, removeFilter, clearFilters } = useSearchFilters();

  // Perform search on page load
  React.useEffect(() => {
    if (searchTerm) {
      search(searchTerm, activeFilters);
    }
  }, [searchTerm, activeFilters]);

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const categories = Object.keys(groupedResults);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/">
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Search sx={{ mr: 0.5 }} fontSize="inherit" />
          Search Results
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Results
        </Typography>
        {searchTerm && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Results for "{searchTerm}"
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {isLoading ? 'Searching...' : `${results.length} results found`}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FilterList />
              Filters
            </Typography>

            <QuickFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearFilters={clearFilters}
              onOpenAdvancedFilters={() => console.log('Advanced filters')}
            />
          </Paper>

          {/* Result Stats */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Result Breakdown
            </Typography>
            {categories.map((category) => (
              <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{category}</Typography>
                <Chip label={groupedResults[category].length} size="small" color="primary" />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12} md={9}>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Searching...</Typography>
            </Box>
          ) : results.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Search sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No results found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Paper>
          ) : (
            categories.map((category) => (
              <Card key={category} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    {category} ({groupedResults[category].length})
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    {groupedResults[category].map((result) => (
                      <Box key={result.id} sx={{ mb: 1 }}>
                        <SearchResultItem
                          result={result}
                          onClick={() => console.log('Navigate to:', result.url)}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SearchResultsPage;
