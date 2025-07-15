import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectAttributes,
  createAttributeDefinition,
  updateAttributeDefinition,
  deleteAttributeDefinition,
} from '../../services/api';
import { AttributeDefinition } from '../../types/AttributeDefinition';

export const useProjectAttributes = (projectId: string | undefined) => {
  return useQuery<AttributeDefinition[], Error>({
    queryKey: ['projectAttributes', projectId],
    queryFn: () => fetchProjectAttributes(projectId as string),
    enabled: !!projectId,
  });
};

export const useCreateAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation<AttributeDefinition, Error, Omit<AttributeDefinition, 'attribute_definition_id'>>({
    mutationFn: createAttributeDefinition,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectAttributes', data.project_id] });
    },
  });
};

export const useUpdateAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation<AttributeDefinition, Error, AttributeDefinition>({
    mutationFn: updateAttributeDefinition,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectAttributes', data.project_id] });
    },
  });
};

export const useDeleteAttributeDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteAttributeDefinition,
    onSuccess: () => {
      // Invalidate all project attributes queries, as we don't know which project the attribute belonged to easily here.
      // A more refined approach would be to pass projectId to the mutation.
      queryClient.invalidateQueries({ queryKey: ['projectAttributes'] });
    },
  });
};
