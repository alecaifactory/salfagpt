/**
 * Tim - Digital Twin Testing Agent
 * Type definitions for automated user testing system
 * 
 * Created: 2025-11-16
 * Purpose: Reproduce user issues, diagnose problems, route insights
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// DIGITAL TWIN
// ============================================================================

export interface DigitalTwin {
  // Identity
  id: string;
  userId: string;                     // Original user
  userEmail: string;                  // Anonymized: t***@domain.com
  ticketId: string;                   // Related support ticket
  
  // Configuration Snapshot
  userConfig: {
    model: string;                    // User's preferred model
    systemPrompt: string;             // Encrypted if contains PII
    language: string;
    activeContextSourceIds: string[]; // Encrypted document IDs
  };
  
  // Profile Mirror
  userProfile: {
    role: string;
    domain: string;                   // Email domain
    organizationId?: string;
    preferences: Record<string, any>; // Anonymized
  };
  
  // Test Session
  sessionId: string;                  // Unique test session
  status: 'created' | 'compliance_check' | 'testing' | 'analyzing' | 'completed' | 'failed';
  
  // Privacy & Compliance
  complianceScore: number;            // 0-100, must be ≥98
  anonymizationApplied: boolean;
  encryptionApplied: boolean;
  sensitiveDataRedacted: string[];   // Field names redacted
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Source
  source: 'localhost' | 'production';
}

// ============================================================================
// TEST SESSION
// ============================================================================

export interface TimTestSession {
  // Identity
  id: string;
  digitalTwinId: string;              // Parent twin
  userId: string;                     // Original user
  ticketId: string;                   // Support ticket
  
  // Test Configuration
  testScenario: {
    userAction: string;               // What user did
    expectedBehavior: string;         // What should happen
    actualBehavior: string;           // What actually happened
    reproductionSteps: string[];      // How to reproduce
  };
  
  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Captured Data
  capturedData: CapturedData;
  
  // Analysis
  aiAnalysis?: AIAnalysis;
  
  // Routing
  routedTo: InsightRouting;
  
  // Privacy Ledger
  privacyLedger: {
    updatesApplied: Array<{
      field: string;
      action: 'anonymized' | 'encrypted' | 'redacted';
      timestamp: Date;
    }>;
    complianceChecks: Array<{
      checkType: string;
      score: number;
      passed: boolean;
      timestamp: Date;
    }>;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

export interface CapturedData {
  consoleLogs: ConsoleLog[];
  networkRequests: NetworkRequest[];
  screenshots: Screenshot[];
  performanceMetrics: PerformanceMetrics;
  accessibilityIssues: AccessibilityIssue[];
}

export interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  stack?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  timestamp: Date;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

export interface Screenshot {
  filename: string;
  url: string;                        // GCS URL
  step: string;                       // Which test step
  timestamp: Date;
  width?: number;
  height?: number;
}

export interface PerformanceMetrics {
  loadTime?: number;                  // ms
  domReady?: number;                  // ms
  firstPaint?: number;                // ms
  apiLatency?: number;                // ms (average)
  memoryUsage?: number;               // bytes
}

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  description: string;
  element: string;
  recommendation?: string;
}

export interface AIAnalysis {
  rootCause: string;
  reproducible: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedUsers: string;              // "All users" | "Users with role X"
  recommendedFix: string;
  estimatedEffort: string;            // "2 hours" | "1 day"
  confidence: number;                 // 0-100
}

export interface InsightRouting {
  user: boolean;                      // Report sent to user
  ally: boolean;                      // Personal agent updated
  stella: boolean;                    // Product insights
  rudy: boolean;                      // Roadmap prioritization
  admin: boolean;                     // Org admin notified
  superAdmin: boolean;                // Platform-wide issue
}

// ============================================================================
// COMPLIANCE
// ============================================================================

export interface TimComplianceLog {
  id: string;
  digitalTwinId: string;
  sessionId: string;
  
  // Check Details
  checkType: 'pii_detection' | 'encryption_validation' | 'anonymization_score' | 'access_audit';
  input: string;                      // Encrypted
  output: string;                     // Anonymized/encrypted
  
  // Scoring
  complianceScore: number;            // 0-100
  passed: boolean;                    // ≥98 required
  issues: ComplianceIssue[];
  
  // Action
  actionTaken: 'proceed' | 'block' | 'manual_review';
  
  // Timestamps
  timestamp: Date;
  source: 'localhost' | 'production';
}

export interface ComplianceIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface ComplianceCheck {
  piiDetection: number;               // 0-100
  encryptionStrength: number;         // 0-100
  accessControl: number;              // 0-100
  auditTrail: number;                 // 0-100
}

// ============================================================================
// INSIGHTS
// ============================================================================

export interface TimInsight {
  id: string;
  sessionId: string;                  // Test session
  userId: string;                     // Original user
  
  // Insight Data
  insightType: 'bug' | 'performance' | 'ux' | 'feature_request' | 'pattern';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Evidence
  evidence: {
    consoleLogs: string[];
    screenshotUrls: string[];
    networkRequests: string[];
    reproductionSteps: string[];
  };
  
  // Routing
  routedTo: ('ally' | 'stella' | 'rudy' | 'admin' | 'superadmin')[];
  status: 'pending' | 'reviewed' | 'planned' | 'in_progress' | 'resolved';
  
  // Metadata
  tags: string[];
  affectedUsers: number;              // Estimated impact
  
  // Timestamps
  createdAt: Date;
  resolvedAt?: Date;
  source: 'localhost' | 'production';
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateTimRequest {
  userId: string;
  ticketId: string;
  ticketDetails: {
    userAction: string;
    expectedBehavior: string;
    actualBehavior: string;
    reproductionSteps?: string[];
  };
}

export interface CreateTimResponse {
  digitalTwinId: string;
  complianceScore: number;
  status: string;
  sessionId: string;
}

export interface TimSessionResponse {
  sessionId: string;
  status: string;
  analysis?: AIAnalysis;
  evidence?: {
    screenshots: string[];
    consoleLogs: string[];
    networkRequests: any[];
  };
  routedTo?: InsightRouting;
}

export interface TimLedgerEntry {
  sessionId: string;
  ticketId: string;
  createdAt: string;
  status: string;
  dataShared: {
    profile: string;
    messages: string;
    contextSources: string;
    screenshots: string;
    consoleLogs: string;
  };
  accessedBy: Array<{
    agent: 'ally' | 'stella' | 'rudy' | 'tim';
    timestamp: string;
    purpose: string;
  }>;
  complianceScore: number;
  compliancePassed: boolean;
  downloadUrl: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type TimStatus = 'created' | 'compliance_check' | 'testing' | 'analyzing' | 'completed' | 'failed';
export type TestSessionStatus = 'pending' | 'running' | 'completed' | 'failed';
export type InsightType = 'bug' | 'performance' | 'ux' | 'feature_request' | 'pattern';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type DataSource = 'localhost' | 'production';

