// Expert Review API - Submit Evaluation
// Created: 2025-11-09

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import { generateCorrectionSuggestion } from '../../../lib/expert-review/ai-correction-service';
import { analyzeCorrectionImpact } from '../../../lib/expert-review/impact-analysis-service';
import { transitionTicketStatus } from '../../../lib/expert-review/review-workflow-service';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  try {
    const body = await request.json();
    const {
      ticketId,
      expertRating,
      npsScore,
      csatScore,
      expertNotes,
      correctionProposal,
      routingDecision  // 'approve-direct' | 'assign-specialist'
    } = body;
    
    if (!ticketId || !expertRating) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    // Get ticket
    const ticketDoc = await firestore.collection('feedback_tickets').doc(ticketId).get();
    
    if (!ticketDoc.exists) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404 });
    }
    
    // Update with evaluation
    await firestore.collection('feedback_tickets').doc(ticketId).update({
      correctionProposal,
      reviewStatus: routingDecision === 'assign-specialist' 
        ? 'asignada-especialista' 
        : 'corregida-propuesta',
      updatedAt: new Date()
    });
    
    // Transition status
    await transitionTicketStatus(
      ticketId,
      routingDecision === 'assign-specialist' ? 'asignada-especialista' : 'corregida-propuesta',
      session.id,
      session.email,
      session.role,
      expertNotes
    );
    
    // Generate impact analysis if direct approval
    if (routingDecision === 'approve-direct' && correctionProposal) {
      const domain = ticketDoc.data()?.domain;
      if (domain) {
        const impact = await analyzeCorrectionImpact(ticketId, correctionProposal, domain);
        
        await firestore.collection('feedback_tickets').doc(ticketId).update({
          impactAnalysis: impact
        });
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    });
  }
};

