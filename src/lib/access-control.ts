/**
 * Role-Based Access Control System
 * 
 * Manages user roles and permissions for different sections of the platform.
 */

export enum UserRole {
  USER = 'user',           // Standard chat access
  EXPERT = 'expert',       // + Evaluation access
  ANALYTICS = 'analytics', // + Analytics access
  ADMIN = 'admin',         // + User management
  SUPERADMIN = 'superadmin' // Full system access
}

export interface UserAccess {
  email: string;
  role: UserRole;
  displayName?: string;
}

/**
 * Access control matrix defining which roles can access which routes
 */
const ACCESS_MATRIX: Record<string, UserRole[]> = {
  '/chat': [UserRole.USER, UserRole.EXPERT, UserRole.ANALYTICS, UserRole.ADMIN, UserRole.SUPERADMIN],
  '/expertos': [UserRole.EXPERT, UserRole.ADMIN, UserRole.SUPERADMIN],
  '/analytics': [UserRole.ANALYTICS, UserRole.ADMIN, UserRole.SUPERADMIN],
  '/superadmin': [UserRole.SUPERADMIN]
};

/**
 * Parse email lists from environment variables
 */
function parseEmailList(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
}

/**
 * Get role assignments from environment variables
 */
function getRoleAssignments(): Map<string, UserRole> {
  const assignments = new Map<string, UserRole>();
  
  // SuperAdmin (highest priority)
  const superadmins = parseEmailList(process.env.SUPERADMIN_EMAILS || import.meta.env?.SUPERADMIN_EMAILS);
  superadmins.forEach(email => assignments.set(email, UserRole.SUPERADMIN));
  
  // Admin
  const admins = parseEmailList(process.env.ADMIN_EMAILS || import.meta.env?.ADMIN_EMAILS);
  admins.forEach(email => {
    if (!assignments.has(email)) {
      assignments.set(email, UserRole.ADMIN);
    }
  });
  
  // Expert
  const experts = parseEmailList(process.env.EXPERT_EMAILS || import.meta.env?.EXPERT_EMAILS);
  experts.forEach(email => {
    if (!assignments.has(email)) {
      assignments.set(email, UserRole.EXPERT);
    }
  });
  
  // Analytics
  const analytics = parseEmailList(process.env.ANALYTICS_EMAILS || import.meta.env?.ANALYTICS_EMAILS);
  analytics.forEach(email => {
    if (!assignments.has(email)) {
      assignments.set(email, UserRole.ANALYTICS);
    }
  });
  
  return assignments;
}

/**
 * Get user role based on email
 */
export function getUserRole(email: string): UserRole {
  if (!email) return UserRole.USER;
  
  const normalizedEmail = email.toLowerCase().trim();
  const assignments = getRoleAssignments();
  
  return assignments.get(normalizedEmail) || UserRole.USER;
}

/**
 * Check if a user has access to a specific route
 */
export function hasAccess(userEmail: string, route: string): boolean {
  const userRole = getUserRole(userEmail);
  const allowedRoles = ACCESS_MATRIX[route] || [];
  
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(userEmail: string, requiredRole: UserRole): boolean {
  const userRole = getUserRole(userEmail);
  
  // Role hierarchy
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.EXPERT]: 2,
    [UserRole.ANALYTICS]: 2,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPERADMIN]: 4
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userEmail: string, roles: UserRole[]): boolean {
  const userRole = getUserRole(userEmail);
  return roles.includes(userRole);
}

/**
 * Get user access information
 */
export function getUserAccess(email: string, displayName?: string): UserAccess {
  return {
    email,
    role: getUserRole(email),
    displayName
  };
}

/**
 * Get role display information
 */
export function getRoleDisplay(role: UserRole): { label: string; color: string; icon: string } {
  const displays: Record<UserRole, { label: string; color: string; icon: string }> = {
    [UserRole.USER]: {
      label: 'User',
      color: 'bg-gray-100 text-gray-700',
      icon: '👤'
    },
    [UserRole.EXPERT]: {
      label: 'Expert',
      color: 'bg-purple-100 text-purple-700',
      icon: '👨‍💼'
    },
    [UserRole.ANALYTICS]: {
      label: 'Analytics',
      color: 'bg-blue-100 text-blue-700',
      icon: '📊'
    },
    [UserRole.ADMIN]: {
      label: 'Admin',
      color: 'bg-green-100 text-green-700',
      icon: '👔'
    },
    [UserRole.SUPERADMIN]: {
      label: 'SuperAdmin',
      color: 'bg-red-100 text-red-700',
      icon: '🔧'
    }
  };
  
  return displays[role];
}

/**
 * Get list of routes accessible by user
 */
export function getAccessibleRoutes(userEmail: string): string[] {
  const userRole = getUserRole(userEmail);
  
  return Object.entries(ACCESS_MATRIX)
    .filter(([_, allowedRoles]) => allowedRoles.includes(userRole))
    .map(([route]) => route);
}

/**
 * Middleware helper for API routes
 * Returns user access or null if unauthorized
 */
export async function verifyAccess(
  request: Request,
  requiredRole: UserRole
): Promise<UserAccess | null> {
  try {
    // Get user email from session cookie
    const cookies = request.headers.get('cookie') || '';
    const sessionCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('flow_session='));
    
    if (!sessionCookie) {
      return null;
    }
    
    // In a real implementation, you would decode the JWT here
    // For now, we'll use a placeholder
    const email = 'user@example.com'; // TODO: Extract from JWT
    
    // Check role
    const userRole = getUserRole(email);
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.USER]: 1,
      [UserRole.EXPERT]: 2,
      [UserRole.ANALYTICS]: 2,
      [UserRole.ADMIN]: 3,
      [UserRole.SUPERADMIN]: 4
    };
    
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      return null;
    }
    
    return { email, role: userRole };
  } catch (error) {
    console.error('Error verifying access:', error);
    return null;
  }
}

/**
 * Create access denied response
 */
export function createAccessDeniedResponse(message?: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Access Denied',
      message: message || 'You do not have permission to access this resource',
      code: 'INSUFFICIENT_PERMISSIONS'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

