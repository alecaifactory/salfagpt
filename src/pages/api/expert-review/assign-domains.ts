// API: Assign Domains to Admin
// POST - Assign domains to admin (SuperAdmin only)

import type { APIRoute } from 'astro';
import { assignDomainsToAdmin } from '../../../lib/expert-review/domain-admin-service';
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
    
    // Only superadmin can assign domains
    if (session.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { adminUserId, adminEmail, adminName, domains, assignedBy } = body;
    
    if (!adminUserId || !adminEmail || !adminName || !domains || domains.length === 0) {
      return new Response(JSON.stringify({ error: 'All fields required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Assign domains
    const assignment = await assignDomainsToAdmin(
      adminUserId,
      adminEmail,
      adminName,
      domains,
      assignedBy || session.id
    );
    
    return new Response(JSON.stringify(assignment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/expert-review/assign-domains:', error);
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

