// src/hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { fetchProjectsAPI, fetchProjectByIdAPI } from '../types/projectService'; // Adjust path
import { Project } from 'src/types/Project'; 

export const projectQueryKeys = {
  all: ['projects'] as const, // Base key for all projects
  lists: () => [...projectQueryKeys.all, 'list'] as const, // Key for the list of projects
  list: (filters?: string) => [...projectQueryKeys.lists(), { filters }] as const, // Key for a filtered list
  details: () => [...projectQueryKeys.all, 'detail'] as const, // Base key for project details
  detail: (id: string | undefined) => [...projectQueryKeys.details(), id] as const, // Key for a specific project detail
};


export const useGetProjects = () => {
  return useQuery<Project[], Error>({ // Explicitly type the data and error
    queryKey: projectQueryKeys.lists(), // Unique key for this query
    queryFn: fetchProjectsAPI,         // The function that fetches data
    // TanStack Query default options are usually good to start with.
    // You can customize options here, e.g.:
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 60 * 1000, // Refetch every 1 minute (for near real-time)
  });
};

export const useGetProjectById = (projectId: string | undefined) => {
    return useQuery<Project | undefined, Error>({
        queryKey: projectQueryKeys.detail(projectId),
        queryFn: () => {
            if (!projectId) { // Handle undefined projectId
                return Promise.resolve(undefined); // Or throw, or return a specific non-error value
            }
            return fetchProjectByIdAPI(projectId);
        },
        enabled: !!projectId, // Only run the query if projectId is truthy
    });
};

// Later, you would add custom hooks for mutations here, e.g., useAddProject, useUpdateProject