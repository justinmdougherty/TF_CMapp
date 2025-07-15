import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Close,
  FilterList,
  Save,
  PlayArrow,
  Refresh,
  Settings,
  BookmarkBorder,
} from '@mui/icons-material';
import { AdvancedFilter, FilterGroup, FilterTemplate } from '../../types/Search';
import FilterBuilder from './FilterBuilder';
import FilterPresets from './FilterPresets';
import FilterTemplates from './FilterTemplates';
import { useGlobalSearch } from '../../hooks/api/useGlobalSearch';

interface AdvancedFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: AdvancedFilter) => void;
  initialFilter?: AdvancedFilter;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`filter-tabpanel-${index}`}
      aria-labelledby={`filter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  onClose,
  onApply,
  initialFilter,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<AdvancedFilter | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { search } = useGlobalSearch();

  // Initialize filter
  useEffect(() => {
    if (open) {
      if (initialFilter) {
        setCurrentFilter(initialFilter);
      } else {
        // Create new empty filter
        const newFilter: AdvancedFilter = {
          id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'New Filter',
          groups: [createEmptyFilterGroup()],
          groupLogicalOperator: 'AND',
          createdAt: new Date(),
          modifiedAt: new Date(),
        };
        setCurrentFilter(newFilter);
      }
      setActiveTab(0);
      setIsPreviewMode(false);
      setValidationErrors([]);
    }
  }, [open, initialFilter]);

  const createEmptyFilterGroup = (): FilterGroup => ({
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Filter Group',
    conditions: [],
    logicalOperator: 'AND',
    enabled: true,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const validateFilter = (filter: AdvancedFilter) => {
    const errors: string[] = [];

    if (!filter.name?.trim()) {
      errors.push('Filter name is required');
    }

    if (filter.groups.length === 0) {
      errors.push('At least one filter group is required');
    }

    filter.groups.forEach((group, groupIndex) => {
      if (group.enabled && group.conditions.length === 0) {
        errors.push(`Group ${groupIndex + 1} has no conditions`);
      }

      group.conditions.forEach((condition, conditionIndex) => {
        if (condition.enabled && (!condition.value || condition.value === '')) {
          errors.push(
            `Group ${groupIndex + 1}, Condition ${conditionIndex + 1}: Value is required`,
          );
        }
      });
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePreview = async () => {
    if (!currentFilter) return;

    if (!validateFilter(currentFilter)) {
      return;
    }

    setIsValidating(true);
    setIsPreviewMode(true);

    try {
      // Convert advanced filter to simple filters for preview
      const simpleFilters = convertAdvancedFilterToSimple(currentFilter);

      // Perform search with filters to get preview stats
      await search('', simpleFilters);

      // Analytics stats calculation (future implementation)
    } catch (error) {
      console.error('Filter preview failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const convertAdvancedFilterToSimple = (filter: AdvancedFilter) => {
    // TODO: Implement conversion logic for complex filters
    // For now, just extract simple conditions
    const simpleFilters: any[] = [];

    filter.groups.forEach((group) => {
      group.conditions.forEach((condition) => {
        if (condition.enabled) {
          simpleFilters.push({
            filterId: condition.filterId,
            value: condition.value,
            operator: condition.operator,
          });
        }
      });
    });

    return simpleFilters;
  };

  const handleSave = () => {
    if (!currentFilter || !validateFilter(currentFilter)) {
      return;
    }

    const updatedFilter = {
      ...currentFilter,
      modifiedAt: new Date(),
    };

    onApply(updatedFilter);
    onClose();
  };

  const handleLoadTemplate = (template: FilterTemplate) => {
    const newFilter: AdvancedFilter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      groups: template.advancedFilter.groups,
      groupLogicalOperator: template.advancedFilter.groupLogicalOperator,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    setCurrentFilter(newFilter);
    setActiveTab(0); // Switch to builder tab
  };

  // Future handlers for component integration
  // const handleLoadPreset = (preset: AdvancedFilter) => {
  //   setCurrentFilter(preset);
  //   setActiveTab(0); // Switch to builder tab
  // };

  const handleUpdateFilter = (updatedFilter: AdvancedFilter) => {
    setCurrentFilter(updatedFilter);
  };

  if (!currentFilter) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '900px',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList color="primary" />
            <Typography variant="h6">Advanced Filters</Typography>
            {isPreviewMode && (
              <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                (Preview Mode)
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label="Filter Builder"
            icon={<Settings />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label="Templates"
            icon={<BookmarkBorder />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab label="Presets" icon={<Save />} iconPosition="start" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isValidating && <LinearProgress />}

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            <Typography variant="body2" component="div">
              {validationErrors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </Typography>
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={activeTab} index={0}>
            <FilterBuilder
              filter={currentFilter}
              availableFilters={[]} // TODO: Pass actual available filters
              onChange={handleUpdateFilter}
              isPreviewMode={isPreviewMode}
              filterStats={null}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <FilterTemplates
              templates={[]} // TODO: Pass actual templates
              onLoadTemplate={handleLoadTemplate}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <FilterPresets currentFilter={currentFilter} onChange={handleUpdateFilter} />
          </TabPanel>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<PlayArrow />}
            onClick={handlePreview}
            disabled={isValidating || validationErrors.length > 0}
          >
            Preview
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={() => {
              setCurrentFilter({ ...currentFilter, groups: [createEmptyFilterGroup()] });
              setIsPreviewMode(false);
            }}
            disabled={isValidating}
          >
            Reset
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={isValidating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isValidating || validationErrors.length > 0}
            startIcon={<Save />}
          >
            Apply Filter
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedFilterModal;
