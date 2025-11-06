/**
 * API Endpoint: Get Backlog Items
 * GET /api/backlog/items?companyId={companyId}
 * 
 * 🔒 Security: Only accessible by alec@getaifactory.com
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { verifyJWT } from '../../../lib/auth';
import type { BacklogItem } from '../../../types/feedback';

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
      console.warn('🚨 Unauthorized roadmap access attempt:', {
        email: session.email,
        userId: session.id
      });
      
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
    
    // 4. Load all backlog items for company
    const snapshot = await firestore
      .collection('backlog_items')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .get();
    
    // 5. Transform data
    const items: BacklogItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
      startedAt: doc.data().startedAt?.toDate?.() || (doc.data().startedAt ? new Date(doc.data().startedAt) : undefined),
      completedAt: doc.data().completedAt?.toDate?.() || (doc.data().completedAt ? new Date(doc.data().completedAt) : undefined),
      targetReleaseDate: doc.data().targetReleaseDate?.toDate?.() || (doc.data().targetReleaseDate ? new Date(doc.data().targetReleaseDate) : undefined),
    })) as BacklogItem[];
    
    console.log(`✅ Loaded ${items.length} backlog items for ${companyId}`);
    
    return new Response(
      JSON.stringify(items),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error loading backlog items:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load backlog items',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};









