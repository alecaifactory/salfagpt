import type { APIRoute } from 'astro';
import {
  getDomain,
  updateDomain,
  deleteDomain,
  setDomainEnabled,
  addAgentToDomain,
  removeAgentFromDomain,
  addContextToDomain,
  removeContextFromDomain,
} from '../../../lib/domains';
import { getSession } from '../../../lib/auth';

// SuperAdmin emails (hardcoded list)
const SUPERADMIN_EMAILS = ['alec@getaifactory.com', 'admin@getaifactory.com'];

// GET /api/domains/[id] - Get specific domain (SuperAdmin only)
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin email
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const domain = await getDomain(id);

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ domain }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error getting domain:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get domain' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/domains/[id] - Update domain (SuperAdmin only)
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin email
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { 
      name, 
      enabled, 
      description, 
      allowedAgents, 
      allowedContextSources,
      settings,
      action,
      agentId,
      contextSourceId,
    } = body;

    // Handle specific actions
    if (action === 'enable' || action === 'disable') {
      await setDomainEnabled(id, action === 'enable');
      return new Response(
        JSON.stringify({ success: true, message: `Domain ${action}d successfully` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'addAgent' && agentId) {
      await addAgentToDomain(id, agentId);
      return new Response(
        JSON.stringify({ success: true, message: 'Agent added to domain' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'removeAgent' && agentId) {
      await removeAgentFromDomain(id, agentId);
      return new Response(
        JSON.stringify({ success: true, message: 'Agent removed from domain' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'addContext' && contextSourceId) {
      await addContextToDomain(id, contextSourceId);
      return new Response(
        JSON.stringify({ success: true, message: 'Context added to domain' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'removeContext' && contextSourceId) {
      await removeContextFromDomain(id, contextSourceId);
      return new Response(
        JSON.stringify({ success: true, message: 'Context removed from domain' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // General update
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (enabled !== undefined) updates.enabled = enabled;
    if (description !== undefined) updates.description = description;
    if (allowedAgents !== undefined) updates.allowedAgents = allowedAgents;
    if (allowedContextSources !== undefined) updates.allowedContextSources = allowedContextSources;
    if (settings !== undefined) updates.settings = settings;

    await updateDomain(id, updates);

    return new Response(
      JSON.stringify({ success: true, message: 'Domain updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating domain:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update domain' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH /api/domains/[id] - Update domain name and/or ID (SuperAdmin only)
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin email
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, domainId, companyInfo } = body;

    // Validate required fields
    if (!name && !domainId && !companyInfo) {
      return new Response(
        JSON.stringify({ error: 'At least one field (name, domainId, or companyInfo) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (companyInfo) updates.companyInfo = companyInfo;
    
    // If domainId is changing, we need to:
    // 1. Create new domain with new ID
    // 2. Copy all data
    // 3. Delete old domain
    if (domainId && domainId !== id) {
      // TODO: Implement domain ID migration
      // For now, just update the name
      console.warn('⚠️ Domain ID change requested but not fully implemented. Only updating name.');
      
      if (name) {
        await updateDomain(id, { name });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Domain name updated. Domain ID changes require manual migration.',
          warning: 'Domain ID was not changed. Contact system administrator for domain ID migration.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Simple name update
    await updateDomain(id, updates);

    return new Response(
      JSON.stringify({ success: true, message: 'Domain updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating domain:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update domain' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/domains/[id] - Delete domain (SuperAdmin only)
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin email
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteDomain(id);

    return new Response(
      JSON.stringify({ success: true, message: 'Domain deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete domain' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

