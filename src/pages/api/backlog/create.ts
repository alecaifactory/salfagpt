/**
 * API Endpoint: Create Backlog Item
 * POST /api/backlog/create
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { BacklogItem } from '../../../types/feedback';

export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication (optional for now, can be public)
    const session = getSession(context);
    
    // Get request body
    const body = await context.request.json();
    
    const {
      companyId,
      userId,
      title,
      description,
      userStory,
      acceptanceCriteria = [],
      feedbackSessionIds = [],
      type = 'feature',
      category = 'other',
      tags = [],
      priority = 'medium',
      estimatedEffort = 'm',
      estimatedCSATImpact = 0,
      estimatedNPSImpact = 0,
      affectedUsers = 0,
      alignedOKRs = [],
      okrImpactScore = 0,
      lane = 'backlog',
      status = 'new',
    } = body;
    
    // 2. Validate required fields
    if (!companyId || !title || !description) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: companyId, title, description'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get current max position for this lane
    // ✅ FIX: Avoid compound index requirement - get all items and filter in memory
    const allItems = await firestore
      .collection('backlog_items')
      .where('companyId', '==', companyId)
      .where('lane', '==', lane)
      .get();
    
    let maxPosition = 0;
    if (!allItems.empty) {
      allItems.docs.forEach(doc => {
        const position = doc.data().position || 0;
        if (position > maxPosition) {
          maxPosition = position;
        }
      });
    }
    
    // 4. Create backlog item
    const backlogItemData: Omit<BacklogItem, 'id'> = {
      companyId,
      title,
      description,
      userStory: userStory || `As a user, I want ${title}, so that I can improve my workflow`,
      acceptanceCriteria,
      feedbackSessionIds,
      createdBy: session ? 'user' : 'admin',
      createdByUserId: userId || session?.id,
      type,
      category,
      tags,
      priority,
      estimatedEffort,
      estimatedCSATImpact,
      estimatedNPSImpact,
      affectedUsers,
      alignedOKRs,
      okrImpactScore,
      status,
      lane,
      position: maxPosition + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'localhost',
    };
    
    const ref = await firestore.collection('backlog_items').add(backlogItemData);
    
    console.log('✅ Backlog item created:', ref.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        id: ref.id,
        item: {
          id: ref.id,
          ...backlogItemData
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error creating backlog item:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create backlog item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

