// Expert Review API - Get Interactions
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
  const domain = url.searchParams.get('domain');
  const status = url.searchParams.get('status') || 'pendiente';
  
  if (!domain) {
    return new Response(JSON.stringify({ error: 'Domain required' }), { status: 400 });
  }
  
  // Verify domain access
  const userDomain = session.email.split('@')[1];
  if (session.role !== 'superadmin' && domain !== userDomain) {
    return new Response(JSON.stringify({ error: 'Forbidden - Domain mismatch' }), { status: 403 });
  }
  
  try {
    let query = firestore
      .collection('feedback_tickets')
      .where('domain', '==', domain);
    
    if (status !== 'all') {
      query = query.where('reviewStatus', '==', status);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const interactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return new Response(JSON.stringify({ interactions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    });
  }
};

