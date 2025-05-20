// src/views/project-detail/PRBatchTrackingComponent.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
  AppBar, // Added Tabs, Tab, AppBar
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField, // Added Dialog components
  Tooltip,
  IconButton,
} from '@mui/material';
import { IconPlus } from '@tabler/icons-react'; // For the add button

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
  // isComplete?: boolean; // We will derive this
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

const createNewPRUnits = (
  count: number,
  startUnitSNStr: string,
  startPcbSNStr: string,
): PRProductionUnit[] => {
  const units: PRProductionUnit[] = [];
  // Basic parsing for serial numbers (e.g., PREFIX001 -> PREFIX, 1)
  const parseSN = (sn: string): { prefix: string; num: number; padding: number } => {
    const match = sn.match(/^([a-zA-Z-]+)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      return { prefix, num: parseInt(numStr, 10), padding: numStr.length };
    }
    return { prefix: sn, num: 1, padding: 3 }; // Fallback
  };

  const unitSNInfo = parseSN(startUnitSNStr);
  const pcbSNInfo = parseSN(startPcbSNStr);

  for (let i = 0; i < count; i++) {
    const unitIndex = Date.now() + i; // More unique ID for mock
    const currentUnitNum = unitSNInfo.num + i;
    const currentPcbNum = pcbSNInfo.num + i;

    units.push({
      id: `pr_unit_id_new_${unitIndex}`,
      unitSN: `${unitSNInfo.prefix}${String(currentUnitNum).padStart(unitSNInfo.padding, '0')}`,
      pcbSN: `${pcbSNInfo.prefix}${String(currentPcbNum).padStart(pcbSNInfo.padding, '0')}`,
      stepStatuses: createInitialPRStepStatuses(),
    });
  }
  return units;
};

const initialMockPRBatch: PRProductionBatch = {
  id: 'mock_pr_batch_001',
  projectId: 'PR-Project-XYZ',
  batchName: 'PR',
  quantity: 5,
  units: createNewPRUnits(5, 'PR-UNITSN-001', 'PR-PCBSN-001'), // Use the new generator
};
// --- End of In-File Definitions ---

interface PRBatchTrackingComponentProps {
  projectId: string;
}

// Helper to determine if a unit is complete
const isUnitComplete = (unit: PRProductionUnit): boolean => {
  return unit.stepStatuses.every((ss) => ss.status === 'Complete' || ss.status === 'N/A');
};

const PRBatchTrackingComponent: React.FC<PRBatchTrackingComponentProps> = ({ projectId }) => {
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

  const [activeTab, setActiveTab] = useState(0); // 0 for In Progress, 1 for Completed

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addUnitsForm, setAddUnitsForm] = useState({
    quantity: 1,
    startUnitSN: `PR-UNITSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
    startPcbSN: `PR-PCBSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
  });

  // Update default selected units when batchData.units changes (e.g., after adding new units)
  useEffect(() => {
    setSelectedUnits((prevSelected) => {
      const newSelected: Record<string, boolean> = {};
      batchData.units.forEach((unit) => {
        newSelected[unit.id] = prevSelected.hasOwnProperty(unit.id) ? prevSelected[unit.id] : true;
      });
      return newSelected;
    });
    // Update default SNs for add modal
    setAddUnitsForm((prev) => ({
      ...prev,
      startUnitSN: `PR-UNITSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
      startPcbSN: `PR-PCBSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
    }));
  }, [batchData.units]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset selection when changing tabs for simplicity, or maintain if preferred
    const newSelectedUnits: Record<string, boolean> = {};
    batchData.units.forEach((unit) => {
      newSelectedUnits[unit.id] = true;
    });
    setSelectedUnits(newSelectedUnits);
  };

  const handleUnitSelectionChange = (unitId: string) => {
    /* ... same ... */
    setSelectedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };
  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    unitsToSelect: PRProductionUnit[],
  ) => {
    const newSelectedUnits = { ...selectedUnits }; // Preserve selections from other tabs
    unitsToSelect.forEach((unit) => {
      newSelectedUnits[unit.id] = event.target.checked;
    });
    setSelectedUnits(newSelectedUnits);
  };
  const handleApplyStatusToSelected = () => {
    /* ... same ... */
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
    /* ... same ... */
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

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);
  const handleAddUnitsFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAddUnitsForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value,
    }));
  };
  const handleAddNewUnits = () => {
    if (addUnitsForm.quantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }
    const newUnits = createNewPRUnits(
      addUnitsForm.quantity,
      addUnitsForm.startUnitSN,
      addUnitsForm.startPcbSN,
    );
    setBatchData((prevBatch) => ({
      ...prevBatch,
      units: [...prevBatch.units, ...newUnits],
      quantity: prevBatch.quantity + newUnits.length,
    }));
    handleCloseAddModal();
  };

  const filteredUnits = useMemo(() => {
    if (activeTab === 0) {
      // In Progress
      return batchData.units.filter((unit) => !isUnitComplete(unit));
    } else {
      // Completed
      return batchData.units.filter((unit) => isUnitComplete(unit));
    }
  }, [batchData.units, activeTab]);

  const numberOfSelectedUnitsInCurrentTab = filteredUnits.filter(
    (unit) => selectedUnits[unit.id],
  ).length;
  const totalUnitsInCurrentTab = filteredUnits.length;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

        <Tooltip title="Add New Units to Batch">
          <Button
            variant="contained"
            startIcon={<IconPlus size="18" />}
            onClick={handleOpenAddModal}
          >
            Add Units
          </Button>
        </Tooltip>
      </Box>

      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={`In Progress (${
              batchData.units.filter((unit) => !isUnitComplete(unit)).length
            })`}
          />
          <Tab
            label={`Completed (${batchData.units.filter((unit) => isUnitComplete(unit)).length})`}
          />
        </Tabs>
      </AppBar>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        {' '}
        {/* mt:0 to align with bottom of tabs */}
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
            {activeTab === 0 ? 'In Progress Units' : 'Completed Units'} ({totalUnitsInCurrentTab})
          </Typography>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={
                        numberOfSelectedUnitsInCurrentTab > 0 &&
                        numberOfSelectedUnitsInCurrentTab < totalUnitsInCurrentTab
                      }
                      checked={
                        totalUnitsInCurrentTab > 0 &&
                        numberOfSelectedUnitsInCurrentTab === totalUnitsInCurrentTab
                      }
                      onChange={(e) => handleSelectAllChange(e, filteredUnits)}
                    />
                  </TableCell>
                  <TableCell>Unit S/N</TableCell>
                  <TableCell>PCB S/N</TableCell>
                  <TableCell>Last Step Completed</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUnits.map((unit) => {
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
                        <Checkbox color="primary" checked={!!selectedUnits[unit.id]} />
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
        <Grid item xs={12} md={5}>
          <Box sx={{ pt: activeTab === 0 ? 1 : 1 }}>
            {' '}
            {/* Align content slightly below "Update Status" title */}
            <Typography variant="subtitle1" gutterBottom>
              Update Status for Selected
            </Typography>
            <FormControl fullWidth sx={{ my: 2 }}>
              <InputLabel id="pr-step-select-label">Step to Update</InputLabel>
              <Select<string>
                labelId="pr-step-select-label"
                value={currentStepIdToUpdate}
                label="Step to Update"
                onChange={(e: SelectChangeEvent<string>) =>
                  setCurrentStepIdToUpdate(e.target.value)
                }
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
              disabled={numberOfSelectedUnitsInCurrentTab === 0}
              fullWidth
              sx={{ mb: 2 }}
            >
              Apply to {numberOfSelectedUnitsInCurrentTab} Unit(s)
            </Button>
            <Typography variant="caption" sx={{ mt: 1, mb: 1, display: 'block' }}>
              Preview - Current status of '
              {PR_PROJECT_STEPS.find((s) => s.id === currentStepIdToUpdate)?.name}' for first 5
              selected:
            </Typography>
            <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
              {filteredUnits
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
              {numberOfSelectedUnitsInCurrentTab > 5 && (
                <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem' }}>
                  ...and {numberOfSelectedUnitsInCurrentTab - 5} more.
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Add New Units Modal */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Units to Batch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="quantity"
            label="Quantity to Add"
            type="number"
            fullWidth
            variant="outlined"
            value={addUnitsForm.quantity}
            onChange={handleAddUnitsFormChange}
            InputProps={{ inputProps: { min: 1 } }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="startUnitSN"
            label="Starting Unit S/N (e.g., PR-UNITSN-006)"
            type="text"
            fullWidth
            variant="outlined"
            value={addUnitsForm.startUnitSN}
            onChange={handleAddUnitsFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="startPcbSN"
            label="Starting PCB S/N (e.g., PR-PCBSN-006)"
            type="text"
            fullWidth
            variant="outlined"
            value={addUnitsForm.startPcbSN}
            onChange={handleAddUnitsFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button onClick={handleAddNewUnits} variant="contained">
            Add Units
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PRBatchTrackingComponent;
