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
  const result = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('🔍 useProjects: fetchProjects called');
      const data = await fetchProjects();
      console.log('🔍 useProjects: fetchProjects returned:', data);
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
  });
  
  console.log('🔍 useProjects: hook result:', {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error
  });
  
  return result;
};

export const useGetProjects = useProjects;

export const useGetProjectById = (projectId: string | undefined) => {
  const result = useQuery<Project | null, Error>({
    queryKey: ['project', projectId],
    queryFn: () => {
      console.log('🔍 useGetProjectById: Fetching project with ID:', projectId);
      return fetchProjectById(projectId);
    },
    enabled: !!projectId, // Only run the query if projectId is available
  });
  
  console.log('🔍 useGetProjectById: Hook result:', {
    projectId,
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error ? {
      message: result.error.message,
      stack: result.error.stack,
      name: result.error.name,
    } : null,
    status: result.status,
    fetchStatus: result.fetchStatus,
  });
  
  return result;
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, Omit<Project, 'project_id' | 'date_created'>>({
    mutationFn: createProject,
    onSuccess: (data) => {
      console.log('🎉 useCreateProject: Project created successfully:', data);
      console.log('🔄 useCreateProject: Invalidating and refetching projects cache...');
      
      // Both invalidate and refetch to ensure the UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.refetchQueries({ queryKey: ['projects'] });
      
      console.log('🔄 useCreateProject: Cache invalidation and refetch triggered');
      
      // Show success notification
      projectNotifications.projectCreated(data.project_name);
    },
    onError: (error) => {
      console.error('❌ useCreateProject: Error creating project:', error);
      projectNotifications.apiError('create project', error.message);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, Project>({
    mutationFn: updateProject,
    onSuccess: (data) => {
      console.log('🎉 useUpdateProject: Project updated successfully:', data);
      
      // Handle different response formats - API might return array or object
      const projectData = Array.isArray(data) ? data[0] : data;
      if (!projectData || !projectData.project_id) {
        console.error('❌ useUpdateProject: Invalid project data returned from API:', data);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectData.project_id.toString()] });
      
      // Show success notification for status updates
      projectNotifications.statusUpdated(projectData.project_name, projectData.status);
    },
    onError: (error) => {
      console.error('❌ useUpdateProject: Error updating project:', error);
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
