// API: Domain Admin Assignments
// GET - Get all domain assignments (SuperAdmin only)

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only superadmin can view all assignments
    if (session.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get all assignments
    const snapshot = await firestore
      .collection('domain_admin_assignments')
      .where('isActive', '==', true)
      .get();
    
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    return new Response(JSON.stringify(assignments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/expert-review/domain-assignments:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

