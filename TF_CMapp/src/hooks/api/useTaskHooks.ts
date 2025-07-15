import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TaskItem,
  CreateTaskRequest,
  TaskStatistics,
  UserTaskSummary,
} from 'src/types/Task';
import {
  fetchTasks,
  fetchTasksByProject,
  fetchTasksByUser,
  createTask,
  updateTask,
  deleteTask,
  getTaskStatistics,
  getUserTaskSummary,
} from 'src/services/api';
import { notifications } from 'src/services/notificationService';
import smartNotifications from 'src/services/smartNotificationService';

// Query hooks
export const useTasks = () => {
  return useQuery<TaskItem[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });
};

export const useTasksByProject = (projectId: string) => {
  return useQuery<TaskItem[]>({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => fetchTasksByProject(projectId),
    enabled: !!projectId,
  });
};

export const useTasksByUser = (userId: string) => {
  return useQuery<TaskItem[]>({
    queryKey: ['tasks', 'user', userId],
    queryFn: () => fetchTasksByUser(userId),
    enabled: !!userId,
  });
};

export const useTaskStatistics = () => {
  return useQuery<TaskStatistics>({
    queryKey: ['task-statistics'],
    queryFn: getTaskStatistics,
  });
};

export const useUserTaskSummary = (userId: string) => {
  return useQuery<UserTaskSummary>({
    queryKey: ['user-task-summary', userId],
    queryFn: () => getUserTaskSummary(userId),
    enabled: !!userId,
  });
};

// Mutation hooks
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: CreateTaskRequest) => createTask(task),
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // If task is assigned to a project, invalidate project tasks
      if (newTask.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', newTask.project_id] });
      }
      
      // Invalidate user tasks
      queryClient.invalidateQueries({ queryKey: ['tasks', 'user', newTask.assigned_to] });
      
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user-task-summary'] });

      // Show success notification for task assignment
      notifications.success(
        `Task "${newTask.title}" has been assigned successfully!`,
        { duration: 4000 }
      );

      // Send assignment notification if task is assigned to someone
      if (newTask.assigned_to) {
        smartNotifications.createTaskAssignmentNotification(
          newTask.title,
          newTask.assigned_to,
          'current_user', // In production, this would be the actual user who created the task
          newTask.priority || 'Medium',
          newTask.due_date ? new Date(newTask.due_date) : undefined,
          newTask.project_id
        );
      }

      // TODO: In a production environment, this would also:
      // 1. Send an in-app notification to the assigned user
      // 2. Send an email notification if user has email notifications enabled
      // 3. Create a notification record in the database for the assigned user
      // 4. Potentially send a push notification if mobile app is available
      console.log(`📋 Task Assignment Notification: "${newTask.title}" assigned to user ${newTask.assigned_to}`);
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      notifications.error('Failed to create task. Please try again.');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<TaskItem> }) =>
      updateTask(taskId, updates),
    onSuccess: (updatedTask, variables) => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // If task is assigned to a project, invalidate project tasks
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', updatedTask.project_id] });
      }
      
      // Invalidate user tasks
      queryClient.invalidateQueries({ queryKey: ['tasks', 'user', updatedTask.assigned_to] });
      
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user-task-summary'] });

      // Show appropriate notification based on status change
      if (updatedTask.status === 'Completed') {
        notifications.success(
          `Task "${updatedTask.title}" has been completed! 🎉`,
          { duration: 5000 }
        );
      } else {
        notifications.success(
          `Task "${updatedTask.title}" has been updated successfully!`,
          { duration: 3000 }
        );
      }

      // Send update notification to assigned user if status changed
      if (variables.updates.status && updatedTask.assigned_to) {
        smartNotifications.createTaskUpdateNotification(
          updatedTask.title,
          updatedTask.assigned_to,
          updatedTask.status,
          'current_user' // In production, this would be the actual user who updated the task
        );
      }
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      notifications.error('Failed to update task. Please try again.');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user-task-summary'] });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
    },
  });
};

// Bulk operations
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ taskId: string; updates: Partial<TaskItem> }>) => {
      // Execute all updates in parallel
      const promises = updates.map(({ taskId, updates: taskUpdates }) =>
        updateTask(taskId, taskUpdates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['user-task-summary'] });
    },
    onError: (error) => {
      console.error('Error bulk updating tasks:', error);
    },
  });
};

// Helper function to generate smart task assignments
export const useSmartTaskAssignment = () => {
  return useMutation({
    mutationFn: async (_projectId: string) => {
      // This would analyze project status and generate optimal task assignments
      // For now, just return a mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        suggested_tasks: [],
        optimization_score: 85,
        recommendations: [
          'Consider batching quality control tasks',
          'Reassign overdue tasks to available team members',
          'Schedule inventory checks before production steps',
        ],
      };
    },
  });
};

export default {
  useTasks,
  useTasksByProject,
  useTasksByUser,
  useTaskStatistics,
  useUserTaskSummary,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useSmartTaskAssignment,
};
