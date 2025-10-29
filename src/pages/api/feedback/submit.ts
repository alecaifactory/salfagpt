import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { MessageFeedback, AnnotatedScreenshot } from '../../../types/feedback';
import { analyzeScreenshotWithGemini, createTicketFromFeedback } from '../../../lib/feedback-service';

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

    // 6. Analyze screenshots with Gemini (if provided)
    let screenshotAnalysis: string | undefined;
    if (screenshots && screenshots.length > 0) {
      try {
        screenshotAnalysis = await analyzeScreenshotWithGemini(
          screenshots,
          feedbackType,
          expertRating || userStars
        );
      } catch (error) {
        console.warn('⚠️ Screenshot analysis failed (non-critical):', error);
      }
    }

    // 7. Create feedback document
    const feedbackData: Omit<MessageFeedback, 'id'> = {
      messageId,
      conversationId,
      userId,
      userEmail,
      userRole,
      feedbackType,
      ...(feedbackType === 'expert' && {
        expertRating,
        expertNotes,
        npsScore,
        csatScore,
      }),
      ...(feedbackType === 'user' && {
        userStars,
        userComment,
      }),
      screenshots,
      screenshotAnalysis,
      timestamp: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    };

    const feedbackRef = await firestore.collection('message_feedback').add(feedbackData);
    const feedbackId = feedbackRef.id;

    console.log(`✅ Feedback created: ${feedbackId} (${feedbackType})`);

    // 8. Create ticket from feedback (async, non-blocking)
    let ticketId: string | undefined;
    try {
      ticketId = await createTicketFromFeedback(feedbackId, feedbackData);
      
      // Update feedback with ticketId
      await feedbackRef.update({
        ticketId,
        ticketCreatedAt: new Date(),
      });

      console.log(`✅ Ticket created from feedback: ${ticketId}`);
    } catch (error) {
      console.warn('⚠️ Ticket creation failed (non-critical):', error);
    }

    // 9. Return success
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

