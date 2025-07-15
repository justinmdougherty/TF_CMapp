import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { IconTimeline } from '@tabler/icons-react';
import { format } from 'date-fns';
import UnitTimeline from './UnitTimeline';
import { ProductionUnit } from '../types/Production';
import { ProjectStep } from '../types/ProjectSteps';

interface UnitTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ProductionUnit | null;
  steps: ProjectStep[];
}

const UnitTimelineModal: React.FC<UnitTimelineModalProps> = ({ isOpen, onClose, unit, steps }) => {
  const [timelineData, setTimelineData] = useState<{
    minDate: Date;
    maxDate: Date;
    totalDays: number;
  } | null>(null);

  if (!unit) return null;

  // Get unit identifier for display
  const unitIdentifier =
    unit.attributes?.find((a) => a.attribute_definition_id)?.attribute_value ||
    unit.unit_serial_number ||
    `Unit ${unit.item_id}`;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '1.25rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconTimeline size={24} />
        <Box>
          <Typography variant="h6" component="span">
            Production Timeline: {unitIdentifier}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Visual timeline showing when each production step was started and completed
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        <UnitTimeline unit={unit} steps={steps} onTimelineDataChange={setTimelineData} />
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {timelineData && (
            <>
              <Typography variant="body2" color="text.secondary">
                <strong>Timeline Range:</strong> {format(timelineData.minDate, 'MMM dd, yyyy')} -{' '}
                {format(timelineData.maxDate, 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Total Duration:</strong> {timelineData.totalDays} day
                {timelineData.totalDays !== 1 ? 's' : ''}
              </Typography>
            </>
          )}
          {!timelineData && (
            <Typography variant="body2" color="text.secondary">
              No timeline data available
            </Typography>
          )}
        </Box>
        <Button onClick={onClose} variant="contained" size="large">
          Close Timeline
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitTimelineModal;
