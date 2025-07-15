// Search types and interfaces for global search functionality

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'inventory' | 'navigation' | 'step';
  category: string;
  url?: string;
  metadata?: Record<string, any>;
  score?: number; // For fuzzy search ranking
}

export interface SearchFilter {
  id: string;
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'range' | 'boolean' | 'multiSelect';
  category: 'project' | 'inventory' | 'general';
  options?: { label: string; value: any }[];
  defaultValue?: any;
  min?: number;
  max?: number;
  description?: string;
}

// Enhanced filter operators for advanced filtering
export type FilterOperator = 
  | 'equals' 
  | 'notEquals'
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greater' 
  | 'greaterEqual'
  | 'less' 
  | 'lessEqual'
  | 'between' 
  | 'notBetween'
  | 'in' 
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'regex';

// Logical operators for combining filter conditions
export type LogicalOperator = 'AND' | 'OR';

export interface ActiveFilter {
  filterId: string;
  value: any;
  operator?: FilterOperator;
}

// Enhanced filter condition for complex logic
export interface FilterCondition {
  id: string;
  filterId: string;
  value: any;
  operator: FilterOperator;
  enabled: boolean;
}

// Filter group for organizing conditions with logical operators
export interface FilterGroup {
  id: string;
  name?: string;
  conditions: FilterCondition[];
  logicalOperator: LogicalOperator; // How conditions within this group are combined
  enabled: boolean;
}

// Advanced filter configuration
export interface AdvancedFilter {
  id: string;
  name: string;
  description?: string;
  groups: FilterGroup[];
  groupLogicalOperator: LogicalOperator; // How groups are combined
  createdAt: Date;
  modifiedAt: Date;
}

export interface SearchPreset {
  id: string;
  name: string;
  description?: string;
  searchTerm: string;
  filters: ActiveFilter[];
  advancedFilter?: AdvancedFilter; // Optional advanced filter configuration
  createdAt: Date;
  isDefault?: boolean;
}

// Filter preset template for quick setup
export interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'inventory' | 'general' | 'custom';
  icon?: string;
  advancedFilter: Omit<AdvancedFilter, 'id' | 'createdAt' | 'modifiedAt'>;
}

export interface SearchState {
  searchTerm: string;
  isSearching: boolean;
  results: SearchResult[];
  recentSearches: string[];
  activeFilters: ActiveFilter[];
  availableFilters: SearchFilter[];
  presets: SearchPreset[];
  selectedPreset?: string;
  showAdvancedFilters: boolean;
  lastSearchTime?: Date;
  // Advanced filter state
  currentAdvancedFilter?: AdvancedFilter;
  filterTemplates: FilterTemplate[];
  isAdvancedFilterModalOpen: boolean;
}

export interface SearchConfig {
  debounceMs: number;
  maxResults: number;
  maxRecentSearches: number;
  fuzzyThreshold: number;
  searchableFields: Record<string, string[]>; // content type -> fields to search
}

// Validation result for filter conditions
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Filter statistics for UI display
export interface FilterStats {
  totalResults: number;
  resultsWithoutFilters: number;
  filterReduction: number; // Percentage reduction in results
  executionTime: number; // Filter execution time in ms
}
