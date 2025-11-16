/**
 * API Invitations Management (SuperAdmin Only)
 * 
 * GET    /api/admin/api-invitations - List all invitations
 * POST   /api/admin/api-invitations - Create new invitation
 * DELETE /api/admin/api-invitations - Revoke invitation
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  createAPIInvitation, 
  getAllAPIInvitations 
} from '../../../lib/api-management';
import type { APIOrganizationTier } from '../../../types/api-system';

// ============================================================================
// GET - List all API invitations
// ============================================================================

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Verify SuperAdmin
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    // TODO: Get user from Firestore and check role
    // For now, check if email is admin
    if (!session.email?.includes('@getaifactory.com')) {
      return jsonError('Forbidden - SuperAdmin only', 403);
    }
    
    // Get all invitations
    const invitations = await getAllAPIInvitations();
    
    return jsonSuccess({
      invitations: invitations,
      total: invitations.length,
    });
    
  } catch (error) {
    console.error('❌ Error listing API invitations:', error);
    return jsonError('Failed to list invitations', 500);
  }
};

// ============================================================================
// POST - Create new API invitation
// ============================================================================

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify SuperAdmin
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    if (!session.email?.includes('@getaifactory.com')) {
      return jsonError('Forbidden - SuperAdmin only', 403);
    }
    
    // Parse request
    const body = await request.json();
    const {
      targetAudience,
      description,
      maxRedemptions,
      defaultTier,
      expiresInDays,
      allowedDomains,
    } = body;
    
    // Validate required fields
    if (!targetAudience || !description || !maxRedemptions || !defaultTier) {
      return jsonError('Missing required fields: targetAudience, description, maxRedemptions, defaultTier', 400);
    }
    
    // Validate tier
    const validTiers: APIOrganizationTier[] = ['trial', 'starter', 'pro', 'enterprise'];
    if (!validTiers.includes(defaultTier)) {
      return jsonError(`Invalid tier. Must be one of: ${validTiers.join(', ')}`, 400);
    }
    
    // Create invitation
    const invitation = await createAPIInvitation(
      session.id,
      session.email,
      targetAudience,
      description,
      maxRedemptions,
      defaultTier,
      expiresInDays,
      allowedDomains
    );
    
    console.log('✅ API invitation created:', invitation.invitationCode);
    
    return jsonSuccess({
      invitation: invitation,
      message: 'Invitation created successfully',
    }, 201);
    
  } catch (error) {
    console.error('❌ Error creating API invitation:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create invitation',
      500
    );
  }
};

// ============================================================================
// DELETE - Revoke API invitation
// ============================================================================

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify SuperAdmin
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    if (!session.email?.includes('@getaifactory.com')) {
      return jsonError('Forbidden - SuperAdmin only', 403);
    }
    
    // Parse request
    const body = await request.json();
    const { invitationId } = body;
    
    if (!invitationId) {
      return jsonError('Missing invitationId', 400);
    }
    
    // Revoke invitation
    const { firestore } = await import('../../../lib/firestore');
    await firestore
      .collection('api_invitations')
      .doc(invitationId)
      .update({
        status: 'revoked',
        revokedAt: new Date(),
        updatedAt: new Date(),
      });
    
    console.log('✅ API invitation revoked:', invitationId);
    
    return jsonSuccess({
      message: 'Invitation revoked successfully',
    });
    
  } catch (error) {
    console.error('❌ Error revoking invitation:', error);
    return jsonError('Failed to revoke invitation', 500);
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function jsonSuccess(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: getErrorCode(status),
        message: message,
      },
    }, null, 2),
    {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function getErrorCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 500: return 'INTERNAL_ERROR';
    default: return 'ERROR';
  }
}

