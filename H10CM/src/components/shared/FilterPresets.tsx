import React from 'react';
import { Box, Typography } from '@mui/material';

interface FilterPresetsProps {
  currentFilter: any;
  onChange: (filter: any) => void;
}

const FilterPresets: React.FC<FilterPresetsProps> = () => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Filter presets not yet implemented
      </Typography>
    </Box>
  );
};

export default FilterPresets;
