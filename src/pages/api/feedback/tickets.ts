/**
 * API Endpoint: Get Feedback Tickets
 * GET /api/feedback/tickets?companyId={companyId}
 * 
 * Returns all feedback tickets for the roadmap system
 * 
 * 🔒 Security: Only accessible by alec@getaifactory.com
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { verifyJWT } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
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
    
    // 3. Get companyId from query
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Missing companyId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. Load feedback tickets
    const ticketsSnapshot = await firestore
      .collection('feedback_tickets')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(100) // Limit for performance
      .get();
    
    // 5. Transform data
    const tickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
    
    console.log(`✅ Loaded ${tickets.length} feedback tickets for ${companyId}`);
    
    return new Response(
      JSON.stringify(tickets),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error loading feedback tickets:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load feedback tickets',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
