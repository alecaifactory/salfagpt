/**
 * Provider Configuration
 * 
 * Default pricing and capabilities for all supported AI providers.
 * Based on official Gemini API pricing as of 2025-10-15.
 * 
 * Source: https://ai.google.dev/pricing
 */

import type { ModelPricing, Provider, ModelType } from '../types/providers';

export const GEMINI_MODELS: ModelPricing[] = [
  {
    model: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'State-of-the-art multipurpose model, excels at coding and complex reasoning',
    category: 'text',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: { base: 1.25, extended: 2.50, threshold: 200000 },
      outputPrice: { base: 10.00, extended: 15.00, threshold: 200000 },
      contextCachingPrice: 0.125,
      contextCachingStoragePrice: 4.50,
      groundingPrice: 35, // per 1000 requests
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 2000000,
      supportsContextCaching: true,
      supportsGrounding: true,
      supportsBatch: true,
      supportsThinking: false,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Hybrid reasoning model with 1M token context and thinking budgets',
    category: 'multimodal',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.30, // text/image/video, audio is $1.00
      outputPrice: 2.50,
      contextCachingPrice: 0.03,
      contextCachingStoragePrice: 1.00,
      groundingPrice: 35,
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 1000000,
      supportsContextCaching: true,
      supportsGrounding: true,
      supportsBatch: true,
      supportsThinking: true,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-2.5-flash-preview',
    displayName: 'Gemini 2.5 Flash Preview',
    description: 'Latest Flash model optimized for large scale processing and agentic tasks',
    category: 'multimodal',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.30,
      outputPrice: 2.50,
      contextCachingPrice: 0.0375,
      contextCachingStoragePrice: 1.00,
      groundingPrice: 35,
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 1000000,
      supportsContextCaching: true,
      supportsGrounding: true,
      supportsBatch: true,
      supportsThinking: true,
    },
    usedForTraining: false,
    isPreview: true,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    description: 'Smallest and most cost effective model for at scale usage',
    category: 'text',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.10,
      outputPrice: 0.40,
      contextCachingPrice: 0.025,
      contextCachingStoragePrice: 1.00,
      groundingPrice: 35,
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 1000000,
      supportsContextCaching: true,
      supportsGrounding: true,
      supportsBatch: true,
      supportsThinking: true,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Balanced multimodal model with great performance, built for Agents',
    category: 'multimodal',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.10,
      outputPrice: 0.40,
      contextCachingPrice: 0.025,
      contextCachingStoragePrice: 1.00,
      groundingPrice: 35,
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 1000000,
      supportsContextCaching: true,
      supportsGrounding: true,
      supportsBatch: true,
      supportsThinking: false,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-2.0-flash-lite',
    displayName: 'Gemini 2.0 Flash Lite',
    description: 'Smallest and most cost effective model',
    category: 'text',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.075,
      outputPrice: 0.30,
    },
    capabilities: {
      maxTokens: 8192,
      contextWindow: 1000000,
      supportsContextCaching: false,
      supportsGrounding: false,
      supportsBatch: true,
      supportsThinking: false,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
  {
    model: 'gemini-embedding-001',
    displayName: 'Gemini Embedding',
    description: 'Embeddings model with high rate limits',
    category: 'embedding',
    free: {
      inputPrice: 0,
      outputPrice: 0,
      available: true,
    },
    paid: {
      inputPrice: 0.15,
      outputPrice: 0,
    },
    capabilities: {
      maxTokens: 2048,
      contextWindow: 2048,
      supportsContextCaching: false,
      supportsGrounding: false,
      supportsBatch: true,
      supportsThinking: false,
    },
    usedForTraining: false,
    isPreview: false,
    lastUpdated: new Date('2025-10-15'),
  },
];

export const DEFAULT_PROVIDER: Provider = {
  id: 'google-gemini',
  name: 'google-gemini',
  displayName: 'Google Gemini',
  description: 'Google\'s most capable AI models for text, code, and multimodal tasks',
  website: 'https://ai.google.dev',
  models: GEMINI_MODELS,
  lastSyncedAt: new Date('2025-10-15'),
  source: 'manual',
  isActive: true,
  createdAt: new Date('2025-10-15'),
  updatedAt: new Date('2025-10-15'),
};

/**
 * Calculate cost for a given usage and model
 */
export function calculateCost(
  model: ModelType,
  tier: 'free' | 'paid',
  inputTokens: number,
  outputTokens: number,
  contextCachingTokens: number = 0
): number {
  const modelPricing = GEMINI_MODELS.find(m => m.model === model);
  if (!modelPricing) {
    console.warn(`Unknown model: ${model}`);
    return 0;
  }

  if (tier === 'free') {
    return 0; // Free tier is free
  }

  const pricing = modelPricing.paid;
  let inputCost = 0;
  let outputCost = 0;
  let cachingCost = 0;

  // Calculate input cost
  if (typeof pricing.inputPrice === 'number') {
    inputCost = (inputTokens / 1000000) * pricing.inputPrice;
  } else {
    // Tiered pricing
    const threshold = pricing.inputPrice.threshold || 200000;
    const tokensAtBase = Math.min(inputTokens, threshold);
    const tokensAtExtended = Math.max(0, inputTokens - threshold);
    
    inputCost = (tokensAtBase / 1000000) * pricing.inputPrice.base;
    if (tokensAtExtended > 0 && pricing.inputPrice.extended) {
      inputCost += (tokensAtExtended / 1000000) * pricing.inputPrice.extended;
    }
  }

  // Calculate output cost
  if (typeof pricing.outputPrice === 'number') {
    outputCost = (outputTokens / 1000000) * pricing.outputPrice;
  } else {
    // Tiered pricing
    const threshold = pricing.outputPrice.threshold || 200000;
    const tokensAtBase = Math.min(outputTokens, threshold);
    const tokensAtExtended = Math.max(0, outputTokens - threshold);
    
    outputCost = (tokensAtBase / 1000000) * pricing.outputPrice.base;
    if (tokensAtExtended > 0 && pricing.outputPrice.extended) {
      outputCost += (tokensAtExtended / 1000000) * pricing.outputPrice.extended;
    }
  }

  // Calculate context caching cost
  if (contextCachingTokens > 0 && pricing.contextCachingPrice) {
    cachingCost = (contextCachingTokens / 1000000) * pricing.contextCachingPrice;
  }

  return inputCost + outputCost + cachingCost;
}

/**
 * Get pricing display string
 */
export function getPricingDisplay(price: number | { base: number; extended?: number }): string {
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }
  
  if (price.extended) {
    return `$${price.base.toFixed(2)} - $${price.extended.toFixed(2)}`;
  }
  
  return `$${price.base.toFixed(2)}`;
}

/**
 * Get model color for UI
 */
export function getModelColor(model: ModelType): string {
  if (model.includes('pro')) return 'purple';
  if (model.includes('lite')) return 'cyan';
  if (model.includes('embedding')) return 'indigo';
  return 'green'; // Flash models
}

