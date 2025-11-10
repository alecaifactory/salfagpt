/**
 * Promotion Approval API
 * 
 * POST /api/promotions/:id/approve - Approve promotion request
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  approvePromotion,
  getPromotionRequest 
} from '../../../../lib/promotion';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * POST /api/promotions/:id/approve
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
    
    // Determine user's role for this approval
    const user = { role: session.role, id: session.id } as any;
    const isSuperAdminUser = isSuperAdmin(user);
    const isOrgAdminUser = isOrganizationAdmin(user, promotionRequest.organizationId);
    
    // User must be either org admin or superadmin
    if (!isSuperAdminUser && !isOrgAdminUser) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only organization admins and superadmins can approve promotions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const body = await request.json();
    const { notes } = body;
    
    // Approve with appropriate role
    const approvalRole = isSuperAdminUser ? 'superadmin' : 'admin';
    
    await approvePromotion(id, session.id, approvalRole, notes);
    
    // Get updated request
    const updated = await getPromotionRequest(id);
    
    console.log(`✅ Promotion approved via API: ${id} by ${approvalRole}`);
    
    return new Response(JSON.stringify({
      success: true,
      request: updated,
      message: `Promotion approved by ${approvalRole}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error approving promotion:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to approve promotion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

