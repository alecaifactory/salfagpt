/**
 * Types for Agent Metrics Cache System
 * 
 * Purpose: High-performance derived views for agent metrics
 * Target: <50ms response time
 * Pattern: Calculate once, use many times, share securely
 * 
 * Created: 2025-11-18
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Cached metrics for a single agent
 * Stored in: agent_metrics_cache collection
 * Updated by: Cloud Function on context_sources changes
 */
export interface AgentMetricsCache {
  // Identity
  id: string;                         // agentId (document ID)
  agentId: string;                    // Conversation/agent ID
  userId: string;                     // Owner ID
  organizationId?: string;            // Organization ID (if applicable)
  domainId?: string;                  // Domain ID (if applicable)
  
  // Document Metrics
  documentCount: number;              // Total documents assigned
  activeCount: number;                // Active documents (status=active)
  ragEnabledCount: number;            // Documents with RAG enabled
  validatedCount: number;             // Expert-validated documents
  
  // Size Metrics
  totalSizeMB: number;                // Total size of all documents
  avgSizeMB: number;                  // Average document size
  totalTokensEstimate: number;        // Estimated total tokens
  
  // Activity Metrics
  lastMessageAt: Timestamp;           // Last message in conversation
  messagesCount: number;              // Total messages in conversation
  lastActivityAt: Timestamp;          // Last document upload/removal
  
  // Document Type Breakdown
  documentsByType: {
    pdf: number;
    csv: number;
    excel: number;
    word: number;
    url: number;
    api: number;
    folder: number;
  };
  
  // Update Tracking
  lastUpdated: Timestamp;             // When this cache was updated
  updateTrigger: UpdateTrigger;       // What triggered the update
  updateDurationMs: number;           // How long the update took
  
  // Security
  _signature: string;                 // SHA-256 signature for verification
  _version: number;                   // Version for conflict detection
  
  // Source tracking
  source: 'localhost' | 'production'; // Environment
}

/**
 * What triggered a metrics cache update
 */
export type UpdateTrigger = 
  | 'document_added'
  | 'document_removed'
  | 'document_updated'
  | 'agent_created'
  | 'scheduled_refresh'
  | 'manual_refresh';

/**
 * Bulk metrics response
 * Used when fetching metrics for multiple agents
 */
export interface BulkAgentMetrics {
  metrics: Map<string, AgentMetricsCache>;
  metadata: {
    totalAgents: number;
    respondedIn: string;              // e.g., "45ms"
    fromCache: boolean;
    timestamp: string;
  };
}

/**
 * Metrics update request
 * Used internally to trigger cache updates
 */
export interface MetricsUpdateRequest {
  agentId: string;
  trigger: UpdateTrigger;
  reason?: string;
}

/**
 * User-level metrics cache
 * Aggregated from agent metrics
 */
export interface UserMetricsCache {
  id: string;                         // userId (document ID)
  userId: string;
  
  // Totals
  totalAgents: number;
  activeAgents: number;               // Agents with messages in last 7 days
  totalDocuments: number;
  totalMessages: number;
  
  // Size
  totalStorageMB: number;
  avgDocumentsPerAgent: number;
  
  // Activity
  lastActivity: Timestamp;
  messagesLast7Days: number;
  
  // Update tracking
  lastUpdated: Timestamp;
  _signature: string;
  _version: number;
  source: 'localhost' | 'production';
}

/**
 * Organization-level metrics cache
 * Aggregated from user metrics
 */
export interface OrganizationMetricsCache {
  id: string;                         // organizationId (document ID)
  organizationId: string;
  
  // Totals
  totalUsers: number;
  activeUsers: number;                // Users active in last 7 days
  totalAgents: number;
  totalDocuments: number;
  totalMessages: number;
  
  // Size
  totalStorageGB: number;
  avgDocumentsPerAgent: number;
  avgAgentsPerUser: number;
  
  // Activity
  lastActivity: Timestamp;
  messagesLast30Days: number;
  
  // Breakdown by domain
  domainBreakdown: Array<{
    domainId: string;
    users: number;
    agents: number;
    documents: number;
  }>;
  
  // Update tracking
  lastUpdated: Timestamp;
  _signature: string;
  _version: number;
  source: 'localhost' | 'production';
}

/**
 * Domain-level metrics cache
 * Subset of organization metrics for a specific domain
 */
export interface DomainMetricsCache {
  id: string;                         // domainId (document ID)
  domainId: string;
  organizationId: string;
  
  // Totals
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  totalDocuments: number;
  
  // Activity
  lastActivity: Timestamp;
  
  // Update tracking
  lastUpdated: Timestamp;
  _signature: string;
  _version: number;
  source: 'localhost' | 'production';
}

/**
 * Metrics API response wrapper
 * Standard response format for all metrics endpoints
 */
export interface MetricsAPIResponse<T> {
  data: T;
  metadata: {
    respondedIn: string;              // e.g., "45ms"
    fromCache: boolean;
    cacheAge: number;                 // seconds since last update
    verified: boolean;                // signature verification result
    version: number;
    timestamp: string;                // ISO 8601
  };
}

/**
 * Signature verification result
 */
export interface SignatureVerification {
  isValid: boolean;
  algorithm: 'sha256';
  verifiedAt: Date;
  message?: string;                   // Error message if invalid
}

