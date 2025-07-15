// Enhanced User and Permission System for Role-Based Access Control
import { ProgramAccess, UserAccessProfile, AccessRequest, AccessResult } from './ProgramAccess';

export type UserRole = 'Admin' | 'ProjectManager' | 'Technician' | 'Visitor';
export type UserStatus = 'Active' | 'Inactive' | 'PendingApproval' | 'Suspended';

export interface Permission {
  resource: 'production' | 'inventory' | 'projects' | 'tasks' | 'users' | 'reports' | 'settings';
  actions: ('read' | 'write' | 'delete' | 'approve')[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  canAccessRoute: string[]; // Array of route patterns this role can access
}

// Default role configurations
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'Admin',
    permissions: [
      { resource: 'production', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'inventory', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'projects', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'tasks', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'users', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'reports', actions: ['read', 'write', 'delete', 'approve'] },
      { resource: 'settings', actions: ['read', 'write', 'delete', 'approve'] },
    ],
    canAccessRoute: ['*'], // Full access to all routes
  },
  {
    role: 'ProjectManager',
    permissions: [
      { resource: 'production', actions: ['read', 'write', 'approve'] },
      { resource: 'inventory', actions: ['read', 'write'] },
      { resource: 'projects', actions: ['read', 'write', 'approve'] },
      { resource: 'tasks', actions: ['read', 'write', 'approve'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'write'] },
      { resource: 'settings', actions: ['read'] },
    ],
    canAccessRoute: ['/dashboard', '/projects/*', '/production/*', '/inventory/*', '/tasks/*', '/reports/*'],
  },
  {
    role: 'Technician',
    permissions: [
      { resource: 'production', actions: ['read', 'write'] },
      { resource: 'inventory', actions: ['read', 'write'] },
      { resource: 'projects', actions: ['read'] },
      { resource: 'tasks', actions: ['read', 'write'] },
      { resource: 'users', actions: [] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'settings', actions: [] },
    ],
    canAccessRoute: ['/dashboard', '/production/*', '/inventory/*', '/tasks/my-tasks'],
  },
  {
    role: 'Visitor',
    permissions: [
      { resource: 'production', actions: ['read'] },
      { resource: 'inventory', actions: ['read'] },
      { resource: 'projects', actions: ['read'] },
      { resource: 'tasks', actions: [] },
      { resource: 'users', actions: [] },
      { resource: 'reports', actions: [] },
      { resource: 'settings', actions: [] },
    ],
    canAccessRoute: ['/dashboard', '/production/view', '/inventory/view'],
  },
];

export interface UserProfile {
  user_id: string;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  phone?: string;
  avatar_url?: string;
  has_certificate?: boolean;
  certificate_thumbprint?: string; // For certificate-based authentication
  created_date: Date;
  last_login?: Date;
  approved_by?: string; // User ID of admin who approved access
  approved_date?: Date;
  permissions: Permission[]; // Current effective permissions
  custom_permissions?: Permission[]; // Override default role permissions if needed
  preferences?: UserPreferences;
  
  // Multi-tenant access control
  program_access: ProgramAccess[]; // Programs the user has access to
  accessible_programs: string[]; // Computed: Program IDs user can access
  accessible_projects: string[]; // Computed: Project IDs user can access across all programs
  default_program?: string; // Default program context for user
  can_see_all_programs: boolean; // System admin privilege
  can_create_programs: boolean; // Program creation privilege
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

export interface UserAccessRequest {
  request_id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_role: UserRole;
  requested_date: Date;
  justification?: string;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: string;
  reviewed_date?: Date;
  review_notes?: string;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  certificate_thumbprint?: string;
  login_method: 'certificate' | 'username_password' | 'auto_registered';
  login_time: Date;
  last_activity: Date;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
}

// Enhanced Team Member for task assignment with permissions
export interface TeamMember {
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  current_task_count: number;
  availability_status: 'Available' | 'Busy' | 'Overloaded' | 'Unavailable';
  skills: string[];
  last_active: Date;
  permissions: Permission[]; // Actual permissions for this user
  can_be_assigned_tasks: boolean; // Based on role and status
}

// User management functions
export interface UserManagementService {
  getAllUsers: () => Promise<UserProfile[]>;
  getPendingAccessRequests: () => Promise<UserAccessRequest[]>;
  approveUserAccess: (userId: string, role: UserRole, reviewNotes?: string) => Promise<void>;
  denyUserAccess: (userId: string, reviewNotes?: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: Permission[]) => Promise<void>;
  suspendUser: (userId: string, reason?: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  registerVisitor: (userInfo: Partial<UserProfile>) => Promise<UserProfile>;
}

// Permission checking utilities with multi-tenant support
export interface PermissionChecker {
  hasPermission: (user: UserProfile, resource: Permission['resource'], action: Permission['actions'][0]) => boolean;
  canAccessRoute: (user: UserProfile, route: string) => boolean;
  getEffectivePermissions: (user: UserProfile) => Permission[];
  isAdmin: (user: UserProfile) => boolean;
  canManageUsers: (user: UserProfile) => boolean;
  
  // Multi-tenant permission checking
  hasAccessToProgram: (user: UserProfile, programId: string) => boolean;
  hasAccessToProject: (user: UserProfile, projectId: string, programId?: string) => boolean;
  canManageProgram: (user: UserProfile, programId: string) => boolean;
  canManageProject: (user: UserProfile, projectId: string) => boolean;
  getAccessiblePrograms: (user: UserProfile) => string[];
  getAccessibleProjects: (user: UserProfile, programId?: string) => string[];
  checkAccess: (user: UserProfile, request: AccessRequest) => AccessResult;
}
