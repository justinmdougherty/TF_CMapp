import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { checkInventoryStock } from 'src/services/api';

// Stock checking result type
export interface StockCheckResult {
  success: boolean;
  inventory_item_id: number;
  item_name: string;
  part_number: string;
  current_stock_level: number;
  pending_orders_quantity: number;
  available_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  reorder_point: number | null;
  max_stock_level: number | null;
  can_order: boolean;
  stock_message: string;
}

// Hook to check stock for a specific inventory item
export const useInventoryStock = (
  inventoryItemId: number | null | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<StockCheckResult, Error> => {
  return useQuery<StockCheckResult, Error>({
    queryKey: ['inventoryStock', inventoryItemId],
    queryFn: () => {
      if (!inventoryItemId) {
        throw new Error('Inventory item ID is required');
      }
      return checkInventoryStock(inventoryItemId);
    },
    enabled: !!inventoryItemId && (options?.enabled !== false),
    refetchInterval: options?.refetchInterval || 30000, // Refetch every 30 seconds by default
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

// Hook to check stock for multiple items
export const useMultipleInventoryStock = (
  inventoryItemIds: (number | null | undefined)[],
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const validIds = inventoryItemIds.filter((id): id is number => !!id);
  
  const queries = validIds.map(id => 
    useInventoryStock(id, {
      enabled: options?.enabled,
      refetchInterval: options?.refetchInterval,
    })
  );

  return {
    queries,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    data: queries.map(q => q.data).filter(Boolean) as StockCheckResult[],
    errors: queries.map(q => q.error).filter(Boolean),
  };
};

// Utility function to determine if a quantity can be ordered
export const canOrderQuantity = (stockResult: StockCheckResult, requestedQuantity: number): {
  canOrder: boolean;
  maxAvailable: number;
  message: string;
} => {
  if (!stockResult.success) {
    return {
      canOrder: false,
      maxAvailable: 0,
      message: 'Unable to check stock availability',
    };
  }

  const availableQuantity = stockResult.available_quantity;
  
  if (requestedQuantity <= availableQuantity) {
    return {
      canOrder: true,
      maxAvailable: availableQuantity,
      message: `${requestedQuantity} available`,
    };
  }

  if (availableQuantity <= 0) {
    return {
      canOrder: false,
      maxAvailable: 0,
      message: `Out of stock (${stockResult.current_stock_level} in stock, ${stockResult.pending_orders_quantity} pending orders)`,
    };
  }

  return {
    canOrder: false,
    maxAvailable: availableQuantity,
    message: `Only ${availableQuantity} available (${stockResult.current_stock_level} in stock, ${stockResult.pending_orders_quantity} pending orders)`,
  };
};
