export interface PendingOrderItem {
  pending_order_id: number;
  inventory_item_id: number;
  item_name: string;
  part_number?: string;
  description?: string;
  unit_of_measure: string;
  quantity_requested: number;
  quantity_received: number;
  estimated_cost?: number;
  supplier?: string;
  date_requested: Date;
  requested_by: string;
  date_ordered?: Date;
  ordered_by?: string;
  date_shipped?: Date;
  shipped_by?: string;
  date_received?: Date;
  received_by?: string;
  status: PendingOrderStatus;
  notes?: string;
  po_number?: string;
  tracking_number?: string;
}

export type PendingOrderStatus = 
  | 'requested'     // Added to pending orders, not yet ordered
  | 'ordered'       // Order placed with supplier
  | 'shipped'       // Item shipped by supplier
  | 'partial'       // Partially received
  | 'received'      // Fully received
  | 'cancelled';    // Order cancelled

export interface PendingOrderSummary {
  total_items: number;
  total_estimated_cost: number;
  items_by_status: Record<PendingOrderStatus, number>;
}

export interface ReceiveItemsRequest {
  pending_order_ids: number[];
  items: {
    pending_order_id: number;
    quantity_received: number;
    actual_cost?: number;
    notes?: string;
  }[];
  received_by?: string;
}

export interface PendingOrderHeader {
  order_id: number;
  order_number: string;
  user_id: number;
  user_name: string;
  project_id: number;
  project_name: string;
  status: string;
  total_estimated_cost: number;
  supplier_info: string;
  order_notes: string;
  date_created: string;
  date_approved?: string;
  date_ordered?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  total_items: number;
}
