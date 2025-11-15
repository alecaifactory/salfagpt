/**
 * POST /api/generate-title
 * Generates a title for a conversation based on the first message
 * Streams title token by token for visual feedback
 */

import type { APIRoute } from 'astro';
import { streamConversationTitle } from '../../lib/gemini';
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

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullTitle = '';
          
          // Stream title generation
          for await (const chunk of streamConversationTitle(message)) {
            fullTitle += chunk;
            
            console.log('📤 Sending title chunk:', chunk);
            
            // Send chunk via SSE
            const data = `data: ${JSON.stringify({
              type: 'chunk',
              chunk: chunk,
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          console.log('✅ Title generated:', fullTitle);

          // Save final title to Firestore
          if (fullTitle.trim()) {
            await updateConversation(conversationId, { title: fullTitle.trim() });
            console.log('✅ Title saved to Firestore');
          }
          
          // Send completion event
          const completeData = `data: ${JSON.stringify({
            type: 'complete',
            title: fullTitle.trim(),
          })}\n\n`;
          controller.enqueue(encoder.encode(completeData));
          
          controller.close();
        } catch (error: any) {
          console.error('❌ Error generating title:', error);
          
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: error.message || 'Failed to generate title',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('❌ Error in generate-title endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate title',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

