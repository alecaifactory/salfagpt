// API: Remove Domain from Admin
// POST - Remove domain from admin's assignments (SuperAdmin only)

import type { APIRoute } from 'astro';
import { removeDomainFromAdmin } from '../../../lib/expert-review/domain-admin-service';
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
    
    // Only superadmin can remove domains
    if (session.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { adminUserId, domain } = body;
    
    if (!adminUserId || !domain) {
      return new Response(JSON.stringify({ error: 'adminUserId and domain required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Remove domain
    await removeDomainFromAdmin(adminUserId, domain);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/expert-review/remove-domain:', error);
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

