/**
 * Organization API - Get, Update, Delete
 * 
 * GET    /api/organizations/:id - Get organization details
 * PUT    /api/organizations/:id - Update organization
 * DELETE /api/organizations/:id - Delete organization (soft delete)
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import {
  getOrganization,
  updateOrganization,
  deleteOrganization
} from '../../../lib/organizations';
import { isSuperAdmin, isOrganizationAdmin } from '../../../types/users';
import type { UpdateOrganizationInput } from '../../../types/organizations';

/**
 * GET /api/organizations/:id
 */
export const GET: APIRoute = async ({ params, cookies }) => {
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
    
    // Get organization
    const org = await getOrganization(id);
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check access permission
    const user = { role: session.role, id: session.id, organizationId: org.id } as any;
    const canAccess = isSuperAdmin(user) || isOrganizationAdmin(user, id);
    
    if (!canAccess) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'You do not have permission to view this organization'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ organization: org }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error getting organization:', error);
    
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
 * PUT /api/organizations/:id
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    
    // Check permission (org admin or superadmin)
    const user = { role: session.role, id: session.id } as any;
    const canUpdate = isSuperAdmin(user) || isOrganizationAdmin(user, id);
    
    if (!canUpdate) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only organization admins and superadmins can update organizations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse updates
    const body = await request.json();
    const updates: UpdateOrganizationInput = {
      name: body.name,
      primaryDomain: body.primaryDomain,
      branding: body.branding,
      evaluationConfig: body.evaluationConfig,
      privacy: body.privacy,
      limits: body.limits,
      isActive: body.isActive,
    };
    
    // Apply updates
    await updateOrganization(id, updates);
    
    // Get updated organization
    const org = await getOrganization(id);
    
    console.log('✅ Organization updated via API:', id);
    
    return new Response(JSON.stringify({
      success: true,
      organization: org
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to update organization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/organizations/:id
 * Soft delete (marks as inactive)
 */
export const DELETE: APIRoute = async ({ params, cookies }) => {
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
    
    // Only superadmin can delete organizations
    const user = { role: session.role, id: session.id } as any;
    if (!isSuperAdmin(user)) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only superadmins can delete organizations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Soft delete
    await deleteOrganization(id);
    
    console.log('✅ Organization deleted (soft) via API:', id);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Organization deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error deleting organization:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to delete organization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
