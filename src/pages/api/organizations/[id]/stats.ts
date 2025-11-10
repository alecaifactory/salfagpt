/**
 * Organization Statistics API
 * 
 * GET /api/organizations/:id/stats - Get organization statistics
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { calculateOrganizationStats } from '../../../../lib/organizations';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * GET /api/organizations/:id/stats
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
    
    // Check permission
    const user = { role: session.role, id: session.id } as any;
    const canAccess = isSuperAdmin(user) || isOrganizationAdmin(user, id);
    
    if (!canAccess) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to view organization statistics'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Calculate statistics
    const stats = await calculateOrganizationStats(id);
    
    return new Response(JSON.stringify({
      stats,
      organizationId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error calculating organization stats:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

