import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  fetchProjectSteps,
  fetchTrackedItems,
} from '../../services/api';
import { Project } from '../../types/Project';
import { ProjectStep } from '../../types/ProjectSteps';
import { ProductionUnit } from '../../types/Production';
import { notifications, projectNotifications } from '../../services/notificationService';

export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
  });
};

export const useGetProjects = useProjects;

export const useGetProjectById = (projectId: string | undefined) => {
  return useQuery<Project | null, Error>({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId, // Only run the query if projectId is available
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, Omit<Project, 'project_id' | 'date_created'>>({
    mutationFn: createProject,
    onSuccess: (data) => {
      // Invalidate and refetch to ensure the UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show success notification
      projectNotifications.projectCreated(data.project_name);
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      projectNotifications.apiError('create project', error.message);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, Project>({
    mutationFn: updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id.toString()] });
      
      // Show success notification for status updates
      projectNotifications.statusUpdated(data.project_name, data.status);
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      projectNotifications.apiError('update project', error.message);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Both invalidate and refetch to ensure the UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.refetchQueries({ queryKey: ['projects'] });
      
      // Show info notification for deletion
      notifications.info('Project deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      projectNotifications.apiError('delete project', error.message);
    },
  });
};

export const useGetProjectSteps = (projectId: string | undefined) => {
  return useQuery<ProjectStep[], Error>({
    queryKey: ['projectSteps', projectId],
    queryFn: () => fetchProjectSteps(projectId),
    enabled: !!projectId,
  });
};

export const useGetTrackedItems = (projectId: string | undefined) => {
  console.log('🔍 useGetTrackedItems: Hook called with projectId:', projectId);
  
  return useQuery<ProductionUnit[], Error>({
    queryKey: ['trackedItems', projectId],
    queryFn: () => {
      console.log('🔍 useGetTrackedItems: Executing query function for projectId:', projectId);
      return fetchTrackedItems(projectId);
    },
    enabled: !!projectId,
  });
};
