// Expert Review API - Personal Stats
// Created: 2025-11-09

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const domain = url.searchParams.get('domain');
  
  if (!userId || !domain) {
    return new Response(JSON.stringify({ error: 'userId and domain required' }), { status: 400 });
  }
  
  try {
    // Get evaluations by this expert this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const evaluationsSnapshot = await firestore
      .collection('feedback_tickets')
      .where('domain', '==', domain)
      .where('correctionProposal.proposedBy', '==', userId)
      .where('createdAt', '>=', firstDayOfMonth)
      .get();
    
    const evaluatedThisMonth = evaluationsSnapshot.size;
    
    // Calculate approval rate
    const approved = evaluationsSnapshot.docs.filter(doc => 
      doc.data().reviewStatus === 'aplicada'
    ).length;
    
    const approvalRate = evaluatedThisMonth > 0
      ? Math.round((approved / evaluatedThisMonth) * 100)
      : 0;
    
    // TODO: Calculate ranking (requires cross-expert comparison)
    const ranking = 2; // Placeholder
    
    // TODO: Calculate avg time (requires timestamp tracking)
    const avgTimePerEval = 8; // Minutes, placeholder
    
    const stats = {
      evaluatedThisMonth,
      approvalRate,
      ranking,
      avgTimePerEval
    };
    
    return new Response(JSON.stringify({ stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    });
  }
};

