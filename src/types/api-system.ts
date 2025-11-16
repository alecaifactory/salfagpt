/**
 * Type Definitions for Flow API System
 * 
 * Purpose: Developer API for Flow Vision capabilities
 * Created: 2025-11-16
 * 
 * Collections:
 * - api_organizations: API workspace for external developers
 * - api_keys: Authentication credentials
 * - api_invitations: SuperAdmin-controlled access
 * - api_usage_logs: Request tracking and analytics
 * - api_requirement_workflows: Requirement document enhancement
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// API ORGANIZATIONS
// ============================================================================

export type APIOrganizationTier = 'trial' | 'starter' | 'pro' | 'enterprise';
export type APIOrganizationStatus = 'active' | 'suspended' | 'trial';
export type APIOrganizationType = 'api_consumer' | 'api_provider' | 'reseller';

export interface APIOrganization {
  // Identity
  id: string;                     // org-{timestamp}-{random}
  name: string;                   // "Salfa-Corp-API"
  domain: string;                 // "salfagestion.cl"
  
  // Ownership
  ownerId: string;                // User who created org
  ownerEmail: string;             // Business email
  memberIds: string[];            // Team members
  
  // Configuration
  type: APIOrganizationType;
  tier: APIOrganizationTier;
  
  // Limits
  quotas: {
    monthlyRequests: number;
    dailyRequests: number;
    concurrentRequests: number;
    maxFileSize: number;          // MB
  };
  
  // Usage tracking
  usage: {
    totalRequests: number;
    currentMonthRequests: number;
    currentDayRequests: number;
    totalDocumentsProcessed: number;
    totalTokensUsed: number;
    totalCost: number;
  };
  
  // Access control
  allowedIPs?: string[];
  webhookUrl?: string;
  webhookSecret?: string;          // For HMAC signature
  
  // Status
  status: APIOrganizationStatus;
  trialEndsAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}

// ============================================================================
// API KEYS
// ============================================================================

export type APIKeyStatus = 'active' | 'revoked';
export type APIScope = 
  | 'vision:read'
  | 'vision:write'
  | 'vision:delete'
  | 'org:read'
  | 'org:write'
  | 'analytics:read';

export interface APIKey {
  // Identity
  id: string;
  key: string;                    // Hashed with bcrypt
  keyPrefix: string;              // First 8 chars (for display)
  
  // Ownership
  organizationId: string;
  createdBy: string;
  createdByEmail: string;
  
  // Configuration
  name: string;                   // Developer-friendly name
  scopes: APIScope[];
  
  // Status
  status: APIKeyStatus;
  
  // Security
  lastUsedAt?: Date;
  lastUsedFrom?: string;          // IP address (hashed)
  
  // Limits (override org defaults)
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
  
  // Source tracking
  source: 'localhost' | 'production';
}

// ============================================================================
// API INVITATIONS
// ============================================================================

export type InvitationStatus = 'active' | 'expired' | 'exhausted' | 'revoked';

export interface APIInvitation {
  // Identity
  id: string;
  invitationCode: string;         // FLOW-{AUDIENCE}-{YYYYMM}-{RANDOM}
  
  // SuperAdmin control
  createdBy: string;
  createdByEmail: string;
  
  // Targeting
  targetAudience: string;         // "Enterprise Clients", "Beta Testers"
  description: string;
  allowedDomains?: string[];      // Restrict to specific domains
  
  // Limits
  maxRedemptions: number;
  currentRedemptions: number;
  
  // Configuration
  defaultTier: APIOrganizationTier;
  trialDuration?: number;         // Days if tier = 'trial'
  
  // Status
  status: InvitationStatus;
  
  // Redemptions
  redeemedBy: Array<{
    userId: string;
    userEmail: string;
    organizationId: string;
    redeemedAt: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}

// ============================================================================
// API USAGE LOGS
// ============================================================================

export interface APIUsageLog {
  // Identity
  id: string;
  
  // Request info
  organizationId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  
  // Details
  fileType?: string;
  fileSize?: number;              // bytes
  model?: string;
  extractionMethod?: string;
  
  // Response
  statusCode: number;
  success: boolean;
  
  // Resources
  tokensUsed?: number;
  costUSD?: number;
  durationMs: number;
  
  // Security
  ipAddress: string;              // Hashed
  userAgent: string;
  
  // Error tracking
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamp
  timestamp: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}

// ============================================================================
// REQUIREMENT WORKFLOWS
// ============================================================================

export type RequirementWorkflowStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'needs_help';

export type HelpRequestType = 'admin' | 'ally' | 'stella';

export interface RequirementIteration {
  version: number;                // 1-10
  aiSuggestions: string;          // AI-generated improvements
  userFeedback: string;           // Developer's response
  approved: boolean;
  timestamp: Date;
}

export interface HelpRequest {
  type: HelpRequestType;
  message: string;
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface StagingIssue {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  fixedInStaging: boolean;
  stagingTestUrl?: string;
  testedByDeveloper: boolean;
  developerApproval?: boolean;
  deployedToProduction: boolean;
  deployedAt?: Date;
}

export interface APIRequirementWorkflow {
  // Identity
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  
  // Document
  originalDocumentId: string;
  originalDocumentName: string;
  currentVersion: number;         // 1-10
  
  // AI Enhancement
  enhancementPrompt: string;
  enhancedRequirements?: string;
  
  // Iterations
  iterations: RequirementIteration[];
  maxIterations: number;          // Default: 10
  
  // Status
  status: RequirementWorkflowStatus;
  
  // Help requests
  helpRequests?: HelpRequest[];
  
  // Staging feedback
  stagingIssues?: StagingIssue[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface VisionAPIResponse {
  success: boolean;
  documentId?: string;
  jobId?: string;
  extractedText?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    pageCount?: number;
    model: string;
    extractionMethod: string;
    tokensUsed: number;
    costUSD: number;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;              // 0-100
  result?: VisionAPIResponse;
  estimatedCompletion?: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// DEVELOPER PORTAL
// ============================================================================

export interface DeveloperMetrics {
  // Usage
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  
  // Documents
  documentsProcessed: number;
  totalPagesExtracted: number;
  
  // Costs
  totalCost: number;
  costByModel: {
    flash: number;
    pro: number;
  };
  
  // Performance
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Errors
  errorRate: number;
  topErrors: Array<{
    code: string;
    count: number;
    message: string;
  }>;
}

export interface APIPlatformMetrics {
  // Organizations
  totalOrganizations: number;
  activeOrganizations: number;
  organizationsByTier: Record<APIOrganizationTier, number>;
  
  // Invitations
  totalInvitationsCreated: number;
  redemptionRate: number;
  
  // Usage
  totalAPIRequests: number;
  requestsLast30Days: number;
  totalDocumentsProcessed: number;
  
  // Revenue (future)
  totalRevenue: number;
  revenueByTier: Record<APIOrganizationTier, number>;
  
  // Health
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

// ============================================================================
// QUOTA DEFINITIONS
// ============================================================================

export interface TierQuotas {
  monthlyRequests: number;
  dailyRequests: number;
  concurrentRequests: number;
  maxFileSize: number;            // MB
  durationDays?: number;          // For trial tier
}

export const TIER_QUOTAS: Record<APIOrganizationTier, TierQuotas> = {
  trial: {
    monthlyRequests: 100,
    dailyRequests: 10,
    concurrentRequests: 1,
    maxFileSize: 20,
    durationDays: 14,
  },
  starter: {
    monthlyRequests: 1000,
    dailyRequests: 100,
    concurrentRequests: 3,
    maxFileSize: 100,
  },
  pro: {
    monthlyRequests: 10000,
    dailyRequests: 1000,
    concurrentRequests: 10,
    maxFileSize: 500,
  },
  enterprise: {
    monthlyRequests: 100000,
    dailyRequests: 10000,
    concurrentRequests: 50,
    maxFileSize: 2000,
  },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface APIValidationResult {
  valid: boolean;
  organization?: APIOrganization;
  scopes?: APIScope[];
  error?: {
    code: string;
    message: string;
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  quotas?: {
    limit: number;
    used: number;
    remaining: number;
    resetsAt: string;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate if email is a business domain (not consumer email)
 */
export function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1];
  
  const consumerDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'live.com',
    'aol.com',
  ];
  
  return !consumerDomains.includes(domain?.toLowerCase());
}

/**
 * Generate invitation code
 */
export function generateInvitationCode(audience: string): string {
  const date = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const audienceCode = audience.toUpperCase().replace(/\s+/g, '-').slice(0, 10);
  
  return `FLOW-${audienceCode}-${date}-${random}`;
}

/**
 * Generate API key prefix for display
 */
export function getAPIKeyPrefix(key: string): string {
  return key.substring(0, 8);
}

/**
 * Generate secure API key
 */
export function generateAPIKey(environment: 'localhost' | 'production'): string {
  const prefix = environment === 'production' ? 'fv_live' : 'fv_test';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${prefix}_${random}`;
}

