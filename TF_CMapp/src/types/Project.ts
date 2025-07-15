// Project status types that reflect real production scenarios
export type ProjectStatus = 'Active' | 'Inactive' | 'Planning' | 'Completed' | 'Archived' | 'On Hold';

export interface Project {
  project_id: number;
  project_name: string;
  project_description: string;
  project_type: string; // Added project_type
  status: ProjectStatus;
  date_created: string;
  last_modified: string;
  project_start_date?: string; // Added for calendar integration
  project_end_date?: string; // Added for calendar integration  
  estimated_completion_date?: string; // Added for calendar integration
}
