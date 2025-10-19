/**
 * Admin API to re-index all documents for RAG
 * 
 * POST /api/admin/rag-reindex-all - Queue all documents without RAG for re-indexing
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // TODO: Add admin authentication check
    // const session = await verifyJWT(cookies.get('flow_session')?.value);
    // if (!session || session.role !== 'admin') {
    //   return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    console.log('📋 Starting bulk re-indexing for RAG...');

    // Find all sources without RAG
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('ragEnabled', '!=', true)
      .get();

    console.log(`  Found ${sourcesSnapshot.size} documents to re-index`);

    // In a real implementation, you'd queue these for background processing
    // For now, we'll just mark them for re-processing
    const batch = firestore.batch();
    
    sourcesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        ragReindexQueued: true,
        ragReindexQueuedAt: new Date()
      });
    });

    await batch.commit();

    console.log(`✅ ${sourcesSnapshot.size} documents queued for re-indexing`);

    return new Response(
      JSON.stringify({
        success: true,
        documentsQueued: sourcesSnapshot.size,
        message: 'Los documentos se re-indexarán en segundo plano'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error queuing bulk re-index:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to queue re-indexing' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

