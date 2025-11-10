/**
 * Promotions API - List & Create
 * 
 * GET  /api/promotions - List promotion requests
 * POST /api/promotions - Create promotion request
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import {
  listPromotionRequests,
  createPromotionRequest
} from '../../../lib/promotion';
import { isSuperAdmin, isOrganizationAdmin } from '../../../types/users';

/**
 * GET /api/promotions
 * List promotion requests for user's organization(s)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status') as any;
    
    if (!organizationId) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'organizationId query parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission
    const user = { role: session.role, id: session.id } as any;
    const canAccess = isSuperAdmin(user) || isOrganizationAdmin(user, organizationId);
    
    if (!canAccess) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to view promotions for this organization'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // List promotion requests
    const requests = await listPromotionRequests(organizationId, status);
    
    return new Response(JSON.stringify({
      requests,
      count: requests.length,
      organizationId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error listing promotions:', error);
    
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
 * POST /api/promotions
 * Create new promotion request
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request
    const body = await request.json();
    const { organizationId, resourceType, resourceId, resourceName, changes } = body;
    
    // Validate
    if (!organizationId || !resourceType || !resourceId || !resourceName) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'organizationId, resourceType, resourceId, and resourceName are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission (org admin can create promotion requests)
    const user = { role: session.role, id: session.id } as any;
    const canCreate = isSuperAdmin(user) || isOrganizationAdmin(user, organizationId);
    
    if (!canCreate) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only organization admins can create promotion requests'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create promotion request
    const promotionRequest = await createPromotionRequest({
      organizationId,
      resourceType,
      resourceId,
      resourceName,
      requestedBy: session.id,
      changes: changes || []
    });
    
    console.log('✅ Promotion request created via API:', promotionRequest.id);
    
    return new Response(JSON.stringify({
      success: true,
      request: promotionRequest
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error creating promotion request:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create promotion request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

