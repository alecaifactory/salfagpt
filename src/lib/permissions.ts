import type { User, UserRole, UserPermissions } from '../types/user';

/**
 * Get all permissions for a given role
 */
export function getPermissionsForRole(role: UserRole): UserPermissions {
  const rolePermissions: Record<UserRole, UserPermissions> = {
    admin: {
      // All permissions
      canManageUsers: true,
      canImpersonateUsers: true,
      canAccessSystemSettings: true,
      canViewAllData: true,
      canUploadContext: true,
      canDeleteOwnContext: true,
      canDeleteAnyContext: true,
      canViewOwnContext: true,
      canViewAllContext: true,
      canReviewContext: true,
      canSignOffContext: true,
      canProvideFeedbackOnContext: true,
      canShareContext: true,
      canCreateAgents: true,
      canDeleteOwnAgents: true,
      canDeleteAnyAgent: true,
      canViewOwnAgents: true,
      canViewAllAgents: true,
      canReviewAgents: true,
      canSignOffAgents: true,
      canProvideFeedbackOnAgents: true,
      canShareAgents: true,
      canAccessAnalytics: true,
      canViewOwnCosts: true,
      canViewAllCosts: true,
      canExportData: true,
    },
    
    expert: {
      canUploadContext: true,
      canDeleteOwnContext: true,
      canViewOwnContext: true,
      canReviewContext: true,
      canSignOffContext: true,
      canProvideFeedbackOnContext: true,
      canShareContext: true,
      canCreateAgents: true,
      canDeleteOwnAgents: true,
      canViewOwnAgents: true,
      canReviewAgents: true,
      canSignOffAgents: true,
      canProvideFeedbackOnAgents: true,
      canShareAgents: true,
      canAccessAnalytics: true,
      canViewOwnCosts: true,
    },
    
    context_signoff: {
      canSignOffContext: true,
      canReviewContext: true,
      canViewAllContext: true,
      canProvideFeedbackOnContext: true,
      canUploadContext: true,
      canViewOwnContext: true,
      canCreateAgents: true,
      canViewOwnAgents: true,
    },
    
    context_reviewer: {
      canReviewContext: true,
      canViewAllContext: true,
      canProvideFeedbackOnContext: true,
      canUploadContext: true,
      canViewOwnContext: true,
      canCreateAgents: true,
      canViewOwnAgents: true,
    },
    
    context_creator: {
      canUploadContext: true,
      canDeleteOwnContext: true,
      canViewOwnContext: true,
      canCreateAgents: true,
      canViewOwnAgents: true,
    },
    
    context_feedback: {
      canProvideFeedbackOnContext: true,
      canViewAllContext: true,
      canUploadContext: true,
      canCreateAgents: true,
      canViewOwnAgents: true,
    },
    
    agent_signoff: {
      canSignOffAgents: true,
      canReviewAgents: true,
      canViewAllAgents: true,
      canProvideFeedbackOnAgents: true,
      canCreateAgents: true,
      canUploadContext: true,
      canViewOwnContext: true,
    },
    
    agent_reviewer: {
      canReviewAgents: true,
      canViewAllAgents: true,
      canProvideFeedbackOnAgents: true,
      canCreateAgents: true,
      canUploadContext: true,
      canViewOwnContext: true,
    },
    
    agent_creator: {
      canCreateAgents: true,
      canDeleteOwnAgents: true,
      canViewOwnAgents: true,
      canUploadContext: true,
      canViewOwnContext: true,
    },
    
    agent_feedback: {
      canProvideFeedbackOnAgents: true,
      canViewAllAgents: true,
      canCreateAgents: true,
      canUploadContext: true,
      canViewOwnContext: true,
    },
    
    user: {
      canCreateAgents: true,
      canDeleteOwnAgents: true,
      canViewOwnAgents: true,
      canUploadContext: true,
      canDeleteOwnContext: true,
      canViewOwnContext: true,
    },
  };
  
  return rolePermissions[role] || rolePermissions.user;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: User | null,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  
  // Admins have all permissions
  if (user.role === 'admin') return true;
  
  // Check specific permission
  return user.permissions?.[permission] === true;
}

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole): {
  label: string;
  color: string;
  icon: string;
  description: string;
} {
  const roleInfo: Record<UserRole, { label: string; color: string; icon: string; description: string }> = {
    admin: {
      label: 'Admin',
      color: 'purple',
      icon: '👑',
      description: 'Full system access and user management'
    },
    expert: {
      label: 'Expert',
      color: 'blue',
      icon: '🎓',
      description: 'Advanced features, validation, and analytics'
    },
    user: {
      label: 'User',
      color: 'slate',
      icon: '👤',
      description: 'Standard user with basic features'
    },
    context_signoff: {
      label: 'Context Signoff',
      color: 'green',
      icon: '✅',
      description: 'Can certify context sources as official'
    },
    context_reviewer: {
      label: 'Context Reviewer',
      color: 'yellow',
      icon: '👁️',
      description: 'Reviews context quality before certification'
    },
    context_creator: {
      label: 'Context Creator',
      color: 'indigo',
      icon: '📝',
      description: 'Uploads and manages context sources'
    },
    context_feedback: {
      label: 'Context Feedback',
      color: 'cyan',
      icon: '💬',
      description: 'Provides feedback on context quality'
    },
    agent_signoff: {
      label: 'Agent Signoff',
      color: 'green',
      icon: '🤖✅',
      description: 'Can certify agents as official templates'
    },
    agent_reviewer: {
      label: 'Agent Reviewer',
      color: 'yellow',
      icon: '🤖👁️',
      description: 'Reviews agent quality before certification'
    },
    agent_creator: {
      label: 'Agent Creator',
      color: 'indigo',
      icon: '🤖📝',
      description: 'Creates and configures agents'
    },
    agent_feedback: {
      label: 'Agent Feedback',
      color: 'cyan',
      icon: '🤖💬',
      description: 'Provides feedback on agent quality'
    },
  };
  
  return roleInfo[role];
}

/**
 * Check if user can access a resource
 */
export function canAccessResource(
  user: User | null,
  resourceType: 'context' | 'agent' | 'user' | 'analytics',
  resourceOwnerId?: string
): boolean {
  if (!user) return false;
  
  // Admins can access everything
  if (user.role === 'admin') return true;
  
  switch (resourceType) {
    case 'context':
      // Can view all context?
      if (hasPermission(user, 'canViewAllContext')) return true;
      // Can view own context?
      if (resourceOwnerId === user.id && hasPermission(user, 'canViewOwnContext')) return true;
      return false;
      
    case 'agent':
      // Can view all agents?
      if (hasPermission(user, 'canViewAllAgents')) return true;
      // Can view own agents?
      if (resourceOwnerId === user.id && hasPermission(user, 'canViewOwnAgents')) return true;
      return false;
      
    case 'user':
      // Only admins can view other users
      return user.role === 'admin';
      
    case 'analytics':
      return hasPermission(user, 'canAccessAnalytics');
      
    default:
      return false;
  }
}

