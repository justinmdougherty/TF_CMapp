import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import { Add, ExpandMore, AccountTree, Speed, Timer, TrendingDown } from '@mui/icons-material';
import {
  AdvancedFilter,
  FilterGroup,
  SearchFilter,
  FilterStats,
  LogicalOperator,
} from '../../types/Search';
import FilterGroupComponent from './FilterGroup';

interface FilterBuilderProps {
  filter: AdvancedFilter;
  availableFilters: SearchFilter[];
  onChange: (filter: AdvancedFilter) => void;
  isPreviewMode?: boolean;
  filterStats?: FilterStats | null;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filter,
  availableFilters,
  onChange,
  isPreviewMode = false,
  filterStats,
}) => {
  const handleNameChange = (name: string) => {
    onChange({
      ...filter,
      name,
      modifiedAt: new Date(),
    });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({
      ...filter,
      description,
      modifiedAt: new Date(),
    });
  };

  const handleGroupLogicalOperatorChange = (operator: LogicalOperator) => {
    onChange({
      ...filter,
      groupLogicalOperator: operator,
      modifiedAt: new Date(),
    });
  };

  const handleGroupUpdate = (groupIndex: number, updatedGroup: FilterGroup) => {
    const newGroups = [...filter.groups];
    newGroups[groupIndex] = updatedGroup;

    onChange({
      ...filter,
      groups: newGroups,
      modifiedAt: new Date(),
    });
  };

  const handleAddGroup = () => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Group ${filter.groups.length + 1}`,
      conditions: [],
      logicalOperator: 'AND',
      enabled: true,
    };

    onChange({
      ...filter,
      groups: [...filter.groups, newGroup],
      modifiedAt: new Date(),
    });
  };

  const handleRemoveGroup = (groupIndex: number) => {
    if (filter.groups.length <= 1) return; // Keep at least one group

    const newGroups = filter.groups.filter((_, index) => index !== groupIndex);

    onChange({
      ...filter,
      groups: newGroups,
      modifiedAt: new Date(),
    });
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Filter Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Filter Name"
              value={filter.name}
              onChange={(e) => handleNameChange(e.target.value)}
              fullWidth
              size="small"
              disabled={isPreviewMode}
            />

            <TextField
              label="Description (Optional)"
              value={filter.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              disabled={isPreviewMode}
            />

            {/* Group Logical Operator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Combine groups using:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={filter.groupLogicalOperator}
                  onChange={(e) =>
                    handleGroupLogicalOperatorChange(e.target.value as LogicalOperator)
                  }
                  disabled={isPreviewMode || filter.groups.length <= 1}
                >
                  <MenuItem value="AND">AND</MenuItem>
                  <MenuItem value="OR">OR</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {filter.groupLogicalOperator === 'AND'
                  ? 'All groups must match'
                  : 'Any group can match'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Preview Stats */}
      {isPreviewMode && filterStats && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<Speed />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTree fontSize="small" />
              <Typography variant="body2">
                <strong>{filterStats.totalResults}</strong> results found
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer fontSize="small" />
              <Typography variant="body2">
                {filterStats.executionTime.toFixed(1)}ms execution time
              </Typography>
            </Box>
            {filterStats.filterReduction > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown fontSize="small" />
                <Typography variant="body2">
                  {filterStats.filterReduction.toFixed(1)}% reduction
                </Typography>
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {/* Filter Groups */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Filter Groups</Typography>
          {!isPreviewMode && (
            <Button startIcon={<Add />} onClick={handleAddGroup} size="small" variant="outlined">
              Add Group
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          {filter.groups.map((group, index) => (
            <Box key={group.id}>
              {/* Group Separator */}
              {index > 0 && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}
                >
                  <Chip
                    label={filter.groupLogicalOperator}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}

              {/* Filter Group */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1">
                      {group.name || `Group ${index + 1}`}
                    </Typography>
                    <Chip
                      label={`${group.conditions.filter((c) => c.enabled).length} conditions`}
                      size="small"
                      color={group.enabled ? 'primary' : 'default'}
                    />
                    {!group.enabled && <Chip label="Disabled" size="small" color="warning" />}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <FilterGroupComponent
                    group={group}
                    availableFilters={availableFilters}
                    onChange={(updatedGroup: FilterGroup) => handleGroupUpdate(index, updatedGroup)}
                    onRemove={filter.groups.length > 1 ? () => handleRemoveGroup(index) : undefined}
                    isPreviewMode={isPreviewMode}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
        </Stack>

        {filter.groups.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography>
              No filter groups defined. Click "Add Group" to create your first filter group.
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default FilterBuilder;
