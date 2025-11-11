/**
 * Organization Domains API - Add/Remove Domains
 * 
 * POST   /api/organizations/:id/domains - Add domain to organization
 * DELETE /api/organizations/:id/domains - Remove domain from organization
 * 
 * Created: 2025-11-11
 * Part of: feat/domain-creation-2025-11-11
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  addDomainToOrganization,
  removeDomainFromOrganization,
  getOrganization,
  updateOrganization
} from '../../../../lib/organizations';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * POST /api/organizations/:id/domains
 * Add domain to organization
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orgId = params.id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Organization ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request
    const body = await request.json();
    const { domain, companyName, companyWebsiteUrl } = body;

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get organization
    const org = await getOrganization(orgId);
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify permissions
    const user = { role: session.role, id: session.id, roles: session.roles } as any;
    const hasPermission = isSuperAdmin(user) || 
                         (isOrganizationAdmin(user) && org.admins.includes(session.id));

    if (!hasPermission) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'Only SuperAdmins or organization admins can add domains'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add domain to organization
    await addDomainToOrganization(orgId, domain);

    // Optionally update organization profile with company info
    if (companyName || companyWebsiteUrl) {
      await updateOrganization(orgId, {
        profile: {
          ...org.profile,
          companyName: companyName || org.profile?.companyName,
          url: companyWebsiteUrl || org.profile?.url,
        }
      });
    }

    console.log('✅ Domain added to organization:', domain, '→', orgId);

    return new Response(JSON.stringify({
      success: true,
      message: `Domain ${domain} added to ${org.name}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error adding domain to organization:', error);

    return new Response(JSON.stringify({
      error: 'Failed to add domain',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/organizations/:id/domains
 * Remove domain from organization
 */
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orgId = params.id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Organization ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get organization
    const org = await getOrganization(orgId);
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify permissions
    const user = { role: session.role, id: session.id, roles: session.roles } as any;
    const hasPermission = isSuperAdmin(user) || 
                         (isOrganizationAdmin(user) && org.admins.includes(session.id));

    if (!hasPermission) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'Only SuperAdmins or organization admins can remove domains'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove domain from organization
    await removeDomainFromOrganization(orgId, domain);

    console.log('✅ Domain removed from organization:', domain, '←', orgId);

    return new Response(JSON.stringify({
      success: true,
      message: `Domain ${domain} removed from ${org.name}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error removing domain from organization:', error);

    return new Response(JSON.stringify({
      error: 'Failed to remove domain',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

