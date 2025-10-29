// Feedback System Types - Flow Platform
// Created: 2025-10-29

/**
 * Feedback Types
 * - Expert feedback: Detailed quality assessment (Inaceptable/Aceptable/Sobresaliente)
 * - User feedback: Quick star rating (0-5 CSAT)
 */

export type FeedbackType = 'expert' | 'user';

export type ExpertRating = 'inaceptable' | 'aceptable' | 'sobresaliente';

export type UserRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Screenshot Annotation
 * - Supports: circle, rectangle, arrow, text
 */
export interface ScreenshotAnnotation {
  type: 'circle' | 'rectangle' | 'arrow' | 'text';
  x: number; // Starting X coordinate
  y: number; // Starting Y coordinate
  width?: number; // For rectangle
  height?: number; // For rectangle
  radius?: number; // For circle
  endX?: number; // For arrow
  endY?: number; // For arrow
  text?: string; // For text annotation
  color: string; // Annotation color
}

/**
 * Screenshot with annotations
 */
export interface AnnotatedScreenshot {
  id: string;
  imageDataUrl: string; // Base64 data URL
  annotations: ScreenshotAnnotation[];
  createdAt: Date;
  width: number;
  height: number;
}

/**
 * Message Feedback Document (Firestore)
 * Collection: message_feedback/{feedbackId}
 */
export interface MessageFeedback {
  // Identity
  id: string;
  messageId: string; // Message being rated
  conversationId: string; // Parent conversation
  userId: string; // User providing feedback
  userEmail: string; // For easy identification
  userRole: string; // User's role at time of feedback

  // Feedback Type
  feedbackType: FeedbackType; // 'expert' | 'user'

  // Expert Feedback (only if feedbackType === 'expert')
  expertRating?: ExpertRating;
  expertNotes?: string; // Detailed analysis
  npsScore?: number; // 0-10 for NPS
  csatScore?: number; // 1-5 for CSAT

  // User Feedback (only if feedbackType === 'user')
  userStars?: UserRating; // 0-5 stars
  userComment?: string; // Quick comment

  // Screenshots & Annotations
  screenshots?: AnnotatedScreenshot[];
  screenshotAnalysis?: string; // AI analysis from Gemini

  // Metadata
  timestamp: Date;
  source: 'localhost' | 'production';

  // Ticket generation
  ticketId?: string; // Created ticket ID (if generated)
  ticketCreatedAt?: Date;
}

/**
 * Feedback Ticket Document (Firestore)
 * Collection: feedback_tickets/{ticketId}
 * 
 * Tickets are created from feedback and managed in backlog
 */
export interface FeedbackTicket {
  // Identity
  id: string;
  feedbackId: string; // Source feedback
  messageId: string; // Related message
  conversationId: string; // Related conversation

  // Ticket Details
  title: string; // Auto-generated from AI analysis
  description: string; // AI-generated summary
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Assignment
  assignedTo?: string; // User ID
  assignedAt?: Date;
  
  // User & Context
  reportedBy: string; // userId
  reportedByEmail: string;
  reportedByRole: string; // For weighting feedback
  agentId?: string; // Agent involved
  agentName?: string;

  // Feedback Source
  originalFeedback: {
    type: FeedbackType;
    rating: ExpertRating | UserRating;
    comment?: string;
    screenshots?: AnnotatedScreenshot[];
    screenshotAnalysis?: string;
  };

  // AI Analysis (from Gemini)
  aiAnalysis?: {
    summary: string;
    suggestedCategory: TicketCategory;
    suggestedPriority: TicketPriority;
    actionableItems: string[];
    technicalDetails?: string;
    affectedComponents?: string[];
  };

  // Metrics
  userImpact: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: 'xs' | 's' | 'm' | 'l' | 'xl';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  source: 'localhost' | 'production';

  // Roadmap Integration
  sprintAssigned?: string; // Sprint ID
  roadmapQuarter?: string; // Q1 2025, Q2 2025, etc.
  releaseVersion?: string; // v1.2.0, etc.
}

export type TicketCategory = 
  | 'bug' 
  | 'feature-request' 
  | 'ui-improvement' 
  | 'performance' 
  | 'security'
  | 'content-quality' 
  | 'agent-behavior' 
  | 'context-accuracy'
  | 'other';

export type TicketPriority = 
  | 'critical' // P0: Blocker, immediate fix
  | 'high'     // P1: Important, next sprint
  | 'medium'   // P2: Should fix, 2-3 sprints
  | 'low';     // P3: Nice to have, backlog

export type TicketStatus =
  | 'new'           // Just created
  | 'triaged'       // Reviewed by team
  | 'prioritized'   // Added to roadmap
  | 'in-progress'   // Being worked on
  | 'in-review'     // Code review
  | 'testing'       // QA testing
  | 'done'          // Shipped
  | 'wont-fix'      // Not doing
  | 'duplicate';    // Duplicate of another ticket

/**
 * Feedback Analytics (derived from message_feedback)
 */
export interface FeedbackAnalytics {
  // Per Agent
  agentId: string;
  agentName: string;

  // Expert Feedback Stats
  expertFeedbackCount: number;
  expertRatings: {
    inaceptable: number;
    aceptable: number;
    sobresaliente: number;
  };
  expertNPS: number; // Average NPS from experts
  expertCSAT: number; // Average CSAT from experts

  // User Feedback Stats
  userFeedbackCount: number;
  userStarsAverage: number; // 0-5
  userCSAT: number; // Calculated from stars

  // Combined Metrics
  totalFeedbackCount: number;
  overallQualityScore: number; // Weighted average
  
  // Trends
  feedbackTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

/**
 * Weighted Quality Calculation
 * 
 * Expert feedback has higher weight due to domain expertise
 */
export function calculateWeightedQuality(
  expertRatings: Record<ExpertRating, number>,
  userStarsAverage: number,
  expertWeight: number = 0.7, // 70% weight to experts
  userWeight: number = 0.3    // 30% weight to users
): number {
  // Convert expert ratings to 0-100 scale
  const expertScore = (
    expertRatings.inaceptable * 0 +
    expertRatings.aceptable * 50 +
    expertRatings.sobresaliente * 100
  ) / (expertRatings.inaceptable + expertRatings.aceptable + expertRatings.sobresaliente || 1);

  // Convert user stars to 0-100 scale
  const userScore = (userStarsAverage / 5) * 100;

  // Weighted average
  return expertScore * expertWeight + userScore * userWeight;
}
