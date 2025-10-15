/**
 * Provider Types
 * 
 * Defines types for AI provider models, pricing, and cost tracking.
 */

export type ProviderName = 'google-gemini';

export type ModelType = 
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-preview'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-lite-preview'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-embedding-001';

export type PricingTier = 'free' | 'paid';

export interface ModelPricing {
  model: ModelType;
  displayName: string;
  description: string;
  category: 'text' | 'embedding' | 'multimodal';
  
  // Pricing per 1M tokens (USD)
  free: {
    inputPrice: number;
    outputPrice: number;
    contextCachingPrice?: number;
    available: boolean;
  };
  
  paid: {
    inputPrice: number | { base: number; extended?: number; threshold?: number };
    outputPrice: number | { base: number; extended?: number; threshold?: number };
    contextCachingPrice?: number;
    contextCachingStoragePrice?: number; // per hour
    groundingPrice?: number; // per 1000 requests
  };
  
  // Capabilities
  capabilities: {
    maxTokens: number;
    contextWindow: number;
    supportsContextCaching: boolean;
    supportsGrounding: boolean;
    supportsBatch: boolean;
    supportsThinking: boolean;
  };
  
  // Additional info
  usedForTraining: boolean;
  isPreview: boolean;
  lastUpdated: Date;
}

export interface Provider {
  id: string;
  name: ProviderName;
  displayName: string;
  description: string;
  website: string;
  
  models: ModelPricing[];
  
  // Sync tracking
  lastSyncedAt: Date;
  syncedBy?: string; // userId who triggered sync
  source: 'manual' | 'automatic';
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  contextCachingTokens?: number;
  thinkingTokens?: number;
}

export interface CostCalculation {
  model: ModelType;
  tier: PricingTier;
  usage: TokenUsage;
  
  costs: {
    input: number;
    output: number;
    contextCaching?: number;
    thinking?: number;
    total: number;
  };
  
  calculatedAt: Date;
}

export interface AgentCostSummary {
  agentId: string;
  agentName: string;
  model: ModelType;
  
  totalUsage: TokenUsage;
  totalCost: CostCalculation['costs'];
  
  breakdown: {
    date: string;
    usage: TokenUsage;
    cost: number;
  }[];
  
  period: {
    start: Date;
    end: Date;
  };
}

