import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  Permission,
  DEFAULT_ROLE_PERMISSIONS,
  UserAccessRequest,
} from '../types/UserPermissions';
import { AccessRequest, AccessResult, Program } from '../types/ProgramAccess';

interface RBACContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userPermissions: Permission[];
  currentProgram: string | null; // Currently selected program context
  availablePrograms: Program[]; // Programs user has access to

  // Authentication methods
  loginWithCertificate: () => Promise<boolean>;
  loginAsUser: (user: UserProfile) => Promise<void>;
  logout: () => void;

  // Permission checking
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // Multi-tenant access control
  hasAccessToProgram: (programId: string) => boolean;
  hasAccessToProject: (projectId: string, programId?: string) => boolean;
  canManageProgram: (programId: string) => boolean;
  canManageProject: (projectId: string) => boolean;
  getAccessiblePrograms: () => string[];
  getAccessibleProjects: (programId?: string) => string[];
  checkAccess: (request: AccessRequest) => AccessResult;
  switchProgram: (programId: string) => void;

  // User management (Admin only)
  getAllUsers: () => Promise<UserProfile[]>;
  getPendingAccessRequests: () => Promise<UserAccessRequest[]>;
  approveUserAccess: (userId: string, role: UserRole, notes?: string) => Promise<void>;
  denyUserAccess: (userId: string, notes?: string) => Promise<void>;

  // Program/Project management (Admin/ProgramAdmin only)
  getAllPrograms: () => Promise<Program[]>;
  assignUserToProgram: (
    userId: string,
    programId: string,
    role: UserRole,
    accessLevel: string,
  ) => Promise<void>;
  assignUserToProject: (
    userId: string,
    projectId: string,
    role: UserRole,
    accessLevel: string,
  ) => Promise<void>;
  removeUserFromProgram: (userId: string, programId: string) => Promise<void>;
  removeUserFromProject: (userId: string, projectId: string) => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

// Mock data for development - replace with actual API calls
const mockUsers: UserProfile[] = [
  {
    user_id: 'admin-001',
    email: 'admin@tfproject.com',
    full_name: 'System Administrator',
    role: 'Admin',
    status: 'Active',
    created_date: new Date('2024-01-01'),
    last_login: new Date(),
    has_certificate: true,
    certificate_thumbprint: 'admin-cert-123',
    permissions: DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Admin')?.permissions || [],
    program_access: [], // Admin has system-wide access
    accessible_programs: [],
    accessible_projects: [],
    can_see_all_programs: true,
    can_create_programs: true,
  },
  {
    user_id: 'pm-001',
    email: 'pm@tfproject.com',
    full_name: 'Project Manager',
    role: 'ProjectManager',
    status: 'Active',
    created_date: new Date('2024-01-15'),
    last_login: new Date(Date.now() - 86400000), // Yesterday
    has_certificate: false,
    permissions:
      DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'ProjectManager')?.permissions || [],
    program_access: [
      {
        program_id: 'tf-main',
        program_name: 'TF Main Program',
        user_role: 'ProjectManager',
        access_level: 'Program',
        granted_date: new Date('2024-01-15'),
        granted_by: 'admin-001',
        project_assignments: [],
      },
    ],
    accessible_programs: ['tf-main'],
    accessible_projects: [],
    can_see_all_programs: false,
    can_create_programs: false,
  },
  {
    user_id: 'tech-001',
    email: 'tech@tfproject.com',
    full_name: 'Lead Technician',
    role: 'Technician',
    status: 'Active',
    created_date: new Date('2024-02-01'),
    last_login: new Date(Date.now() - 3600000), // 1 hour ago
    has_certificate: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Technician')?.permissions || [],
    program_access: [
      {
        program_id: 'tf-main',
        program_name: 'TF Main Program',
        user_role: 'Technician',
        access_level: 'Limited',
        granted_date: new Date('2024-02-01'),
        granted_by: 'pm-001',
        project_assignments: [
          {
            project_id: 'proj-001',
            project_name: 'Project Alpha',
            program_id: 'tf-main',
            user_role: 'Technician',
            access_level: 'Write',
            granted_date: new Date('2024-02-01'),
            granted_by: 'pm-001',
          },
        ],
      },
    ],
    accessible_programs: ['tf-main'],
    accessible_projects: ['proj-001'],
    can_see_all_programs: false,
    can_create_programs: false,
  },
  {
    user_id: 'visitor-001',
    email: 'visitor@tfproject.com',
    full_name: 'Guest User',
    role: 'Visitor',
    status: 'Active',
    created_date: new Date('2024-02-15'),
    last_login: new Date(Date.now() - 7200000), // 2 hours ago
    has_certificate: false,
    permissions: DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Visitor')?.permissions || [],
    program_access: [],
    accessible_programs: [],
    accessible_projects: [],
    can_see_all_programs: false,
    can_create_programs: false,
  },
];

const mockPendingRequests: UserAccessRequest[] = [
  {
    request_id: 'req-001',
    user_id: 'pending-001',
    email: 'newuser@tfproject.com',
    full_name: 'New User',
    requested_role: 'Technician',
    justification: 'Need access to production tracking for quality control work',
    requested_date: new Date(Date.now() - 86400000),
    status: 'pending',
  },
];

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(mockUsers);
  const [pendingRequests, setPendingRequests] = useState<UserAccessRequest[]>(mockPendingRequests);
  const [currentProgram, setCurrentProgram] = useState<string | null>(null);
  const [availablePrograms] = useState<Program[]>([]);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for current user from database via API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const authData = await response.json();
          const user = authData.user;

          // Map the API response to our UserProfile format
          const userProfile: UserProfile = {
            user_id: user.user_id.toString(),
            email: user.email || '',
            full_name: user.displayName || user.username || '',
            role: user.is_system_admin ? 'Admin' : 'Technician',
            status: 'Active',
            created_date: new Date(),
            last_login: new Date(),
            has_certificate: true,
            certificate_thumbprint: user.certificateInfo?.subject || '',
            permissions: user.is_system_admin
              ? DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Admin')?.permissions || []
              : DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Technician')?.permissions || [],
            program_access: user.program_access || [],
            accessible_programs: user.accessible_programs || [],
            accessible_projects: [],
            can_see_all_programs: user.is_system_admin || false,
            can_create_programs: user.is_system_admin || false,
          };

          setCurrentUser(userProfile);
          setIsAuthenticated(true);
        } else {
          console.log('No authenticated user found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Calculate user permissions based on role
  const userPermissions = currentUser?.permissions || [];

  // Authentication methods
  const loginWithCertificate = async (): Promise<boolean> => {
    try {
      // Attempt to authenticate with the API
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const authData = await response.json();
        const user = authData.user;

        // Map the API response to our UserProfile format
        const userProfile: UserProfile = {
          user_id: user.user_id.toString(),
          email: user.email || '',
          full_name: user.displayName || user.username || '',
          role: user.is_system_admin ? 'Admin' : 'Technician',
          status: 'Active',
          created_date: new Date(),
          last_login: new Date(),
          has_certificate: true,
          certificate_thumbprint: user.certificateInfo?.subject || '',
          permissions: user.is_system_admin
            ? DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Admin')?.permissions || []
            : DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === 'Technician')?.permissions || [],
          program_access: user.program_access || [],
          accessible_programs: user.accessible_programs || [],
          accessible_projects: [],
          can_see_all_programs: user.is_system_admin || false,
          can_create_programs: user.is_system_admin || false,
        };

        setCurrentUser(userProfile);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Certificate authentication failed:', error);
      return false;
    }
  };

  const loginAsUser = async (user: UserProfile): Promise<void> => {
    try {
      // For development/testing purposes, allow setting a user
      // In production, this would validate against the database
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentProgram(null);
    // In a real application, this would also invalidate the server session
  };

  // Permission checking methods
  const hasPermission = (resource: string, action: string): boolean => {
    if (!currentUser || !isAuthenticated) return false;

    return userPermissions.some(
      (permission: Permission) =>
        permission.resource === resource && permission.actions.includes(action as any),
    );
  };

  const hasRole = (role: UserRole): boolean => {
    return currentUser?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return currentUser ? roles.includes(currentUser.role) : false;
  };

  // Multi-tenant access control
  const hasAccessToProgram = (programId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.can_see_all_programs) return true;
    return currentUser.accessible_programs.includes(programId);
  };

  const hasAccessToProject = (projectId: string, programId?: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.can_see_all_programs) return true;

    if (programId) {
      // Check specific program's projects
      const programAccess = currentUser.program_access.find((p) => p.program_id === programId);
      if (programAccess?.access_level === 'Program') return true;
      return (
        programAccess?.project_assignments.some((proj) => proj.project_id === projectId) || false
      );
    }

    return currentUser.accessible_projects.includes(projectId);
  };

  const canManageProgram = (programId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;

    const programAccess = currentUser.program_access.find((p) => p.program_id === programId);
    return programAccess?.access_level === 'Admin' || false;
  };

  const canManageProject = (projectId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;

    // Check if user has admin access to any program containing this project
    return currentUser.program_access.some(
      (p) =>
        p.access_level === 'Admin' ||
        p.project_assignments.some(
          (proj) => proj.project_id === projectId && proj.access_level === 'Admin',
        ),
    );
  };

  const getAccessiblePrograms = (): string[] => {
    if (!currentUser) return [];
    return currentUser.accessible_programs;
  };

  const getAccessibleProjects = (programId?: string): string[] => {
    if (!currentUser) return [];

    if (programId) {
      const programAccess = currentUser.program_access.find((p) => p.program_id === programId);
      if (programAccess?.access_level === 'Program') {
        // Return all projects in program - would come from API
        return [];
      }
      return programAccess?.project_assignments.map((proj) => proj.project_id) || [];
    }

    return currentUser.accessible_projects;
  };

  const checkAccess = (request: AccessRequest): AccessResult => {
    if (!currentUser) return { granted: false, reason: 'Not authenticated' };

    const { resource_type, action, context } = request;

    // System admins have full access
    if (currentUser.role === 'Admin') {
      return { granted: true, scope: 'System' };
    }

    // Check program-level access
    if (resource_type === 'Program' && context?.program_id) {
      const hasAccess = hasAccessToProgram(context.program_id);
      const canManage = canManageProgram(context.program_id);

      if (action === 'Admin' && !canManage) {
        return { granted: false, reason: 'Insufficient program privileges' };
      }

      return {
        granted: hasAccess,
        scope: canManage ? 'Program' : 'Limited',
        reason: hasAccess ? undefined : 'No program access',
      };
    }

    // Check project-level access
    if (resource_type === 'Project' && context?.project_id) {
      const hasAccess = hasAccessToProject(context.project_id, context.program_id);
      const canManage = canManageProject(context.project_id);

      if (action === 'Admin' && !canManage) {
        return { granted: false, reason: 'Insufficient project privileges' };
      }

      return {
        granted: hasAccess,
        scope: canManage ? 'Project' : 'Limited',
        reason: hasAccess ? undefined : 'No project access',
      };
    }

    // Default to role-based permission check
    const hasResourcePermission = hasPermission(resource_type.toLowerCase(), action.toLowerCase());

    return {
      granted: hasResourcePermission,
      scope: 'Limited',
      reason: hasResourcePermission ? undefined : 'Insufficient permissions',
    };
  };

  const switchProgram = (programId: string): void => {
    if (hasAccessToProgram(programId)) {
      setCurrentProgram(programId);
      // Save to localStorage for persistence
      localStorage.setItem('currentProgram', programId);
    } else {
      console.warn(`Access denied to program ${programId}`);
    }
  };

  // User management methods (Admin only)
  const getAllUsers = async (): Promise<UserProfile[]> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }
    return allUsers;
  };

  const getPendingAccessRequests = async (): Promise<UserAccessRequest[]> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }
    return pendingRequests;
  };

  const approveUserAccess = async (
    userId: string,
    role: UserRole,
    notes?: string,
  ): Promise<void> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }

    try {
      // Find the pending request
      const request = pendingRequests.find((r) => r.user_id === userId);
      if (!request) {
        throw new Error('Access request not found');
      }

      // Create new user profile
      const newUser: UserProfile = {
        user_id: userId,
        email: request.email,
        full_name: request.full_name,
        role: role,
        status: 'Active',
        created_date: new Date(),
        has_certificate: false,
        permissions: DEFAULT_ROLE_PERMISSIONS.find((r) => r.role === role)?.permissions || [],
        program_access: [],
        accessible_programs: [],
        accessible_projects: [],
        can_see_all_programs: false,
        can_create_programs: false,
      };

      // Add to users list and remove from pending
      setAllUsers((prev) => [...prev, newUser]);
      setPendingRequests((prev) => prev.filter((r) => r.user_id !== userId));

      console.log(`User ${request.full_name} approved with role ${role}`, notes);
    } catch (error) {
      console.error('Error approving user access:', error);
      throw error;
    }
  };

  const denyUserAccess = async (userId: string, notes?: string): Promise<void> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }

    try {
      setPendingRequests((prev) => prev.filter((r) => r.user_id !== userId));
      console.log(`User access denied for ${userId}`, notes);
    } catch (error) {
      console.error('Error denying user access:', error);
      throw error;
    }
  };

  // Program/Project management methods (Admin only)
  const getAllPrograms = async (): Promise<Program[]> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }
    // For now, return mock data
    return [
      {
        program_id: 'program-001',
        program_name: 'Program 1',
        program_code: 'PROG-001',
        description: 'First program',
        status: 'Active',
        created_date: new Date(),
        last_modified: new Date(),
        settings: {
          allow_cross_project_visibility: false,
          require_project_assignment: true,
        },
      },
      {
        program_id: 'program-002',
        program_name: 'Program 2',
        program_code: 'PROG-002',
        description: 'Second program',
        status: 'Active',
        created_date: new Date(),
        last_modified: new Date(),
        settings: {
          allow_cross_project_visibility: false,
          require_project_assignment: true,
        },
      },
    ];
  };

  const assignUserToProgram = async (
    userId: string,
    programId: string,
    role: UserRole,
    accessLevel: string,
  ): Promise<void> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }

    // Mock implementation - in reality, this would update the user and program data
    console.log(`Assigned ${userId} to program ${programId} as ${role} with ${accessLevel} access`);
  };

  const assignUserToProject = async (
    userId: string,
    projectId: string,
    role: UserRole,
    accessLevel: string,
  ): Promise<void> => {
    if (!hasRole('Admin') && !hasRole('ProjectManager')) {
      throw new Error('Access denied: Admin or ProjectManager role required');
    }

    // Mock implementation - in reality, this would update the user and project data
    console.log(`Assigned ${userId} to project ${projectId} as ${role} with ${accessLevel} access`);
  };

  const removeUserFromProgram = async (userId: string, programId: string): Promise<void> => {
    if (!hasRole('Admin')) {
      throw new Error('Access denied: Admin role required');
    }

    // Mock implementation - in reality, this would update the user and program data
    console.log(`Removed ${userId} from program ${programId}`);
  };

  const removeUserFromProject = async (userId: string, projectId: string): Promise<void> => {
    if (!hasRole('Admin') && !hasRole('ProjectManager')) {
      throw new Error('Access denied: Admin or ProjectManager role required');
    }

    // Mock implementation - in reality, this would update the user and project data
    console.log(`Removed ${userId} from project ${projectId}`);
  };

  const contextValue: RBACContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    userPermissions,
    currentProgram,
    availablePrograms,

    // Authentication
    loginWithCertificate,
    loginAsUser,
    logout,

    // Permission checking
    hasPermission,
    hasRole,
    hasAnyRole,

    // Multi-tenant access control
    hasAccessToProgram,
    hasAccessToProject,
    canManageProgram,
    canManageProject,
    getAccessiblePrograms,
    getAccessibleProjects,
    checkAccess,
    switchProgram,

    // User management
    getAllUsers,
    getPendingAccessRequests,
    approveUserAccess,
    denyUserAccess,

    // Program/Project management
    getAllPrograms,
    assignUserToProgram,
    assignUserToProject,
    removeUserFromProgram,
    removeUserFromProject,
  };

  return <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>;
};

// Custom hook to use RBAC context
export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};

// Higher-order component for route protection
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: { resource: string; action: string };
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  fallback = <div>Access Denied</div>,
}) => {
  const { currentUser, isAuthenticated, hasRole, hasAnyRole, hasPermission } = useRBAC();

  if (!isAuthenticated || !currentUser) {
    return <>{fallback}</>;
  }

  // Check specific role
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Check specific permission
  if (
    requiredPermission &&
    !hasPermission(requiredPermission.resource, requiredPermission.action)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RBACContext;
