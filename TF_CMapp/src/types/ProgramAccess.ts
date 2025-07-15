// Multi-tenant program and project access control types

export interface Program {
  program_id: string;
  program_name: string;
  program_code: string; // Short identifier like "TF-PM", "AEROSPACE-A1"
  description?: string;
  status: 'Active' | 'Inactive' | 'Archived';
  created_date: Date;
  last_modified: Date;
  settings: ProgramSettings;
}

export interface ProgramSettings {
  allow_cross_project_visibility: boolean; // Can users see other projects in same program
  require_project_assignment: boolean; // Must users be explicitly assigned to projects
  default_project_role?: UserRole; // Default role when added to projects
  custom_fields?: Record<string, any>; // Program-specific configuration
}

export interface ProjectAccess {
  project_id: string;
  project_name: string;
  program_id: string;
  user_role: UserRole; // Role within this specific project
  access_level: ProjectAccessLevel;
  granted_date: Date;
  granted_by: string; // User ID who granted access
  expires_date?: Date; // Optional expiration
}

export type ProjectAccessLevel = 
  | 'Read' // Can view project and data
  | 'Write' // Can modify project data
  | 'Manage' // Can manage project settings and team
  | 'Admin'; // Full project control

export interface ProgramAccess {
  program_id: string;
  program_name: string;
  user_role: UserRole; // Role within this program
  access_level: ProgramAccessLevel;
  granted_date: Date;
  granted_by: string;
  expires_date?: Date;
  project_assignments: ProjectAccess[]; // Specific project access within this program
}

export type ProgramAccessLevel = 
  | 'Limited' // Access only to assigned projects
  | 'Program' // Access to all projects in program
  | 'Admin'; // Full program administration

// Enhanced user profile with multi-tenant access
export interface UserAccessProfile {
  user_id: string;
  system_role: SystemRole; // Overall system access level
  program_access: ProgramAccess[]; // Programs user can access
  
  // Computed properties for easy access
  accessible_programs: string[]; // Program IDs
  accessible_projects: string[]; // Project IDs across all programs
  
  // Access control settings
  can_see_all_programs: boolean; // System admin privilege
  can_create_programs: boolean; // Program creation privilege
  default_program?: string; // Default program context
}

export type SystemRole = 
  | 'SystemAdmin' // Full system access, all programs
  | 'ProgramAdmin' // Can manage assigned programs
  | 'ProjectManager' // Can manage assigned projects
  | 'Technician' // Project-level access
  | 'Visitor'; // Read-only access to assigned resources

// Permission checking interfaces
export interface AccessRequest {
  resource_type: 'Program' | 'Project' | 'Task' | 'User' | 'System';
  resource_id?: string; // Specific resource ID
  action: 'Read' | 'Write' | 'Delete' | 'Manage' | 'Admin';
  context?: {
    program_id?: string;
    project_id?: string;
  };
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
  scope?: 'System' | 'Program' | 'Project' | 'Limited';
  expires_at?: Date;
}

// Admin management interfaces
export interface ProgramUserAssignment {
  user_id: string;
  program_id: string;
  role: UserRole;
  access_level: ProgramAccessLevel;
  project_assignments?: ProjectUserAssignment[];
}

export interface ProjectUserAssignment {
  user_id: string;
  project_id: string;
  role: UserRole;
  access_level: ProjectAccessLevel;
}

// Utility types for UI components
export interface AccessibleResource {
  id: string;
  name: string;
  type: 'Program' | 'Project';
  access_level: string;
  role: UserRole;
  parent?: string; // Parent program for projects
}

export interface ProgramSummary {
  program: Program;
  user_access: ProgramAccess;
  project_count: number;
  accessible_projects: number;
  team_size: number;
}

// Import existing UserRole from UserPermissions
import { UserRole } from './UserPermissions';
