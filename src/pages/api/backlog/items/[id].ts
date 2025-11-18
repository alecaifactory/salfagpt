/**
 * API Endpoint: Update Backlog Item
 * PATCH /api/backlog/items/{id}
 * 
 * 🔒 Security: Only accessible by alec@getaifactory.com
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { verifyJWT } from '../../../../lib/auth';

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    // 1. Verify authentication
    const token = cookies.get('flow_session')?.value;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = verifyJWT(token);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. CRITICAL: Only allow alec@getaifactory.com
    if (session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get item ID
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing item ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. Get update data
    const updates = await request.json();
    
    // 5. Update item
    const itemRef = firestore.collection('backlog_items').doc(id);
    
    // Check if item exists
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Backlog item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update with timestamp
    await itemRef.update({
      ...updates,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Backlog item updated: ${id}`, updates);
    
    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error updating backlog item:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to update backlog item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Verify authentication
    const token = cookies.get('flow_session')?.value;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = verifyJWT(token);
    
    if (!session || session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Get item
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing item ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const itemDoc = await firestore.collection('backlog_items').doc(id).get();
    
    if (!itemDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Backlog item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const item = {
      id: itemDoc.id,
      ...itemDoc.data(),
      createdAt: itemDoc.data()?.createdAt?.toDate?.() || new Date(),
      updatedAt: itemDoc.data()?.updatedAt?.toDate?.() || new Date(),
    };
    
    return new Response(
      JSON.stringify(item),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error getting backlog item:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to get backlog item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};















