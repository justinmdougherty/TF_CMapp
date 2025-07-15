import { useEffect, useState, useCallback } from 'react';
import { SearchResult, ActiveFilter, SearchPreset } from '../../types/Search';
import { searchService } from '../../services/searchService';
import { useSearchStore } from '../../store/searchStore';

// Hook for global search functionality
export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    searchTerm,
    activeFilters,
    recentSearches,
    setSearchTerm,
    addRecentSearch,
    removeRecentSearch,
    clearResults,
  } = useSearchStore();

  // Subscribe to search results
  useEffect(() => {
    const unsubscribe = searchService.subscribe((searchResults: SearchResult[]) => {
      setResults(searchResults);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Perform search when term or filters change (auto-search, no recent search addition)
  useEffect(() => {
    if (searchTerm.trim() || activeFilters.length > 0) {
      setIsLoading(true);
      // Auto-search without adding to recent searches
      searchService.debouncedSearch(searchTerm, activeFilters);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [searchTerm, activeFilters]);

  // Search function that can be called directly
  const search = useCallback((term: string, filters: ActiveFilter[] = []) => {
    setIsLoading(true);
    setSearchTerm(term);
    
    if (term.trim()) {
      addRecentSearch(term);
    }
    
    searchService.debouncedSearch(term, filters);
  }, [setSearchTerm, addRecentSearch]);

  // Clear search
  const clear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    clearResults();
    setIsLoading(false);
  }, [setSearchTerm, clearResults]);

  return {
    searchTerm,
    results,
    isLoading,
    recentSearches,
    activeFilters,
    search,
    clear,
    setSearchTerm,
    addRecentSearch,
    removeRecentSearch,
  };
};

// Hook for quick search (no debouncing, for immediate results)
export const useQuickSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const quickSearch = useCallback(async (term: string, filters: ActiveFilter[] = []) => {
    if (!term.trim() && filters.length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Cancel any pending debounced searches
    searchService.debouncedSearch.cancel();
    
    // Perform immediate search
    try {
      const searchResults = await (searchService as any).performSearch(term, filters);
      setResults(searchResults);
    } catch (error) {
      console.error('Quick search failed:', error);
      setResults([]);
    }
    
    setIsLoading(false);
  }, []);

  return {
    results,
    isLoading,
    quickSearch,
  };
};

// Hook for search suggestions (based on recent searches and common terms)
export const useSearchSuggestions = (currentTerm: string) => {
  const { recentSearches, presets } = useSearchStore();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!currentTerm.trim()) {
      // Show recent searches when no term is entered
      setSuggestions(recentSearches.slice(0, 5));
      return;
    }

    // Filter recent searches and presets based on current term
    const filteredRecent = recentSearches.filter((search: string) =>
      search.toLowerCase().includes(currentTerm.toLowerCase())
    );

    const filteredPresets = presets
      .map((preset: SearchPreset) => preset.name)
      .filter((name: string) => name.toLowerCase().includes(currentTerm.toLowerCase()));

    // Combine and limit suggestions
    const combined = [...new Set([...filteredRecent, ...filteredPresets])];
    setSuggestions(combined.slice(0, 8));
  }, [currentTerm, recentSearches, presets]);

  return suggestions;
};

// Hook for managing search filters
export const useSearchFilters = () => {
  const {
    activeFilters,
    availableFilters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
  } = useSearchStore();

  // Get filters by category
  const getFiltersByCategory = useCallback((category: string) => {
    return availableFilters.filter(filter => filter.category === category);
  }, [availableFilters]);

  // Check if a filter is active
  const isFilterActive = useCallback((filterId: string) => {
    return activeFilters.some(filter => filter.filterId === filterId);
  }, [activeFilters]);

  // Get active filter by ID
  const getActiveFilter = useCallback((filterId: string) => {
    return activeFilters.find(filter => filter.filterId === filterId);
  }, [activeFilters]);

  return {
    activeFilters,
    availableFilters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    getFiltersByCategory,
    isFilterActive,
    getActiveFilter,
  };
};
