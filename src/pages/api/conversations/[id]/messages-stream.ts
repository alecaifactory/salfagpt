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
    let ragResults: any[] = []; // Store RAG results for references
    
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
          
          ragResults = await searchRelevantChunks(userId, message, {
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
          // Helper to send status update
          const sendStatus = (step: string, status: 'active' | 'complete') => {
            const data = `data: ${JSON.stringify({ 
              type: 'thinking', 
              step,
              status,
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          };

          // Step 1: Pensando...
          sendStatus('thinking', 'active');
          await new Promise(resolve => setTimeout(resolve, 300)); // Short delay for UX
          sendStatus('thinking', 'complete');

          // Step 2: Buscando Contexto Relevante...
          if (contextSources && contextSources.length > 0) {
            sendStatus('searching', 'active');
            await new Promise(resolve => setTimeout(resolve, 200));
            sendStatus('searching', 'complete');

            // Step 3: Seleccionando Chunks... (only if RAG is used)
            if (ragUsed) {
              sendStatus('selecting', 'active');
              
              // Send chunk selection details
              if (ragStats && ragStats.sources) {
                const chunkData = `data: ${JSON.stringify({ 
                  type: 'chunks',
                  chunks: ragStats.sources.map((s: any) => ({
                    sourceId: s.id,
                    sourceName: s.name,
                    chunkCount: s.chunkCount,
                    tokens: s.tokens
                  }))
                })}\n\n`;
                controller.enqueue(encoder.encode(chunkData));
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
              sendStatus('selecting', 'complete');
            }
          }

          // Step 4: Generando Respuesta...
          sendStatus('generating', 'active');
          
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

          sendStatus('generating', 'complete');

          // Save complete AI message to Firestore (for persistent conversations)
          if (!conversationId.startsWith('temp-')) {
            try {
              // Build references from RAG results BEFORE saving message
              const references = ragResults.map((result, index) => ({
                id: index + 1,
                sourceId: result.sourceId,
                sourceName: result.sourceName,
                chunkIndex: result.chunkIndex,
                similarity: result.similarity,
                snippet: result.text.substring(0, 200), // First 200 chars
                fullText: result.text,
                metadata: result.metadata
              }));

              console.log('📚 Built references for message:', references.length);
              references.forEach(ref => {
                console.log(`  [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}% - Chunk #${ref.chunkIndex}`);
              });

              // Save message with references
              const aiMsg = await addMessage(
                conversationId,
                userId,
                'assistant',
                { type: 'text', text: fullResponse },
                Math.ceil(fullResponse.length / 4),
                undefined, // contextSections (not used here)
                references.length > 0 ? references : undefined // Save references!
              );

              // Update conversation stats
              await updateConversation(conversationId, {
                messageCount: (await getMessages(conversationId)).length,
                lastMessageAt: new Date(),
              });

              // Send completion event with message ID, RAG configuration, and references
              const data = `data: ${JSON.stringify({ 
                type: 'complete', 
                messageId: aiMsg.id,
                userMessageId: userMessageId,
                ragUsed,
                ragStats,
                references: references.length > 0 ? references : undefined,
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

