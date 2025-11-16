/**
 * Evaluation Management System Types
 * 
 * Purpose: Centralized evaluation management for SuperAdmin and Admin
 * Scope: Assignment, routing, and queue management for evaluation workflow
 * 
 * Created: 2025-11-16
 * Feature Flag: ENABLE_EVALUATION_MANAGEMENT
 * 
 * BACKWARD COMPATIBLE: All enhancements to existing types are optional fields
 */

import type { ReviewStatus, CorrectionProposal, ImpactAnalysis, ApprovalWorkflow } from './expert-review';

/**
 * Assignment types for evaluation work
 */
export type AssignmentType = 
  | 'agent'           // Supervisor assigned to all test cases for an agent
  | 'test-case'       // Evaluador assigned to specific test case
  | 'feedback-item'   // Evaluador assigned to specific feedback
  | 'domain';         // Supervisor assigned to entire domain

/**
 * Assignment status
 */
export type AssignmentStatus = 
  | 'active'          // Currently active
  | 'completed'       // Work completed
  | 'cancelled';      // Assignment cancelled

/**
 * Evaluation Assignment
 * Tracks who evaluates what (supervisors and evaluadores)
 */
export interface EvaluationAssignment {
  // Identity
  id: string;
  
  // Assignment scope
  assignmentType: AssignmentType;
  
  // People assigned
  supervisorId: string;
  supervisorEmail: string;
  supervisorName: string;
  evaluadorIds: string[];           // Multiple evaluadores can work together
  evaluadorDetails: Array<{
    userId: string;
    email: string;
    name: string;
    specialty?: string;
    assignedAt: Date;
  }>;
  
  // Targets (depending on assignmentType)
  agentId?: string;                 // If agent-specific
  agentName?: string;
  testCaseIds?: string[];           // If test-case-specific
  feedbackItemIds?: string[];       // If feedback-specific
  domainId?: string;                // Domain scope
  organizationId?: string;          // Organization scope
  
  // Assignment metadata
  assignedBy: string;               // Admin/SuperAdmin userId
  assignedByEmail: string;
  assignedByRole: 'admin' | 'superadmin';
  assignedAt: Date | string;
  dueDate?: Date | string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignmentNotes?: string;
  
  // Status
  status: AssignmentStatus;
  completedAt?: Date;
  completionNotes?: string;
  
  // Progress metrics
  itemsReviewed: number;
  itemsPending: number;
  itemsApproved: number;
  itemsRejected: number;
  averageReviewTime: number;        // ms
  
  // Permissions for this assignment
  permissions: {
    canApprove: boolean;            // Can approve corrections
    canAssignEvaluadores: boolean;  // Can sub-assign work
    canViewAllDomainFeedback: boolean;
    canAccessTestCases: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

/**
 * Centralized Test Case
 * Aggregates test cases from all sources (setup docs, manual, feedback)
 */
export interface EvaluationTestCase {
  // Identity
  id: string;
  
  // Scope
  agentId: string;
  agentName: string;
  domainId: string;
  domainName: string;
  organizationId?: string;
  
  // Test case details
  question: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedTopics?: string[];
  expectedDocuments?: string[];
  expectedAnswer?: string;
  acceptanceCriteria?: string;
  
  // Source tracking
  sourceType: 'setup-doc' | 'manual' | 'user-feedback' | 'expert-created' | 'stella-detected';
  sourceId: string;                 // Original source document ID
  extractedFrom?: string;           // Document name if extracted
  createdFromFeedback?: {
    feedbackId: string;
    messageId: string;
    userQuery: string;
    aiResponse: string;
    userRating?: number;
    expertRating?: string;
  };
  
  // Assignment
  assignedSupervisorId?: string;
  assignedSupervisorEmail?: string;
  assignedEvaluadorIds?: string[];
  assignmentId?: string;            // Links to evaluation_assignments
  assignedAt?: Date;
  
  // Test execution history
  latestTestId?: string;            // Most recent test_result ID
  latestTestScore?: number;         // 0-100
  latestTestDate?: Date;
  latestTestPassed?: boolean;
  testCount: number;                // Total tests run
  passCount: number;                // Tests that passed
  failCount: number;                // Tests that failed
  averageScore?: number;            // Average across all tests
  
  // Review status
  reviewStatus: 'pending' | 'in-review' | 'approved' | 'needs-work' | 'not-applicable';
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  correctionProposed?: boolean;
  correctionApplied?: boolean;
  
  // Metrics
  failurePattern?: string;          // Common failure reason
  similarityToOtherTests?: number;  // Duplication check
  userImpact: 'low' | 'medium' | 'high' | 'critical';
  estimatedFixEffort?: 'xs' | 's' | 'm' | 'l' | 'xl';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByEmail: string;
  tags?: string[];
  isActive: boolean;                // Can be archived
  source: 'localhost' | 'production';
}

/**
 * Feedback routing metadata
 * Added to feedback_tickets for auto-routing
 */
export interface FeedbackRoutingMetadata {
  // Priority calculation
  priorityScore: number;            // 0-100 calculated score
  priorityReasons: string[];        // Why this score
  
  // Scope detection
  affectedAgents: string[];
  affectedDomains: string[];
  affectedOrganizationId?: string;
  
  // Similarity analysis
  similarityToExistingTests: number; // 0-1
  similarTestCaseIds?: string[];
  similarFeedbackIds?: string[];
  
  // Auto-routing
  autoRoutedTo?: string;            // Supervisor userId
  autoRoutedEvaluadores?: string[]; // Suggested evaluadores
  routingReason?: string;
  routingConfidence: number;        // 0-100
  
  // Calculation metadata
  calculatedAt: Date;
  calculatedBy: string;             // 'system' or userId
  calculationModel?: string;        // If AI-powered
}

/**
 * Multi-source feedback aggregation
 * Tracks feedback from different sources for same issue
 */
export interface AggregatedFeedbackSource {
  source: 'message-feedback' | 'stella-feedback' | 'admin-feedback' | 'expert-feedback' | 'test-failure';
  feedbackId: string;
  weight: number;                   // 0-1 (expert=1.0, admin=0.8, user=0.3)
  contributedAt: Date;
  content: string;                  // Feedback text
  rating?: number | string;         // Stars or expert rating
}

/**
 * Evaluation work queue item
 * Unified view for supervisors/evaluadores
 */
export interface EvaluationWorkItem {
  // Identity
  id: string;
  type: 'feedback' | 'test-case' | 'evaluation';
  
  // Source
  sourceId: string;                 // feedback_ticket ID, test_case ID, etc.
  sourceName: string;               // Display name
  
  // Scope
  agentId: string;
  agentName: string;
  domainId: string;
  domainName: string;
  
  // Assignment
  assignedTo: string;               // Current user (supervisor or evaluador)
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  
  // Priority & Status
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: ReviewStatus | AssignmentStatus;
  
  // Quick stats
  requiresAction: boolean;          // Needs immediate attention
  daysOverdue?: number;
  estimatedEffort?: 'xs' | 's' | 'm' | 'l' | 'xl';
  
  // Preview
  preview: string;                  // First 200 chars
  tags: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bulk assignment request
 * For assigning multiple items at once
 */
export interface BulkAssignmentRequest {
  // Items to assign
  itemType: 'test-case' | 'feedback' | 'agent';
  itemIds: string[];
  
  // Assignment
  supervisorId?: string;
  evaluadorIds?: string[];
  
  // Options
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: Date;
  notes?: string;
  
  // Requester
  requestedBy: string;
  requestedByRole: 'admin' | 'superadmin';
}

/**
 * Evaluation queue filters
 * For scoped queries by role
 */
export interface EvaluationQueueFilters {
  // Role-based scope
  viewerUserId: string;
  viewerRole: 'user' | 'evaluador' | 'supervisor' | 'admin' | 'superadmin';
  viewerDomains?: string[];          // Domains user has access to
  viewerOrganizationId?: string;
  
  // Filters
  domainId?: string;
  organizationId?: string;
  agentId?: string;
  status?: ReviewStatus | AssignmentStatus;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;              // Filter by assigned user
  
  // Date range
  createdAfter?: Date;
  createdBefore?: Date;
  
  // Source
  feedbackSource?: 'expert' | 'user' | 'stella' | 'admin';
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sorting
  orderBy?: 'priority' | 'createdAt' | 'assignedAt' | 'dueDate';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Assignment statistics
 * Summary metrics for dashboards
 */
export interface AssignmentStatistics {
  // Supervisor stats
  supervisorId: string;
  supervisorEmail: string;
  
  // Domain context
  domainId?: string;
  domainName?: string;
  
  // Workload
  activeAssignments: number;
  completedAssignments: number;
  totalAssignments: number;
  
  // Performance
  averageReviewTime: number;        // hours
  approvalRate: number;             // 0-1
  escalationRate: number;           // 0-1 (how often escalated to evaluador)
  
  // Queue health
  pendingItems: number;
  overdueItems: number;
  criticalItems: number;
  
  // Quality metrics
  averageTestScore: number;         // 0-100
  passRate: number;                 // 0-1
  improvementRate: number;          // 0-1 (% improved after review)
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

/**
 * Dashboard summary
 * High-level metrics for admin/superadmin
 */
export interface EvaluationDashboardSummary {
  // Scope
  viewerRole: 'admin' | 'superadmin';
  domains: string[];                // Domains in view
  organizations?: string[];         // Orgs in view (SuperAdmin only)
  
  // Queue health
  totalPendingReviews: number;
  criticalItems: number;
  overdueItems: number;
  avgWaitTime: number;              // hours
  
  // Resource utilization
  supervisors: {
    total: number;
    active: number;
    overloaded: number;             // >80% capacity
    underutilized: number;          // <40% capacity
  };
  evaluadores: {
    total: number;
    active: number;
    averageLoad: number;            // assignments per evaluador
  };
  
  // Quality trends
  avgTestPassRate: number;          // 0-1
  avgReviewCycleTime: number;       // hours
  correctionsAppliedLast30Days: number;
  domainQualityScores: Record<string, number>; // DQS per domain
  
  // Performance
  itemsReviewedToday: number;
  itemsReviewedThisWeek: number;
  itemsReviewedThisMonth: number;
  
  // Alerts
  alerts: Array<{
    type: 'overdue' | 'overload' | 'quality-drop' | 'critical-item';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedDomain?: string;
    affectedSupervisor?: string;
    actionRequired: string;
  }>;
  
  // Metadata
  generatedAt: Date;
  refreshRate: number;              // seconds
}

/**
 * Firestore collection names
 */
export const EVALUATION_MANAGEMENT_COLLECTIONS = {
  ASSIGNMENTS: 'evaluation_assignments',
  TEST_CASES: 'evaluation_test_cases',
  WORK_ITEMS: 'evaluation_work_items',          // Denormalized queue view
  ASSIGNMENT_STATS: 'evaluation_assignment_stats', // Cached statistics
} as const;

/**
 * Validation helper: Check if user can access evaluation management
 */
export function canAccessEvaluationManagement(
  user: { role: string; email: string },
  featureFlagEnabled: boolean
): boolean {
  if (!featureFlagEnabled) return false;
  return ['superadmin', 'admin'].includes(user.role);
}

/**
 * Validation helper: Check if user can assign in domain
 */
export function canAssignInDomain(
  user: { role: string; email: string },
  domainId: string,
  userDomains: string[]
): boolean {
  // SuperAdmin: All domains
  if (user.role === 'superadmin') return true;
  
  // Admin: Only their assigned domains
  if (user.role === 'admin') {
    const userDomain = user.email.split('@')[1];
    return userDomains.includes(domainId) || domainId === userDomain;
  }
  
  return false;
}

/**
 * Calculate priority score for auto-routing
 */
export function calculateAutoRoutingPriority(item: {
  feedbackType?: string;
  reportedByRole?: string;
  expertRating?: string;
  userStars?: number;
  similarQuestionsCount?: number;
}): number {
  let score = 50; // Base
  
  // Source weight (who reported)
  if (item.feedbackType === 'expert') score += 30;
  if (item.reportedByRole === 'admin') score += 20;
  if (item.reportedByRole === 'superadmin') score += 40;
  
  // Rating impact
  if (item.expertRating === 'inaceptable') score += 40;
  if (item.userStars && item.userStars <= 2) score += 20;
  if (item.userStars && item.userStars <= 1) score += 30;
  
  // Similarity amplification (systemic issues)
  if (item.similarQuestionsCount && item.similarQuestionsCount > 5) {
    score += Math.min(30, item.similarQuestionsCount * 2);
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Match evaluador to feedback based on specialty
 */
export function matchEvaluadorToFeedback(
  feedback: { category?: string; agentId?: string; domainId?: string },
  evaluadores: Array<{
    userId: string;
    specialty: string;
    domains: string[];
    maxConcurrentAssignments: number;
    activeAssignments: number;
  }>
): Array<{ userId: string; matchScore: number; reason: string }> {
  
  const matches = evaluadores.map(evaluador => {
    let score = 0;
    const reasons: string[] = [];
    
    // Specialty match
    if (feedback.category && evaluador.specialty.toLowerCase().includes(feedback.category.toLowerCase())) {
      score += 40;
      reasons.push(`Specialty match: ${evaluador.specialty}`);
    }
    
    // Domain expertise
    if (feedback.category && evaluador.domains.some(d => 
      d.toLowerCase().includes(feedback.category.toLowerCase())
    )) {
      score += 30;
      reasons.push('Domain expertise match');
    }
    
    // Capacity check
    const utilization = evaluador.activeAssignments / evaluador.maxConcurrentAssignments;
    if (utilization < 0.5) {
      score += 20;
      reasons.push('Available capacity');
    } else if (utilization < 0.8) {
      score += 10;
      reasons.push('Moderate capacity');
    } else {
      score -= 20;
      reasons.push('High workload');
    }
    
    // Base competence
    score += 10;
    
    return {
      userId: evaluador.userId,
      matchScore: Math.max(0, score),
      reason: reasons.join(', ')
    };
  });
  
  return matches
    .filter(m => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

