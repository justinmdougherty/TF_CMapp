import { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Dialog,
  DialogContent,
  Stack,
  Divider,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Fade,
} from '@mui/material';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { IconSearch, IconX } from '@tabler/icons-react';
import { useGlobalSearch, useSearchFilters } from '../../../../hooks/api/useGlobalSearch';
import { SearchResult, AdvancedFilter } from '../../../../types/Search';
import SearchResultsDropdown from '../../../../components/shared/SearchResultsDropdown';
import QuickFilters from '../../../../components/shared/QuickFilters';
import AdvancedFilterModal from '../../../../components/shared/AdvancedFilterModal';
import { useNavigate } from 'react-router';
import { useSearchStore } from '../../../../store/searchStore';

const Search = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const {
    searchTerm,
    results,
    isLoading,
    recentSearches,
    clear,
    setSearchTerm,
    addRecentSearch,
    removeRecentSearch,
  } = useGlobalSearch();

  const { activeFilters, removeFilter, clearFilters } = useSearchFilters();

  const {
    isAdvancedFilterModalOpen,
    currentAdvancedFilter,
    setIsAdvancedFilterModalOpen,
    setCurrentAdvancedFilter,
  } = useSearchStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowDialog(true);
      }

      // Escape to close
      if (event.key === 'Escape' && showDialog) {
        handleDialogClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDialog]);

  // Handle navigation within results
  useEffect(() => {
    if (!showDialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : prev));
      } else if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDialog, results, selectedIndex]);

  const handleDialogOpen = () => {
    setShowDialog(true);
    // Focus the input after dialog opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setSelectedIndex(-1);
    clear();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value); // This will trigger auto-search via useEffect, no recent search addition
    setSelectedIndex(-1);
  };

  const handleSearchCommit = (term: string = searchTerm) => {
    // Only add to recent searches when user commits to a search
    if (term.trim()) {
      addRecentSearch(term.trim()); // Manually add to recent searches
    }
  };

  const handleResultClick = (result: SearchResult) => {
    handleDialogClose();
    // Add to recent searches when user clicks a result
    handleSearchCommit();
    if (result.url) {
      navigate(result.url);
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term); // Set the term
    handleSearchCommit(term); // Add to recent searches (move to top)
    setSelectedIndex(-1);
  };

  const handleViewAllResults = () => {
    // Navigate to a dedicated search results page
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    handleDialogClose();
  };

  const handleAdvancedFilters = () => {
    setIsAdvancedFilterModalOpen(true);
  };

  const handleAdvancedFilterApply = (filter: AdvancedFilter) => {
    setCurrentAdvancedFilter(filter);
    // TODO: Convert advanced filter to simple filters and apply to search
    console.log('Applied advanced filter:', filter);
  };

  const handleAdvancedFilterClose = () => {
    setIsAdvancedFilterModalOpen(false);
  };

  return (
    <>
      <IconButton
        aria-label="Global Search"
        color="inherit"
        aria-controls="search-dialog"
        aria-haspopup="true"
        onClick={handleDialogOpen}
        size="large"
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <IconSearch size="20" />
      </IconButton>

      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="global-search-dialog"
        PaperProps={{
          sx: {
            position: 'fixed',
            top: 80,
            m: 0,
            borderRadius: 2,
            overflow: 'visible',
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          {/* Search Input */}
          <Box sx={{ p: 3, pb: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                inputRef={searchInputRef}
                placeholder="Search projects, inventory, and more..."
                fullWidth
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedIndex === -1) {
                    // User pressed Enter without selecting a specific result
                    handleSearchCommit();
                  }
                }}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size="20" />
                    </InputAdornment>
                  ),
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  },
                }}
                inputProps={{
                  'aria-label': 'Global search input',
                }}
              />
              <IconButton
                size="small"
                onClick={handleDialogClose}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <IconX size="18" />
              </IconButton>
            </Stack>

            {/* Quick Filters */}
            <QuickFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearFilters={clearFilters}
              onOpenAdvancedFilters={handleAdvancedFilters}
            />
          </Box>

          <Divider />

          {/* Search Results */}
          <Box sx={{ position: 'relative', minHeight: 60 }}>
            <SearchResultsDropdown
              results={results}
              isLoading={isLoading}
              recentSearches={recentSearches}
              searchTerm={searchTerm}
              selectedIndex={selectedIndex}
              onResultClick={handleResultClick}
              onRecentSearchClick={handleRecentSearchClick}
              onRemoveRecentSearch={removeRecentSearch}
              onViewAllResults={handleViewAllResults}
            />
          </Box>

          {/* Keyboard Shortcuts Help */}
          <Box
            sx={{
              p: 2,
              pt: 1,
              backgroundColor: 'grey.50',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 2 }}>
              <span>
                <strong>↑↓</strong> Navigate
              </span>
              <span>
                <strong>Enter</strong> Select
              </span>
              <span>
                <strong>Esc</strong> Close
              </span>
              <span>
                <strong>Ctrl+K</strong> Search
              </span>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        open={isAdvancedFilterModalOpen}
        onClose={handleAdvancedFilterClose}
        onApply={handleAdvancedFilterApply}
        initialFilter={currentAdvancedFilter}
      />
    </>
  );
};

export default Search;
