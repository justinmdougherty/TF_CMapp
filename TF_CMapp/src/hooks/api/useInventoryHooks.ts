import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllInventory,
  getInventoryByProject,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,
} from '../../services/api';
import { InventoryItem, InventoryAdjustment } from '../../types/Inventory';

export const useGetInventoryByProject = (projectId: number) => {
  return useQuery<InventoryItem[], Error>({
    queryKey: ['inventory', projectId],
    queryFn: () => getInventoryByProject(projectId),
  });
};

// The API returns { data: InventoryItem[] }
type InventoryListResponse = { data: InventoryItem[] };
export const useGetAllInventory = () => {
  return useQuery<InventoryListResponse, Error>({
    queryKey: ['inventory'],
    queryFn: getAllInventory,
  });
};

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<InventoryItem, Error, Omit<InventoryItem, 'inventory_item_id'>>({
    mutationFn: addInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<InventoryItem, Error, InventoryItem>({
    mutationFn: updateInventoryItem,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['inventory', variables.project_id] });
      }
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useAdjustInventoryStock = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, InventoryAdjustment>({
    mutationFn: adjustInventoryStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
