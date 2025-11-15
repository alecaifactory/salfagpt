/**
 * POST /api/generate-title
 * Generates a title for a conversation based on the first message
 * Returns immediately with the generated title
 */

import type { APIRoute } from 'astro';
import { generateConversationTitle } from '../../lib/gemini';
import { updateConversation } from '../../lib/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return new Response(
        JSON.stringify({ error: 'conversationId and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🏷️ Generating title for conversation:', conversationId);
    console.log('   Message:', message.substring(0, 100));

    // Generate title using Gemini 2.5 Flash
    const title = await generateConversationTitle(message);
    
    console.log('✅ Title generated:', title);

    // Save to Firestore
    await updateConversation(conversationId, { title });
    
    console.log('✅ Title saved to Firestore');

    return new Response(
      JSON.stringify({ title }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error generating title:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate title',
        title: 'Nueva Conversación' // Fallback
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

