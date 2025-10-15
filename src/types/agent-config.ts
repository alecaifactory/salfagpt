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
  // Basic Info
  agentName: string;
  agentPurpose: string;
  targetAudience: string[];
  
  // Model & Behavior
  recommendedModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  tone: string; // e.g., "professional", "friendly", "technical"
  
  // Input/Output Specs
  expectedInputTypes: string[];
  expectedInputExamples: InputExample[];
  expectedOutputFormat: string;
  expectedOutputExamples: OutputExample[];
  
  // Quality Criteria
  qualityCriteria: QualityCriterion[];
  undesirableOutputs: UndesirableOutput[];
  
  // Context Sources
  requiredContextSources: string[];
  recommendedContextSources: string[];
  
  // Domain Expert
  domainExpert?: {
    name: string;
    email: string;
    department: string;
    role: string;
  };
  
  // Evaluation
  evaluationCriteria: EvaluationCriterion[];
  successMetrics: SuccessMetric[];
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
  evaluatorId: string;
  evaluatorEmail: string;
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
  
  // Approval
  approved: boolean;
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
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

