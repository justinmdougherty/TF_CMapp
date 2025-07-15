# Global Search System

This document outlines the comprehensive global search system implemented for the TF Manufacturing Production Application.

## Overview

The global search system provides unified search across projects, inventory items, and navigation elements with advanced filtering capabilities, saved presets, and real-time results.

## Architecture

### Core Components

1. **Types** (`src/types/Search.ts`)
   - `SearchResult`: Represents a search result with metadata
   - `SearchFilter`: Configuration for available filters
   - `ActiveFilter`: Currently applied filters
   - `SearchPreset`: Saved search configurations
   - `SearchState`: Global search state interface

2. **State Management** (`src/store/searchStore.ts`)
   - Zustand store with persistence
   - Manages search term, results, filters, and presets
   - Automatically saves preferences to localStorage

3. **Search Service** (`src/services/searchService.ts`)
   - Core search logic with debouncing
   - Fuzzy search algorithm for relevance scoring
   - Multi-source search (projects, inventory, navigation)
   - Subscription-based result delivery

4. **React Hooks** (`src/hooks/api/useGlobalSearch.ts`)
   - `useGlobalSearch`: Main search functionality
   - `useQuickSearch`: Immediate search without debouncing
   - `useSearchSuggestions`: Search suggestions and recent searches
   - `useSearchFilters`: Filter management utilities

5. **Utilities** (`src/utils/searchUtils.ts`)
   - Default filter configurations
   - Search utility functions
   - URL serialization for shareable searches
   - Filter validation and formatting

6. **Initializer** (`src/services/searchInitializer.ts`)
   - System initialization with default filters
   - Health check functions

## Features

### Search Capabilities

- **Multi-source Search**: Projects, inventory items, navigation
- **Fuzzy Matching**: Intelligent text matching with relevance scoring
- **Debounced Input**: 300ms debouncing for smooth performance
- **Real-time Results**: Subscription-based result updates

### Filtering System

- **Dynamic Filters**: Project status, type, dates, stock levels
- **Filter Types**: Text, select, multiselect, date ranges, numbers
- **Filter Operators**: equals, contains, greater than, less than, between, in
- **Category Organization**: Project, inventory, general filters

### Advanced Features

- **Saved Presets**: Save and load common search configurations
- **Recent Searches**: Track and suggest recent search terms
- **URL Serialization**: Shareable search URLs with filters
- **Keyboard Shortcuts**: Quick access via Ctrl+K

## Usage

### Basic Search

```typescript
import { useGlobalSearch } from '../hooks/api/useGlobalSearch';

function SearchComponent() {
  const { searchTerm, results, isLoading, search, clear } = useGlobalSearch();
  
  const handleSearch = (term: string) => {
    search(term);
  };
  
  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search projects, inventory..."
      />
      {isLoading && <div>Searching...</div>}
      {results.map(result => (
        <div key={result.id}>
          <h3>{result.title}</h3>
          <p>{result.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Advanced Filtering

```typescript
import { useSearchFilters } from '../hooks/api/useGlobalSearch';

function FilterComponent() {
  const { 
    activeFilters, 
    availableFilters, 
    addFilter, 
    removeFilter,
    getFiltersByCategory 
  } = useSearchFilters();
  
  const projectFilters = getFiltersByCategory('project');
  
  return (
    <div>
      {projectFilters.map(filter => (
        <FilterControl 
          key={filter.id}
          filter={filter}
          onApply={(value) => addFilter({
            filterId: filter.id,
            value,
            operator: 'equals'
          })}
        />
      ))}
    </div>
  );
}
```

### Search Presets

```typescript
import { useSearchStore } from '../store/searchStore';

function PresetComponent() {
  const { presets, savePreset, loadPreset } = useSearchStore();
  
  const handleSavePreset = () => {
    savePreset({
      name: 'Low Stock Items',
      description: 'Items below reorder point',
      searchTerm: '',
      filters: [{
        filterId: 'inventory_low_stock',
        value: true,
        operator: 'equals'
      }]
    });
  };
  
  return (
    <div>
      <button onClick={handleSavePreset}>Save Current Search</button>
      {presets.map(preset => (
        <button 
          key={preset.id}
          onClick={() => loadPreset(preset.id)}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
```

## Configuration

### Available Filters

The system comes with pre-configured filters:

**Project Filters:**
- Status: Active, Inactive, Planning, Completed, Archived, On Hold
- Type: Dynamic based on available project types
- Created Date: Date range picker

**Inventory Filters:**
- Stock Level: Numeric range
- Low Stock: Boolean for items below reorder point
- Unit of Measure: Select from predefined units

**General Filters:**
- Content Type: Multi-select for result types

### Customization

Add new filters by extending the `defaultSearchFilters` array in `searchUtils.ts`:

```typescript
{
  id: 'custom_filter',
  field: 'custom_field',
  label: 'Custom Filter',
  type: 'select',
  category: 'project',
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]
}
```

## Performance Considerations

- **Debouncing**: 300ms delay prevents excessive API calls
- **Result Limiting**: Maximum 50 results to maintain performance
- **Lazy Loading**: Search service only fetches when needed
- **Memory Management**: Automatic cleanup of subscriptions

## Integration

### Initialization

Initialize the search system in your app startup:

```typescript
import { initializeSearchSystem } from '../services/searchInitializer';

// In your App.tsx or main initialization
useEffect(() => {
  initializeSearchSystem();
}, []);
```

### API Integration

The search service expects these API endpoints:
- `GET /api/projects` - Returns project array
- `GET /api/inventory-items` - Returns inventory array

Ensure your API responses match the expected data structures defined in `Project.ts` and `Inventory.ts`.

## Future Enhancements

1. **Elasticsearch Integration**: For large datasets
2. **Search Analytics**: Track search patterns and performance
3. **AI-Powered Suggestions**: Machine learning for better recommendations
4. **Voice Search**: Speech-to-text integration
5. **Mobile Optimization**: Touch-friendly search interface

## Troubleshooting

### Common Issues

1. **No Search Results**: Check API endpoints are responding correctly
2. **Slow Search**: Verify debouncing is working and results are limited
3. **Filter Not Working**: Ensure filter field names match data structure
4. **Persistence Issues**: Check localStorage permissions and quota

### Debug Mode

Enable debug logging by setting:
```typescript
localStorage.setItem('search-debug', 'true');
```

This will log search operations and performance metrics to the console.
