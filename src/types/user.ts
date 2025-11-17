export type UserRole = 
  | 'admin'
  | 'expert' 
  | 'user'
  | 'context_signoff'
  | 'context_reviewer'
  | 'context_creator'
  | 'context_feedback'
  | 'agent_signoff'
  | 'agent_reviewer'
  | 'agent_creator'
  | 'agent_feedback';

export interface UserPermissions {
  // System
  canManageUsers?: boolean;
  canImpersonateUsers?: boolean;
  canAccessSystemSettings?: boolean;
  canViewAllData?: boolean;
  
  // Context
  canUploadContext?: boolean;
  canDeleteOwnContext?: boolean;
  canDeleteAnyContext?: boolean;
  canViewOwnContext?: boolean;
  canViewAllContext?: boolean;
  canReviewContext?: boolean;
  canSignOffContext?: boolean;
  canProvideFeedbackOnContext?: boolean;
  canShareContext?: boolean;
  
  // Agents
  canCreateAgents?: boolean;
  canDeleteOwnAgents?: boolean;
  canDeleteAnyAgent?: boolean;
  canViewOwnAgents?: boolean;
  canViewAllAgents?: boolean;
  canReviewAgents?: boolean;
  canSignOffAgents?: boolean;
  canProvideFeedbackOnAgents?: boolean;
  canShareAgents?: boolean;
  
  // Analytics
  canAccessAnalytics?: boolean;
  canViewOwnCosts?: boolean;
  canViewAllCosts?: boolean;
  canExportData?: boolean;
}

export interface User {
  // Identity
  id: string;
  email: string;
  name: string;
  googleUserId?: string; // Legacy: Google OAuth numeric ID (for backward compatibility)
  
  // Role & Permissions
  role: UserRole;
  permissions: UserPermissions;
  
  // Organization
  company: string;
  department?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Status
  isActive: boolean;
  
  // Profile
  avatarUrl?: string;
  
  // Impersonation (for tracking)
  impersonating?: {
    userId: string;
    startedAt: Date;
    originalUserId: string;
  };
}

export interface ImpersonationState {
  isImpersonating: boolean;
  originalUser: User;
  impersonatedUser: User;
  startedAt: Date;
}

