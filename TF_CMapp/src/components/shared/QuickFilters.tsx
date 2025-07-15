import React from 'react';
import { Box, Chip, Typography, IconButton, Tooltip } from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { ActiveFilter } from '../../types/Search';

interface QuickFiltersProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onClearFilters: () => void;
  onOpenAdvancedFilters: () => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearFilters,
  onOpenAdvancedFilters,
}) => {
  if (activeFilters.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        <Tooltip title="Advanced Filters">
          <IconButton size="small" onClick={onOpenAdvancedFilters} sx={{ color: 'text.secondary' }}>
            <FilterList fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="body2" color="text.disabled">
          Add filters to refine your search
        </Typography>
      </Box>
    );
  }

  const formatFilterLabel = (filter: ActiveFilter) => {
    const baseLabel = filter.filterId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    if (typeof filter.value === 'boolean') {
      return `${baseLabel}: ${filter.value ? 'Yes' : 'No'}`;
    }

    if (Array.isArray(filter.value)) {
      return `${baseLabel}: ${filter.value.join(', ')}`;
    }

    return `${baseLabel}: ${filter.value}`;
  };

  const getFilterColor = (filterId: string) => {
    if (filterId.startsWith('project_')) return 'primary';
    if (filterId.startsWith('inventory_')) return 'secondary';
    return 'default';
  };

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Active Filters:
        </Typography>
        <Tooltip title="Clear All Filters">
          <IconButton size="small" onClick={onClearFilters} sx={{ color: 'text.secondary' }}>
            <Clear fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Advanced Filters">
          <IconButton size="small" onClick={onOpenAdvancedFilters} sx={{ color: 'text.secondary' }}>
            <FilterList fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {activeFilters.map((filter) => (
          <Chip
            key={filter.filterId}
            label={formatFilterLabel(filter)}
            size="small"
            color={getFilterColor(filter.filterId) as any}
            onDelete={() => onRemoveFilter(filter.filterId)}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              '& .MuiChip-deleteIcon': {
                fontSize: '14px',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default QuickFilters;
