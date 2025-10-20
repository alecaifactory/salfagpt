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

    // NEW: Track RAG configuration used (before doing any work)
    const ragTopK = body.ragTopK || 5;
    const ragMinSimilarity = body.ragMinSimilarity || 0.5;
    const ragEnabled = body.ragEnabled !== false; // Default: enabled

    // Get conversation history for temp conversations (can do this early)
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

          // Step 1: Pensando... (3 seconds with progressive dots)
          sendStatus('thinking', 'active');
          await new Promise(resolve => setTimeout(resolve, 3000));
          sendStatus('thinking', 'complete');

          // Build context DURING streaming (not before)
          let additionalContext = '';
          let ragUsed = false;
          let ragStats = null;
          let ragHadFallback = false;
          let ragResults: any[] = [];

          // Step 2: Buscando Contexto Relevante... (includes search time, min 3s total)
          if (contextSources && contextSources.length > 0) {
            sendStatus('searching', 'active');
            const searchStartTime = Date.now();
            
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
                  // SUCCESS: Use RAG chunks
                  additionalContext = buildRAGContext(ragResults);
                  ragUsed = true;
                  ragStats = getRAGStats(ragResults);
                  console.log(`✅ RAG: Using ${ragResults.length} relevant chunks (${ragStats.totalTokens} tokens)`);
                  console.log(`  Avg similarity: ${(ragStats.avgSimilarity * 100).toFixed(1)}%`);
                } else {
                  // NO chunks found - check if documents exist at all
                  console.warn('⚠️ RAG: No chunks found above similarity threshold');
                  console.log('  Checking if documents have chunks available...');
                  
                  // Load chunks directly to check if they exist
                  const { firestore } = await import('../../../../lib/firestore.js');
                  const chunksSnapshot = await firestore
                    .collection('document_chunks')
                    .where('userId', '==', userId)
                    .where('sourceId', 'in', activeSourceIds.slice(0, 10)) // Firestore 'in' limit
                    .limit(1)
                    .get();
                  
                  if (chunksSnapshot.empty) {
                    // No chunks exist - documents need indexing
                    console.warn('⚠️ No chunks exist - using full documents as fallback');
                    ragHadFallback = true;
                    additionalContext = contextSources
                      .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
                      .join('\n');
                  } else {
                    // Chunks exist but similarity too low - lower threshold and retry
                    console.log('  Chunks exist, retrying with lower similarity threshold (0.3)...');
                    const retryResults = await searchRelevantChunks(userId, message, {
                      topK: ragTopK * 2, // Double topK
                      minSimilarity: 0.3, // Lower threshold
                      activeSourceIds
                    });
                    
                    if (retryResults.length > 0) {
                      // SUCCESS with lower threshold
                      additionalContext = buildRAGContext(retryResults);
                      ragUsed = true;
                      ragResults = retryResults;
                      ragStats = getRAGStats(retryResults);
                      console.log(`✅ RAG (retry): Using ${retryResults.length} chunks with lower threshold`);
                    } else {
                      // Still no results - use full documents
                      console.warn('⚠️ No relevant chunks even with lower threshold - using full documents');
                      ragHadFallback = true;
                      additionalContext = contextSources
                        .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
                        .join('\n');
                    }
                  }
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
            
            // Ensure minimum 3 seconds for this step
            const searchElapsed = Date.now() - searchStartTime;
            if (searchElapsed < 3000) {
              await new Promise(resolve => setTimeout(resolve, 3000 - searchElapsed));
            }
            
            sendStatus('searching', 'complete');

            // Step 3: Seleccionando Chunks... (ALWAYS show this step, 3 seconds)
            // Show even if RAG not used, to keep consistent 4-step process
            sendStatus('selecting', 'active');
            
            // Send chunk selection details if available
            if (ragUsed && ragStats && ragStats.sources) {
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
            
            await new Promise(resolve => setTimeout(resolve, 3000)); // Always 3 seconds
            sendStatus('selecting', 'complete');
          }

          // Step 4: Generando Respuesta... (streaming happens here)
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
              // Map RAG chunks to reference format that matches what AI will cite
              const references = ragResults.map((result, index) => ({
                id: index + 1, // Sequential numbering [1], [2], etc.
                sourceId: result.sourceId,
                sourceName: result.sourceName,
                chunkIndex: result.chunkIndex,
                similarity: result.similarity,
                snippet: result.text.substring(0, 300), // Longer snippet for better preview
                fullText: result.text, // Complete chunk text
                metadata: {
                  startChar: result.metadata.startChar,
                  endChar: result.metadata.endChar,
                  tokenCount: result.metadata.tokenCount,
                  startPage: result.metadata.startPage,
                  endPage: result.metadata.endPage,
                }
              }));

              console.log('📚 Built references for message:', references.length);
              references.forEach(ref => {
                console.log(`  [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}% - Chunk #${ref.chunkIndex + 1}`);
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

