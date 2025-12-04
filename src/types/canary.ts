/**
 * Canary Deployment Types
 * 
 * Enables safe progressive rollout with instant rollback capability
 */

export interface CanaryConfig {
  id: 'current';  // Always use "current" as document ID
  
  // Version info
  version: string;                    // e.g., "0.1.1"
  status: 'testing' | 'rolling-out' | 'complete' | 'rolled-back';
  
  // Revisions
  stableRevision: string;             // e.g., "cr-salfagpt-ai-ft-prod-00095-b8f"
  canaryRevision: string;             // e.g., "cr-salfagpt-ai-ft-prod-00096-xxx"
  
  // User routing
  canaryUsers: string[];              // Emails of users on canary (always get new version)
  rolloutPercentage: number;          // 0-100 (% of other users on canary)
  
  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  rolledBackAt?: Date;
  
  // Monitoring (optional for MVP)
  canaryErrorCount?: number;
  stableErrorCount?: number;
  
  // Notes
  description?: string;
  rollbackReason?: string;
}

export interface CanaryDeploymentInfo {
  isCanary: boolean;
  revision: string;
  version: string;
  rolloutPercentage: number;
}

