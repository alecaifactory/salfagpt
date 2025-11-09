// Expert Review System Types - Flow Platform
// Created: 2025-11-09
// Purpose: Complete domain-based expert review workflow (SCQI)

/**
 * Review workflow states for SCQI process
 * (Seleccionar → Calificar → Quality Gate → Implementar)
 */
export type ReviewStatus =
  | 'pendiente'              // ⚪ Awaiting expert review
  | 'en-revision'            // 🔵 Expert reviewing
  | 'corregida-propuesta'    // 🟡 Correction proposed by expert
  | 'asignada-especialista'  // 🟣 Assigned to specialist
  | 'revision-especialista'  // 🟣 Specialist reviewing
  | 'devuelta-supervisor'    // 🔄 Returned from specialist to supervisor
  | 'aprobada-aplicar'       // 🟢 Approved by admin, ready to apply
  | 'aplicada'               // ✅ Changes applied to agents (terminal)
  | 'rechazada'              // ❌ Rejected (terminal)
  | 'systemic-issue-detected'; // 🔴 Systemic pattern requiring new feature

/**
 * Correction type classification
 */
export type CorrectionType =
  | 'contenido'      // 📚 Knowledge base content update
  | 'regla'          // ⚖️ Domain prompt or behavior rule
  | 'faq'            // ❓ FAQ entry addition
  | 'tono'           // 🎭 Tone/style adjustment
  | 'fuera-alcance'; // 🚫 Out of scope

/**
 * Correction proposal structure
 * Contains expert/specialist proposed improvements
 */
export interface CorrectionProposal {
  // Core proposal
  correctedText: string;              // Improved response text
  correctionType: CorrectionType;
  proposedBy: string;                 // Expert userId
  proposedByEmail: string;            // For persistence
  proposedByRole: 'expert-supervisor' | 'expert-specialist';
  proposedAt: Date;
  
  // Knowledge updates (if type = 'contenido')
  knowledgeUpdates?: Array<{
    contextSourceId?: string;         // Which context doc to update
    documentName: string;
    sectionToUpdate: string;          // Section 3.4, etc.
    currentText: string;              // What it says now
    proposedText: string;             // What it should say
    changeType: 'update' | 'add' | 'remove';
    justification: string;            // Why this change
  }>;
  
  // Prompt changes (if type = 'regla')
  promptChanges?: {
    currentPrompt: string;
    proposedPrompt: string;
    diffLines: Array<{
      lineNumber: number;
      type: 'addition' | 'deletion' | 'modification';
      content: string;
    }>;
    changeReason: string;
    affectedBehaviors: string[];    // Which behaviors will change
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // FAQ additions (if type = 'faq')
  faqToAdd?: Array<{
    category: string;
    question: string;
    answer: string;
    keywords: string[];
    relatedFAQs: string[];
  }>;
  
  // AI-generated suggestions (stored with proposal)
  aiSuggestions?: {
    suggestedCorrection: string;
    confidenceScore: number;        // 0-100
    reasoning: string;
    alternativeOptions: Array<{
      text: string;
      pros: string[];
      cons: string[];
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    affectedSimilarQuestions: number;
    estimatedQualityImprovement: number; // Percentage
    generatedAt: Date;
    model: string;                  // 'gemini-2.5-flash'
    tokensUsed: number;
  };
}

/**
 * Impact analysis for domain-wide corrections
 * AI-powered prediction of improvement
 */
export interface ImpactAnalysis {
  // Quantitative impact
  similarQuestionsCount: number;    // Questions that would improve
  affectedUsersCount: number;       // Users who asked similar
  averageCurrentRating: number;     // Current avg rating for similar
  projectedRatingImprovement: number; // Expected % improvement
  
  // Domain-specific metrics
  domainMetrics: {
    domain: string;                 // 'maqsa.cl'
    totalDomainAgents: number;      // How many agents in domain
    agentsAffected: number;         // How many would benefit
    domainUsersAffected: number;    // Users in domain who benefit
    crossAgentImpact: Array<{       // Per-agent breakdown
      agentId: string;
      agentName: string;
      similarQuestionsCount: number;
      currentAvgRating: number;
      projectedImprovement: number; // %
    }>;
  };
  
  // Scope analysis
  affectedAgents: string[];         // Agent IDs that will improve
  affectedContextSources: Array<{
    id: string;
    name: string;
    sectionsToUpdate: string[];
    isSharedDomainWide: boolean;
  }>;
  
  // Cost-benefit analysis
  implementationEffort: 'xs' | 's' | 'm' | 'l' | 'xl';
  estimatedTimeSavings: number;     // Hours per month (domain-wide)
  costReduction: number;            // USD per month
  domainROI: {
    monthlyInteractionsInDomain: number;
    currentPoorResponseRate: number; // % below threshold
    projectedPoorResponseRate: number;
    timeSavingsAllAgents: number;   // Hours/month
    costReductionDomain: number;    // USD/month
    investmentRequired: number;     // Development cost
    paybackPeriod: number;          // Months
  };
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  potentialSideEffects: string[];
  testingRequired: 'minimal' | 'standard' | 'extensive';
  testPlan?: {
    sampleQuestions: string[];
    validationSteps: string[];
    acceptanceCriteria: string[];
    estimatedTestingTime: number;  // Hours
  };
  
  // Strategy alignment
  strategyAlignment?: {
    alignsWithMission: boolean;
    relevantOKRs: string[];
    impactsKPIs: Array<{
      kpiName: string;
      currentValue: string;
      projectedValue: string;
      expectedImpact: string;
    }>;
    strategicValue: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // AI analysis metadata
  generatedAt: Date;
  analysisModel: string;            // 'gemini-2.5-pro'
  analysisTokens: number;
  analysisConfidence: number;       // 0-100
}

/**
 * Specialist matching recommendation
 * AI-powered specialist selection
 */
export interface SpecialistMatch {
  specialistId: string;
  specialistName: string;
  specialistEmail: string;
  specialty: string;                // "Legal", "Técnico", etc.
  
  // Matching score
  matchScore: number;               // 0-100
  matchReasons: Array<{
    reason: string;
    weight: number;                 // 0-1
    description: string;
  }>;
  
  // Specialist context
  expertise: string[];              // Topics they handle
  domains: string[];                // Topics within expertise
  currentWorkload: number;          // Pending assignments
  maxWorkload: number;              // Capacity limit
  avgResponseTime: number;          // Hours to complete review
  approvalRate: number;             // % of proposals approved (0-1)
  specialtyRelevance: number;       // How relevant to this interaction (0-1)
  
  // Availability
  isAvailable: boolean;
  nextAvailableDate?: Date;
  estimatedResponseTime: number;    // Hours for this assignment
}

/**
 * Domain review configuration
 * Per-domain settings for expert review system
 */
export interface DomainReviewConfig {
  id: string;                       // Domain ID (e.g., 'maqsa.cl')
  domainName: string;               // Display name
  
  // Priority configuration
  priorityThresholds: {
    userStarThreshold: number;      // ≤3 stars = priority (default)
    expertRatingThreshold: 'inaceptable' | 'aceptable';
    autoFlagInaceptable: boolean;
    minimumSimilarQuestions: number; // Auto-flag if >N similar
  };
  
  // Expert assignment
  supervisors: Array<{
    userId: string;
    userEmail: string;
    name: string;
    assignedAt: Date;
    canApproveCorrections: boolean;
    activeAssignments: number;
  }>;
  
  specialists: Array<{
    userId: string;
    userEmail: string;
    name: string;
    specialty: string;
    domains: string[];              // Expertise topics
    maxConcurrentAssignments: number;
    autoAssign: boolean;            // Use smart matching
    notificationPreferences: {
      weeklyDigest: boolean;
      instantAlerts: boolean;
      emailEnabled: boolean;
    };
  }>;
  
  // Admins who can apply changes
  implementers: Array<{
    userId: string;
    userEmail: string;
    role: 'admin' | 'superadmin';
    canApplyToDomainPrompt: boolean;
    canApplyToKnowledge: boolean;
    canApplyToAgents: boolean;
  }>;
  
  // Notification settings
  notifications: {
    supervisorAlertThreshold: number; // Alert when >N priority items
    specialistWeeklyDigest: {
      enabled: boolean;
      dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
      time: string;                 // "09:00" in domain timezone
    };
    adminBatchReportFrequency: 'daily' | 'weekly' | 'monthly';
  };
  
  // Automation settings
  automation: {
    autoGenerateAISuggestions: boolean;
    autoRunImpactAnalysis: boolean;
    autoMatchSpecialists: boolean;
    batchImplementationEnabled: boolean;
  };
  
  // Domain-specific settings
  customSettings: {
    language: string;               // Primary language
    timezone: string;               // For notification timing
    qualityGoals: {
      targetCSAT: number;
      targetNPS: number;
      minimumAcceptableRating: number;
    };
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastReviewActivity?: Date;
  source: 'localhost' | 'production';
}

/**
 * Assignment tracking
 * Tracks specialist assignments
 */
export interface ExpertAssignment {
  // Assignment details
  assignedTo: string;               // Specialist userId
  assignedToEmail: string;          // For persistence
  assignedBy: string;               // Supervisor userId
  assignedByEmail: string;
  assignedAt: Date;
  dueDate?: Date;
  
  // Assignment context
  assignmentNotes?: string;         // Supervisor's instructions
  specialistMatch?: SpecialistMatch; // AI matching data
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Specialist response
  reviewedAt?: Date;
  completedAt?: Date;
  returnedAt?: Date;
  returnNotes?: string;             // If returned to supervisor
  notApplicableReason?: string;     // If specialist marks "no aplica"
  timeSpent?: number;               // Minutes spent reviewing
}

/**
 * Approval workflow tracking
 * Multi-level approval chain
 */
export interface ApprovalWorkflow {
  // Supervisor approval (if specialist was involved)
  supervisorConsolidation?: {
    consolidatedBy: string;
    consolidatedAt: Date;
    consolidationNotes: string;
    acceptedSpecialistProposal: boolean;
  };
  
  // Admin approval (required)
  adminApproval?: {
    approvedBy: string;
    approvedByEmail: string;
    approvedByRole: 'admin' | 'superadmin';
    approvedAt: Date;
    approvalNotes?: string;
    requiresSuperAdminConfirmation: boolean; // Critical changes
  };
  
  // SuperAdmin confirmation (if critical)
  superAdminConfirmation?: {
    confirmedBy: string;
    confirmedAt: Date;
    confirmationNotes?: string;
  };
  
  // Rejection tracking
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  alternativeSuggestion?: string;
}

/**
 * Implementation tracking
 * Records what was actually applied
 */
export interface ImplementationTracking {
  appliedBy: string;
  appliedByEmail: string;
  appliedAt: Date;
  batchId?: string;                 // If part of batch
  
  // Changes applied
  changesApplied: {
    knowledgeBaseUpdated: boolean;
    domainPromptUpdated: boolean;
    faqAdded: boolean;
    agentSpecificUpdated: boolean;
    contextsUpdated: string[];      // Context source IDs
  };
  
  // Domain-level impact
  domainLevelChanges: {
    domainId: string;
    affectedAgentCount: number;
    affectedUserCount: number;
    
    // Domain prompt changes
    domainPromptUpdated: boolean;
    domainPromptBefore?: string;
    domainPromptAfter?: string;
    
    // Shared knowledge changes
    sharedKnowledgeUpdated: boolean;
    updatedContextSources: Array<{
      contextSourceId: string;
      documentName: string;
      isSharedDomainWide: boolean;
      sectionsUpdated: string[];
      beforeText: string;
      afterText: string;
    }>;
  };
  
  // Version tracking
  versionBefore: string;
  versionAfter: string;
  promptVersionBefore?: string;
  promptVersionAfter?: string;
  
  // Verification
  testingCompleted: boolean;
  testResults?: {
    sampleQuestionsPassed: number;
    sampleQuestionsTotal: number;
    averageRatingAfter: number;
    improvementRealized: number;    // Actual vs predicted
    successRate: number;            // %
  };
  
  // Rollback support
  rollbackAvailable: boolean;
  rollbackData?: {
    previousDomainPrompt?: string;
    previousKnowledge: Array<{
      contextSourceId: string;
      previousContent: string;
      sectionPath: string;
    }>;
    rollbackComplexity: 'simple' | 'moderate' | 'complex';
    estimatedRollbackTime: number; // Seconds
  };
}

/**
 * State transition rules
 * Validates allowed workflow transitions
 */
export const ALLOWED_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  'pendiente': ['en-revision', 'rechazada'],
  'en-revision': ['corregida-propuesta', 'asignada-especialista', 'rechazada', 'systemic-issue-detected'],
  'corregida-propuesta': ['aprobada-aplicar', 'en-revision', 'rechazada'],
  'asignada-especialista': ['revision-especialista'],
  'revision-especialista': ['devuelta-supervisor', 'corregida-propuesta'],
  'devuelta-supervisor': ['en-revision', 'asignada-especialista'],
  'aprobada-aplicar': ['aplicada'],
  'aplicada': [], // Terminal state
  'rechazada': [], // Terminal state
  'systemic-issue-detected': [], // Handled by feature request system
};

/**
 * Validate state transition
 */
export function canTransitionTo(
  currentStatus: ReviewStatus,
  targetStatus: ReviewStatus
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(targetStatus) || false;
}

/**
 * Get allowed actions for current state and user role
 */
export function getAllowedActions(
  currentStatus: ReviewStatus,
  userRole: string,
  userDomain: string,
  ticketDomain: string
): string[] {
  // Domain check (except superadmin)
  if (userRole !== 'superadmin' && userDomain !== ticketDomain) {
    return []; // No actions if different domain
  }
  
  const actions: string[] = [];
  
  switch (currentStatus) {
    case 'pendiente':
      if (['expert', 'admin', 'superadmin'].includes(userRole)) {
        actions.push('evaluate', 'assign-specialist', 'reject');
      }
      break;
      
    case 'en-revision':
      if (['expert', 'admin', 'superadmin'].includes(userRole)) {
        actions.push('propose-correction', 'assign-specialist', 'mark-systemic', 'reject');
      }
      break;
      
    case 'corregida-propuesta':
      if (['admin', 'superadmin'].includes(userRole)) {
        actions.push('approve', 'request-changes', 'reject');
      }
      break;
      
    case 'asignada-especialista':
    case 'revision-especialista':
      if (userRole === 'specialist') {
        actions.push('evaluate', 'return-to-supervisor', 'mark-not-applicable');
      }
      if (['admin', 'superadmin'].includes(userRole)) {
        actions.push('view', 'reassign');
      }
      break;
      
    case 'devuelta-supervisor':
      if (['expert', 'admin', 'superadmin'].includes(userRole)) {
        actions.push('review-specialist-feedback', 'reassign', 'propose-correction');
      }
      break;
      
    case 'aprobada-aplicar':
      if (['admin', 'superadmin'].includes(userRole)) {
        actions.push('apply-single', 'apply-batch', 'schedule', 'reject');
      }
      break;
      
    case 'aplicada':
      actions.push('view', 'verify-impact', 'rollback');
      break;
      
    case 'systemic-issue-detected':
      if (['admin', 'superadmin'].includes(userRole)) {
        actions.push('request-prioritization', 'dismiss', 'apply-workaround');
      }
      break;
  }
  
  return actions;
}

/**
 * Review history entry
 * Tracks all status transitions
 */
export interface ReviewHistoryEntry {
  fromStatus: ReviewStatus;
  toStatus: ReviewStatus;
  changedBy: string;
  changedByEmail: string;
  changedByRole: string;
  changedAt: Date;
  notes?: string;
  reason?: string;
  automated: boolean;               // True if system-automated
}

/**
 * Priority determination
 */
export function determinePriority(
  userStars?: number,
  expertRating?: string,
  similarQuestionsCount?: number,
  domainConfig?: DomainReviewConfig
): 'low' | 'medium' | 'high' | 'critical' {
  const config = domainConfig || {
    priorityThresholds: {
      userStarThreshold: 3,
      expertRatingThreshold: 'inaceptable',
      autoFlagInaceptable: true,
      minimumSimilarQuestions: 5
    }
  };
  
  // Critical: Expert says inaceptable + many similar questions
  if (expertRating === 'inaceptable' && 
      (similarQuestionsCount || 0) >= config.priorityThresholds.minimumSimilarQuestions) {
    return 'critical';
  }
  
  // High: Expert says inaceptable OR many user complaints
  if (expertRating === 'inaceptable' || 
      (userStars && userStars <= 2)) {
    return 'high';
  }
  
  // Medium: Below user threshold
  if (userStars && userStars <= config.priorityThresholds.userStarThreshold) {
    return 'medium';
  }
  
  // Low: Everything else
  return 'low';
}

/**
 * Calculate Domain Quality Score (DQS)
 * North Star metric: 0-100
 */
export interface DomainQualityMetrics {
  domain: string;
  period: string;                   // 'Last 30 days'
  
  // Component scores (0-100 each)
  csatScore: number;                // User satisfaction
  npsScore: number;                 // Net promoter score
  expertRatingScore: number;        // Expert evaluation avg
  resolutionScore: number;          // % resolved satisfactorily
  accuracyScore: number;            // % accurate responses
  
  // North Star Metric
  domainQualityScore: number;       // DQS: weighted average
  trend: 'improving' | 'stable' | 'declining';
  previousScore?: number;
  changeFromPrevious?: number;
  
  // Benchmarking
  platformAverage: number;
  ranking: number;                  // 1-15 (domain ranking)
  percentile: number;               // 0-100
  status: 'failing' | 'below-acceptable' | 'acceptable' | 'world-class' | 'excellence';
}

/**
 * Calculate DQS from components
 */
export function calculateDQS(metrics: {
  csatAvg: number;                  // 0-5 scale
  nps: number;                      // 0-100
  expertRatingAvg: number;          // 0-100 (inaceptable=0, aceptable=50, sobresaliente=100)
  resolutionRate: number;           // 0-1
  accuracyRate: number;             // 0-1
}): number {
  // Normalize CSAT to 0-100
  const csatNormalized = (metrics.csatAvg / 5) * 100;
  
  // NPS already 0-100
  const npsNormalized = metrics.nps;
  
  // Expert rating already 0-100
  const expertNormalized = metrics.expertRatingAvg;
  
  // Resolution and accuracy to 0-100
  const resolutionNormalized = metrics.resolutionRate * 100;
  const accuracyNormalized = metrics.accuracyRate * 100;
  
  // Weighted average (matches formula in docs)
  const dqs = 
    (csatNormalized * 0.30) +
    (npsNormalized * 0.25) +
    (expertNormalized * 0.25) +
    (resolutionNormalized * 0.10) +
    (accuracyNormalized * 0.10);
  
  return Math.round(dqs * 10) / 10; // Round to 1 decimal
}

/**
 * Get DQS status classification
 */
export function getDQSStatus(dqs: number): DomainQualityMetrics['status'] {
  if (dqs >= 90) return 'excellence';
  if (dqs >= 85) return 'world-class';
  if (dqs >= 70) return 'acceptable';
  if (dqs >= 50) return 'below-acceptable';
  return 'failing';
}

/**
 * Extended FeedbackTicket with expert review fields
 * (This extends the existing FeedbackTicket interface)
 */
export interface ExpertReviewTicket {
  // All existing FeedbackTicket fields remain
  // ... (from feedback.ts)
  
  // ✨ NEW: Domain context
  domain: string;
  domainName: string;
  
  // ✨ NEW: Review workflow
  reviewStatus: ReviewStatus;
  reviewHistory: ReviewHistoryEntry[];
  
  // ✨ NEW: Assignment
  assignment?: ExpertAssignment;
  
  // ✨ NEW: Correction proposal
  correctionProposal?: CorrectionProposal;
  
  // ✨ NEW: Impact analysis
  impactAnalysis?: ImpactAnalysis;
  
  // ✨ NEW: Impact scope
  impactScope: {
    affectsAgents: string[];
    affectsEntireDomain: boolean;
    affectsDomainPrompt: boolean;
    affectsSharedKnowledge: boolean;
  };
  
  // ✨ NEW: Approval workflow
  approvalWorkflow?: ApprovalWorkflow;
  
  // ✨ NEW: Implementation
  implementation?: ImplementationTracking;
  
  // ✨ NEW: Systemic issue tracking
  systemicIssue?: {
    detectedBy: string;
    detectedAt: Date;
    pattern: string;
    cannotFixBecause: string;
    suggestedFeature: string;
    expertRecommendation: string;
    prioritizationRequestId?: string; // Links to feature request
  };
}

/**
 * Prioritization request
 * Admin requests SuperAdmin to prioritize feature
 */
export interface PrioritizationRequest {
  id: string;                       // PRREQ-001
  
  // Request info
  requestedBy: string;              // admin@maqsa.cl
  requestedByRole: 'admin';
  requestedAt: Date;
  domain: string;
  
  // Origin
  originType: 'quality-pattern' | 'user-feedback' | 'strategic-need';
  originTickets?: string[];         // Related quality tickets
  expertAnalysis?: {
    identifiedBy: string;
    identifiedByEmail: string;
    pattern: string;
    occurrenceCount: number;
    cannotFixBecause: string;
    suggestedFeature: string;
    technicalRecommendation: string;
  };
  
  // Business case
  businessJustification: {
    impactOnDomain: string;
    userPainLevel: 'low' | 'medium' | 'high' | 'critical';
    currentWorkaround: string;
    monthlyTimeLost: number;
    monthlyCostImpact: number;
    wouldBenefitOtherDomains: boolean;
    estimatedCrossDomainImpact: string[];
  };
  
  // Admin suggestions
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  suggestedQuarter: string;
  willingToParticipateInTesting: boolean;
  
  // SuperAdmin decision
  status: 'pending' | 'reviewing' | 'approved' | 'deferred' | 'rejected';
  superadminDecision?: {
    decidedBy: string;
    decidedAt: Date;
    decision: 'promote' | 'defer' | 'reject';
    reasoning: string;
    createdRoadmapItem?: string;    // FEAT-042
    scheduledQuarter?: string;
    rejectionReason?: string;
  };
  
  // Tracking
  upvotes: number;
  comments: Array<{
    userId: string;
    userRole: string;
    comment: string;
    commentedAt: Date;
  }>;
  
  // Visibility (SuperAdmin only)
  visibleTo: ['superadmin'];
  notifiedUsers: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

/**
 * Batch correction analysis
 * AI-powered compatibility check
 */
export interface BatchAnalysis {
  batchId: string;
  ticketIds: string[];
  analyzedAt: Date;
  
  // Compatibility
  compatibilityStatus: 'safe' | 'conflicts-detected' | 'high-risk';
  conflicts: string[];
  
  // Consolidated impact
  totalAffectedQuestions: number;
  totalAffectedAgents: number;
  totalAffectedUsers: number;
  averageImprovementPercentage: number;
  totalTimeSavings: number;         // Hours/month
  totalCostReduction: number;       // USD/month
  
  // Combined changes
  combinedChanges: {
    domainPromptUpdates: string[];
    knowledgeUpdates: Array<{
      documentName: string;
      sectionCount: number;
      changeType: string;
    }>;
    faqsAdded: number;
    totalChangeCount: number;
  };
  
  // Risk assessment
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  requiresSuperAdminApproval: boolean;
  recommendedTestingLevel: 'minimal' | 'standard' | 'extensive';
  
  // AI analysis
  analysisModel: string;
  analysisTokens: number;
  analysisConfidence: number;
}

/**
 * Audit trail entry for compliance
 * Complete traceability for regulatory requirements
 */
export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  
  // Actor
  actor: {
    userId: string;
    userEmail: string;              // Encrypted at rest
    userRole: string;
    userDomain: string;
    ipAddress: string;              // Hashed
    userAgent: string;
    sessionId: string;
  };
  
  // Action
  action: {
    type: AuditActionType;
    category: 'quality-review' | 'feature-prioritization' | 'system-config';
    description: string;
    severity: 'info' | 'warning' | 'critical';
  };
  
  // Subject
  subject: {
    type: 'ticket' | 'agent' | 'domain' | 'user' | 'configuration';
    id: string;
    domain: string;
    metadata: Record<string, any>;
  };
  
  // Context
  context: {
    previousState?: any;
    newState?: any;
    diff?: any;
    reasoning?: string;
    approvals?: Array<{
      approverId: string;
      approvedAt: Date;
      approvalNotes: string;
    }>;
    relatedEntities?: string[];
  };
  
  // Compliance
  compliance: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPeriod: number;        // Days
    encryptedFields: string[];
    consentRequired: boolean;
    consentObtained?: boolean;
    regulatoryFrameworks: string[]; // GDPR, SOC2, etc.
  };
  
  // Integrity
  integrity: {
    hash: string;                   // SHA-256
    signature?: string;
    verified: boolean;
  };
  
  // Source
  correlationId?: string;
  parentAuditId?: string;
  source: 'localhost' | 'staging' | 'production';
}

/**
 * Audit action types enum
 */
export type AuditActionType =
  | 'feedback_submitted'
  | 'ticket_auto_generated'
  | 'expert_evaluation_created'
  | 'correction_proposed'
  | 'specialist_assigned'
  | 'specialist_evaluation_completed'
  | 'specialist_returned_to_supervisor'
  | 'specialist_marked_not_applicable'
  | 'admin_approved_correction'
  | 'admin_rejected_correction'
  | 'admin_requested_changes'
  | 'correction_applied_single'
  | 'correction_applied_domain_wide'
  | 'correction_batch_applied'
  | 'correction_rolled_back'
  | 'systemic_issue_identified'
  | 'feature_prioritization_requested'
  | 'superadmin_reviewed_request'
  | 'superadmin_promoted_to_roadmap'
  | 'superadmin_deferred_request'
  | 'superadmin_rejected_request'
  | 'domain_config_updated'
  | 'expert_assigned_to_domain'
  | 'specialist_added_to_domain'
  | 'unauthorized_access_attempted'
  | 'compliance_report_generated';

