// User roles and permissions system

export type UserRole = 
  | 'admin'
  | 'expert'
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
  // Metadata for tracking
  agentAccessCount?: number; // Cached count of agents user has access to
  contextAccessCount?: number; // Cached count of context sources user has access to
  ownedAgentsCount?: number; // Cached count of agents created by this user
  sharedAgentsCount?: number; // Cached count of agents shared with this user
}

// Role-based permission presets
export const ROLE_PERMISSIONS: Record<UserRole, Partial<UserPermissions>> = {
  admin: {
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
  admin: 'Administrador',
  expert: 'Experto',
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

