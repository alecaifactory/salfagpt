// Integration Hooks
// Created: 2025-11-09
// Purpose: Connect all analytics services to main chat interface

import { trackFunnelStage, trackMilestoneTime } from './funnel-tracking-service';
import { checkAndAwardBadges, getUnshownAchievements, markCelebrationShown } from './gamification-service';
import { trackCSAT, trackNPS, trackSocialSharing, triggerCSATSurvey } from './experience-tracking-service';
import { checkUserImpact, shouldShowImpactNotification, markImpactNotificationShown } from './impact-attribution-service';
import type { Badge } from '../../types/analytics';

/**
 * Hook: After user gives feedback
 */
export async function onUserFeedbackGiven(
  userId: string,
  userEmail: string,
  domainId: string,
  feedbackId: string,
  metadata: {
    messageId: string;
    userStars?: number;
    userComment?: string;
    priority?: string;
  }
): Promise<void> {
  
  console.log('📊 Tracking user feedback event');

  try {
    // 1. Track funnel stage
    await trackFunnelStage(
      domainId,
      userId,
      userEmail,
      'feedback',
      {
        interactionId: metadata.messageId,
        priority: metadata.priority,
        hasComment: !!metadata.userComment,
        stars: metadata.userStars
      }
    );

    // 2. Trigger CSAT survey (if appropriate)
    const survey = await triggerCSATSurvey(
      userId,
      domainId,
      'feedback_flow',
      { interactionId: metadata.messageId }
    );

    // Return survey info to show modal
    return survey as any;

  } catch (error) {
    console.error('❌ Failed in onUserFeedbackGiven hook:', error);
  }
}

/**
 * Hook: After expert evaluates
 */
export async function onExpertEvaluated(
  expertId: string,
  expertEmail: string,
  domainId: string,
  evaluationId: string,
  metadata: {
    feedbackId: string;
    aiAssisted: boolean;
    evaluationTimeMs: number;
  }
): Promise<void> {
  
  console.log('📊 Tracking expert evaluation event');

  try {
    // 1. Track funnel stage
    await trackFunnelStage(
      domainId,
      expertId,
      expertEmail,
      'evaluated',
      {
        evaluationId,
        aiAssisted: metadata.aiAssisted,
        timeToComplete: metadata.evaluationTimeMs
      }
    );

    // 2. Track milestone time (feedback → evaluation)
    await trackMilestoneTime(
      domainId,
      expertId,
      'feedback_to_eval',
      metadata.evaluationTimeMs,
      { evaluationId, aiAssisted: metadata.aiAssisted }
    );

    // 3. Check for badges (efficiency, quality)
    // Will be done in background via metrics update

  } catch (error) {
    console.error('❌ Failed in onExpertEvaluated hook:', error);
  }
}

/**
 * Hook: After admin approves
 */
export async function onAdminApproved(
  adminId: string,
  adminEmail: string,
  domainId: string,
  evaluationId: string,
  metadata: {
    batchSize?: number;
    reviewTimeMs: number;
    estimatedImpact: any;
  }
): Promise<void> {
  
  console.log('📊 Tracking admin approval event');

  try {
    // 1. Track funnel stage
    await trackFunnelStage(
      domainId,
      adminId,
      adminEmail,
      'approved',
      {
        evaluationId,
        batchSize: metadata.batchSize || 1,
        timeToComplete: metadata.reviewTimeMs
      }
    );

    // 2. Track milestone time (eval → approve)
    await trackMilestoneTime(
      domainId,
      adminId,
      'eval_to_approve',
      metadata.reviewTimeMs,
      { 
        evaluationId,
        batchSize: metadata.batchSize,
        estimatedImpact: metadata.estimatedImpact
      }
    );

  } catch (error) {
    console.error('❌ Failed in onAdminApproved hook:', error);
  }
}

/**
 * Hook: After correction is applied
 */
export async function onCorrectionApplied(
  domainId: string,
  evaluationId: string,
  metadata: {
    affectedCount: number;
    dqsGainEstimate: number;
  }
): Promise<void> {
  
  console.log('📊 Tracking correction application');

  try {
    // Track funnel stage (system event, no specific user)
    await trackFunnelStage(
      domainId,
      'system',
      'system@flow.ai',
      'applied',
      {
        evaluationId,
        affectedCount: metadata.affectedCount,
        dqsGainEstimate: metadata.dqsGainEstimate
      }
    );

  } catch (error) {
    console.error('❌ Failed in onCorrectionApplied hook:', error);
  }
}

/**
 * Hook: After correction success is validated
 */
export async function onCorrectionValidated(
  domainId: string,
  evaluationId: string,
  metadata: {
    actualDqsGain: number;
    validatedBy: string;
  }
): Promise<void> {
  
  console.log('📊 Tracking correction validation');

  try {
    // Track funnel stage
    await trackFunnelStage(
      domainId,
      metadata.validatedBy,
      'validator@flow.ai',
      'validated',
      {
        evaluationId,
        actualDqsGain: metadata.actualDqsGain
      }
    );

  } catch (error) {
    console.error('❌ Failed in onCorrectionValidated hook:', error);
  }
}

/**
 * Hook: Check for achievements after metrics update
 */
export async function checkForNewAchievements(
  userId: string,
  userEmail: string
): Promise<Badge[]> {
  
  console.log('🏆 Checking for new achievements');

  try {
    const achievements = await getUnshownAchievements(userId);
    
    if (achievements.length > 0) {
      console.log(`🎉 Found ${achievements.length} new achievements for ${userEmail}`);
    }

    return achievements as any;

  } catch (error) {
    console.error('❌ Failed to check achievements:', error);
    return [];
  }
}

/**
 * Hook: Check if user should see impact notification on message
 */
export async function checkImpactNotification(
  userId: string,
  domainId: string,
  messageId: string
): Promise<{
  shouldShow: boolean;
  impactData?: any;
}> {
  
  try {
    const shouldShow = await shouldShowImpactNotification(userId, messageId);
    
    if (!shouldShow) {
      return { shouldShow: false };
    }

    const impactData = await checkUserImpact(messageId, userId, domainId);
    
    if (impactData.improved) {
      return {
        shouldShow: true,
        impactData
      };
    }

    return { shouldShow: false };

  } catch (error) {
    console.error('❌ Failed to check impact notification:', error);
    return { shouldShow: false };
  }
}

/**
 * Hook: Prompt for NPS at strategic moments
 */
export async function shouldPromptNPS(
  userId: string,
  domainId: string,
  context: {
    interactionCount: number;
    daysSinceFirstUse: number;
    hasSeenImpact: boolean;
  }
): Promise<boolean> {
  
  try {
    // Prompt NPS after:
    // - 5 interactions OR
    // - 7 days of use OR
    // - User saw their impact

    if (context.interactionCount >= 5 || 
        context.daysSinceFirstUse >= 7 ||
        context.hasSeenImpact) {
      
      // Check if already responded recently
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentNPS = await fetch(
        `/api/expert-review/nps?domainId=${domainId}&userId=${userId}&recent=true`
      );

      if (recentNPS.ok) {
        const data = await recentNPS.json();
        return data.hasRecent === false;
      }
    }

    return false;

  } catch (error) {
    console.error('❌ Failed to check NPS prompt:', error);
    return false;
  }
}

/**
 * Hook: Track social sharing action
 */
export async function onUserSharedContent(
  userId: string,
  domainId: string,
  shareType: 'improvement' | 'achievement' | 'milestone' | 'success_story',
  platform: 'slack' | 'teams' | 'email' | 'internal',
  context: any
): Promise<void> {
  
  console.log('📢 Tracking social sharing');

  try {
    await trackSocialSharing(
      userId,
      domainId,
      shareType,
      platform,
      5, // Estimated recipient count
      context
    );

  } catch (error) {
    console.error('❌ Failed to track sharing:', error);
  }
}

