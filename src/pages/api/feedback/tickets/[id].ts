import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';
import type { TicketStatus, TicketPriority } from '../../../../types/feedback';

/**
 * PUT /api/feedback/tickets/[id]
 * 
 * Update a feedback ticket (status, priority, assignment, etc.)
 * Admin/Expert only
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check permissions
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userData = userDoc.data();
    
    if (!userData || !['admin', 'expert'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get ticket ID
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse updates
    const updates = await request.json();
    const allowedUpdates: any = {};

    // Only allow specific fields to be updated
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.priority) allowedUpdates.priority = updates.priority;
    if (updates.assignedTo !== undefined) allowedUpdates.assignedTo = updates.assignedTo;
    if (updates.sprintAssigned !== undefined) allowedUpdates.sprintAssigned = updates.sprintAssigned;
    if (updates.roadmapQuarter !== undefined) allowedUpdates.roadmapQuarter = updates.roadmapQuarter;
    if (updates.releaseVersion !== undefined) allowedUpdates.releaseVersion = updates.releaseVersion;

    // Always update timestamp
    allowedUpdates.updatedAt = new Date();

    // If status changed to done, set resolvedAt
    if (updates.status === 'done') {
      allowedUpdates.resolvedAt = new Date();
    }

    // If assigned, track assignment date
    if (updates.assignedTo && updates.assignedTo !== '') {
      allowedUpdates.assignedAt = new Date();
    }

    // 5. Update ticket
    await firestore.collection('feedback_tickets').doc(id).update(allowedUpdates);

    console.log(`✅ Ticket ${id} updated by ${session.id}:`, allowedUpdates);

    // 6. Return success
    return new Response(
      JSON.stringify({ success: true, updated: allowedUpdates }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/feedback/tickets/[id]
 * 
 * Delete a feedback ticket (Admin only)
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check admin permissions
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get ticket ID
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Delete ticket
    await firestore.collection('feedback_tickets').doc(id).delete();

    console.log(`✅ Ticket ${id} deleted by ${session.id}`);

    // 5. Return success
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

