/**
 * Agent Testing & Quality Evaluation System
 * 
 * Types for agent-specific test questions, quality criteria, and evaluation results
 */

export type ResponseQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface TestQuestion {
  id: string;
  agentId: string;
  question: string;
  category: string;                     // 'procedure', 'code', 'concept', 'regulation'
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Expected response characteristics
  expectedKeywords?: string[];          // Keywords that should appear
  expectedReferences?: number;          // Min number of references expected
  expectedSteps?: boolean;              // Should have numbered steps
  
  createdAt: Date;
  createdBy: string;
  enabled: boolean;                     // Active for testing
}

export interface ResponseExample {
  id: string;
  questionId: string;
  agentId: string;
  
  // Example response
  responseText: string;
  quality: ResponseQuality;             // poor | fair | good | excellent
  
  // Quality criteria
  qualityCriteria: QualityCriteria;
  
  // Explanation
  explanation: string;                  // Why this quality rating
  whatsMissing?: string;                // For poor/fair examples
  whatsGood?: string;                   // For good/excellent examples
  
  createdAt: Date;
  createdBy: string;
}

export interface QualityCriteria {
  // Completeness
  answersQuestion: boolean;             // Actually answers what was asked
  providesDetails: boolean;             // Not just generic response
  includesSteps: boolean;               // Has actionable steps (if applicable)
  
  // Accuracy
  hasReferences: boolean;               // Cites documents
  referencesValid: boolean;             // References are real (no hallucination)
  informationAccurate: boolean;         // Factually correct
  
  // Quality
  wellStructured: boolean;              // Clear organization
  easyToUnderstand: boolean;            // Not overly technical
  noIrrelevantInfo: boolean;            // Stays on topic
  
  // Overall
  overallScore: number;                 // 0-100
  passesQuality: boolean;               // Meets minimum bar
}

export interface TestExecution {
  id: string;
  questionId: string;
  agentId: string;
  
  // Execution context
  executedAt: Date;
  executedBy: string;
  
  // Agent configuration used
  agentConfig: {
    model: string;
    systemPrompt: string;
    temperature: number;
    contextSources: string[];           // IDs of active sources
    contextSourcesCount: number;
  };
  
  // Question asked
  question: string;
  
  // Response received
  response: string;
  references: any[];
  thinkingSteps?: any[];
  
  // Evaluation
  evaluatedQuality: ResponseQuality;
  qualityCriteria: QualityCriteria;
  passedQuality: boolean;
  
  // Metrics
  responseTime: number;                 // milliseconds
  tokensInput: number;
  tokensOutput: number;
  contextWindowUsed: number;
  
  // Comparison to examples
  matchedExample?: string;              // ID of example it's similar to
  similarityToGood?: number;            // 0-1, how similar to good examples
}

export interface AgentTestingConfig {
  id: string;                           // agentId
  agentId: string;
  agentName: string;
  
  // Testing enabled/disabled
  testingEnabled: boolean;
  
  // Questions
  testQuestions: string[];              // IDs of TestQuestion
  totalQuestions: number;
  
  // Examples
  responseExamples: string[];           // IDs of ResponseExample
  poorExamples: number;
  fairExamples: number;
  goodExamples: number;
  excellentExamples: number;
  
  // Test history
  totalExecutions: number;
  lastExecutionAt?: Date;
  
  // Quality stats
  avgQualityScore: number;              // 0-100
  passRate: number;                     // 0-1 (% that pass quality)
  
  // Updated
  updatedAt: Date;
  updatedBy: string;
}

export interface BulkEvaluationRun {
  id: string;
  agentId: string;
  
  // Execution
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  
  // Questions tested
  questionIds: string[];
  totalQuestions: number;
  questionsCompleted: number;
  
  // Results
  executions: string[];                 // IDs of TestExecution
  
  // Summary
  avgQualityScore: number;
  passRate: number;
  
  byQuality: {
    poor: number;
    fair: number;
    good: number;
    excellent: number;
  };
  
  // Performance
  avgResponseTime: number;
  totalTokensUsed: number;
  totalCost: number;
}

// Export for Firestore
export interface FirestoreTestQuestion extends Omit<TestQuestion, 'createdAt'> {
  createdAt: any; // Firestore Timestamp
}

export interface FirestoreResponseExample extends Omit<ResponseExample, 'createdAt'> {
  createdAt: any;
}

export interface FirestoreTestExecution extends Omit<TestExecution, 'executedAt'> {
  executedAt: any;
}

export interface FirestoreAgentTestingConfig extends Omit<AgentTestingConfig, 'updatedAt' | 'lastExecutionAt'> {
  updatedAt: any;
  lastExecutionAt?: any;
}

export interface FirestoreBulkEvaluationRun extends Omit<BulkEvaluationRun, 'startedAt' | 'completedAt'> {
  startedAt: any;
  completedAt?: any;
}

