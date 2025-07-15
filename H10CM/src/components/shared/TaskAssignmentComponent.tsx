import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  Flag as PriorityIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  TaskItem,
  CreateTaskRequest,
  TaskPriority,
  TaskCategory,
  TaskStatus,
} from 'src/types/Task';
import { TeamMember } from 'src/types/User';

interface TaskAssignmentComponentProps {
  teamMembers: TeamMember[];
  projects: Array<{ project_id: string; project_name: string }>;
  onCreateTask: (task: CreateTaskRequest) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  currentTasks: TaskItem[];
}

const TaskAssignmentComponent: React.FC<TaskAssignmentComponentProps> = ({
  teamMembers,
  projects,
  onCreateTask,
  onUpdateTask,
  currentTasks,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" color="primary">
            <TaskIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Task Assignment & Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Assign New Task
          </Button>
        </Box>

        {/* Team Members Overview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Team Workload Overview
          </Typography>
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
        </Box>

        {/* Recent Tasks */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Recent Task Assignments
          </Typography>
          <List>
            {currentTasks.slice(0, 8).map((task) => {
              const assignedMember = teamMembers.find((m) => m.user_id === task.assigned_to);
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== 'Completed';

              return (
                <ListItem key={task.task_id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: priorityColors[task.priority] + '.main' }}>
                      <PriorityIcon />
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
                            {projects.find((p) => p.project_id === task.project_id)?.project_name ||
                              task.project_id}
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
        </Box>

        {/* Create Task Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Assign New Task</DialogTitle>
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
                    value={projects.find((p) => p.project_id === newTask.project_id) || null}
                    onChange={(_, value) =>
                      setNewTask((prev) => ({ ...prev, project_id: value?.project_id }))
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
              Assign Task
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TaskAssignmentComponent;
