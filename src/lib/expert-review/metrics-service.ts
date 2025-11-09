// Metrics Service
// Created: 2025-11-09
// Purpose: Calculate DQS and track quality metrics

import { firestore } from '../firestore';
import { calculateDQS, getDQSStatus } from '../../types/expert-review';
import type { DomainQualityMetrics } from '../../types/expert-review';

/**
 * Calculate current Domain Quality Score
 */
export async function calculateDomainQuality(
  domainId: string,
  period: string = 'Last 30 days'
): Promise<DomainQualityMetrics> {
  
  console.log('📊 Calculating DQS for domain:', domainId);
  
  try {
    // Get all feedback for domain in period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // User feedback (CSAT via stars)
    const userFeedback = await firestore
      .collection('message_feedback')
      .where('domain', '==', domainId)
      .where('feedbackType', '==', 'user')
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();
    
    const userStars = userFeedback.docs
      .map(doc => doc.data().userStars || 0)
      .filter(s => s > 0);
    
    const csatAvg = userStars.length > 0
      ? userStars.reduce((sum, s) => sum + s, 0) / userStars.length
      : 3.5; // Default if no data
    
    // Expert feedback
    const expertFeedback = await firestore
      .collection('message_feedback')
      .where('domain', '==', domainId)
      .where('feedbackType', '==', 'expert')
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();
    
    const expertRatings = expertFeedback.docs.map(doc => {
      const rating = doc.data().expertRating;
      if (rating === 'sobresaliente') return 100;
      if (rating === 'aceptable') return 50;
      if (rating === 'inaceptable') return 0;
      return 50;
    });
    
    const expertRatingAvg = expertRatings.length > 0
      ? expertRatings.reduce((sum, r) => sum + r, 0) / expertRatings.length
      : 70; // Default
    
    // NPS calculation (simplified)
    const npsScores = expertFeedback.docs
      .map(doc => doc.data().npsScore || 0)
      .filter(n => n > 0);
    
    const nps = npsScores.length > 0
      ? npsScores.reduce((sum, n) => sum + n, 0) / npsScores.length * 10
      : 80; // Default NPS (0-10 scale → 0-100)
    
    // Resolution and accuracy (simplified - will enhance)
    const resolutionRate = 0.85; // 85% resolved satisfactorily
    const accuracyRate = 0.90;   // 90% accurate responses
    
    // Calculate DQS
    const dqs = calculateDQS({
      csatAvg,
      nps,
      expertRatingAvg,
      resolutionRate,
      accuracyRate
    });
    
    const status = getDQSStatus(dqs);
    
    // Get previous score for trend
    const previous = await getPreviousDQS(domainId);
    const trend: 'improving' | 'stable' | 'declining' = 
      previous && dqs > previous + 2 ? 'improving' :
      previous && dqs < previous - 2 ? 'declining' :
      'stable';
    
    const result: DomainQualityMetrics = {
      domain: domainId,
      period,
      csatScore: Math.round((csatAvg / 5) * 100),
      npsScore: Math.round(nps),
      expertRatingScore: Math.round(expertRatingAvg),
      resolutionScore: Math.round(resolutionRate * 100),
      accuracyScore: Math.round(accuracyRate * 100),
      domainQualityScore: dqs,
      trend,
      previousScore: previous,
      changeFromPrevious: previous ? dqs - previous : undefined,
      platformAverage: 74.3, // TODO: Calculate from all domains
      ranking: 0, // TODO: Calculate ranking
      percentile: 0, // TODO: Calculate percentile
      status
    };
    
    // Save current DQS for trend tracking
    await saveDQSSnapshot(domainId, dqs);
    
    console.log('✅ DQS calculated:', {
      domain: domainId,
      dqs,
      status,
      trend
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error calculating DQS:', error);
    throw error;
  }
}

/**
 * Get previous DQS for trend calculation
 */
async function getPreviousDQS(domainId: string): Promise<number | undefined> {
  try {
    const snapshot = await firestore
      .collection('domain_quality_snapshots')
      .where('domainId', '==', domainId)
      .orderBy('timestamp', 'desc')
      .limit(2) // Get last 2 (current will be #1, previous is #2)
      .get();
    
    if (snapshot.size >= 2) {
      return snapshot.docs[1].data().dqs;
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Save DQS snapshot for trending
 */
async function saveDQSSnapshot(domainId: string, dqs: number): Promise<void> {
  try {
    await firestore.collection('domain_quality_snapshots').add({
      domainId,
      dqs,
      timestamp: new Date(),
      source: getEnvironmentSource()
    });
  } catch (error) {
    console.warn('⚠️ Failed to save DQS snapshot (non-critical):', error);
  }
}

function getEnvironmentSource(): 'localhost' | 'production' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
}

