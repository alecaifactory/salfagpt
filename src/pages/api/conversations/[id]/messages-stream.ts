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
  firestore,
} from '../../../../lib/firestore';
import { streamAIResponse } from '../../../../lib/gemini';
import { searchRelevantChunksOptimized, buildRAGContext, getRAGStats } from 
  '../../../../lib/rag-search-optimized';
import { searchByAgent } from '../../../../lib/bigquery-agent-search';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const conversationId = params.id;
    const body = await request.json();
    const { userId, message, model, systemPrompt } = body;

    if (!conversationId || !userId || !message) {
      return new Response(
        JSON.stringify({ error: 'conversationId, userId, and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🔑 CRITICAL: Determine effective agent ID (for chats, use parent agent)
    let effectiveAgentId = conversationId;
    let isChat = false;
    
    if (!conversationId.startsWith('temp-')) {
      const conversation = await getConversation(conversationId);
      if (conversation?.agentId) {
        effectiveAgentId = conversation.agentId;
        isChat = true;
        console.log(`🔗 Chat detected (${conversationId}) - using parent agent ${effectiveAgentId} for context`);
      }
    }

    // ✅ BACKWARD COMPATIBLE: Support three formats
    // Format 1 (NEW - OPTIMAL): agentId only - BigQuery queries by agent
    // Format 2 (OPTIMIZED): activeSourceIds = ['id1', 'id2', ...] (just IDs)
    // Format 3 (OLD): contextSources = [{id, name, type, content}] (with full text)
    const useAgentSearch = body.useAgentSearch !== false; // Default: true
    const agentId = effectiveAgentId; // ✅ Use effective agent ID
    const activeSourceIds = body.activeSourceIds || 
      (body.contextSources && body.contextSources.map((s: any) => s.id).filter(Boolean)) || 
      [];
    
    console.log(`📋 RAG Configuration:`, {
      conversationId,
      isChat,
      effectiveAgentId,
      useAgentSearch,
      activeSourceIdsCount: activeSourceIds.length,
      approach: useAgentSearch ? 'AGENT_SEARCH (optimal)' : 'SOURCE_IDS (legacy)'
    });

    // RAG configuration (RAG is now the ONLY option) - optimized for technical documents like SSOMA
    const ragTopK = body.ragTopK || 10;
    const ragMinSimilarity = body.ragMinSimilarity || 0.6;
    const ragEnabled = true; // HARDCODED: RAG is now the ONLY option (was: body.ragEnabled !== false)

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
    const streamStartTime = Date.now(); // ✅ Track total response time
    
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
          // Try agent-based search first if enabled (OPTIMAL - no source loading needed!)
          if (useAgentSearch || (activeSourceIds && activeSourceIds.length > 0)) {
            sendStatus('searching', 'active');
            const searchStartTime = Date.now();
            
            // RAG ONLY MODE: Always try RAG search (full-text is disabled)
            try {
              console.log('🔍 [Streaming] Attempting RAG search...');
              console.log(`  Configuration: topK=${ragTopK}, minSimilarity=${ragMinSimilarity}`);
              
              let searchResults: any[] = [];
              let searchMethod = 'unknown';
              
              // ✅ OPTIMAL: Agent-based search (no source loading needed!)
              if (useAgentSearch) {
                console.log('  🚀 Using agent-based BigQuery search (OPTIMAL)...');
                searchResults = await searchByAgent(userId, agentId, message, {
                  topK: ragTopK,
                  minSimilarity: ragMinSimilarity
                });
                
                if (searchResults.length > 0) {
                  searchMethod = 'agent-bigquery';
                  ragResults = searchResults.map(r => ({
                    id: r.chunk_id,
                    text: r.text,
                    sourceId: r.source_id,
                    sourceName: r.source_name,
                    chunkIndex: r.chunk_index,
                    similarity: r.similarity,
                    metadata: r.metadata
                  }));
                  console.log(`  ✅ Agent search: ${ragResults.length} chunks found`);
                } else {
                  console.log('  ⚠️ Agent search returned 0 results, trying legacy method...');
                }
              }
              
              // ✅ LEGACY: Source IDs-based search (if agent search disabled or failed)
              if (ragResults.length === 0 && activeSourceIds.length > 0) {
                console.log('  🔍 Using source IDs-based search (LEGACY)...');
                const searchResult = await searchRelevantChunksOptimized(userId, message, {
                  topK: ragTopK,
                  minSimilarity: ragMinSimilarity,
                  activeSourceIds,
                  preferBigQuery: true
                });
                
                ragResults = searchResult.results;
                searchMethod = searchResult.searchMethod;
                console.log(`  Search method: ${searchResult.searchMethod.toUpperCase()} (${searchResult.searchTime}ms)`);
              }
                
              if (ragResults.length > 0) {
                // SUCCESS: Use RAG chunks
                additionalContext = buildRAGContext(ragResults);
                ragUsed = true;
                ragStats = getRAGStats(ragResults);
                console.log(`✅ RAG: Using ${ragResults.length} relevant chunks (${ragStats.totalTokens} tokens)`);
                console.log(`  Avg similarity: ${(ragStats.avgSimilarity * 100).toFixed(1)}%`);
                console.log(`  Search method: ${searchMethod}`);
              } else {
                  // NO chunks found - check if documents exist at all
                  console.warn('⚠️ RAG: No chunks found above similarity threshold');
                  console.log('  Checking if documents have chunks available...');
                  
                  // If using agent search with no activeSourceIds, skip Firestore fallback
                  if (activeSourceIds.length === 0) {
                    console.warn('⚠️ No activeSourceIds provided (agent search mode) - no context to load');
                    additionalContext = '';
                  } else {
                    // Load chunks directly to check if they exist
                    const chunksSnapshot = await firestore
                      .collection('document_chunks')
                      .where('userId', '==', userId)
                      .where('sourceId', 'in', activeSourceIds.slice(0, 10)) // Firestore 'in' limit
                      .limit(1)
                      .get();
                    
                    if (chunksSnapshot.empty) {
                      // GRACEFUL DEGRADATION: Documents need indexing
                      // Load full text from Firestore only if needed
                      console.warn('⚠️ No chunks exist - loading full documents from Firestore as EMERGENCY FALLBACK');
                      console.warn('   (This is rare - documents should be indexed)');
                      ragHadFallback = true;
                      
                      // Load full extractedData from Firestore for active sources only
                      const sourceIds = activeSourceIds.slice(0, 10); // Limit to 10 for safety
                      const sourcesSnapshot = await firestore
                        .collection('context_sources')
                        .where('__name__', 'in', sourceIds)
                        .get();
                      
                      const fullSources = sourcesSnapshot.docs.map(doc => ({
                        name: doc.data().name,
                        type: doc.data().type,
                        content: doc.data().extractedData || ''
                      }));
                      
                      additionalContext = fullSources
                        .map(source => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
                        .join('\n');
                      
                      console.log(`📚 Loaded ${fullSources.length} full documents from Firestore (${additionalContext.length} chars)`);
                    } else {
                      // Chunks exist but similarity too low - lower threshold and retry
                      console.log('  Chunks exist, retrying with lower similarity threshold (0.2)...');
                      const retrySearchResult = await searchRelevantChunksOptimized(userId, message, {
                        topK: ragTopK * 2, // Double topK
                        minSimilarity: 0.2, // Lower threshold (more permissive)
                        activeSourceIds,
                        preferBigQuery: true
                      });
                      const retryResults = retrySearchResult.results;
                      
                      if (retryResults.length > 0) {
                        // SUCCESS with lower threshold
                        additionalContext = buildRAGContext(retryResults);
                        ragUsed = true;
                        ragResults = retryResults;
                        ragStats = getRAGStats(retryResults);
                        console.log(`✅ RAG (retry): Using ${retryResults.length} chunks with lower threshold`);
                      } else {
                        // GRACEFUL DEGRADATION: Still no results - load full documents from Firestore
                        console.warn('⚠️ No relevant chunks even with lower threshold - loading full documents as EMERGENCY FALLBACK');
                        ragHadFallback = true;
                        
                        // Load full extractedData from Firestore for active sources only
                        const sourceIds = activeSourceIds.slice(0, 10); // Limit to 10 for safety
                        const sourcesSnapshot = await firestore
                          .collection('context_sources')
                          .where('__name__', 'in', sourceIds)
                          .get();
                        
                        const fullSources = sourcesSnapshot.docs.map(doc => ({
                          name: doc.data().name,
                          type: doc.data().type,
                          content: doc.data().extractedData || ''
                        }));
                        
                        additionalContext = fullSources
                          .map(source => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
                          .join('\n');
                        
                        console.log(`📚 Loaded ${fullSources.length} full documents from Firestore (${additionalContext.length} chars)`);
                      }
                    }
                  }
                }
              } catch (error) {
                // GRACEFUL DEGRADATION: RAG search error - load full documents from Firestore
                console.error('⚠️ RAG search failed, loading full documents as EMERGENCY FALLBACK:', error);
                
                // If using agent search with no activeSourceIds, skip Firestore fallback
                if (activeSourceIds.length === 0) {
                  console.warn('⚠️ No activeSourceIds provided (agent search mode) - no context to load');
                  additionalContext = '';
                } else {
                  ragHadFallback = true;
                  
                  // Load full extractedData from Firestore for active sources only
                  const sourceIds = activeSourceIds.slice(0, 10); // Limit to 10 for safety
                  const sourcesSnapshot = await firestore
                    .collection('context_sources')
                    .where('__name__', 'in', sourceIds)
                    .get();
                  
                  const fullSources = sourcesSnapshot.docs.map(doc => ({
                    name: doc.data().name,
                    type: doc.data().type,
                    content: doc.data().extractedData || ''
                  }));
                  
                  additionalContext = fullSources
                    .map(source => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
                    .join('\n');
                  
                  console.log(`📚 Emergency fallback: Loaded ${fullSources.length} full documents (${additionalContext.length} chars)`);
                }
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
              
              // NEW: Send fragment mapping so frontend knows what to expect
              const fragmentMapping = ragResults.map((result, index) => ({
                refId: index + 1,
                chunkIndex: result.chunkIndex,
                sourceName: result.sourceName,
                similarity: result.similarity,
                tokens: result.metadata.tokenCount
              }));
              
              console.log('🗺️ Sending fragment mapping to client:', fragmentMapping.length, 'chunks');
              const mappingData = `data: ${JSON.stringify({ 
                type: 'fragmentMapping',
                mapping: fragmentMapping
              })}\n\n`;
              controller.enqueue(encoder.encode(mappingData));
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000)); // Always 3 seconds
            sendStatus('selecting', 'complete');
          } else {
            // DISABLED: Full-text mode is no longer available
            // RAG is the ONLY option now
            console.warn('⚠️ No active sources provided. RAG mode requires active sources.');
            additionalContext = '';
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
          
          // 🔧 FIX FB-002: Post-process to remove phantom reference numbers
          // If AI mentions citation numbers that don't have corresponding badges,
          // we need to remove them to prevent confusion
          if (ragUsed && ragResults.length > 0) {
            const originalLength = fullResponse.length;
            
            // We'll know the valid reference numbers after building references array
            // For now, store original response for later cleanup
            console.log('📝 Response length before cleanup:', originalLength);
          }

          // Save complete AI message to Firestore (for persistent conversations)
          if (!conversationId.startsWith('temp-')) {
            try {
              // Build references from RAG results OR full documents
              let references: any[] = [];
              
              if (ragUsed && ragResults.length > 0) {
                // ✅ NEW: Group chunks by source document (consolidate references)
                const sourceGroups = new Map<string, typeof ragResults>();
                ragResults.forEach(result => {
                  const key = result.sourceId || result.sourceName;
                  if (!sourceGroups.has(key)) {
                    sourceGroups.set(key, []);
                  }
                  sourceGroups.get(key)!.push(result);
                });
                
                console.log(`📊 Chunks grouped by source: ${sourceGroups.size} unique documents from ${ragResults.length} chunks`);
                
                // Create ONE reference per unique source document
                let refId = 1;
                references = Array.from(sourceGroups.values()).map(chunks => {
                  // Sort chunks by similarity (highest first)
                  chunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
                  
                  // Use highest similarity chunk as representative
                  const primaryChunk = chunks[0];
                  
                  // Calculate average similarity across all chunks from this source
                  const avgSimilarity = chunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / chunks.length;
                  
                  // Combine all chunk texts (for full context in modal)
                  const combinedText = chunks.map(c => c.text).join('\n\n---\n\n');
                  
                  // Total tokens across all chunks from this source
                  const totalTokens = chunks.reduce((sum, c) => 
                    sum + (c.metadata.tokenCount || Math.ceil(c.text.length / 4)), 0
                  );
                  
                  const reference = {
                    id: refId++,
                    sourceId: primaryChunk.sourceId,
                    sourceName: primaryChunk.sourceName,
                    chunkIndex: primaryChunk.chunkIndex, // Show primary chunk index
                    similarity: avgSimilarity, // ✅ Use AVERAGE similarity (more accurate)
                    snippet: primaryChunk.text.substring(0, 300), // Preview from best chunk
                    fullText: combinedText, // ✅ ALL chunks combined for modal view
                    metadata: {
                      startChar: primaryChunk.metadata.startChar || 0,
                      endChar: primaryChunk.metadata.endChar || primaryChunk.text.length,
                      tokenCount: totalTokens, // ✅ Total tokens from all chunks
                      ...(primaryChunk.metadata.startPage !== undefined && { startPage: primaryChunk.metadata.startPage }),
                      ...(primaryChunk.metadata.endPage !== undefined && { endPage: primaryChunk.metadata.endPage }),
                      isRAGChunk: true,
                      chunkCount: chunks.length, // ✅ NEW: How many chunks consolidated
                    }
                  };
                  
                  return reference;
                });
                
                console.log('📚 Built RAG references (consolidated by source):');
                references.forEach(ref => {
                  const chunkInfo = ref.metadata.chunkCount > 1 
                    ? ` (${ref.metadata.chunkCount} chunks consolidated)` 
                    : '';
                  console.log(`  [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}% avg${chunkInfo} - ${ref.metadata.tokenCount} tokens`);
                });
              } else if (activeSourceIds && activeSourceIds.length > 0 && ragHadFallback) {
                // Emergency fallback mode: Create references from full documents
                // This only happens if RAG failed completely (very rare)
                console.warn('⚠️ Creating references for emergency fallback mode');
                references = []; // Will be populated if we loaded fullSources above
                // Note: In emergency fallback, we don't have individual chunks,
                // so references will be minimal or empty
              } else {
                // OLD CODE PATH (legacy): Should not execute anymore
                // Keeping for absolute backward compatibility
                const legacyContextSources = body.contextSources || [];
                references = legacyContextSources.map((source: any, index: number) => ({
                  id: index + 1,
                  sourceId: source.id,
                  sourceName: source.name,
                  chunkIndex: -1, // -1 indicates full document (not a chunk)
                  similarity: 1.0, // Full document = 100% (all content available)
                  snippet: (source.content || '').substring(0, 300),
                  fullText: source.content || '',
                  metadata: {
                    tokenCount: Math.ceil((source.content?.length || 0) / 4),
                    isFullDocument: true, // Flag to indicate this is not a RAG chunk
                  }
                }));
                console.log('📚 Built references from full documents (fallback mode):', references.length);
              }

              references.forEach(ref => {
                const chunkInfo = ref.chunkIndex >= 0 ? `Chunk #${ref.chunkIndex + 1}` : 'Full Document';
                console.log(`  [${ref.id}] ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}% - ${chunkInfo}`);
              });
              
              // 🔧 FIX FB-002: Clean phantom reference numbers
              // Remove citation numbers [N] that don't have corresponding badges
              if (references.length > 0) {
                const validNumbers = references.map(ref => ref.id);
                console.log(`🧹 Cleaning phantom references. Valid numbers: ${validNumbers.join(', ')}`);
                console.log(`📝 Response length before cleanup: ${fullResponse.length} chars`);
                console.log(`📋 Citations in original response: ${(fullResponse.match(/\[[\d,\s]+\]/g) || []).join(', ')}`);
                
                const originalResponse = fullResponse;
                
                // Step 1: Replace citations with multiple numbers [7, 8] or [1, 2, 3]
                // Check if ALL numbers in the list are valid
                fullResponse = fullResponse.replace(/\[(\d+(?:,\s*\d+)*)\]/g, (match, numsStr) => {
                  const nums = numsStr.split(',').map(s => parseInt(s.trim()));
                  const allValid = nums.every(n => validNumbers.includes(n));
                  
                  if (allValid) {
                    // All numbers are valid - keep the citation
                    return match;
                  } else {
                    // At least one number is invalid - remove entire citation
                    console.log(`  ❌ Removing phantom citation: ${match} (contains invalid numbers)`);
                    return '';
                  }
                });
                
                console.log(`📋 After Step 1: ${(fullResponse.match(/\[[\d,\s]+\]/g) || []).join(', ')}`);
                
                // Step 2: Replace single number citations [N]
                fullResponse = fullResponse.replace(/\[(\d+)\]/g, (match, numStr) => {
                  const num = parseInt(numStr);
                  if (validNumbers.includes(num)) {
                    console.log(`  ✅ Keeping valid citation: ${match}`);
                    return match; // Keep valid citations like [1], [2], [3]
                  } else {
                    console.log(`  ❌ Removing phantom citation: ${match}`);
                    return ''; // Remove invalid citations like [9], [10]
                  }
                });
                
                console.log(`📋 After Step 2: ${(fullResponse.match(/\[[\d,\s]+\]/g) || []).join(', ')}`);
                
                // Clean up extra whitespace and empty lines
                fullResponse = fullResponse
                  .replace(/\s+/g, ' ') // Multiple spaces → single space
                  .replace(/\n\s*\n\s*\n/g, '\n\n') // Triple+ newlines → double
                  .trim();
                
                const removedCount = (originalResponse.match(/\[(\d+)\]/g) || []).length - 
                                    (fullResponse.match(/\[(\d+)\]/g) || []).length;
                
                if (removedCount > 0) {
                  console.log(`✅ Removed ${removedCount} phantom citations`);
                  console.log(`   Response length: ${originalResponse.length} → ${fullResponse.length} chars`);
                }
              }

              // Calculate total response time
              const totalResponseTime = Date.now() - streamStartTime; // ✅ Time from start to completion

              // Save message with references and responseTime
              const aiMsg = await addMessage(
                conversationId,
                userId,
                'assistant',
                { type: 'text', text: fullResponse },
                Math.ceil(fullResponse.length / 4),
                undefined, // contextSections (not used here)
                references.length > 0 ? references : undefined, // Save references!
                totalResponseTime // ✅ Save response time in milliseconds
              );

              // Update conversation stats
              await updateConversation(conversationId, {
                messageCount: (await getMessages(conversationId)).length,
                lastMessageAt: new Date(),
              });

              // Send completion event with message ID, RAG configuration, and references
              // ✅ FIX: Send minimal references to avoid JSON size limit (>64KB causes SSE truncation)
              const data = `data: ${JSON.stringify({ 
                type: 'complete', 
                messageId: aiMsg.id,
                userMessageId: userMessageId,
                ragUsed,
                ragStats,
                references: references.length > 0 ? references.map(ref => ({
                  id: ref.id,
                  sourceId: ref.sourceId,
                  sourceName: ref.sourceName,
                  snippet: ref.snippet?.substring(0, 200) || '', // Limit snippet to 200 chars
                  chunkIndex: ref.chunkIndex,
                  similarity: ref.similarity,
                  location: ref.location,
                  metadata: {
                    startChar: ref.metadata?.startChar,
                    endChar: ref.metadata?.endChar,
                    tokenCount: ref.metadata?.tokenCount,
                    startPage: ref.metadata?.startPage,
                    endPage: ref.metadata?.endPage,
                    isRAGChunk: ref.metadata?.isRAGChunk,
                  },
                  // ❌ Removed: fullText (saved in Firestore at line 437, fetch on demand)
                  // ❌ Removed: context.before/after (not needed for citation display)
                })) : undefined,
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

