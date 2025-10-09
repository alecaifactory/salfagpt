import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { generateAIResponse, insertChatMessage } from '../../lib/gcp';

export const POST: APIRoute = async (context) => {
  // Verify authentication
  const session = getSession(context);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store user message in BigQuery
    try {
      await insertChatMessage(session.id, message, 'user');
    } catch (dbError) {
      console.error('Failed to store user message:', dbError);
      // Continue anyway
    }

    // Generate AI response using Vertex AI
    let aiResponse: string;
    try {
      aiResponse = await generateAIResponse(message);
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      aiResponse = "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
    }

    // Store assistant response in BigQuery
    try {
      await insertChatMessage(session.id, aiResponse, 'assistant');
    } catch (dbError) {
      console.error('Failed to store assistant message:', dbError);
      // Continue anyway
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

