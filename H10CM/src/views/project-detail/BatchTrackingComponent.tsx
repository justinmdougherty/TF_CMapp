import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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
  CircularProgress,
} from '@mui/material';
import { IconPlus, IconTruckDelivery, IconTimeline } from '@tabler/icons-react';
import certificateService from '../../services/certificateService';
import { notifications } from '../../services/notificationService';
import { Project } from 'src/types/Project';
import { ProductionUnit, TableColumnConfig, StepStatusType } from 'src/types/Production';
import { AttributeDefinition } from 'src/types/AttributeDefinition';
import { ProjectStep } from 'src/types/ProjectSteps';
import {
  useTrackedItems,
  useCreateTrackedItem,
  useBatchUpdateTrackedItemStepProgress,
} from '../../hooks/api/useTrackedItemHooks';
import { useProjectAttributes } from '../../hooks/api/useAttributeDefinitionHooks';
import UnitTimelineModal from '../../components/UnitTimelineModal';

// --- Helper Functions ---
const isUnitComplete = (unit: ProductionUnit): boolean => {
  return (
    unit.step_statuses?.every((ss) => ss.status === 'Complete' || ss.status === 'N/A') ?? false
  );
};

const getUnitOverallCompletionDate = (unit: ProductionUnit): string | undefined => {
  if (!isUnitComplete(unit)) {
    return undefined;
  }
  let latestDate: Date | undefined = undefined;
  unit.step_statuses?.forEach((ss) => {
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

interface BatchTrackingComponentProps {
  project: Project;
  steps: ProjectStep[];
}

const BatchTrackingComponent: React.FC<BatchTrackingComponentProps> = ({ project, steps }) => {
  const queryClient = useQueryClient();

  const {
    data: trackedItems,
    isLoading,
    isError,
    error,
  } = useTrackedItems(project.project_id.toString());

  // Debug logging
  console.log('Tracked items data:', trackedItems);
  console.log('Is loading:', isLoading);
  console.log('Is error:', isError);
  console.log('Error:', error);

  const { data: projectAttributes } = useProjectAttributes(project.project_id.toString());

  const createTrackedItemMutation = useCreateTrackedItem();
  const batchUpdateTrackedItemStepProgressMutation = useBatchUpdateTrackedItemStepProgress();

  // TODO: Implement a proper mutation for marking items as shipped
  const markAsShippedMutation = useMutation<void, Error, string[]>({
    mutationFn: async (itemIds: string[]) => {
      // This is a placeholder. You'll need to implement an API call for this.
      console.log('Marking as shipped:', itemIds);
      // Example: await apiClient.post('/tracked-items/ship', { itemIds });
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackedItems', project.project_id.toString()] });
    },
  });

  const todayYYYYMMDD = new Date().toISOString().split('T')[0];
  const oneWeekFromTodayYYYYMMDD = new Date(new Date().setDate(new Date().getDate() + 7))
    .toISOString()
    .split('T')[0];

  const [selectedUnits, setSelectedUnits] = useState<Record<string, boolean>>({});
  const [currentStepIdToUpdate, setCurrentStepIdToUpdate] = useState<string>('');
  const [currentStatusToApply, setCurrentStatusToApply] = useState<StepStatusType>('Not Started');
  const [activeTab, setActiveTab] = useState(0);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('Loading User...');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUnitDetailModalOpen, setIsUnitDetailModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<ProductionUnit | null>(null);

  const [addUnitsForm, setAddUnitsForm] = useState({
    quantity: 1,
    startUnitSN: '',
    startPcbSN: '',
    batchStartDate: todayYYYYMMDD,
    batchTargetCompletionDate: oneWeekFromTodayYYYYMMDD,
  });

  // Derive config from project, steps, and attributes
  const config = useMemo(() => {
    const baseConfig = {
      projectType: project.project_type,
      displayName: project.project_name,
      steps: steps
        .map((s) => ({ id: s.step_id.toString(), name: s.step_name, order: s.step_order }))
        .sort((a, b) => a.order - b.order),
      unitFields: [],
      snPrefix: {
        unit: `${project.project_name}-`,
        pcb: `${project.project_name}-P`,
      },
    }; // Create table columns dynamically based on attribute definitions from the API
    const dynamicColumns: TableColumnConfig[] = (projectAttributes || [])
      .sort((a, b) => a.display_order - b.display_order) // Sort by display_order
      .map((attr: AttributeDefinition, index: number) => {
        // Optimize column width based on attribute name length, type, and position
        let width: string;
        let minWidth: number = 100;

        // Key attributes (like serial numbers) get more space
        const isKeyAttribute =
          attr.attribute_name.toLowerCase().includes('serial') ||
          attr.attribute_name.toLowerCase().includes('s/n') ||
          index === 0; // First column often contains key info

        if (isKeyAttribute) {
          width = '20%';
          minWidth = 140;
        } else if (attr.attribute_type === 'DATE') {
          width = '12%';
          minWidth = 100;
        } else if (attr.attribute_name.length > 20) {
          width = '18%';
          minWidth = 130;
        } else if (attr.attribute_name.length > 15) {
          width = '16%';
          minWidth = 120;
        } else {
          width = '14%';
          minWidth = 100;
        }

        return {
          id: attr.attribute_definition_id.toString(),
          label: attr.attribute_name,
          width,
          minWidth,
          tabs: ['inProgress', 'completed', 'shipped'],
          render: (unit: ProductionUnit) => {
            // Find the attribute value for this unit
            // The API response structure shows attributes might be in unit.attributes or directly on the unit
            let attributeValue = '';

            if (unit.attributes) {
              const foundAttr = unit.attributes.find(
                (a: any) => a.attribute_definition_id === attr.attribute_definition_id,
              );
              attributeValue = foundAttr?.attribute_value || '';
            }

            return <TableCell>{attributeValue || '—'}</TableCell>;
          },
        };
      });

    // Add status columns for different tabs
    const statusColumns: TableColumnConfig[] = [
      {
        id: 'lastStepCompleted',
        label: 'Last Completed Step',
        width: '20%',
        minWidth: 160,
        tabs: ['inProgress', 'completed'],
      },
      {
        id: 'lastCompletedDate',
        label: 'Last Completed Date',
        width: '15%',
        minWidth: 120,
        tabs: ['inProgress', 'completed'],
      },
      {
        id: 'lastCompletedBy',
        label: 'Completed By',
        width: '15%',
        minWidth: 120,
        tabs: ['inProgress', 'completed'],
      },
      {
        id: 'date_fully_completed',
        label: 'Completion Date',
        width: '15%',
        minWidth: 120,
        tabs: ['completed', 'shipped'],
      },
    ];

    return { ...baseConfig, tableColumns: [...dynamicColumns, ...statusColumns] };
  }, [project, steps, projectAttributes]);

  useEffect(() => {
    if (config.steps.length > 0 && !currentStepIdToUpdate) {
      setCurrentStepIdToUpdate(config.steps[0].id);
    }
  }, [config.steps, currentStepIdToUpdate]);

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

    (trackedItems || []).forEach((unit) => {
      if (unit.is_shipped) {
        ship.push(unit);
      } else if (isUnitComplete(unit)) {
        const overallCompletionDate = getUnitOverallCompletionDate(unit);
        comp.push({
          ...unit,
          date_fully_completed: unit.date_fully_completed || overallCompletionDate,
        });
      } else {
        inProg.push({ ...unit, date_fully_completed: undefined });
      }
    });
    return { inProgressUnits: inProg, completedUnits: comp, shippedUnits: ship };
  }, [trackedItems]);

  const currentVisibleUnits = useMemo(() => {
    if (activeTab === 0) return inProgressUnits;
    if (activeTab === 1) return completedUnits;
    if (activeTab === 2) return shippedUnits;
    return [];
  }, [activeTab, inProgressUnits, completedUnits, shippedUnits]);

  // Auto-select all units by default, preserving existing selections when possible
  useEffect(() => {
    const newSelected: Record<string, boolean> = {};
    currentVisibleUnits.forEach((unit) => {
      // Check if this unit already has a selection state
      if (selectedUnits[unit.item_id] !== undefined) {
        // Preserve existing selection state
        newSelected[unit.item_id] = selectedUnits[unit.item_id];
      } else {
        // Default to selected for all tabs (since most operations are batch operations)
        newSelected[unit.item_id] = true;
      }
    });
    setSelectedUnits(newSelected);
  }, [activeTab, currentVisibleUnits.map((u) => u.item_id).join(',')]);

  // Auto-select new units when they are added to the current view
  useEffect(() => {
    if (currentVisibleUnits.length > 0) {
      setSelectedUnits((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        currentVisibleUnits.forEach((unit) => {
          // If a unit doesn't have a selection state, select it by default
          if (updated[unit.item_id] === undefined) {
            updated[unit.item_id] = true;
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }
  }, [currentVisibleUnits]);

  // Auto-select all units when tracked items data first loads
  useEffect(() => {
    if (trackedItems && trackedItems.length > 0) {
      setSelectedUnits((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        trackedItems.forEach((unit) => {
          // Only auto-select if the unit doesn't already have a selection state
          if (updated[unit.item_id] === undefined) {
            updated[unit.item_id] = true;
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }
  }, [trackedItems]);

  useEffect(() => {
    setAddUnitsForm((prev) => ({
      ...prev,
      startUnitSN: `${config.snPrefix.unit}${String((trackedItems?.length || 0) + 1).padStart(
        3,
        '0',
      )}`,
      startPcbSN: config.snPrefix.pcb
        ? `${config.snPrefix.pcb}${String((trackedItems?.length || 0) + 1).padStart(3, '0')}`
        : '',
      batchStartDate: todayYYYYMMDD,
      batchTargetCompletionDate: oneWeekFromTodayYYYYMMDD,
    }));
  }, [trackedItems?.length, config.snPrefix.unit, config.snPrefix.pcb]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
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
      newSelectedUnits[unit.item_id] = event.target.checked;
    });
    setSelectedUnits(newSelectedUnits);
  };

  const handleApplyStatusToSelected = () => {
    const selectedIds = Object.keys(selectedUnits).filter((id) => selectedUnits[id]);

    if (selectedIds.length === 0) return;

    // Use batch mutation to process all items sequentially
    batchUpdateTrackedItemStepProgressMutation.mutate(
      {
        itemIds: selectedIds,
        stepId: currentStepIdToUpdate,
        projectId: project.project_id.toString(),
        progress: {
          status: currentStatusToApply,
          completed_by_user_name:
            currentStatusToApply === 'Complete' ? currentUserDisplayName : undefined,
        },
      },
      {
        onSuccess: () => {
          // Clear only the selections for items that were processed
          setSelectedUnits((prev) => {
            const newSelections = { ...prev };
            selectedIds.forEach((id) => {
              delete newSelections[id];
            });
            return newSelections;
          });
          console.log(`Successfully updated ${selectedIds.length} items`);
        },
        onError: (error: any) => {
          console.error(`Failed to update step progress for ${selectedIds.length} items:`, error);
          // You could add a toast notification here
        },
      },
    );
  };

  const handleMarkAsShipped = () => {
    const selectedIds = Object.keys(selectedUnits).filter((id) => selectedUnits[id]);
    markAsShippedMutation.mutate(selectedIds, {
      onSuccess: () => {
        // Clear only the selections for items that were processed
        setSelectedUnits((prev) => {
          const newSelections = { ...prev };
          selectedIds.forEach((id) => {
            delete newSelections[id];
          });
          return newSelections;
        });
      },
      onError: (error) => {
        console.error('Failed to mark items as shipped:', error);
        // You could add a toast notification here
      },
    });
  };

  const getUnitLastCompletedStepInfo = (
    unit: ProductionUnit,
  ): { name: string; date?: string; completedBy?: string } => {
    let lastCompletedStepName = 'N/A';
    let lastCompletedDate: string | undefined = undefined;
    let lastCompletedBy: string | undefined = undefined;
    let maxOrder = -1;

    if (unit.step_statuses && Array.isArray(unit.step_statuses)) {
      unit.step_statuses.forEach((statusEntry) => {
        if (statusEntry.status === 'Complete') {
          // Convert stepId to string to match with config.steps
          const stepDefinition = config.steps.find((s) => s.id === statusEntry.stepId.toString());
          if (stepDefinition && stepDefinition.order > maxOrder) {
            maxOrder = stepDefinition.order;
            lastCompletedStepName = stepDefinition.name;
            // Try both possible field names for completion date
            const completionDate = statusEntry.completedDate || statusEntry.completion_timestamp;
            lastCompletedDate = completionDate
              ? new Date(completionDate).toLocaleDateString()
              : undefined;
            // Try both possible field names for completed by
            lastCompletedBy = statusEntry.completedBy || statusEntry.completed_by_user_name;
          }
        }
      });
    }
    return { name: lastCompletedStepName, date: lastCompletedDate, completedBy: lastCompletedBy };
  };

  const handleOpenAddModal = () => {
    setAddUnitsForm({
      quantity: 1,
      startUnitSN: `${config.snPrefix.unit}${String((trackedItems?.length || 0) + 1).padStart(
        3,
        '0',
      )}`,
      startPcbSN: config.snPrefix.pcb
        ? `${config.snPrefix.pcb}${String((trackedItems?.length || 0) + 1).padStart(3, '0')}`
        : '',
      batchStartDate: todayYYYYMMDD,
      batchTargetCompletionDate: oneWeekFromTodayYYYYMMDD,
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

  const handleOpenTimelineModal = () => {
    setIsTimelineModalOpen(true);
  };

  const handleCloseTimelineModal = () => {
    setIsTimelineModalOpen(false);
  };

  const handlePreviousUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex(
      (u) => u.item_id === selectedUnitForDetail.item_id,
    );
    if (currentIndex > 0) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex - 1]);
    }
  };

  const handleNextUnit = () => {
    if (!selectedUnitForDetail) return;
    const currentIndex = currentVisibleUnits.findIndex(
      (u) => u.item_id === selectedUnitForDetail.item_id,
    );
    if (currentIndex < currentVisibleUnits.length - 1) {
      setSelectedUnitForDetail(currentVisibleUnits[currentIndex + 1]);
    }
  };

  const getCurrentUnitPosition = () => {
    if (!selectedUnitForDetail) return { current: 0, total: 0 };
    const currentIndex = currentVisibleUnits.findIndex(
      (u) => u.item_id === selectedUnitForDetail.item_id,
    );
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
    if (addUnitsForm.quantity <= 0) {
      notifications.error('Quantity must be greater than 0.');
      return;
    }

    const currentTrackedItemsCount = trackedItems?.length || 0;

    for (let i = 0; i < addUnitsForm.quantity; i++) {
      const unitSN = `${config.snPrefix.unit}${String(currentTrackedItemsCount + i + 1).padStart(
        3,
        '0',
      )}`;
      const pcbSN = config.snPrefix.pcb
        ? `${config.snPrefix.pcb}${String(currentTrackedItemsCount + i + 1).padStart(3, '0')}`
        : '';

      // Find the primary identifier attribute (first by display_order)
      const primaryAttr = projectAttributes?.find((attr) => attr.display_order === 1);
      const secondaryAttr = projectAttributes?.find((attr) => attr.display_order === 2);

      // Create the tracked item with proper structure matching the TrackedItem type
      const newItem = {
        project_id: project.project_id.toString(),
        unit_serial_number: unitSN, // Required field
        pcb_serial_number: pcbSN || undefined,
        current_overall_status: 'Pending',
        notes: '',
        initial_attributes: [
          ...(primaryAttr
            ? [
                {
                  attribute_definition_id: primaryAttr.attribute_definition_id,
                  attribute_value: unitSN,
                },
              ]
            : []),
          ...(secondaryAttr
            ? [
                {
                  attribute_definition_id: secondaryAttr.attribute_definition_id,
                  attribute_value: pcbSN,
                },
              ]
            : []),
        ],
      };

      createTrackedItemMutation.mutate(newItem as any);
    }
    handleCloseAddModal();
  };

  const numberOfSelectedUnitsInCurrentTab = currentVisibleUnits.filter(
    (unit) => selectedUnits[unit.item_id],
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
          fontSize: '0.85rem',
          fontWeight: 600,
          width: column.width,
          minWidth: column.minWidth,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '6px 8px',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title={column.label} placement="top">
          <Box component="span" sx={{ cursor: 'help' }}>
            {column.label}
          </Box>
        </Tooltip>
      </TableCell>
    ));
  };

  const renderTableCellContent = (unit: ProductionUnit, column: TableColumnConfig) => {
    // Find the attribute definition for this column using the column.id as attribute_definition_id
    const attribute = projectAttributes?.find(
      (attr) => attr.attribute_definition_id.toString() === column.id,
    );

    // Common cell styles to prevent wrapping and handle overflow
    const cellStyles = {
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '4px 8px',
      fontSize: '0.8rem',
    };

    if (attribute) {
      let attributeValue = '';

      // Look for the attribute value in the unit's attributes array
      if (unit.attributes) {
        const foundAttr = unit.attributes.find(
          (a: any) => a.attribute_definition_id === attribute.attribute_definition_id,
        );
        attributeValue = foundAttr?.attribute_value || '';
      }

      // Format based on attribute type
      if (attribute.attribute_type === 'DATE' && attributeValue) {
        try {
          const date = new Date(attributeValue);
          attributeValue = date.toLocaleDateString();
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }

      const displayValue = attributeValue || '—';
      const shouldShowTooltip = attributeValue && attributeValue.length > 20;

      return (
        <TableCell
          sx={{
            ...cellStyles,
            fontWeight: attribute.attribute_name.includes('S/N') ? 500 : 400,
          }}
        >
          {shouldShowTooltip ? (
            <Tooltip title={displayValue} placement="top">
              <Box component="span" sx={{ cursor: 'help' }}>
                {displayValue}
              </Box>
            </Tooltip>
          ) : (
            displayValue
          )}
        </TableCell>
      );
    }

    // Handle standard status columns that are always present
    switch (column.id) {
      case 'lastStepCompleted':
        const lastStepInfo = getUnitLastCompletedStepInfo(unit);
        const stepName = lastStepInfo.name;
        const shouldShowStepTooltip = stepName && stepName.length > 25;
        return (
          <TableCell sx={cellStyles}>
            {shouldShowStepTooltip ? (
              <Tooltip title={stepName} placement="top">
                <Box component="span" sx={{ cursor: 'help' }}>
                  {stepName}
                </Box>
              </Tooltip>
            ) : (
              stepName
            )}
          </TableCell>
        );
      case 'lastCompletedDate':
        const lastStepInfo2 = getUnitLastCompletedStepInfo(unit);
        return <TableCell sx={cellStyles}>{lastStepInfo2.date || '—'}</TableCell>;
      case 'lastCompletedBy':
        const lastStepInfo3 = getUnitLastCompletedStepInfo(unit);
        const completedBy = lastStepInfo3.completedBy || '—';
        const shouldShowUserTooltip = completedBy !== '—' && completedBy.length > 15;
        return (
          <TableCell sx={cellStyles}>
            {shouldShowUserTooltip ? (
              <Tooltip title={completedBy} placement="top">
                <Box component="span" sx={{ cursor: 'help' }}>
                  {completedBy}
                </Box>
              </Tooltip>
            ) : (
              completedBy
            )}
          </TableCell>
        );
      case 'date_fully_completed':
        const completionDate = unit.date_fully_completed
          ? formatDateForDisplay(unit.date_fully_completed.split('T')[0])
          : '—';
        return <TableCell sx={cellStyles}>{completionDate}</TableCell>;
      default:
        return <TableCell sx={cellStyles}>—</TableCell>;
    }
  };

  const currentTabName = activeTab === 0 ? 'inProgress' : activeTab === 1 ? 'completed' : 'shipped';

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontSize: '1.5rem' }}>
          {config.displayName} Batch Tracking
        </Typography>
        <Tooltip title="Add New Units / Edit Batch Dates">
          <Button
            variant="contained"
            startIcon={<IconPlus size="18" />}
            onClick={handleOpenAddModal}
            size="medium"
            sx={{ fontSize: '0.85rem' }}
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
          mb: 2,
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2" component="span" sx={{ fontSize: '0.85rem' }}>
          Batch Start: <strong>{formatDateForDisplay(addUnitsForm.batchStartDate)}</strong>
        </Typography>
        <Typography variant="body2" component="span" sx={{ fontSize: '0.85rem' }}>
          Target Completion:{' '}
          <strong>{formatDateForDisplay(addUnitsForm.batchTargetCompletionDate)}</strong>
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
              fontSize: '0.9rem',
              minHeight: 48,
              padding: '8px 16px',
            },
          }}
        >
          <Tab label={`In Progress (${inProgressUnits.length})`} />
          <Tab label={`Completed (${completedUnits.length})`} />
          <Tab label={`Shipped (${shippedUnits.length})`} />
        </Tabs>
      </AppBar>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Table Section - Takes most of the width */}
        <Grid item xs={12} lg={activeTab === 0 ? 9.5 : 12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1, fontSize: '1.1rem' }}>
            {activeTab === 0
              ? `In Progress Units (${totalUnitsInCurrentTab})`
              : activeTab === 1
              ? `Completed Units (${totalUnitsInCurrentTab})`
              : `Shipped Units (${totalUnitsInCurrentTab})`}
          </Typography>
          <TableContainer
            sx={{
              maxHeight: '70vh',
              width: '100%',
              overflowX: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              '& .MuiTable-root': {
                tableLayout: 'fixed', // Fixed layout to use full width
                width: '100%',
              },
            }}
          >
            <Table
              stickyHeader
              sx={{
                width: '100%',
                minWidth: '100%',
              }}
            >
              <TableHead>
                <TableRow>
                  {(activeTab === 0 || activeTab === 1) && (
                    <TableCell
                      padding="checkbox"
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        padding: '6px 8px',
                      }}
                    >
                      <Checkbox
                        color="primary"
                        size="small"
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
                  {activeTab === 2 && (
                    <TableCell
                      padding="none"
                      sx={{
                        width: '56px',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  )}
                  {renderTableColumns(currentTabName as 'inProgress' | 'completed' | 'shipped')}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentVisibleUnits.map((unit) => {
                  return (
                    <TableRow
                      hover
                      key={unit.item_id}
                      selected={!!selectedUnits[unit.item_id]}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const isCheckboxClick =
                          (target instanceof HTMLInputElement && target.type === 'checkbox') ||
                          target.closest('input[type="checkbox"]') ||
                          target.closest('.MuiCheckbox-root');

                        if (!isCheckboxClick) {
                          handleOpenUnitDetailModal(unit);
                        } else if (activeTab === 0 || activeTab === 1) {
                          handleUnitSelectionChange(unit.item_id.toString());
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        height: '32px', // Much smaller row height
                        '& .MuiTableCell-root': {
                          fontSize: '0.8rem',
                          padding: '4px 8px', // Minimal padding
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      }}
                    >
                      {(activeTab === 0 || activeTab === 1) && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={!!selectedUnits[unit.item_id]}
                            size="small"
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
                        .map((column) => (
                          <React.Fragment key={column.id}>
                            {renderTableCellContent(unit, column)}
                          </React.Fragment>
                        ))}
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
              disabled={numberOfSelectedUnitsInCurrentTab === 0 || markAsShippedMutation.isPending}
              sx={{ mt: 2, fontSize: '0.85rem' }}
              startIcon={
                markAsShippedMutation.isPending ? (
                  <CircularProgress size={18} />
                ) : (
                  <IconTruckDelivery size="18" />
                )
              }
              size="medium"
            >
              {markAsShippedMutation.isPending
                ? 'Shipping...'
                : `Mark ${numberOfSelectedUnitsInCurrentTab} Selected as Shipped`}
            </Button>
          )}
        </Grid>

        {/* Update Status Section - Side panel for In Progress tab */}
        {activeTab === 0 && (
          <Grid item xs={12} lg={2.5}>
            <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, height: 'fit-content', mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '0.95rem', mb: 2 }}>
                Update Status for Selected
              </Typography>
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <InputLabel id="step-select-label" sx={{ fontSize: '0.8rem' }}>
                  Step to Update
                </InputLabel>
                <Select<string>
                  labelId="step-select-label"
                  value={currentStepIdToUpdate}
                  label="Step to Update"
                  onChange={(e: SelectChangeEvent<string>) =>
                    setCurrentStepIdToUpdate(e.target.value)
                  }
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {config.steps.map((step) => (
                    <MenuItem key={step.id} value={step.id} sx={{ fontSize: '0.8rem' }}>
                      {step.order}. {step.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <InputLabel id="status-select-label" sx={{ fontSize: '0.8rem' }}>
                  New Status
                </InputLabel>
                <Select<StepStatusType>
                  labelId="status-select-label"
                  value={currentStatusToApply}
                  label="New Status"
                  onChange={(e: SelectChangeEvent<StepStatusType>) =>
                    setCurrentStatusToApply(e.target.value as StepStatusType)
                  }
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {(['Not Started', 'In Progress', 'Complete', 'N/A'] as StepStatusType[]).map(
                    (status) => (
                      <MenuItem key={status} value={status} sx={{ fontSize: '0.8rem' }}>
                        {status}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleApplyStatusToSelected}
                disabled={
                  numberOfSelectedUnitsInCurrentTab === 0 ||
                  batchUpdateTrackedItemStepProgressMutation.isPending
                }
                fullWidth
                sx={{ mb: 1, fontSize: '0.75rem', py: 0.8 }}
                size="small"
                startIcon={
                  batchUpdateTrackedItemStepProgressMutation.isPending ? (
                    <CircularProgress size={16} />
                  ) : undefined
                }
              >
                {batchUpdateTrackedItemStepProgressMutation.isPending
                  ? 'Updating...'
                  : `Apply to ${numberOfSelectedUnitsInCurrentTab} Unit(s)`}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Add Units Modal */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1.25rem', pb: 1.5 }}>
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
              projectAttributes?.find((attr) => attr.display_order === 1)?.attribute_name ||
              'Unit Serial Number'
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
          {projectAttributes?.find((attr) => attr.display_order === 2) && (
            <TextField
              margin="normal"
              name="startPcbSN"
              label={`Starting ${
                projectAttributes?.find((attr) => attr.display_order === 2)?.attribute_name ||
                'Secondary ID'
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
            {(() => {
              // Get the first column's value (primary attribute) for the title
              const primaryAttr = projectAttributes?.find((attr) => attr.display_order === 1);
              const primaryValue = primaryAttr
                ? selectedUnitForDetail?.attributes?.find(
                    (a) => a.attribute_definition_id === primaryAttr.attribute_definition_id,
                  )?.attribute_value
                : null;

              const displayTitle =
                primaryValue ||
                selectedUnitForDetail?.unit_serial_number ||
                `Item ${selectedUnitForDetail?.item_id}`;

              return (
                <>
                  Unit Details: {displayTitle}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {getCurrentUnitPosition().current} of {getCurrentUnitPosition().total} units
                  </Typography>
                </>
              );
            })()}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handlePreviousUnit}
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex(
                  (u) => u.item_id === selectedUnitForDetail.item_id,
                ) === 0
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
                currentVisibleUnits.findIndex(
                  (u) => u.item_id === selectedUnitForDetail.item_id,
                ) ===
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
                  Status
                </Typography>
                <Typography variant="body1">
                  <strong>Overall Status:</strong>{' '}
                  {isUnitComplete(selectedUnitForDetail) ? 'Complete' : 'In Progress'}
                </Typography>
                {selectedUnitForDetail.is_shipped && (
                  <Typography variant="body1" color="success.main">
                    <strong>Shipped:</strong>{' '}
                    {selectedUnitForDetail.shipped_date
                      ? new Date(selectedUnitForDetail.shipped_date).toLocaleDateString()
                      : 'Yes'}
                  </Typography>
                )}
                {/* Render additional dynamic attributes (skip primary and secondary which are handled above) */}
                {projectAttributes
                  ?.filter((attr) => attr.display_order > 2) // Skip primary and secondary
                  ?.map((attr) => {
                    let attributeValue = '';

                    if (selectedUnitForDetail.attributes) {
                      const foundAttr = selectedUnitForDetail.attributes.find(
                        (a: any) => a.attribute_definition_id === attr.attribute_definition_id,
                      );
                      attributeValue = foundAttr?.attribute_value || '';
                    }

                    // Format based on attribute type
                    if (attr.attribute_type === 'DATE' && attributeValue) {
                      try {
                        const date = new Date(attributeValue);
                        attributeValue = date.toLocaleDateString();
                      } catch (e) {
                        // Keep original value if date parsing fails
                      }
                    }

                    return attributeValue ? (
                      <Typography variant="body1" key={attr.attribute_definition_id}>
                        <strong>{attr.attribute_name}:</strong> {attributeValue}
                      </Typography>
                    ) : null;
                  })}
              </Box>

              <Typography variant="h6" gutterBottom>
                Step Progress
              </Typography>
              <TableContainer sx={{ maxHeight: '400px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '10%', whiteSpace: 'nowrap' }}>
                        Step
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '50%', whiteSpace: 'nowrap' }}>
                        Description
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%', whiteSpace: 'nowrap' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%', whiteSpace: 'nowrap' }}>
                        Completed Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '10%', whiteSpace: 'nowrap' }}>
                        Completed By
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {config.steps.map((step) => {
                      const stepStatus = selectedUnitForDetail.step_statuses?.find(
                        (ss) => ss.stepId.toString() === step.id,
                      );
                      const status = stepStatus?.status || 'Not Started';

                      // Handle both legacy and current field names for completed date
                      let completedDate = '—';
                      if (stepStatus && status === 'Complete') {
                        const dateValue =
                          stepStatus.completion_timestamp || stepStatus.completedDate;
                        if (dateValue) {
                          try {
                            completedDate = new Date(dateValue).toLocaleDateString();
                          } catch (e) {
                            completedDate = '—';
                          }
                        }
                      }

                      // Handle both legacy and current field names for completed by
                      const completedBy =
                        status === 'Complete'
                          ? stepStatus?.completed_by_user_name || stepStatus?.completedBy || '—'
                          : '—';

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
                          <TableCell
                            sx={{
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {step.order}
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {step.name}
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
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
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {completedDate}
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {completedBy}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleOpenTimelineModal}
              startIcon={<IconTimeline size="18" />}
              size="large"
              sx={{ fontSize: '1rem' }}
            >
              View Timeline
            </Button>
            <Button
              variant="outlined"
              onClick={handlePreviousUnit}
              disabled={
                !selectedUnitForDetail ||
                currentVisibleUnits.findIndex(
                  (u) => u.item_id === selectedUnitForDetail.item_id,
                ) === 0
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
                currentVisibleUnits.findIndex(
                  (u) => u.item_id === selectedUnitForDetail.item_id,
                ) ===
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

      {/* Unit Timeline Modal */}
      <UnitTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={handleCloseTimelineModal}
        unit={selectedUnitForDetail}
        steps={steps}
      />
    </Paper>
  );
};

export default BatchTrackingComponent;
