export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type TaskCategory = 'Production' | 'Inventory' | 'Quality' | 'Planning' | 'Maintenance' | 'General';

export interface TaskItem {
  task_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  assigned_to: string; // User ID/username
  assigned_by: string; // User ID/username who assigned the task
  project_id?: string; // Optional: link to specific project
  due_date?: Date;
  created_date: Date;
  updated_date: Date;
  completed_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  attachments?: string[]; // File paths or URLs
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  assigned_to: string;
  project_id?: string;
  due_date?: Date;
  estimated_hours?: number;
  notes?: string;
}

export interface UpdateTaskRequest {
  task_id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: TaskCategory;
  assigned_to?: string;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
}

export interface TaskComment {
  comment_id: string;
  task_id: string;
  user_id: string;
  username: string;
  comment: string;
  created_date: Date;
}

export interface TaskAssignment {
  assignment_id: string;
  task_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_date: Date;
  notes?: string;
}

// For dashboard statistics
export interface TaskStatistics {
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  high_priority_tasks: number;
  tasks_by_category: Record<TaskCategory, number>;
  tasks_by_user: Record<string, number>;
}

// User-specific task summary for profile/todo list
export interface UserTaskSummary {
  user_id: string;
  username: string;
  pending_tasks: TaskItem[];
  in_progress_tasks: TaskItem[];
  overdue_tasks: TaskItem[];
  completed_today: number;
  total_assigned: number;
}
