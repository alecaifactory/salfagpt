/**
 * Streaming API endpoint for real-time AI responses
 * POST /api/conversations/:id/messages-stream
 * 
 * Returns Server-Sent Events (SSE) stream with chunks of AI response
 */
import type { APIRoute } from 'astro';
import {
  addMessage,
  getMessages,
  getConversation,
  updateConversation,
} from '../../../../lib/firestore';
import { streamAIResponse } from '../../../../lib/gemini';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const conversationId = params.id;
    const body = await request.json();
    const { userId, message, model, systemPrompt, contextSources } = body;

    if (!conversationId || !userId || !message) {
      return new Response(
        JSON.stringify({ error: 'conversationId, userId, and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build additional context from active sources
    let additionalContext = '';
    let ragUsed = false;
    let ragStats = null;
    let ragHadFallback = false;
    
    // NEW: Track RAG configuration used
    const ragTopK = body.ragTopK || 5;
    const ragMinSimilarity = body.ragMinSimilarity || 0.5;
    const ragEnabled = body.ragEnabled !== false; // Default: enabled

    if (contextSources && contextSources.length > 0) {
      const activeSourceIds = contextSources.map((s: any) => s.id).filter(Boolean);
      
      // Try RAG search if enabled
      if (ragEnabled && activeSourceIds.length > 0) {
        try {
          console.log('🔍 [Streaming] Attempting RAG search...');
          console.log(`  Configuration: topK=${ragTopK}, minSimilarity=${ragMinSimilarity}`);
          const { searchRelevantChunks, buildRAGContext, getRAGStats } = await import('../../../../lib/rag-search.js');
          
          const ragResults = await searchRelevantChunks(userId, message, {
            topK: ragTopK,
            minSimilarity: ragMinSimilarity,
            activeSourceIds
          });
          
          if (ragResults.length > 0) {
            additionalContext = buildRAGContext(ragResults);
            ragUsed = true;
            ragStats = getRAGStats(ragResults);
            console.log(`✅ RAG: Using ${ragResults.length} relevant chunks (${ragStats.totalTokens} tokens)`);
            console.log(`  Avg similarity: ${(ragStats.avgSimilarity * 100).toFixed(1)}%`);
          } else {
            console.log('⚠️ RAG: No results above similarity threshold, falling back to full documents');
            ragHadFallback = true;
            // Fall back to full documents
            additionalContext = contextSources
              .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
              .join('\n');
          }
        } catch (error) {
          console.error('⚠️ RAG search failed, using full documents:', error);
          ragHadFallback = true;
          additionalContext = contextSources
            .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
            .join('\n');
        }
      } else {
        // RAG disabled - use full documents
        console.log('📎 [Streaming] Including full context from', contextSources.length, 'active sources (full-text mode)');
        additionalContext = contextSources
          .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
          .join('\n');
      }
    }

    // Get conversation history for temp conversations
    let conversationHistory: Array<{ role: string; content: string }> = [];
    
    if (conversationId.startsWith('temp-')) {
      // For temp conversations, we don't have history in Firestore
      conversationHistory = [];
    } else {
      // Get conversation history from Firestore
      const messages = await getMessages(conversationId);
      conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : msg.content?.text || String(msg.content),
      }));
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Store user message first (for persistent conversations)
          let userMessageId = '';
          if (!conversationId.startsWith('temp-')) {
            try {
              const userMsg = await addMessage(
                conversationId,
                userId,
                'user',
                { type: 'text', text: message },
                Math.ceil(message.length / 4)
              );
              userMessageId = userMsg.id;
              
              // Send user message ID to client
              const data = `data: ${JSON.stringify({ type: 'userMessage', id: userMessageId })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              console.error('Error saving user message:', error);
            }
          }

          // Accumulate full response for final save
          let fullResponse = '';
          
          // Stream AI response
          const aiStream = streamAIResponse(message, {
            model: model || 'gemini-2.5-flash',
            systemInstruction: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable.',
            conversationHistory,
            userContext: additionalContext,
            temperature: 0.7,
          });

          for await (const chunk of aiStream) {
            fullResponse += chunk;
            
            // Send chunk to client
            const data = `data: ${JSON.stringify({ 
              type: 'chunk', 
              content: chunk 
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Save complete AI message to Firestore (for persistent conversations)
          if (!conversationId.startsWith('temp-')) {
            try {
              const aiMsg = await addMessage(
                conversationId,
                userId,
                'assistant',
                { type: 'text', text: fullResponse },
                Math.ceil(fullResponse.length / 4)
              );

              // Update conversation stats
              await updateConversation(conversationId, {
                messageCount: (await getMessages(conversationId)).length,
                lastMessageAt: new Date(),
              });

              // Send completion event with message ID and RAG configuration
              const data = `data: ${JSON.stringify({ 
                type: 'complete', 
                messageId: aiMsg.id,
                userMessageId: userMessageId,
                ragUsed,
                ragStats,
                // NEW: Complete RAG configuration audit trail
                ragConfiguration: {
                  enabled: ragEnabled,
                  actuallyUsed: ragUsed,
                  hadFallback: ragHadFallback,
                  topK: ragTopK,
                  minSimilarity: ragMinSimilarity,
                  stats: ragUsed ? ragStats : null,
                },
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              console.error('Error saving AI message:', error);
              const data = `data: ${JSON.stringify({ 
                type: 'error', 
                error: 'Failed to save message' 
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          } else {
            // For temp conversations, just send completion
            const data = `data: ${JSON.stringify({ 
              type: 'complete',
              messageId: `msg-${Date.now()}`,
              userMessageId: `msg-${Date.now() - 1}`
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        } catch (error) {
          console.error('❌ Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const data = `data: ${JSON.stringify({ 
            type: 'error', 
            error: errorMessage 
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in streaming endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

