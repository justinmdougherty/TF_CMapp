export interface TrackedItem {
  item_id: string;
  project_id: string;
  item_identifier: string; // The primary identifier for the item (maps to database field)
  current_overall_status: string;
  date_created: string;
  last_modified: string;
  is_shipped: boolean;
  shipped_date?: string;
  date_fully_completed?: string;
  notes?: string;
  created_by?: string;
  // Dynamic attributes are handled separately via TrackedItemAttribute
  attributes?: TrackedItemAttribute[]; // Optional array of dynamic attributes
}

export interface TrackedItemAttribute {
  item_id: string;
  attribute_definition_id: string;
  attribute_value: string;
  attribute_name?: string; // For display purposes
  attribute_type?: string; // For display purposes
}

export interface TrackedItemStepProgress {
  item_id: string;
  step_id: string;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'N/A';
  completed_by_user_name?: string;
  completion_timestamp?: string;
}
