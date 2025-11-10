/**
 * Queue Item Operations API
 * GET    /api/queue/:id - Get single queue item
 * PUT    /api/queue/:id - Update queue item
 * DELETE /api/queue/:id - Delete queue item
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import type { MessageQueueItem, QueueItemUpdate } from '../../../types/queue';

const QUEUE_COLLECTION = 'message_queue';

// ===== GET - Get single queue item =====
export const GET: APIRoute = async ({ params }) => {
  try {
    const itemId = params.id;
    
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Item ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const doc = await firestore
      .collection(QUEUE_COLLECTION)
      .doc(itemId)
      .get();
    
    if (!doc.exists) {
      return new Response(
        JSON.stringify({ error: 'Queue item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const data = doc.data();
    const item = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
      startedAt: data?.startedAt?.toDate(),
      completedAt: data?.completedAt?.toDate(),
      scheduledFor: data?.scheduledFor?.toDate(),
      executeAfter: data?.executeAfter?.toDate(),
    };
    
    return new Response(
      JSON.stringify(item),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error getting queue item:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get queue item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ===== PUT - Update queue item =====
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const itemId = params.id;
    const updates: QueueItemUpdate = await request.json();
    
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Item ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📝 Updating queue item:', itemId, updates);
    
    // Only allow updating certain fields
    const allowedUpdates: Partial<MessageQueueItem> = {
      message: updates.message,
      title: updates.title,
      description: updates.description,
      priority: updates.priority,
      position: updates.position,
      dependsOn: updates.dependsOn,
      status: updates.status,
      tags: updates.tags,
      notes: updates.notes,
      updatedAt: new Date(),
    };
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    );
    
    await firestore
      .collection(QUEUE_COLLECTION)
      .doc(itemId)
      .update(cleanUpdates);
    
    console.log('✅ Queue item updated:', itemId);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error updating queue item:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update queue item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ===== DELETE - Delete queue item =====
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const itemId = params.id;
    
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Item ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🗑️ Deleting queue item:', itemId);
    
    await firestore
      .collection(QUEUE_COLLECTION)
      .doc(itemId)
      .delete();
    
    console.log('✅ Queue item deleted:', itemId);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error deleting queue item:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete queue item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};










