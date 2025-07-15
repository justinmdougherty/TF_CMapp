export type StepStatusType = 'Not Started' | 'In Progress' | 'Complete' | 'N/A';

export interface ProjectStep {
  step_id: string;
  project_id: string;
  step_name: string;
  step_order: number;
}

export interface UnitStepStatus {
  stepId: number | string; // API returns numbers, but we need to handle both
  status: StepStatusType;
  // Legacy field names (for backward compatibility)
  completedDate?: string;
  completedBy?: string;
  // New field names (current API response)
  completion_timestamp?: string;
  completed_by_user_name?: string;
}

export interface ProductionUnit {
  item_id: number | string; // API returns numbers, but we need to handle both
  unit_serial_number?: string | null; // API can return null
  pcb_serial_number?: string | null; // API can return null
  step_statuses?: UnitStepStatus[];
  is_shipped?: boolean;
  shipped_date?: string | null;
  date_fully_completed?: string | null;
  current_overall_status?: string; // Add this field from API
  date_created?: string;
  last_modified?: string;
  notes?: string;
  project_id?: number;
  attributes?: any[]; // For dynamic attributes
  [key: string]: any; // For any other dynamic fields
}

export interface TableColumnConfig {
  id: string;
  label: string;
  width?: string;
  minWidth?: number;
  tabs: string[];
  render?: (unit: ProductionUnit, value: any) => React.ReactNode;
}
