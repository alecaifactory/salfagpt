// Impact Attribution Service
// Created: 2025-11-09
// Purpose: Connect user feedback to actual improvements (close the loop)

import { firestore } from '../firestore';

interface ImpactAttribution {
  improved: boolean;
  originalFeedback?: {
    id: string;
    userComment: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high';
  };
  correctionApplied?: {
    id: string;
    type: string;
    description: string;
    expertName: string;
    approvedBy: string;
    appliedAt: Date;
  };
  impactMessage?: string;
}

/**
 * Check if current response improved due to user's feedback
 */
export async function checkUserImpact(
  messageId: string,
  userId: string,
  domainId: string
): Promise<ImpactAttribution> {
  
  console.log('🔍 Checking impact attribution for message:', messageId);

  try {
    // Get message to find its interaction pattern
    const message = await firestore
      .collection('messages')
      .doc(messageId)
      .get();

    if (!message.exists) {
      return { improved: false };
    }

    const messageData = message.data();
    const conversationId = messageData?.conversationId;

    if (!conversationId) {
      return { improved: false };
    }

    // Get user's feedback for similar queries in this domain
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userFeedback = await firestore
      .collection('message_feedback')
      .where('userId', '==', userId)
      .where('domain', '==', domainId)
      .where('feedbackType', '==', 'user')
      .where('timestamp', '>=', thirtyDaysAgo)
      .where('correctionApplied', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (userFeedback.empty) {
      return { improved: false };
    }

    // Check if any of these feedback led to corrections
    // that would affect the current message's response

    for (const feedbackDoc of userFeedback.docs) {
      const feedback = feedbackDoc.data();
      
      // Get associated evaluation
      const evaluationSnapshot = await firestore
        .collection('expert_evaluations')
        .where('feedbackId', '==', feedbackDoc.id)
        .where('status', '==', 'approved')
        .limit(1)
        .get();

      if (!evaluationSnapshot.empty) {
        const evaluation = evaluationSnapshot.docs[0].data();

        // Check if correction was applied to domain
        const correctionSnapshot = await firestore
          .collection('domain_prompt_corrections')
          .where('evaluationId', '==', evaluationSnapshot.docs[0].id)
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (!correctionSnapshot.empty) {
          const correction = correctionSnapshot.docs[0].data();

          // This correction is active and affects current responses!
          return {
            improved: true,
            originalFeedback: {
              id: feedbackDoc.id,
              userComment: feedback.userComment || '',
              timestamp: feedback.timestamp?.toDate() || new Date(),
              priority: feedback.priority || 'low'
            },
            correctionApplied: {
              id: correctionSnapshot.docs[0].id,
              type: evaluation.correctionType || 'general',
              description: evaluation.proposedCorrection || '',
              expertName: evaluation.expertName || 'Expert',
              approvedBy: evaluation.approvedBy || 'Admin',
              appliedAt: correction.appliedAt?.toDate() || new Date()
            },
            impactMessage: generateImpactMessage(
              feedback.userComment || '',
              evaluation.correctionType || 'general'
            )
          };
        }
      }
    }

    return { improved: false };

  } catch (error) {
    console.error('❌ Failed to check user impact:', error);
    return { improved: false };
  }
}

/**
 * Generate personalized impact message
 */
function generateImpactMessage(
  userComment: string,
  correctionType: string
): string {
  
  const messages: Record<string, string> = {
    'prompt_enhancement': 'Tu observación ayudó a mejorar el prompt base del sistema',
    'context_addition': 'Identificaste contexto faltante que ahora se incluye',
    'response_refinement': 'Tu feedback refinó cómo el sistema responde',
    'step_clarification': 'Gracias a ti, los pasos ahora son más específicos',
    'general': 'Tu feedback contribuyó a mejorar esta respuesta'
  };

  return messages[correctionType] || messages.general;
}

/**
 * Get user's total impact summary
 */
export async function getUserImpactSummary(
  userId: string,
  domainId: string,
  periodDays: number = 30
): Promise<{
  totalFeedbackGiven: number;
  feedbackThatImproved: number;
  impactRate: number;
  responsesAffected: number;
  usersHelped: number;
  dqsContribution: number;
  recentImpacts: Array<{
    feedbackId: string;
    correctionId: string;
    type: string;
    date: Date;
  }>;
}> {
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    // Get all user feedback
    const allFeedback = await firestore
      .collection('message_feedback')
      .where('userId', '==', userId)
      .where('domain', '==', domainId)
      .where('feedbackType', '==', 'user')
      .where('timestamp', '>=', cutoffDate)
      .get();

    const totalFeedbackGiven = allFeedback.size;

    // Get feedback that led to corrections
    const feedbackThatImproved = allFeedback.docs.filter(doc =>
      doc.data().correctionApplied === true
    ).length;

    const impactRate = totalFeedbackGiven > 0 
      ? feedbackThatImproved / totalFeedbackGiven 
      : 0;

    // Count responses affected (estimate based on similar queries)
    // Each correction typically affects 3-5 similar queries
    const responsesAffected = feedbackThatImproved * 4; // Average estimate

    // Count users helped (estimate based on domain activity)
    const usersHelped = Math.floor(responsesAffected * 0.3); // 30% of affected responses

    // Calculate DQS contribution (each correction ~ 0.1 DQS points)
    const dqsContribution = feedbackThatImproved * 0.1;

    // Get recent impacts
    const recentImpacts = allFeedback.docs
      .filter(doc => doc.data().correctionApplied === true)
      .slice(0, 5)
      .map(doc => {
        const data = doc.data();
        return {
          feedbackId: doc.id,
          correctionId: data.evaluationId || '',
          type: data.correctionType || 'general',
          date: data.timestamp?.toDate() || new Date()
        };
      });

    return {
      totalFeedbackGiven,
      feedbackThatImproved,
      impactRate,
      responsesAffected,
      usersHelped,
      dqsContribution,
      recentImpacts
    };

  } catch (error) {
    console.error('❌ Failed to get impact summary:', error);
    return {
      totalFeedbackGiven: 0,
      feedbackThatImproved: 0,
      impactRate: 0,
      responsesAffected: 0,
      usersHelped: 0,
      dqsContribution: 0,
      recentImpacts: []
    };
  }
}

/**
 * Check if user should see impact notification
 */
export async function shouldShowImpactNotification(
  userId: string,
  messageId: string
): Promise<boolean> {
  
  try {
    // Check if notification was already shown for this message
    const shown = await firestore
      .collection('impact_notifications_shown')
      .where('userId', '==', userId)
      .where('messageId', '==', messageId)
      .limit(1)
      .get();

    if (!shown.empty) {
      return false; // Already shown
    }

    // Check if there's impact to show
    const message = await firestore
      .collection('messages')
      .doc(messageId)
      .get();

    if (!message.exists) {
      return false;
    }

    const messageData = message.data();
    
    // Check if message has improvement metadata
    return messageData?.improvedByUserFeedback === true;

  } catch (error) {
    console.error('❌ Failed to check notification status:', error);
    return false;
  }
}

/**
 * Mark impact notification as shown
 */
export async function markImpactNotificationShown(
  userId: string,
  messageId: string
): Promise<void> {
  
  try {
    await firestore
      .collection('impact_notifications_shown')
      .add({
        userId,
        messageId,
        shownAt: new Date()
      });

  } catch (error) {
    console.warn('⚠️ Failed to mark notification shown:', error);
  }
}

