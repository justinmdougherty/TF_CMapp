import { useQuery } from '@tanstack/react-query';
import {
  fetchInventoryStockStatusView,
  fetchTrackedItemsOverviewView,
  fetchStepProgressStatusView,
} from '../../services/api';

export const useInventoryStockStatusView = () => {
  return useQuery<any[], Error>({
    queryKey: ['inventoryStockStatusView'],
    queryFn: fetchInventoryStockStatusView,
  });
};

export const useTrackedItemsOverviewView = () => {
  return useQuery<any[], Error>({
    queryKey: ['trackedItemsOverviewView'],
    queryFn: fetchTrackedItemsOverviewView,
  });
};

export const useStepProgressStatusView = () => {
  return useQuery<any[], Error>({
    queryKey: ['stepProgressStatusView'],
    queryFn: fetchStepProgressStatusView,
  });
};
