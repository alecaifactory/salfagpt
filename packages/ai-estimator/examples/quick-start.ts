/**
 * Quick Start Example: Using @salfagpt/ai-estimator
 */

import {
  estimateProject,
  pertEstimate,
  calculateAccuracy,
  estimateCompletion,
} from '@salfagpt/ai-estimator';
import type { ProjectStep } from '@salfagpt/ai-estimator';

// ============================================================================
// Example 1: Simple PERT Estimate
// ============================================================================

console.log('='.repeat(80));
console.log('Example 1: PERT Estimate for a Single Task');
console.log('='.repeat(80));

const { estimate, confidence, standardDeviation } = pertEstimate(
  2,  // Optimistic: 2 hours
  3,  // Realistic: 3 hours
  5   // Pessimistic: 5 hours
);

console.log(`Estimate: ${estimate.toFixed(1)}h`);
console.log(`Confidence: ${(confidence * 100).toFixed(0)}%`);
console.log(`Standard Deviation: ${standardDeviation.toFixed(2)}h`);
console.log();

// ============================================================================
// Example 2: Full Project Estimation (Web Search Feature)
// ============================================================================

console.log('='.repeat(80));
console.log('Example 2: Full Project Estimation');
console.log('='.repeat(80));

const webSearchSteps: ProjectStep[] = [
  {
    id: 'step-1',
    name: 'Data Schema Extensions',
    description: 'Extend ContextSource, create WebSearchQuery types',
    optimisticHours: 2,
    realisticHours: 3,
    pessimisticHours: 4,
    complexity: 'medium',
    dependencies: [],
    tags: ['backend', 'schema'],
  },
  {
    id: 'step-2',
    name: 'User Consent UI',
    description: 'Toggle in input area, transparency notice',
    optimisticHours: 3,
    realisticHours: 4,
    pessimisticHours: 6,
    complexity: 'medium',
    dependencies: ['step-1'],
    tags: ['frontend', 'ui'],
  },
  {
    id: 'step-3',
    name: 'Google Search Setup',
    description: 'API key setup, basic integration',
    optimisticHours: 2,
    realisticHours: 3,
    pessimisticHours: 4,
    complexity: 'low',
    dependencies: [],
    tags: ['backend', 'api'],
  },
  {
    id: 'step-4',
    name: 'Search Implementation',
    description: 'Query optimization, result parsing, caching',
    optimisticHours: 6,
    realisticHours: 7,
    pessimisticHours: 10,
    complexity: 'high',
    dependencies: ['step-3'],
    tags: ['backend', 'api', 'ai'],
  },
  {
    id: 'step-5',
    name: 'License Classification',
    description: 'AI-powered license detection, pattern matching',
    optimisticHours: 4,
    realisticHours: 5,
    pessimisticHours: 8,
    complexity: 'high',
    dependencies: [],
    tags: ['backend', 'ai'],
  },
  {
    id: 'step-6',
    name: 'Context Integration',
    description: 'Merge web results with existing context',
    optimisticHours: 3,
    realisticHours: 4,
    pessimisticHours: 5,
    complexity: 'medium',
    dependencies: ['step-4', 'step-5'],
    tags: ['backend'],
  },
  {
    id: 'step-7',
    name: 'Chat Interface',
    description: 'UI components, state management',
    optimisticHours: 4,
    realisticHours: 5,
    pessimisticHours: 6,
    complexity: 'medium',
    dependencies: ['step-2'],
    tags: ['frontend', 'ui'],
  },
  {
    id: 'step-8',
    name: 'Source Display',
    description: 'Badges, cards, metadata display',
    optimisticHours: 4,
    realisticHours: 5,
    pessimisticHours: 6,
    complexity: 'medium',
    dependencies: ['step-7'],
    tags: ['frontend', 'ui'],
  },
  {
    id: 'step-9',
    name: 'Anonymization Pipeline',
    description: 'SHA-256 hashing, PII removal, export',
    optimisticHours: 6,
    realisticHours: 7,
    pessimisticHours: 10,
    complexity: 'high',
    dependencies: ['step-6'],
    tags: ['backend', 'privacy'],
  },
  {
    id: 'step-10',
    name: 'Testing & Documentation',
    description: 'Multi-user testing, privacy verification, docs',
    optimisticHours: 8,
    realisticHours: 10,
    pessimisticHours: 12,
    complexity: 'medium',
    dependencies: ['step-9'],
    tags: ['testing', 'docs'],
  },
];

// Estimate without historical calibration
const rawAnalysis = estimateProject(webSearchSteps, {
  projectName: 'Web Search Feature',
  projectDescription: 'Add web search with training contribution',
  projectType: 'web-feature',
  userId: 'developer-a',
});

console.log('Raw Estimation (no calibration):');
console.log(`  Total: ${rawAnalysis.totalEstimated.toFixed(1)}h (${(rawAnalysis.totalEstimated / 8).toFixed(1)} days)`);
console.log(`  Confidence: ${(rawAnalysis.confidence * 100).toFixed(0)}%`);
console.log();

// Estimate with historical calibration (0.7x factor from past projects)
const calibratedAnalysis = estimateProject(webSearchSteps, {
  historicalFactor: 0.7, // Complete 30% faster based on history
  projectName: 'Web Search Feature',
  projectDescription: 'Add web search with training contribution',
  projectType: 'web-feature',
  userId: 'developer-a',
});

console.log('Calibrated Estimation (0.7x historical factor):');
console.log(`  Total: ${calibratedAnalysis.totalCalibrated.toFixed(1)}h (${(calibratedAnalysis.totalCalibrated / 8).toFixed(1)} days)`);
console.log(`  Confidence: ${(calibratedAnalysis.confidence * 100).toFixed(0)}%`);
console.log();

console.log('Completion Dates:');
console.log(`  Optimistic:  ${calibratedAnalysis.optimisticCompletion.toISOString().split('T')[0]}`);
console.log(`  Realistic:   ${calibratedAnalysis.realisticCompletion.toISOString().split('T')[0]}`);
console.log(`  Pessimistic: ${calibratedAnalysis.pessimisticCompletion.toISOString().split('T')[0]}`);
console.log();

console.log('By Complexity:');
for (const [complexity, hours] of Object.entries(calibratedAnalysis.byComplexity)) {
  const percentage = ((hours / calibratedAnalysis.totalEstimated) * 100).toFixed(0);
  console.log(`  ${complexity.padEnd(12)} ${hours.toFixed(1)}h (${percentage}%)`);
}
console.log();

if (calibratedAnalysis.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  calibratedAnalysis.warnings.forEach(w => console.log(`  • ${w}`));
  console.log();
}

if (calibratedAnalysis.suggestions.length > 0) {
  console.log('💡 Suggestions:');
  calibratedAnalysis.suggestions.forEach(s => console.log(`  • ${s}`));
  console.log();
}

// ============================================================================
// Example 3: Progress Tracking
// ============================================================================

console.log('='.repeat(80));
console.log('Example 3: Progress Tracking & Accuracy');
console.log('='.repeat(80));

// Simulate completing steps
const completedSteps = [
  { stepId: 'step-1', estimated: 3, actual: 2.5 },
  { stepId: 'step-2', estimated: 4, actual: 3.8 },
  { stepId: 'step-3', estimated: 3, actual: 2.2 },
];

let totalEstimated = 0;
let totalActual = 0;

console.log('Completed Steps:');
console.log('-'.repeat(80));

for (const step of completedSteps) {
  const stepData = webSearchSteps.find(s => s.id === step.stepId)!;
  const { factor, interpretation, percentage } = calculateAccuracy(
    step.estimated,
    step.actual
  );

  console.log(`${stepData.name}`);
  console.log(`  Estimated: ${step.estimated}h | Actual: ${step.actual}h`);
  console.log(`  Accuracy: ${percentage}% (${interpretation})`);
  console.log();

  totalEstimated += step.estimated;
  totalActual += step.actual;
}

// Overall accuracy so far
const { factor: overallFactor, interpretation: overallInterpretation } = calculateAccuracy(
  totalEstimated,
  totalActual
);

console.log('-'.repeat(80));
console.log('Overall Progress:');
console.log(`  Completed: ${completedSteps.length}/${webSearchSteps.length} steps`);
console.log(`  Estimated so far: ${totalEstimated}h`);
console.log(`  Actual so far: ${totalActual}h`);
console.log(`  Current Factor: ${overallFactor.toFixed(2)}x (${overallInterpretation})`);
console.log();

// Project total based on current performance
const projectedTotal = (calibratedAnalysis.totalCalibrated - totalEstimated) * overallFactor + totalActual;
console.log(`Projected Total: ${projectedTotal.toFixed(1)}h (based on current performance)`);
console.log();

// ============================================================================
// Example 4: Completion Date Estimation
// ============================================================================

console.log('='.repeat(80));
console.log('Example 4: Estimated Completion Date');
console.log('='.repeat(80));

const startDate = new Date('2025-11-18');
const currentDate = new Date('2025-11-20'); // 2 days later

const estimatedCompletion = estimateCompletion(
  webSearchSteps.length,       // 10 total steps
  completedSteps.length,        // 3 completed
  startDate,
  currentDate
);

const daysRemaining = Math.ceil(
  (estimatedCompletion.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
);

console.log(`Start Date: ${startDate.toISOString().split('T')[0]}`);
console.log(`Current Date: ${currentDate.toISOString().split('T')[0]}`);
console.log(`Completed: ${completedSteps.length}/${webSearchSteps.length} steps`);
console.log();
console.log(`Estimated Completion: ${estimatedCompletion.toISOString().split('T')[0]}`);
console.log(`Days Remaining: ${daysRemaining} days`);
console.log();

// Velocity
const daysPassed = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
const velocity = completedSteps.length / daysPassed;
console.log(`Velocity: ${velocity.toFixed(2)} steps/day`);
console.log();

// ============================================================================
// Example 5: Real-World Scenario (This Conversation!)
// ============================================================================

console.log('='.repeat(80));
console.log('Example 5: Real-World Data from This Conversation');
console.log('='.repeat(80));

console.log('Planning Phase (this conversation):');
console.log(`  Tokens Generated: ~22,000 tokens`);
console.log(`  Time: ~36 minutes`);
console.log(`  Output: 16,500 words of documentation`);
console.log(`  Cost: $0.36 USD`);
console.log();

console.log('Projected Implementation (10 steps):');
console.log(`  Raw Estimate: 53.0h`);
console.log(`  Calibrated (0.7x): 37.1h`);
console.log(`  Expected Duration: 5-7 days`);
console.log();

console.log('Expected AI Contribution:');
console.log(`  Tokens Generated: ~38,000 tokens`);
console.log(`  Lines of Code: ~3,800 lines`);
console.log(`  AI Output Time: 3.4 hours`);
console.log(`  Human Supervision: 33.6 hours`);
console.log(`  AI Cost: $1.23 USD`);
console.log();

console.log('Cost Comparison:');
console.log(`  AI + Human: $3,361 ($1.23 AI + $3,360 human)`);
console.log(`  Human Only: $3,700`);
console.log(`  Savings: $339 (9%)`);
console.log(`  But... AI generates 11x faster in bursts!`);
console.log();

// ============================================================================
// Output Summary
// ============================================================================

console.log('='.repeat(80));
console.log('✅ Examples Complete!');
console.log('='.repeat(80));
console.log();
console.log('Try it yourself:');
console.log('  1. npm install @salfagpt/ai-estimator');
console.log('  2. npx ai-estimate estimate');
console.log('  3. Track your actual progress');
console.log('  4. Watch calibration improve over time');
console.log();
console.log('Made with 🤖 by Flow Platform');
console.log();


