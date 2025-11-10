/**
 * Organization Users API
 * 
 * GET  /api/organizations/:id/users - List users in organization
 * POST /api/organizations/:id/users - Add user to organization
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import {
  getUsersInOrganization,
  assignUserToOrganization
} from '../../../../lib/organizations';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * GET /api/organizations/:id/users
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Organization ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission
    const user = { role: session.role, id: session.id } as any;
    const canAccess = isSuperAdmin(user) || isOrganizationAdmin(user, id);
    
    if (!canAccess) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to view users in this organization'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const role = url.searchParams.get('role') || undefined;
    
    // Get users
    const users = await getUsersInOrganization(id, { includeInactive, role });
    
    return new Response(JSON.stringify({
      users,
      count: users.length,
      organizationId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error listing organization users:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/organizations/:id/users
 * Add user to organization
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Organization ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission
    const user = { role: session.role, id: session.id } as any;
    const canManage = isSuperAdmin(user) || isOrganizationAdmin(user, id);
    
    if (!canManage) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only organization admins and superadmins can add users'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request
    const body = await request.json();
    const { userId, domainId, addToAssignedOrgs } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'userId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Assign user to organization
    await assignUserToOrganization(userId, id, { domainId, addToAssignedOrgs });
    
    console.log('✅ User assigned to organization via API:', userId, '→', id);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User assigned to organization successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error assigning user to organization:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to assign user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

