import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  Save,
  Star,
  StarBorder,
  Delete,
  Edit,
  FilterList,
  Add,
  Download,
  Upload,
} from '@mui/icons-material';
import { AdvancedFilter, SearchPreset } from '../../types/Search';
import { useSearchStore } from '../../store/searchStore';

interface FilterPresetsProps {
  currentFilter: AdvancedFilter;
  onChange: (filter: AdvancedFilter) => void;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({ currentFilter, onChange }) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [editingPreset, setEditingPreset] = useState<SearchPreset | null>(null);

  const { presets, savePreset, deletePreset } = useSearchStore();

  // Filter presets to only show those with advanced filters
  const advancedPresets = presets.filter((preset) => preset.advancedFilter);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const preset: Omit<SearchPreset, 'id' | 'createdAt'> = {
      name: presetName.trim(),
      description: presetDescription.trim(),
      searchTerm: '',
      filters: [],
      advancedFilter: currentFilter,
      isDefault: false,
    };

    savePreset(preset);
    setSaveDialogOpen(false);
    setPresetName('');
    setPresetDescription('');
    setEditingPreset(null);
  };

  const handleLoadPreset = (preset: SearchPreset) => {
    if (preset.advancedFilter) {
      onChange(preset.advancedFilter);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId);
  };

  const handleEditPreset = (preset: SearchPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetDescription(preset.description || '');
    setSaveDialogOpen(true);
  };

  const handleExportPreset = (preset: SearchPreset) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `filter-preset-${preset.name
      .toLowerCase()
      .replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatFilterSummary = (filter: AdvancedFilter) => {
    const totalConditions = filter.groups.reduce((sum, group) => sum + group.conditions.length, 0);
    const enabledGroups = filter.groups.filter((g) => g.enabled).length;

    return `${enabledGroups} group${enabledGroups !== 1 ? 's' : ''}, ${totalConditions} condition${
      totalConditions !== 1 ? 's' : ''
    }`;
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Filter Presets</Typography>
        <Button
          startIcon={<Add />}
          onClick={() => setSaveDialogOpen(true)}
          variant="contained"
          size="small"
        >
          Save Current Filter
        </Button>
      </Box>

      {advancedPresets.length === 0 ? (
        <Alert severity="info">
          <Typography>
            No saved filter presets yet. Save your current filter configuration to create reusable
            presets.
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={2}>
          {advancedPresets.map((preset) => (
            <Card key={preset.id} variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {preset.name}
                      </Typography>
                      {preset.isDefault && (
                        <Chip icon={<Star />} label="Default" size="small" color="primary" />
                      )}
                    </Box>

                    {preset.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {preset.description}
                      </Typography>
                    )}

                    {preset.advancedFilter && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<FilterList />}
                          label={formatFilterSummary(preset.advancedFilter)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={preset.advancedFilter.groupLogicalOperator}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Saved on {preset.createdAt.toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPreset(preset)}
                      title="Edit Preset"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExportPreset(preset)}
                      title="Export Preset"
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePreset(preset.id)}
                      color="error"
                      title="Delete Preset"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleLoadPreset(preset)}
                  startIcon={<FilterList />}
                >
                  Load Filter
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Save Preset Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingPreset ? 'Edit Filter Preset' : 'Save Filter Preset'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Preset Name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description (Optional)"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <Alert severity="info">
              <Typography variant="body2">
                This will save your current filter configuration with {currentFilter.groups.length}{' '}
                group
                {currentFilter.groups.length !== 1 ? 's' : ''} and{' '}
                {currentFilter.groups.reduce((sum, group) => sum + group.conditions.length, 0)}{' '}
                condition
                {currentFilter.groups.reduce((sum, group) => sum + group.conditions.length, 0) !== 1
                  ? 's'
                  : ''}
                .
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePreset}
            variant="contained"
            disabled={!presetName.trim()}
            startIcon={<Save />}
          >
            {editingPreset ? 'Update' : 'Save'} Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilterPresets;
