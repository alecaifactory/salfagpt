/**
 * Bulk Queue Operations API
 * POST /api/queue/bulk-add - Add multiple items to queue at once
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import type { MessageQueueItem, BulkImportResult } from '../../../types/queue';

const QUEUE_COLLECTION = 'message_queue';

// Helper to get environment source
function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'localhost' : 'production';
}

// Parse bulk text input (one prompt per line)
function parseBulkText(text: string): Array<{ message: string; line: number }> {
  return text
    .split('\n')
    .map((line, index) => ({ 
      message: line.trim(), 
      line: index + 1 
    }))
    .filter(item => item.message.length > 0);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      userId,
      conversationId,
      items, // Array of items to add
      bulkText, // Alternative: multi-line text (one prompt per line)
      basePriority = 5,
      captureContext = false,
      contextSnapshot,
    } = body;
    
    if (!userId || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'userId and conversationId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!items && !bulkText) {
      return new Response(
        JSON.stringify({ error: 'Either items array or bulkText required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📦 Bulk adding queue items:', { conversationId, userId });
    
    // Parse input
    let parsedItems: Array<{ message: string; line?: number }>;
    
    if (bulkText) {
      parsedItems = parseBulkText(bulkText);
      console.log(`📝 Parsed ${parsedItems.length} items from bulk text`);
    } else {
      parsedItems = items;
    }
    
    if (parsedItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid items to add' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get current queue length for position calculation
    const existingSnapshot = await firestore
      .collection(QUEUE_COLLECTION)
      .where('conversationId', '==', conversationId)
      .where('userId', '==', userId)
      .get();
    
    let currentPosition = existingSnapshot.size;
    
    // Use Firestore batch for efficient bulk creation
    const BATCH_SIZE = 500;
    const batches: any[] = [];
    let currentBatch = firestore.batch();
    let operationCount = 0;
    
    const createdItems: MessageQueueItem[] = [];
    const errors: BulkImportResult['errors'] = [];
    
    for (let i = 0; i < parsedItems.length; i++) {
      const parsed = parsedItems[i];
      
      try {
        // Create queue item
        const queueItem: Omit<MessageQueueItem, 'id'> = {
          userId,
          conversationId,
          message: parsed.message,
          title: undefined,
          description: undefined,
          status: 'pending',
          executionMode: 'auto',
          position: currentPosition,
          priority: basePriority,
          contextSnapshot: captureContext ? contextSnapshot : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: getEnvironmentSource(),
        };
        
        // Filter undefined values
        const cleanItem = Object.fromEntries(
          Object.entries(queueItem).filter(([_, v]) => v !== undefined)
        );
        
        // Add to batch
        const docRef = firestore.collection(QUEUE_COLLECTION).doc();
        currentBatch.set(docRef, cleanItem);
        
        createdItems.push({
          id: docRef.id,
          ...cleanItem as any,
        });
        
        operationCount++;
        currentPosition++;
        
        // If batch is full, start a new one
        if (operationCount >= BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = firestore.batch();
          operationCount = 0;
        }
        
      } catch (itemError) {
        errors?.push({
          line: parsed.line || i + 1,
          message: parsed.message,
          error: itemError instanceof Error ? itemError.message : String(itemError),
        });
      }
    }
    
    // Add remaining operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    console.log(`📦 Created ${batches.length} batch(es) for ${parsedItems.length} items`);
    
    // Commit all batches in parallel
    const batchStartTime = Date.now();
    await Promise.all(batches.map(batch => batch.commit()));
    const batchElapsed = Date.now() - batchStartTime;
    
    console.log(`✅ Bulk add complete: ${createdItems.length} items in ${batchElapsed}ms`);
    
    const result: BulkImportResult = {
      itemsCreated: createdItems.length,
      items: createdItems,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error in bulk add:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to bulk add queue items',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};











