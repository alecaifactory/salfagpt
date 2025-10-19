/**
 * Agent Interactions API
 * 
 * Complete tracking of all agent interactions with full context attribution
 * 
 * POST /api/agent-interactions - Create interaction record
 * GET /api/agent-interactions?conversationId=X - Get interactions for agent
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../lib/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      conversationId,
      userId,
      userRole,
      userMessage,
      aiResponse,
      agentConfig,
      contextUsage,
      tokenStats,
      responseTime
    } = body;

    if (!conversationId || !userId || !userMessage || !aiResponse) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create interaction record with complete attribution
    const interactionDoc = await firestore.collection('agent_interactions').add({
      conversationId,
      userId,
      userRole: userRole || 'usuario',
      timestamp: new Date(),
      
      // Query and response
      userMessage,
      aiResponse,
      responseTime: responseTime || 0,
      
      // Agent configuration at time of interaction
      agentConfig: agentConfig || {},
      
      // Complete context usage details
      contextUsage: contextUsage || {
        sourcesActive: [],
        totalContextTokens: 0,
        contextCost: 0
      },
      
      // Token and cost breakdown
      tokenStats: tokenStats || {},
      
      // CSAT (initially null, filled in later)
      csat: {
        score: null,
        ratedAt: null,
        comment: null,
        categories: null
      },
      
      // Metadata for analysis
      metadata: {
        wasRAGUsed: contextUsage?.sourcesActive?.some((s: any) => s.mode === 'rag') || false,
        ragHitRate: calculateRAGHitRate(contextUsage),
        avgChunkRelevance: calculateAvgRelevance(contextUsage),
        hadFallback: contextUsage?.sourcesActive?.some((s: any) => s.ragDetails?.hadFallback) || false
      }
    });

    console.log('✅ Interaction tracked:', interactionDoc.id);

    return new Response(
      JSON.stringify({
        success: true,
        interactionId: interactionDoc.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error tracking interaction:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to track interaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load interactions for conversation
    let query = firestore
      .collection('agent_interactions')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    const snapshot = await query.get();
    
    const interactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    return new Response(
      JSON.stringify({ interactions }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error loading interactions:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load interactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Calculate RAG hit rate (% of sources that used RAG vs full-text)
 */
function calculateRAGHitRate(contextUsage: any): number {
  if (!contextUsage?.sourcesActive || contextUsage.sourcesActive.length === 0) {
    return 0;
  }
  
  const ragSources = contextUsage.sourcesActive.filter((s: any) => s.mode === 'rag').length;
  return ragSources / contextUsage.sourcesActive.length;
}

/**
 * Calculate average chunk relevance
 */
function calculateAvgRelevance(contextUsage: any): number {
  if (!contextUsage?.sourcesActive) return 0;
  
  const relevances: number[] = [];
  
  for (const source of contextUsage.sourcesActive) {
    if (source.ragDetails?.similarities) {
      relevances.push(...source.ragDetails.similarities);
    }
  }
  
  if (relevances.length === 0) return 0;
  
  return relevances.reduce((sum, r) => sum + r, 0) / relevances.length;
}

