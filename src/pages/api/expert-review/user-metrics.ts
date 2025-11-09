// User Metrics API
// Created: 2025-11-09
// Purpose: Get personal contribution metrics for end users

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { UserContributionMetrics } from '../../../types/analytics';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');

    if (!userId || !domainId) {
      return new Response(JSON.stringify({ error: 'Missing userId or domainId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user can access this data
    if (session.id !== userId && session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate metrics
    const metrics = await calculateUserMetrics(userId, domainId);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error getting user metrics:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function calculateUserMetrics(
  userId: string,
  domainId: string
): Promise<UserContributionMetrics> {
  
  const period = new Date().toISOString().substring(0, 7); // YYYY-MM
  const startOfMonth = new Date(period + '-01');

  // Get all feedback from user in period
  const feedbackSnapshot = await firestore
    .collection('message_feedback')
    .where('userId', '==', userId)
    .where('domain', '==', domainId)
    .where('feedbackType', '==', 'user')
    .where('timestamp', '>=', startOfMonth)
    .get();

  const totalInteractions = feedbackSnapshot.size;
  const feedbackGiven = feedbackSnapshot.docs.filter(doc => 
    doc.data().userComment && doc.data().userComment.length > 0
  ).length;

  // Count useful feedback (marked by experts)
  const feedbackUseful = feedbackSnapshot.docs.filter(doc =>
    doc.data().expertMarkedUseful === true
  ).length;

  const feedbackUsefulRate = feedbackGiven > 0 ? feedbackUseful / feedbackGiven : 0;

  // Count priority feedback
  const priorityFeedback = feedbackSnapshot.docs.filter(doc =>
    doc.data().priority === 'high' || doc.data().priority === 'medium'
  ).length;

  // Count responses improved
  const responsesImproved = feedbackSnapshot.docs.filter(doc =>
    doc.data().correctionApplied === true
  ).length;

  // Calculate average impact score
  const impactScores = feedbackSnapshot.docs
    .map(doc => doc.data().impactScore || 0)
    .filter(score => score > 0);
  
  const avgImpactScore = impactScores.length > 0
    ? impactScores.reduce((sum, s) => sum + s, 0) / impactScores.length
    : 0;

  // Count shares
  const sharesSnapshot = await firestore
    .collection('social_sharing_events')
    .where('userId', '==', userId)
    .where('domainId', '==', domainId)
    .where('timestamp', '>=', startOfMonth)
    .get();

  const shareCount = sharesSnapshot.size;

  // Calculate avg response time
  const responseTimes = feedbackSnapshot.docs
    .map(doc => doc.data().responseTimeMs || 0)
    .filter(t => t > 0);

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length / 1000 / 60 // Convert to minutes
    : 0;

  // Calculate return rate
  const uniqueDays = new Set(
    feedbackSnapshot.docs.map(doc => {
      const timestamp = doc.data().timestamp?.toDate();
      return timestamp ? timestamp.toISOString().split('T')[0] : '';
    })
  ).size;

  const daysInPeriod = Math.ceil((Date.now() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  const returnRate = daysInPeriod > 0 ? uniqueDays / daysInPeriod : 0;

  // Get NPS score
  const npsSnapshot = await firestore
    .collection('nps_events')
    .where('userId', '==', userId)
    .where('domainId', '==', domainId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  const npsScore = !npsSnapshot.empty 
    ? npsSnapshot.docs[0].data().score || 0
    : 0;

  // Count helped colleagues
  const helpedColleagues = sharesSnapshot.docs.filter(doc =>
    doc.data().shareType === 'improvement' || doc.data().shareType === 'success_story'
  ).length;

  const metrics: UserContributionMetrics = {
    userId,
    domainId,
    period,
    totalInteractions,
    feedbackGiven,
    feedbackUseful,
    feedbackUsefulRate,
    priorityFeedback,
    responsesImproved,
    avgImpactScore,
    shareCount,
    avgResponseTime,
    returnRate,
    npsScore,
    helpedColleagues,
    mentionedInFeedback: 0, // TODO: Calculate from feedback text analysis
    updatedAt: new Date()
  };

  return metrics;
}

