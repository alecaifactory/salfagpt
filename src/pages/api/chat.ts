import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { generateAIResponse, insertChatMessage } from '../../lib/gcp';
import { logger } from '../../lib/logger';
import { reportError, ApplicationError } from '../../lib/error-reporting';

export const POST: APIRoute = async (context) => {
  const timer = logger.startTimer();
  
  // Verify authentication
  const session = getSession(context);
  if (!session) {
    await logger.warn('Unauthorized chat attempt', {
      endpoint: '/api/chat',
      method: 'POST'
    });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await logger.info('Chat request received', {
      userId: session.id,
      action: 'chat_request',
    });

    const body = await context.request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      await logger.warn('Invalid message format', {
        userId: session.id,
        endpoint: '/api/chat',
      });
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store user message in BigQuery
    try {
      await insertChatMessage(session.id, message, 'user');
      await logger.info('User message stored', {
        userId: session.id,
        messageLength: message.length,
      });
    } catch (dbError) {
      await reportError(
        dbError instanceof Error ? dbError : new Error(String(dbError)),
        { userId: session.id, action: 'store_user_message' }
      );
      // Continue anyway
    }

    // Generate AI response using Vertex AI
    const aiTimer = logger.startTimer();
    let aiResponse: string;
    try {
      aiResponse = await generateAIResponse(message);
      const aiDuration = await aiTimer.end('ai_generation', { userId: session.id });
      
      await logger.info('AI response generated', {
        userId: session.id,
        responseLength: aiResponse.length,
        duration_ms: aiDuration,
      });
    } catch (aiError) {
      await reportError(
        aiError instanceof Error ? aiError : new Error(String(aiError)),
        { userId: session.id, action: 'ai_generation' }
      );
      aiResponse = "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
    }

    // Store assistant response in BigQuery
    try {
      await insertChatMessage(session.id, aiResponse, 'assistant');
      await logger.info('Assistant message stored', {
        userId: session.id,
        responseLength: aiResponse.length,
      });
    } catch (dbError) {
      await reportError(
        dbError instanceof Error ? dbError : new Error(String(dbError)),
        { userId: session.id, action: 'store_assistant_message' }
      );
      // Continue anyway
    }

    const totalDuration = await timer.end('chat_request_total', { userId: session.id });

    return new Response(JSON.stringify({ 
      response: aiResponse,
      _meta: { duration_ms: totalDuration }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await reportError(
      error instanceof Error ? error : new Error(String(error)),
      { 
        userId: session.id, 
        endpoint: '/api/chat',
        method: 'POST'
      }
    );
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

