import type { APIRoute } from 'astro';
import {
  addMessage,
  getMessages,
  getConversation,
  calculateContextWindowUsage,
  getUserContext,
} from '../../../../lib/firestore';
import {
  generateAIResponse,
  generateConversationTitle,
} from '../../../../lib/gemini';

// GET /api/conversations/:id/messages - Get conversation messages
export const GET: APIRoute = async ({ params }) => {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle temporary conversations (no Firestore)
    if (conversationId.startsWith('temp-')) {
      return new Response(
        JSON.stringify({ messages: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages = await getMessages(conversationId);

    return new Response(
      JSON.stringify({ messages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch messages' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/conversations/:id/messages - Send message and get AI response
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
    // NEW: Try RAG search first, fall back to full documents
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
          console.log('🔍 Attempting RAG search...');
          console.log(`  Configuration: topK=${ragTopK}, minSimilarity=${ragMinSimilarity}`);
          const { searchRelevantChunks, buildRAGContext, getRAGStats } = await import('../../../../lib/rag-search');
          
          const ragResults = await searchRelevantChunks(userId, message, {
            topK: ragTopK,
            minSimilarity: ragMinSimilarity,
            activeSourceIds
          });
          
          if (ragResults.length > 0) {
            // RAG search succeeded - use relevant chunks only
            additionalContext = buildRAGContext(ragResults);
            ragUsed = true;
            ragStats = getRAGStats(ragResults);
            console.log(`✅ RAG: Using ${ragResults.length} relevant chunks (${ragStats.totalTokens} tokens)`);
            console.log(`  Avg similarity: ${(ragStats.avgSimilarity * 100).toFixed(1)}%`);
            console.log(`  Sources: ${ragStats.sources.map((s: { name: string; chunkCount: number }) => `${s.name} (${s.chunkCount} chunks)`).join(', ')}`);
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
          
          // Graceful degradation - use full documents
          additionalContext = contextSources
            .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
            .join('\n');
        }
      } else {
        // RAG disabled or not explicitly enabled - use full documents (original behavior)
        additionalContext = contextSources
          .map((source: any) => `\n\n=== ${source.name} (${source.type}) ===\n${source.content}`)
          .join('\n');
        
        if (additionalContext) {
          console.log('📎 Including full context from', contextSources.length, 'active sources (full-text mode)');
        }
      }
    }

    // Handle temporary conversations (no Firestore persistence)
    if (conversationId.startsWith('temp-')) {
      console.log('📝 Processing message for temporary conversation:', conversationId);
      
      // Generate AI response without Firestore
      const aiResponse = await generateAIResponse(message, {
        model: model || 'gemini-2.5-flash',
        systemInstruction: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
        conversationHistory: [], // No history for temp conversations
        userContext: additionalContext, // Include active context sources
        temperature: 0.7,
      });

      // Return mock message structure
      const assistantMessage = {
        id: `msg-${Date.now()}`,
        conversationId,
        userId,
        role: 'assistant' as const,
        content: aiResponse.content,
        timestamp: new Date(),
        tokenCount: aiResponse.tokenCount,
        contextSections: aiResponse.contextSections,
      };

      // Calculate token stats
      const totalInputTokens = aiResponse.contextSections
        ?.filter(s => s.name !== 'Model Response')
        .reduce((sum, s) => sum + (s.tokenCount || 0), 0) || 0;
      const totalOutputTokens = aiResponse.tokenCount || 0;
      const contextWindowCapacity = (model === 'gemini-2.5-pro') ? 2000000 : 1000000;
      const contextWindowUsed = totalInputTokens + totalOutputTokens;
      const contextWindowAvailable = contextWindowCapacity - contextWindowUsed;

      return new Response(
        JSON.stringify({
          message: assistantMessage,
          contextUsage: (contextWindowUsed / contextWindowCapacity) * 100,
          contextSections: aiResponse.contextSections || [],
          tokenStats: {
            totalInputTokens,
            totalOutputTokens,
            contextWindowUsed,
            contextWindowAvailable,
            contextWindowCapacity,
            model: model || 'gemini-2.5-flash',
            systemPrompt: systemPrompt || 'Default system prompt',
          },
          ragStats: ragUsed ? ragStats : null, // Include RAG stats if used
          // NEW: Complete RAG configuration audit trail
          ragConfiguration: {
            enabled: ragEnabled,
            actuallyUsed: ragUsed,
            hadFallback: ragHadFallback,
            topK: ragTopK,
            minSimilarity: ragMinSimilarity,
            stats: ragUsed ? ragStats : null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normal flow for persisted conversations
    // Save user message
    const userMessage = await addMessage(
      conversationId,
      userId,
      'user',
      { type: 'text', text: message },
      Math.ceil(message.length / 4) // Approximate token count
    );

    // Get conversation context
    const conversation = await getConversation(conversationId);
    const recentMessages = await getMessages(conversationId, 20);
    const userContext = await getUserContext(userId);

    // Build conversation history
    const conversationHistory = recentMessages
      .slice(0, -1) // Exclude the message we just added
      .map(msg => ({
        role: msg.role,
        content: msg.content.text || JSON.stringify(msg.content),
      }));

    // Build user context string
    const contextString = userContext?.contextItems
      .map(item => `${item.name}: ${item.content}`)
      .join('\n\n') || '';

    // Combine stored user context with active context sources
    const combinedContext = [contextString, additionalContext]
      .filter(Boolean)
      .join('\n\n');

    // Generate AI response with user-selected model and system prompt
    const aiResponse = await generateAIResponse(message, {
      model: model || 'gemini-2.5-flash', // Use user-selected model or default to flash
      systemInstruction: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
      conversationHistory,
      userContext: combinedContext, // Include both stored context and active sources
      temperature: 0.7,
    });

    // Enhance references with source metadata
    const enhancedReferences = aiResponse.references?.map(ref => {
      // Try to find the source this reference came from
      const matchingSource = contextSources?.find((source: any) => 
        ref.snippet && source.content && source.content.includes(ref.snippet)
      );
      
      return {
        ...ref,
        sourceId: matchingSource?.id || '',
        sourceName: matchingSource?.name || 'Documento de contexto',
      };
    });

    // Save assistant message
    const assistantMessage = await addMessage(
      conversationId,
      userId,
      'assistant',
      { type: 'text', text: aiResponse.content.text || String(aiResponse.content) },
      aiResponse.tokenCount,
      aiResponse.contextSections
    );

    // Update context window usage
    const { usage, sections } = await calculateContextWindowUsage(conversationId, userId);

    // Generate title for first message
    if (recentMessages.length === 1) {
      try {
        const title = await generateConversationTitle(message);
        const { updateConversation } = await import('../../../../lib/firestore');
        await updateConversation(conversationId, { title });
      } catch (error) {
        console.error('Error generating title:', error);
      }
    }

    // Calculate token stats (using REAL tokens from Gemini API)
    const totalInputTokens = aiResponse.contextSections
      ?.filter(s => s.name !== 'Model Response')
      .reduce((sum, s) => sum + (s.tokenCount || 0), 0) || 0;
    const totalOutputTokens = aiResponse.tokenCount || 0;
    const contextWindowCapacity = (model === 'gemini-2.5-pro') ? 2000000 : 1000000;
    const contextWindowUsed = totalInputTokens + totalOutputTokens;
    const contextWindowAvailable = contextWindowCapacity - contextWindowUsed;
    
    // Calculate actual context tokens used (considering RAG)
    const actualContextTokens = ragUsed && ragStats 
      ? ragStats.totalTokens  // REAL tokens from RAG chunks
      : contextSources?.reduce((sum: number, s: any) => sum + Math.ceil((s.content?.length || 0) / 4), 0) || 0;

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        contextUsage: usage,
        contextSections: sections,
        references: enhancedReferences, // Include references in response
        ragStats: ragUsed ? ragStats : null, // Include RAG stats if used
        tokenStats: {
          totalInputTokens,
          totalOutputTokens,
          contextWindowUsed,
          contextWindowAvailable,
          contextWindowCapacity,
          actualContextTokens, // NEW: Real context tokens (RAG or full-text)
          model: model || 'gemini-2.5-flash',
          systemPrompt: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
        },
        // NEW: Complete RAG configuration audit trail
        ragConfiguration: {
          enabled: ragEnabled,
          actuallyUsed: ragUsed,
          hadFallback: ragHadFallback,
          topK: ragTopK,
          minSimilarity: ragMinSimilarity,
          stats: ragUsed ? ragStats : null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error processing message:', error);
    console.error('📝 Error details:', error.message);
    
    // Check if it's a Firestore error
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('credentials')) {
      console.error('🔐 Firestore authentication error detected');
      console.error('💡 Run: gcloud auth application-default login');
      console.error('💡 Ensure GOOGLE_CLOUD_PROJECT is set in .env');
      console.error('💡 Verify your account has Firestore permissions');
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process message',
        hint: error.code === 7 ? 'Firestore authentication error. Run: gcloud auth application-default login' : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

