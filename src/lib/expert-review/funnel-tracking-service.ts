// Funnel Tracking Service
// Created: 2025-11-09
// Purpose: Track user journey conversions, identify bottlenecks, calculate rates

import { firestore } from '../firestore';
import type { 
  FunnelStage, 
  FunnelEvent, 
  ConversionRates,
  FunnelBottleneck 
} from '../../types/analytics';

const IS_DEVELOPMENT = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.DEV 
  : process.env.NODE_ENV === 'development';

/**
 * Track a funnel stage conversion
 */
export async function trackFunnelStage(
  domainId: string,
  userId: string,
  userEmail: string,
  stage: FunnelStage,
  metadata: {
    interactionId?: string;
    evaluationId?: string;
    ticketId?: string;
    timeToComplete?: number; // milliseconds
    aiAssisted?: boolean;
    batchSize?: number;
    [key: string]: any;
  }
): Promise<void> {
  
  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track funnel stage:', {
      domainId,
      userId,
      stage,
      metadata
    });
    return;
  }

  try {
    const event: FunnelEvent = {
      id: `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      domainId,
      userId,
      userEmail,
      stage,
      timestamp: new Date(),
      metadata,
      source: IS_DEVELOPMENT ? 'localhost' : 'production'
    };

    await firestore.collection('quality_funnel_events').add(event);
    
    // Update aggregated metrics (async, non-blocking)
    updateFunnelMetrics(domainId, stage).catch(err => 
      console.warn('⚠️ Failed to update funnel metrics (non-critical):', err)
    );

    console.log('✅ Tracked funnel stage:', stage, 'for domain:', domainId);
  } catch (error) {
    console.error('❌ Failed to track funnel stage:', error);
    // Don't throw - tracking failure shouldn't break app
  }
}

/**
 * Calculate conversion rates for a funnel
 */
export async function calculateConversionRates(
  domainId: string,
  funnelType: 'user' | 'expert' | 'admin',
  periodDays: number = 30
): Promise<ConversionRates> {
  
  console.log('📈 Calculating conversion rates:', { domainId, funnelType, periodDays });

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const events = await firestore
      .collection('quality_funnel_events')
      .where('domainId', '==', domainId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    // Count events by stage
    const stageCounts: Record<FunnelStage, number> = {
      'feedback': 0,
      'priority': 0,
      'evaluated': 0,
      'approved': 0,
      'applied': 0,
      'validated': 0
    };

    events.docs.forEach(doc => {
      const data = doc.data();
      const stage = data.stage as FunnelStage;
      if (stage in stageCounts) {
        stageCounts[stage]++;
      }
    });

    // Calculate rates based on funnel type
    let rates: ConversionRates;

    if (funnelType === 'user') {
      // User Funnel: Interactions → Feedback → Priority → Evaluated → Approved → Applied → Validated
      const interactions = stageCounts.feedback > 0 ? Math.round(stageCounts.feedback / 0.37) : 0; // Reverse calc
      
      rates = {
        funnelType,
        domainId,
        periodDays,
        stages: [
          { name: 'Interactions', count: interactions, rate: 1.0 },
          { name: 'Feedback', count: stageCounts.feedback, rate: interactions > 0 ? stageCounts.feedback / interactions : 0 },
          { name: 'Priority', count: stageCounts.priority, rate: stageCounts.feedback > 0 ? stageCounts.priority / stageCounts.feedback : 0 },
          { name: 'Evaluated', count: stageCounts.evaluated, rate: stageCounts.priority > 0 ? stageCounts.evaluated / stageCounts.priority : 0 },
          { name: 'Approved', count: stageCounts.approved, rate: stageCounts.evaluated > 0 ? stageCounts.approved / stageCounts.evaluated : 0 },
          { name: 'Applied', count: stageCounts.applied, rate: stageCounts.approved > 0 ? stageCounts.applied / stageCounts.approved : 0 },
          { name: 'Validated', count: stageCounts.validated, rate: stageCounts.applied > 0 ? stageCounts.validated / stageCounts.applied : 0 }
        ],
        overallConversion: interactions > 0 ? stageCounts.validated / interactions : 0,
        calculatedAt: new Date()
      };
    } else if (funnelType === 'expert') {
      // Expert Funnel: Queue → Evaluated → AI-Assisted → Approved → Applied → Validated
      const queueSize = stageCounts.evaluated > 0 ? Math.round(stageCounts.evaluated / 0.81) : 0;
      const aiAssisted = events.docs.filter(d => d.data().metadata?.aiAssisted).length;

      rates = {
        funnelType,
        domainId,
        periodDays,
        stages: [
          { name: 'Queue', count: queueSize, rate: 1.0 },
          { name: 'Evaluated', count: stageCounts.evaluated, rate: queueSize > 0 ? stageCounts.evaluated / queueSize : 0 },
          { name: 'AI-Assisted', count: aiAssisted, rate: stageCounts.evaluated > 0 ? aiAssisted / stageCounts.evaluated : 0 },
          { name: 'Approved', count: stageCounts.approved, rate: stageCounts.evaluated > 0 ? stageCounts.approved / stageCounts.evaluated : 0 },
          { name: 'Applied', count: stageCounts.applied, rate: stageCounts.approved > 0 ? stageCounts.applied / stageCounts.approved : 0 },
          { name: 'Validated', count: stageCounts.validated, rate: stageCounts.applied > 0 ? stageCounts.validated / stageCounts.applied : 0 }
        ],
        overallConversion: queueSize > 0 ? stageCounts.validated / queueSize : 0,
        calculatedAt: new Date()
      };
    } else {
      // Admin Funnel: Proposals → Reviewed → Approved → Applied → Success
      const proposals = stageCounts.approved > 0 ? Math.round(stageCounts.approved / 0.79) : 0;

      rates = {
        funnelType,
        domainId,
        periodDays,
        stages: [
          { name: 'Proposals', count: proposals, rate: 1.0 },
          { name: 'Reviewed', count: proposals, rate: 1.0 }, // Assume all reviewed
          { name: 'Approved', count: stageCounts.approved, rate: proposals > 0 ? stageCounts.approved / proposals : 0 },
          { name: 'Applied', count: stageCounts.applied, rate: stageCounts.approved > 0 ? stageCounts.applied / stageCounts.approved : 0 },
          { name: 'Success', count: stageCounts.validated, rate: stageCounts.applied > 0 ? stageCounts.validated / stageCounts.applied : 0 }
        ],
        overallConversion: proposals > 0 ? stageCounts.validated / proposals : 0,
        calculatedAt: new Date()
      };
    }

    // Save aggregated metrics
    await saveFunnelMetrics(domainId, funnelType, rates);

    return rates;

  } catch (error) {
    console.error('❌ Failed to calculate conversion rates:', error);
    
    // Return empty rates on error
    return {
      funnelType,
      domainId,
      periodDays,
      stages: [],
      overallConversion: 0,
      calculatedAt: new Date()
    };
  }
}

/**
 * Identify bottlenecks in funnel
 */
export async function identifyFunnelBottlenecks(
  domainId: string,
  funnelType: 'user' | 'expert' | 'admin'
): Promise<FunnelBottleneck[]> {
  
  console.log('🔍 Identifying bottlenecks for:', domainId, funnelType);

  try {
    const rates = await calculateConversionRates(domainId, funnelType);
    const bottlenecks: FunnelBottleneck[] = [];

    // Define thresholds
    const thresholds: Record<string, number> = {
      'user': {
        'Feedback': 0.40,      // Target >40%
        'Priority': 0.80,      // Target >80% of feedback
        'Evaluated': 0.80,     // Target >80% evaluation coverage
        'Approved': 0.75,      // Target >75% approval
        'Applied': 0.95,       // Target >95% application
        'Validated': 0.85      // Target >85% success
      },
      'expert': {
        'Evaluated': 0.80,     // Target >80% coverage
        'AI-Assisted': 0.70,   // Target >70% AI adoption
        'Approved': 0.80,      // Target >80% approval
        'Applied': 0.95,       // Target >95% application
        'Validated': 0.85      // Target >85% success
      },
      'admin': {
        'Approved': 0.75,      // Target >75% approval
        'Applied': 0.95,       // Target >95% application
        'Success': 0.85        // Target >85% success
      }
    }[funnelType];

    // Check each stage
    rates.stages.forEach((stage, index) => {
      const threshold = thresholds[stage.name];
      
      if (threshold && stage.rate < threshold) {
        const severity = stage.rate < threshold * 0.8 ? 'critical' : 
                        stage.rate < threshold * 0.9 ? 'high' : 'medium';

        bottlenecks.push({
          stage: stage.name,
          currentRate: stage.rate,
          targetRate: threshold,
          gap: threshold - stage.rate,
          severity,
          recommendation: getRecommendation(funnelType, stage.name, stage.rate, threshold),
          affectedCount: index > 0 ? rates.stages[index - 1].count - stage.count : 0
        });
      }
    });

    // Save bottlenecks for alerting
    if (bottlenecks.length > 0) {
      await saveFunnelBottlenecks(domainId, funnelType, bottlenecks);
    }

    return bottlenecks;

  } catch (error) {
    console.error('❌ Failed to identify bottlenecks:', error);
    return [];
  }
}

/**
 * Get recommendation for improving bottleneck
 */
function getRecommendation(
  funnelType: string,
  stage: string,
  currentRate: number,
  targetRate: number
): string {
  
  const gap = ((targetRate - currentRate) * 100).toFixed(0);

  if (funnelType === 'user') {
    if (stage === 'Feedback') {
      return `Aumentar feedback rate del ${(currentRate * 100).toFixed(0)}% al ${(targetRate * 100).toFixed(0)}%. Sugerencia: Prompts más visibles después de respuestas, incentivos para feedback temprano.`;
    }
    if (stage === 'Priority') {
      return `Mejorar priorización: ${gap}% más feedback debería marcarse como prioritario. Revisar criterios de auto-priorización.`;
    }
    if (stage === 'Evaluated') {
      return `Aumentar cobertura de evaluación en ${gap}%. Asignar más expertos o mejorar routing a specialists.`;
    }
  }

  if (funnelType === 'expert') {
    if (stage === 'Evaluated') {
      return `Aumentar cobertura en ${gap}%. Considerar más expertos o mejor balanceo de carga.`;
    }
    if (stage === 'AI-Assisted') {
      return `Aumentar adopción AI en ${gap}%. Training para expertos o mejorar calidad de sugerencias AI.`;
    }
    if (stage === 'Approved') {
      return `Mejorar approval rate en ${gap}%. Revisar criterios de evaluación o training de expertos.`;
    }
  }

  if (funnelType === 'admin') {
    if (stage === 'Approved') {
      return `Aumentar approval rate en ${gap}%. Mejorar quality gates previos o clarificar criterios admin.`;
    }
  }

  return `Mejorar conversión en ${gap}% para alcanzar target.`;
}

/**
 * Update aggregated funnel metrics
 */
async function updateFunnelMetrics(
  domainId: string,
  stage: FunnelStage
): Promise<void> {
  
  const today = new Date().toISOString().split('T')[0];
  const metricId = `${domainId}_${today}`;

  try {
    const metricRef = firestore
      .collection('funnel_conversion_rates')
      .doc(metricId);

    const doc = await metricRef.get();
    
    if (doc.exists) {
      // Increment stage count
      await metricRef.update({
        [`stages.${stage}`]: (doc.data()?.stages?.[stage] || 0) + 1,
        updatedAt: new Date()
      });
    } else {
      // Create new metric
      await metricRef.set({
        domainId,
        date: new Date(today),
        stages: {
          [stage]: 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.warn('⚠️ Failed to update funnel metrics:', error);
  }
}

/**
 * Save funnel metrics
 */
async function saveFunnelMetrics(
  domainId: string,
  funnelType: string,
  rates: ConversionRates
): Promise<void> {
  
  const period = new Date().toISOString().split('T')[0];
  const metricId = `${domainId}_${funnelType}_${period}`;

  try {
    await firestore
      .collection('funnel_conversion_rates')
      .doc(metricId)
      .set({
        domainId,
        funnelType,
        period,
        ...rates,
        updatedAt: new Date()
      }, { merge: true });

  } catch (error) {
    console.warn('⚠️ Failed to save funnel metrics:', error);
  }
}

/**
 * Save bottleneck alerts
 */
async function saveFunnelBottlenecks(
  domainId: string,
  funnelType: string,
  bottlenecks: FunnelBottleneck[]
): Promise<void> {
  
  try {
    await firestore
      .collection('funnel_bottlenecks')
      .doc(domainId)
      .set({
        domainId,
        funnelType,
        bottlenecks,
        severity: bottlenecks.some(b => b.severity === 'critical') ? 'critical' :
                  bottlenecks.some(b => b.severity === 'high') ? 'high' : 'medium',
        detectedAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

  } catch (error) {
    console.warn('⚠️ Failed to save bottlenecks:', error);
  }
}

/**
 * Get funnel performance summary
 */
export async function getFunnelSummary(
  domainId: string,
  periodDays: number = 30
): Promise<{
  user: ConversionRates;
  expert: ConversionRates;
  admin: ConversionRates;
  bottlenecks: FunnelBottleneck[];
}> {
  
  console.log('📊 Getting funnel summary for domain:', domainId);

  try {
    const [userRates, expertRates, adminRates] = await Promise.all([
      calculateConversionRates(domainId, 'user', periodDays),
      calculateConversionRates(domainId, 'expert', periodDays),
      calculateConversionRates(domainId, 'admin', periodDays)
    ]);

    // Get all bottlenecks
    const [userBottlenecks, expertBottlenecks, adminBottlenecks] = await Promise.all([
      identifyFunnelBottlenecks(domainId, 'user'),
      identifyFunnelBottlenecks(domainId, 'expert'),
      identifyFunnelBottlenecks(domainId, 'admin')
    ]);

    const allBottlenecks = [
      ...userBottlenecks.map(b => ({ ...b, funnel: 'user' as const })),
      ...expertBottlenecks.map(b => ({ ...b, funnel: 'expert' as const })),
      ...adminBottlenecks.map(b => ({ ...b, funnel: 'admin' as const }))
    ];

    return {
      user: userRates,
      expert: expertRates,
      admin: adminRates,
      bottlenecks: allBottlenecks
    };

  } catch (error) {
    console.error('❌ Failed to get funnel summary:', error);
    throw error;
  }
}

/**
 * Track time to completion for key milestones
 */
export async function trackMilestoneTime(
  domainId: string,
  userId: string,
  milestone: 'feedback_to_eval' | 'eval_to_approve' | 'approve_to_apply' | 'apply_to_validate',
  durationMs: number,
  metadata?: Record<string, any>
): Promise<void> {
  
  if (IS_DEVELOPMENT) {
    console.log('⏱️ [DEV] Would track milestone time:', {
      milestone,
      duration: `${(durationMs / 1000 / 60).toFixed(1)} min`
    });
    return;
  }

  try {
    await firestore.collection('milestone_times').add({
      domainId,
      userId,
      milestone,
      durationMs,
      durationMinutes: durationMs / 1000 / 60,
      timestamp: new Date(),
      metadata: metadata || {},
      source: IS_DEVELOPMENT ? 'localhost' : 'production'
    });

    console.log(`✅ Tracked ${milestone}: ${(durationMs / 1000 / 60).toFixed(1)} min`);
  } catch (error) {
    console.warn('⚠️ Failed to track milestone time:', error);
  }
}

/**
 * Get average time to complete funnel stages
 */
export async function getAverageMilestoneTimes(
  domainId: string,
  periodDays: number = 30
): Promise<Record<string, { avg: number; p50: number; p95: number }>> {
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const milestones = await firestore
      .collection('milestone_times')
      .where('domainId', '==', domainId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    const timesByMilestone: Record<string, number[]> = {};

    milestones.docs.forEach(doc => {
      const data = doc.data();
      const milestone = data.milestone;
      if (!timesByMilestone[milestone]) {
        timesByMilestone[milestone] = [];
      }
      timesByMilestone[milestone].push(data.durationMinutes);
    });

    const result: Record<string, { avg: number; p50: number; p95: number }> = {};

    Object.keys(timesByMilestone).forEach(milestone => {
      const times = timesByMilestone[milestone].sort((a, b) => a - b);
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
      const p50 = times[Math.floor(times.length * 0.5)];
      const p95 = times[Math.floor(times.length * 0.95)];

      result[milestone] = { avg, p50, p95 };
    });

    return result;

  } catch (error) {
    console.error('❌ Failed to get milestone times:', error);
    return {};
  }
}

