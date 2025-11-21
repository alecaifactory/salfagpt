/**
 * 3-Layer Cache Manager
 * 
 * Purpose: Minimize latency through intelligent caching
 * Layers:
 *   1. Browser (localStorage) - 5 minute TTL
 *   2. Edge (in-memory) - 1 minute TTL  
 *   3. Database (Firestore derived view) - Real-time updates
 * 
 * Pattern: Check layers in order, return first hit
 * Invalidation: Cascading (Layer 1 → Layer 2 → Layer 3)
 * 
 * Created: 2025-11-18
 */

import type { AgentMetricsCache } from '../types/metrics-cache';

// Layer 2: In-memory cache (server-side)
const edgeCache = new Map<string, {
  data: AgentMetricsCache;
  expiresAt: number;
}>();

const BROWSER_TTL_MS = 5 * 60 * 1000;  // 5 minutes
const EDGE_TTL_MS = 1 * 60 * 1000;     // 1 minute

/**
 * Browser cache key generator
 */
function getBrowserCacheKey(agentId: string): string {
  return `flow_metrics_${agentId}`;
}

/**
 * Layer 1: Browser Cache Operations
 * Only works in browser environment
 */
export const BrowserCache = {
  /**
   * Get from browser localStorage
   */
  get(agentId: string): AgentMetricsCache | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = getBrowserCacheKey(agentId);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // Check TTL
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.data;
      
    } catch (error) {
      console.warn('⚠️ Browser cache read error:', error);
      return null;
    }
  },
  
  /**
   * Set in browser localStorage
   */
  set(agentId: string, data: AgentMetricsCache): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = getBrowserCacheKey(agentId);
      const cached = {
        data,
        expiresAt: Date.now() + BROWSER_TTL_MS
      };
      
      localStorage.setItem(key, JSON.stringify(cached));
      
    } catch (error) {
      console.warn('⚠️ Browser cache write error:', error);
      // Don't throw - caching should never break functionality
    }
  },
  
  /**
   * Invalidate browser cache for an agent
   */
  invalidate(agentId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = getBrowserCacheKey(agentId);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('⚠️ Browser cache invalidation error:', error);
    }
  },
  
  /**
   * Clear all agent metrics from browser cache
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('flow_metrics_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('⚠️ Browser cache clear error:', error);
    }
  }
};

/**
 * Layer 2: Edge Cache Operations
 * In-memory cache at the server/edge level
 */
export const EdgeCache = {
  /**
   * Get from edge cache
   */
  get(agentId: string): AgentMetricsCache | null {
    const cached = edgeCache.get(agentId);
    
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() > cached.expiresAt) {
      edgeCache.delete(agentId);
      return null;
    }
    
    return cached.data;
  },
  
  /**
   * Set in edge cache
   */
  set(agentId: string, data: AgentMetricsCache): void {
    edgeCache.set(agentId, {
      data,
      expiresAt: Date.now() + EDGE_TTL_MS
    });
  },
  
  /**
   * Invalidate edge cache for an agent
   */
  invalidate(agentId: string): void {
    edgeCache.delete(agentId);
  },
  
  /**
   * Clear all edge cache
   */
  clearAll(): void {
    edgeCache.clear();
  },
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(edgeCache.entries());
    const validEntries = entries.filter(([, v]) => v.expiresAt > now);
    
    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      hitRate: entries.length > 0 
        ? (validEntries.length / entries.length * 100).toFixed(1) 
        : '0.0',
      memoryUsageKB: Math.round(
        JSON.stringify(Array.from(edgeCache.values())).length / 1024
      )
    };
  }
};

/**
 * Cache invalidation
 * Cascades through all layers
 */
export function invalidateAllLayers(agentId: string): void {
  BrowserCache.invalidate(agentId);
  EdgeCache.invalidate(agentId);
  // Layer 3 (Firestore) is updated by Cloud Function
  console.log(`🔄 Invalidated all cache layers for ${agentId}`);
}

/**
 * Cache warming
 * Pre-load cache for frequently accessed agents
 * 
 * @param agentIds - Agent IDs to warm
 * @param fetchFunction - Function to fetch data if not cached
 */
export async function warmCache(
  agentIds: string[],
  fetchFunction: (agentId: string) => Promise<AgentMetricsCache | null>
): Promise<void> {
  console.log(`🔥 Warming cache for ${agentIds.length} agents...`);
  
  const promises = agentIds.map(async (agentId) => {
    // Check if already in edge cache
    if (EdgeCache.get(agentId)) {
      return;
    }
    
    // Fetch and cache
    const data = await fetchFunction(agentId);
    if (data) {
      EdgeCache.set(agentId, data);
    }
  });
  
  await Promise.all(promises);
  
  console.log(`✅ Cache warmed for ${agentIds.length} agents`);
}

/**
 * Get cache statistics across all layers
 * For monitoring and debugging
 */
export function getCacheStatistics() {
  const edgeStats = EdgeCache.getStats();
  
  // Browser stats (if in browser)
  let browserStats = { entries: 0 };
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    browserStats.entries = keys.filter(k => k.startsWith('flow_metrics_')).length;
  }
  
  return {
    browser: browserStats,
    edge: edgeStats,
    timestamp: new Date().toISOString()
  };
}


