import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { FilterGroup, FilterCondition, SearchFilter, LogicalOperator } from '../../types/Search';
import FilterConditionComponent from './FilterCondition';

interface FilterGroupProps {
  group: FilterGroup;
  availableFilters: SearchFilter[];
  onChange: (group: FilterGroup) => void;
  onRemove?: () => void;
  isPreviewMode?: boolean;
}

const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  availableFilters,
  onChange,
  onRemove,
  isPreviewMode = false,
}) => {
  const handleGroupNameChange = (name: string) => {
    onChange({
      ...group,
      name,
    });
  };

  const handleGroupEnabledChange = (enabled: boolean) => {
    onChange({
      ...group,
      enabled,
    });
  };

  const handleLogicalOperatorChange = (operator: LogicalOperator) => {
    onChange({
      ...group,
      logicalOperator: operator,
    });
  };

  const handleConditionUpdate = (conditionIndex: number, updatedCondition: FilterCondition) => {
    const newConditions = [...group.conditions];
    newConditions[conditionIndex] = updatedCondition;

    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filterId: availableFilters[0]?.id || '',
      value: '',
      operator: 'equals',
      enabled: true,
    };

    onChange({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const handleRemoveCondition = (conditionIndex: number) => {
    const newConditions = group.conditions.filter((_, index) => index !== conditionIndex);

    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const enabledConditions = group.conditions.filter((c) => c.enabled);

  return (
    <Box>
      {/* Group Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <DragIndicator color="disabled" />

        <FormControlLabel
          control={
            <Switch
              checked={group.enabled}
              onChange={(e) => handleGroupEnabledChange(e.target.checked)}
              disabled={isPreviewMode}
            />
          }
          label="Enabled"
        />

        <TextField
          label="Group Name"
          value={group.name || ''}
          onChange={(e) => handleGroupNameChange(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
          disabled={isPreviewMode}
        />

        <Box sx={{ flex: 1 }} />

        {onRemove && !isPreviewMode && (
          <IconButton onClick={onRemove} color="error" size="small" title="Remove Group">
            <Delete />
          </IconButton>
        )}
      </Box>

      {/* Logical Operator */}
      {group.conditions.length > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Combine conditions using:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={group.logicalOperator}
              onChange={(e) => handleLogicalOperatorChange(e.target.value as LogicalOperator)}
              disabled={isPreviewMode}
            >
              <MenuItem value="AND">AND</MenuItem>
              <MenuItem value="OR">OR</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            {group.logicalOperator === 'AND'
              ? 'All conditions must match'
              : 'Any condition can match'}
          </Typography>
        </Box>
      )}

      {/* Conditions */}
      <Stack spacing={2}>
        {group.conditions.map((condition, index) => (
          <Box key={condition.id}>
            {/* Condition Separator */}
            {index > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                <Chip
                  label={group.logicalOperator}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                />
              </Box>
            )}

            {/* Filter Condition */}
            <FilterConditionComponent
              condition={condition}
              availableFilters={availableFilters}
              onChange={(updatedCondition: FilterCondition) =>
                handleConditionUpdate(index, updatedCondition)
              }
              onRemove={() => handleRemoveCondition(index)}
              isPreviewMode={isPreviewMode}
            />
          </Box>
        ))}
      </Stack>

      {/* Add Condition Button */}
      {!isPreviewMode && (
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<Add />}
            onClick={handleAddCondition}
            size="small"
            variant="outlined"
            fullWidth
            disabled={!group.enabled}
          >
            Add Condition
          </Button>
        </Box>
      )}

      {/* Group Status */}
      <Box sx={{ mt: 2 }}>
        {group.conditions.length === 0 ? (
          <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
            This group has no conditions. Add at least one condition to make this group active.
          </Alert>
        ) : enabledConditions.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            All conditions in this group are disabled.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Status:
            </Typography>
            <Chip
              label={`${enabledConditions.length} active condition${
                enabledConditions.length !== 1 ? 's' : ''
              }`}
              size="small"
              color="success"
              variant="outlined"
            />
            {!group.enabled && (
              <Chip label="Group Disabled" size="small" color="warning" variant="outlined" />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FilterGroupComponent;
