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

    // 7. Create basic ticket (simplified - no AI for MVP)
    let ticketId: string | undefined;
    try {
      const ticketData: any = {
        feedbackId,
        messageId,
        conversationId,
        title: generateBasicTitle(feedbackType, expertRating || userStars),
        description: expertNotes || userComment || 'Sin descripción',
        category: 'other',
        priority: determinePriority(feedbackType, expertRating, userStars),
        status: 'new',
        reportedBy: userId,
        reportedByEmail: userEmail,
        reportedByRole: userRole,
        
        // ✅ CRITICAL: originalFeedback must always be present
        originalFeedback: {
          type: feedbackType,
          rating: feedbackType === 'expert' ? expertRating : userStars,
          comment: expertNotes || userComment,
          screenshots: screenshots || [],
          screenshotAnalysis: feedbackData.screenshotAnalysis,
        },
        
        // ✅ Store expert scores at ticket level for easy access
        ...(feedbackType === 'expert' && {
          npsScore,
          csatScore,
        }),
        
        userImpact: 'medium',
        estimatedEffort: 'm',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      };

      const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
      ticketId = ticketRef.id;

      // Update feedback with ticketId
      await feedbackRef.update({
        ticketId,
        ticketCreatedAt: new Date(),
      });

      console.log(`✅ Ticket created: ${ticketId}`);
    } catch (error) {
      console.warn('⚠️ Ticket creation failed (non-critical):', error);
    }

    // 8. Return success
    return new Response(
      JSON.stringify({
        success: true,
        feedbackId,
        ticketId,
        message: 'Feedback recibido exitosamente',
      }),
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

