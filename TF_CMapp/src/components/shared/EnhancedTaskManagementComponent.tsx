import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Grid,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  AutoAwesome as AutoIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Engineering as EngineeringIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import {
  TaskItem,
  CreateTaskRequest,
  TaskPriority,
  TaskCategory,
  TaskStatus,
} from 'src/types/Task';
import { TeamMember } from 'src/types/User';
import { Project } from 'src/types/Project';
import { fetchProjects, fetchProjectSteps, fetchTrackedItems } from 'src/services/api';

interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  project_id: string;
  project_name: string;
  step_name?: string;
  step_order?: number;
  unit_count?: number;
  estimated_hours?: number;
  due_date?: Date;
  urgency_score: number; // 0-100, higher = more urgent
  reason: string; // Why this task was generated
  assigned_to?: string; // Add this property
}

interface EnhancedTaskManagementComponentProps {
  teamMembers: TeamMember[];
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  currentTasks: TaskItem[];
}

const EnhancedTaskManagementComponent: React.FC<EnhancedTaskManagementComponentProps> = ({
  teamMembers,
  onCreateTask,
  onUpdateTask,
  currentTasks,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGeneratedTask, setSelectedGeneratedTask] = useState<GeneratedTask | null>(null);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General',
    assigned_to: '',
    project_id: undefined,
    due_date: undefined,
    estimated_hours: undefined,
    notes: '',
  });

  // Fetch active projects and their data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'Active' || p.status === 'Planning'),
    [projects],
  );

  // Fetch data for all active projects
  const projectsWithData = useQuery({
    queryKey: ['projects-with-data', activeProjects.map((p) => p.project_id)],
    queryFn: async () => {
      const projectsData = await Promise.all(
        activeProjects.map(async (project) => {
          try {
            const [steps, trackedItems] = await Promise.all([
              fetchProjectSteps(project.project_id.toString()),
              fetchTrackedItems(project.project_id.toString()),
            ]);
            return { project, steps, trackedItems };
          } catch (error) {
            console.error(`Error fetching data for project ${project.project_id}:`, error);
            return { project, steps: [], trackedItems: [] };
          }
        }),
      );
      return projectsData;
    },
    enabled: activeProjects.length > 0,
  });

  // Generate automatic tasks based on project status
  const generatedTasks = useMemo(() => {
    if (!projectsWithData.data) return [];

    const tasks: GeneratedTask[] = [];

    projectsWithData.data.forEach(({ project, steps, trackedItems }) => {
      // Task 1: Stalled Units (units stuck on same step for too long)
      const stalledUnits = trackedItems.filter((unit) => {
        if (unit.is_shipped || !unit.step_statuses) return false;

        const inProgressSteps = unit.step_statuses.filter((s) => s.status === 'In Progress');
        return inProgressSteps.some((step) => {
          const lastUpdate = step.completion_timestamp || step.completedDate;
          if (!lastUpdate) return false;
          const daysSinceUpdate =
            (new Date().getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate > 3; // Stalled for more than 3 days
        });
      });

      if (stalledUnits.length > 0) {
        tasks.push({
          id: `stalled-${project.project_id}`,
          title: `Review Stalled Production Units`,
          description: `${stalledUnits.length} units in project "${project.project_name}" have been stalled on production steps for more than 3 days. Investigation needed.`,
          priority: stalledUnits.length > 5 ? 'High' : 'Medium',
          category: 'Production',
          project_id: project.project_id.toString(),
          project_name: project.project_name,
          unit_count: stalledUnits.length,
          estimated_hours: Math.ceil(stalledUnits.length * 0.5), // 30 min per unit review
          urgency_score: Math.min(90, 50 + stalledUnits.length * 5),
          reason: `Production bottleneck detected - ${stalledUnits.length} units stalled`,
        });
      }

      // Task 2: Quality Control Backlog
      const qcPendingUnits = trackedItems.filter((unit) => {
        if (unit.is_shipped || !unit.step_statuses) return false;
        return unit.step_statuses.some((s) => s.status === 'In Progress'); // Changed from 'Pending QC' which doesn't exist
      });

      if (qcPendingUnits.length > 0) {
        tasks.push({
          id: `qc-pending-${project.project_id}`,
          title: `Quality Control Review Required`,
          description: `${qcPendingUnits.length} units in "${project.project_name}" are awaiting quality control approval.`,
          priority: qcPendingUnits.length > 3 ? 'High' : 'Medium',
          category: 'Quality',
          project_id: project.project_id.toString(),
          project_name: project.project_name,
          unit_count: qcPendingUnits.length,
          estimated_hours: qcPendingUnits.length * 0.25, // 15 min per QC review
          urgency_score: Math.min(85, 40 + qcPendingUnits.length * 8),
          reason: `Quality control backlog detected`,
        });
      }

      // Task 3: Step-specific production tasks
      steps.forEach((step) => {
        const unitsAtStep = trackedItems.filter((unit) => {
          if (unit.is_shipped || !unit.step_statuses) return false;
          const stepStatus = unit.step_statuses.find(
            (s) => s.stepId.toString() === step.step_id.toString(),
          );
          return stepStatus?.status === 'Not Started';
        });

        if (unitsAtStep.length >= 3) {
          // Threshold of 3+ units ready for a step
          tasks.push({
            id: `step-production-${project.project_id}-${step.step_id}`,
            title: `Production Task: ${step.step_name}`,
            description: `${unitsAtStep.length} units ready for "${step.step_name}" in project "${project.project_name}". Batch processing recommended.`,
            priority: unitsAtStep.length > 10 ? 'High' : 'Medium',
            category: 'Production',
            project_id: project.project_id.toString(),
            project_name: project.project_name,
            step_name: step.step_name,
            step_order: step.step_order,
            unit_count: unitsAtStep.length,
            estimated_hours: Math.ceil(unitsAtStep.length * 0.75), // 45 min per unit
            urgency_score: Math.min(75, 30 + unitsAtStep.length * 3),
            reason: `Batch production opportunity identified`,
          });
        }
      });

      // Task 4: Project deadline management
      if (project.estimated_completion_date) {
        const daysUntilDeadline =
          (new Date(project.estimated_completion_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24);
        const totalUnits = trackedItems.length;
        const completedUnits = trackedItems.filter(
          (unit) => unit.is_shipped || unit.date_fully_completed,
        ).length;
        const completionPercent = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

        if (daysUntilDeadline <= 7 && completionPercent < 80) {
          tasks.push({
            id: `deadline-risk-${project.project_id}`,
            title: `Project Deadline Risk Assessment`,
            description: `Project "${project.project_name}" is ${Math.round(
              completionPercent,
            )}% complete with ${Math.ceil(
              daysUntilDeadline,
            )} days until deadline. Risk mitigation needed.`,
            priority: daysUntilDeadline <= 3 ? 'Critical' : 'High',
            category: 'Planning',
            project_id: project.project_id.toString(),
            project_name: project.project_name,
            estimated_hours: 2,
            due_date: new Date(project.estimated_completion_date),
            urgency_score: Math.min(95, 80 + (80 - completionPercent) / 4),
            reason: `Project deadline approaching with low completion rate`,
          });
        }
      }

      // Task 5: Inventory requirements check
      if (steps.length > 0) {
        const upcomingSteps = steps.filter((step) => {
          const unitsApproachingStep = trackedItems.filter((unit) => {
            if (unit.is_shipped || !unit.step_statuses) return false;
            const completedSteps = unit.step_statuses.filter((s) => s.status === 'Complete').length;
            return step.step_order - completedSteps <= 2; // Within 2 steps
          });
          return unitsApproachingStep.length >= 2;
        });

        if (upcomingSteps.length > 0) {
          tasks.push({
            id: `inventory-check-${project.project_id}`,
            title: `Inventory Requirements Check`,
            description: `Verify inventory availability for upcoming production steps in "${project.project_name}".`,
            priority: 'Medium',
            category: 'Inventory',
            project_id: project.project_id.toString(),
            project_name: project.project_name,
            estimated_hours: 1,
            urgency_score: 35,
            reason: `Proactive inventory management for upcoming steps`,
          });
        }
      }
    });

    // Sort by urgency score (highest first)
    return tasks.sort((a, b) => b.urgency_score - a.urgency_score);
  }, [projectsWithData.data]);

  // Filter out tasks that are already assigned
  const availableGeneratedTasks = useMemo(() => {
    const existingTaskTitles = currentTasks.map((t) => t.title.toLowerCase());
    return generatedTasks.filter(
      (task) =>
        !existingTaskTitles.some((existing) =>
          existing.includes(task.title.toLowerCase().substring(0, 20)),
        ),
    );
  }, [generatedTasks, currentTasks]);

  const priorityColors = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
    Critical: 'error',
  } as const;

  const statusColors = {
    Pending: 'default',
    'In Progress': 'primary',
    Completed: 'success',
    'On Hold': 'warning',
    Cancelled: 'error',
  } as const;

  const categoryIcons = {
    Production: <EngineeringIcon />,
    Quality: <WarningIcon />,
    Planning: <ScheduleIcon />,
    Inventory: <BuildIcon />,
    Maintenance: <BuildIcon />,
    General: <TaskIcon />,
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assigned_to) {
      return;
    }

    try {
      await onCreateTask(newTask);
      setIsCreateDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'General',
        assigned_to: '',
        project_id: undefined,
        due_date: undefined,
        estimated_hours: undefined,
        notes: '',
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleAssignGeneratedTask = async (generatedTask: GeneratedTask) => {
    if (!selectedGeneratedTask) return;

    const taskRequest: CreateTaskRequest = {
      title: generatedTask.title,
      description: generatedTask.description,
      priority: generatedTask.priority,
      category: generatedTask.category,
      assigned_to: selectedGeneratedTask.assigned_to || '',
      project_id: generatedTask.project_id,
      due_date: generatedTask.due_date,
      estimated_hours: generatedTask.estimated_hours,
      notes: `Auto-generated task: ${generatedTask.reason}`,
    };

    try {
      await onCreateTask(taskRequest);
      setSelectedGeneratedTask(null);
    } catch (error) {
      console.error('Error assigning generated task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await onUpdateTask(taskId, {
        status: newStatus,
        completed_date: newStatus === 'Completed' ? new Date() : undefined,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getAssignedTasksCount = (userId: string) => {
    return currentTasks.filter(
      (task) =>
        task.assigned_to === userId && task.status !== 'Completed' && task.status !== 'Cancelled',
    ).length;
  };

  const getOverdueTasksCount = (userId: string) => {
    const now = new Date();
    return currentTasks.filter(
      (task) =>
        task.assigned_to === userId &&
        task.due_date &&
        new Date(task.due_date) < now &&
        task.status !== 'Completed' &&
        task.status !== 'Cancelled',
    ).length;
  };

  const TabPanel = ({
    children,
    value,
    index,
  }: {
    children: React.ReactNode;
    value: number;
    index: number;
  }) => (
    <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" color="primary">
            <TaskIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Enhanced Task Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Manual Task
          </Button>
        </Box>

        {/* Task Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoIcon />
                  <span>Auto-Generated Tasks</span>
                  {availableGeneratedTasks.length > 0 && (
                    <Chip size="small" label={availableGeneratedTasks.length} color="primary" />
                  )}
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <TaskIcon />
                  <span>Current Tasks</span>
                  <Chip
                    size="small"
                    label={currentTasks.filter((t) => t.status !== 'Completed').length}
                    color="info"
                  />
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingIcon />
                  <span>Team Overview</span>
                </Stack>
              }
            />
          </Tabs>
        </Box>

        {/* Auto-Generated Tasks Tab */}
        <TabPanel value={activeTab} index={0}>
          {availableGeneratedTasks.length === 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Great! No urgent production tasks detected. All active projects appear to be running
                smoothly.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>{availableGeneratedTasks.length} auto-generated tasks</strong> detected
                based on active project analysis. Review and assign these tasks to optimize
                production workflow.
              </Typography>
            </Alert>
          )}

          <List>
            {availableGeneratedTasks.map((task) => (
              <Paper key={task.id} elevation={1} sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: priorityColors[task.priority] + '.main' }}>
                      {categoryIcons[task.category]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {task.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={task.priority}
                          color={priorityColors[task.priority]}
                        />
                        <Chip size="small" label={task.category} variant="outlined" />
                        <Chip
                          size="small"
                          label={`Score: ${task.urgency_score}`}
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1}>
                        <Typography variant="body2">{task.description}</Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Typography variant="caption" color="primary">
                            Project: {task.project_name}
                          </Typography>
                          {task.unit_count && (
                            <Typography variant="caption">Units: {task.unit_count}</Typography>
                          )}
                          {task.estimated_hours && (
                            <Typography variant="caption">Est. {task.estimated_hours}h</Typography>
                          )}
                          {task.step_name && (
                            <Typography variant="caption">Step: {task.step_name}</Typography>
                          )}
                        </Stack>
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.urgency_score}
                            color={
                              task.urgency_score > 70
                                ? 'error'
                                : task.urgency_score > 40
                                ? 'warning'
                                : 'success'
                            }
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Urgency: {task.urgency_score}/100 - {task.reason}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedGeneratedTask({ ...task, assigned_to: '' });
                      }}
                    >
                      Assign
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        </TabPanel>

        {/* Current Tasks Tab */}
        <TabPanel value={activeTab} index={1}>
          <List>
            {currentTasks.slice(0, 12).map((task) => {
              const assignedMember = teamMembers.find((m) => m.user_id === task.assigned_to);
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== 'Completed';

              return (
                <ListItem key={task.task_id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: priorityColors[task.priority] + '.main' }}>
                      {categoryIcons[task.category]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2">{task.title}</Typography>
                        <Chip
                          size="small"
                          label={task.priority}
                          color={priorityColors[task.priority]}
                        />
                        <Chip
                          size="small"
                          label={task.status}
                          color={statusColors[task.status]}
                          variant="outlined"
                        />
                        {isOverdue && <Chip size="small" label="OVERDUE" color="error" />}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Assigned to: {assignedMember?.full_name || task.assigned_to}
                        </Typography>
                        {task.due_date && (
                          <Typography
                            variant="caption"
                            color={isOverdue ? 'error' : 'text.secondary'}
                          >
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                        )}
                        {task.project_id && (
                          <Typography variant="caption">
                            Project:{' '}
                            {projects.find((p) => p.project_id.toString() === task.project_id)
                              ?.project_name || task.project_id}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {task.status !== 'Completed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(task.task_id, 'Completed')}
                          color="success"
                        >
                          <CompleteIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => {
                          /* Edit task functionality */
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </TabPanel>

        {/* Team Overview Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {teamMembers.map((member) => {
              const activeTasks = getAssignedTasksCount(member.user_id);
              const overdueTasks = getOverdueTasksCount(member.user_id);

              return (
                <Grid item xs={12} sm={6} md={4} key={member.user_id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Badge
                        badgeContent={overdueTasks}
                        color="error"
                        invisible={overdueTasks === 0}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {member.full_name.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">{member.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.role}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={`${activeTasks} active`}
                            color={
                              activeTasks > 5 ? 'error' : activeTasks > 3 ? 'warning' : 'success'
                            }
                          />
                          <Chip
                            size="small"
                            label={member.availability_status}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        {/* Generated Task Assignment Dialog */}
        <Dialog
          open={selectedGeneratedTask !== null}
          onClose={() => setSelectedGeneratedTask(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Assign Auto-Generated Task</DialogTitle>
          <DialogContent>
            {selectedGeneratedTask && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Auto-Generated Task:</strong> {selectedGeneratedTask.reason}
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Task Title"
                    value={selectedGeneratedTask.title}
                    disabled
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={selectedGeneratedTask.description}
                    disabled
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Assign To</InputLabel>
                        <Select
                          value={selectedGeneratedTask.assigned_to || ''}
                          onChange={(e) =>
                            setSelectedGeneratedTask((prev) =>
                              prev ? { ...prev, assigned_to: e.target.value } : null,
                            )
                          }
                          required
                        >
                          {teamMembers.map((member) => (
                            <MenuItem key={member.user_id} value={member.user_id}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {member.full_name.charAt(0)}
                                </Avatar>
                                <Typography>
                                  {member.full_name} ({getAssignedTasksCount(member.user_id)}{' '}
                                  active)
                                </Typography>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Estimated Hours"
                        type="number"
                        value={selectedGeneratedTask.estimated_hours || ''}
                        disabled
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={selectedGeneratedTask.priority}
                      color={priorityColors[selectedGeneratedTask.priority]}
                    />
                    <Chip label={selectedGeneratedTask.category} variant="outlined" />
                    <Chip
                      label={`Urgency: ${selectedGeneratedTask.urgency_score}/100`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </LocalizationProvider>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedGeneratedTask(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                selectedGeneratedTask && handleAssignGeneratedTask(selectedGeneratedTask)
              }
              disabled={!selectedGeneratedTask?.assigned_to}
            >
              Assign Task
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manual Task Creation Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Manual Task</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Task Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Assign To</InputLabel>
                    <Select
                      value={newTask.assigned_to}
                      onChange={(e) =>
                        setNewTask((prev) => ({ ...prev, assigned_to: e.target.value }))
                      }
                      required
                    >
                      {teamMembers.map((member) => (
                        <MenuItem key={member.user_id} value={member.user_id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {member.full_name.charAt(0)}
                            </Avatar>
                            <Typography>
                              {member.full_name} ({getAssignedTasksCount(member.user_id)} active)
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          priority: e.target.value as TaskPriority,
                        }))
                      }
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newTask.category}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          category: e.target.value as TaskCategory,
                        }))
                      }
                    >
                      <MenuItem value="Production">Production</MenuItem>
                      <MenuItem value="Inventory">Inventory</MenuItem>
                      <MenuItem value="Quality">Quality</MenuItem>
                      <MenuItem value="Planning">Planning</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="General">General</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={projects}
                    getOptionLabel={(option) => option.project_name}
                    value={
                      projects.find((p) => p.project_id.toString() === newTask.project_id) || null
                    }
                    onChange={(_, value) =>
                      setNewTask((prev) => ({ ...prev, project_id: value?.project_id.toString() }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Related Project (Optional)" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <MuiDatePicker
                    label="Due Date (Optional)"
                    value={newTask.due_date || null}
                    onChange={(date) =>
                      setNewTask((prev) => ({
                        ...prev,
                        due_date:
                          date instanceof Date
                            ? date
                            : date
                            ? new Date(date.toString())
                            : undefined,
                      }))
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Hours"
                    type="number"
                    value={newTask.estimated_hours || ''}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        estimated_hours: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Notes"
                    multiline
                    rows={2}
                    value={newTask.notes}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateTask}
              disabled={!newTask.title || !newTask.assigned_to}
            >
              Create Task
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EnhancedTaskManagementComponent;
