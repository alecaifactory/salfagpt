/**
 * Flow CLI Types
 * 
 * Type definitions for the Flow CLI package
 */

/**
 * API Key stored in Firestore
 */
export interface FlowAPIKey {
  id: string;
  name: string;
  key: string;                      // Hashed API key
  keyPreview: string;               // Last 8 characters for display
  createdBy: string;                // SuperAdmin email who created it
  createdAt: Date;
  expiresAt?: Date;                 // Optional expiration
  isActive: boolean;
  
  // Assigned to
  assignedTo: string;               // Admin email
  domain: string;                   // Admin's domain
  
  // Permissions (for future expansion)
  permissions: {
    canReadUsageStats: boolean;     // v0.1.0: Only this permission
    canReadDomainStats: boolean;    // Future
    canManageAgents: boolean;       // Future
    canManageContext: boolean;      // Future
  };
  
  // Usage tracking
  lastUsedAt?: Date;
  requestCount: number;
  
  // Metadata
  description?: string;
  environment: 'localhost' | 'production';
}

/**
 * Domain usage statistics
 */
export interface DomainUsageStats {
  domain: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // User stats
  totalUsers: number;
  activeUsers: number;               // Active in period
  
  // Agent stats
  totalAgents: number;
  totalConversations: number;
  totalMessages: number;
  
  // Model usage
  modelUsage: {
    flash: { requests: number; tokens: number; cost: number };
    pro: { requests: number; tokens: number; cost: number };
  };
  
  // Context stats
  totalContextSources: number;
  totalContextTokens: number;
  
  // Performance
  avgResponseTimeMs: number;
  
  // Costs
  totalCost: number;
  costPerUser: number;
  costPerMessage: number;
}

/**
 * CLI Configuration (stored in ~/.flow-cli/config.json)
 */
export interface CLIConfig {
  apiKey?: string;                  // Encrypted API key
  apiEndpoint: string;              // Platform API URL
  userId?: string;                  // Cached user ID
  userEmail?: string;               // Cached user email
  userRole?: string;                // Cached user role
  lastUpdated: string;              // ISO date
}

/**
 * API Response types
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}















