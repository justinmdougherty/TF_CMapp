import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import { SearchResult } from '../../types/Search';
import SearchResultItem from './SearchResultItem';
import { SearchOff, TrendingUp, Close } from '@mui/icons-material';

interface SearchResultsDropdownProps {
  results: SearchResult[];
  isLoading: boolean;
  recentSearches: string[];
  searchTerm: string;
  selectedIndex: number;
  onResultClick: (result: SearchResult) => void;
  onRecentSearchClick: (term: string) => void;
  onRemoveRecentSearch: (term: string) => void;
  onViewAllResults: () => void;
}

const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  isLoading,
  recentSearches,
  searchTerm,
  selectedIndex,
  onResultClick,
  onRecentSearchClick,
  onRemoveRecentSearch,
  onViewAllResults,
}) => {
  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const categories = Object.keys(groupedResults);

  if (isLoading) {
    return (
      <Paper
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          p: 3,
          zIndex: 1300,
          maxHeight: 400,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Searching...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!searchTerm.trim() && recentSearches.length === 0) {
    return null;
  }

  if (!searchTerm.trim() && recentSearches.length > 0) {
    return (
      <Paper
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          p: 2,
          zIndex: 1300,
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle2" color="primary">
            Recent Searches
          </Typography>
        </Box>
        <List dense>
          {recentSearches.slice(0, 5).map((term, index) => (
            <ListItem
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&:hover .delete-button': {
                  opacity: 1,
                },
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => onRecentSearchClick(term)}
                sx={{
                  justifyContent: 'flex-start',
                  flex: 1,
                  color: 'text.secondary',
                  textTransform: 'none',
                  minHeight: 'auto',
                  py: 0.5,
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {term}
              </Button>
              <IconButton
                className="delete-button"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRecentSearch(term);
                }}
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'text.disabled',
                  width: 24,
                  height: 24,
                  '&:hover': {
                    color: 'error.main',
                  },
                }}
              >
                <Close fontSize="inherit" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }

  if (searchTerm.trim() && results.length === 0) {
    return (
      <Paper
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          p: 3,
          zIndex: 1300,
          maxHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <SearchOff color="disabled" sx={{ fontSize: 48 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No results found for "{searchTerm}"
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Try adjusting your search terms or check spelling
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        mt: 1,
        zIndex: 1300,
        maxHeight: 500,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        {categories.map((category, categoryIndex) => (
          <Box key={category}>
            {categoryIndex > 0 && <Divider />}

            <Box sx={{ p: 2, pb: 1 }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              >
                {category} ({groupedResults[category].length})
              </Typography>
            </Box>

            <List dense sx={{ px: 1 }}>
              {groupedResults[category].slice(0, 5).map((result, index) => {
                const globalIndex =
                  categories
                    .slice(0, categoryIndex)
                    .reduce((acc, cat) => acc + Math.min(groupedResults[cat].length, 5), 0) + index;

                return (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onClick={() => onResultClick(result)}
                    isSelected={globalIndex === selectedIndex}
                  />
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {results.length > 10 && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button variant="outlined" fullWidth size="small" onClick={onViewAllResults}>
              View All {results.length} Results
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SearchResultsDropdown;
