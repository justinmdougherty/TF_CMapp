import { debounce } from 'lodash';
import { SearchResult, SearchConfig, ActiveFilter } from '../types/Search';
import { Project } from '../types/Project';
import { InventoryItem } from '../types/Inventory';

// Search configuration
const searchConfig: SearchConfig = {
  debounceMs: 300,
  maxResults: 50,
  maxRecentSearches: 10,
  fuzzyThreshold: 0.3,
  searchableFields: {
    project: ['project_name', 'project_description', 'project_type'],
    inventory: ['item_name', 'description', 'part_number'],
    navigation: ['title', 'href'],
  },
};

class SearchService {
  private searchCallbacks: Set<(results: SearchResult[]) => void> = new Set();
  
  // Debounced search function
  public debouncedSearch = debounce(async (term: string, filters: ActiveFilter[]) => {
    if (!term.trim() && filters.length === 0) {
      this.notifyCallbacks([]);
      return;
    }
    
    try {
      const results = await this.performSearch(term, filters);
      this.notifyCallbacks(results);
    } catch (error) {
      console.error('Search failed:', error);
      this.notifyCallbacks([]);
    }
  }, searchConfig.debounceMs);
  
  // Subscribe to search results
  public subscribe(callback: (results: SearchResult[]) => void) {
    this.searchCallbacks.add(callback);
    return () => this.searchCallbacks.delete(callback);
  }
  
  // Perform the actual search
  private async performSearch(term: string, filters: ActiveFilter[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Search projects
    const projectResults = await this.searchProjects(term, filters);
    results.push(...projectResults);
    
    // Search inventory
    const inventoryResults = await this.searchInventory(term, filters);
    results.push(...inventoryResults);
    
    // Search navigation (if term is provided)
    if (term.trim()) {
      const navResults = this.searchNavigation(term);
      results.push(...navResults);
    }
    
    // Sort by relevance score and limit results
    const sortedResults = results
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, searchConfig.maxResults);
    
    return sortedResults;
  }
  
  // Search projects
  private async searchProjects(term: string, filters: ActiveFilter[]): Promise<SearchResult[]> {
    try {
      // Get projects from API
      const response = await fetch('/api/projects');
      if (!response.ok) return [];
      
      const projects: Project[] = await response.json();
      
      return projects
        .map(project => this.projectToSearchResult(project, term))
        .filter(result => result.score && result.score > 0)
        .filter(result => this.applyFilters(result, filters, 'project'));
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
  
  // Search inventory
  private async searchInventory(term: string, filters: ActiveFilter[]): Promise<SearchResult[]> {
    try {
      // Get inventory from API
      const response = await fetch('/api/inventory-items');
      if (!response.ok) return [];
      
      const inventory: InventoryItem[] = await response.json();
      
      return inventory
        .map(item => this.inventoryToSearchResult(item, term))
        .filter(result => result.score && result.score > 0)
        .filter(result => this.applyFilters(result, filters, 'inventory'));
    } catch (error) {
      console.error('Failed to search inventory:', error);
      return [];
    }
  }
  
  // Search navigation items
  private searchNavigation(term: string): SearchResult[] {
    // Import menu items dynamically to avoid circular imports
    const menuItems = this.getMenuItems();
    
    return menuItems
      .map(item => this.navigationToSearchResult(item, term))
      .filter(result => result.score && result.score > 0);
  }
  
  // Convert project to search result
  private projectToSearchResult(project: Project, term: string): SearchResult {
    const searchableText = [
      project.project_name,
      project.project_description || '',
      project.project_type || '',
    ].join(' ').toLowerCase();
    
    const score = this.calculateScore(searchableText, term.toLowerCase());
    
    return {
      id: `project_${project.project_id}`,
      title: project.project_name,
      description: project.project_description || `${project.project_type} project`,
      type: 'project',
      category: 'Projects',
      url: `/project/${project.project_id}`,
      metadata: {
        project_type: project.project_type,
        status: project.status,
        date_created: project.date_created,
      },
      score,
    };
  }
  
  // Convert inventory item to search result
  private inventoryToSearchResult(item: InventoryItem, term: string): SearchResult {
    const searchableText = [
      item.item_name,
      item.description || '',
      item.part_number || '',
    ].join(' ').toLowerCase();
    
    const score = this.calculateScore(searchableText, term.toLowerCase());
    
    return {
      id: `inventory_${item.inventory_item_id}`,
      title: item.item_name,
      description: item.description || `Part: ${item.part_number}`,
      type: 'inventory',
      category: 'Inventory',
      url: '/inventory',
      metadata: {
        part_number: item.part_number,
        current_stock_level: item.current_stock_level,
        reorder_point: item.reorder_point,
        unit_of_measure: item.unit_of_measure,
      },
      score,
    };
  }
  
  // Convert navigation item to search result
  private navigationToSearchResult(item: any, term: string): SearchResult {
    const searchableText = [item.title || '', item.href || ''].join(' ').toLowerCase();
    const score = this.calculateScore(searchableText, term.toLowerCase());
    
    return {
      id: `nav_${item.id}`,
      title: item.title,
      description: `Navigate to ${item.href}`,
      type: 'navigation',
      category: 'Navigation',
      url: item.href,
      metadata: {},
      score,
    };
  }
  
  // Simple fuzzy search scoring algorithm
  private calculateScore(text: string, term: string): number {
    if (!term.trim()) return 0;
    
    const words = term.toLowerCase().split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (text.includes(word)) {
        // Exact word match
        score += 10;
      } else {
        // Check for partial matches
        for (let i = 0; i <= text.length - word.length; i++) {
          const substring = text.substring(i, i + word.length);
          const similarity = this.calculateSimilarity(substring, word);
          if (similarity > searchConfig.fuzzyThreshold) {
            score += similarity * 5;
          }
        }
      }
    }
    
    return score;
  }
  
  // Calculate string similarity (simple Levenshtein-based)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  // Levenshtein distance algorithm
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Apply filters to search results
  private applyFilters(result: SearchResult, filters: ActiveFilter[], type: string): boolean {
    if (filters.length === 0) return true;
    
    const relevantFilters = filters.filter(f => 
      f.filterId.startsWith(type) || f.filterId.startsWith('general')
    );
    
    for (const filter of relevantFilters) {
      if (!this.matchesFilter(result, filter)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Check if result matches a specific filter
  private matchesFilter(result: SearchResult, filter: ActiveFilter): boolean {
    const { filterId, value, operator = 'equals' } = filter;
    
    // Extract the field to check based on filter ID
    const field = filterId.split('_').pop();
    if (!field) return true;
    
    const resultValue = result.metadata?.[field] || result[field as keyof SearchResult];
    
    switch (operator) {
      case 'equals':
        return resultValue === value;
      case 'contains':
        return String(resultValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater':
        return Number(resultValue) > Number(value);
      case 'less':
        return Number(resultValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(resultValue);
      default:
        return true;
    }
  }
  
  // Get menu items (simplified for now)
  private getMenuItems(): any[] {
    return [
      { id: '1', title: 'Production Dashboard', href: '/dashboard' },
      { id: '2', title: 'Project Management', href: '/project-management' },
      { id: '3', title: 'Inventory', href: '/inventory' },
      { id: '4', title: 'Calendar', href: '/apps/calendar' },
      { id: '5', title: 'Notes', href: '/apps/notes' },
      { id: '6', title: 'Tickets', href: '/apps/tickets' },
      { id: '7', title: 'Health Dashboard', href: '/system/health' },
    ];
  }
  
  private notifyCallbacks(results: SearchResult[]) {
    this.searchCallbacks.forEach(callback => callback(results));
  }
}

// Export singleton instance
export const searchService = new SearchService();
