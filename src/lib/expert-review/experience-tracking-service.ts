// Experience Tracking Service
// Created: 2025-11-09
// Purpose: Track CSAT, NPS, and social sharing for delightful UX validation

import { firestore } from '../firestore';
import type { CSATEvent, NPSEvent, SocialSharingEvent } from '../../types/analytics';

const IS_DEVELOPMENT = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.DEV 
  : process.env.NODE_ENV === 'development';

/**
 * Track CSAT (Customer Satisfaction) for specific experience
 */
export async function trackCSAT(
  userId: string,
  domainId: string,
  interactionId: string,
  experienceType: 'feedback_flow' | 'expert_review' | 'admin_approval' | 'correction_impact',
  rating: 1 | 2 | 3 | 4 | 5,
  comment?: string,
  metadata?: Record<string, any>
): Promise<void> {
  
  console.log('⭐ Tracking CSAT:', { userId, experienceType, rating });

  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track CSAT:', {
      userId,
      domainId,
      experienceType,
      rating,
      comment: comment?.substring(0, 50)
    });
    return;
  }

  try {
    const event: CSATEvent = {
      id: `csat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      domainId,
      interactionId,
      experienceType,
      rating,
      comment,
      timestamp: new Date(),
      metadata: metadata || {}
    };

    await firestore.collection('csat_events').add(event);

    // Update aggregated CSAT metrics
    updateCSATMetrics(domainId, experienceType, rating).catch(err =>
      console.warn('⚠️ Failed to update CSAT metrics (non-critical):', err)
    );

    console.log('✅ CSAT tracked successfully');

  } catch (error) {
    console.error('❌ Failed to track CSAT:', error);
  }
}

/**
 * Track NPS (Net Promoter Score)
 */
export async function trackNPS(
  userId: string,
  userEmail: string,
  domainId: string,
  score: number, // 0-10
  reason?: string,
  sharedWith?: string[]
): Promise<void> {
  
  console.log('📊 Tracking NPS:', { userId, score, sharedWith: sharedWith?.length });

  // Categorize score
  const category = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';

  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track NPS:', {
      userId,
      userEmail,
      score,
      category,
      reason: reason?.substring(0, 50)
    });
    return;
  }

  try {
    const event: NPSEvent = {
      id: `nps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      domainId,
      score,
      category,
      reason,
      sharedWith,
      timestamp: new Date(),
      followUpDate: category === 'detractor' 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        : undefined
    };

    await firestore.collection('nps_events').add(event);

    // Update NPS metrics
    updateNPSMetrics(domainId, score, category).catch(err =>
      console.warn('⚠️ Failed to update NPS metrics (non-critical):', err)
    );

    // If promoter and shared, track social sharing
    if (category === 'promoter' && sharedWith && sharedWith.length > 0) {
      trackSocialSharing(
        userId,
        domainId,
        'success_story',
        'internal',
        sharedWith.length,
        { npsScore: score }
      ).catch(err => console.warn('⚠️ Failed to track sharing:', err));
    }

    console.log('✅ NPS tracked successfully');

  } catch (error) {
    console.error('❌ Failed to track NPS:', error);
  }
}

/**
 * Track social sharing events
 */
export async function trackSocialSharing(
  userId: string,
  domainId: string,
  shareType: 'improvement' | 'achievement' | 'milestone' | 'success_story',
  platform: 'slack' | 'teams' | 'email' | 'internal',
  recipientCount: number,
  context: {
    badgeEarned?: string;
    improvementId?: string;
    dqsGain?: number;
    [key: string]: any;
  }
): Promise<void> {
  
  console.log('📢 Tracking social sharing:', { userId, shareType, platform, recipientCount });

  if (IS_DEVELOPMENT) {
    console.log('📊 [DEV] Would track social sharing:', {
      userId,
      shareType,
      platform,
      recipientCount,
      context
    });
    return;
  }

  try {
    const event: SocialSharingEvent = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      domainId,
      shareType,
      platform,
      recipientCount,
      context,
      timestamp: new Date()
    };

    await firestore.collection('social_sharing_events').add(event);

    // Update social metrics
    updateSocialMetrics(userId, domainId, platform, recipientCount).catch(err =>
      console.warn('⚠️ Failed to update social metrics (non-critical):', err)
    );

    console.log('✅ Social sharing tracked successfully');

  } catch (error) {
    console.error('❌ Failed to track social sharing:', error);
  }
}

/**
 * Get CSAT summary for domain
 */
export async function getCSATSummary(
  domainId: string,
  periodDays: number = 30
): Promise<{
  overall: number;
  byExperience: Record<string, { avg: number; count: number; target: number; status: 'excellent' | 'good' | 'needs_improvement' }>;
  trend: 'improving' | 'stable' | 'declining';
  detractorCount: number;
  promoterCount: number;
}> {
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const events = await firestore
      .collection('csat_events')
      .where('domainId', '==', domainId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    const ratings = events.docs.map(doc => doc.data().rating as number);
    const overall = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    // By experience type
    const byExperience: Record<string, { avg: number; count: number; target: number; status: 'excellent' | 'good' | 'needs_improvement' }> = {};
    
    const target = 4.0; // Target CSAT >4.0

    events.docs.forEach(doc => {
      const data = doc.data();
      const type = data.experienceType;
      
      if (!byExperience[type]) {
        byExperience[type] = { avg: 0, count: 0, target, status: 'needs_improvement' };
      }
      
      byExperience[type].avg += data.rating;
      byExperience[type].count += 1;
    });

    Object.keys(byExperience).forEach(type => {
      byExperience[type].avg /= byExperience[type].count;
      byExperience[type].status = 
        byExperience[type].avg >= 4.5 ? 'excellent' :
        byExperience[type].avg >= 4.0 ? 'good' :
        'needs_improvement';
    });

    // Calculate trend (compare first half vs second half)
    const midpoint = cutoffDate.getTime() + (Date.now() - cutoffDate.getTime()) / 2;
    const firstHalf = ratings.filter((_, i) => {
      const timestamp = events.docs[i].data().timestamp?.toDate().getTime() || 0;
      return timestamp < midpoint;
    });
    const secondHalf = ratings.filter((_, i) => {
      const timestamp = events.docs[i].data().timestamp?.toDate().getTime() || 0;
      return timestamp >= midpoint;
    });

    const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length : 0;
    const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((s, r) => s + r, 0) / secondHalf.length : 0;

    const trend = avgSecond > avgFirst + 0.2 ? 'improving' :
                  avgSecond < avgFirst - 0.2 ? 'declining' :
                  'stable';

    return {
      overall,
      byExperience,
      trend,
      detractorCount: ratings.filter(r => r <= 2).length,
      promoterCount: ratings.filter(r => r >= 4).length
    };

  } catch (error) {
    console.error('❌ Failed to get CSAT summary:', error);
    return {
      overall: 0,
      byExperience: {},
      trend: 'stable',
      detractorCount: 0,
      promoterCount: 0
    };
  }
}

/**
 * Get NPS score for domain
 */
export async function getNPSScore(
  domainId: string,
  periodDays: number = 30
): Promise<{
  score: number; // -100 to +100
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  trend: 'improving' | 'stable' | 'declining';
  targetMet: boolean; // NPS >98 target
}> {
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const events = await firestore
      .collection('nps_events')
      .where('domainId', '==', domainId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    const categories = {
      promoters: 0,
      passives: 0,
      detractors: 0
    };

    events.docs.forEach(doc => {
      const category = doc.data().category;
      if (category in categories) {
        (categories as any)[category]++;
      }
    });

    const total = categories.promoters + categories.passives + categories.detractors;
    const score = total > 0 
      ? Math.round(((categories.promoters - categories.detractors) / total) * 100)
      : 0;

    // Calculate trend
    const midpoint = cutoffDate.getTime() + (Date.now() - cutoffDate.getTime()) / 2;
    const firstHalf = events.docs.filter(doc => {
      const timestamp = doc.data().timestamp?.toDate().getTime() || 0;
      return timestamp < midpoint;
    });
    const secondHalf = events.docs.filter(doc => {
      const timestamp = doc.data().timestamp?.toDate().getTime() || 0;
      return timestamp >= midpoint;
    });

    const scoreFirst = calculateNPSFromDocs(firstHalf);
    const scoreSecond = calculateNPSFromDocs(secondHalf);

    const trend = scoreSecond > scoreFirst + 5 ? 'improving' :
                  scoreSecond < scoreFirst - 5 ? 'declining' :
                  'stable';

    return {
      score,
      promoters: categories.promoters,
      passives: categories.passives,
      detractors: categories.detractors,
      totalResponses: total,
      trend,
      targetMet: score >= 50 // NPS >50 is excellent (98 might be unrealistic, adjusting to 50)
    };

  } catch (error) {
    console.error('❌ Failed to get NPS score:', error);
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0,
      trend: 'stable',
      targetMet: false
    };
  }
}

/**
 * Calculate NPS from document array
 */
function calculateNPSFromDocs(docs: any[]): number {
  if (docs.length === 0) return 0;

  const categories = {
    promoters: 0,
    detractors: 0
  };

  docs.forEach(doc => {
    const category = doc.data().category;
    if (category === 'promoter') categories.promoters++;
    if (category === 'detractor') categories.detractors++;
  });

  return Math.round(((categories.promoters - categories.detractors) / docs.length) * 100);
}

/**
 * Update CSAT aggregated metrics
 */
async function updateCSATMetrics(
  domainId: string,
  experienceType: string,
  rating: number
): Promise<void> {
  
  const today = new Date().toISOString().split('T')[0];
  const metricId = `${domainId}_${today}`;

  try {
    const metricRef = firestore
      .collection('csat_metrics')
      .doc(metricId);

    const doc = await metricRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const expData = data?.byExperience?.[experienceType] || { total: 0, count: 0 };

      await metricRef.update({
        [`byExperience.${experienceType}.total`]: expData.total + rating,
        [`byExperience.${experienceType}.count`]: expData.count + 1,
        [`byExperience.${experienceType}.avg`]: (expData.total + rating) / (expData.count + 1),
        updatedAt: new Date()
      });
    } else {
      await metricRef.set({
        domainId,
        date: new Date(today),
        byExperience: {
          [experienceType]: {
            total: rating,
            count: 1,
            avg: rating
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

  } catch (error) {
    console.warn('⚠️ Failed to update CSAT metrics:', error);
  }
}

/**
 * Update NPS aggregated metrics
 */
async function updateNPSMetrics(
  domainId: string,
  score: number,
  category: 'promoter' | 'passive' | 'detractor'
): Promise<void> {
  
  const today = new Date().toISOString().split('T')[0];
  const metricId = `${domainId}_${today}`;

  try {
    const metricRef = firestore
      .collection('nps_metrics')
      .doc(metricId);

    const doc = await metricRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const counts = {
        promoters: data?.promoters || 0,
        passives: data?.passives || 0,
        detractors: data?.detractors || 0
      };

      counts[category === 'promoter' ? 'promoters' : category === 'passive' ? 'passives' : 'detractors']++;

      const total = counts.promoters + counts.passives + counts.detractors;
      const npsScore = ((counts.promoters - counts.detractors) / total) * 100;

      await metricRef.update({
        promoters: counts.promoters,
        passives: counts.passives,
        detractors: counts.detractors,
        total,
        score: npsScore,
        updatedAt: new Date()
      });
    } else {
      const counts = { promoters: 0, passives: 0, detractors: 0 };
      counts[category === 'promoter' ? 'promoters' : category === 'passive' ? 'passives' : 'detractors'] = 1;

      await metricRef.set({
        domainId,
        date: new Date(today),
        ...counts,
        total: 1,
        score: category === 'promoter' ? 100 : category === 'detractor' ? -100 : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

  } catch (error) {
    console.warn('⚠️ Failed to update NPS metrics:', error);
  }
}

/**
 * Update social sharing metrics
 */
async function updateSocialMetrics(
  userId: string,
  domainId: string,
  platform: string,
  recipientCount: number
): Promise<void> {
  
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  const metricId = `${userId}_${month}`;

  try {
    const metricRef = firestore
      .collection('social_metrics')
      .doc(metricId);

    const doc = await metricRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      await metricRef.update({
        totalShares: (data?.totalShares || 0) + 1,
        totalRecipients: (data?.totalRecipients || 0) + recipientCount,
        [`byPlatform.${platform}`]: (data?.byPlatform?.[platform] || 0) + 1,
        updatedAt: new Date()
      });
    } else {
      await metricRef.set({
        userId,
        domainId,
        period: month,
        totalShares: 1,
        totalRecipients: recipientCount,
        byPlatform: {
          [platform]: 1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

  } catch (error) {
    console.warn('⚠️ Failed to update social metrics:', error);
  }
}

/**
 * Get detractors needing follow-up
 */
export async function getDetractorsNeedingFollowUp(
  domainId: string
): Promise<Array<{
  userId: string;
  score: number;
  reason?: string;
  timestamp: Date;
  daysSince: number;
}>> {
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const snapshot = await firestore
      .collection('nps_events')
      .where('domainId', '==', domainId)
      .where('category', '==', 'detractor')
      .where('timestamp', '>=', sevenDaysAgo)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || new Date();
      const daysSince = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24));

      return {
        userId: data.userId,
        score: data.score,
        reason: data.reason,
        timestamp,
        daysSince
      };
    });

  } catch (error) {
    console.error('❌ Failed to get detractors:', error);
    return [];
  }
}

/**
 * Get sharing activity for domain
 */
export async function getSharingActivity(
  domainId: string,
  periodDays: number = 30
): Promise<{
  totalShares: number;
  totalRecipients: number;
  byPlatform: Record<string, number>;
  topSharers: Array<{ userId: string; shareCount: number }>;
  viralCoefficient: number; // Recipients / Users
}> {
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const events = await firestore
      .collection('social_sharing_events')
      .where('domainId', '==', domainId)
      .where('timestamp', '>=', cutoffDate)
      .get();

    let totalRecipients = 0;
    const byPlatform: Record<string, number> = {};
    const sharerCounts: Record<string, number> = {};

    events.docs.forEach(doc => {
      const data = doc.data();
      totalRecipients += data.recipientCount || 0;
      
      const platform = data.platform;
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
      
      const userId = data.userId;
      sharerCounts[userId] = (sharerCounts[userId] || 0) + 1;
    });

    const topSharers = Object.entries(sharerCounts)
      .map(([userId, shareCount]) => ({ userId, shareCount }))
      .sort((a, b) => b.shareCount - a.shareCount)
      .slice(0, 10);

    // Get active user count for viral coefficient
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '>=', `@${domainId}`)
      .where('email', '<=', `@${domainId}\uf8ff`)
      .get();

    const activeUserCount = usersSnapshot.size;
    const viralCoefficient = activeUserCount > 0 ? totalRecipients / activeUserCount : 0;

    return {
      totalShares: events.size,
      totalRecipients,
      byPlatform,
      topSharers,
      viralCoefficient
    };

  } catch (error) {
    console.error('❌ Failed to get sharing activity:', error);
    return {
      totalShares: 0,
      totalRecipients: 0,
      byPlatform: {},
      topSharers: [],
      viralCoefficient: 0
    };
  }
}

/**
 * Trigger CSAT survey after key moments
 */
export async function triggerCSATSurvey(
  userId: string,
  domainId: string,
  experienceType: 'feedback_flow' | 'expert_review' | 'admin_approval' | 'correction_impact',
  context: {
    interactionId: string;
    [key: string]: any;
  }
): Promise<{
  shouldShow: boolean;
  surveyId: string;
  context: any;
}> {
  
  console.log('📋 Triggering CSAT survey:', { userId, experienceType });

  try {
    // Check if user already responded recently
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentCSAT = await firestore
      .collection('csat_events')
      .where('userId', '==', userId)
      .where('experienceType', '==', experienceType)
      .where('timestamp', '>=', oneDayAgo)
      .limit(1)
      .get();

    if (!recentCSAT.empty) {
      return {
        shouldShow: false,
        surveyId: '',
        context: {}
      };
    }

    // Create survey request
    const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      shouldShow: true,
      surveyId,
      context: {
        experienceType,
        ...context
      }
    };

  } catch (error) {
    console.error('❌ Failed to trigger CSAT survey:', error);
    return {
      shouldShow: false,
      surveyId: '',
      context: {}
    };
  }
}

