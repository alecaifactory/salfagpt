/**
 * ⚡ OPTIMIZED Streaming API endpoint
 * POST /api/conversations/:id/messages-optimized
 * 
 * Feature flag: PUBLIC_USE_OPTIMIZED_STREAMING=true
 * 
 * This is a SIMPLIFIED version of messages-stream.ts with:
 * - No fallback logic (fail fast)
 * - Direct searchByAgent (proven to work)
 * - Minimal steps (no redundant operations)
 * - Same response format (backward compatible)
 * 
 * Expected performance: ~6s (vs ~30s original)
 */
import type { APIRoute } from 'astro';
import {
  addMessage,
  getMessages,
  getConversation,
  updateConversation,
} from '../../../../lib/firestore';
import { streamAIResponse } from '../../../../lib/gemini';
import { searchByAgent } from '../../../../lib/bigquery-router';
import { buildRAGContext, getRAGStats } from '../../../../lib/rag-search-optimized';

export const POST: APIRoute = async ({ params, request }) => {
  const conversationId = params.id;
  
  try {
    const body = await request.json();
    const { 
      userId, 
      message, 
      model = 'gemini-2.5-flash',
      systemPrompt = 'Eres un asistente de IA útil, preciso y amigable.',
      ragTopK = 10,
      ragMinSimilarity = 0.7,
      isAllyConversation = false,
    } = body;

    if (!conversationId || !userId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const totalStart = Date.now();
    console.log('⚡ [OPTIMIZED] Starting request');

    // Get effective agent ID
    let effectiveAgentId = conversationId;
    if (!conversationId.startsWith('temp-')) {
      const conv = await getConversation(conversationId);
      if (conv?.agentId) {
        effectiveAgentId = conv.agentId;
      }
    }

    // Get conversation history
    let conversationHistory: any[] = [];
    if (!conversationId.startsWith('temp-')) {
      const msgs = await getMessages(conversationId);
      conversationHistory = msgs.slice(-10).map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : msg.content?.text || '',
      }));
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const send = (type: string, data: any = {}) => {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type, ...data })}\n\n`
            ));
          };

          // Step 1: Thinking (minimal)
          send('thinking', { step: 'thinking', status: 'active' });
          await new Promise(r => setTimeout(r, 500));
          send('thinking', { step: 'thinking', status: 'complete' });

          // Step 2: Search
          send('thinking', { step: 'searching', status: 'active' });
          
          let ragResults: any[] = [];
          
          if (!isAllyConversation) {
            const requestOrigin = request.headers.get('origin') || 
                                 request.headers.get('referer') || 
                                 request.url;
            
            // Use proven searchByAgent function
            ragResults = await searchByAgent(userId, effectiveAgentId, message, {
              topK: ragTopK,
              minSimilarity: ragMinSimilarity,
              requestOrigin,
            });
            
            console.log(`⚡ [OPTIMIZED] Found ${ragResults.length} chunks`);
          }
          
          send('thinking', { step: 'searching', status: 'complete' });

          // Step 3: Build references
          send('thinking', { step: 'selecting', status: 'active' });
          
          // Build context
          const ragContext = ragResults.length > 0 ? buildRAGContext(ragResults) : '';
          
          // Build references (consolidated by document)
          const sourceGroups = new Map<string, any[]>();
          ragResults.forEach(result => {
            const key = result.sourceId || result.source_id;
            if (!sourceGroups.has(key)) {
              sourceGroups.set(key, []);
            }
            sourceGroups.get(key)!.push(result);
          });
          
          let refId = 1;
          const references = Array.from(sourceGroups.values()).map(chunks => {
            chunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
            const primary = chunks[0];
            const avgSim = chunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / chunks.length;
            const combined = chunks.map(c => c.text).join('\n\n---\n\n');
            
            return {
              id: refId++,
              sourceId: primary.sourceId || primary.source_id,
              sourceName: primary.sourceName || primary.source_name,
              chunkIndex: primary.chunkIndex || primary.chunk_index || 0,
              similarity: avgSim,
              snippet: primary.text.substring(0, 300),
              fullText: combined.substring(0, 5000),
              metadata: {
                startChar: primary.metadata?.startChar || 0,
                endChar: primary.metadata?.endChar || primary.text.length,
                tokenCount: chunks.reduce((sum, c) => 
                  sum + (c.metadata?.tokenCount || Math.ceil(c.text.length / 4)), 0
                ),
                isRAGChunk: true,
                chunkCount: chunks.length,
              },
            };
          });
          
          // Send references
          if (references.length > 0) {
            send('references', { references });
          }
          
          send('thinking', { step: 'selecting', status: 'complete' });

          // Step 4: Generate
          send('thinking', { step: 'generating', status: 'active' });
          
          let fullResponse = '';
          let chunkBuffer = '';
          const BUFFER_SIZE = 500;
          
          const aiStream = streamAIResponse(message, {
            model,
            systemInstruction: systemPrompt,
            conversationHistory,
            userContext: ragContext,
            temperature: 0.7,
          });
          
          for await (const chunk of aiStream) {
            fullResponse += chunk;
            chunkBuffer += chunk;
            
            if (chunkBuffer.length >= BUFFER_SIZE) {
              send('chunk', { content: chunkBuffer });
              chunkBuffer = '';
            }
          }
          
          if (chunkBuffer.length > 0) {
            send('chunk', { content: chunkBuffer });
          }
          
          send('thinking', { step: 'generating', status: 'complete' });

          // Save to Firestore
          if (!conversationId.startsWith('temp-')) {
            const totalTime = Date.now() - totalStart;
            
            const userMsg = await addMessage(
              conversationId,
              userId,
              'user',
              { type: 'text', text: message },
              Math.ceil(message.length / 4)
            );
            
            const aiMsg = await addMessage(
              conversationId,
              userId,
              'assistant',
              { type: 'text', text: fullResponse },
              Math.ceil(fullResponse.length / 4),
              undefined,
              references.length > 0 ? references : undefined,
              totalTime
            );
            
            await updateConversation(conversationId, {
              messageCount: (await getMessages(conversationId)).length,
              lastMessageAt: new Date(),
            });
            
            const ragStats = ragResults.length > 0 ? getRAGStats(ragResults) : null;
            
            send('complete', {
              messageId: aiMsg.id,
              userMessageId: userMsg.id,
              responseTime: totalTime,
              ragConfiguration: {
                enabled: !isAllyConversation,
                actuallyUsed: ragResults.length > 0,
                topK: ragTopK,
                minSimilarity: ragMinSimilarity,
                stats: ragStats,
              },
            });
            
            console.log(`⚡ [OPTIMIZED] Complete in ${totalTime}ms`);
          }

          controller.close();
        } catch (error) {
          console.error('❌ [OPTIMIZED] Error:', error);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })}\n\n`
          ));
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
    console.error('❌ [OPTIMIZED] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream response',
        details: error instanceof Error ? error.message : 'Unknown' 
      }),
      { status: 500 }
    );
  }
};
