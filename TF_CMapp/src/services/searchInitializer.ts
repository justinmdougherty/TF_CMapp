import { useSearchStore } from '../store/searchStore';
import { defaultSearchFilters } from '../utils/searchUtils';

// Initialize search system with default configuration
export const initializeSearchSystem = () => {
  const { reset } = useSearchStore.getState();
  
  // Reset store to clean state
  reset();
  
  // Initialize with default filters
  useSearchStore.setState({
    availableFilters: defaultSearchFilters,
  });
  
  console.log('Search system initialized with', defaultSearchFilters.length, 'default filters');
};

// Get search system status
export const getSearchSystemStatus = () => {
  const state = useSearchStore.getState();
  
  return {
    isInitialized: state.availableFilters.length > 0,
    filtersCount: state.availableFilters.length,
    presetsCount: state.presets.length,
    recentSearchesCount: state.recentSearches.length,
  };
};

// Search system ready check
export const isSearchSystemReady = (): boolean => {
  const state = useSearchStore.getState();
  return state.availableFilters.length > 0;
};
