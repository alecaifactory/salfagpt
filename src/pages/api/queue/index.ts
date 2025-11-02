/**
 * Queue Management API
 * GET  /api/queue?conversationId={id}&userId={userId} - List queue items
 * POST /api/queue - Add item to queue
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import type { MessageQueueItem } from '../../../types/queue';

const QUEUE_COLLECTION = 'message_queue';

// Helper to get environment source
function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'localhost' : 'production';
}

// ===== GET - List queue items =====
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
    
    console.log('📋 Loading queue items:', { conversationId, userId });
    
    // Query queue items for this conversation
    const snapshot = await firestore
      .collection(QUEUE_COLLECTION)
      .where('conversationId', '==', conversationId)
      .where('userId', '==', userId) // Privacy: user isolation
      .orderBy('position', 'asc')
      .get();
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        executeAfter: data.executeAfter?.toDate(),
      };
    });
    
    console.log(`✅ Loaded ${items.length} queue items`);
    
    return new Response(
      JSON.stringify({ items }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error loading queue items:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load queue items',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ===== POST - Add item to queue =====
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      userId,
      conversationId,
      message,
      title,
      description,
      priority = 5,
      dependsOn,
      contextSnapshot,
      tags,
      notes,
    } = body;
    
    // Validate required fields
    if (!userId || !conversationId || !message) {
      return new Response(
        JSON.stringify({ error: 'userId, conversationId, and message required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('➕ Adding item to queue:', {
      conversationId,
      message: message.substring(0, 50) + '...',
      priority,
    });
    
    // Get current queue length to determine position
    const existingSnapshot = await firestore
      .collection(QUEUE_COLLECTION)
      .where('conversationId', '==', conversationId)
      .where('userId', '==', userId)
      .get();
    
    const position = existingSnapshot.size;
    
    // Create queue item
    const queueItem: Omit<MessageQueueItem, 'id'> = {
      userId,
      conversationId,
      message,
      title: title || undefined,
      description: description || undefined,
      status: 'pending',
      executionMode: 'auto', // Will use queue config
      position,
      priority,
      dependsOn: dependsOn || undefined,
      contextSnapshot: contextSnapshot || undefined,
      tags: tags || undefined,
      notes: notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    // Filter undefined values
    const cleanItem = Object.fromEntries(
      Object.entries(queueItem).filter(([_, v]) => v !== undefined)
    );
    
    // Add to Firestore
    const docRef = await firestore
      .collection(QUEUE_COLLECTION)
      .add(cleanItem);
    
    console.log('✅ Queue item added:', docRef.id);
    
    // Get queue config to check if should auto-execute
    const configDoc = await firestore
      .collection('queue_configs')
      .doc(conversationId)
      .get();
    
    const config = configDoc.exists ? configDoc.data() : null;
    
    // Note: Auto-execution will be triggered by frontend queue processor
    // Backend just creates the item
    
    return new Response(
      JSON.stringify({ 
        id: docRef.id, 
        ...cleanItem,
        autoExecuteEnabled: config?.autoExecute || false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error adding queue item:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to add queue item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



