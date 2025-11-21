/**
 * API: Admin - Tim Sessions
 * GET /api/admin/tim/sessions
 * 
 * Search and filter all Tim sessions (Admin/SuperAdmin only)
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore } from '../../../../lib/firestore';
import { searchTimSessions } from '../../../../lib/tim-vector-store';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verify admin/superadmin role
    if (!['admin', 'superadmin'].includes(session.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const searchQuery = url.searchParams.get('q');
    const importance = url.searchParams.get('importance');
    const chunkTypes = url.searchParams.get('types');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // 4. Semantic search if query provided
    if (searchQuery) {
      const results = await searchTimSessions(searchQuery, {
        userId: userId || undefined,
        organizationId: session.role === 'admin' ? session.organizationId : undefined,
        importance: importance?.split(',') as any,
        chunkTypes: chunkTypes?.split(',') as any
      });
      
      return new Response(JSON.stringify({ 
        results,
        query: searchQuery,
        count: results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Otherwise, list recent sessions
    let query = firestore.collection('tim_test_sessions');
    
    // Admin sees only their org, SuperAdmin sees all
    if (session.role === 'admin' && session.organizationId) {
      // Get users in this organization first
      const orgUsersSnapshot = await firestore
        .collection('users')
        .where('organizationId', '==', session.organizationId)
        .get();
      
      const orgUserIds = orgUsersSnapshot.docs.map(doc => doc.id);
      
      // Filter sessions by org users
      query = query.where('userId', 'in', orgUserIds.slice(0, 10)) as any; // Firestore limit: 10
    }
    
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate().toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate().toISOString(),
      startedAt: doc.data()?.startedAt?.toDate()?.toISOString(),
      completedAt: doc.data()?.completedAt?.toDate()?.toISOString()
    }));

    // 6. Track admin access
    for (const sessionDoc of snapshot.docs) {
      await this.trackAdminAccess(sessionDoc.id, session.id, session.email, 'viewed');
    }

    // 7. Return sessions
    return new Response(JSON.stringify({ 
      sessions,
      count: sessions.length,
      total: snapshot.size
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching Tim sessions:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Tim sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Track admin access for audit trail
async function trackAdminAccess(
  sessionId: string,
  adminId: string,
  adminEmail: string,
  action: string
): Promise<void> {
  try {
    const accessEntry = {
      adminId,
      adminEmail,
      timestamp: new Date(),
      action,
      purpose: 'Admin session review'
    };
    
    await firestore.collection('tim_test_sessions').doc(sessionId).update({
      'adminAccess.viewedBy': firestore.FieldValue.arrayUnion(adminId),
      'adminAccess.lastAccessedAt': new Date(),
      'adminAccess.accessLog': firestore.FieldValue.arrayUnion(accessEntry)
    });
  } catch (error) {
    // Non-blocking
    console.warn('⚠️ Failed to track admin access:', error);
  }
}





