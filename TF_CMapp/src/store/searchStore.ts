import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchState, SearchResult, ActiveFilter, SearchPreset, AdvancedFilter } from '../types/Search';

interface SearchStore extends SearchState {
  // Search actions
  setSearchTerm: (term: string) => void;
  setIsSearching: (searching: boolean) => void;
  setResults: (results: SearchResult[]) => void;
  clearResults: () => void;
  
  // Recent searches
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  
  // Filters
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (filterId: string) => void;
  updateFilter: (filterId: string, value: any) => void;
  clearFilters: () => void;
  toggleAdvancedFilters: () => void;
  
  // Advanced filters
  setCurrentAdvancedFilter: (filter?: AdvancedFilter) => void;
  setIsAdvancedFilterModalOpen: (open: boolean) => void;
  
  // Presets
  savePreset: (preset: Omit<SearchPreset, 'id' | 'createdAt'>) => void;
  deletePreset: (presetId: string) => void;
  loadPreset: (presetId: string) => void;
  setSelectedPreset: (presetId?: string) => void;
  
  // Utilities
  reset: () => void;
}

const initialState: SearchState = {
  searchTerm: '',
  isSearching: false,
  results: [],
  recentSearches: [],
  activeFilters: [],
  availableFilters: [],
  presets: [],
  selectedPreset: undefined,
  showAdvancedFilters: false,
  lastSearchTime: undefined,
  // Advanced filter state
  currentAdvancedFilter: undefined,
  filterTemplates: [],
  isAdvancedFilterModalOpen: false,
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // One-time cleanup of old partial searches from previous implementation
      recentSearches: [],
      
      // Search actions
      setSearchTerm: (term: string) => {
        set({ searchTerm: term });
        // Note: Recent searches are now added only on actual search execution
      },
      
      setIsSearching: (searching: boolean) => set({ isSearching: searching }),
      
      setResults: (results: SearchResult[]) => 
        set({ results, lastSearchTime: new Date() }),
      
      clearResults: () => set({ results: [] }),
      
      // Recent searches
      addRecentSearch: (term: string) => {
        const trimmed = term.trim();
        
        // Quality checks for recent searches
        if (
          trimmed.length < 2 || // Too short
          trimmed.length > 50 || // Too long
          /^\s*$/.test(trimmed) || // Only whitespace
          /^[^a-zA-Z0-9]+$/.test(trimmed) // Only special characters
        ) {
          return; // Don't add poor quality searches
        }
        
        const { recentSearches } = get();
        const filtered = recentSearches.filter(search => search !== trimmed);
        const updated = [trimmed, ...filtered].slice(0, 10); // Keep max 10 recent searches
        set({ recentSearches: updated });
      },
      
      removeRecentSearch: (term: string) => {
        const { recentSearches } = get();
        const updated = recentSearches.filter(search => search !== term);
        set({ recentSearches: updated });
      },
      
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      // Filters
      addFilter: (filter: ActiveFilter) => {
        const { activeFilters } = get();
        const existing = activeFilters.find(f => f.filterId === filter.filterId);
        if (existing) {
          // Update existing filter
          const updated = activeFilters.map(f => 
            f.filterId === filter.filterId ? filter : f
          );
          set({ activeFilters: updated });
        } else {
          // Add new filter
          set({ activeFilters: [...activeFilters, filter] });
        }
      },
      
      removeFilter: (filterId: string) => {
        const { activeFilters } = get();
        set({ activeFilters: activeFilters.filter(f => f.filterId !== filterId) });
      },
      
      updateFilter: (filterId: string, value: any) => {
        const { activeFilters } = get();
        const updated = activeFilters.map(f => 
          f.filterId === filterId ? { ...f, value } : f
        );
        set({ activeFilters: updated });
      },
      
      clearFilters: () => set({ activeFilters: [] }),
      
      toggleAdvancedFilters: () => 
        set(state => ({ showAdvancedFilters: !state.showAdvancedFilters })),
      
      // Advanced filters
      setCurrentAdvancedFilter: (filter?: AdvancedFilter) => 
        set({ currentAdvancedFilter: filter }),
      
      setIsAdvancedFilterModalOpen: (open: boolean) => 
        set({ isAdvancedFilterModalOpen: open }),
      
      // Presets
      savePreset: (preset: Omit<SearchPreset, 'id' | 'createdAt'>) => {
        const { presets } = get();
        const newPreset: SearchPreset = {
          ...preset,
          id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        set({ presets: [...presets, newPreset] });
      },
      
      deletePreset: (presetId: string) => {
        const { presets, selectedPreset } = get();
        const updated = presets.filter(p => p.id !== presetId);
        const newSelectedPreset = selectedPreset === presetId ? undefined : selectedPreset;
        set({ presets: updated, selectedPreset: newSelectedPreset });
      },
      
      loadPreset: (presetId: string) => {
        const { presets } = get();
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
          set({
            searchTerm: preset.searchTerm,
            activeFilters: preset.filters,
            selectedPreset: presetId,
          });
        }
      },
      
      setSelectedPreset: (presetId?: string) => set({ selectedPreset: presetId }),
      
      // Utilities
      reset: () => set(initialState),
    }),
    {
      name: 'search-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        presets: state.presets,
        availableFilters: state.availableFilters,
        filterTemplates: state.filterTemplates,
      }),
    }
  )
);
