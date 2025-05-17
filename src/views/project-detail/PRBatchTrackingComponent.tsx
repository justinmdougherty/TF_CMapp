// src/views/project-detail/PRBatchTrackingComponent.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
// NO PageContainer or Breadcrumb imports here

// --- Define PR-Specific Types and Data Directly in this File ---
export type PRStepStatusType = 'Not Started' | 'In Progress' | 'Complete' | 'N/A';

export interface PRProductionStep {
  id: string;
  name: string;
  order: number;
}

export interface PRUnitStepStatus {
  stepId: string;
  status: PRStepStatusType;
  completedDate?: string;
  notes?: string;
}

export interface PRProductionUnit {
  id: string;
  unitSN: string;
  pcbSN: string;
  stepStatuses: PRUnitStepStatus[];
}

export interface PRProductionBatch {
  id: string;
  projectId?: string;
  batchName: string;
  quantity: number;
  units: PRProductionUnit[];
}

const PR_PROJECT_STEPS: PRProductionStep[] = [
  { id: 'pr_step_01', name: 'PCB mods performed', order: 1 },
  { id: 'pr_step_02', name: 'PCB mods QC', order: 2 },
  { id: 'pr_step_03', name: 'Programmed', order: 3 },
  { id: 'pr_step_04', name: 'Board level function check', order: 4 },
  { id: 'pr_step_05', name: 'Unit removed from shell', order: 5 },
  { id: 'pr_step_06', name: 'Potting removed from unit and checked for damage', order: 6 },
  { id: 'pr_step_07', name: 'Pictures of unit captured', order: 7 },
  { id: 'pr_step_08', name: 'PWR, GND, EFFECT and ANT wires soldered to PCB', order: 8 },
  { id: 'pr_step_09', name: 'PWR, GND, EFFECT and ANT wires soldering QC', order: 9 },
  { id: 'pr_step_10', name: 'PCB mounted in bracket and ANT wire routed', order: 10 },
  { id: 'pr_step_11', name: 'PWR, GND and EFFECT wires soldered to Unit', order: 11 },
  { id: 'pr_step_12', name: 'PWR, GND and EFFECT wires soldering QC', order: 12 },
  { id: 'pr_step_13', name: 'Integrated unit function check (Pre-Potting)', order: 13 },
  { id: 'pr_step_14', name: 'AM150 potting poured and cured', order: 14 },
  { id: 'pr_step_15', name: 'SC-550 potting poured and cured', order: 15 },
  { id: 'pr_step_16', name: 'Integrated unit function check (Post-Potting)', order: 16 },
  { id: 'pr_step_17', name: 'Platform function check', order: 17 },
];

const createInitialPRStepStatuses = (): PRUnitStepStatus[] => {
  return PR_PROJECT_STEPS.map((step) => ({
    stepId: step.id,
    status: 'Not Started',
    completedDate: undefined,
  }));
};

const createMockPRUnits = (count: number, startIndex: number = 1): PRProductionUnit[] => {
  const units: PRProductionUnit[] = [];
  for (let i = 0; i < count; i++) {
    const unitIndex = startIndex + i;
    units.push({
      id: `pr_unit_id_${unitIndex}`,
      unitSN: `PR-UNITSN-00${unitIndex}`,
      pcbSN: `PR-PCBSN-00${unitIndex}`,
      stepStatuses: createInitialPRStepStatuses(),
    });
  }
  return units;
};

const initialMockPRBatch: PRProductionBatch = {
  id: 'mock_pr_batch_001',
  projectId: 'PR-Project-XYZ',
  batchName: 'PR Batch 001',
  quantity: 48,
  units: createMockPRUnits(48),
};
// --- End of In-File Definitions ---

interface PRBatchTrackingComponentProps {
  projectId: string; // Passed from ProjectDetailPage
  // You could also pass the specific batch to display if ProjectDetailPage fetches it
  // initialBatch?: PRProductionBatch;
}

const PRBatchTrackingComponent: React.FC<PRBatchTrackingComponentProps> = ({ projectId }) => {
  // If initialBatch prop was passed, use it. Otherwise, use the internal mock.
  // For now, sticking to internal mock for simplicity as per original request.
  const [batchData, setBatchData] = useState<PRProductionBatch>(initialMockPRBatch);

  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>(() => {
    const initialSelection: Record<string, boolean> = {};
    initialMockPRBatch.units.forEach((unit) => (initialSelection[unit.id] = true));
    return initialSelection;
  });

  const [currentStepIdToUpdate, setCurrentStepIdToUpdate] = useState<string>(
    PR_PROJECT_STEPS[0].id,
  );
  const [currentStatusToApply, setCurrentStatusToApply] = useState<PRStepStatusType>('Not Started');

  // Update selectedUnits if batchData.units changes (e.g., if we were to load a new batch)
  useEffect(() => {
    setSelectedUnits((prevSelected) => {
      const newSelected: Record<string, boolean> = {};
      batchData.units.forEach((unit) => {
        // Keep existing selection if unit still exists, otherwise default to true (or false if preferred)
        newSelected[unit.id] = prevSelected.hasOwnProperty(unit.id) ? prevSelected[unit.id] : true;
      });
      return newSelected;
    });
  }, [batchData.units]);

  const handleUnitSelectionChange = (unitId: string) => {
    setSelectedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };
  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedUnits: Record<string, boolean> = {};
    batchData.units.forEach((unit) => {
      newSelectedUnits[unit.id] = event.target.checked;
    });
    setSelectedUnits(newSelectedUnits);
  };
  const handleApplyStatusToSelected = () => {
    setBatchData((prevBatch) => {
      const updatedUnits = prevBatch.units.map((unit) => {
        if (selectedUnits[unit.id]) {
          const newStepStatuses = unit.stepStatuses.map((ss) =>
            ss.stepId === currentStepIdToUpdate
              ? {
                  ...ss,
                  status: currentStatusToApply,
                  completedDate:
                    currentStatusToApply === 'Complete'
                      ? new Date().toISOString()
                      : ss.completedDate,
                }
              : ss,
          );
          return { ...unit, stepStatuses: newStepStatuses };
        }
        return unit;
      });
      return { ...prevBatch, units: updatedUnits };
    });
  };
  const getUnitLastCompletedStepInfo = (
    unit: PRProductionUnit,
  ): { name: string; date?: string } => {
    let lastCompletedStepName = 'N/A';
    let lastCompletedDate: string | undefined = undefined;
    let maxOrder = -1;
    unit.stepStatuses.forEach((statusEntry) => {
      if (statusEntry.status === 'Complete') {
        const stepDefinition = PR_PROJECT_STEPS.find((s) => s.id === statusEntry.stepId);
        if (stepDefinition && stepDefinition.order > maxOrder) {
          maxOrder = stepDefinition.order;
          lastCompletedStepName = stepDefinition.name;
          lastCompletedDate = statusEntry.completedDate
            ? new Date(statusEntry.completedDate).toLocaleDateString()
            : undefined;
        }
      }
    });
    return { name: lastCompletedStepName, date: lastCompletedDate };
  };

  const numberOfSelectedUnits = Object.values(selectedUnits).filter(Boolean).length;
  const totalUnits = batchData.units.length;

  return (
    // The component returns its core UI directly, wrapped in a Paper for styling.
    // NO PageContainer or Breadcrumb here.
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {/* Batch: {batchData.batchName} (for Project: {projectId}) */}
      </Typography>
      <Grid container spacing={3}>
        {/* Left Panel: Units Table */}
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" gutterBottom>
            Units ({totalUnits})
          </Typography>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={
                        numberOfSelectedUnits > 0 && numberOfSelectedUnits < totalUnits
                      }
                      checked={totalUnits > 0 && numberOfSelectedUnits === totalUnits}
                      onChange={handleSelectAllChange}
                    />
                  </TableCell>
                  <TableCell>Unit S/N</TableCell>
                  <TableCell>PCB S/N</TableCell>
                  <TableCell>Last Step Completed</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batchData.units.map((unit) => {
                  const lastStepInfo = getUnitLastCompletedStepInfo(unit);
                  return (
                    <TableRow
                      hover
                      key={unit.id}
                      selected={selectedUnits[unit.id]}
                      onClick={() => handleUnitSelectionChange(unit.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={selectedUnits[unit.id]} />
                      </TableCell>
                      <TableCell>{unit.unitSN}</TableCell>
                      <TableCell>{unit.pcbSN}</TableCell>
                      <TableCell>{lastStepInfo.name}</TableCell>
                      <TableCell>{lastStepInfo.date || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        {/* Right Panel: Step Update Actions */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle1" gutterBottom>
            Update Status for Selected
          </Typography>
          <FormControl fullWidth sx={{ my: 2 }}>
            <InputLabel id="pr-step-select-label">Step to Update</InputLabel>
            <Select<string>
              labelId="pr-step-select-label"
              value={currentStepIdToUpdate}
              label="Step to Update"
              onChange={(e: SelectChangeEvent<string>) => setCurrentStepIdToUpdate(e.target.value)}
            >
              {PR_PROJECT_STEPS.map((step) => (
                <MenuItem key={step.id} value={step.id}>
                  {step.order}. {step.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="pr-status-select-label">New Status</InputLabel>
            <Select<PRStepStatusType>
              labelId="pr-status-select-label"
              value={currentStatusToApply}
              label="New Status"
              onChange={(e: SelectChangeEvent<PRStepStatusType>) =>
                setCurrentStatusToApply(e.target.value as PRStepStatusType)
              }
            >
              {(['Not Started', 'In Progress', 'Complete', 'N/A'] as PRStepStatusType[]).map(
                (status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleApplyStatusToSelected}
            disabled={numberOfSelectedUnits === 0}
            fullWidth
            sx={{ mb: 2 }}
          >
            Apply to {numberOfSelectedUnits} Unit(s)
          </Button>
          <Typography variant="caption" sx={{ mt: 1, mb: 1, display: 'block' }}>
            Preview - Current status of '
            {PR_PROJECT_STEPS.find((s) => s.id === currentStepIdToUpdate)?.name}' for first 5
            selected:
          </Typography>
          <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
            {batchData.units
              .filter((u) => selectedUnits[u.id])
              .slice(0, 5)
              .map((unit) => {
                const currentStepStatus =
                  unit.stepStatuses.find((ss) => ss.stepId === currentStepIdToUpdate)?.status ||
                  'N/A';
                return (
                  <Typography
                    key={unit.id}
                    variant="caption"
                    display="block"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {unit.unitSN}: {currentStepStatus}
                  </Typography>
                );
              })}
            {numberOfSelectedUnits > 5 && (
              <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem' }}>
                ...and {numberOfSelectedUnits - 5} more.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PRBatchTrackingComponent;
