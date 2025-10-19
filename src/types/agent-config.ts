// Agent Configuration Types

export interface AgentRequirementsDoc {
  // Document metadata
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  fileUrl?: string; // Cloud Storage URL
  
  // Extracted configuration
  extractedConfig: AgentConfiguration;
  
  // Extraction metadata
  extractionProgress?: ExtractionProgress;
  extractedAt?: Date;
  extractionModel?: string;
}

export interface AgentConfiguration {
  // ===== CORE FIELDS (Always from ARD) =====
  agentName: string;
  agentPurpose: string;
  targetAudience: string[]; // End users
  pilotUsers?: string[]; // NEW - Pilot/testing users from ARD
  
  // ===== MODEL & BEHAVIOR (Auto-generated from ARD) =====
  recommendedModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  tone: string; // Extracted from "Respuestas Tipo"
  
  // ===== INPUT/OUTPUT SPECS (From ARD) =====
  expectedInputTypes?: string[]; // Optional - auto-categorized
  expectedInputExamples: InputExample[]; // From "Preguntas Tipo"
  expectedOutputFormat: string; // From "Respuestas Tipo"
  expectedOutputExamples?: OutputExample[]; // Optional - can be generated
  responseRequirements: ResponseRequirements;
  
  // ===== CONTEXT SOURCES (From ARD or inferred) =====
  requiredContextSources: string[]; // From document table or inferred
  
  // ===== RAG CONFIGURATION (NEW) =====
  ragEnabled?: boolean;              // Enable RAG for this agent (default: true)
  ragTopK?: number;                  // Chunks to retrieve (default: 5)
  ragMinSimilarity?: number;         // Min similarity threshold (default: 0.5)
  ragFallbackToFullText?: boolean;   // Auto-fallback if no results (default: true)
  detectedSources?: DetectedSource[]; // NEW - Auto-detected from questions
  
  // ===== DOMAIN EXPERT (From ARD) =====
  domainExpert?: {
    name: string;
    email?: string; // Optional
    department?: string; // Optional
    role?: string; // Optional
  };
  
  // ===== OPTIONAL/LEGACY FIELDS (Backward compatibility) =====
  businessCase?: BusinessCase; // Optional - rarely filled from ARD
  qualityCriteria?: QualityCriterion[]; // Optional - can be auto-generated
  undesirableOutputs?: UndesirableOutput[]; // Optional - can be auto-generated
  acceptanceCriteria?: AcceptanceCriterion[]; // Optional - can be auto-generated
  recommendedContextSources?: string[]; // Optional - legacy field
  companyContext?: CompanyContext; // Optional - rarely in ARD
  evaluationCriteria?: EvaluationCriterion[]; // Optional - separate feature
  successMetrics?: SuccessMetric[]; // Optional - separate feature
  
  // ===== VERSION CONTROL =====
  version?: string;
  createdAt?: Date;
  lastUpdatedAt?: Date;
  lastUpdatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  certificationExpiresAt?: Date;
}

// NEW - Detected source from question analysis
export interface DetectedSource {
  name: string; // e.g., "LGUC", "OGUC", "DDU"
  mentions: number; // How many times mentioned in questions
  isLoaded: boolean; // Whether user has uploaded this source
  priority: 'critical' | 'recommended' | 'optional';
}

export interface BusinessCase {
  painPoint: string; // What problem does this solve?
  affectedPersonas: string[]; // Who has this pain?
  businessArea: string; // Department or business unit
  businessImpact: BusinessImpact;
  alignment: {
    companyOKRs: string[];
    departmentGoals: string[];
    strategicValue: 'high' | 'medium' | 'low';
  };
  roi: {
    timeSaved?: string; // e.g., "2 hours per day per user"
    costSaved?: string; // e.g., "$50K annually"
    qualityImprovement?: string; // e.g., "30% fewer errors"
    userSatisfactionTarget?: number; // 1-5 stars
  };
}

export interface BusinessImpact {
  quantitative: {
    usersAffected: number;
    frequency: string; // e.g., "50 queries per day"
    timeSavingsPerQuery?: string;
    estimatedAnnualValue?: string;
  };
  qualitative: {
    description: string;
    benefitAreas: string[];
    risksMitigated: string[];
  };
}

export interface ResponseRequirements {
  format: string; // e.g., "Bullet points", "Paragraph", "JSON"
  length: {
    min?: number; // words/chars
    max?: number;
    target?: number;
  };
  precision: 'exact' | 'approximate' | 'qualitative';
  speed: {
    target: number; // seconds
    maximum: number; // seconds
  };
  mustInclude: string[]; // Required elements
  mustAvoid: string[]; // Forbidden elements
  citations: boolean; // Must cite sources?
}

export interface AcceptanceCriterion {
  id: string;
  criterion: string;
  description: string;
  isRequired: boolean;
  testable: boolean;
  howToTest: string;
}

export interface CompanyContext {
  companyUrl?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  okrs?: OKR[];
  brandGuidelines?: string;
  communicationStyle?: string;
}

export interface OKR {
  objective: string;
  keyResults: string[];
  quarter?: string;
  owner?: string;
}

export interface InputExample {
  id: string;
  category: string;
  question: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface OutputExample {
  id: string;
  input: string;
  output: string;
  explanation: string;
  isCorrect: boolean;
}

export interface QualityCriterion {
  id: string;
  criterion: string;
  weight: number; // 0-1
  description: string;
  examples: string[];
}

export interface UndesirableOutput {
  id: string;
  example: string;
  reason: string;
  howToAvoid: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
  passingScore: number; // 0-100
}

export interface SuccessMetric {
  id: string;
  metric: string;
  target: number;
  unit: string;
  description: string;
}

export interface ExtractionProgress {
  stage: 'uploading' | 'analyzing' | 'extracting-purpose' | 'mapping-inputs' | 'mapping-outputs' | 'extracting-criteria' | 'generating-config' | 'complete' | 'error';
  percentage: number; // 0-100
  message: string;
  currentStep?: number;
  totalSteps?: number;
  startTime?: number;
  elapsedSeconds?: number;
}

export interface AgentEvaluation {
  id: string;
  agentId: string;
  agentVersion: string;
  evaluatorId: string;
  evaluatorEmail: string;
  evaluatorRole: string; // expert, reviewer, etc.
  evaluatedAt: Date;
  
  // Test Results
  testInputs: TestResult[];
  overallScore: number; // 0-100
  
  // Criterion Scores
  criterionScores: {
    criterionId: string;
    score: number; // 0-100
    notes: string;
    evidence: string[]; // Example responses
  }[];
  
  // Recommendations
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedSystemPromptChanges?: string;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  
  // Approval
  approved: boolean;
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Tracking
  consideredForNextIteration: boolean;
  implementedInVersion?: string;
  implementedAt?: Date;
}

export interface UserFeedback {
  id: string;
  agentId: string;
  agentVersion: string;
  messageId: string;
  userId: string;
  userEmail: string;
  
  // CSAT Rating
  rating: 1 | 2 | 3 | 4 | 5; // 1 = very poor, 5 = excellent
  comment?: string;
  feedbackCategory?: string[]; // e.g., ["accuracy", "clarity", "speed"]
  
  // Context
  userQuestion: string;
  aiResponse: string;
  contextUsed: string[];
  
  // Timestamps
  createdAt: Date;
  
  // Review by Expert
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  consideredForImprovement: boolean;
  priority: 'high' | 'medium' | 'low';
  implementedInVersion?: string;
}

export interface AgentVersion {
  version: string; // e.g., "1.0.0", "1.1.0"
  agentId: string;
  createdAt: Date;
  createdBy: string;
  
  // Configuration snapshot
  configuration: AgentConfiguration;
  
  // Changes from previous version
  changeNotes?: string;
  changedFields?: string[];
  
  // Status
  status: 'draft' | 'testing' | 'approved' | 'active' | 'deprecated';
  approvedBy?: string;
  approvedAt?: Date;
  certificationExpiresAt?: Date;
  
  // Metrics during this version
  totalQueries?: number;
  averageRating?: number;
  feedbackCount?: number;
}

export interface TestResult {
  id: string;
  inputId: string; // Reference to InputExample
  input: string;
  expectedOutput: string;
  actualOutput: string;
  score: number; // 0-100
  passed: boolean;
  evaluatorNotes: string;
  criteria: {
    criterionId: string;
    met: boolean;
    notes: string;
  }[];
}

export interface AgentPromptTemplate {
  sections: {
    purpose: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
    audience: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
    inputs: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
    outputs: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
    quality: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
    undesirable: {
      prompt: string;
      examples: string[];
      placeholder: string;
    };
  };
}

