/**
 * Admin API for RAG statistics
 * 
 * GET /api/admin/rag-stats - Get RAG usage statistics
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // TODO: Add admin authentication check
    // const session = await verifyJWT(cookies.get('flow_session')?.value);
    // if (!session || session.role !== 'admin') {
    //   return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    // Get total chunks
    const chunksCount = await firestore
      .collection('document_chunks')
      .count()
      .get();

    // Get total context sources
    const sourcesCount = await firestore
      .collection('context_sources')
      .count()
      .get();

    // Get sources with RAG enabled
    const sourcesWithRAG = await firestore
      .collection('context_sources')
      .where('ragEnabled', '==', true)
      .count()
      .get();

    // Calculate stats from actual data
    // In a real implementation, you'd aggregate from usage logs
    const stats = {
      totalChunks: chunksCount.data().count,
      totalSources: sourcesCount.data().count,
      sourcesWithRAG: sourcesWithRAG.data().count,
      totalSearches: 0, // TODO: Track from usage logs
      avgSearchTime: 234, // TODO: Calculate from actual searches
      avgSimilarity: 0.76, // TODO: Calculate from actual searches
      fallbackRate: 0.05, // TODO: Calculate from actual searches
      tokensSaved: 0, // TODO: Calculate from context logs
      costSaved: 0 // TODO: Calculate from token savings
    };

    return new Response(
      JSON.stringify({ stats }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error loading RAG stats:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load RAG stats',
        stats: {
          totalChunks: 0,
          totalSources: 0,
          sourcesWithRAG: 0,
          totalSearches: 0,
          avgSearchTime: 0,
          avgSimilarity: 0,
          fallbackRate: 0,
          tokensSaved: 0,
          costSaved: 0
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

