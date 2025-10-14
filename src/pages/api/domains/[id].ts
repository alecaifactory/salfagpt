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
import { UserRole } from '../../../lib/access-control';

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

    // Verify SuperAdmin role
    if (session.role !== UserRole.SUPERADMIN) {
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

    // Verify SuperAdmin role
    if (session.role !== UserRole.SUPERADMIN) {
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

    // Verify SuperAdmin role
    if (session.role !== UserRole.SUPERADMIN) {
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

