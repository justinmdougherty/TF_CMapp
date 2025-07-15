export interface TrackedItem {
  item_id: string;
  project_id: string;
  unit_serial_number: string;
  pcb_serial_number?: string;
  date_created: string;
  is_shipped: boolean;
  shipped_date?: string;
  date_fully_completed?: string;
  // Dynamic attributes will be stored in TrackedItemAttribute
}

export interface TrackedItemAttribute {
  item_id: string;
  attribute_definition_id: string;
  attribute_value: string;
}

export interface TrackedItemStepProgress {
  item_id: string;
  step_id: string;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'N/A';
  completed_by_user_name?: string;
  completion_timestamp?: string;
}
