/**
 * Promotion Execution API
 * 
 * POST /api/promotions/:id/execute - Execute approved promotion
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  executePromotion,
  getPromotionRequest 
} from '../../../../lib/promotion';
import { isSuperAdmin } from '../../../../types/users';

/**
 * POST /api/promotions/:id/execute
 * Execute fully-approved promotion (superadmin only)
 */
export const POST: APIRoute = async ({ params, cookies }) => {
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
    
    // Only superadmin can execute promotions
    const user = { role: session.role, id: session.id } as any;
    if (!isSuperAdmin(user)) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Only superadmins can execute promotions'
      }), {
        status: 403,
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
    
    // Verify fully approved
    if (promotionRequest.status !== 'approved-super') {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: `Promotion not fully approved. Current status: ${promotionRequest.status}`,
        requiredApprovals: 'Both organization admin and superadmin must approve',
        currentApprovals: promotionRequest.approvals
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for unresolved conflicts
    const unresolvedConflicts = promotionRequest.conflicts?.filter(c => !c.resolved) || [];
    if (unresolvedConflicts.length > 0) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: `Cannot execute with unresolved conflicts (${unresolvedConflicts.length})`,
        conflicts: unresolvedConflicts
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Execute promotion
    await executePromotion(id, session.id);
    
    // Get updated request with execution result
    const updated = await getPromotionRequest(id);
    
    console.log(`✅ Promotion executed via API: ${id}`);
    
    return new Response(JSON.stringify({
      success: true,
      request: updated,
      message: 'Promotion executed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error executing promotion:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to execute promotion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

