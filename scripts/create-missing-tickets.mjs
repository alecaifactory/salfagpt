#!/usr/bin/env node

/**
 * Create Missing Tickets for Feedback
 * 
 * Finds all feedback items without ticketId and creates tickets for them
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
});

// Helper functions (same logic as API endpoint)
function generateDetailedTitle(feedbackType, rating, comment) {
  const type = feedbackType === 'expert' ? 'Experto' : 'Usuario';
  
  if (comment && comment.length > 0) {
    const firstLine = comment.split('\n')[0];
    const titleText = firstLine.length > 60 
      ? firstLine.substring(0, 57) + '...'
      : firstLine;
    return `${titleText}`;
  }
  
  const ratingText = typeof rating === 'string' 
    ? rating.charAt(0).toUpperCase() + rating.slice(1)
    : `${rating}/5 estrellas`;
  
  return `Feedback ${type}: ${ratingText}`;
}

function determinePriority(feedbackType, expertRating, userStars) {
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'high';
    if (expertRating === 'aceptable') return 'medium';
    return 'low';
  } else {
    const stars = userStars || 0;
    if (stars <= 2) return 'high';
    if (stars === 3) return 'medium';
    return 'low';
  }
}

function determineUserImpact(feedbackType, expertRating, userStars) {
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'high';
    if (expertRating === 'aceptable') return 'medium';
    return 'low';
  } else {
    const stars = userStars || 0;
    if (stars <= 2) return 'high';
    if (stars === 3) return 'medium';
    return 'low';
  }
}

function determineFeedbackCategory(feedbackType, expertRating, userStars, comment) {
  const lowerComment = (comment || '').toLowerCase();
  
  if (lowerComment.includes('error') || lowerComment.includes('bug') || lowerComment.includes('falla')) {
    return 'bug';
  }
  if (lowerComment.includes('lento') || lowerComment.includes('performance') || lowerComment.includes('demora')) {
    return 'performance';
  }
  if (lowerComment.includes('ui') || lowerComment.includes('interfaz') || lowerComment.includes('diseño')) {
    return 'ui-improvement';
  }
  if (lowerComment.includes('feature') || lowerComment.includes('funcionalidad') || lowerComment.includes('agregar')) {
    return 'feature-request';
  }
  
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'bug';
    if (expertRating === 'sobresaliente') return 'feature-request';
  } else {
    if (userStars <= 2) return 'bug';
    if (userStars >= 4) return 'feature-request';
  }
  
  return 'other';
}

async function createMissingTickets() {
  console.log('🎫 Creating Missing Tickets');
  console.log('==========================\n');

  try {
    // Get all feedback without tickets
    console.log('1️⃣  Finding feedback without tickets...');
    const feedbackSnap = await firestore
      .collection('message_feedback')
      .get();

    const feedbackWithoutTickets = feedbackSnap.docs.filter(doc => {
      const data = doc.data();
      return !data.ticketId; // Missing ticketId
    });

    console.log(`   Found ${feedbackWithoutTickets.length} feedback items without tickets\n`);

    if (feedbackWithoutTickets.length === 0) {
      console.log('✅ All feedback already has tickets!');
      return;
    }

    let created = 0;
    let failed = 0;

    // Create ticket for each
    for (const feedbackDoc of feedbackWithoutTickets) {
      const feedback = feedbackDoc.data();
      const feedbackId = feedbackDoc.id;

      try {
        console.log(`\n📝 Processing feedback: ${feedbackId}`);
        console.log(`   User: ${feedback.userEmail}`);
        console.log(`   Type: ${feedback.feedbackType}`);

        // Extract domain
        const userDomain = feedback.userEmail.split('@')[1] || 'unknown';

        // Get user name
        let userName = feedback.userEmail.split('@')[0];
        try {
          const userDoc = await firestore.collection('users').doc(feedback.userId).get();
          if (userDoc.exists) {
            userName = userDoc.data()?.name || userName;
          }
        } catch (err) {
          console.warn(`   Could not fetch user name for ${feedback.userId}`);
        }

        // Get conversation title
        let conversationTitle = 'General';
        try {
          const convDoc = await firestore.collection('conversations').doc(feedback.conversationId).get();
          if (convDoc.exists) {
            conversationTitle = convDoc.data()?.title || conversationTitle;
          }
        } catch (err) {
          console.warn(`   Could not fetch conversation title for ${feedback.conversationId}`);
        }

        // Build ticket data
        const expertRating = feedback.expertRating;
        const userStars = feedback.userStars;
        const expertNotes = feedback.expertNotes;
        const userComment = feedback.userComment;
        const npsScore = feedback.npsScore;
        const csatScore = feedback.csatScore;

        const feedbackCategory = determineFeedbackCategory(
          feedback.feedbackType, 
          expertRating, 
          userStars, 
          expertNotes || userComment
        );

        // Build originalFeedback without undefined
        const originalFeedback = {
          type: feedback.feedbackType,
          rating: feedback.feedbackType === 'expert' ? expertRating : userStars,
          screenshots: feedback.screenshots || [],
        };

        if (expertNotes || userComment) {
          originalFeedback.comment = expertNotes || userComment;
        }

        const ticketData = {
          feedbackId,
          messageId: feedback.messageId,
          conversationId: feedback.conversationId,
          ticketId: `TKT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          
          title: generateDetailedTitle(feedback.feedbackType, expertRating || userStars, expertNotes || userComment),
          description: expertNotes || userComment || 'Sin descripción',
          
          category: feedbackCategory,
          feedbackSource: feedback.feedbackType,
          priority: determinePriority(feedback.feedbackType, expertRating, userStars),
          status: 'new',
          lane: 'backlog',
          
          reportedBy: feedback.userId,
          reportedByEmail: feedback.userEmail,
          reportedByRole: feedback.userRole || 'user',
          reportedByName: userName,
          userDomain: userDomain,
          companyDomain: userDomain,
          createdBy: userName,
          createdByRole: feedback.userRole || 'user',
          
          agentId: feedback.conversationId,
          agentName: conversationTitle,
          
          originalFeedback: originalFeedback,
          
          estimatedNPS: feedback.feedbackType === 'expert' ? (npsScore || 0) : 0,
          estimatedCSAT: feedback.feedbackType === 'expert' ? (csatScore || 0) : (userStars || 0),
          estimatedROI: 0,
          okrAlignment: [],
          customKPIs: [],
          
          userImpact: determineUserImpact(feedback.feedbackType, expertRating, userStars),
          estimatedEffort: 'm',
          
          upvotes: 0,
          upvotedBy: [],
          views: 0,
          viewedBy: [],
          shares: 0,
          sharedBy: [],
          shareChain: [],
          viralCoefficient: 0,
          
          createdAt: feedback.timestamp?.toDate?.() || new Date(),
          updatedAt: new Date(),
          source: 'localhost',
        };

        // Create ticket
        const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
        const createdTicketId = ticketData.ticketId;

        // Update feedback with ticketId
        await feedbackDoc.ref.update({
          ticketId: createdTicketId,
          ticketCreatedAt: new Date(),
        });

        console.log(`   ✅ Created ticket: ${createdTicketId}`);
        console.log(`   📋 Title: ${ticketData.title}`);
        console.log(`   🎯 Lane: ${ticketData.lane}, Priority: ${ticketData.priority}`);
        
        created++;

      } catch (error) {
        console.error(`   ❌ Failed to create ticket for ${feedbackId}:`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Total feedback without tickets: ${feedbackWithoutTickets.length}`);
    console.log(`   Tickets created: ${created}`);
    console.log(`   Failed: ${failed}`);
    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Refresh Roadmap - should show new tickets');
    console.log('  2. Refresh MyFeedback - users should see their tickets');
    console.log('  3. If any failed, check error messages above');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Authentication required. Run:');
      console.error('   gcloud auth application-default login --project salfagpt');
    }
    
    process.exit(1);
  }
}

createMissingTickets();

