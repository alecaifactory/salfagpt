/**
 * Tier Configurations
 * 
 * Complete definition of all tiers: Spark, Solo, Team, Enterprise
 */

import type { TierConfig } from '../types/tiers';

// ============================================
// TIER 1: SPARK (Free Trial)
// ============================================

export const SPARK_TIER: TierConfig = {
  id: 'spark',
  name: 'Spark',
  description: 'Start your AI journey with a full-featured 30-day trial',
  tagline: 'Everything you need to get started—free for 30 days',
  
  limits: {
    // Users
    maxUsers: 1,
    
    // Agents
    maxAgents: 5,
    maxContextSourcesPerAgent: 10,
    maxFileSizeMB: 50,
    totalStorageGB: 1,
    
    // AI Usage
    monthlyTokenQuota: 1_000_000,  // 1M tokens (~750 conversations)
    allowedModels: ['flash'],
    priorityQueue: false,
    contextCaching: false,
    fineTuning: false,
    
    // Features
    sharedAgents: false,
    sharedContext: false,
    apiAccess: 'none',
    webhooks: 0,
    
    // Ally
    allyVersion: 'lite',
    calendarIntegration: false,
    financialTracking: false,
    wellnessMonitoring: false,
    learningJournal: false,
    teamCoordination: false,
    executiveInsights: false,
    
    // Compliance
    soc2Type2: false,
    iso27001: false,
    hipaa: false,
    customCompliance: false,
    
    // Support
    supportLevel: 'community',
    sla: null,
  },
  
  pricing: {
    monthlyBase: 0,              // Free
    annualBase: 0,               // Free
    annualDiscount: 0,
  },
  
  targetAudience: 'Individuals exploring AI-first workflows',
  useCases: [
    'Personal productivity',
    'Learning AI capabilities',
    'Testing before committing',
    'Small projects',
  ],
  highlights: [
    '30 days full access',
    'Gemini 2.5 Flash AI',
    'Up to 5 agents',
    '1M tokens included',
    'Full encryption',
    'GDPR compliant',
  ],
  
  trialDays: 30,
  displayOrder: 1,
  featured: true,
  available: true,
};

// ============================================
// TIER 2: SOLO (Individual Professional)
// ============================================

export const SOLO_TIER: TierConfig = {
  id: 'solo',
  name: 'Solo',
  description: 'Professional AI assistant for individuals and consultants',
  tagline: 'Your personal AI companion—powered up',
  
  limits: {
    // Users
    maxUsers: 1,
    
    // Agents
    maxAgents: 25,
    maxContextSourcesPerAgent: 50,
    maxFileSizeMB: 200,
    totalStorageGB: 10,
    
    // AI Usage
    monthlyTokenQuota: 5_000_000,  // 5M tokens
    allowedModels: ['flash', 'pro'],
    priorityQueue: false,
    contextCaching: true,          // 50% cost reduction
    fineTuning: false,
    
    // Features
    sharedAgents: false,
    sharedContext: false,
    apiAccess: 'read',             // Read-only API
    webhooks: 5,
    
    // Ally Personal
    allyVersion: 'personal',
    calendarIntegration: true,     // Google Calendar
    financialTracking: true,       // Expense tracking
    wellnessMonitoring: true,      // Productivity insights
    learningJournal: true,         // Career growth tracking
    teamCoordination: false,
    executiveInsights: false,
    
    // Compliance
    soc2Type2: false,              // Docs provided
    iso27001: false,               // Docs provided
    hipaa: false,
    customCompliance: false,
    
    // Support
    supportLevel: 'email',         // 48h response
    sla: null,
  },
  
  pricing: {
    monthlyBase: 2900,             // $29.00
    annualBase: 29000,             // $290.00 (save 17%)
    annualDiscount: 17,
  },
  
  targetAudience: 'Professionals, consultants, freelancers, small business owners',
  useCases: [
    'Personal productivity optimization',
    'Client work management',
    'Research and analysis',
    'Content creation',
    'Financial planning',
  ],
  highlights: [
    'Gemini Flash + Pro models',
    '5M tokens/month',
    'Calendar integration (Ally)',
    'Financial tracking (Ally)',
    'Wellness monitoring (Ally)',
    'Learning journal (portable)',
    'Read-only API access',
    'Priority email support',
  ],
  
  displayOrder: 2,
  featured: true,
  available: true,
};

// ============================================
// TIER 3: TEAM (Small Teams - Dunbar Optimized)
// ============================================

export const TEAM_TIER: TierConfig = {
  id: 'team',
  name: 'Team',
  description: 'Collaboration-optimized for small teams (2-7 people)',
  tagline: 'Built for teams that trust each other',
  
  limits: {
    // Users (Dunbar-optimized)
    maxUsers: 7,                   // Max 7 for optimal collaboration
    
    // Agents
    maxAgents: 100,
    maxContextSourcesPerAgent: 200,
    maxFileSizeMB: 500,
    totalStorageGB: 50,
    
    // AI Usage
    monthlyTokenQuota: 20_000_000, // 20M tokens (team pool)
    allowedModels: ['flash', 'pro', 'custom'],
    priorityQueue: true,           // Priority processing
    contextCaching: true,          // Advanced team cache
    fineTuning: true,              // Custom models available
    
    // Features
    sharedAgents: true,            // Real-time collaboration
    sharedContext: true,           // Team knowledge base
    apiAccess: 'full',             // Full REST API
    webhooks: 20,
    
    // Ally Team
    allyVersion: 'team',
    calendarIntegration: true,
    financialTracking: true,
    wellnessMonitoring: true,
    learningJournal: true,
    teamCoordination: true,        // Team-specific features
    executiveInsights: false,
    
    // Compliance
    soc2Type2: false,              // Ready (docs provided)
    iso27001: false,               // Ready (docs provided)
    hipaa: false,
    customCompliance: false,
    
    // Support
    supportLevel: 'priority',      // 24h response
    sla: 99.0,                     // 99% uptime
  },
  
  pricing: {
    monthlyBase: 9900,             // $99.00 base
    annualBase: 99000,             // $990.00 (save 17%)
    annualDiscount: 17,
    perUserMonthly: 1900,          // $19/user/month (for users 2-7)
    perUserAnnual: 19000,          // $190/user/year
  },
  
  targetAudience: 'Startups, small teams, departments (2-7 people)',
  useCases: [
    'Team collaboration',
    'Shared knowledge management',
    'Customer service teams',
    'Product development',
    'Consulting teams',
  ],
  highlights: [
    'Up to 7 users (Dunbar-optimized)',
    'Shared agents & context',
    'Ally Team (coordination AI)',
    'Full REST API + SDK',
    '20M tokens/month (shared)',
    'Fine-tuning available',
    'Priority support (24h)',
    '99% uptime SLA',
  ],
  
  displayOrder: 3,
  featured: true,
  available: true,
};

// ============================================
// TIER 4: ENTERPRISE (Unlimited Scale)
// ============================================

export const ENTERPRISE_TIER: TierConfig = {
  id: 'enterprise',
  name: 'Enterprise',
  description: 'Unlimited scale with custom infrastructure and compliance',
  tagline: 'Everything included—unlimited potential',
  
  limits: {
    // Users
    maxUsers: -1,                  // Unlimited
    
    // Agents
    maxAgents: -1,
    maxContextSourcesPerAgent: -1,
    maxFileSizeMB: -1,             // Unlimited
    totalStorageGB: -1,
    
    // AI Usage
    monthlyTokenQuota: -1,         // Unlimited (pay-as-you-go)
    allowedModels: ['flash', 'pro', 'custom'],
    priorityQueue: true,
    contextCaching: true,
    fineTuning: true,
    
    // Features
    sharedAgents: true,
    sharedContext: true,
    apiAccess: 'full',
    webhooks: -1,                  // Unlimited
    
    // Ally Enterprise
    allyVersion: 'enterprise',
    calendarIntegration: true,
    financialTracking: true,
    wellnessMonitoring: true,
    learningJournal: true,
    teamCoordination: true,
    executiveInsights: true,       // C-suite focused
    
    // Compliance
    soc2Type2: true,               // Certified
    iso27001: true,                // Certified
    hipaa: true,                   // BAA available
    customCompliance: true,        // Custom frameworks
    
    // Support
    supportLevel: 'dedicated',     // 24/7 phone + account manager
    sla: 99.9,                     // 99.9% uptime
  },
  
  pricing: {
    monthlyBase: 250000,           // $2,500/month minimum
    annualBase: 2500000,           // $25,000/year
    annualDiscount: 17,
    
    // Consumption pricing
    tokenPricing: {
      flash: 0.08,                 // $0.08 per 1M tokens
      pro: 1.30,                   // $1.30 per 1M tokens
      custom: 2.50,                // $2.50 per 1M tokens (fine-tuned)
    },
    
    infrastructureFee: 20,         // 20% markup on GCP costs (for self-hosted support)
  },
  
  targetAudience: 'Large organizations, enterprises, government',
  useCases: [
    'Enterprise-wide AI deployment',
    'Multi-department collaboration',
    'Regulatory compliance (healthcare, finance)',
    'Custom AI model development',
    'Strategic business intelligence',
  ],
  highlights: [
    'Unlimited users & agents',
    'BYOK (Bring Your Own Keys)',
    'Custom infrastructure (SaaS/Dedicated/Self-hosted)',
    'SOC 2 Type 2 + ISO 27001 certified',
    'HIPAA ready (BAA available)',
    'Ally Enterprise (C-suite insights)',
    'Full API + GraphQL + SDK',
    '99.9% SLA with 24/7 support',
    'Dedicated account manager',
    'Custom compliance frameworks',
  ],
  
  displayOrder: 4,
  featured: true,
  available: true,
};

// ============================================
// TIER REGISTRY
// ============================================

export const ALL_TIERS: Record<TierType, TierConfig> = {
  spark: SPARK_TIER,
  solo: SOLO_TIER,
  team: TEAM_TIER,
  enterprise: ENTERPRISE_TIER,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier configuration
 */
export function getTierConfig(tier: TierType): TierConfig {
  return ALL_TIERS[tier];
}

/**
 * Get all available tiers
 */
export function getAvailableTiers(): TierConfig[] {
  return Object.values(ALL_TIERS)
    .filter(tier => tier.available)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Check if feature is available for tier
 */
export function hasFeature(
  tier: TierType,
  feature: keyof TierConfig['limits']
): boolean {
  const config = getTierConfig(tier);
  const value = config.limits[feature];
  
  // Boolean features
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Numeric features (-1 = unlimited)
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // String/array features
  return !!value;
}

/**
 * Check if user is within tier limits
 */
export function isWithinLimits(
  tier: TierType,
  usage: {
    agents?: number;
    contextSources?: number;
    storageGB?: number;
    monthlyTokens?: number;
  }
): { within: boolean; exceeded: string[] } {
  const config = getTierConfig(tier);
  const exceeded: string[] = [];
  
  // Check agents
  if (usage.agents !== undefined && config.limits.maxAgents !== -1) {
    if (usage.agents > config.limits.maxAgents) {
      exceeded.push(`agents (${usage.agents}/${config.limits.maxAgents})`);
    }
  }
  
  // Check storage
  if (usage.storageGB !== undefined && config.limits.totalStorageGB !== -1) {
    if (usage.storageGB > config.limits.totalStorageGB) {
      exceeded.push(`storage (${usage.storageGB}GB/${config.limits.totalStorageGB}GB)`);
    }
  }
  
  // Check tokens
  if (usage.monthlyTokens !== undefined && config.limits.monthlyTokenQuota !== -1) {
    if (usage.monthlyTokens > config.limits.monthlyTokenQuota) {
      exceeded.push(`tokens (${usage.monthlyTokens}/${config.limits.monthlyTokenQuota})`);
    }
  }
  
  return {
    within: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Calculate monthly price for tier
 */
export function calculateMonthlyPrice(
  tier: TierType,
  users: number = 1,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): number {
  const config = getTierConfig(tier);
  
  if (billingCycle === 'annual') {
    // Annual pricing (with discount)
    const annualTotal = config.pricing.annualBase;
    
    // Add per-user costs for Team/Enterprise
    if (config.pricing.perUserAnnual && users > 1) {
      const additionalUsers = users - 1;
      const additionalCost = additionalUsers * config.pricing.perUserAnnual;
      return (annualTotal + additionalCost) / 12; // Convert to monthly equivalent
    }
    
    return annualTotal / 12;
  }
  
  // Monthly pricing
  let total = config.pricing.monthlyBase;
  
  // Add per-user costs for Team/Enterprise
  if (config.pricing.perUserMonthly && users > 1) {
    const additionalUsers = users - 1;
    total += additionalUsers * config.pricing.perUserMonthly;
  }
  
  return total;
}

/**
 * Get recommended tier based on usage
 */
export function getRecommendedTier(usage: {
  users: number;
  agents: number;
  monthlyTokens: number;
  needsAPI: boolean;
  needsCollaboration: boolean;
  needsCompliance: boolean;
}): TierType {
  // Enterprise indicators
  if (
    usage.users > 7 ||
    usage.needsCompliance ||
    usage.monthlyTokens > 20_000_000
  ) {
    return 'enterprise';
  }
  
  // Team indicators
  if (
    usage.users >= 2 ||
    usage.needsCollaboration ||
    usage.needsAPI
  ) {
    return 'team';
  }
  
  // Solo indicators
  if (
    usage.agents > 5 ||
    usage.monthlyTokens > 1_000_000
  ) {
    return 'solo';
  }
  
  // Default: Spark (trial)
  return 'spark';
}

/**
 * Get upgrade path from current tier
 */
export function getUpgradePath(currentTier: TierType): TierType | null {
  const order: TierType[] = ['spark', 'solo', 'team', 'enterprise'];
  const currentIndex = order.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return null; // Already at highest tier
  }
  
  return order[currentIndex + 1];
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate annual savings
 */
export function calculateAnnualSavings(tier: TierType, users: number = 1): number {
  const monthlyPrice = calculateMonthlyPrice(tier, users, 'monthly');
  const annualPrice = calculateMonthlyPrice(tier, users, 'annual');
  
  const monthlyTotal = monthlyPrice * 12;
  const annualTotal = annualPrice * 12;
  
  return monthlyTotal - annualTotal;
}

// ============================================
// TIER COMPARISON HELPERS
// ============================================

/**
 * Compare two tiers feature-by-feature
 */
export function compareTiers(
  tierA: TierType,
  tierB: TierType
): {
  differences: Array<{
    feature: string;
    tierA: any;
    tierB: any;
    better: TierType;
  }>;
  recommendation: TierType;
} {
  const configA = getTierConfig(tierA);
  const configB = getTierConfig(tierB);
  
  const differences = [];
  const features = Object.keys(configA.limits) as Array<keyof TierConfig['limits']>;
  
  for (const feature of features) {
    const valueA = configA.limits[feature];
    const valueB = configB.limits[feature];
    
    if (valueA !== valueB) {
      let better: TierType;
      
      // For boolean: true is better
      if (typeof valueA === 'boolean') {
        better = valueA ? tierA : tierB;
      }
      // For numbers: higher is better (-1 = unlimited)
      else if (typeof valueA === 'number') {
        if (valueA === -1) better = tierA;
        else if (valueB === -1) better = tierB;
        else better = valueA > (valueB as number) ? tierA : tierB;
      }
      // For arrays: more options is better
      else if (Array.isArray(valueA)) {
        better = valueA.length > (valueB as any[]).length ? tierA : tierB;
      }
      // For strings: can't determine objectively
      else {
        better = tierA; // Default to first
      }
      
      differences.push({
        feature: feature as string,
        tierA: valueA,
        tierB: valueB,
        better,
      });
    }
  }
  
  // Recommendation based on display order (higher = better)
  const recommendation = configA.displayOrder > configB.displayOrder ? tierA : tierB;
  
  return { differences, recommendation };
}

// ============================================
// EXPORT
// ============================================

export {
  SPARK_TIER,
  SOLO_TIER,
  TEAM_TIER,
  ENTERPRISE_TIER,
  ALL_TIERS,
};

