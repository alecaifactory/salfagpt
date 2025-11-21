import { z } from 'zod';

// ============================================================================
// PROJECT ESTIMATION SCHEMAS
// ============================================================================

export const ProjectStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  optimisticHours: z.number().min(0),
  realisticHours: z.number().min(0),
  pessimisticHours: z.number().min(0),
  complexity: z.enum(['low', 'medium', 'high', 'very-high']),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const ProjectEstimationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(ProjectStepSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(['planning', 'in-progress', 'completed', 'cancelled']),
  
  // Estimation metadata
  estimatedTotalHours: z.number(),
  historicalFactor: z.number().default(1.0), // 0.7 = complete 30% faster
  calibratedHours: z.number(),
  confidenceLevel: z.number().min(0).max(1).default(0.5),
  
  // Tracking
  actualHours: z.number().optional(),
  completedSteps: z.array(z.string()).default([]),
  
  // Context
  userId: z.string(),
  organizationId: z.string().optional(),
  projectType: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const StepExecutionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  stepId: z.string(),
  
  // Timing
  startedAt: z.date(),
  completedAt: z.date().optional(),
  estimatedHours: z.number(),
  actualHours: z.number().optional(),
  
  // Output metrics
  tokensGenerated: z.number().optional(),
  linesOfCode: z.number().optional(),
  filesCreated: z.number().optional(),
  filesModified: z.number().optional(),
  
  // Quality metrics
  iterationsNeeded: z.number().default(1),
  typeErrorsFound: z.number().default(0),
  runtimeErrorsFound: z.number().default(0),
  testsPassed: z.number().optional(),
  testsFailed: z.number().optional(),
  
  // AI metrics
  aiModel: z.string().optional(),
  aiCost: z.number().optional(),
  aiTokensInput: z.number().optional(),
  aiTokensOutput: z.number().optional(),
  
  // Notes
  notes: z.string().optional(),
  blockers: z.array(z.string()).default([]),
});

export const HistoricalDataPointSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  
  // What was estimated vs reality
  estimatedHours: z.number(),
  actualHours: z.number(),
  accuracyFactor: z.number(), // actual / estimated
  
  // Context for calibration
  projectType: z.string(),
  complexity: z.enum(['low', 'medium', 'high', 'very-high']),
  teamSize: z.number().default(1),
  aiAssisted: z.boolean().default(false),
  
  // Metadata
  completedAt: z.date(),
  userId: z.string(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const CalibrationModelSchema = z.object({
  id: z.string(),
  version: z.string(),
  
  // Calculated factors
  overallFactor: z.number(), // Global average
  factorByComplexity: z.record(z.number()),
  factorByProjectType: z.record(z.number()),
  factorByUser: z.record(z.number()),
  
  // Statistical data
  dataPointsCount: z.number(),
  confidenceInterval: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  
  // Metadata
  lastUpdated: z.date(),
  minDataPoints: z.number().default(3),
});

// ============================================================================
// MCP TOOL SCHEMAS
// ============================================================================

export const EstimateProjectInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    name: z.string(),
    description: z.string(),
    optimisticHours: z.number(),
    realisticHours: z.number(),
    pessimisticHours: z.number(),
    complexity: z.enum(['low', 'medium', 'high', 'very-high']),
  })),
  projectType: z.string().optional(),
  useHistoricalCalibration: z.boolean().default(true),
});

export const TrackProgressInputSchema = z.object({
  projectId: z.string(),
  stepId: z.string(),
  actualHours: z.number(),
  tokensGenerated: z.number().optional(),
  linesOfCode: z.number().optional(),
  notes: z.string().optional(),
});

export const GetCalibrationInputSchema = z.object({
  projectType: z.string().optional(),
  complexity: z.enum(['low', 'medium', 'high', 'very-high']).optional(),
  minDataPoints: z.number().default(3),
});

// ============================================================================
// TYPESCRIPT TYPES (Inferred)
// ============================================================================

export type ProjectStep = z.infer<typeof ProjectStepSchema>;
export type ProjectEstimation = z.infer<typeof ProjectEstimationSchema>;
export type StepExecution = z.infer<typeof StepExecutionSchema>;
export type HistoricalDataPoint = z.infer<typeof HistoricalDataPointSchema>;
export type CalibrationModel = z.infer<typeof CalibrationModelSchema>;

export type EstimateProjectInput = z.infer<typeof EstimateProjectInputSchema>;
export type TrackProgressInput = z.infer<typeof TrackProgressInputSchema>;
export type GetCalibrationInput = z.infer<typeof GetCalibrationInputSchema>;

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface EstimationAnalysis {
  project: ProjectEstimation;
  
  // Time breakdown
  totalEstimated: number;
  totalCalibrated: number;
  byComplexity: Record<string, number>;
  byPhase: Record<string, number>;
  
  // Statistical
  confidence: number;
  historicalFactor: number;
  variance: number;
  
  // Projections
  optimisticCompletion: Date;
  realisticCompletion: Date;
  pessimisticCompletion: Date;
  
  // Recommendations
  warnings: string[];
  suggestions: string[];
}

export interface ProgressReport {
  project: ProjectEstimation;
  executions: StepExecution[];
  
  // Progress metrics
  completionPercentage: number;
  hoursSpent: number;
  hoursRemaining: number;
  
  // Accuracy tracking
  currentAccuracyFactor: number; // actual / estimated so far
  projectedTotalHours: number; // based on current performance
  
  // Velocity
  averageHoursPerStep: number;
  stepsPerDay: number;
  
  // Quality
  averageIterations: number;
  errorRate: number;
  
  // Timeline
  estimatedCompletion: Date;
  onTrack: boolean;
  daysAheadBehind: number;
}

export interface CalibrationReport {
  model: CalibrationModel;
  
  // Summary
  totalProjects: number;
  averageFactor: number;
  medianFactor: number;
  standardDeviation: number;
  
  // Insights
  mostAccurateDomain: string;
  leastAccurateDomain: string;
  improvementTrend: 'improving' | 'declining' | 'stable';
  
  // Recommendations
  recommendations: string[];
}


