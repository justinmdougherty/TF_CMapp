import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrackedItems,
  fetchTrackedItemDetails,
  createTrackedItem,
  saveTrackedItemAttributes,
  updateTrackedItemStepProgress,
  batchUpdateTrackedItemStepProgress,
} from '../../services/api';
import { TrackedItem, TrackedItemAttribute, TrackedItemStepProgress } from '../../types/TrackedItem';
import { ProductionUnit } from '../../types/Production';

export const useTrackedItems = (projectId: string | undefined) => {
  return useQuery<ProductionUnit[], Error>({
    queryKey: ['trackedItems', projectId],
    queryFn: () => fetchTrackedItems(projectId),
    enabled: !!projectId,
  });
};

export const useTrackedItemDetails = (itemId: string | undefined) => {
  return useQuery<TrackedItem, Error>({
    queryKey: ['trackedItemDetails', itemId],
    queryFn: () => fetchTrackedItemDetails(itemId as string),
    enabled: !!itemId,
  });
};

export const useCreateTrackedItem = () => {
  const queryClient = useQueryClient();
  return useMutation<TrackedItem, Error, Omit<TrackedItem, 'item_id' | 'date_created'>>({
    mutationFn: createTrackedItem,
    onSuccess: (data) => {
      // Invalidate the specific project's tracked items
      queryClient.invalidateQueries({ queryKey: ['trackedItems', data.project_id.toString()] });
      // Also invalidate any general tracked items queries
      queryClient.invalidateQueries({ queryKey: ['trackedItems'] });
    },
  });
};

export const useSaveTrackedItemAttributes = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { itemId: string; attributes: TrackedItemAttribute[] }>({
    mutationFn: ({ itemId, attributes }) => saveTrackedItemAttributes(itemId, attributes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trackedItemDetails', variables.itemId] });
      // Potentially invalidate trackedItems list if attributes affect list view
    },
  });
};

export const useUpdateTrackedItemStepProgress = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { itemId: string; stepId: string; projectId: string; progress: TrackedItemStepProgress }, { previousTrackedItems?: ProductionUnit[]; previousItemDetails?: any; projectId: string }>({
    mutationFn: async ({ itemId, stepId, progress }) => {
      // Add retry logic for deadlock handling
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          await updateTrackedItemStepProgress(itemId, stepId, progress);
          return; // Success, exit retry loop
        } catch (error: any) {
          // Check if it's a deadlock error (SQL Server error 1205)
          if (error?.number === 1205 && retryCount < maxRetries - 1) {
            retryCount++;
            // Exponential backoff: wait 100ms, 200ms, 400ms
            const delay = 100 * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retrying step progress update for item ${itemId}, attempt ${retryCount + 1}`);
            continue;
          }
          // If it's not a deadlock or we've exhausted retries, throw the error
          throw error;
        }
      }
    },
    onMutate: async ({ itemId, stepId, projectId, progress }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trackedItems', projectId] });
      await queryClient.cancelQueries({ queryKey: ['trackedItemDetails', itemId] });

      // Snapshot the previous value
      const previousTrackedItems = queryClient.getQueryData<ProductionUnit[]>(['trackedItems', projectId]);
      const previousItemDetails = queryClient.getQueryData(['trackedItemDetails', itemId]);

      // Optimistically update tracked items list
      if (previousTrackedItems) {
        queryClient.setQueryData<ProductionUnit[]>(['trackedItems', projectId], (old) => {
          if (!old) return old;
          return old.map(unit => {
            if (unit.item_id === itemId) {
              const updatedStepStatuses = unit.step_statuses ? [...unit.step_statuses] : [];
              const existingStatusIndex = updatedStepStatuses.findIndex(ss => ss.stepId.toString() === stepId);
              
              const newStepStatus = {
                stepId: parseInt(stepId),
                status: progress.status,
                completedDate: progress.status === 'Complete' ? new Date().toISOString() : undefined,
                completedBy: progress.completed_by_user_name,
                completed_by_user_name: progress.completed_by_user_name,
                completion_timestamp: progress.status === 'Complete' ? new Date().toISOString() : undefined,
              };

              if (existingStatusIndex >= 0) {
                updatedStepStatuses[existingStatusIndex] = newStepStatus;
              } else {
                updatedStepStatuses.push(newStepStatus);
              }

              return {
                ...unit,
                step_statuses: updatedStepStatuses,
              };
            }
            return unit;
          });
        });
      }

      // Return a context object with the snapshotted value
      return { previousTrackedItems, previousItemDetails, projectId };
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTrackedItems) {
        queryClient.setQueryData(['trackedItems', context.projectId], context.previousTrackedItems);
      }
      if (context?.previousItemDetails) {
        queryClient.setQueryData(['trackedItemDetails', variables.itemId], context.previousItemDetails);
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['trackedItemDetails', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['trackedItems', variables.projectId] });
    },
  });
};

export const useBatchUpdateTrackedItemStepProgress = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { 
    itemIds: string[]; 
    stepId: string; 
    projectId: string; 
    progress: Omit<TrackedItemStepProgress, 'item_id' | 'step_id'>;
  }, { previousTrackedItems?: ProductionUnit[]; projectId: string }>({
    mutationFn: async ({ itemIds, stepId, progress }) => {
      // Use the new batch API endpoint instead of sequential individual calls
      await batchUpdateTrackedItemStepProgress(itemIds, stepId, progress);
    },
    onMutate: async ({ itemIds, stepId, projectId, progress }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trackedItems', projectId] });
      
      // Snapshot the previous value
      const previousTrackedItems = queryClient.getQueryData<ProductionUnit[]>(['trackedItems', projectId]);

      // Optimistically update all selected items
      if (previousTrackedItems) {
        queryClient.setQueryData<ProductionUnit[]>(['trackedItems', projectId], (old) => {
          if (!old) return old;
          return old.map(unit => {
            if (itemIds.includes(unit.item_id.toString())) {
              const updatedStepStatuses = unit.step_statuses ? [...unit.step_statuses] : [];
              const existingStatusIndex = updatedStepStatuses.findIndex(ss => ss.stepId.toString() === stepId);
              
              const newStepStatus = {
                stepId: parseInt(stepId),
                status: progress.status,
                completedDate: progress.status === 'Complete' ? new Date().toISOString() : undefined,
                completedBy: progress.completed_by_user_name,
                completed_by_user_name: progress.completed_by_user_name,
                completion_timestamp: progress.status === 'Complete' ? new Date().toISOString() : undefined,
              };

              if (existingStatusIndex >= 0) {
                updatedStepStatuses[existingStatusIndex] = newStepStatus;
              } else {
                updatedStepStatuses.push(newStepStatus);
              }

              return {
                ...unit,
                step_statuses: updatedStepStatuses,
              };
            }
            return unit;
          });
        });
      }

      return { previousTrackedItems, projectId };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTrackedItems) {
        queryClient.setQueryData(['trackedItems', context.projectId], context.previousTrackedItems);
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['trackedItems', variables.projectId] });
      // Invalidate details for all updated items
      variables.itemIds.forEach(itemId => {
        queryClient.invalidateQueries({ queryKey: ['trackedItemDetails', itemId] });
      });
    },
  });
};
