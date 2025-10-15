/**
 * Gemini API Pricing Calculations
 * Based on official pricing: https://ai.google.dev/gemini-api/docs/pricing
 * Last Updated: 2025-10-15 (from 2025-10-08 official page)
 */

interface PricingTier {
  small: number;
  large: number;
}

interface ProPricing {
  input: PricingTier;
  output: PricingTier;
}

interface FlashPricing {
  input: number;
  output: number;
}

export const GEMINI_PRICING: {
  'gemini-2.5-pro': ProPricing;
  'gemini-2.5-flash': FlashPricing;
} = {
  'gemini-2.5-pro': {
    input: {
      small: 1.25,  // Per 1M tokens, prompts ≤200k tokens
      large: 2.50   // Per 1M tokens, prompts >200k tokens
    },
    output: {
      small: 10.00, // Per 1M tokens, prompts ≤200k tokens
      large: 15.00  // Per 1M tokens, prompts >200k tokens
    }
  },
  'gemini-2.5-flash': {
    input: 0.30,    // Per 1M tokens (text/image/video)
    output: 2.50    // Per 1M tokens
  }
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;   // USD
  outputCost: number;  // USD
  totalCost: number;   // USD
  model: string;
  timestamp: Date;
}

/**
 * Estimate token count from text
 * Rough estimate: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for Gemini API usage
 */
export function calculateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash'
): CostBreakdown {
  let inputCost: number;
  let outputCost: number;
  
  if (model === 'gemini-2.5-pro') {
    // Pro has tiered pricing based on prompt size
    const proPricing = GEMINI_PRICING['gemini-2.5-pro'];
    const inputPrice = inputTokens <= 200_000 
      ? proPricing.input.small 
      : proPricing.input.large;
    const outputPrice = inputTokens <= 200_000 
      ? proPricing.output.small 
      : proPricing.output.large;
    
    inputCost = (inputTokens / 1_000_000) * inputPrice;
    outputCost = (outputTokens / 1_000_000) * outputPrice;
  } else {
    // Flash has flat pricing
    const flashPricing = GEMINI_PRICING['gemini-2.5-flash'];
    inputCost = (inputTokens / 1_000_000) * flashPricing.input;
    outputCost = (outputTokens / 1_000_000) * flashPricing.output;
  }
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model,
    timestamp: new Date()
  };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

/**
 * Calculate savings percentage between models
 */
export function calculateSavings(
  proCost: number,
  flashCost: number
): { savings: number; percentage: number } {
  const savings = proCost - flashCost;
  const percentage = (savings / proCost) * 100;
  
  return { savings, percentage };
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro-latest': 'Gemini 2.5 Pro',
    'gemini-2.5-flash-latest': 'Gemini 2.5 Flash',
  };
  return names[model] || model;
}

/**
 * Estimate cost for a document before extraction
 */
export function estimateExtractionCost(
  fileSizeBytes: number,
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash'
): { estimatedCost: number; estimatedTokens: number } {
  // Rough estimates based on file size
  // PDF: ~500 chars/page, ~125 tokens/page
  // Assume 1MB ≈ 50 pages ≈ 6,250 tokens
  const estimatedInputTokens = Math.ceil((fileSizeBytes / 1024 / 1024) * 6250);
  
  // Output typically 60-80% of input for extraction
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.7);
  
  const costs = calculateGeminiCost(estimatedInputTokens, estimatedOutputTokens, model);
  
  return {
    estimatedCost: costs.totalCost,
    estimatedTokens: estimatedInputTokens + estimatedOutputTokens
  };
}

