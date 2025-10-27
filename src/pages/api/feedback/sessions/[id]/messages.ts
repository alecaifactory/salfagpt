/**
 * API: Send messages in feedback session
 * POST /api/feedback/sessions/:id/messages - Send message, get AI response
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../../lib/firestore';
import { GoogleGenAI } from '@google/genai';

const FEEDBACK_AGENT_SYSTEM_PROMPT = `
You are a helpful product feedback assistant for the Flow platform.

Your role:
1. Help users articulate their feedback, feature requests, and issues
2. Ask clarifying questions to understand the use case
3. Guide users to provide screenshots and annotations when helpful
4. Extract key requirements and success criteria
5. Estimate potential impact on user satisfaction (CSAT, NPS)

Conversation style:
- Friendly and professional in Spanish
- Ask one question at a time
- Acknowledge user frustrations with empathy
- Be solution-oriented
- Keep responses concise (under 100 words)

When gathering feedback:
- Ask: "¿Qué problema estás tratando de resolver?"
- Ask: "¿Cómo se vería el éxito?"
- Ask: "¿A cuántos usuarios ayudaría esto?"
- Ask: "¿Cuál es el impacto si no se soluciona?" (for bugs)
- Suggest: "¿Una captura de pantalla ayudaría a explicar esto?"

When user provides screenshot:
- Acknowledge: "¡Gracias por la captura! Déjame analizar..."
- Ask: "¿Puedes anotar el área específica a la que te refieres?"

Before submission:
- Summarize the feedback clearly
- List extracted requirements
- Confirm with user: "¿Esto captura todo?"

Remember:
- User feedback is gold - treat it with respect
- Every frustration is an opportunity to improve
- Be genuinely curious about the user's needs
`;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id: sessionId } = params;
    const body = await request.json();
    const { userId, message } = body;
    
    if (!sessionId || !userId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId, userId, and message required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get session
    const sessionDoc = await firestore.collection('feedback_sessions').doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = { id: sessionDoc.id, ...sessionDoc.data() };
    
    // Verify ownership
    if (session.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Build conversation history for AI
    const conversationHistory = (session.messages || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
    
    // Add current user message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });
    
    // Call Gemini AI
    const apiKey = process.env.GOOGLE_AI_API_KEY || 
      (typeof import.meta !== 'undefined' && import.meta.env 
        ? import.meta.env.GOOGLE_AI_API_KEY 
        : undefined);
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    
    const genAI = new GoogleGenAI({ apiKey });
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationHistory,
      config: {
        systemInstruction: FEEDBACK_AGENT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 500,  // Keep responses concise
      }
    });
    
    const aiResponse = result.text || 'Lo siento, no pude generar una respuesta.';
    
    // Create user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    // Create AI message
    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    
    // Update session with both messages
    await firestore.collection('feedback_sessions').doc(sessionId).update({
      messages: [...(session.messages || []), userMessage, aiMessage],
      updatedAt: new Date(),
    });
    
    console.log('✅ Feedback message processed:', sessionId);
    
    return new Response(
      JSON.stringify({
        messageId: aiMessage.id,
        response: aiResponse,
        timestamp: aiMessage.timestamp,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error processing message:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

