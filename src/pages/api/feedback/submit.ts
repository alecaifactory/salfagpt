import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { MessageFeedback } from '../../../types/feedback';

/**
 * POST /api/feedback/submit
 * 
 * Submit feedback for a message (Expert or User feedback)
 * Creates feedback document and optionally generates ticket
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const {
      messageId,
      conversationId,
      userId,
      userEmail,
      userRole,
      feedbackType,
      expertRating,
      expertNotes,
      npsScore,
      csatScore,
      userStars,
      userComment,
      screenshots,
    } = body;

    // 3. Verify ownership
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot submit feedback for other users' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate required fields
    if (!messageId || !conversationId || !feedbackType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Validate feedback type specific fields
    if (feedbackType === 'expert' && !expertRating) {
      return new Response(
        JSON.stringify({ error: 'Expert rating is required for expert feedback' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (feedbackType === 'user' && userStars === undefined) {
      return new Response(
        JSON.stringify({ error: 'Star rating is required for user feedback' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Create feedback document (simplified - no AI for now)
    const feedbackData: any = {
      messageId,
      conversationId,
      userId,
      userEmail,
      userRole,
      feedbackType,
      timestamp: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    };

    // Add type-specific fields
    if (feedbackType === 'expert') {
      feedbackData.expertRating = expertRating;
      if (expertNotes) feedbackData.expertNotes = expertNotes;
      if (npsScore !== undefined) feedbackData.npsScore = npsScore;
      if (csatScore !== undefined) feedbackData.csatScore = csatScore;
    } else {
      feedbackData.userStars = userStars;
      if (userComment) feedbackData.userComment = userComment;
    }

    // Add screenshots if provided
    if (screenshots && screenshots.length > 0) {
      feedbackData.screenshots = screenshots;
    }

    console.log('💾 Saving feedback to Firestore:', {
      messageId,
      conversationId,
      feedbackType,
      userId: userId.substring(0, 8) + '...',
    });

    const feedbackRef = await firestore.collection('message_feedback').add(feedbackData);
    const feedbackId = feedbackRef.id;

    console.log(`✅ Feedback created: ${feedbackId} (${feedbackType})`);

    // 7. Create ticket with complete metadata for roadmap integration
    let ticketId: string | undefined;
    try {
      // Extract domain from email
      const userDomain = userEmail.split('@')[1] || 'unknown';
      
      // Get user name from users collection
      let userName = userEmail.split('@')[0]; // Fallback
      try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userName = userDoc.data()?.name || userName;
        }
      } catch (err) {
        console.warn('Could not fetch user name, using email fallback');
      }
      
      // Get conversation title from conversations collection
      let conversationTitle = 'General';
      try {
        const convDoc = await firestore.collection('conversations').doc(conversationId).get();
        if (convDoc.exists) {
          conversationTitle = convDoc.data()?.title || conversationTitle;
        }
      } catch (err) {
        console.warn('Could not fetch conversation title, using default');
      }
      
      // Determine feedback category based on type and content
      const feedbackCategory = determineFeedbackCategory(feedbackType, expertRating, userStars, expertNotes || userComment);
      
      // Build originalFeedback without undefined values
      const originalFeedback: any = {
        type: feedbackType,
        rating: feedbackType === 'expert' ? expertRating : userStars,
        screenshots: screenshots || [],
      };
      
      // Add optional fields only if they exist
      if (expertNotes || userComment) {
        originalFeedback.comment = expertNotes || userComment;
      }
      if (feedbackData.screenshotAnalysis) {
        originalFeedback.screenshotAnalysis = feedbackData.screenshotAnalysis;
      }
      if (feedbackType === 'expert') {
        if (npsScore !== undefined && npsScore !== null) {
          originalFeedback.npsScore = npsScore;
        }
        if (csatScore !== undefined && csatScore !== null) {
          originalFeedback.csatScore = csatScore;
        }
      } else {
        if (userStars !== undefined && userStars !== null) {
          originalFeedback.userStars = userStars;
        }
      }
      
      const ticketData: any = {
        feedbackId,
        messageId,
        conversationId,
        ticketId: `TKT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        
        // ✅ Title and description
        title: generateDetailedTitle(feedbackType, expertRating || userStars, expertNotes || userComment),
        description: expertNotes || userComment || 'Sin descripción',
        
        // ✅ Categorization for roadmap
        category: feedbackCategory,
        feedbackSource: feedbackType, // 'expert' or 'user'
        priority: determinePriority(feedbackType, expertRating, userStars),
        status: 'new',
        lane: 'backlog', // ✅ Always starts in backlog
        
        // ✅ User information for prioritization (standardized field names)
        reportedBy: userId,
        reportedByEmail: userEmail,
        reportedByRole: userRole,
        reportedByName: userName,
        userDomain: userDomain,
        companyDomain: userDomain, // Alias for consistency
        createdBy: userName, // Alias
        createdByRole: userRole, // Alias
        
        // ✅ Agent context
        agentId: conversationId,
        agentName: conversationTitle,
        
        // ✅ CRITICAL: originalFeedback with no undefined values
        originalFeedback: originalFeedback,
        
        // ✅ Store expert scores at ticket level for easy access in roadmap
        estimatedNPS: feedbackType === 'expert' ? (npsScore || 0) : 0,
        estimatedCSAT: feedbackType === 'expert' ? (csatScore || 0) : (userStars || 0),
        estimatedROI: 0, // Can be calculated later by AI or admin
        okrAlignment: [],
        customKPIs: [],
        
        // ✅ Roadmap metadata
        userImpact: determineUserImpact(feedbackType, expertRating, userStars),
        estimatedEffort: 'm',
        
        // ✅ Social features
        upvotes: 0,
        upvotedBy: [],
        views: 0,
        viewedBy: [],
        shares: 0,
        sharedBy: [],
        shareChain: [],
        viralCoefficient: 0,
        
        // ✅ Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      };

      const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
      const firestoreTicketId = ticketRef.id;
      ticketId = ticketData.ticketId; // Use the TKT-* format for user-facing ID

      // Update feedback with ticketId
      await feedbackRef.update({
        ticketId,
        ticketCreatedAt: new Date(),
      });

      console.log(`✅ Ticket created: ${ticketId}`);
      console.log('📋 Ticket data:', {
        ticketId,
        title: ticketData.title,
        lane: ticketData.lane,
        priority: ticketData.priority,
        userRole: ticketData.reportedByRole,
        domain: ticketData.userDomain,
      });
      
      // ✅ NEW: Create notification for all admins/superadmins
      try {
        const adminsSnapshot = await firestore
          .collection('users')
          .where('role', 'in', ['admin', 'superadmin'])
          .get();
        
        const notificationPromises = adminsSnapshot.docs.map(adminDoc => {
          return firestore.collection('feedback_notifications').add({
            adminId: adminDoc.id, // ✅ Admin's hashId (usr_...)
            ticketId: firestoreTicketId,
            ticketNumber: ticketId,
            category: feedbackCategory,
            feedbackType: feedbackType,
            submittedBy: userId, // ✅ User's hashId (usr_...)
            submittedByEmail: userEmail,
            submittedByName: userName,
            submittedByRole: userRole,
            title: ticketData.title,
            isRead: false,
            createdAt: new Date(),
            source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
          });
        });
        
        await Promise.all(notificationPromises);
        console.log('🔔 Notifications sent to', adminsSnapshot.size, 'admins');
      } catch (notifError) {
        console.warn('⚠️ Failed to create notifications (non-critical):', notifError);
      }
      
      // ✅ NEW: Create backlog item for roadmap integration (ALL users)
      try {
        const backlogItem: any = {
          title: ticketData.title,
          description: ticketData.description,
          type: feedbackCategory === 'bug' ? 'bug' : 
                feedbackCategory === 'feature' ? 'feature' : 'improvement',
          priority: ticketData.priority,
          status: 'backlog',
          lane: 'backlog', // Always starts in backlog
          category: feedbackCategory,
          source: 'chat-feedback',
          feedbackTicketId: ticketId,
          feedbackId: feedbackId,
          messageId: messageId,
          conversationId: conversationId,
          
          // User attribution with hashId
          createdBy: userId, // ✅ Hash ID (usr_...)
          createdByEmail: userEmail,
          createdByName: userName,
          createdByRole: userRole,
          userDomain: userDomain,
          
          // Agent context
          agentId: conversationId,
          agentName: conversationTitle,
          
          // Metadata
          metadata: {
            feedbackType: feedbackType,
            hasScreenshots: (screenshots && screenshots.length > 0) || false,
            submittedViaChat: true,
          },
          
          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
        };
        
        const backlogRef = await firestore.collection('backlog_items').add(backlogItem);
        console.log('📋 Backlog item created:', backlogRef.id, '| Ticket:', ticketId);
      } catch (backlogError) {
        console.warn('⚠️ Failed to create backlog item (non-critical):', backlogError);
      }
    } catch (error) {
      console.error('❌ Ticket creation failed (non-critical):', error);
      console.error('Failed with data:', {
        feedbackType,
        userId: userId.substring(0, 8) + '...',
        conversationId,
        userEmail,
        userName,
        conversationTitle,
      });
      console.error('Full error stack:', error instanceof Error ? error.stack : error);
      // Don't throw - feedback is still saved, ticket creation is optional
      ticketId = undefined;
    }

    // 8. Return success
    const response: any = {
      success: true,
      feedbackId,
      message: 'Feedback recibido exitosamente',
    };
    
    // Include ticketId if created successfully
    if (ticketId) {
      response.ticketId = ticketId;
    } else {
      response.warning = 'Feedback guardado pero no se pudo crear ticket';
      console.warn('⚠️ Returning response without ticketId');
    }
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Helper functions
function generateBasicTitle(feedbackType: string, rating: any): string {
  const type = feedbackType === 'expert' ? 'Experto' : 'Usuario';
  const ratingText = typeof rating === 'string' ? rating : `${rating}/5`;
  return `Feedback ${type}: ${ratingText}`;
}

function generateDetailedTitle(feedbackType: string, rating: any, comment?: string): string {
  const type = feedbackType === 'expert' ? 'Experto' : 'Usuario';
  
  // Try to extract meaningful title from comment
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

function determineFeedbackCategory(
  feedbackType: string, 
  expertRating: any, 
  userStars: any, 
  comment?: string
): string {
  const lowerComment = (comment || '').toLowerCase();
  
  // Detect category from comment keywords
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
  if (lowerComment.includes('respuesta') || lowerComment.includes('contexto') || lowerComment.includes('pdf')) {
    return 'content-quality';
  }
  if (lowerComment.includes('agente') || lowerComment.includes('comportamiento')) {
    return 'agent-behavior';
  }
  
  // Default by rating
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'bug';
    if (expertRating === 'sobresaliente') return 'feature-request';
  } else {
    if (userStars <= 2) return 'bug';
    if (userStars >= 4) return 'feature-request';
  }
  
  return 'other';
}

function determineUserImpact(feedbackType: string, expertRating: any, userStars: any): string {
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'high';
    if (expertRating === 'aceptable') return 'medium';
    return 'low'; // sobresaliente = positive feedback
  } else {
    const stars = userStars || 0;
    if (stars <= 2) return 'high'; // Negative feedback = high impact
    if (stars === 3) return 'medium';
    return 'low'; // Positive feedback = low priority (already working well)
  }
}

function determinePriority(feedbackType: string, expertRating: any, userStars: any): string {
  if (feedbackType === 'expert') {
    if (expertRating === 'inaceptable') return 'high';
    if (expertRating === 'aceptable') return 'medium';
    return 'low'; // sobresaliente
  } else {
    const stars = userStars || 0;
    if (stars <= 2) return 'high';
    if (stars === 3) return 'medium';
    return 'low';
  }
}

