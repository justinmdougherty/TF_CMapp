import { SearchFilter, ActiveFilter } from '../types/Search';

// Default search filters configuration
export const defaultSearchFilters: SearchFilter[] = [
  // Project filters
  {
    id: 'project_status',
    field: 'status',
    label: 'Project Status',
    type: 'select',
    category: 'project',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
      { value: 'Planning', label: 'Planning' },
      { value: 'Completed', label: 'Completed' },
      { value: 'Archived', label: 'Archived' },
      { value: 'On Hold', label: 'On Hold' },
    ],
  },
  {
    id: 'project_type',
    field: 'project_type',
    label: 'Project Type',
    type: 'select',
    category: 'project',
    options: [], // Will be populated dynamically
  },
  {
    id: 'project_date_created',
    field: 'date_created',
    label: 'Created Date',
    type: 'dateRange',
    category: 'project',
  },
  
  // Inventory filters
  {
    id: 'inventory_stock_level',
    field: 'current_stock_level',
    label: 'Stock Level',
    type: 'range',
    category: 'inventory',
    min: 0,
    max: 1000,
  },
  {
    id: 'inventory_low_stock',
    field: 'low_stock',
    label: 'Low Stock Items',
    type: 'boolean',
    category: 'inventory',
    description: 'Items below reorder point',
  },
  {
    id: 'inventory_unit',
    field: 'unit_of_measure',
    label: 'Unit of Measure',
    type: 'select',
    category: 'inventory',
    options: [
      { value: 'Each', label: 'Each' },
      { value: 'Pound', label: 'Pound' },
      { value: 'Foot', label: 'Foot' },
      { value: 'Inch', label: 'Inch' },
      { value: 'Set', label: 'Set' },
    ],
  },
  
  // General filters
  {
    id: 'general_content_type',
    field: 'type',
    label: 'Content Type',
    type: 'multiSelect',
    category: 'general',
    options: [
      { value: 'project', label: 'Projects' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'navigation', label: 'Navigation' },
    ],
  },
];

// Search utility functions
export class SearchUtils {
  // Get filters by category
  static getFiltersByCategory(filters: SearchFilter[], category: string): SearchFilter[] {
    return filters.filter(filter => filter.category === category);
  }
  
  // Create active filter from search filter
  static createActiveFilter(
    filter: SearchFilter, 
    value: any, 
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in' = 'equals'
  ): ActiveFilter {
    return {
      filterId: filter.id,
      value,
      operator,
    };
  }
  
  // Validate filter value
  static validateFilterValue(filter: SearchFilter, value: any): boolean {
    switch (filter.type) {
      case 'text':
        return typeof value === 'string';
      case 'number':
      case 'range':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
      case 'dateRange':
        return value instanceof Date || typeof value === 'string';
      case 'select':
        return filter.options?.some(option => option.value === value) ?? false;
      case 'multiSelect':
        return Array.isArray(value) && 
               value.every(v => filter.options?.some(option => option.value === v));
      default:
        return true;
    }
  }
  
  // Format filter value for display
  static formatFilterValue(filter: SearchFilter, value: any): string {
    switch (filter.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : String(value);
      case 'dateRange':
        if (Array.isArray(value) && value.length === 2) {
          const [start, end] = value;
          const startStr = start instanceof Date ? start.toLocaleDateString() : String(start);
          const endStr = end instanceof Date ? end.toLocaleDateString() : String(end);
          return `${startStr} - ${endStr}`;
        }
        return String(value);
      case 'select':
        const option = filter.options?.find(opt => opt.value === value);
        return option?.label || String(value);
      case 'multiSelect':
        if (Array.isArray(value)) {
          const labels = value.map(v => {
            const option = filter.options?.find(opt => opt.value === v);
            return option?.label || String(v);
          });
          return labels.join(', ');
        }
        return String(value);
      default:
        return String(value);
    }
  }
  
  // Get suggested operators for a filter type
  static getSuggestedOperators(filterType: string): Array<{value: string, label: string}> {
    switch (filterType) {
      case 'text':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
        ];
      case 'number':
      case 'range':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater', label: 'Greater than' },
          { value: 'less', label: 'Less than' },
          { value: 'between', label: 'Between' },
        ];
      case 'date':
      case 'dateRange':
        return [
          { value: 'equals', label: 'On' },
          { value: 'greater', label: 'After' },
          { value: 'less', label: 'Before' },
          { value: 'between', label: 'Between' },
        ];
      case 'boolean':
        return [
          { value: 'equals', label: 'Is' },
        ];
      case 'select':
      case 'multiSelect':
        return [
          { value: 'equals', label: 'Is' },
          { value: 'in', label: 'Is any of' },
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
        ];
    }
  }
  
  // Build search URL with filters
  static buildSearchUrl(searchTerm: string, filters: ActiveFilter[]): string {
    const params = new URLSearchParams();
    
    if (searchTerm.trim()) {
      params.append('q', searchTerm);
    }
    
    filters.forEach((filter, index) => {
      params.append(`filter[${index}][id]`, filter.filterId);
      params.append(`filter[${index}][value]`, String(filter.value));
      params.append(`filter[${index}][operator]`, filter.operator || 'equals');
    });
    
    return `/search?${params.toString()}`;
  }
  
  // Parse search URL to extract term and filters
  static parseSearchUrl(url: string): { term: string; filters: ActiveFilter[] } {
    const urlObj = new URL(url, window.location.origin);
    const params = urlObj.searchParams;
    
    const term = params.get('q') || '';
    const filters: ActiveFilter[] = [];
    
    // Parse filter parameters
    let index = 0;
    while (params.has(`filter[${index}][id]`)) {
      const filterId = params.get(`filter[${index}][id]`);
      const value = params.get(`filter[${index}][value]`);
      const operatorParam = params.get(`filter[${index}][operator]`) || 'equals';
      
      // Validate operator
      const validOperators: Array<'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'> = 
        ['equals', 'contains', 'greater', 'less', 'between', 'in'];
      const operator = validOperators.includes(operatorParam as any) 
        ? operatorParam as 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
        : 'equals';
      
      if (filterId && value !== null) {
        filters.push({
          filterId,
          value,
          operator,
        });
      }
      
      index++;
    }
    
    return { term, filters };
  }
}

// Search keyboard shortcuts
export const searchKeyboardShortcuts = {
  globalSearch: 'Ctrl+K',
  clearSearch: 'Escape',
  nextResult: 'ArrowDown',
  prevResult: 'ArrowUp',
  selectResult: 'Enter',
  toggleFilters: 'Ctrl+F',
};

// Search analytics events (for future implementation)
export const searchAnalytics = {
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  RESULT_CLICKED: 'result_clicked',
  PRESET_SAVED: 'preset_saved',
  PRESET_LOADED: 'preset_loaded',
};
