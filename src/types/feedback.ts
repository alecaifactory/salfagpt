/**
 * Feedback & Roadmap Management System Types
 * 
 * Complete TypeScript interfaces for the feedback, backlog, and roadmap system.
 * See: .cursor/rules/feedback-system.mdc for full documentation
 */

// Using Firestore admin SDK types
export type Timestamp = Date;

// ============================================================================
// FEEDBACK SESSIONS
// ============================================================================

export type FeedbackSessionType = 
  | 'feature_request' 
  | 'bug_report' 
  | 'general_feedback' 
  | 'ui_improvement';

export type FeedbackSessionStatus = 
  | 'active'           // User is chatting
  | 'submitted'        // User submitted
  | 'under_review'     // Admin reviewing
  | 'accepted'         // Approved by admin
  | 'rejected'         // Rejected
  | 'implemented';     // Feature shipped

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FeedbackMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    screenshotId?: string;
    annotationId?: string;
  };
}

export interface Screenshot {
  id: string;
  url: string;                      // Public URL (signed)
  gcsPath: string;                  // gs://bucket/path
  annotations: Annotation[];
  capturedAt: Date;
  pageUrl: string;
  viewport: {
    width: number;
    height: number;
  };
}

export type AnnotationType = 'arrow' | 'box' | 'circle' | 'text' | 'highlight' | 'pen';

export interface Annotation {
  id: string;
  type: AnnotationType;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color: string;
  strokeWidth?: number;
  text?: string;
  screenshotId?: string;
}

export interface FeedbackSession {
  id: string;
  userId: string;
  companyId: string;
  
  // Session Context
  sessionType: FeedbackSessionType;
  status: FeedbackSessionStatus;
  priority: FeedbackPriority;
  
  // Conversation
  messages: FeedbackMessage[];
  
  // User Input
  title?: string;
  description?: string;
  screenshots: Screenshot[];
  annotations: Annotation[];
  
  // AI Analysis
  aiSummary?: string;
  extractedRequirements?: string[];
  useCaseDefinition?: string;
  successCriteria?: string[];
  expectedCSATImpact?: number;      // 1-5
  expectedNPSImpact?: number;       // -100 to 100
  
  // Admin Review
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Roadmap Integration
  backlogItemId?: string;
  roadmapItemId?: string;
  worktreeId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  source: 'localhost' | 'production';
}

// ============================================================================
// BACKLOG ITEMS
// ============================================================================

export type BacklogItemType = 
  | 'feature' 
  | 'enhancement' 
  | 'bug' 
  | 'technical_debt' 
  | 'research';

export type BacklogCategory = 
  | 'ui' 
  | 'api' 
  | 'performance' 
  | 'security' 
  | 'integration' 
  | 'other';

export type BacklogStatus = 
  | 'new'           // Just created
  | 'groomed'       // Refined with details
  | 'ready'         // Ready to start
  | 'in_progress'   // Being worked on
  | 'review'        // In PR review
  | 'done'          // Completed
  | 'rejected';     // Not doing

export type BacklogLane = 'backlog' | 'next' | 'now' | 'done';

export type EffortEstimate = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface BacklogItem {
  id: string;
  companyId: string;
  
  // Content
  title: string;
  description: string;
  userStory: string;                // As a [user], I want [feature], so that [benefit]
  acceptanceCriteria: string[];
  
  // Source
  feedbackSessionIds: string[];
  createdBy: 'user' | 'admin' | 'ai';
  createdByUserId?: string;
  
  // Classification
  type: BacklogItemType;
  category: BacklogCategory;
  tags: string[];
  
  // Priority & Impact
  priority: FeedbackPriority;
  estimatedEffort: EffortEstimate;
  estimatedCSATImpact: number;
  estimatedNPSImpact: number;
  affectedUsers: number;
  
  // OKR Alignment
  alignedOKRs: string[];
  okrImpactScore: number;           // 1-10
  
  // Kanban State
  status: BacklogStatus;
  lane: BacklogLane;
  position: number;
  
  // Assignment
  assignedTo?: string;
  worktreeId?: string;
  branchName?: string;
  prUrl?: string;
  
  // Timeline
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  targetReleaseDate?: Date;
  
  source: 'localhost' | 'production';
}

// ============================================================================
// ROADMAP ITEMS
// ============================================================================

export type RoadmapStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type StrategicValue = 'low' | 'medium' | 'high' | 'critical';

export interface RoadmapItem {
  id: string;
  companyId: string;
  
  // Content
  title: string;
  description: string;
  objectives: string[];
  
  // Composition
  backlogItemIds: string[];
  feedbackSessionIds: string[];
  
  // Planning
  quarter: string;                  // 'Q1 2025'
  status: RoadmapStatus;
  progress: number;                 // 0-100
  
  // Impact Analysis
  estimatedCSATImpact: number;
  estimatedNPSImpact: number;
  affectedUsers: number;
  estimatedRevenue?: number;
  
  // OKR Alignment
  alignedOKRs: string[];
  okrImpactScore: number;
  strategicValue: StrategicValue;
  
  // AI Analysis
  aiRationale?: string;
  aiPriorityScore?: number;         // 0-100
  aiRecommendedQuarter?: string;
  
  // Admin Review
  adminApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  adminNotes?: string;
  
  // Timeline
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  source: 'localhost' | 'production';
}

// ============================================================================
// AGENT MEMORY
// ============================================================================

export type CommunicationStyle = 'concise' | 'detailed' | 'visual';

export interface FeedbackAgentMemory {
  id: string;                       // userId
  userId: string;
  companyId: string;
  
  // Context Awareness
  previousFeedback: Array<{
    sessionId: string;
    summary: string;
    submittedAt: Date;
  }>;
  
  // User Preferences
  preferredCommunicationStyle: CommunicationStyle;
  commonPainPoints: string[];
  frequentFeatureRequests: string[];
  
  // Interaction Stats
  totalSessions: number;
  averageSessionLength: number;
  lastInteractionAt: Date;
  
  updatedAt: Date;
  source: 'localhost' | 'production';
}

// ============================================================================
// COMPANY OKRS
// ============================================================================

export interface KeyResult {
  id: string;
  description: string;
  metric: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
}

export interface CompanyOKR {
  id: string;
  companyId: string;
  
  // OKR Definition
  objective: string;
  keyResults: KeyResult[];
  
  // Timeline
  quarter: string;
  year: number;
  status: 'active' | 'completed' | 'cancelled';
  
  // Tracking
  currentProgress: number;          // 0-100
  targetProgress: number;
  onTrack: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

// ============================================================================
// WORKTREE ASSIGNMENTS
// ============================================================================

export type WorktreeStatus = 
  | 'setup' 
  | 'in_progress' 
  | 'review' 
  | 'merged' 
  | 'abandoned';

export interface WorktreeAssignment {
  id: string;
  
  // Worktree Details
  worktreePath: string;
  branchName: string;
  port: number;                     // 3001-3003
  
  // Assignment
  backlogItemId: string;
  assignedTo: string;
  
  // Status
  status: WorktreeStatus;
  progress: number;                 // 0-100
  
  // Git Integration
  commits: number;
  filesChanged: number;
  lastCommitAt?: Date;
  prUrl?: string;
  mergedAt?: Date;
  
  // Timeline
  createdAt: Date;
  updatedAt: Date;
  
  source: 'localhost' | 'production';
}

// ============================================================================
// EMBEDDABLE WIDGET
// ============================================================================

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetTheme = 'light' | 'dark' | 'auto';

export interface FeedbackWidgetConfig {
  // Required
  companyId: string;
  userId: string;
  apiKey: string;
  
  // Optional
  position?: WidgetPosition;
  theme?: WidgetTheme;
  language?: 'en' | 'es' | 'pt';
  
  // Customization
  primaryColor?: string;
  buttonLabel?: string;
  welcomeMessage?: string;
  
  // Features
  enableScreenshots?: boolean;
  enableAnnotations?: boolean;
  autoCapturePage?: boolean;
  
  // Callbacks
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, summary: string) => void;
  onFeedbackSubmitted?: (feedbackId: string) => void;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface FeedbackMetrics {
  // Volume
  totalSessions: number;
  activeSessionsToday: number;
  submittedThisWeek: number;
  
  // By Type
  byType: Record<FeedbackSessionType, number>;
  
  // Status Distribution
  byStatus: Record<FeedbackSessionStatus, number>;
  
  // User Engagement
  avgSessionLength: number;
  avgTimeToSubmit: number;
  screenshotsPerSession: number;
  
  // Impact
  avgCSATImpact: number;
  avgNPSImpact: number;
  totalAffectedUsers: number;
}

export interface RoadmapMetrics {
  // By Quarter
  plannedItems: number;
  inProgressItems: number;
  completedItems: number;
  
  // Impact
  totalCSATImpact: number;
  totalNPSImpact: number;
  totalAffectedUsers: number;
  
  // OKR Alignment
  okrCoverage: number;              // 0-100%
  avgOKRImpactScore: number;
  
  // Velocity
  itemsCompletedLastQuarter: number;
  avgTimeToComplete: number;
  velocityTrend: 'up' | 'down' | 'stable';
}

// ============================================================================
// ANNOTATION TOOLS
// ============================================================================

export type AnnotationTool = 
  | 'select' 
  | 'arrow' 
  | 'box' 
  | 'circle' 
  | 'text' 
  | 'highlight' 
  | 'pen' 
  | 'eraser';

export interface AnnotationToolbar {
  tools: AnnotationTool[];
  selectedTool: AnnotationTool;
  colors: string[];
  selectedColor: string;
  strokeWidth: number;              // 2-10
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CreateFeedbackSessionRequest {
  userId: string;
  companyId: string;
  sessionType: FeedbackSessionType;
  initialMessage?: string;
}

export interface SubmitFeedbackRequest {
  sessionId: string;
  title: string;
  description: string;
}

export interface AdminReviewRequest {
  sessionId: string;
  action: 'approve' | 'reject' | 'request_more_info';
  adminNotes?: string;
  createBacklogItem?: boolean;
}

export interface CreateBacklogItemRequest {
  companyId: string;
  feedbackSessionIds: string[];
  title: string;
  description: string;
  type: BacklogItemType;
  priority: FeedbackPriority;
  estimatedEffort: EffortEstimate;
}

export interface RoadmapAnalysisRequest {
  companyId: string;
  quarter: string;
  feedbackSessionIds?: string[];    // Specific sessions or all
}

export interface RoadmapAnalysisResponse {
  clusters: Array<{
    theme: string;
    feedbackIds: string[];
    impactScore: number;
  }>;
  newBacklogItems: Partial<BacklogItem>[];
  priorityChanges: Array<{
    itemId: string;
    currentPriority: FeedbackPriority;
    suggestedPriority: FeedbackPriority;
    rationale: string;
  }>;
  roadmapRecommendations: Partial<RoadmapItem>[];
  rationale: string;
  expectedOutcomes: {
    csatImprovement: number;
    npsImprovement: number;
    okrProgress: Record<string, number>;
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface DataSource {
  source: 'localhost' | 'production';
}

// ============================================================================
// FEEDBACK TICKETS (Viral Loop)
// ============================================================================

export interface FeedbackTicket {
  id: string;                       // Firestore document ID
  ticketId: string;                 // Human-readable ID (FEAT-1234)
  sessionId: string;                // Associated feedback session
  userId: string;                   // Creator
  companyId: string;                // Company
  
  // Content (minimal for privacy)
  type: FeedbackSessionType;
  title: string;
  status: FeedbackSessionStatus;
  priority: FeedbackPriority;
  
  // Backlog Integration
  backlogItemId?: string;
  roadmapItemId?: string;
  targetQuarter?: string;
  
  // Social Features (Viral Loop)
  upvotes: number;
  upvotedBy: string[];              // User IDs
  views: number;
  viewedBy: string[];
  shares: number;
  sharedBy: string[];
  shareChain: Array<{
    sharedBy: string;
    sharedTo: string;
    sharedAt: Date;
    resultingUpvotes: number;
    resultingShares: number;
    depth: number;
  }>;
  viralCoefficient: number;
  
  // Privacy
  isPublic: boolean;                // false = company-internal only
  requiresAuth: boolean;            // true = must login to view
  
  // Timeline
  createdAt: Date;
  updatedAt: Date;
  
  source: 'localhost' | 'production';
}

export interface ShareCard {
  ticketId: string;
  shareUrl: string;
  
  // Public preview (no auth)
  preview: {
    emoji: string;
    type: string;
    createdBy: string;              // Anonymized
    company: string;
    upvotes: number;
    timeAgo: string;
  };
  
  // Authenticated view
  authenticated?: {
    title: string;
    description: string;
    screenshots: string[];
    aiAnalysis?: string;
    impactScores: {
      csat: number;
      nps: number;
      affectedUsers: number;
    };
    currentStatus: string;
    targetQuarter?: string;
  };
  
  // Metadata
  ogImage?: string;
  deepLink?: string;
  trackingToken?: string;
}

// Export utility type for Firestore timestamps
export type FirestoreTimestamp = Timestamp;

