import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Stack,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { UserProfile, UserTodoItem, UserActivity } from 'src/types/User';
import { TaskItem, TaskStatus } from 'src/types/Task';

interface EnhancedUserProfileProps {
  userProfile: UserProfile;
  userTasks: TaskItem[];
  userTodos: UserTodoItem[];
  userActivities: UserActivity[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onCreateTodo: (todo: {
    title: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High';
    user_id: string;
  }) => Promise<void>;
  onUpdateTodo: (todoId: string, updates: Partial<UserTodoItem>) => Promise<void>;
  onDeleteTodo: (todoId: string) => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({
  userProfile,
  userTasks,
  userTodos,
  userActivities,
  onUpdateProfile,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreateTodo = async () => {
    if (!newTodo.title) return;

    try {
      await onCreateTodo({
        ...newTodo,
        user_id: userProfile.user_id,
      });
      setIsTodoDialogOpen(false);
      setNewTodo({
        title: '',
        description: '',
        priority: 'Medium',
      });
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleToggleTodo = async (todo: UserTodoItem) => {
    try {
      await onUpdateTodo(todo.todo_id, {
        is_completed: !todo.is_completed,
        completed_date: !todo.is_completed ? new Date() : undefined,
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const getCompletionRate = () => {
    if (userTodos.length === 0) return 0;
    return (userTodos.filter((todo) => todo.is_completed).length / userTodos.length) * 100;
  };

  const getOverdueTodos = () => {
    const now = new Date();
    return userTodos.filter(
      (todo) => !todo.is_completed && todo.due_date && new Date(todo.due_date) < now,
    );
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return userTasks.filter((task) => task.status === status).length;
  };

  const priorityColors = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
  } as const;

  return (
    <Card>
      <CardContent>
        {/* Profile Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Badge
              badgeContent={getOverdueTodos().length}
              color="error"
              invisible={getOverdueTodos().length === 0}
            >
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {userProfile.full_name.charAt(0)}
              </Avatar>
            </Badge>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5">{userProfile.full_name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {userProfile.role}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.email}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  icon={<PersonIcon />}
                  label={userProfile.department || 'No Department'}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {Math.round(getCompletionRate())}%
              </Typography>
              <Typography variant="caption">Completion Rate</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {getTasksByStatus('In Progress')}
              </Typography>
              <Typography variant="caption">Active Tasks</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {getTasksByStatus('Completed')}
              </Typography>
              <Typography variant="caption">Completed</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {userTodos.filter((t) => !t.is_completed).length}
              </Typography>
              <Typography variant="caption">Todo Items</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {getOverdueTodos().length}
              </Typography>
              <Typography variant="caption">Overdue</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Completion Progress */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Overall Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={getCompletionRate()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Todo List" icon={<TaskIcon />} />
            <Tab label="Assigned Tasks" icon={<TaskIcon />} />
            <Tab label="Activity" icon={<TrendIcon />} />
            <Tab label="Settings" icon={<SettingsIcon />} />
          </Tabs>
        </Box>

        {/* Todo List Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Personal Todo List</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsTodoDialogOpen(true)}
            >
              Add Todo
            </Button>
          </Box>

          <List>
            {userTodos.map((todo) => {
              const isOverdue =
                todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;

              return (
                <ListItem key={todo.todo_id} divider>
                  <ListItemIcon>
                    <IconButton
                      onClick={() => handleToggleTodo(todo)}
                      color={todo.is_completed ? 'success' : 'default'}
                    >
                      {todo.is_completed ? <CompleteIcon /> : <IncompleteIcon />}
                    </IconButton>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            textDecoration: todo.is_completed ? 'line-through' : 'none',
                            color: todo.is_completed ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {todo.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={todo.priority}
                          color={priorityColors[todo.priority]}
                        />
                        {isOverdue && <Chip size="small" label="OVERDUE" color="error" />}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        {todo.description && (
                          <Typography variant="body2" color="text.secondary">
                            {todo.description}
                          </Typography>
                        )}
                        {todo.due_date && (
                          <Typography
                            variant="caption"
                            color={isOverdue ? 'error' : 'text.secondary'}
                          >
                            Due: {new Date(todo.due_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteTodo(todo.todo_id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </TabPanel>

        {/* Assigned Tasks Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Assigned Tasks
          </Typography>
          <List>
            {userTasks.map((task) => (
              <ListItem key={task.task_id} divider>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <TaskIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Chip size="small" label={task.status} variant="outlined" />
                      <Chip
                        size="small"
                        label={task.priority}
                        color={
                          task.priority === 'Critical' || task.priority === 'High'
                            ? 'error'
                            : task.priority === 'Medium'
                            ? 'warning'
                            : 'success'
                        }
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{task.description}</Typography>
                      {task.due_date && (
                        <Typography variant="caption">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          <List>
            {userActivities.slice(0, 10).map((activity) => (
              <ListItem key={activity.activity_id} divider>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <NotificationIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={activity.activity_type} secondary={activity.description} />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Profile Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={userProfile.full_name}
                onChange={(e) => onUpdateProfile({ full_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={userProfile.email}
                onChange={(e) => onUpdateProfile({ email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={userProfile.department || ''}
                onChange={(e) => onUpdateProfile({ department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={userProfile.phone || ''}
                onChange={(e) => onUpdateProfile({ phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Add Todo Dialog */}
        <Dialog
          open={isTodoDialogOpen}
          onClose={() => setIsTodoDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Todo Item</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Todo Title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={newTodo.description}
                  onChange={(e) => setNewTodo((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTodo.priority}
                    onChange={(e) =>
                      setNewTodo((prev) => ({
                        ...prev,
                        priority: e.target.value as 'Low' | 'Medium' | 'High',
                      }))
                    }
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsTodoDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateTodo} disabled={!newTodo.title}>
              Add Todo
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EnhancedUserProfile;
