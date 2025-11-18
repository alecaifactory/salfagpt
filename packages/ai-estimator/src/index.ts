// ============================================================================
// @salfagpt/ai-estimator - Main SDK Export
// ============================================================================

// Types
export type {
  ProjectStep,
  ProjectEstimation,
  StepExecution,
  HistoricalDataPoint,
  CalibrationModel,
  EstimateProjectInput,
  TrackProgressInput,
  GetCalibrationInput,
  EstimationAnalysis,
  ProgressReport,
  CalibrationReport,
} from './types.js';

// Engines
export {
  EstimationEngine,
  CalibrationEngine,
  ProgressTracker,
} from './estimation-engine.js';

// Database
export type { DatabaseAdapter } from './database.js';
export { FirestoreAdapter, InMemoryAdapter } from './database.js';

// ============================================================================
// CONVENIENCE API
// ============================================================================

import { EstimationEngine, CalibrationEngine, ProgressTracker } from './estimation-engine.js';
import type {
  ProjectStep,
  ProjectEstimation,
  EstimationAnalysis,
  CalibrationModel,
  HistoricalDataPoint,
} from './types.js';

/**
 * Quick estimation without database
 */
export function estimateProject(
  steps: ProjectStep[],
  options: {
    historicalFactor?: number;
    projectName?: string;
    projectDescription?: string;
    projectType?: string;
    userId?: string;
  } = {}
): EstimationAnalysis {
  const {
    historicalFactor = 1.0,
    projectName = 'Unnamed Project',
    projectDescription = '',
    projectType = 'general',
    userId = 'anonymous',
  } = options;

  const estimation = EstimationEngine.estimateProject(steps, historicalFactor);

  const project: ProjectEstimation = {
    id: 'temp-estimate',
    name: projectName,
    description: projectDescription,
    steps,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'planning',
    estimatedTotalHours: estimation.totalEstimated,
    historicalFactor,
    calibratedHours: estimation.totalCalibrated,
    confidenceLevel: estimation.overallConfidence,
    completedSteps: [],
    userId,
    projectType,
    tags: [],
  };

  return EstimationEngine.analyzeEstimation(project);
}

/**
 * Calculate calibration from historical data
 */
export function calculateCalibration(
  dataPoints: HistoricalDataPoint[],
  version: string = '1.0.0'
): CalibrationModel {
  return CalibrationEngine.buildCalibrationModel(dataPoints, version);
}

/**
 * Get best factor for a specific context
 */
export function getBestFactor(
  calibrationModel: CalibrationModel,
  context: {
    projectType?: string;
    complexity?: string;
    userId?: string;
  }
): number {
  return CalibrationEngine.getBestFactorForProject(
    calibrationModel,
    context.projectType,
    context.complexity,
    context.userId
  );
}

/**
 * Calculate PERT estimate for single step
 */
export function pertEstimate(
  optimistic: number,
  realistic: number,
  pessimistic: number
): {
  estimate: number;
  standardDeviation: number;
  confidence: number;
} {
  const estimate = EstimationEngine.calculatePERTEstimate(
    optimistic,
    realistic,
    pessimistic
  );
  
  const standardDeviation = EstimationEngine.calculateStandardDeviation(
    optimistic,
    pessimistic
  );
  
  const confidence = EstimationEngine.calculateConfidence(
    standardDeviation,
    estimate
  );

  return {
    estimate,
    standardDeviation,
    confidence,
  };
}

/**
 * Estimate completion date based on velocity
 */
export function estimateCompletion(
  stepsTotal: number,
  stepsCompleted: number,
  startDate: Date,
  currentDate: Date = new Date()
): Date {
  return ProgressTracker.estimateCompletionDate(
    stepsTotal,
    stepsCompleted,
    startDate,
    currentDate
  );
}

/**
 * Calculate project accuracy factor
 */
export function calculateAccuracy(
  estimatedHours: number,
  actualHours: number
): {
  factor: number;
  interpretation: string;
  percentage: number;
} {
  const factor = ProgressTracker.calculateCurrentAccuracy(
    estimatedHours,
    actualHours
  );

  let interpretation: string;
  if (factor < 0.7) {
    interpretation = 'Much faster than estimated';
  } else if (factor < 0.9) {
    interpretation = 'Faster than estimated';
  } else if (factor <= 1.1) {
    interpretation = 'Accurate estimate';
  } else if (factor <= 1.3) {
    interpretation = 'Slower than estimated';
  } else {
    interpretation = 'Much slower than estimated';
  }

  const percentage = Math.round(factor * 100);

  return {
    factor,
    interpretation,
    percentage,
  };
}

