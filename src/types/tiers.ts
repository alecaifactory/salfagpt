/**
 * Tier System - Type Definitions
 * 
 * Defines the complete tier structure for Flow Platform:
 * - Spark (Free trial)
 * - Solo (Individual)
 * - Team (2-7 users)
 * - Enterprise (Unlimited)
 */

// ============================================
// TIER TYPES
// ============================================

export type TierType = 'spark' | 'solo' | 'team' | 'enterprise';

export type SubscriptionStatus = 
  | 'trial'           // Free trial active
  | 'active'          // Paid subscription active
  | 'past_due'        // Payment failed
  | 'canceled'        // User canceled
  | 'expired'         // Trial or subscription ended
  | 'archived';       // Data archived, read-only

export type BillingCycle = 'monthly' | 'annual';

export type InfrastructureType = 
  | 'saas-shared'     // Multi-tenant, our GCP
  | 'saas-dedicated'  // Single-tenant, our GCP
  | 'self-hosted'     // Customer's GCP
  | 'hybrid';         // Mix of above

// ============================================
// TIER CONFIGURATION
// ============================================

export interface TierLimits {
  // Users
  maxUsers: number;              // -1 = unlimited
  
  // Agents
  maxAgents: number;             // -1 = unlimited
  maxContextSourcesPerAgent: number;
  maxFileSizeMB: number;
  totalStorageGB: number;
  
  // AI Usage
  monthlyTokenQuota: number;     // -1 = unlimited
  allowedModels: ('flash' | 'pro' | 'custom')[];
  priorityQueue: boolean;
  contextCaching: boolean;
  fineTuning: boolean;
  
  // Features
  sharedAgents: boolean;
  sharedContext: boolean;
  apiAccess: 'none' | 'read' | 'full';
  webhooks: number;              // Max webhooks, -1 = unlimited
  
  // Ally capabilities
  allyVersion: 'lite' | 'personal' | 'team' | 'enterprise';
  calendarIntegration: boolean;
  financialTracking: boolean;
  wellnessMonitoring: boolean;
  learningJournal: boolean;
  teamCoordination: boolean;
  executiveInsights: boolean;
  
  // Compliance
  soc2Type2: boolean;
  iso27001: boolean;
  hipaa: boolean;
  customCompliance: boolean;
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  sla: number | null;            // e.g., 99.9 for 99.9% uptime
}

export interface TierPricing {
  // Base pricing
  monthlyBase: number;           // Base monthly price (in cents)
  annualBase: number;            // Base annual price (in cents)
  annualDiscount: number;        // Discount % for annual (e.g., 17)
  
  // Per-user pricing (for Team/Enterprise)
  perUserMonthly?: number;       // Additional user cost/month (cents)
  perUserAnnual?: number;        // Additional user cost/year (cents)
  
  // Consumption pricing (Enterprise)
  tokenPricing?: {
    flash: number;               // $ per 1M tokens
    pro: number;                 // $ per 1M tokens
    custom: number;              // $ per 1M tokens
  };
  
  // Infrastructure (Enterprise self-hosted)
  infrastructureFee?: number;    // % markup on GCP costs
}

export interface TierConfig {
  id: TierType;
  name: string;
  description: string;
  tagline: string;
  
  limits: TierLimits;
  pricing: TierPricing;
  
  // Marketing
  targetAudience: string;
  useCases: string[];
  highlights: string[];          // Top 3-5 features
  
  // Trial
  trialDays?: number;            // Spark only
  
  // Metadata
  displayOrder: number;          // For UI ordering
  featured: boolean;             // Highlight in tier selection
  available: boolean;            // Can users select this tier?
}

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription {
  // Identity
  id: string;
  userId: string;
  organizationId?: string;       // For team/enterprise
  
  // Tier
  tier: TierType;
  status: SubscriptionStatus;
  
  // Billing
  billingCycle?: BillingCycle;   // Null for trial
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Pricing (locked in at signup)
  lockedPricing: {
    monthlyBase: number;
    perUserMonthly?: number;
    grandfathered: boolean;      // True if old pricing
  };
  
  // Usage
  currentPeriodUsage: {
    tokens: number;
    apiCalls: number;
    storage: number;             // In bytes
  };
  
  // Payment
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: string;        // Last 4 digits
  
  // Trial (if applicable)
  trialStart?: Date;
  trialEnd?: Date;
  trialExtended?: boolean;
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
  expiresAt?: Date;              // For trials or canceled subs
  
  // Features (tier snapshot at creation)
  features: TierLimits;
  
  // Metadata
  source: 'localhost' | 'production';
}

// ============================================
// FEATURE ACCESS
// ============================================

export interface FeatureAccess {
  featureId: string;
  userId: string;
  tier: TierType;
  
  // Access
  enabled: boolean;
  reason: string;                // Why enabled/disabled
  
  // A/B testing
  variant?: string;              // For A/B tests
  experimentId?: string;
  
  // Usage
  firstUsed?: Date;
  lastUsed?: Date;
  usageCount: number;
  
  // Timestamps
  grantedAt: Date;
  expiresAt?: Date;
}

// ============================================
// TIER USAGE TRACKING
// ============================================

export interface TierUsage {
  // Identity
  userId: string;
  tier: TierType;
  period: Date;                  // Month start date
  
  // Limits
  quotas: TierLimits;
  
  // Usage
  used: {
    tokens: number;
    agents: number;
    contextSources: number;
    storageBytes: number;
    apiCalls: number;
    webhookCalls: number;
  };
  
  // Overage (if any)
  overage: {
    tokens?: number;
    storage?: number;
    apiCalls?: number;
  };
  
  // Cost
  baseCost: number;              // Subscription cost
  overageCost: number;           // Additional charges
  totalCost: number;
  
  // ROI/Token
  businessValue?: number;        // Self-reported or inferred
  roiPerToken?: number;          // businessValue / tokens
  
  // Timestamps
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

// ============================================
// UPGRADE/DOWNGRADE
// ============================================

export interface TierChange {
  id: string;
  userId: string;
  
  fromTier: TierType;
  toTier: TierType;
  
  reason: string;                // 'user_request', 'trial_end', 'payment_failed', etc.
  
  effectiveDate: Date;
  
  // Pricing impact
  oldPrice: number;
  newPrice: number;
  pricingProtection: boolean;    // Grandfather pricing?
  
  // Data impact
  dataRetained: boolean;
  dataArchived: boolean;
  dataDeleted: boolean;
  
  // User communication
  emailSent: boolean;
  emailSentAt?: Date;
  
  // Status
  status: 'pending' | 'processing' | 'complete' | 'failed';
  completedAt?: Date;
  error?: string;
  
  // Timestamps
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;           // For downgrades requiring approval
}

// ============================================
// HELPER TYPES
// ============================================

export interface TierComparison {
  current: TierType;
  suggested: TierType;
  reason: string;
  savings?: number;              // If downgrade
  additionalValue?: string[];    // If upgrade
  impact: {
    features: {
      gained: string[];
      lost: string[];
    };
    limits: {
      increased: Record<string, number>;
      decreased: Record<string, number>;
    };
  };
}

export interface TierRecommendation {
  userId: string;
  currentTier: TierType;
  recommendedTier: TierType;
  confidence: number;            // 0-1
  reasoning: string[];
  expectedROI: number;           // Expected improvement in ROI/T
  costImpact: number;            // Monthly cost change
}

// ============================================
// FEATURE FLAGS
// ============================================

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  
  // Availability
  tiers: TierType[];
  
  // Rollout strategy
  rollout: 'stable' | 'beta' | 'alpha' | 'experimental' | 'progressive' | 'abtest';
  
  // Progressive rollout
  percentage?: number;           // If progressive
  increaseDaily?: number;        // Daily increase %
  
  // A/B testing
  variants?: {
    [variantId: string]: number; // Allocation percentage
  };
  
  // Overrides (for testing)
  overrides?: {
    userIds?: string[];          // Specific users
    organizationIds?: string[];  // Specific orgs
    domains?: string[];          // Specific domains
  };
  
  // Metadata
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: string;                 // Who manages this flag
}

// ============================================
// EXPORT
// ============================================

export type {
  TierType,
  SubscriptionStatus,
  BillingCycle,
  InfrastructureType,
  TierLimits,
  TierPricing,
  TierConfig,
  Subscription,
  FeatureAccess,
  TierUsage,
  TierChange,
  TierComparison,
  TierRecommendation,
  FeatureFlag,
};

