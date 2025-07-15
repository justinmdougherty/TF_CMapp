import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import { FilterList, Inventory, Work, Settings, Star, Layers } from '@mui/icons-material';
import { FilterTemplate } from '../../types/Search';

interface FilterTemplatesProps {
  templates: FilterTemplate[];
  onLoadTemplate: (template: FilterTemplate) => void;
}

// Default filter templates
const defaultTemplates: FilterTemplate[] = [
  {
    id: 'active-projects',
    name: 'Active Projects',
    description: 'Find all active projects with recent activity',
    category: 'project',
    icon: 'Work',
    advancedFilter: {
      name: 'Active Projects',
      groups: [
        {
          id: 'active-group',
          name: 'Active Status',
          conditions: [
            {
              id: 'status-condition',
              filterId: 'project_status',
              value: 'Active',
              operator: 'equals',
              enabled: true,
            },
            {
              id: 'updated-condition',
              filterId: 'last_updated',
              value: '30',
              operator: 'greater',
              enabled: true,
            },
          ],
          logicalOperator: 'AND',
          enabled: true,
        },
      ],
      groupLogicalOperator: 'AND',
    },
  },
  {
    id: 'low-stock-inventory',
    name: 'Low Stock Items',
    description: 'Items below minimum stock levels that need attention',
    category: 'inventory',
    icon: 'Inventory',
    advancedFilter: {
      name: 'Low Stock Items',
      groups: [
        {
          id: 'stock-group',
          name: 'Stock Levels',
          conditions: [
            {
              id: 'stock-condition',
              filterId: 'current_stock',
              value: ['min_stock'],
              operator: 'lessEqual',
              enabled: true,
            },
            {
              id: 'active-condition',
              filterId: 'item_status',
              value: 'Active',
              operator: 'equals',
              enabled: true,
            },
          ],
          logicalOperator: 'AND',
          enabled: true,
        },
      ],
      groupLogicalOperator: 'AND',
    },
  },
  {
    id: 'priority-items',
    name: 'High Priority Items',
    description: 'Critical projects and urgent inventory items',
    category: 'general',
    icon: 'Star',
    advancedFilter: {
      name: 'High Priority Items',
      groups: [
        {
          id: 'priority-projects',
          name: 'Priority Projects',
          conditions: [
            {
              id: 'project-priority',
              filterId: 'priority',
              value: ['High', 'Critical'],
              operator: 'in',
              enabled: true,
            },
          ],
          logicalOperator: 'AND',
          enabled: true,
        },
        {
          id: 'urgent-inventory',
          name: 'Urgent Inventory',
          conditions: [
            {
              id: 'inventory-urgency',
              filterId: 'urgency',
              value: 'High',
              operator: 'equals',
              enabled: true,
            },
          ],
          logicalOperator: 'AND',
          enabled: true,
        },
      ],
      groupLogicalOperator: 'OR',
    },
  },
  {
    id: 'recent-updates',
    name: 'Recent Updates',
    description: 'Items modified in the last week',
    category: 'general',
    icon: 'Layers',
    advancedFilter: {
      name: 'Recent Updates',
      groups: [
        {
          id: 'recent-group',
          name: 'Last Week',
          conditions: [
            {
              id: 'modified-condition',
              filterId: 'modified_date',
              value: '7',
              operator: 'greater',
              enabled: true,
            },
          ],
          logicalOperator: 'AND',
          enabled: true,
        },
      ],
      groupLogicalOperator: 'AND',
    },
  },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Work':
      return <Work />;
    case 'Inventory':
      return <Inventory />;
    case 'Star':
      return <Star />;
    case 'Layers':
      return <Layers />;
    default:
      return <FilterList />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'project':
      return 'primary';
    case 'inventory':
      return 'secondary';
    case 'general':
      return 'info';
    case 'custom':
      return 'warning';
    default:
      return 'default';
  }
};

const FilterTemplates: React.FC<FilterTemplatesProps> = ({ templates = [], onLoadTemplate }) => {
  // Combine default templates with custom templates
  const allTemplates = [...defaultTemplates, ...templates];

  const handleLoadTemplate = (template: FilterTemplate) => {
    onLoadTemplate(template);
  };

  const formatFilterSummary = (template: FilterTemplate) => {
    const filter = template.advancedFilter;
    const totalConditions = filter.groups.reduce((sum, group) => sum + group.conditions.length, 0);
    const enabledGroups = filter.groups.filter((g) => g.enabled).length;

    return `${enabledGroups} group${enabledGroups !== 1 ? 's' : ''}, ${totalConditions} condition${
      totalConditions !== 1 ? 's' : ''
    }`;
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Filter Templates
      </Typography>

      {allTemplates.length === 0 ? (
        <Alert severity="info">
          <Typography>
            No filter templates available. Templates provide pre-configured filter setups for common
            use cases.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {allTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getIconComponent(template.icon || 'FilterList')}
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={template.category}
                      size="small"
                      color={getCategoryColor(template.category) as any}
                      variant="outlined"
                    />
                    <Chip label={formatFilterSummary(template)} size="small" variant="outlined" />
                    <Chip
                      label={template.advancedFilter.groupLogicalOperator}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>

                  {/* Preview of conditions */}
                  <Typography variant="caption" color="text.secondary">
                    Preview:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {template.advancedFilter.groups.slice(0, 2).map((group, index) => (
                      <Typography key={group.id} variant="caption" sx={{ display: 'block' }}>
                        • {group.name}: {group.conditions.length} condition
                        {group.conditions.length !== 1 ? 's' : ''}
                      </Typography>
                    ))}
                    {template.advancedFilter.groups.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {template.advancedFilter.groups.length - 2} more group
                        {template.advancedFilter.groups.length - 2 !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleLoadTemplate(template)}
                    startIcon={<FilterList />}
                    fullWidth
                  >
                    Use Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Templates provide ready-to-use filter configurations for common
          scenarios. You can customize them after loading or create your own from the Filter Builder
          tab.
        </Typography>
      </Alert>
    </Box>
  );
};

export default FilterTemplates;
