import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  MoreVert as MoreVertIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import { useRBAC } from '../../context/RBACContext';
import { useTasks, useUpdateTask } from 'src/hooks/api/useTaskHooks';
import { TaskItem, TaskPriority, TaskStatus } from 'src/types/Task';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'My Tasks' }];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'Critical':
      return 'error';
    case 'High':
      return 'warning';
    case 'Medium':
      return 'info';
    case 'Low':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'primary';
    case 'On Hold':
      return 'warning';
    case 'Cancelled':
      return 'error';
    case 'Pending':
      return 'default';
    default:
      return 'default';
  }
};

const MyTasksPage = () => {
  const { currentUser } = useRBAC();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [taskUpdate, setTaskUpdate] = useState({
    status: '' as TaskStatus,
    notes: '',
    actual_hours: 0,
  });

  const { data: allTasks = [], isLoading } = useTasks();
  const updateTaskMutation = useUpdateTask();

  // Filter tasks assigned to current user
  const myTasks = allTasks.filter(
    (task) =>
      task.assigned_to === currentUser?.user_id || task.assigned_to === currentUser?.username,
  );

  // Filter tasks by status for tabs
  const pendingTasks = myTasks.filter((task) => task.status === 'Pending');
  const inProgressTasks = myTasks.filter((task) => task.status === 'In Progress');
  const completedTasks = myTasks.filter((task) => task.status === 'Completed');
  const onHoldTasks = myTasks.filter((task) => task.status === 'On Hold');

  // Get overdue tasks (past due date and not completed)
  const overdueTasks = myTasks.filter(
    (task) =>
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== 'Completed' &&
      task.status !== 'Cancelled',
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 0:
        return pendingTasks;
      case 1:
        return inProgressTasks;
      case 2:
        return completedTasks;
      case 3:
        return onHoldTasks;
      case 4:
        return overdueTasks;
      default:
        return myTasks;
    }
  };

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setTaskUpdate({
      status: task.status,
      notes: task.notes || '',
      actual_hours: task.actual_hours || 0,
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        taskId: selectedTask.task_id,
        updates: {
          status: taskUpdate.status,
          notes: taskUpdate.notes,
          actual_hours: taskUpdate.actual_hours,
          ...(taskUpdate.status === 'Completed' && { completed_date: new Date() }),
        },
      });
      setIsUpdateDialogOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleQuickStatusChange = async (task: TaskItem, newStatus: TaskStatus) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.task_id,
        updates: {
          status: newStatus,
          ...(newStatus === 'Completed' && { completed_date: new Date() }),
        },
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="My Tasks" description="Your assigned tasks and workload">
        <Breadcrumb title="My Tasks" items={BCrumb} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
          <LinearProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Tasks" description="Your assigned tasks and workload">
      <Breadcrumb title="My Tasks" items={BCrumb} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            My Tasks
          </Typography>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              Welcome, {currentUser.full_name} • {myTasks.length} total tasks assigned
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Task Statistics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {pendingTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main" gutterBottom>
                  {inProgressTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {completedTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main" gutterBottom>
                  {onHoldTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On Hold
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="error.main" gutterBottom>
                  {overdueTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overdue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            aria-label="task status tabs"
          >
            <Tab
              label={`Pending (${pendingTasks.length})`}
              icon={<ScheduleIcon />}
              iconPosition="start"
            />
            <Tab
              label={`In Progress (${inProgressTasks.length})`}
              icon={<StartIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Completed (${completedTasks.length})`}
              icon={<CompleteIcon />}
              iconPosition="start"
            />
            <Tab
              label={`On Hold (${onHoldTasks.length})`}
              icon={<PauseIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Overdue (${overdueTasks.length})`}
              icon={<WarningIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <List>
            {getFilteredTasks().map((task, index) => (
              <React.Fragment key={task.task_id}>
                <ListItem
                  button
                  onClick={() => handleTaskClick(task)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6">{task.title}</Typography>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority)}
                          size="small"
                        />
                        <Chip label={task.category} variant="outlined" size="small" />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.description}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {task.due_date && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <TimeIcon fontSize="small" />
                              <Typography variant="caption">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          )}
                          {task.estimated_hours && (
                            <Typography variant="caption">Est: {task.estimated_hours}h</Typography>
                          )}
                          <Typography variant="caption">
                            Created: {new Date(task.created_date).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {task.status === 'Pending' && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStatusChange(task, 'In Progress');
                          }}
                          color="primary"
                          title="Start Task"
                        >
                          <StartIcon />
                        </IconButton>
                      )}
                      {task.status === 'In Progress' && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStatusChange(task, 'Completed');
                          }}
                          color="success"
                          title="Complete Task"
                        >
                          <CompleteIcon />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        title="Edit Task"
                      >
                        <EditIcon />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < getFilteredTasks().length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {getFilteredTasks().length === 0 && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: '200px', textAlign: 'center' }}
              >
                <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks in this category
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 && 'No pending tasks. Great work!'}
                  {activeTab === 1 &&
                    'No tasks in progress. Start a pending task to begin working.'}
                  {activeTab === 2 &&
                    'No completed tasks yet. Complete some tasks to see them here.'}
                  {activeTab === 3 && 'No tasks on hold.'}
                  {activeTab === 4 && 'No overdue tasks. Excellent!'}
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Paper>

      {/* Task Update Dialog */}
      <Dialog
        open={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Task</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTask.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedTask.description}
              </Typography>

              <TextField
                fullWidth
                select
                label="Status"
                value={taskUpdate.status}
                onChange={(e) =>
                  setTaskUpdate((prev) => ({ ...prev, status: e.target.value as TaskStatus }))
                }
                sx={{ mb: 2 }}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>

              <TextField
                fullWidth
                type="number"
                label="Actual Hours Worked"
                value={taskUpdate.actual_hours}
                onChange={(e) =>
                  setTaskUpdate((prev) => ({
                    ...prev,
                    actual_hours: parseFloat(e.target.value) || 0,
                  }))
                }
                inputProps={{ min: 0, step: 0.5 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes / Progress Update"
                value={taskUpdate.notes}
                onChange={(e) => setTaskUpdate((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about your progress, challenges, or completion details..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateTask}
            variant="contained"
            disabled={updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default MyTasksPage;
