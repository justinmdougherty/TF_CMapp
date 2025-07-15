export interface ProjectStep {
  step_id: number;
  project_id: number;
  step_name: string;
  step_description?: string;
  step_order: number;
  step_code?: string;
}
