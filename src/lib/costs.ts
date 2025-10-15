/**
 * Cost Calculation Utilities
 * 
 * Calculate costs for AI usage based on provider pricing.
 */

import type { ModelType, CostCalculation } from '../types/providers';
import { GEMINI_MODELS } from '../config/providers';

/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  contextCachingTokens: number = 0,
  tier: 'free' | 'paid' = 'paid'
): CostCalculation {
  // Find model pricing
  const modelPricing = GEMINI_MODELS.find(m => 
    m.model === model || m.displayName.toLowerCase().includes(model.toLowerCase())
  );

  if (!modelPricing) {
    console.warn(`Unknown model for cost calculation: ${model}`);
    return {
      model: model as ModelType,
      tier,
      usage: {
        inputTokens,
        outputTokens,
        contextCachingTokens,
      },
      costs: {
        input: 0,
        output: 0,
        contextCaching: 0,
        total: 0,
      },
      calculatedAt: new Date(),
    };
  }

  // Free tier is always $0
  if (tier === 'free') {
    return {
      model: modelPricing.model,
      tier,
      usage: {
        inputTokens,
        outputTokens,
        contextCachingTokens,
      },
      costs: {
        input: 0,
        output: 0,
        contextCaching: 0,
        total: 0,
      },
      calculatedAt: new Date(),
    };
  }

  // Calculate paid tier costs
  const pricing = modelPricing.paid;
  let inputCost = 0;
  let outputCost = 0;
  let cachingCost = 0;

  // Input cost (handle tiered pricing)
  if (typeof pricing.inputPrice === 'number') {
    inputCost = (inputTokens / 1000000) * pricing.inputPrice;
  } else {
    const threshold = pricing.inputPrice.threshold || 200000;
    const tokensAtBase = Math.min(inputTokens, threshold);
    const tokensAtExtended = Math.max(0, inputTokens - threshold);
    
    inputCost = (tokensAtBase / 1000000) * pricing.inputPrice.base;
    if (tokensAtExtended > 0 && pricing.inputPrice.extended) {
      inputCost += (tokensAtExtended / 1000000) * pricing.inputPrice.extended;
    }
  }

  // Output cost (handle tiered pricing)
  if (typeof pricing.outputPrice === 'number') {
    outputCost = (outputTokens / 1000000) * pricing.outputPrice;
  } else {
    const threshold = pricing.outputPrice.threshold || 200000;
    const tokensAtBase = Math.min(outputTokens, threshold);
    const tokensAtExtended = Math.max(0, outputTokens - threshold);
    
    outputCost = (tokensAtBase / 1000000) * pricing.outputPrice.base;
    if (tokensAtExtended > 0 && pricing.outputPrice.extended) {
      outputCost += (tokensAtExtended / 1000000) * pricing.outputPrice.extended;
    }
  }

  // Context caching cost
  if (contextCachingTokens > 0 && pricing.contextCachingPrice) {
    cachingCost = (contextCachingTokens / 1000000) * pricing.contextCachingPrice;
  }

  const totalCost = inputCost + outputCost + cachingCost;

  return {
    model: modelPricing.model,
    tier,
    usage: {
      inputTokens,
      outputTokens,
      contextCachingTokens,
    },
    costs: {
      input: inputCost,
      output: outputCost,
      contextCaching: cachingCost,
      total: totalCost,
    },
    calculatedAt: new Date(),
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'Gratis';
  if (cost < 0.0001) return '<$0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Get savings percentage between two models
 */
export function calculateSavings(
  expensiveModel: string,
  cheapModel: string,
  inputTokens: number,
  outputTokens: number
): number {
  const expensiveCost = calculateCost(expensiveModel, inputTokens, outputTokens).costs.total;
  const cheapCost = calculateCost(cheapModel, inputTokens, outputTokens).costs.total;
  
  if (expensiveCost === 0) return 0;
  
  return ((expensiveCost - cheapCost) / expensiveCost) * 100;
}

/**
 * Estimate cost for context upload
 */
export function estimateContextUploadCost(
  model: string,
  estimatedTokens: number
): number {
  // Context uploads are input-only operations
  const calculation = calculateCost(model, estimatedTokens, 0, 0, 'paid');
  return calculation.costs.input;
}

/**
 * Get cost tier recommendation based on usage
 */
export function getCostTierRecommendation(
  monthlyInputTokens: number,
  monthlyOutputTokens: number
): 'free' | 'paid' {
  // Gemini free tier is generous, but paid tier has higher rate limits
  // Recommend paid tier if usage is high
  const totalMonthlyTokens = monthlyInputTokens + monthlyOutputTokens;
  
  // If processing > 10M tokens/month, recommend paid tier for better rate limits
  if (totalMonthlyTokens > 10000000) {
    return 'paid';
  }
  
  return 'free';
}

/**
 * Calculate cost breakdown for an agent over a period
 */
export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  model: string;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalMessages: number;
  };
  costs: {
    total: number;
    perMessage: number;
    perDay: number;
  };
  comparison: {
    withFlash: number; // Cost if using Flash
    withPro: number;   // Cost if using Pro
    savings: number;   // % saved vs more expensive model
  };
}

export function calculateAgentCost(
  agentId: string,
  agentName: string,
  model: string,
  messages: Array<{
    inputTokens: number;
    outputTokens: number;
    timestamp: Date;
  }>,
  startDate?: Date,
  endDate?: Date
): AgentCostBreakdown {
  const start = startDate || (messages.length > 0 ? messages[0].timestamp : new Date());
  const end = endDate || new Date();
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // Filter messages by date range
  const filteredMessages = messages.filter(m => 
    m.timestamp >= start && m.timestamp <= end
  );

  // Calculate totals
  const totalInputTokens = filteredMessages.reduce((sum, m) => sum + m.inputTokens, 0);
  const totalOutputTokens = filteredMessages.reduce((sum, m) => sum + m.outputTokens, 0);

  // Calculate cost
  const cost = calculateCost(model, totalInputTokens, totalOutputTokens);

  // Calculate comparison costs
  const flashCost = calculateCost('gemini-2.5-flash', totalInputTokens, totalOutputTokens);
  const proCost = calculateCost('gemini-2.5-pro', totalInputTokens, totalOutputTokens);
  
  const savings = model.includes('flash') 
    ? calculateSavings('gemini-2.5-pro', model, totalInputTokens, totalOutputTokens)
    : 0;

  return {
    agentId,
    agentName,
    model,
    period: {
      start,
      end,
      days,
    },
    usage: {
      totalInputTokens,
      totalOutputTokens,
      totalMessages: filteredMessages.length,
    },
    costs: {
      total: cost.costs.total,
      perMessage: filteredMessages.length > 0 ? cost.costs.total / filteredMessages.length : 0,
      perDay: cost.costs.total / days,
    },
    comparison: {
      withFlash: flashCost.costs.total,
      withPro: proCost.costs.total,
      savings,
    },
  };
}

