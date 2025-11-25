/**
 * ⚡ OPTIMIZED Streaming API endpoint - us-east4 with SQL cosine similarity
 * POST /api/conversations/:id/messages-optimized
 * 
 * Feature flag: PUBLIC_USE_OPTIMIZED_STREAMING=true
 * 
 * Uses PROVEN working approach from bigquery-agent-search.ts:
 * - SQL-based cosine similarity (NOT VECTOR_SEARCH function)
 * - Direct us-east4 access
 * - Same query that works in production
 * 
 * Expected: ~6s (embedding 1s + BigQuery 2s + Gemini 4s)
 */
import type { APIRoute } from 'astro';
import {
  addMessage,
  getMessages,
  getConversation,
  updateConversation,
  firestore,
  getEffectiveOwnerForContext,
} from '../../../../lib/firestore';
import { streamAIResponse } from '../../../../lib/gemini';
import { generateEmbedding } from '../../../../lib/embeddings';
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ 
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt' 
});

/**
 * Search using SQL cosine similarity (PROVEN approach that works)
 * Same as bigquery-agent-search.ts but forced to us-east4
 */
async function searchChunksEast4Direct(
  userId: string,
  agentId: string,
  query: string,
  options: { topK: number; minSimilarity: number }
): Promise<any[]> {
  const startTime = Date.now();
  
  console.log(`⚡ [OPTIMIZED-EAST4] Starting search`);
  console.log(`   Agent: ${agentId}`);
  console.log(`   Query: "${query.substring(0, 50)}..."`);
  
  // Get agent's active sources
  const agentDoc = await firestore.collection('conversations').doc(agentId).get();
  const sourceIds = agentDoc.data()?.activeContextSourceIds || [];
  
  if (sourceIds.length === 0) {
    console.log('   ⚠️ No active sources');
    return [];
  }
  
  console.log(`   📊 ${sourceIds.length} active sources`);
  
  // Get effective owner for shared agents
  const effectiveUserId = await getEffectiveOwnerForContext(agentId, userId);
  console.log(`   🔑 Effective owner: ${effectiveUserId}${effectiveUserId !== userId ? ' (shared)' : ''}`);
  
  // Generate embedding
  const embStart = Date.now();
  const embedding = await generateEmbedding(query);
  console.log(`   ✅ Embedding (${Date.now() - embStart}ms)`);
  
  // SQL-based cosine similarity (PROVEN to work)
  const searchStart = Date.now();
  const sqlQuery = `
    WITH similarities AS (
      SELECT 
        chunk_id,
        source_id,
        chunk_index,
        text_preview,
        full_text,
        metadata,
        (
          SELECT SUM(a * b) / (
            SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
            SQRT((SELECT SUM(b * b) FROM UNNEST(@queryEmbedding) AS b))
          )
          FROM UNNEST(embedding) AS a WITH OFFSET pos
          JOIN UNNEST(@queryEmbedding) AS b WITH OFFSET pos2
            ON pos = pos2
        ) AS similarity
      FROM \`salfagpt.flow_analytics_east4.document_embeddings\`
      WHERE user_id = @effectiveUserId
        AND source_id IN UNNEST(@sourceIds)
    )
    SELECT *
    FROM similarities
    WHERE similarity >= @minSimilarity
    ORDER BY similarity DESC
    LIMIT @topK
  `;
  
  const [rows] = await bq.query({
    query: sqlQuery,
    params: {
      effectiveUserId,
      sourceIds,
      queryEmbedding: embedding,
      minSimilarity: options.minSimilarity,
      topK: options.topK,
    },
    location: 'us-east4', // CRITICAL
  });
  
  console.log(`   ✅ Search complete (${Date.now() - searchStart}ms) - ${rows.length} chunks`);
  console.log(`   ⏱️ Total: ${Date.now() - startTime}ms`);
  
  return rows.map((r: any) => ({
    chunk_id: r.chunk_id,
    text: r.full_text,
    source_id: r.source_id,
    source_name: r.metadata?.sourceName || `Doc ${r.source_id.substring(0, 8)}`,
    chunk_index: r.chunk_index,
    metadata: r.metadata,
    similarity: r.similarity,
  }));
}

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
    console.log('⚡ [OPTIMIZED-EAST4] ========================================');
    console.log('⚡ [OPTIMIZED-EAST4] Using SQL cosine similarity (us-east4 ONLY)');

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
              `data: ${JSON.stringify({ type, timestamp: new Date().toISOString(), ...data })}\n\n`
            ));
          };

          // Step 1: Minimal thinking
          send('thinking', { step: 'thinking', status: 'active' });
          await new Promise(r => setTimeout(r, 500));
          send('thinking', { step: 'thinking', status: 'complete' });

          // Step 2: Search in us-east4
          send('thinking', { step: 'searching', status: 'active' });
          
          let ragResults: any[] = [];
          
          if (!isAllyConversation) {
            ragResults = await searchChunksEast4Direct(userId, effectiveAgentId, message, {
              topK: ragTopK,
              minSimilarity: ragMinSimilarity,
            });
          }
          
          send('thinking', { step: 'searching', status: 'complete', chunksFound: ragResults.length });

          // Step 3: Build references
          send('thinking', { step: 'selecting', status: 'active' });
          
          // Build context
          let ragContext = '';
          if (ragResults.length > 0) {
            ragContext = ragResults
              .map((r, idx) => `
=== Fragmento ${idx + 1}: ${r.source_name} ===
Similitud: ${(r.similarity * 100).toFixed(1)}%

${r.text}
`)
              .join('\n\n');
          }
          
          // Build references (consolidated by document)
          const sourceGroups = new Map<string, any[]>();
          ragResults.forEach(result => {
            const key = result.source_id;
            if (!sourceGroups.has(key)) {
              sourceGroups.set(key, []);
            }
            sourceGroups.get(key)!.push(result);
          });
          
          let refId = 1;
          const references = Array.from(sourceGroups.values()).map(chunks => {
            chunks.sort((a, b) => b.similarity - a.similarity);
            const primary = chunks[0];
            const avgSim = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
            const combined = chunks.map(c => c.text).join('\n\n---\n\n');
            
            return {
              id: refId++,
              sourceId: primary.source_id,
              sourceName: primary.source_name,
              chunkIndex: primary.chunk_index,
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
          
          console.log(`⚡ [OPTIMIZED-EAST4] Built ${references.length} references`);
          
          if (references.length > 0) {
            send('references', { references });
          }
          
          send('thinking', { step: 'selecting', status: 'complete', referencesCount: references.length });

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
            
            send('complete', {
              messageId: aiMsg.id,
              userMessageId: userMsg.id,
              responseTime: totalTime,
              ragConfiguration: {
                enabled: !isAllyConversation,
                actuallyUsed: ragResults.length > 0,
                topK: ragTopK,
                minSimilarity: ragMinSimilarity,
                chunksFound: ragResults.length,
                referencesBuilt: references.length,
                method: 'sql-cosine-similarity',
                dataset: 'flow_analytics_east4',
                location: 'us-east4',
              },
            });
            
            console.log(`⚡ [OPTIMIZED-EAST4] ========================================`);
            console.log(`⚡ [OPTIMIZED-EAST4] COMPLETE in ${totalTime}ms`);
            console.log(`⚡ [OPTIMIZED-EAST4] ========================================`);
          }

          controller.close();
        } catch (error) {
          console.error('❌ [OPTIMIZED-EAST4] Error:', error);
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
    console.error('❌ [OPTIMIZED-EAST4] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream response',
        details: error instanceof Error ? error.message : 'Unknown' 
      }),
      { status: 500 }
    );
  }
};
