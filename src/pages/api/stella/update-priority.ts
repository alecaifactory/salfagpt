/**
 * Update Stella Ticket Priority API
 * 
 * Updates ticket priority based on user's impact assessment (CSAT/NPS).
 * 
 * POST /api/stella/update-priority
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { ticketId, impactAssessment } = body as {
      ticketId: string;
      impactAssessment: {
        csatImpact: string;
        npsImpact: string;
        urgency: string;
        usersAffected?: number;
        isCritical?: boolean;
      };
    };
    
    // Determine priority based on impact
    let priority: 'p0' | 'p1' | 'p2' | 'p3' = 'p2'; // Default medium
    let expedite = false;
    
    if (impactAssessment.isCritical || 
        impactAssessment.urgency?.toLowerCase().includes('crítico') ||
        impactAssessment.urgency?.toLowerCase().includes('bloquea')) {
      priority = 'p0';
      expedite = true;
    } else if (impactAssessment.usersAffected && impactAssessment.usersAffected > 100) {
      priority = 'p1';
    } else if (impactAssessment.npsImpact?.toLowerCase().includes('98') ||
               impactAssessment.csatImpact?.toLowerCase().includes('4+')) {
      priority = 'p1';
    }
    
    // Find and update backlog item
    const backlogSnapshot = await firestore
      .collection('backlog_items')
      .where('stellaTicketId', '==', ticketId)
      .limit(1)
      .get();
    
    if (!backlogSnapshot.empty) {
      const backlogDoc = backlogSnapshot.docs[0];
      
      await backlogDoc.ref.update({
        priority,
        expedite,
        impactAssessment,
        updatedAt: new Date(),
        priorityUpdatedAt: new Date(),
        priorityUpdatedBy: session.id,
      });
      
      console.log('✅ Priority updated:', ticketId, '→', priority, expedite ? '(EXPEDITE)' : '');
    }
    
    // Update feedback ticket
    const ticketSnapshot = await firestore
      .collection('feedback_tickets')
      .where('ticketId', '==', ticketId)
      .limit(1)
      .get();
    
    if (!ticketSnapshot.empty) {
      const ticketDoc = ticketSnapshot.docs[0];
      
      await ticketDoc.ref.update({
        priority,
        expedite,
        impactAssessment,
        updatedAt: new Date(),
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        priority,
        expedite,
        message: expedite
          ? `Ticket ${ticketId} marcado como CRÍTICO (P0) y expeditado para desarrollo inmediato.`
          : `Ticket ${ticketId} actualizado a prioridad ${priority.toUpperCase()}.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error updating priority:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update priority',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

