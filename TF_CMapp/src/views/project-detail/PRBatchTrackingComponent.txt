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
  AppBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import { IconPlus, IconTruckDelivery } from '@tabler/icons-react';
import certificateService, { UserAuthInfo } from '../../services/certificateService'; // Adjusted path

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
  completedBy?: string;
}

export interface PRProductionUnit {
  id: string;
  unitSN: string;
  pcbSN: string;
  stepStatuses: PRUnitStepStatus[];
  isShipped?: boolean;
  shippedDate?: string;
  dateFullyCompleted?: string;
}

export interface PRProductionBatch {
  id: string;
  projectId?: string;
  batchName: string;
  quantity: number;
  units: PRProductionUnit[];
  batchStartDate?: string; // Added
  batchTargetCompletionDate?: string; // Added
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
    completedBy: undefined,
  }));
};

const createNewPRUnits = (
  count: number,
  startUnitSNStr: string,
  startPcbSNStr: string,
): PRProductionUnit[] => {
  const units: PRProductionUnit[] = [];
  const parseSN = (sn: string): { prefix: string; num: number; padding: number } => {
    const match = sn.match(/^([a-zA-Z-]+)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      return { prefix, num: parseInt(numStr, 10), padding: numStr.length };
    }
    return { prefix: sn, num: 1, padding: 3 };
  };

  const unitSNInfo = parseSN(startUnitSNStr);
  const pcbSNInfo = parseSN(startPcbSNStr);

  for (let i = 0; i < count; i++) {
    const unitIndex = Date.now() + i;
    const currentUnitNum = unitSNInfo.num + i;
    const currentPcbNum = pcbSNInfo.num + i;

    units.push({
      id: `pr_unit_id_new_${unitIndex}`,
      unitSN: `${unitSNInfo.prefix}${String(currentUnitNum).padStart(unitSNInfo.padding, '0')}`,
      pcbSN: `${pcbSNInfo.prefix}${String(currentPcbNum).padStart(pcbSNInfo.padding, '0')}`,
      stepStatuses: createInitialPRStepStatuses(),
      isShipped: false,
      shippedDate: undefined,
      dateFullyCompleted: undefined,
    });
  }
  return units;
};

const todayYYYYMMDD = new Date().toISOString().split('T')[0];
const oneWeekFromTodayYYYYMMDD = new Date(new Date().setDate(new Date().getDate() + 7))
  .toISOString()
  .split('T')[0];

const initialMockPRBatch: PRProductionBatch = {
  id: 'mock_pr_batch_001',
  projectId: 'PR-Project-XYZ',
  batchName: 'PR',
  quantity: 5,
  units: createNewPRUnits(5, 'PR-UNITSN-001', 'PR-PCBSN-001'),
  batchStartDate: todayYYYYMMDD,
  batchTargetCompletionDate: oneWeekFromTodayYYYYMMDD,
};

// --- End of In-File Definitions ---

interface PRBatchTrackingComponentProps {
  projectId: string;
}

const isUnitComplete = (unit: PRProductionUnit): boolean => {
  return unit.stepStatuses.every((ss) => ss.status === 'Complete' || ss.status === 'N/A');
};

const getUnitOverallCompletionDate = (unit: PRProductionUnit): string | undefined => {
  if (!isUnitComplete(unit)) {
    return undefined;
  }
  let latestDate: Date | undefined = undefined;
  unit.stepStatuses.forEach((ss) => {
    if (ss.status === 'Complete' && ss.completedDate) {
      const d = new Date(ss.completedDate);
      if (!latestDate || d > latestDate) {
        latestDate = d;
      }
    }
  });

  // Explicitly check if latestDate is not undefined
  if (typeof latestDate !== 'undefined') {
    // Use type assertion to make TypeScript understand this is a Date
    return (latestDate as Date).toISOString();
  } else {
    // latestDate is undefined
    return undefined;
  }
};

const PRBatchTrackingComponent: React.FC<PRBatchTrackingComponentProps> = ({ projectId }) => {
  const [batchData, setBatchData] = useState<PRProductionBatch>(initialMockPRBatch);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>({});
  const [currentStepIdToUpdate, setCurrentStepIdToUpdate] = useState<string>(
    PR_PROJECT_STEPS[0].id,
  );
  const [currentStatusToApply, setCurrentStatusToApply] = useState<PRStepStatusType>('Not Started');
  const [activeTab, setActiveTab] = useState(0);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('Loading User...');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUnitDetailModalOpen, setIsUnitDetailModalOpen] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<PRProductionUnit | null>(null);
  const [addUnitsForm, setAddUnitsForm] = useState({
    quantity: 1,
    startUnitSN: `PR-UNITSN-${String(initialMockPRBatch.units.length + 1).padStart(3, '0')}`,
    startPcbSN: `PR-PCBSN-${String(initialMockPRBatch.units.length + 1).padStart(3, '0')}`,
    batchStartDate: initialMockPRBatch.batchStartDate || todayYYYYMMDD,
    batchTargetCompletionDate:
      initialMockPRBatch.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await certificateService.getCurrentUser();
        if (user && user.displayName) {
          setCurrentUserDisplayName(user.displayName);
        } else {
          setCurrentUserDisplayName('Unknown User');
        }
      } catch (error) {
        console.error("Error fetching current user for 'Completed By':", error);
        setCurrentUserDisplayName('Error User');
      }
    };
    fetchUser();
  }, []);

  const { inProgressUnits, completedUnits, shippedUnits } = useMemo(() => {
    const inProg: PRProductionUnit[] = [];
    const comp: PRProductionUnit[] = [];
    const ship: PRProductionUnit[] = [];

    batchData.units.forEach((unit) => {
      if (unit.isShipped) {
        ship.push(unit);
      } else if (isUnitComplete(unit)) {
        const overallCompletionDate = getUnitOverallCompletionDate(unit);
        comp.push({
          ...unit,
          dateFullyCompleted: unit.dateFullyCompleted || overallCompletionDate,
        });
      } else {
        inProg.push({ ...unit, dateFullyCompleted: undefined }); // Ensure dateFullyCompleted is cleared if not complete
      }
    });
    return { inProgressUnits: inProg, completedUnits: comp, shippedUnits: ship };
  }, [batchData.units]);

  const currentVisibleUnits = useMemo(() => {
    if (activeTab === 0) return inProgressUnits;
    if (activeTab === 1) return completedUnits;
    if (activeTab === 2) return shippedUnits;
    return [];
  }, [activeTab, inProgressUnits, completedUnits, shippedUnits]);

  useEffect(() => {
    // Only auto-select all units when switching tabs, not when data changes
    // This preserves user selection when applying status updates
    const newSelected: Record<string, boolean> = {};
    currentVisibleUnits.forEach((unit) => {
      // Preserve existing selection if the unit was already visible, otherwise auto-select for In Progress and Completed tabs
      if (selectedUnits[unit.id] !== undefined) {
        newSelected[unit.id] = selectedUnits[unit.id];
      } else if (activeTab === 0 || activeTab === 1) {
        // Only auto-select new units that weren't previously visible
        newSelected[unit.id] = true;
      }
    });
    setSelectedUnits(newSelected);
  }, [activeTab, currentVisibleUnits.map(u => u.id).join(',')]); // Only trigger on tab change or unit list changes, not on unit data changes

  useEffect(() => {
    // Update form defaults when batchData or its length changes
    setAddUnitsForm((prev) => ({
      ...prev, // Retain quantity if user was typing, or reset it.
      startUnitSN: `PR-UNITSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
      startPcbSN: `PR-PCBSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
      // Persist current batch dates in the form when opening, not just initial ones
      batchStartDate: batchData.batchStartDate || todayYYYYMMDD,
      batchTargetCompletionDate: batchData.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
    }));
  }, [batchData.units.length, batchData.batchStartDate, batchData.batchTargetCompletionDate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUnitSelectionChange = (unitId: string) => {
    setSelectedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    unitsToSelect: PRProductionUnit[],
  ) => {
    const newSelectedUnits = { ...selectedUnits };
    unitsToSelect.forEach((unit) => {
      newSelectedUnits[unit.id] = event.target.checked;
    });
    setSelectedUnits(newSelectedUnits);
  };

  const handleApplyStatusToSelected = () => {
    setBatchData((prevBatch) => {
      const updatedUnits = prevBatch.units.map((unit) => {
        let newUnitData = { ...unit };
        if (selectedUnits[unit.id]) {
          const newStepStatuses = newUnitData.stepStatuses.map((ss) =>
            ss.stepId === currentStepIdToUpdate
              ? {
                  ...ss,
                  status: currentStatusToApply,
                  completedDate:
                    currentStatusToApply === 'Complete'
                      ? new Date().toISOString()
                      : ss.completedDate,
                  completedBy:
                    currentStatusToApply === 'Complete' ? currentUserDisplayName : ss.completedBy,
                }
              : ss,
          );
          newUnitData.stepStatuses = newStepStatuses;

          if (isUnitComplete(newUnitData) && !newUnitData.dateFullyCompleted) {
            newUnitData.dateFullyCompleted = getUnitOverallCompletionDate(newUnitData);
          } else if (!isUnitComplete(newUnitData)) {
            newUnitData.dateFullyCompleted = undefined; // Clear if unit becomes incomplete
          }
        }
        return newUnitData;
      });
      return { ...prevBatch, units: updatedUnits };
    });
  };

  const handleMarkAsShipped = () => {
    setBatchData((prevBatch) => {
      const updatedUnits = prevBatch.units.map((unit) => {
        if (selectedUnits[unit.id] && isUnitComplete(unit) && !unit.isShipped) {
          return {
            ...unit,
            isShipped: true,
            shippedDate: new Date().toISOString(),
          };
        }
        return unit;
      });
      return { ...prevBatch, units: updatedUnits };
    });
  };

  const getUnitLastCompletedStepInfo = (
    unit: PRProductionUnit,
  ): { name: string; date?: string; completedBy?: string } => {
    let lastCompletedStepName = 'N/A';
    let lastCompletedDate: string | undefined = undefined;
    let lastCompletedBy: string | undefined = undefined;
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
          lastCompletedBy = statusEntry.completedBy;
        }
      }
    });
    return { name: lastCompletedStepName, date: lastCompletedDate, completedBy: lastCompletedBy };
  };

  const handleOpenAddModal = () => {
    // Ensure form is primed with current batch data or defaults if modal is opened
    setAddUnitsForm({
      quantity: 1, // Default or reset quantity
      startUnitSN: `PR-UNITSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
      startPcbSN: `PR-PCBSN-${String(batchData.units.length + 1).padStart(3, '0')}`,
      batchStartDate: batchData.batchStartDate || todayYYYYMMDD,
      batchTargetCompletionDate: batchData.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
    });
    setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenUnitDetailModal = (unit: PRProductionUnit) => {
    setSelectedUnitForDetail(unit);
    setIsUnitDetailModalOpen(true);
  };
  const handleCloseUnitDetailModal = () => {
    setIsUnitDetailModalOpen(false);
    setSelectedUnitForDetail(null);
  };

  const handlePreviousUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id);
    if (currentIndex > 0) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex - 1]);
    }
  };

  const handleNextUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id);
    if (currentIndex < currentVisibleUnits.length - 1) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex + 1]);
    }
  };

  const getCurrentUnitPosition = () => {
    if (!selectedUnitForDetail) return { current: 0, total: 0 };
    const currentIndex = currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id);
    return {
      current: currentIndex + 1,
      total: currentVisibleUnits.length
    };
  };

  const handleAddUnitsFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAddUnitsForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleAddNewUnits = () => {
    if (addUnitsForm.quantity <= 0 && addUnitsForm.quantity !== null) {
      // Allow 0 if it means just updating dates
      alert('Quantity must be greater than 0 if adding units.');
      // return; // Or handle date-only update
    }
    const newUnits =
      addUnitsForm.quantity > 0
        ? createNewPRUnits(addUnitsForm.quantity, addUnitsForm.startUnitSN, addUnitsForm.startPcbSN)
        : [];

    setBatchData((prevBatch) => {
      const combinedUnits = [...prevBatch.units, ...newUnits];
      const newSelectedState = { ...selectedUnits };
      // Select new units only if on "In Progress" tab and if units were added
      if (newUnits.length > 0 && (activeTab === 0 || activeTab === 1)) {
        newUnits.forEach((unit) => {
          newSelectedState[unit.id] = true;
        });
      }

      setSelectedUnits(newSelectedState);
      return {
        ...prevBatch,
        units: combinedUnits,
        quantity: prevBatch.quantity + newUnits.length,
        batchStartDate: addUnitsForm.batchStartDate, // Update batch start date
        batchTargetCompletionDate: addUnitsForm.batchTargetCompletionDate, // Update batch target date
      };
    });
    handleCloseAddModal();
  };

  const numberOfSelectedUnitsInCurrentTab = currentVisibleUnits.filter(
    (unit) => selectedUnits[unit.id],
  ).length;
  const totalUnitsInCurrentTab = currentVisibleUnits.length;

  // Helper to format date strings safely for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'Not set';
    // Assuming dateString is 'YYYY-MM-DD'
    try {
      const date = new Date(dateString + 'T00:00:00'); // Interpret as local date
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Paper sx={{ p: 3, width: '100%' }}> {/* Optimized padding and ensured full width usage */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}> {/* Increased margin bottom */}
        <Typography variant="h4">{batchData.batchName} Batch Tracking</Typography> {/* Changed from h5 to h4 */}
        <Tooltip title="Add New Units / Edit Batch Dates">
          <Button
            variant="contained"
            startIcon={<IconPlus size="20" />} 
            onClick={handleOpenAddModal}
            size="large" // Added large size
          >
            Add Units / Dates
          </Button>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          mb: 3, // Increased margin bottom
          gap: 4, // Increased gap
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body1" component="span"> {/* Changed from body2 to body1 */}
          Batch Start: <strong>{formatDateForDisplay(batchData.batchStartDate)}</strong>
        </Typography>
        <Typography variant="body1" component="span"> {/* Changed from body2 to body1 */}
          Target Completion:{' '}
          <strong>{formatDateForDisplay(batchData.batchTargetCompletionDate)}</strong>
        </Typography>
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
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem', // Increased tab font size
              minHeight: 56, // Increased tab height
              padding: '12px 24px', // Increased padding
            }
          }}
        >
          <Tab label={`In Progress (${inProgressUnits.length})`} />
          <Tab label={`Completed (${completedUnits.length})`} />
          <Tab label={`Shipped (${shippedUnits.length})`} />
        </Tabs>
      </AppBar>

      <Grid container spacing={3} sx={{ mt: 1 }}> {/* Reduced spacing slightly for better fit */}
        <Grid item xs={12} md={activeTab === 0 ? 9 : 12}> {/* Increased table area to 9/12 when sidebar is visible */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}> {/* Changed from subtitle1 to h6, increased margins */}
            {activeTab === 0
              ? `In Progress Units (${totalUnitsInCurrentTab})`
              : activeTab === 1
              ? `Completed Units (${totalUnitsInCurrentTab})`
              : `Shipped Units (${totalUnitsInCurrentTab})`}
          </Typography>
          <TableContainer sx={{ maxHeight: '70vh', width: '100%', overflowX: 'auto' }}> {/* Removed minWidth that was causing issues, added proper overflow handling */}
            <Table stickyHeader sx={{ minWidth: 650 }}> {/* Added minWidth to table itself for proper column sizing */}
              <TableHead>
                <TableRow>
                  {(activeTab === 0 || activeTab === 1) && (
                    <TableCell padding="checkbox" sx={{ fontSize: '0.95rem' }}> {/* Increased font size */}
                      <Checkbox
                        color="primary"
                        size="medium" // Changed from default to medium
                        indeterminate={
                          numberOfSelectedUnitsInCurrentTab > 0 &&
                          numberOfSelectedUnitsInCurrentTab < totalUnitsInCurrentTab
                        }
                        checked={
                          totalUnitsInCurrentTab > 0 &&
                          numberOfSelectedUnitsInCurrentTab === totalUnitsInCurrentTab
                        }
                        onChange={(e) => handleSelectAllChange(e, currentVisibleUnits)}
                        disabled={totalUnitsInCurrentTab === 0}
                      />
                    </TableCell>
                  )}
                  {activeTab === 2 && <TableCell padding="none" sx={{ width: '56px' }} />}
                  <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '15%' }}>Unit S/N</TableCell> {/* Using percentages instead of fixed minWidth */}
                  {activeTab === 0 && <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '15%' }}>PCB S/N</TableCell>}
                  {activeTab === 0 && <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '35%' }}>Last Step Completed</TableCell>}
                  {activeTab === 0 && <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '12%' }}>Date</TableCell>}
                  {activeTab === 0 && <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '18%' }}>Completed By</TableCell>}
                  {activeTab === 1 && <TableCell sx={{ fontSize: '0.95rem', fontWeight: 600, width: '20%' }}>Date Completed</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentVisibleUnits.map((unit) => {
                  const lastStepInfo = activeTab === 0 ? getUnitLastCompletedStepInfo(unit) : null;
                  return (
                    <TableRow
                      hover
                      key={unit.id}
                      selected={!!selectedUnits[unit.id]}
                      onClick={(e) => {
                        // Check if the click was on a checkbox - if so, don't open the modal
                        const target = e.target as HTMLElement;
                        const isCheckboxClick = (target instanceof HTMLInputElement && target.type === 'checkbox') || 
                                              target.closest('input[type="checkbox"]') ||
                                              target.closest('.MuiCheckbox-root');
                        
                        if (!isCheckboxClick) {
                          // If it's not a checkbox click, open the unit detail modal
                          handleOpenUnitDetailModal(unit);
                        } else if (activeTab === 0 || activeTab === 1) {
                          // If it is a checkbox click, handle selection
                          handleUnitSelectionChange(unit.id);
                        }
                      }}
                      sx={{ 
                        cursor: 'pointer', // Always show pointer cursor
                        '& .MuiTableCell-root': {
                          fontSize: '0.9rem', // Increased body text size
                          padding: '16px', // Increased cell padding
                        }
                      }}
                    >
                      {(activeTab === 0 || activeTab === 1) && (
                        <TableCell padding="checkbox">
                          <Checkbox 
                            color="primary" 
                            checked={!!selectedUnits[unit.id]} 
                            size="medium" // Changed from default to medium
                          />
                        </TableCell>
                      )}
                      {activeTab === 2 && <TableCell padding="none" />}
                      <TableCell sx={{ fontWeight: 500 }}>{unit.unitSN}</TableCell> {/* Made unit SN slightly bolder */}
                      {activeTab === 0 && <TableCell>{unit.pcbSN}</TableCell>}
                      {activeTab === 0 && lastStepInfo && (
                        <>
                          <TableCell>{lastStepInfo.name}</TableCell>
                          <TableCell>{lastStepInfo.date || '—'}</TableCell>
                          <TableCell>{lastStepInfo.completedBy || '—'}</TableCell>
                        </>
                      )}
                      {activeTab === 1 && (
                        <TableCell>
                          {unit.dateFullyCompleted
                            ? formatDateForDisplay(unit.dateFullyCompleted.split('T')[0])
                            : '—'}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {activeTab === 1 && (
            <Button
              variant="contained"
              onClick={handleMarkAsShipped}
              disabled={numberOfSelectedUnitsInCurrentTab === 0}
              sx={{ mt: 3, fontSize: '1rem' }} // Increased margin and font size
              startIcon={<IconTruckDelivery size="20" />} // Increased icon size
              size="large" // Added large size
            >
              Mark {numberOfSelectedUnitsInCurrentTab} Selected as Shipped
            </Button>
          )}
        </Grid>

        {activeTab === 0 && (
          <Grid item xs={12} md={3}> {/* Reduced sidebar to 3/12 to maximize table space */}
            <Box sx={{ pt: 2 }}> {/* Increased padding top */}
              <Typography variant="h6" gutterBottom> {/* Changed from subtitle1 to h6 */}
                Update Status for Selected
              </Typography>
              <FormControl fullWidth sx={{ my: 3 }}> {/* Increased margin */}
                <InputLabel id="pr-step-select-label" sx={{ fontSize: '1rem' }}>Step to Update</InputLabel> {/* Increased label font size */}
                <Select<string>
                  labelId="pr-step-select-label"
                  value={currentStepIdToUpdate}
                  label="Step to Update"
                  onChange={(e: SelectChangeEvent<string>) =>
                    setCurrentStepIdToUpdate(e.target.value)
                  }
                  size="medium" // Added size prop
                  sx={{ fontSize: '0.95rem' }} // Increased select font size
                >
                  {PR_PROJECT_STEPS.map((step) => (
                    <MenuItem key={step.id} value={step.id} sx={{ fontSize: '0.9rem' }}> {/* Increased menu item font size */}
                      {step.order}. {step.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 3 }}> {/* Increased margin */}
                <InputLabel id="pr-status-select-label" sx={{ fontSize: '1rem' }}>New Status</InputLabel> {/* Increased label font size */}
                <Select<PRStepStatusType>
                  labelId="pr-status-select-label"
                  value={currentStatusToApply}
                  label="New Status"
                  onChange={(e: SelectChangeEvent<PRStepStatusType>) =>
                    setCurrentStatusToApply(e.target.value as PRStepStatusType)
                  }
                  size="medium" // Added size prop
                  sx={{ fontSize: '0.95rem' }} // Increased select font size
                >
                  {(['Not Started', 'In Progress', 'Complete', 'N/A'] as PRStepStatusType[]).map(
                    (status) => (
                      <MenuItem key={status} value={status} sx={{ fontSize: '0.9rem' }}> {/* Increased menu item font size */}
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
                sx={{ mb: 3, fontSize: '1rem', py: 1.5 }} // Increased margin, font size, and padding
                size="large" // Added large size
              >
                Apply to {numberOfSelectedUnitsInCurrentTab} Unit(s)
              </Button>
              <Typography variant="body1" sx={{ mt: 2, mb: 2, display: 'block', fontWeight: 500 }}> {/* Changed from caption, increased margins and weight */}
                Preview - Current status of '
                {PR_PROJECT_STEPS.find((s) => s.id === currentStepIdToUpdate)?.name}' for first 5
                selected:
              </Typography>
              <Box sx={{ maxHeight: 180, overflowY: 'auto', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}> {/* Increased height, added padding and background */}
                {currentVisibleUnits
                  .filter((u) => selectedUnits[u.id])
                  .slice(0, 5)
                  .map((unit) => {
                    const currentStepStatus =
                      unit.stepStatuses.find((ss) => ss.stepId === currentStepIdToUpdate)?.status ||
                      'N/A';
                    return (
                      <Typography
                        key={unit.id}
                        variant="body2" // Changed from caption to body2
                        display="block"
                        sx={{ fontSize: '0.85rem', mb: 0.5 }} // Increased font size and added margin
                      >
                        {unit.unitSN}: {currentStepStatus}
                      </Typography>
                    );
                  })}
                {numberOfSelectedUnitsInCurrentTab > 5 && (
                  <Typography variant="body2" display="block" sx={{ fontSize: '0.85rem', fontStyle: 'italic' }}> {/* Changed from caption, increased font size */}
                    ...and {numberOfSelectedUnitsInCurrentTab - 5} more.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth> {/* Changed maxWidth from sm to md */}
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 2 }}>Add New Units / Edit Batch Dates</DialogTitle> {/* Increased font size and padding */}
        <DialogContent sx={{ pt: 2 }}> {/* Added padding top */}
          <TextField
            autoFocus
            margin="normal" // Changed from dense to normal
            name="quantity"
            label="Quantity to Add (0 to only update dates)"
            type="number"
            fullWidth
            variant="outlined"
            value={addUnitsForm.quantity}
            onChange={handleAddUnitsFormChange}
            InputProps={{ inputProps: { min: 0 } }} // Allow 0
            sx={{ mb: 3 }} // Increased margin
            size="medium" // Added size prop
            InputLabelProps={{ sx: { fontSize: '1rem' } }} // Increased label font size
          />
          <TextField
            margin="normal" // Changed from dense to normal
            name="startUnitSN"
            label="Starting Unit S/N (e.g., PR-UNITSN-006)"
            type="text"
            fullWidth
            variant="outlined"
            value={addUnitsForm.startUnitSN}
            onChange={handleAddUnitsFormChange}
            disabled={addUnitsForm.quantity === 0}
            sx={{ mb: 3 }} // Increased margin
            size="medium" // Added size prop
            InputLabelProps={{ sx: { fontSize: '1rem' } }} // Increased label font size
          />
          <TextField
            margin="normal" // Changed from dense to normal
            name="startPcbSN"
            label="Starting PCB S/N (e.g., PR-PCBSN-006)"
            type="text"
            fullWidth
            variant="outlined"
            value={addUnitsForm.startPcbSN}
            onChange={handleAddUnitsFormChange}
            disabled={addUnitsForm.quantity === 0}
            sx={{ mb: 3 }} // Increased margin
            size="medium" // Added size prop
            InputLabelProps={{ sx: { fontSize: '1rem' } }} // Increased label font size
          />
          <TextField
            margin="normal" // Changed from dense to normal
            name="batchStartDate"
            label="Batch Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={addUnitsForm.batchStartDate}
            onChange={handleAddUnitsFormChange}
            InputLabelProps={{ shrink: true, sx: { fontSize: '1rem' } }} // Increased label font size
            sx={{ mb: 3 }} // Increased margin
            size="medium" // Added size prop
          />
          <TextField
            margin="normal" // Changed from dense to normal
            name="batchTargetCompletionDate"
            label="Batch Target Completion Date"
            type="date"
            fullWidth
            variant="outlined"
            value={addUnitsForm.batchTargetCompletionDate}
            onChange={handleAddUnitsFormChange}
            InputLabelProps={{ shrink: true, sx: { fontSize: '1rem' } }} // Increased label font size
            size="medium" // Added size prop
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}> {/* Increased padding */}
          <Button onClick={handleCloseAddModal} size="large" sx={{ fontSize: '1rem' }}>Cancel</Button> {/* Added size and font size */}
          <Button onClick={handleAddNewUnits} variant="contained" size="large" sx={{ fontSize: '1rem' }}> {/* Added size and font size */}
            {addUnitsForm.quantity > 0 ? 'Add Units & Save Dates' : 'Save Dates'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unit Detail Modal */}
      <Dialog 
        open={isUnitDetailModalOpen} 
        onClose={handleCloseUnitDetailModal} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            Unit Details: {selectedUnitForDetail?.unitSN}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {getCurrentUnitPosition().current} of {getCurrentUnitPosition().total} units
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePreviousUnit}
              disabled={!selectedUnitForDetail || currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id) === 0}
              size="small"
            >
              ← Previous
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextUnit}
              disabled={!selectedUnitForDetail || currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id) === currentVisibleUnits.length - 1}
              size="small"
            >
              Next →
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedUnitForDetail && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Unit Information</Typography>
                <Typography variant="body1"><strong>Unit S/N:</strong> {selectedUnitForDetail.unitSN}</Typography>
                <Typography variant="body1"><strong>PCB S/N:</strong> {selectedUnitForDetail.pcbSN}</Typography>
                <Typography variant="body1">
                  <strong>Overall Status:</strong> {isUnitComplete(selectedUnitForDetail) ? 'Complete' : 'In Progress'}
                </Typography>
                {selectedUnitForDetail.isShipped && (
                  <Typography variant="body1" color="success.main">
                    <strong>Shipped:</strong> {selectedUnitForDetail.shippedDate ? new Date(selectedUnitForDetail.shippedDate).toLocaleDateString() : 'Yes'}
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>Step Progress</Typography>
              <TableContainer sx={{ maxHeight: '400px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }}>Step</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '50%' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>Completed Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }}>Completed By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PR_PROJECT_STEPS.map((step) => {
                      const stepStatus = selectedUnitForDetail.stepStatuses.find(ss => ss.stepId === step.id);
                      const status = stepStatus?.status || 'Not Started';
                      const completedDate = stepStatus?.completedDate ? new Date(stepStatus.completedDate).toLocaleDateString() : '—';
                      const completedBy = stepStatus?.completedBy || '—';
                      
                      // Color coding for status
                      const getStatusColor = (status: PRStepStatusType) => {
                        switch (status) {
                          case 'Complete': return 'success.main';
                          case 'In Progress': return 'warning.main';
                          case 'N/A': return 'grey.500';
                          default: return 'text.secondary';
                        }
                      };

                      const getStatusBgColor = (status: PRStepStatusType) => {
                        switch (status) {
                          case 'Complete': return 'success.light';
                          case 'In Progress': return 'warning.light';
                          case 'N/A': return 'grey.100';
                          default: return 'transparent';
                        }
                      };

                      return (
                        <TableRow 
                          key={step.id}
                          sx={{ 
                            backgroundColor: getStatusBgColor(status),
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{step.order}</TableCell>
                          <TableCell>{step.name}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: getStatusColor(status),
                                fontWeight: 500 
                              }}
                            >
                              {status}
                            </Typography>
                          </TableCell>
                          <TableCell>{completedDate}</TableCell>
                          <TableCell>{completedBy}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Show next steps for incomplete units */}
              {!isUnitComplete(selectedUnitForDetail) && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom color="info.dark">
                    Next Steps Required
                  </Typography>
                  {PR_PROJECT_STEPS
                    .filter(step => {
                      const stepStatus = selectedUnitForDetail.stepStatuses.find(ss => ss.stepId === step.id);
                      return stepStatus?.status === 'Not Started';
                    })
                    .slice(0, 3) // Show first 3 incomplete steps
                    .map(step => (
                      <Typography key={step.id} variant="body2" sx={{ mb: 0.5 }}>
                        • Step {step.order}: {step.name}
                      </Typography>
                    ))}
                  {PR_PROJECT_STEPS.filter(step => {
                    const stepStatus = selectedUnitForDetail.stepStatuses.find(ss => ss.stepId === step.id);
                    return stepStatus?.status === 'Not Started';
                  }).length > 3 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      ...and {PR_PROJECT_STEPS.filter(step => {
                        const stepStatus = selectedUnitForDetail.stepStatuses.find(ss => ss.stepId === step.id);
                        return stepStatus?.status === 'Not Started';
                      }).length - 3} more steps
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePreviousUnit}
              disabled={!selectedUnitForDetail || currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id) === 0}
              size="large"
              sx={{ fontSize: '1rem' }}
            >
              ← Previous Unit
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextUnit}
              disabled={!selectedUnitForDetail || currentVisibleUnits.findIndex(u => u.id === selectedUnitForDetail.id) === currentVisibleUnits.length - 1}
              size="large"
              sx={{ fontSize: '1rem' }}
            >
              Next Unit →
            </Button>
          </Box>
          <Button onClick={handleCloseUnitDetailModal} variant="contained" size="large" sx={{ fontSize: '1rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PRBatchTrackingComponent;