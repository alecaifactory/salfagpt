// API: Add Supervisor to Domain
// POST - Add supervisor to domain config

import type { APIRoute } from 'astro';
import { addSupervisorToDomain } from '../../../lib/expert-review/domain-config-service';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only admin/superadmin can add supervisors
    if (!['admin', 'superadmin'].includes(session.role || '')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { domainId, userId, userEmail, userName } = body;
    
    if (!domainId || !userId || !userEmail || !userName) {
      return new Response(JSON.stringify({ error: 'All fields required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add supervisor
    await addSupervisorToDomain(domainId, userId, userEmail, userName);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/expert-review/add-supervisor:', error);
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

