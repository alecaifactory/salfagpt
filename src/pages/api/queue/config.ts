/**
 * Queue Configuration API
 * GET /api/queue/config?conversationId={id} - Get queue configuration
 * PUT /api/queue/config - Update queue configuration
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import type { QueueConfig, QueueConfigUpdate } from '../../../types/queue';
import { DEFAULT_QUEUE_CONFIG } from '../../../types/queue';

const QUEUE_CONFIG_COLLECTION = 'queue_configs';

// Helper to get environment source
function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'localhost' : 'production';
}

// ===== GET - Get queue configuration =====
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const userId = url.searchParams.get('userId');
    
    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('⚙️ Loading queue config:', conversationId);
    
    const doc = await firestore
      .collection(QUEUE_CONFIG_COLLECTION)
      .doc(conversationId)
      .get();
    
    let config: QueueConfig;
    
    if (!doc.exists) {
      // Return default config (not saved yet)
      console.log('ℹ️ No queue config found, returning defaults');
      config = {
        id: conversationId,
        conversationId,
        userId,
        ...DEFAULT_QUEUE_CONFIG,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: getEnvironmentSource(),
      };
    } else {
      const data = doc.data();
      config = {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as QueueConfig;
    }
    
    return new Response(
      JSON.stringify(config),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error loading queue config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load queue config',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ===== PUT - Update queue configuration =====
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { conversationId, userId, ...configUpdates } = body;
    
    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('💾 Updating queue config:', conversationId, configUpdates);
    
    // Verify user owns conversation
    const convDoc = await firestore
      .collection('conversations')
      .doc(conversationId)
      .get();
    
    if (!convDoc.exists || convDoc.data()?.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your conversation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if config exists
    const configDoc = await firestore
      .collection(QUEUE_CONFIG_COLLECTION)
      .doc(conversationId)
      .get();
    
    if (!configDoc.exists) {
      // Create new config with defaults + updates
      const newConfig: Omit<QueueConfig, 'id'> = {
        conversationId,
        userId,
        ...DEFAULT_QUEUE_CONFIG,
        ...configUpdates,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: getEnvironmentSource(),
      };
      
      await firestore
        .collection(QUEUE_CONFIG_COLLECTION)
        .doc(conversationId)
        .set(newConfig);
      
      console.log('✅ Queue config created:', conversationId);
    } else {
      // Update existing config
      await firestore
        .collection(QUEUE_CONFIG_COLLECTION)
        .doc(conversationId)
        .update({
          ...configUpdates,
          updatedAt: new Date(),
        });
      
      console.log('✅ Queue config updated:', conversationId);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error updating queue config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update queue config',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


