import React from 'react';
import { Box, Typography } from '@mui/material';

interface FilterTemplatesProps {
  onApplyTemplate: (template: any) => void;
  onSaveAsTemplate: () => void;
  filterTemplates: any[];
}

const FilterTemplates: React.FC<FilterTemplatesProps> = () => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        Filter templates not yet implemented
      </Typography>
    </Box>
  );
};

export default FilterTemplates;
