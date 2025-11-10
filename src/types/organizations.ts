/**
 * Organization Types - Multi-Organization System
 * 
 * Enables enterprise multi-tenancy with:
 * - Organization-level data isolation
 * - Multi-domain support (1 org = multiple domains)
 * - Per-org branding, encryption, and configuration
 * - Staging-to-production promotion workflow
 * 
 * BACKWARD COMPATIBLE: All fields on existing collections are optional
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

// Data source types (expanded from 2 → 3)
export type DataSource = 'localhost' | 'staging' | 'production';

// Organization tenant types
export type TenantType = 
  | 'dedicated'      // Dedicated GCP project (e.g., Salfa Corp)
  | 'saas'          // Shared infrastructure with data isolation
  | 'self-hosted';  // Client manages their own infrastructure

// Promotion statuses
export type PromotionStatus = 
  | 'pending'       // Awaiting approval
  | 'approved-org'  // Org admin approved
  | 'approved-super'// SuperAdmin approved (ready to execute)
  | 'executing'     // In progress
  | 'completed'     // Successfully promoted
  | 'failed'        // Execution failed
  | 'rejected'      // Denied by approver
  | 'cancelled';    // Cancelled by requester

// Conflict resolution strategies
export type ConflictResolution = 
  | 'use-staging'   // Take staging version
  | 'use-production'// Keep production version
  | 'merge'         // Manual merge
  | 'skip';         // Don't promote this item

/**
 * Organization Configuration
 * Represents a single organization (e.g., Salfa Corp) with multiple domains
 */
export interface Organization {
  // Identity
  id: string;                           // Unique org ID (e.g., 'salfa-corp')
  name: string;                         // Display name (e.g., 'Salfa Corp')
  slug: string;                         // URL-friendly identifier
  
  // Multi-domain support (1 org can have multiple domains)
  domains: string[];                    // All domains in this org (e.g., ['salfagestion.cl', 'salfa.cl'])
  primaryDomain: string;                // Main domain for this org
  
  // Administration
  admins: string[];                     // User IDs who can manage this org
  ownerUserId: string;                  // User who created the org
  
  // Infrastructure (tenant type)
  tenant: {
    type: TenantType;                   // How this org is hosted
    gcpProjectId?: string;              // GCP project (if dedicated)
    cloudRunService?: string;           // Cloud Run service name
    region?: string;                    // GCP region (e.g., 'us-east4')
    serviceAccountEmail?: string;       // Service account for this org
  };
  
  // Branding & Customization
  branding: {
    logo?: string;                      // Logo URL or base64
    favicon?: string;                   // Favicon URL or base64
    primaryColor: string;               // Hex color (e.g., '#0066CC')
    secondaryColor?: string;            // Secondary hex color
    brandName: string;                  // Display name in UI
  };
  
  // Evaluation Configuration (integrates with existing system)
  evaluationConfig: {
    enabled: boolean;                   // Enable evaluation for this org
    globalSettings: {
      priorityStarThreshold: number;    // Stars needed for priority (default: 4)
      autoFlagInaceptable: boolean;     // Auto-flag 1-star ratings
      requireSupervisorApproval: boolean; // Require supervisor approval
    };
    // Per-domain evaluation configs (maps to existing domain_review_configs)
    domainConfigs: Record<string, DomainEvaluationConfig>;
  };
  
  // Privacy & Security
  privacy: {
    dataResidency: string;              // Where data is stored (e.g., 'us-east4')
    encryptionEnabled: boolean;         // Enable KMS encryption
    encryptionKeyId?: string;           // KMS key ID (if encryption enabled)
    dataRetentionDays?: number;         // Data retention policy
  };
  
  // Limits & Quotas
  limits: {
    maxUsers: number;                   // Max users in org
    maxAgents: number;                  // Max agents per user
    maxStorageGB: number;               // Max storage per org
    maxMonthlyTokens?: number;          // Token usage limit
  };
  
  // Versioning & Conflict Detection (Best Practice #1)
  version: number;                      // Incremental version number
  lastModifiedIn: DataSource;           // Where last modified
  stagingVersion?: number;              // Version in staging (if exists)
  productionVersion?: number;           // Version in production (if exists)
  hasConflict?: boolean;                // Conflict detected
  
  // Promotion Tracking (Best Practice #7)
  promotedFromStaging?: boolean;        // Was promoted from staging
  promotedAt?: Date;                    // When promoted
  stagingId?: string;                   // Original staging document ID
  
  // Metadata
  isActive: boolean;                    // Organization active status
  createdAt: Date;                      // When created
  updatedAt: Date;                      // Last updated
  source: DataSource;                   // Where created (localhost/staging/production)
}

/**
 * Domain Evaluation Configuration (within an organization)
 * Maps to existing domain_review_configs collection
 */
export interface DomainEvaluationConfig {
  domainId: string;                     // Domain identifier
  supervisors: Array<{
    userId: string;
    email: string;
    assignedAt: Date;
  }>;
  especialistas: Array<{
    userId: string;
    email: string;
    assignedAt: Date;
  }>;
  implementers?: Array<{
    userId: string;
    email: string;
    assignedAt: Date;
  }>;
  settings: {
    priorityStarThreshold: number;      // Can override org default
    autoAssignOnCreate: boolean;        // Auto-assign new agents
    requireBulkReview: boolean;         // Enable bulk review mode
  };
}

/**
 * Promotion Request
 * Workflow for promoting changes from staging to production
 */
export interface PromotionRequest {
  id: string;                           // Request ID
  organizationId: string;               // Org this belongs to
  
  // What's being promoted
  resourceType: string;                 // 'agent' | 'context_source' | 'user' | 'config'
  resourceId: string;                   // ID of resource in staging
  resourceName: string;                 // Display name
  
  // Source & destination
  sourceEnvironment: 'staging';         // Always staging
  destinationEnvironment: 'production'; // Always production
  
  // Changes
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Workflow
  status: PromotionStatus;
  requestedBy: string;                  // User ID who requested
  requestedAt: Date;
  
  // Approvals (requires both org admin + superadmin)
  approvals: Array<{
    userId: string;
    role: 'admin' | 'superadmin';
    approvedAt: Date;
    notes?: string;
  }>;
  
  rejections?: Array<{
    userId: string;
    role: 'admin' | 'superadmin';
    rejectedAt: Date;
    reason: string;
  }>;
  
  // Execution
  executedAt?: Date;
  executedBy?: string;
  executionResult?: {
    success: boolean;
    message: string;
    snapshotId?: string;                // For rollback
  };
  
  // Conflict tracking
  conflicts?: Conflict[];
  conflictResolutions?: ConflictResolution[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conflict (when staging and production diverge)
 */
export interface Conflict {
  id: string;
  field: string;                        // Which field conflicts
  stagingValue: any;                    // Value in staging
  productionValue: any;                 // Value in production
  stagingVersion: number;               // Staging version number
  productionVersion: number;            // Production version number
  detectedAt: Date;
  resolved: boolean;
  resolution?: ConflictResolution;
}

/**
 * Promotion Snapshot (for rollback)
 */
export interface PromotionSnapshot {
  id: string;
  promotionRequestId: string;
  organizationId: string;
  
  // State before promotion
  beforeState: {
    resourceId: string;
    resourceType: string;
    data: any;                          // Full document state
    version: number;
  };
  
  // State after promotion
  afterState?: {
    resourceId: string;
    resourceType: string;
    data: any;
    version: number;
  };
  
  createdAt: Date;
  expiresAt: Date;                      // Snapshots expire after 90 days
}

/**
 * Data Lineage Event
 * Tracks complete journey of data from creation to promotion
 */
export interface DataLineageEvent {
  id: string;
  documentId: string;                   // Document being tracked
  collection: string;                   // Which collection
  organizationId?: string;              // Org it belongs to
  
  // Event details
  action: 'created' | 'updated' | 'deleted' | 'promoted' | 'rolled-back';
  source: DataSource;                   // Where action occurred
  performedBy: string;                  // User ID
  
  // Changes
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  
  // Promotion tracking
  promotionRequestId?: string;          // If part of promotion
  previousSource?: DataSource;          // If promoted (where it came from)
  
  timestamp: Date;
}

/**
 * Organization Statistics (cached for performance)
 */
export interface OrganizationStats {
  organizationId: string;
  
  // User metrics
  totalUsers: number;
  activeUsers: number;                  // Active in last 7 days
  adminCount: number;
  
  // Agent metrics
  totalAgents: number;
  activeAgents: number;
  sharedAgents: number;
  
  // Context metrics
  totalContextSources: number;
  validatedSources: number;
  
  // Evaluation metrics (if enabled)
  totalEvaluations?: number;
  pendingAssignments?: number;
  completedReviews?: number;
  
  // Usage metrics
  totalMessages: number;
  totalTokensUsed: number;
  estimatedMonthlyCost: number;
  
  // Computed at
  computedAt: Date;
}

/**
 * Organization Membership
 * Tracks which users belong to which organizations
 */
export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  
  // Role in organization
  role: 'owner' | 'admin' | 'supervisor' | 'especialista' | 'user';
  
  // Domain assignment (for domain-specific roles)
  assignedDomains?: string[];           // Specific domains user can access
  
  // Permissions
  canManageOrg: boolean;                // Can modify org settings
  canManageUsers: boolean;              // Can add/remove users
  canViewAnalytics: boolean;            // Can see org analytics
  
  // Metadata
  joinedAt: Date;
  invitedBy: string;                    // User ID who invited
  isActive: boolean;
}

/**
 * Input type for creating organization
 */
export interface CreateOrganizationInput {
  name: string;
  domains: string[];
  primaryDomain: string;
  ownerUserId: string;
  
  // Optional configurations
  tenant?: Partial<Organization['tenant']>;
  branding?: Partial<Organization['branding']>;
  evaluationConfig?: Partial<Organization['evaluationConfig']>;
  privacy?: Partial<Organization['privacy']>;
  limits?: Partial<Organization['limits']>;
}

/**
 * Input type for updating organization
 */
export interface UpdateOrganizationInput {
  name?: string;
  primaryDomain?: string;
  branding?: Partial<Organization['branding']>;
  evaluationConfig?: Partial<Organization['evaluationConfig']>;
  privacy?: Partial<Organization['privacy']>;
  limits?: Partial<Organization['limits']>;
  isActive?: boolean;
}

/**
 * Helper: Default organization configuration
 */
export const DEFAULT_ORGANIZATION_CONFIG: Partial<Organization> = {
  tenant: {
    type: 'saas',
    region: 'us-east4',
  },
  branding: {
    primaryColor: '#0066CC',
    brandName: 'SalfaGPT',
  },
  evaluationConfig: {
    enabled: false,
    globalSettings: {
      priorityStarThreshold: 4,
      autoFlagInaceptable: true,
      requireSupervisorApproval: true,
    },
    domainConfigs: {},
  },
  privacy: {
    dataResidency: 'us-east4',
    encryptionEnabled: false,
  },
  limits: {
    maxUsers: 1000,
    maxAgents: 100,      // Per user
    maxStorageGB: 100,
  },
  version: 1,
  isActive: true,
};

/**
 * Helper: Validate organization data
 */
export function validateOrganization(org: Partial<Organization>): string[] {
  const errors: string[] = [];
  
  if (!org.name || org.name.trim().length === 0) {
    errors.push('Organization name is required');
  }
  
  if (!org.domains || org.domains.length === 0) {
    errors.push('At least one domain is required');
  }
  
  if (!org.primaryDomain) {
    errors.push('Primary domain is required');
  }
  
  if (org.primaryDomain && org.domains && !org.domains.includes(org.primaryDomain)) {
    errors.push('Primary domain must be in domains list');
  }
  
  if (!org.ownerUserId) {
    errors.push('Owner user ID is required');
  }
  
  // Validate branding colors (if provided)
  if (org.branding?.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(org.branding.primaryColor)) {
    errors.push('Primary color must be valid hex color (e.g., #0066CC)');
  }
  
  return errors;
}

/**
 * Helper: Generate organization slug from name
 */
export function generateOrgSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Helper: Check if user is org admin
 */
export function isOrganizationAdmin(userId: string, org: Organization): boolean {
  return org.ownerUserId === userId || org.admins.includes(userId);
}

/**
 * Helper: Check if domain belongs to organization
 */
export function isDomainInOrganization(domain: string, org: Organization): boolean {
  return org.domains.includes(domain.toLowerCase());
}

/**
 * Helper: Get user's organization from email domain
 */
export function getOrganizationIdFromEmail(email: string, organizations: Organization[]): string | null {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return null;
  
  const org = organizations.find(o => 
    o.domains.some(d => d.toLowerCase() === emailDomain)
  );
  
  return org?.id || null;
}

