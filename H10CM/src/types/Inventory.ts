export interface InventoryItem {
  inventory_item_id: number;
  item_name: string;
  part_number?: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  current_stock_level: number;
  reorder_point?: number;
  max_stock_level?: number;
  supplier_info?: string;
  cost_per_unit?: number;
  location?: string;
  program_id?: number;
  created_by?: number;
  is_active?: boolean;
  date_created?: string;
  last_modified?: string;
  last_cost_update?: string;
  project_id?: number; // For client-side filtering, not always in API response
}

export interface InventoryAdjustment {
  inventory_item_id: string | number;
  quantity_changed: number;
  transaction_type: 'add' | 'subtract';
  reason?: string;
  user_name?: string;
  po_number?: string;
  notes?: string;
}

export interface InventoryTransaction {
  transaction_id: string;
  inventory_item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  transaction_date: string;
  related_entity_id?: string; // e.g., project_id, tracked_item_id
  notes?: string;
}
