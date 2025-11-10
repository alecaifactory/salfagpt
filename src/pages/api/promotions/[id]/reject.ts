/**
 * Promotion Rejection API
 * 
 * POST /api/promotions/:id/reject - Reject promotion request
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  rejectPromotion,
  getPromotionRequest 
} from '../../../../lib/promotion';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * POST /api/promotions/:id/reject
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Promotion ID required' }), {
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
    
    // Get promotion request
    const promotionRequest = await getPromotionRequest(id);
    if (!promotionRequest) {
      return new Response(JSON.stringify({ error: 'Promotion request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission
    const user = { role: session.role, id: session.id } as any;
    const isSuperAdminUser = isSuperAdmin(user);
    const isOrgAdminUser = isOrganizationAdmin(user, promotionRequest.organizationId);
    
    if (!isSuperAdminUser && !isOrgAdminUser) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only organization admins and superadmins can reject promotions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const body = await request.json();
    const { reason } = body;
    
    if (!reason) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'Rejection reason is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Reject with appropriate role
    const rejectionRole = isSuperAdminUser ? 'superadmin' : 'admin';
    
    await rejectPromotion(id, session.id, rejectionRole, reason);
    
    // Get updated request
    const updated = await getPromotionRequest(id);
    
    console.log(`✅ Promotion rejected via API: ${id} by ${rejectionRole}`);
    
    return new Response(JSON.stringify({
      success: true,
      request: updated,
      message: `Promotion rejected by ${rejectionRole}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error rejecting promotion:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to reject promotion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

