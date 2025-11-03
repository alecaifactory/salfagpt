/**
 * Evaluation System Types
 * 
 * Purpose: Type definitions for the agent evaluation system
 * Allows Experts and Admins to test agents against success criteria
 * before sharing with regular users.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Priority levels for evaluation questions
 */
export type QuestionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Status of an evaluation run
 */
export type EvaluationStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';

/**
 * Individual evaluation question
 */
export interface EvaluationQuestion {
  id: string;                          // Unique question ID (e.g., "S001-Q001")
  number: number;                      // Question number
  category: string;                    // Category ID or name
  priority: QuestionPriority;          // Priority level
  question: string;                    // The actual question text
  expectedTopics?: string[];           // Expected topics in response
  expectedDocuments?: string[];        // Expected document references
  tested?: boolean;                    // Whether it's been tested
  testResult?: {
    quality: number;                   // 1-10 rating
    phantomRefs: boolean;              // Whether phantom refs were detected
    references: number;                // Number of references
    date: string;                      // Test date (YYYY-MM-DD)
    notes?: string;                    // Additional notes
  };
}

/**
 * Category grouping for questions
 */
export interface QuestionCategory {
  id: string;                          // Category ID
  name: string;                        // Display name
  count: number;                       // Number of questions
  priority: QuestionPriority;          // Overall priority
}

/**
 * Success criteria for evaluations
 * Provided by experts/admins as context
 */
export interface SuccessCriteria {
  minimumQuality: number;              // Minimum average quality (1-10)
  allowPhantomRefs: boolean;           // Whether phantom refs are acceptable
  minCriticalCoverage: number;         // Minimum CRITICAL questions to test
  minReferenceRelevance: number;       // Minimum similarity score (0-1)
  additionalRequirements?: string;     // Free text requirements
}

/**
 * Sample answer for agent sharing approval
 */
export interface SampleAnswer {
  type: 'bad' | 'reasonable' | 'outstanding';  // Answer quality level
  question: string;                    // Sample question
  answer: string;                      // Expected answer
  explanation: string;                 // Why this is bad/reasonable/outstanding
  csatScore?: number;                  // 1-4 for reasonable/outstanding
  npsScore?: number;                   // 0-100 for reasonable/outstanding
}

/**
 * Complete evaluation definition
 * Created by Expert or Admin
 */
export interface Evaluation {
  id: string;                          // Evaluation ID (e.g., "EVAL-S001-2025-10-29-v1")
  agentId: string;                     // Agent being evaluated
  agentName: string;                   // Agent display name
  version: string;                     // Version (v1, v2, etc.)
  
  // Ownership & Access
  createdBy: string;                   // User ID of creator
  createdByEmail: string;              // Email for display
  createdAt: Date | Timestamp;         // Creation timestamp
  
  // Questions
  totalQuestions: number;              // Total count
  questions: EvaluationQuestion[];     // All questions
  categories: QuestionCategory[];      // Groupings
  
  // Success Criteria
  successCriteria: SuccessCriteria;    // Evaluation criteria
  
  // Status & Progress
  status: EvaluationStatus;            // Current status
  questionsTested: number;             // Count of tested questions
  questionsPassedQuality: number;      // Count passing quality threshold
  
  // Results
  averageQuality?: number;             // Average quality score
  phantomRefsDetected?: number;        // Count of phantom refs
  avgSimilarity?: number;              // Average reference similarity
  
  // Metadata
  source?: string;                     // Source of questions
  notes?: string;                      // Additional notes
  updatedAt?: Date | Timestamp;        // Last update
  
  // Approval
  approvedBy?: string;                 // User ID who approved
  approvedAt?: Date | Timestamp;       // Approval timestamp
  rejectionReason?: string;            // If rejected
}

/**
 * Individual test result for a question
 */
export interface TestResult {
  id: string;                          // Result ID
  evaluationId: string;                // Parent evaluation
  questionId: string;                  // Question tested
  agentId: string;                     // Agent that responded
  
  // Test execution
  testedBy: string;                    // User ID
  testedByEmail: string;               // Email for display
  testedAt: Date | Timestamp;          // Test timestamp
  
  // Input
  prompt: string;                      // Actual prompt sent
  context: string[];                   // Context sources used
  model: string;                       // Model used (flash/pro)
  
  // Response
  response: string;                    // Agent's response
  responseTime?: number;               // Response time in ms
  
  // References
  references: Array<{
    id: string;
    name: string;
    similarity: number;
    content: string;
  }>;
  
  // Quality Assessment
  quality: number;                     // 1-10 rating
  phantomRefs: boolean;                // Phantom refs detected
  expectedTopicsFound: string[];       // Topics that were found
  expectedTopicsMissing: string[];     // Topics that were missing
  
  // Evaluation
  notes?: string;                      // Evaluator notes
  passedCriteria: boolean;             // Whether it met success criteria
  
  // Tokens
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
}

/**
 * Evaluation run summary
 * One per testing session
 */
export interface EvaluationRun {
  id: string;                          // Run ID
  evaluationId: string;                // Parent evaluation
  agentId: string;                     // Agent tested
  
  // Execution
  runBy: string;                       // User ID
  runByEmail: string;                  // Email
  startedAt: Date | Timestamp;         // Start time
  completedAt?: Date | Timestamp;      // End time
  
  // Scope
  questionsToTest: string[];           // Question IDs to test
  questionsTested: string[];           // Actually tested
  
  // Results
  results: string[];                   // TestResult IDs
  averageQuality: number;              // Average score
  phantomRefsCount: number;            // Total phantom refs
  passRate: number;                    // Percentage passing criteria
  
  // Status
  status: 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
}

/**
 * Agent sharing approval request
 * Required before sharing agent with users
 */
export interface AgentSharingApproval {
  id: string;                          // Approval request ID
  agentId: string;                     // Agent to share
  agentName: string;                   // Display name
  
  // Requester
  requestedBy: string;                 // User ID
  requestedByEmail: string;            // Email
  requestedAt: Date | Timestamp;       // Request timestamp
  
  // Required samples (3 minimum)
  sampleQuestions: SampleAnswer[];     // Bad, reasonable, outstanding
  
  // Evaluation results
  evaluationId?: string;               // Optional linked evaluation
  evaluationPassed?: boolean;          // Whether evaluation passed
  
  // Approval
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;                 // Expert/Admin who reviewed
  reviewedByEmail?: string;            // Email
  reviewedAt?: Date | Timestamp;       // Review timestamp
  reviewNotes?: string;                // Reviewer notes
}

/**
 * Firestore collection names
 */
export const EVALUATION_COLLECTIONS = {
  EVALUATIONS: 'evaluations',
  TEST_RESULTS: 'test_results',
  EVALUATION_RUNS: 'evaluation_runs',
  AGENT_SHARING_APPROVALS: 'agent_sharing_approvals',
} as const;






