import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectSteps,
  createProjectStep,
  updateProjectStep,
  deleteProjectStep,
} from '../../services/api';
import { ProjectStep } from '../../types/ProjectSteps';

export const useProjectSteps = (projectId: string | undefined) => {
  return useQuery<ProjectStep[], Error>({
    queryKey: ['projectSteps', projectId],
    queryFn: () => fetchProjectSteps(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProjectStep = () => {
  const queryClient = useQueryClient();
  return useMutation<ProjectStep, Error, Omit<ProjectStep, 'step_id'>>({
    mutationFn: createProjectStep,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectSteps', data.project_id.toString()] });
    },
  });
};

export const useUpdateProjectStep = () => {
  const queryClient = useQueryClient();
  return useMutation<ProjectStep, Error, ProjectStep>({
    mutationFn: updateProjectStep,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectSteps', data.project_id.toString()] });
    },
  });
};

export const useDeleteProjectStep = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteProjectStep,
    onSuccess: () => {
      // Invalidate all project steps queries, as we don't know which project the step belonged to easily here.
      // A more refined approach would be to pass projectId to the mutation.
      queryClient.invalidateQueries({ queryKey: ['projectSteps'] });
    },
  });
};
