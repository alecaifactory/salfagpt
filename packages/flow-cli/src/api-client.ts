/**
 * Flow CLI API Client
 * 
 * Handles authenticated requests to Flow platform API
 */

import { getAPIKey, getAPIEndpoint } from './config.js';
import type { APIResponse } from './types.js';

/**
 * API Client class
 */
export class FlowAPIClient {
  private apiKey: string | null;
  private endpoint: string;
  
  constructor() {
    this.apiKey = getAPIKey();
    this.endpoint = getAPIEndpoint();
  }
  
  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.apiKey !== null;
  }
  
  /**
   * Make authenticated request
   */
  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Not authenticated. Run: flow login',
        timestamp: new Date().toISOString(),
      };
    }
    
    const url = `${this.endpoint}${path}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return {
          success: false,
          error: (data as any).error || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  /**
   * Test connection
   */
  async testConnection(): Promise<APIResponse<{ status: string; user: any }>> {
    return this.request<{ status: string; user: any }>('/api/cli/auth/verify');
  }
  
  /**
   * Get domain usage stats
   */
  async getDomainUsageStats(
    domain: string,
    startDate?: string,
    endDate?: string
  ): Promise<APIResponse<any>> {
    const params = new URLSearchParams();
    params.set('domain', domain);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    return this.request(`/api/cli/usage-stats?${params.toString()}`);
  }
}

