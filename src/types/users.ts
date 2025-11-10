// User roles and permissions system

export type UserRole = 
  | 'superadmin'    // NEW: Can manage all organizations (above admin)
  | 'admin'
  | 'expert'
  | 'supervisor' // NEW: Can oversee expert reviews
  | 'especialista' // NEW: Specialist expert (renamed from expert for clarity)
  | 'user'
  | 'context_signoff'
  | 'agent_signoff'
  | 'context_reviewer'
  | 'agent_reviewer'
  | 'context_creator'
  | 'agent_creator'
  | 'context_collaborator'
  | 'agent_collaborator'
  | 'context_owner'
  | 'agent_owner';

export interface UserPermissions {
  // Admin permissions
  canManageUsers: boolean;
  canManageSystem: boolean;
  
  // Context permissions
  canCreateContext: boolean;
  canEditContext: boolean;
  canDeleteContext: boolean;
  canReviewContext: boolean;
  canSignOffContext: boolean;
  canShareContext: boolean;
  
  // Agent permissions
  canCreateAgent: boolean;
  canEditAgent: boolean;
  canDeleteAgent: boolean;
  canReviewAgent: boolean;
  canSignOffAgent: boolean;
  canShareAgent: boolean;
  
  // Collaboration permissions
  canCollaborate: boolean;
  canViewAnalytics: boolean;
}

export interface User {
  id: string; // Email-based ID for Firestore document lookup
  userId?: string; // ✅ Google OAuth numeric ID (permanent, for sharing)
  email: string;
  name: string;
  role: UserRole; // Primary role (for backward compatibility)
  roles: UserRole[]; // NEW: Support multiple roles with checkboxes
  permissions: UserPermissions;
  company: string;
  department?: string;
  createdAt: Date | string; // Accept both for API compatibility
  createdBy?: string; // NEW: Email of user who created this user
  updatedAt: Date | string; // Accept both for API compatibility
  lastLoginAt?: Date | string | null; // Accept both for API compatibility, can be null for "never logged in"
  isActive: boolean;
  avatarUrl?: string;
  
  // ========================================
  // MULTI-ORG FIELDS (2025-11-10) - ALL OPTIONAL
  // ========================================
  organizationId?: string;              // Primary organization (optional for backward compat)
  assignedOrganizations?: string[];     // Multiple org access (for multi-org admins)
  domainId?: string;                    // Specific domain within org (for domain-scoped roles)
  
  // Metadata for tracking
  agentAccessCount?: number; // Cached count of agents user has access to
  contextAccessCount?: number; // Cached count of context sources user has access to
  ownedAgentsCount?: number; // Count of ACTIVE agents created by this user
  sharedAgentsCount?: number; // DEPRECATED: Use sharedWithUserCount instead
  sharedWithUserCount?: number; // Count of unique agents shared WITH this user (received)
  sharedByUserCount?: number; // Count of unique agents shared BY this user (sent to others)
}

// Role-based permission presets
export const ROLE_PERMISSIONS: Record<UserRole, Partial<UserPermissions>> = {
  superadmin: {
    // SuperAdmin: Can manage ALL organizations and system
    canManageUsers: true,
    canManageSystem: true,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: true,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: true,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: true,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  admin: {
    // Admin: Can manage their organization (org-scoped)
    canManageUsers: true,
    canManageSystem: true,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: true,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: true,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: true,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  expert: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: false,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: true,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: false,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  supervisor: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: false,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: true,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: false,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  especialista: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: false,
    canReviewContext: true,
    canSignOffContext: false,
    canShareContext: true,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: false,
    canReviewAgent: true,
    canSignOffAgent: false,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  user: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: false,
    canViewAnalytics: false,
  },
  context_signoff: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: false,
    canViewAnalytics: false,
  },
  agent_signoff: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: false,
    canCollaborate: false,
    canViewAnalytics: false,
  },
  context_reviewer: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: true,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: false,
    canViewAnalytics: false,
  },
  agent_reviewer: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: true,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: false,
    canViewAnalytics: false,
  },
  context_creator: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: true,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: true,
    canViewAnalytics: false,
  },
  agent_creator: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: false,
  },
  context_collaborator: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: true,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: true,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: true,
    canViewAnalytics: false,
  },
  agent_collaborator: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: false,
    canEditAgent: true,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: false,
  },
  context_owner: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: true,
    canEditContext: true,
    canDeleteContext: true,
    canReviewContext: true,
    canSignOffContext: true,
    canShareContext: true,
    canCreateAgent: false,
    canEditAgent: false,
    canDeleteAgent: false,
    canReviewAgent: false,
    canSignOffAgent: false,
    canShareAgent: false,
    canCollaborate: true,
    canViewAnalytics: true,
  },
  agent_owner: {
    canManageUsers: false,
    canManageSystem: false,
    canCreateContext: false,
    canEditContext: false,
    canDeleteContext: false,
    canReviewContext: false,
    canSignOffContext: false,
    canShareContext: false,
    canCreateAgent: true,
    canEditAgent: true,
    canDeleteAgent: true,
    canReviewAgent: true,
    canSignOffAgent: true,
    canShareAgent: true,
    canCollaborate: true,
    canViewAnalytics: true,
  },
};

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
  const rolePerms = ROLE_PERMISSIONS[role];
  return {
    canManageUsers: rolePerms.canManageUsers ?? false,
    canManageSystem: rolePerms.canManageSystem ?? false,
    canCreateContext: rolePerms.canCreateContext ?? false,
    canEditContext: rolePerms.canEditContext ?? false,
    canDeleteContext: rolePerms.canDeleteContext ?? false,
    canReviewContext: rolePerms.canReviewContext ?? false,
    canSignOffContext: rolePerms.canSignOffContext ?? false,
    canShareContext: rolePerms.canShareContext ?? false,
    canCreateAgent: rolePerms.canCreateAgent ?? false,
    canEditAgent: rolePerms.canEditAgent ?? false,
    canDeleteAgent: rolePerms.canDeleteAgent ?? false,
    canReviewAgent: rolePerms.canReviewAgent ?? false,
    canSignOffAgent: rolePerms.canSignOffAgent ?? false,
    canShareAgent: rolePerms.canShareAgent ?? false,
    canCollaborate: rolePerms.canCollaborate ?? false,
    canViewAnalytics: rolePerms.canViewAnalytics ?? false,
  };
};

/**
 * Merge permissions from multiple roles
 * If user has multiple roles, they get union of all permissions
 */
export const getMergedPermissions = (roles: UserRole[]): UserPermissions => {
  const merged: Partial<UserPermissions> = {};
  
  // Merge permissions from all roles (OR operation)
  roles.forEach(role => {
    const rolePerms = ROLE_PERMISSIONS[role];
    Object.keys(rolePerms).forEach(key => {
      const permKey = key as keyof UserPermissions;
      merged[permKey] = merged[permKey] || rolePerms[permKey] || false;
    });
  });
  
  // Fill in any missing permissions with false
  return {
    canManageUsers: merged.canManageUsers ?? false,
    canManageSystem: merged.canManageSystem ?? false,
    canCreateContext: merged.canCreateContext ?? false,
    canEditContext: merged.canEditContext ?? false,
    canDeleteContext: merged.canDeleteContext ?? false,
    canReviewContext: merged.canReviewContext ?? false,
    canSignOffContext: merged.canSignOffContext ?? false,
    canShareContext: merged.canShareContext ?? false,
    canCreateAgent: merged.canCreateAgent ?? false,
    canEditAgent: merged.canEditAgent ?? false,
    canDeleteAgent: merged.canDeleteAgent ?? false,
    canReviewAgent: merged.canReviewAgent ?? false,
    canSignOffAgent: merged.canSignOffAgent ?? false,
    canShareAgent: merged.canShareAgent ?? false,
    canCollaborate: merged.canCollaborate ?? false,
    canViewAnalytics: merged.canViewAnalytics ?? false,
  };
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  expert: 'Experto',
  supervisor: 'Supervisor',
  especialista: 'Especialista',
  user: 'Usuario',
  context_signoff: 'Aprobador de Contexto',
  agent_signoff: 'Aprobador de Agente',
  context_reviewer: 'Revisor de Contexto',
  agent_reviewer: 'Revisor de Agente',
  context_creator: 'Creador de Contexto',
  agent_creator: 'Creador de Agente',
  context_collaborator: 'Colaborador de Contexto',
  agent_collaborator: 'Colaborador de Agente',
  context_owner: 'Propietario de Contexto',
  agent_owner: 'Propietario de Agente',
};

/**
 * MULTI-ORG HELPERS (2025-11-10)
 * Backward compatible organization access helpers
 */

/**
 * Check if user is SuperAdmin (can manage all organizations)
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'superadmin' || user?.roles?.includes('superadmin') || false;
}

/**
 * Check if user is admin of a specific organization
 */
export function isOrganizationAdmin(user: User | null, organizationId: string): boolean {
  if (!user || !organizationId) return false;
  
  // SuperAdmin can manage all orgs
  if (isSuperAdmin(user)) return true;
  
  // Check if user's primary org matches
  if (user.organizationId === organizationId && user.role === 'admin') return true;
  
  // Check if org is in assigned organizations
  if (user.assignedOrganizations?.includes(organizationId) && 
      (user.role === 'admin' || user.roles?.includes('admin'))) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can access organization data (admin or member)
 */
export function canAccessOrganization(user: User | null, organizationId: string): boolean {
  if (!user || !organizationId) return false;
  
  // SuperAdmin can access all orgs
  if (isSuperAdmin(user)) return true;
  
  // Check if user belongs to org
  if (user.organizationId === organizationId) return true;
  
  // Check assigned organizations
  if (user.assignedOrganizations?.includes(organizationId)) return true;
  
  return false;
}

/**
 * Get all organization IDs user can access
 */
export function getUserOrganizations(user: User | null): string[] {
  if (!user) return [];
  
  const orgs: string[] = [];
  
  // Add primary org
  if (user.organizationId) {
    orgs.push(user.organizationId);
  }
  
  // Add assigned orgs
  if (user.assignedOrganizations) {
    orgs.push(...user.assignedOrganizations);
  }
  
  // Remove duplicates
  return Array.from(new Set(orgs));
}

