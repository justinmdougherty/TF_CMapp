// src/views/project-detail/BatchTrackingComponent.tsx
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
import certificateService from '../../services/certificateService';

// --- Generic Types for Batch Tracking System ---
export type StepStatusType = 'Not Started' | 'In Progress' | 'Complete' | 'N/A';

export interface ProductionStep {
  id: string;
  name: string;
  order: number;
}

export interface UnitStepStatus {
  stepId: string;
  status: StepStatusType;
  completedDate?: string;
  completedBy?: string;
}

export interface ProductionUnit {
  id: string;
  unitSN: string;
  pcbSN?: string; // Optional - some project types might not have PCB S/N
  stepStatuses: UnitStepStatus[];
  isShipped?: boolean;
  shippedDate?: string;
  dateFullyCompleted?: string;
  [key: string]: any; // Allow additional custom fields per project type
}

export interface ProductionBatch {
  id: string;
  projectId?: string;
  batchName: string;
  quantity: number;
  units: ProductionUnit[];
  batchStartDate?: string;
  batchTargetCompletionDate?: string;
  [key: string]: any; // Allow additional custom fields per project type
}

// Configuration interface for different project types
export interface ProjectTypeConfig {
  projectType: string;
  displayName: string;
  steps: ProductionStep[];
  tableColumns: TableColumnConfig[];
  unitFields: UnitFieldConfig[];
  batchFields?: BatchFieldConfig[];
  snPrefix: {
    unit: string;
    pcb?: string;
  };
}

export interface TableColumnConfig {
  id: string;
  label: string;
  width?: string;
  minWidth?: number;
  tabs: ('inProgress' | 'completed' | 'shipped')[];
  render?: (unit: ProductionUnit, value: any) => React.ReactNode;
}

export interface UnitFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[]; // For select fields
}

export interface BatchFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required?: boolean;
}

// --- Project Type Configurations ---
const PROJECT_TYPE_CONFIGS: Record<string, ProjectTypeConfig> = {
  PR: {
    projectType: 'PR',
    displayName: 'PR Project',
    steps: [
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
    ],
    tableColumns: [
      {
        id: 'unitSN',
        label: 'Unit S/N',
        width: '15%',
        tabs: ['inProgress', 'completed', 'shipped'],
      },
      {
        id: 'pcbSN',
        label: 'PCB S/N',
        width: '15%',
        tabs: ['inProgress'],
      },
      {
        id: 'lastStepCompleted',
        label: 'Last Step Completed',
        width: '35%',
        tabs: ['inProgress'],
      },
      {
        id: 'lastCompletedDate',
        label: 'Date',
        width: '12%',
        tabs: ['inProgress'],
      },
      {
        id: 'lastCompletedBy',
        label: 'Completed By',
        width: '18%',
        tabs: ['inProgress'],
      },
      {
        id: 'dateCompleted',
        label: 'Date Completed',
        width: '20%',
        tabs: ['completed'],
      },
    ],
    unitFields: [
      { key: 'unitSN', label: 'Unit S/N', type: 'text', required: true },
      { key: 'pcbSN', label: 'PCB S/N', type: 'text', required: true },
    ],
    snPrefix: {
      unit: 'PR-UNITSN-',
      pcb: 'PR-PCBSN-',
    },
  },
  // Add more project types here
  ASSEMBLY: {
    projectType: 'ASSEMBLY',
    displayName: 'Assembly Project',
    steps: [
      { id: 'asm_step_01', name: 'Parts inspection', order: 1 },
      { id: 'asm_step_02', name: 'Component mounting', order: 2 },
      { id: 'asm_step_03', name: 'Soldering', order: 3 },
      { id: 'asm_step_04', name: 'Quality check', order: 4 },
      { id: 'asm_step_05', name: 'Final testing', order: 5 },
      { id: 'asm_step_06', name: 'Packaging', order: 6 },
    ],
    tableColumns: [
      {
        id: 'unitSN',
        label: 'Assembly S/N',
        width: '20%',
        tabs: ['inProgress', 'completed', 'shipped'],
      },
      {
        id: 'lastStepCompleted',
        label: 'Current Step',
        width: '40%',
        tabs: ['inProgress'],
      },
      {
        id: 'lastCompletedDate',
        label: 'Date',
        width: '20%',
        tabs: ['inProgress'],
      },
      {
        id: 'lastCompletedBy',
        label: 'Technician',
        width: '20%',
        tabs: ['inProgress'],
      },
      {
        id: 'dateCompleted',
        label: 'Completed Date',
        width: '25%',
        tabs: ['completed'],
      },
    ],
    unitFields: [{ key: 'unitSN', label: 'Assembly S/N', type: 'text', required: true }],
    snPrefix: {
      unit: 'ASM-',
    },
  },
};

// --- Helper Functions ---
const createInitialStepStatuses = (steps: ProductionStep[]): UnitStepStatus[] => {
  return steps.map((step) => ({
    stepId: step.id,
    status: 'Not Started',
    completedDate: undefined,
    completedBy: undefined,
  }));
};

const createNewUnits = (
  count: number,
  startUnitSNStr: string,
  startPcbSNStr: string | undefined,
  config: ProjectTypeConfig,
): ProductionUnit[] => {
  const units: ProductionUnit[] = [];
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
  const pcbSNInfo = startPcbSNStr ? parseSN(startPcbSNStr) : null;

  for (let i = 0; i < count; i++) {
    const unitIndex = Date.now() + i;
    const currentUnitNum = unitSNInfo.num + i;
    const currentPcbNum = pcbSNInfo ? pcbSNInfo.num + i : null;

    const unit: ProductionUnit = {
      id: `${config.projectType.toLowerCase()}_unit_id_new_${unitIndex}`,
      unitSN: `${unitSNInfo.prefix}${String(currentUnitNum).padStart(unitSNInfo.padding, '0')}`,
      stepStatuses: createInitialStepStatuses(config.steps),
      isShipped: false,
      shippedDate: undefined,
      dateFullyCompleted: undefined,
    };

    if (pcbSNInfo && currentPcbNum !== null) {
      unit.pcbSN = `${pcbSNInfo.prefix}${String(currentPcbNum).padStart(pcbSNInfo.padding, '0')}`;
    }

    units.push(unit);
  }
  return units;
};

const isUnitComplete = (unit: ProductionUnit): boolean => {
  return unit.stepStatuses.every((ss) => ss.status === 'Complete' || ss.status === 'N/A');
};

const getUnitOverallCompletionDate = (unit: ProductionUnit): string | undefined => {
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

  if (typeof latestDate !== 'undefined') {
    return (latestDate as Date).toISOString();
  } else {
    return undefined;
  }
};

// --- Main Component ---
interface BatchTrackingComponentProps {
  projectId: string;
  projectType: string; // This will determine which configuration to use
}

const BatchTrackingComponent: React.FC<BatchTrackingComponentProps> = ({
  projectId,
  projectType,
}) => {
  // Get configuration for this project type
  const config = PROJECT_TYPE_CONFIGS[projectType.toUpperCase()];

  if (!config) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error: Unknown project type "{projectType}"
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported project types: {Object.keys(PROJECT_TYPE_CONFIGS).join(', ')}
        </Typography>
      </Paper>
    );
  }

  // Create initial mock data based on configuration
  const todayYYYYMMDD = new Date().toISOString().split('T')[0];
  const oneWeekFromTodayYYYYMMDD = new Date(new Date().setDate(new Date().getDate() + 7))
    .toISOString()
    .split('T')[0];

  const initialMockBatch: ProductionBatch = {
    id: `mock_${config.projectType.toLowerCase()}_batch_001`,
    projectId: projectId,
    batchName: config.projectType,
    quantity: 5,
    units: createNewUnits(
      5,
      `${config.snPrefix.unit}001`,
      config.snPrefix.pcb ? `${config.snPrefix.pcb}001` : undefined,
      config,
    ),
    batchStartDate: todayYYYYMMDD,
    batchTargetCompletionDate: oneWeekFromTodayYYYYMMDD,
  };

  const [batchData, setBatchData] = useState<ProductionBatch>(initialMockBatch);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>({});
  const [currentStepIdToUpdate, setCurrentStepIdToUpdate] = useState<string>(config.steps[0].id);
  const [currentStatusToApply, setCurrentStatusToApply] = useState<StepStatusType>('Not Started');
  const [activeTab, setActiveTab] = useState(0);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('Loading User...');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUnitDetailModalOpen, setIsUnitDetailModalOpen] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<ProductionUnit | null>(null);

  const [addUnitsForm, setAddUnitsForm] = useState({
    quantity: 1,
    startUnitSN: `${config.snPrefix.unit}${String(initialMockBatch.units.length + 1).padStart(
      3,
      '0',
    )}`,
    startPcbSN: config.snPrefix.pcb
      ? `${config.snPrefix.pcb}${String(initialMockBatch.units.length + 1).padStart(3, '0')}`
      : '',
    batchStartDate: initialMockBatch.batchStartDate || todayYYYYMMDD,
    batchTargetCompletionDate:
      initialMockBatch.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
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
    const inProg: ProductionUnit[] = [];
    const comp: ProductionUnit[] = [];
    const ship: ProductionUnit[] = [];

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
        inProg.push({ ...unit, dateFullyCompleted: undefined });
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
    const newSelected: Record<string, boolean> = {};
    currentVisibleUnits.forEach((unit) => {
      if (selectedUnits[unit.id] !== undefined) {
        newSelected[unit.id] = selectedUnits[unit.id];
      } else if (activeTab === 0 || activeTab === 1) {
        newSelected[unit.id] = true;
      }
    });
    setSelectedUnits(newSelected);
  }, [activeTab, currentVisibleUnits.map((u) => u.id).join(',')]);

  useEffect(() => {
    setAddUnitsForm((prev) => ({
      ...prev,
      startUnitSN: `${config.snPrefix.unit}${String(batchData.units.length + 1).padStart(3, '0')}`,
      startPcbSN: config.snPrefix.pcb
        ? `${config.snPrefix.pcb}${String(batchData.units.length + 1).padStart(3, '0')}`
        : '',
      batchStartDate: batchData.batchStartDate || todayYYYYMMDD,
      batchTargetCompletionDate: batchData.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
    }));
  }, [
    batchData.units.length,
    batchData.batchStartDate,
    batchData.batchTargetCompletionDate,
    config,
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUnitSelectionChange = (unitId: string) => {
    setSelectedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    unitsToSelect: ProductionUnit[],
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
            newUnitData.dateFullyCompleted = undefined;
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
    unit: ProductionUnit,
  ): { name: string; date?: string; completedBy?: string } => {
    let lastCompletedStepName = 'N/A';
    let lastCompletedDate: string | undefined = undefined;
    let lastCompletedBy: string | undefined = undefined;
    let maxOrder = -1;

    unit.stepStatuses.forEach((statusEntry) => {
      if (statusEntry.status === 'Complete') {
        const stepDefinition = config.steps.find((s) => s.id === statusEntry.stepId);
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
    setAddUnitsForm({
      quantity: 1,
      startUnitSN: `${config.snPrefix.unit}${String(batchData.units.length + 1).padStart(3, '0')}`,
      startPcbSN: config.snPrefix.pcb
        ? `${config.snPrefix.pcb}${String(batchData.units.length + 1).padStart(3, '0')}`
        : '',
      batchStartDate: batchData.batchStartDate || todayYYYYMMDD,
      batchTargetCompletionDate: batchData.batchTargetCompletionDate || oneWeekFromTodayYYYYMMDD,
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenUnitDetailModal = (unit: ProductionUnit) => {
    setSelectedUnitForDetail(unit);
    setIsUnitDetailModalOpen(true);
  };

  const handleCloseUnitDetailModal = () => {
    setIsUnitDetailModalOpen(false);
    setSelectedUnitForDetail(null);
  };

  const handlePreviousUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id);
    if (currentIndex > 0) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex - 1]);
    }
  };

  const handleNextUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id);
    if (currentIndex < currentVisibleUnits.length - 1) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex + 1]);
    }
  };

  const getCurrentUnitPosition = () => {
    if (!selectedUnitForDetail) return { current: 0, total: 0 };
    const currentIndex = currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id);
    return {
      current: currentIndex + 1,
      total: currentVisibleUnits.length,
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
      alert('Quantity must be greater than 0 if adding units.');
    }
    const newUnits =
      addUnitsForm.quantity > 0
        ? createNewUnits(
            addUnitsForm.quantity,
            addUnitsForm.startUnitSN,
            addUnitsForm.startPcbSN || undefined,
            config,
          )
        : [];

    setBatchData((prevBatch) => {
      const combinedUnits = [...prevBatch.units, ...newUnits];
      const newSelectedState = { ...selectedUnits };
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
        batchStartDate: addUnitsForm.batchStartDate,
        batchTargetCompletionDate: addUnitsForm.batchTargetCompletionDate,
      };
    });
    handleCloseAddModal();
  };

  const numberOfSelectedUnitsInCurrentTab = currentVisibleUnits.filter(
    (unit) => selectedUnits[unit.id],
  ).length;
  const totalUnitsInCurrentTab = currentVisibleUnits.length;

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Dynamic column rendering based on configuration
  const renderTableColumns = (tab: 'inProgress' | 'completed' | 'shipped') => {
    const relevantColumns = config.tableColumns.filter((col) => col.tabs.includes(tab));

    return relevantColumns.map((column) => (
      <TableCell
        key={column.id}
        sx={{
          fontSize: '0.95rem',
          fontWeight: 600,
          width: column.width,
          minWidth: column.minWidth,
        }}
      >
        {column.label}
      </TableCell>
    ));
  };

  const renderTableCellContent = (unit: ProductionUnit, column: TableColumnConfig) => {
    switch (column.id) {
      case 'unitSN':
        return <TableCell sx={{ fontWeight: 500 }}>{unit.unitSN}</TableCell>;
      case 'pcbSN':
        return <TableCell>{unit.pcbSN || '—'}</TableCell>;
      case 'lastStepCompleted':
        const lastStepInfo = getUnitLastCompletedStepInfo(unit);
        return <TableCell>{lastStepInfo.name}</TableCell>;
      case 'lastCompletedDate':
        const lastStepInfo2 = getUnitLastCompletedStepInfo(unit);
        return <TableCell>{lastStepInfo2.date || '—'}</TableCell>;
      case 'lastCompletedBy':
        const lastStepInfo3 = getUnitLastCompletedStepInfo(unit);
        return <TableCell>{lastStepInfo3.completedBy || '—'}</TableCell>;
      case 'dateCompleted':
        return (
          <TableCell>
            {unit.dateFullyCompleted
              ? formatDateForDisplay(unit.dateFullyCompleted.split('T')[0])
              : '—'}
          </TableCell>
        );
      default:
        return <TableCell>—</TableCell>;
    }
  };

  const currentTabName = activeTab === 0 ? 'inProgress' : activeTab === 1 ? 'completed' : 'shipped';

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{config.displayName} Batch Tracking</Typography>
        <Tooltip title="Add New Units / Edit Batch Dates">
          <Button
            variant="contained"
            startIcon={<IconPlus size="20" />}
            onClick={handleOpenAddModal}
            size="large"
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
          mb: 3,
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body1" component="span">
          Batch Start: <strong>{formatDateForDisplay(batchData.batchStartDate)}</strong>
        </Typography>
        <Typography variant="body1" component="span">
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
              fontSize: '1rem',
              minHeight: 56,
              padding: '12px 24px',
            },
          }}
        >
          <Tab label={`In Progress (${inProgressUnits.length})`} />
          <Tab label={`Completed (${completedUnits.length})`} />
          <Tab label={`Shipped (${shippedUnits.length})`} />
        </Tabs>
      </AppBar>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={activeTab === 0 ? 9 : 12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            {activeTab === 0
              ? `In Progress Units (${totalUnitsInCurrentTab})`
              : activeTab === 1
              ? `Completed Units (${totalUnitsInCurrentTab})`
              : `Shipped Units (${totalUnitsInCurrentTab})`}
          </Typography>
          <TableContainer sx={{ maxHeight: '70vh', width: '100%', overflowX: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  {(activeTab === 0 || activeTab === 1) && (
                    <TableCell padding="checkbox" sx={{ fontSize: '0.95rem' }}>
                      <Checkbox
                        color="primary"
                        size="medium"
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
                  {renderTableColumns(currentTabName as 'inProgress' | 'completed' | 'shipped')}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentVisibleUnits.map((unit) => {
                  return (
                    <TableRow
                      hover
                      key={unit.id}
                      selected={!!selectedUnits[unit.id]}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const isCheckboxClick =
                          (target instanceof HTMLInputElement && target.type === 'checkbox') ||
                          target.closest('input[type="checkbox"]') ||
                          target.closest('.MuiCheckbox-root');

                        if (!isCheckboxClick) {
                          handleOpenUnitDetailModal(unit);
                        } else if (activeTab === 0 || activeTab === 1) {
                          handleUnitSelectionChange(unit.id);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '& .MuiTableCell-root': {
                          fontSize: '0.9rem',
                          padding: '16px',
                        },
                      }}
                    >
                      {(activeTab === 0 || activeTab === 1) && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={!!selectedUnits[unit.id]}
                            size="medium"
                          />
                        </TableCell>
                      )}
                      {activeTab === 2 && <TableCell padding="none" />}
                      {config.tableColumns
                        .filter((col) =>
                          col.tabs.includes(
                            currentTabName as 'inProgress' | 'completed' | 'shipped',
                          ),
                        )
                        .map((column) => renderTableCellContent(unit, column))}
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
              sx={{ mt: 3, fontSize: '1rem' }}
              startIcon={<IconTruckDelivery size="20" />}
              size="large"
            >
              Mark {numberOfSelectedUnitsInCurrentTab} Selected as Shipped
            </Button>
          )}
        </Grid>

        {activeTab === 0 && (
          <Grid item xs={12} md={3}>
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Update Status for Selected
              </Typography>
              <FormControl fullWidth sx={{ my: 3 }}>
                <InputLabel id="step-select-label" sx={{ fontSize: '1rem' }}>
                  Step to Update
                </InputLabel>
                <Select<string>
                  labelId="step-select-label"
                  value={currentStepIdToUpdate}
                  label="Step to Update"
                  onChange={(e: SelectChangeEvent<string>) =>
                    setCurrentStepIdToUpdate(e.target.value)
                  }
                  size="medium"
                  sx={{ fontSize: '0.95rem' }}
                >
                  {config.steps.map((step) => (
                    <MenuItem key={step.id} value={step.id} sx={{ fontSize: '0.9rem' }}>
                      {step.order}. {step.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="status-select-label" sx={{ fontSize: '1rem' }}>
                  New Status
                </InputLabel>
                <Select<StepStatusType>
                  labelId="status-select-label"
                  value={currentStatusToApply}
                  label="New Status"
                  onChange={(e: SelectChangeEvent<StepStatusType>) =>
                    setCurrentStatusToApply(e.target.value as StepStatusType)
                  }
                  size="medium"
                  sx={{ fontSize: '0.95rem' }}
                >
                  {(['Not Started', 'In Progress', 'Complete', 'N/A'] as StepStatusType[]).map(
                    (status) => (
                      <MenuItem key={status} value={status} sx={{ fontSize: '0.9rem' }}>
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
                sx={{ mb: 3, fontSize: '1rem', py: 1.5 }}
                size="large"
              >
                Apply to {numberOfSelectedUnitsInCurrentTab} Unit(s)
              </Button>
              <Typography variant="body1" sx={{ mt: 2, mb: 2, display: 'block', fontWeight: 500 }}>
                Preview - Current status of '
                {config.steps.find((s) => s.id === currentStepIdToUpdate)?.name}' for first 5
                selected:
              </Typography>
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                }}
              >
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
                        variant="body2"
                        display="block"
                        sx={{ fontSize: '0.85rem', mb: 0.5 }}
                      >
                        {unit.unitSN}: {currentStepStatus}
                      </Typography>
                    );
                  })}
                {numberOfSelectedUnitsInCurrentTab > 5 && (
                  <Typography
                    variant="body2"
                    display="block"
                    sx={{ fontSize: '0.85rem', fontStyle: 'italic' }}
                  >
                    ...and {numberOfSelectedUnitsInCurrentTab - 5} more.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Add Units Modal */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 2 }}>
          Add New Units / Edit Batch Dates
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="normal"
            name="quantity"
            label="Quantity to Add (0 to only update dates)"
            type="number"
            fullWidth
            variant="outlined"
            value={addUnitsForm.quantity}
            onChange={handleAddUnitsFormChange}
            InputProps={{ inputProps: { min: 0 } }}
            sx={{ mb: 3 }}
            size="medium"
            InputLabelProps={{ sx: { fontSize: '1rem' } }}
          />
          <TextField
            margin="normal"
            name="startUnitSN"
            label={`Starting ${
              config.unitFields.find((f) => f.key === 'unitSN')?.label || 'Unit S/N'
            }`}
            type="text"
            fullWidth
            variant="outlined"
            value={addUnitsForm.startUnitSN}
            onChange={handleAddUnitsFormChange}
            disabled={addUnitsForm.quantity === 0}
            sx={{ mb: 3 }}
            size="medium"
            InputLabelProps={{ sx: { fontSize: '1rem' } }}
          />
          {config.snPrefix.pcb && (
            <TextField
              margin="normal"
              name="startPcbSN"
              label={`Starting ${
                config.unitFields.find((f) => f.key === 'pcbSN')?.label || 'PCB S/N'
              }`}
              type="text"
              fullWidth
              variant="outlined"
              value={addUnitsForm.startPcbSN}
              onChange={handleAddUnitsFormChange}
              disabled={addUnitsForm.quantity === 0}
              sx={{ mb: 3 }}
              size="medium"
              InputLabelProps={{ sx: { fontSize: '1rem' } }}
            />
          )}
          <TextField
            margin="normal"
            name="batchStartDate"
            label="Batch Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={addUnitsForm.batchStartDate}
            onChange={handleAddUnitsFormChange}
            InputLabelProps={{ shrink: true, sx: { fontSize: '1rem' } }}
            sx={{ mb: 3 }}
            size="medium"
          />
          <TextField
            margin="normal"
            name="batchTargetCompletionDate"
            label="Batch Target Completion Date"
            type="date"
            fullWidth
            variant="outlined"
            value={addUnitsForm.batchTargetCompletionDate}
            onChange={handleAddUnitsFormChange}
            InputLabelProps={{ shrink: true, sx: { fontSize: '1rem' } }}
            size="medium"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAddModal} size="large" sx={{ fontSize: '1rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNewUnits}
            variant="contained"
            size="large"
            sx={{ fontSize: '1rem' }}
          >
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
        <DialogTitle
          sx={{
            fontSize: '1.5rem',
            pb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id) === 0
              }
              size="small"
            >
              ← Previous
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextUnit}
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id) ===
                  currentVisibleUnits.length - 1
              }
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
                <Typography variant="h6" gutterBottom>
                  Unit Information
                </Typography>
                <Typography variant="body1">
                  <strong>Unit S/N:</strong> {selectedUnitForDetail.unitSN}
                </Typography>
                {selectedUnitForDetail.pcbSN && (
                  <Typography variant="body1">
                    <strong>PCB S/N:</strong> {selectedUnitForDetail.pcbSN}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>Overall Status:</strong>{' '}
                  {isUnitComplete(selectedUnitForDetail) ? 'Complete' : 'In Progress'}
                </Typography>
                {selectedUnitForDetail.isShipped && (
                  <Typography variant="body1" color="success.main">
                    <strong>Shipped:</strong>{' '}
                    {selectedUnitForDetail.shippedDate
                      ? new Date(selectedUnitForDetail.shippedDate).toLocaleDateString()
                      : 'Yes'}
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Step Progress
              </Typography>
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
                    {config.steps.map((step) => {
                      const stepStatus = selectedUnitForDetail.stepStatuses.find(
                        (ss) => ss.stepId === step.id,
                      );
                      const status = stepStatus?.status || 'Not Started';
                      const completedDate = stepStatus?.completedDate
                        ? new Date(stepStatus.completedDate).toLocaleDateString()
                        : '—';
                      const completedBy = stepStatus?.completedBy || '—';

                      const getStatusColor = (status: StepStatusType) => {
                        switch (status) {
                          case 'Complete':
                            return 'success.main';
                          case 'In Progress':
                            return 'warning.main';
                          case 'N/A':
                            return 'grey.500';
                          default:
                            return 'text.secondary';
                        }
                      };

                      const getStatusBgColor = (status: StepStatusType) => {
                        switch (status) {
                          case 'Complete':
                            return 'success.light';
                          case 'In Progress':
                            return 'warning.light';
                          case 'N/A':
                            return 'grey.100';
                          default:
                            return 'transparent';
                        }
                      };

                      return (
                        <TableRow
                          key={step.id}
                          sx={{
                            backgroundColor: getStatusBgColor(status),
                            '&:hover': { backgroundColor: 'action.hover' },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{step.order}</TableCell>
                          <TableCell>{step.name}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: getStatusColor(status),
                                fontWeight: 500,
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

              {!isUnitComplete(selectedUnitForDetail) && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom color="info.dark">
                    Next Steps Required
                  </Typography>
                  {config.steps
                    .filter((step) => {
                      const stepStatus = selectedUnitForDetail.stepStatuses.find(
                        (ss) => ss.stepId === step.id,
                      );
                      return stepStatus?.status === 'Not Started';
                    })
                    .slice(0, 3)
                    .map((step) => (
                      <Typography key={step.id} variant="body2" sx={{ mb: 0.5 }}>
                        • Step {step.order}: {step.name}
                      </Typography>
                    ))}
                  {config.steps.filter((step) => {
                    const stepStatus = selectedUnitForDetail.stepStatuses.find(
                      (ss) => ss.stepId === step.id,
                    );
                    return stepStatus?.status === 'Not Started';
                  }).length > 3 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      ...and{' '}
                      {config.steps.filter((step) => {
                        const stepStatus = selectedUnitForDetail.stepStatuses.find(
                          (ss) => ss.stepId === step.id,
                        );
                        return stepStatus?.status === 'Not Started';
                      }).length - 3}{' '}
                      more steps
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
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id) === 0
              }
              size="large"
              sx={{ fontSize: '1rem' }}
            >
              ← Previous Unit
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextUnit}
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex((u) => u.id === selectedUnitForDetail.id) ===
                  currentVisibleUnits.length - 1
              }
              size="large"
              sx={{ fontSize: '1rem' }}
            >
              Next Unit →
            </Button>
          </Box>
          <Button
            onClick={handleCloseUnitDetailModal}
            variant="contained"
            size="large"
            sx={{ fontSize: '1rem' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BatchTrackingComponent;
