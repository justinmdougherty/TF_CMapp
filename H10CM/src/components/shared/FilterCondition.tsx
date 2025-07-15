import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Stack,
  Autocomplete,
} from '@mui/material';
import { Delete, DragIndicator, Warning } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FilterCondition, SearchFilter, FilterOperator } from '../../types/Search';

interface FilterConditionProps {
  condition: FilterCondition;
  availableFilters: SearchFilter[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  isPreviewMode?: boolean;
}

// Operator options based on filter type
const getOperatorOptions = (filterType: string): { value: FilterOperator; label: string }[] => {
  const baseOptions = [
    { value: 'equals' as FilterOperator, label: 'Equals' },
    { value: 'notEquals' as FilterOperator, label: 'Not Equals' },
  ];

  const textOptions = [
    { value: 'contains' as FilterOperator, label: 'Contains' },
    { value: 'notContains' as FilterOperator, label: 'Does Not Contain' },
    { value: 'startsWith' as FilterOperator, label: 'Starts With' },
    { value: 'endsWith' as FilterOperator, label: 'Ends With' },
    { value: 'isEmpty' as FilterOperator, label: 'Is Empty' },
    { value: 'isNotEmpty' as FilterOperator, label: 'Is Not Empty' },
    { value: 'regex' as FilterOperator, label: 'Matches Pattern' },
  ];

  const numberOptions = [
    { value: 'greater' as FilterOperator, label: 'Greater Than' },
    { value: 'greaterEqual' as FilterOperator, label: 'Greater Than or Equal' },
    { value: 'less' as FilterOperator, label: 'Less Than' },
    { value: 'lessEqual' as FilterOperator, label: 'Less Than or Equal' },
    { value: 'between' as FilterOperator, label: 'Between' },
    { value: 'notBetween' as FilterOperator, label: 'Not Between' },
  ];

  const listOptions = [
    { value: 'in' as FilterOperator, label: 'In List' },
    { value: 'notIn' as FilterOperator, label: 'Not In List' },
  ];

  switch (filterType) {
    case 'text':
      return [...baseOptions, ...textOptions];
    case 'number':
    case 'range':
      return [...baseOptions, ...numberOptions];
    case 'date':
    case 'dateRange':
      return [...baseOptions, ...numberOptions];
    case 'select':
    case 'multiSelect':
      return [...baseOptions, ...listOptions];
    case 'boolean':
      return baseOptions;
    default:
      return baseOptions;
  }
};

const FilterConditionComponent: React.FC<FilterConditionProps> = ({
  condition,
  availableFilters,
  onChange,
  onRemove,
  isPreviewMode = false,
}) => {
  const selectedFilter = availableFilters.find((f) => f.id === condition.filterId);
  const operatorOptions = selectedFilter ? getOperatorOptions(selectedFilter.type) : [];

  const handleFilterChange = (filterId: string) => {
    const filter = availableFilters.find((f) => f.id === filterId);
    onChange({
      ...condition,
      filterId,
      operator: 'equals', // Reset operator when filter changes
      value: filter?.defaultValue || '', // Reset value to default
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({
      ...condition,
      operator,
      value: '', // Reset value when operator changes
    });
  };

  const handleValueChange = (value: any) => {
    onChange({
      ...condition,
      value,
    });
  };

  const handleEnabledChange = (enabled: boolean) => {
    onChange({
      ...condition,
      enabled,
    });
  };

  const renderValueInput = () => {
    if (!selectedFilter) return null;

    // For operators that don't need a value
    if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No value required for this operator
        </Typography>
      );
    }

    switch (selectedFilter.type) {
      case 'text':
        return (
          <TextField
            label="Value"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            fullWidth
            size="small"
            disabled={isPreviewMode}
            placeholder={
              condition.operator === 'regex'
                ? 'Enter regular expression pattern'
                : 'Enter text value'
            }
          />
        );

      case 'number':
      case 'range':
        if (condition.operator === 'between' || condition.operator === 'notBetween') {
          const values = Array.isArray(condition.value) ? condition.value : ['', ''];
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="From"
                type="number"
                value={values[0] || ''}
                onChange={(e) => handleValueChange([e.target.value, values[1]])}
                size="small"
                disabled={isPreviewMode}
                inputProps={{ min: selectedFilter.min, max: selectedFilter.max }}
              />
              <Typography>to</Typography>
              <TextField
                label="To"
                type="number"
                value={values[1] || ''}
                onChange={(e) => handleValueChange([values[0], e.target.value])}
                size="small"
                disabled={isPreviewMode}
                inputProps={{ min: selectedFilter.min, max: selectedFilter.max }}
              />
            </Stack>
          );
        }
        return (
          <TextField
            label="Value"
            type="number"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            fullWidth
            size="small"
            disabled={isPreviewMode}
            inputProps={{ min: selectedFilter.min, max: selectedFilter.max }}
          />
        );

      case 'date':
      case 'dateRange':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={condition.value ? new Date(condition.value) : null}
              onChange={(date: any) => handleValueChange(date ? date.toISOString() : '')}
              disabled={isPreviewMode}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={condition.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              label="Value"
              disabled={isPreviewMode}
            >
              {selectedFilter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiSelect':
        return (
          <Autocomplete
            multiple
            options={selectedFilter.options || []}
            getOptionLabel={(option) => option.label}
            value={
              selectedFilter.options?.filter((opt) => condition.value?.includes(opt.value)) || []
            }
            onChange={(_, newValue) => handleValueChange(newValue.map((v) => v.value))}
            renderInput={(params) => (
              <TextField {...params} label="Values" size="small" disabled={isPreviewMode} />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  {...getTagProps({ index })}
                  key={option.value}
                />
              ))
            }
          />
        );

      case 'boolean':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={condition.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              label="Value"
              disabled={isPreviewMode}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            label="Value"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            fullWidth
            size="small"
            disabled={isPreviewMode}
          />
        );
    }
  };

  const isValid = () => {
    if (!condition.filterId) return false;
    if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') return true;
    if (!condition.value && condition.value !== 0 && condition.value !== false) return false;
    return true;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: condition.enabled ? 1 : 0.6,
        border: isValid() ? undefined : '1px solid',
        borderColor: isValid() ? undefined : 'error.main',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <DragIndicator color="disabled" sx={{ mt: 1 }} />

          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={condition.enabled}
                      onChange={(e) => handleEnabledChange(e.target.checked)}
                      disabled={isPreviewMode}
                      size="small"
                    />
                  }
                  label=""
                />

                <Typography variant="body2" color="text.secondary">
                  Condition
                </Typography>

                <Box sx={{ flex: 1 }} />

                {!isValid() && (
                  <Chip
                    icon={<Warning />}
                    label="Invalid"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}

                {!isPreviewMode && (
                  <IconButton
                    onClick={onRemove}
                    color="error"
                    size="small"
                    title="Remove Condition"
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              {/* Filter Selection */}
              <FormControl fullWidth size="small">
                <InputLabel>Filter</InputLabel>
                <Select
                  value={condition.filterId || ''}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  label="Filter"
                  disabled={isPreviewMode}
                >
                  {availableFilters.map((filter) => (
                    <MenuItem key={filter.id} value={filter.id}>
                      <Box>
                        <Typography variant="body2">{filter.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {filter.category} • {filter.type}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Operator Selection */}
              {selectedFilter && (
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={condition.operator || 'equals'}
                    onChange={(e) => handleOperatorChange(e.target.value as FilterOperator)}
                    label="Operator"
                    disabled={isPreviewMode}
                  >
                    {operatorOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Value Input */}
              {selectedFilter && renderValueInput()}

              {/* Filter Description */}
              {selectedFilter?.description && (
                <Typography variant="caption" color="text.secondary">
                  {selectedFilter.description}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FilterConditionComponent;
