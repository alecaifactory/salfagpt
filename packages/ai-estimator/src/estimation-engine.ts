import type {
  ProjectStep,
  ProjectEstimation,
  HistoricalDataPoint,
  CalibrationModel,
  EstimationAnalysis,
} from './types.js';

// ============================================================================
// ESTIMATION ENGINE
// ============================================================================

export class EstimationEngine {
  /**
   * Calculate PERT estimate (Program Evaluation and Review Technique)
   * Formula: (Optimistic + 4*Realistic + Pessimistic) / 6
   */
  static calculatePERTEstimate(
    optimistic: number,
    realistic: number,
    pessimistic: number
  ): number {
    return (optimistic + 4 * realistic + pessimistic) / 6;
  }

  /**
   * Calculate standard deviation for uncertainty
   * Formula: (Pessimistic - Optimistic) / 6
   */
  static calculateStandardDeviation(
    optimistic: number,
    pessimistic: number
  ): number {
    return (pessimistic - optimistic) / 6;
  }

  /**
   * Calculate confidence level based on variance
   * Lower variance = higher confidence
   */
  static calculateConfidence(standardDeviation: number, mean: number): number {
    const coefficientOfVariation = standardDeviation / mean;
    
    // Convert to confidence (0-1 scale)
    // CV < 0.1 = 95% confidence
    // CV 0.1-0.2 = 80% confidence
    // CV 0.2-0.3 = 60% confidence
    // CV > 0.3 = 40% confidence
    
    if (coefficientOfVariation < 0.1) return 0.95;
    if (coefficientOfVariation < 0.2) return 0.80;
    if (coefficientOfVariation < 0.3) return 0.60;
    return 0.40;
  }

  /**
   * Estimate a single step
   */
  static estimateStep(step: ProjectStep): {
    pertEstimate: number;
    standardDeviation: number;
    confidence: number;
  } {
    const pertEstimate = this.calculatePERTEstimate(
      step.optimisticHours,
      step.realisticHours,
      step.pessimisticHours
    );

    const standardDeviation = this.calculateStandardDeviation(
      step.optimisticHours,
      step.pessimisticHours
    );

    const confidence = this.calculateConfidence(
      standardDeviation,
      pertEstimate
    );

    return {
      pertEstimate,
      standardDeviation,
      confidence,
    };
  }

  /**
   * Estimate entire project
   */
  static estimateProject(
    steps: ProjectStep[],
    historicalFactor: number = 1.0
  ): {
    totalEstimated: number;
    totalCalibrated: number;
    totalStandardDeviation: number;
    overallConfidence: number;
    byComplexity: Record<string, number>;
  } {
    let totalEstimated = 0;
    let totalVariance = 0;
    const byComplexity: Record<string, number> = {};

    for (const step of steps) {
      const { pertEstimate, standardDeviation } = this.estimateStep(step);
      
      totalEstimated += pertEstimate;
      totalVariance += standardDeviation ** 2; // Sum variances

      // Group by complexity
      if (!byComplexity[step.complexity]) {
        byComplexity[step.complexity] = 0;
      }
      byComplexity[step.complexity] += pertEstimate;
    }

    const totalStandardDeviation = Math.sqrt(totalVariance);
    const totalCalibrated = totalEstimated * historicalFactor;
    const overallConfidence = this.calculateConfidence(
      totalStandardDeviation,
      totalEstimated
    );

    return {
      totalEstimated,
      totalCalibrated,
      totalStandardDeviation,
      overallConfidence,
      byComplexity,
    };
  }

  /**
   * Calculate completion dates
   */
  static calculateCompletionDates(
    hoursEstimated: number,
    hoursPerDay: number = 8,
    startDate: Date = new Date()
  ): {
    optimistic: Date;
    realistic: Date;
    pessimistic: Date;
  } {
    const daysRealistic = Math.ceil(hoursEstimated / hoursPerDay);
    const daysOptimistic = Math.ceil((hoursEstimated * 0.7) / hoursPerDay);
    const daysPessimistic = Math.ceil((hoursEstimated * 1.5) / hoursPerDay);

    const addBusinessDays = (date: Date, days: number): Date => {
      const result = new Date(date);
      let daysAdded = 0;

      while (daysAdded < days) {
        result.setDate(result.getDate() + 1);
        // Skip weekends
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          daysAdded++;
        }
      }

      return result;
    };

    return {
      optimistic: addBusinessDays(startDate, daysOptimistic),
      realistic: addBusinessDays(startDate, daysRealistic),
      pessimistic: addBusinessDays(startDate, daysPessimistic),
    };
  }

  /**
   * Generate full estimation analysis
   */
  static analyzeEstimation(
    project: ProjectEstimation,
    hoursPerDay: number = 8
  ): EstimationAnalysis {
    const estimation = this.estimateProject(
      project.steps,
      project.historicalFactor
    );

    const completionDates = this.calculateCompletionDates(
      estimation.totalCalibrated,
      hoursPerDay,
      project.createdAt
    );

    // Generate warnings
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (estimation.overallConfidence < 0.6) {
      warnings.push(
        'Low confidence estimate. Consider breaking down steps further.'
      );
    }

    if (estimation.totalCalibrated > 160) {
      // > 20 days
      warnings.push(
        'Large project (>20 days). Consider splitting into milestones.'
      );
    }

    const highComplexityHours = estimation.byComplexity['very-high'] || 0;
    if (highComplexityHours > estimation.totalCalibrated * 0.5) {
      warnings.push(
        'Over 50% of work is very high complexity. High risk of delays.'
      );
      suggestions.push(
        'Consider prototyping high-complexity items first to validate estimates.'
      );
    }

    if (project.historicalFactor < 0.8) {
      suggestions.push(
        `Historical data shows projects complete ${Math.round((1 - project.historicalFactor) * 100)}% faster. Estimates are calibrated.`
      );
    } else if (project.historicalFactor > 1.2) {
      warnings.push(
        `Historical data shows projects take ${Math.round((project.historicalFactor - 1) * 100)}% longer than estimated.`
      );
    }

    return {
      project,
      totalEstimated: estimation.totalEstimated,
      totalCalibrated: estimation.totalCalibrated,
      byComplexity: estimation.byComplexity,
      byPhase: {}, // TODO: Implement phase grouping
      confidence: estimation.overallConfidence,
      historicalFactor: project.historicalFactor,
      variance: estimation.totalStandardDeviation ** 2,
      optimisticCompletion: completionDates.optimistic,
      realisticCompletion: completionDates.realistic,
      pessimisticCompletion: completionDates.pessimistic,
      warnings,
      suggestions,
    };
  }
}

// ============================================================================
// CALIBRATION ENGINE
// ============================================================================

export class CalibrationEngine {
  /**
   * Calculate historical factor from data points
   * Factor = average(actual / estimated)
   */
  static calculateHistoricalFactor(
    dataPoints: HistoricalDataPoint[]
  ): number {
    if (dataPoints.length === 0) return 1.0;

    const sum = dataPoints.reduce((acc, point) => acc + point.accuracyFactor, 0);
    return sum / dataPoints.length;
  }

  /**
   * Calculate factor grouped by attribute
   */
  static calculateFactorByAttribute<T extends string>(
    dataPoints: HistoricalDataPoint[],
    getAttribute: (point: HistoricalDataPoint) => T
  ): Record<T, number> {
    const grouped = new Map<T, number[]>();

    for (const point of dataPoints) {
      const attribute = getAttribute(point);
      if (!grouped.has(attribute)) {
        grouped.set(attribute, []);
      }
      grouped.get(attribute)!.push(point.accuracyFactor);
    }

    const result: Record<string, number> = {};
    for (const [attribute, factors] of grouped.entries()) {
      const average = factors.reduce((a, b) => a + b, 0) / factors.length;
      result[attribute] = average;
    }

    return result as Record<T, number>;
  }

  /**
   * Calculate confidence interval
   */
  static calculateConfidenceInterval(
    dataPoints: HistoricalDataPoint[],
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    if (dataPoints.length < 2) {
      return { lower: 0.5, upper: 1.5 };
    }

    const factors = dataPoints.map((p) => p.accuracyFactor);
    const mean = factors.reduce((a, b) => a + b, 0) / factors.length;
    
    const variance =
      factors.reduce((acc, val) => acc + (val - mean) ** 2, 0) /
      (factors.length - 1);
    const stdDev = Math.sqrt(variance);

    // Z-score for 95% confidence ≈ 1.96
    const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645; // 90%
    const marginOfError = zScore * (stdDev / Math.sqrt(factors.length));

    return {
      lower: Math.max(0.1, mean - marginOfError),
      upper: mean + marginOfError,
    };
  }

  /**
   * Build calibration model from historical data
   */
  static buildCalibrationModel(
    dataPoints: HistoricalDataPoint[],
    version: string = '1.0.0'
  ): CalibrationModel {
    const overallFactor = this.calculateHistoricalFactor(dataPoints);

    const factorByComplexity = this.calculateFactorByAttribute(
      dataPoints,
      (p) => p.complexity
    );

    const factorByProjectType = this.calculateFactorByAttribute(
      dataPoints,
      (p) => p.projectType
    );

    const factorByUser = this.calculateFactorByAttribute(
      dataPoints,
      (p) => p.userId
    );

    const confidenceInterval = this.calculateConfidenceInterval(dataPoints);

    return {
      id: `calibration-${Date.now()}`,
      version,
      overallFactor,
      factorByComplexity,
      factorByProjectType,
      factorByUser,
      dataPointsCount: dataPoints.length,
      confidenceInterval,
      lastUpdated: new Date(),
      minDataPoints: 3,
    };
  }

  /**
   * Get best factor for a project
   */
  static getBestFactorForProject(
    model: CalibrationModel,
    projectType?: string,
    complexity?: string,
    userId?: string
  ): number {
    // Priority: specific > general
    
    // 1. Try user-specific factor
    if (userId && model.factorByUser[userId]) {
      return model.factorByUser[userId];
    }

    // 2. Try project type + complexity
    if (projectType && complexity) {
      const typeKey = `${projectType}-${complexity}`;
      // Note: This would require storing combined keys
      // For now, average the two
      const typeFactor = model.factorByProjectType[projectType];
      const complexityFactor = model.factorByComplexity[complexity];
      
      if (typeFactor && complexityFactor) {
        return (typeFactor + complexityFactor) / 2;
      }
    }

    // 3. Try project type alone
    if (projectType && model.factorByProjectType[projectType]) {
      return model.factorByProjectType[projectType];
    }

    // 4. Try complexity alone
    if (complexity && model.factorByComplexity[complexity]) {
      return model.factorByComplexity[complexity];
    }

    // 5. Fall back to overall
    return model.overallFactor;
  }

  /**
   * Detect if model needs recalibration
   */
  static needsRecalibration(
    model: CalibrationModel,
    recentDataPoints: HistoricalDataPoint[],
    threshold: number = 0.15 // 15% drift
  ): boolean {
    if (recentDataPoints.length < 3) return false;

    const recentFactor = this.calculateHistoricalFactor(recentDataPoints);
    const drift = Math.abs(recentFactor - model.overallFactor);

    return drift > threshold;
  }
}

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

export class ProgressTracker {
  /**
   * Calculate current accuracy factor
   */
  static calculateCurrentAccuracy(
    estimatedHours: number,
    actualHours: number
  ): number {
    if (estimatedHours === 0) return 1.0;
    return actualHours / estimatedHours;
  }

  /**
   * Project total hours based on current performance
   */
  static projectTotalHours(
    totalEstimated: number,
    completedEstimated: number,
    completedActual: number
  ): number {
    if (completedEstimated === 0) return totalEstimated;

    const currentFactor = completedActual / completedEstimated;
    return totalEstimated * currentFactor;
  }

  /**
   * Calculate velocity (steps per day)
   */
  static calculateVelocity(
    stepsCompleted: number,
    startDate: Date,
    currentDate: Date = new Date()
  ): number {
    const daysPassed = Math.max(
      1,
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return stepsCompleted / daysPassed;
  }

  /**
   * Estimate completion date based on current velocity
   */
  static estimateCompletionDate(
    stepsTotal: number,
    stepsCompleted: number,
    startDate: Date,
    currentDate: Date = new Date()
  ): Date {
    const stepsRemaining = stepsTotal - stepsCompleted;
    const velocity = this.calculateVelocity(stepsCompleted, startDate, currentDate);

    if (velocity === 0) {
      // No progress yet, return pessimistic estimate
      const daysRemaining = stepsTotal * 1.5; // Pessimistic
      return new Date(currentDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    }

    const daysRemaining = stepsRemaining / velocity;
    return new Date(currentDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  }

  /**
   * Check if project is on track
   */
  static isOnTrack(
    estimatedCompletion: Date,
    projectedCompletion: Date,
    toleranceDays: number = 2
  ): boolean {
    const diffDays =
      (projectedCompletion.getTime() - estimatedCompletion.getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.abs(diffDays) <= toleranceDays;
  }
}

