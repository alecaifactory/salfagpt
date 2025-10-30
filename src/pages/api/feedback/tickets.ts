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
    
    // 3. Get companyId from query (optional - if not provided, load all)
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    
    // 4. Load feedback tickets (without orderBy to avoid index requirement)
    let query: any = firestore.collection('feedback_tickets');
    
    // Filter by domain if provided
    if (companyId && companyId !== 'all') {
      query = query.where('userDomain', '==', companyId);
    }
    
    const ticketsSnapshot = await query.limit(200).get();
    
    // 5. Transform data and sort in memory
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      };
    });
    
    // Sort by createdAt desc in memory
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`✅ Loaded ${tickets.length} feedback tickets${companyId ? ` for ${companyId}` : ''}`);
    
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
