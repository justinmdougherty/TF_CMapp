import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStepInventoryRequirements,
  createStepInventoryRequirement,
  updateStepInventoryRequirement,
  deleteStepInventoryRequirement,
} from '../../services/api';
import { StepInventoryRequirement } from '../../types/StepInventoryRequirement';

export const useStepInventoryRequirements = (stepId: string | undefined) => {
  return useQuery<StepInventoryRequirement[], Error>({
    queryKey: ['stepInventoryRequirements', stepId],
    queryFn: () => fetchStepInventoryRequirements(stepId as string),
    enabled: !!stepId,
  });
};

export const useCreateStepInventoryRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation<StepInventoryRequirement, Error, Omit<StepInventoryRequirement, 'requirement_id'>>({
    mutationFn: createStepInventoryRequirement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stepInventoryRequirements', data.step_id] });
    },
  });
};

export const useUpdateStepInventoryRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation<StepInventoryRequirement, Error, StepInventoryRequirement>({
    mutationFn: updateStepInventoryRequirement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stepInventoryRequirements', data.step_id] });
    },
  });
};

export const useDeleteStepInventoryRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteStepInventoryRequirement,
    onSuccess: () => {
      // Invalidate all step inventory requirements queries, as we don't know which step the requirement belonged to easily here.
      // A more refined approach would be to pass stepId to the mutation.
      queryClient.invalidateQueries({ queryKey: ['stepInventoryRequirements'] });
    },
  });
};
