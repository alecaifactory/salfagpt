// API: Get Admin's Assigned Domains
// GET - Get domains that an admin can configure

import type { APIRoute } from 'astro';
import { getAdminDomains } from '../../../lib/expert-review/domain-admin-service';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

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
    
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user to check role
    const userDoc = await firestore.collection('users').doc(targetUserId).get();
    const userRole = userDoc.data()?.role || 'user';
    const userEmail = userDoc.data()?.email || '';
    
    let domains: string[] = [];
    
    if (userRole === 'superadmin') {
      // SuperAdmin: Get all active domains
      const domainsResponse = await fetch(new URL('/api/domains?activeOnly=true', request.url));
      if (domainsResponse.ok) {
        const data = await domainsResponse.json();
        domains = (data.domains || []).map((d: any) => d.id || d.name || d);
      }
      
    } else if (userRole === 'admin') {
      // Admin: Get their assigned domains
      const assignedDomains = await getAdminDomains(targetUserId);
      
      if (assignedDomains.length === 0) {
        // No assignment yet - default to their email domain
        const emailDomain = userEmail.split('@')[1];
        if (emailDomain) {
          domains = [emailDomain];
        }
      } else {
        domains = assignedDomains;
      }
      
    } else {
      // Other roles: just their email domain
      const emailDomain = userEmail.split('@')[1];
      if (emailDomain) {
        domains = [emailDomain];
      }
    }
    
    console.log('✅ Admin domains for', userRole, ':', domains);
    
    return new Response(JSON.stringify({ domains }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/expert-review/admin-domains:', error);
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

