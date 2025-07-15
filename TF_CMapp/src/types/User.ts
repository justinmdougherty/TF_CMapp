export type UserRole = 'Technician' | 'Manager' | 'Administrator' | 'Quality Inspector' | 'Planner';
export type UserStatus = 'Active' | 'Inactive' | 'On Leave' | 'Terminated';

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  phone?: string;
  avatar_url?: string;
  created_date: Date;
  last_login?: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  email_notifications: boolean;
  task_reminders: boolean;
  dashboard_layout: 'compact' | 'detailed';
  default_project_view: 'all' | 'assigned' | 'active';
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  time_format: '12h' | '24h';
}

export interface UserTodoItem {
  todo_id: string;
  user_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: Date;
  created_date: Date;
  completed_date?: Date;
  task_id?: string; // Link to formal task if applicable
  project_id?: string; // Link to project if applicable
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: Date;
  task_id?: string;
  project_id?: string;
}

export interface UpdateTodoRequest {
  todo_id: string;
  title?: string;
  description?: string;
  is_completed?: boolean;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: Date;
}

// For user dashboard and profile
export interface UserDashboardData {
  user: UserProfile;
  task_summary: {
    pending_tasks: number;
    in_progress_tasks: number;
    completed_today: number;
    overdue_tasks: number;
  };
  recent_todos: UserTodoItem[];
  recent_activity: UserActivity[];
  productivity_stats: {
    tasks_completed_this_week: number;
    average_completion_time: number; // in hours
    efficiency_score: number; // 0-100
  };
}

export interface UserActivity {
  activity_id: string;
  user_id: string;
  activity_type: 'task_completed' | 'project_updated' | 'inventory_adjusted' | 'todo_added' | 'login';
  description: string;
  timestamp: Date;
  related_entity_id?: string;
  related_entity_type?: 'task' | 'project' | 'inventory' | 'todo';
}

// For manager assignment features
export interface TeamMember {
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  current_task_count: number;
  availability_status: 'Available' | 'Busy' | 'Overloaded' | 'Unavailable';
  skills: string[]; // Array of skill tags
  last_active: Date;
  productivity_score?: number; // Optional productivity score 0-100
}

export interface UserAssignmentInfo extends TeamMember {
  assigned_projects: string[]; // Project IDs
  workload_percentage: number; // 0-100, calculated based on tasks and estimated hours
  recent_performance: {
    tasks_completed_last_week: number;
    average_completion_time: number;
    quality_score: number; // 0-100
  };
}
