import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { sendTicketUpdateEmail } from '../../../lib/email-notifications';

/**
 * POST /api/feedback/update-status
 * 
 * Update ticket status and notify user via email
 * Called when admin/system changes ticket status
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate (admin only)
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : 'user';
    
    if (!['admin', 'superadmin', 'expert'].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Parse request
    const body = await request.json();
    const {
      ticketId,
      newStatus,
      updates,
      nextSteps,
      notifyUser = true
    } = body;
    
    if (!ticketId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ticketId, newStatus' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get ticket
    const ticketSnapshot = await firestore
      .collection('feedback_tickets')
      .where('ticketId', '==', ticketId)
      .limit(1)
      .get();
    
    if (ticketSnapshot.empty) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ticketDoc = ticketSnapshot.docs[0];
    const ticketData = ticketDoc.data();
    
    // 4. Update ticket status
    await ticketDoc.ref.update({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: session.id,
      lastUpdate: updates,
      ...(nextSteps && { nextSteps })
    });
    
    console.log(`✅ Ticket ${ticketId} updated to: ${newStatus}`);
    
    // 5. Send email notification to user (if requested)
    let emailSent = false;
    
    if (notifyUser && ticketData.reportedByEmail) {
      try {
        console.log(`📧 Sending status update to: ${ticketData.reportedByEmail}`);
        
        emailSent = await sendTicketUpdateEmail({
          userEmail: ticketData.reportedByEmail,
          userName: ticketData.reportedByName || ticketData.reportedByEmail.split('@')[0],
          ticketId,
          status: newStatus,
          updates: updates || `El ticket fue actualizado a: ${newStatus}`,
          nextSteps
        });
        
        if (emailSent) {
          console.log('✅ Email sent successfully');
          
          // Log email notification
          await ticketDoc.ref.update({
            lastEmailSent: new Date(),
            emailNotificationCount: (ticketData.emailNotificationCount || 0) + 1
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending email (non-critical):', emailError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        newStatus,
        emailSent,
        message: 'Ticket actualizado' + (emailSent ? ' y usuario notificado' : '')
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error updating ticket status:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


