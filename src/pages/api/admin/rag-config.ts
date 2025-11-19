/**
 * Admin API for RAG system configuration
 * 
 * GET /api/admin/rag-config - Get current RAG config
 * POST /api/admin/rag-config - Update RAG config
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

const RAG_CONFIG_DOC_ID = 'system_rag_config';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // TODO: Add admin authentication check
    // const session = await verifyJWT(cookies.get(cookieName)?.value);
    // if (!session || session.role !== 'admin') {
    //   return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    // Load RAG config from Firestore
    const configDoc = await firestore
      .collection('system_config')
      .doc(RAG_CONFIG_DOC_ID)
      .get();

    if (!configDoc.exists) {
      // Return defaults
      return new Response(
        JSON.stringify({
          config: {
            globalEnabled: true,
            defaultTopK: 5,
            defaultChunkSize: 500,
            defaultMinSimilarity: 0.5,
            defaultOverlap: 50,
            batchSize: 5,
            maxChunksPerDocument: 1000,
            cacheTTL: 3600,
            maxEmbeddingsPerDay: 100000,
            alertThreshold: 80000,
            enableFallback: true,
            fallbackThreshold: 0.3,
            enableHybridSearch: false
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        config: configDoc.data()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error loading RAG config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load RAG config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // TODO: Add admin authentication check
    // const session = await verifyJWT(cookies.get(cookieName)?.value);
    // if (!session || session.role !== 'admin') {
    //   return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    // }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'config is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save to Firestore
    await firestore
      .collection('system_config')
      .doc(RAG_CONFIG_DOC_ID)
      .set({
        ...config,
        updatedAt: new Date(),
        updatedBy: 'admin' // TODO: Use actual admin user ID
      });

    console.log('✅ RAG config updated');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving RAG config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save RAG config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

