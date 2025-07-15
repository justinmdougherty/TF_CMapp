export interface CartItem {
  id: string; // Unique ID for cart management
  type: 'new' | 'reorder' | 'adjustment';
  item_name: string;
  part_number?: string;
  description?: string;
  unit_of_measure: string;
  quantity: number;
  estimated_cost?: number;
  inventory_item_id?: number; // For reorder items and adjustments
  supplier?: string;
  notes?: string;
  current_stock_level?: number; // For reorder items to show current stock
  reorder_point?: number; // For reorder items
  dateAdded: Date;
  
  // For bulk adjustments
  adjustment_type?: 'add' | 'remove'; // Type of stock adjustment
  adjustment_reason?: string; // Reason for the adjustment
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  estimatedTotalCost: number;
  newItemsCount: number;
  reorderItemsCount: number;
  adjustmentItemsCount: number;
}

export interface BulkSubmissionResult {
  success: boolean;
  successfulItems: string[]; // Cart item IDs
  failedItems: Array<{
    cartItemId: string;
    error: string;
  }>;
  message: string;
}
