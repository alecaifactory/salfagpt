/**
 * Types for API Key Management System
 * 
 * Purpose: Secure, granular API access control
 * Security: bcrypt hashing, scoped permissions, rate limiting
 * 
 * Created: 2025-11-18
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * API Key permissions
 * Granular permissions for different operations
 */
export type APIKeyPermission =
  // Metrics - Read
  | 'read:agent-metrics'              // Read agent metrics
  | 'read:user-metrics'               // Read user metrics
  | 'read:org-metrics'                // Read organization metrics
  | 'read:domain-metrics'             // Read domain metrics
  | 'read:context-stats'              // Read context statistics
  | 'read:conversation-stats'         // Read conversation statistics
  
  // Metrics - Write (admin)
  | 'write:refresh-metrics'           // Trigger metrics refresh
  | 'write:invalidate-cache'          // Invalidate cache
  
  // Configuration - Write (admin)
  | 'write:agent-config'              // Modify agent configuration
  | 'write:user-config'               // Modify user configuration
  | 'write:org-config'                // Modify organization configuration
  
  // Admin
  | 'admin:all'                       // Full access (SuperAdmin only)
  | 'admin:org'                       // Organization admin access
  | 'admin:domain';                   // Domain admin access

/**
 * API Key document in Firestore
 * Collection: api_keys
 */
export interface APIKey {
  // Identity
  id: string;                         // Document ID
  keyHash: string;                    // bcrypt hash of the actual key
  userId: string;                     // Owner of this API key
  name: string;                       // Human-readable name
  
  // Scope
  organizationId?: string;            // Limit to organization
  domainId?: string;                  // Limit to domain
  agentIds?: string[];                // Limit to specific agents
  
  // Permissions
  permissions: APIKeyPermission[];    // Granted permissions
  
  // Rate Limiting
  rateLimit: number;                  // Requests per minute
  rateLimitPeriod: 'minute' | 'hour' | 'day';
  
  // Status
  isActive: boolean;                  // Can be used
  expiresAt?: Timestamp;              // Optional expiration
  
  // Usage Tracking
  lastUsedAt?: Timestamp;
  usageCount: number;                 // Total times used
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;                  // User who created it
  updatedAt: Timestamp;
  
  // Environment
  environment: 'localhost' | 'staging' | 'production';
  
  // Notes
  description?: string;
  tags?: string[];
}

/**
 * API Key creation request
 */
export interface CreateAPIKeyRequest {
  name: string;
  permissions: APIKeyPermission[];
  organizationId?: string;
  domainId?: string;
  agentIds?: string[];
  rateLimit?: number;
  expiresAt?: Date;
  description?: string;
  tags?: string[];
}

/**
 * API Key creation response
 * IMPORTANT: The plaintext key is only returned ONCE at creation
 */
export interface CreateAPIKeyResponse {
  apiKey: string;                     // Plaintext key (ONLY TIME IT'S SHOWN)
  keyId: string;                      // Document ID for reference
  message: string;                    // "Save this key securely - you won't see it again"
  expiresAt?: string;                 // ISO 8601
}

/**
 * API Key verification result
 * Returned when verifying an API key
 */
export interface APIKeyVerification {
  isValid: boolean;
  keyData?: APIKey;                   // Only if valid
  reason?: string;                    // Error message if invalid
  
  // Rate limiting info
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

/**
 * API Key usage log entry
 * For tracking API key usage and detecting abuse
 */
export interface APIKeyUsageLog {
  id: string;
  keyId: string;                      // Reference to api_keys document
  userId: string;                     // Owner of the key
  
  // Request details
  endpoint: string;                   // e.g., '/api/agents/:id/metrics'
  method: string;                     // GET, POST, etc.
  requestedAt: Timestamp;
  
  // Response
  statusCode: number;                 // 200, 403, etc.
  responseTimeMs: number;
  fromCache: boolean;
  
  // Client info
  ipAddress: string;                  // Hashed for privacy
  userAgent?: string;
  
  // Rate limiting
  rateLimitHit: boolean;              // Whether rate limit was exceeded
  
  // Environment
  environment: 'localhost' | 'staging' | 'production';
}

/**
 * API Key list response
 * For UI display of user's API keys
 */
export interface APIKeyListItem {
  id: string;
  name: string;
  permissions: APIKeyPermission[];
  organizationId?: string;
  domainId?: string;
  agentIds?: string[];
  isActive: boolean;
  expiresAt?: string;                 // ISO 8601
  lastUsedAt?: string;                // ISO 8601
  usageCount: number;
  createdAt: string;                  // ISO 8601
  keyPreview: string;                 // e.g., "api_prod_a1b2c3...****"
}

/**
 * Rate limit status
 * Real-time rate limit information
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;                // Seconds until can retry
}

