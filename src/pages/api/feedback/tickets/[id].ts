/**
 * API Endpoint: Update Feedback Ticket
 * PATCH /api/feedback/tickets/{id}
 * 
 * Updates feedback ticket properties (lane, status, priority, etc.)
 * 
 * 🔒 Security: 
 * - SuperAdmin can update any ticket
 * - Admin/Expert can update tickets from their domain
 * - Users can view but not update tickets (read-only)
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { verifyJWT } from '../../../../lib/auth';

type Lane = 'backlog' | 'roadmap' | 'in_development' | 'expert_review' | 'production';

// Map lanes to status for consistency
const LANE_TO_STATUS: Record<Lane, string> = {
  backlog: 'new',
  roadmap: 'prioritized',
  in_development: 'in-progress',
  expert_review: 'testing',
  production: 'done',
};

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
    
    // 2. Get ticket ID
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing ticket ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get update data
    const updates = await request.json();
    
    // 4. Load ticket to check permissions
    const ticketRef = firestore.collection('feedback_tickets').doc(id);
    const ticketDoc = await ticketRef.get();
    
    if (!ticketDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ticketData = ticketDoc.data();
    
    // 5. Permission check
    const canUpdate = 
      session.email === 'alec@getaifactory.com' || // SuperAdmin
      (session.role === 'admin' && ticketData?.userDomain === session.email.split('@')[1]) || // Domain admin
      (session.role === 'expert' && ticketData?.userDomain === session.email.split('@')[1]); // Domain expert
    
    if (!canUpdate) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot update tickets from other domains' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 6. Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // If lane is being updated, also update status for consistency
    if (updates.lane && LANE_TO_STATUS[updates.lane as Lane]) {
      updateData.status = LANE_TO_STATUS[updates.lane as Lane];
    }
    
    // If moving to production, set resolvedAt
    if (updates.lane === 'production' && !ticketData?.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    
    // 7. Update ticket
    await ticketRef.update(updateData);
    
    console.log(`✅ Feedback ticket updated: ${id}`, updateData);
    
    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error updating feedback ticket:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to update feedback ticket',
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
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Get ticket
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing ticket ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ticketDoc = await firestore.collection('feedback_tickets').doc(id).get();
    
    if (!ticketDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ticketData = ticketDoc.data();
    
    // 3. Permission check
    const canView = 
      session.email === 'alec@getaifactory.com' || // SuperAdmin
      (session.role === 'admin' && ticketData?.userDomain === session.email.split('@')[1]) || // Domain admin
      (session.role === 'expert' && ticketData?.userDomain === session.email.split('@')[1]) || // Domain expert
      ticketData?.reportedBy === session.id; // Owner
    
    if (!canView) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ticket = {
      id: ticketDoc.id,
      ...ticketData,
      createdAt: ticketData?.createdAt?.toDate?.() || new Date(),
      updatedAt: ticketData?.updatedAt?.toDate?.() || new Date(),
      resolvedAt: ticketData?.resolvedAt?.toDate?.() || null,
      assignedAt: ticketData?.assignedAt?.toDate?.() || null,
    };
    
    return new Response(
      JSON.stringify(ticket),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error getting feedback ticket:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to get feedback ticket',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
