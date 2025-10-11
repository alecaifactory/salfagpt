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
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  company: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  avatarUrl?: string;
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

