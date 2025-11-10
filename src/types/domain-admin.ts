// Domain Admin Assignment Types
// SuperAdmin assigns domains to Admins
// Admins can then configure experts for their assigned domains

export interface DomainAdminAssignment {
  id: string; // Document ID
  adminUserId: string; // Admin user ID
  adminEmail: string; // Admin email
  adminName: string; // Admin name
  assignedDomains: string[]; // Domains this admin can manage
  assignedAt: Date;
  assignedBy: string; // SuperAdmin who assigned
  isActive: boolean;
  permissions: {
    canConfigureExperts: boolean; // Can assign supervisors/specialists
    canViewAnalytics: boolean; // Can see domain analytics
    canManageUsers: boolean; // Can manage users in domain
    canShareAgents: boolean; // Can share domain agents
  };
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

export interface DomainInfo {
  id: string; // Domain name (ej: "getaifactory.com")
  name: string; // Display name
  adminUserIds: string[]; // Admins assigned to this domain
  agentCount: number; // Cached count
  userCount: number; // Cached count
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

