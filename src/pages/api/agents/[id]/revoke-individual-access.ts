import type { APIRoute } from 'astro';
import { revokeIndividualAccess } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

/**
 * DELETE /api/agents/:id/revoke-individual-access?userEmail=xxx
 * Revoke access for a specific user (not entire share)
 * 
 * SuperAdmin/Owner only
 */
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id: agentId } = params;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const shareId = url.searchParams.get('shareId');

    if (!agentId || !userEmail || !shareId) {
      return new Response(
        JSON.stringify({ error: 'agentId, userEmail, and shareId are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current user from session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Revoking individual access:', {
      agentId,
      userEmail,
      shareId,
      revokedBy: session.email,
    });

    // Revoke access
    await revokeIndividualAccess(
      shareId,
      userEmail,
      session.id,
      session.email
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Access revoked for ${userEmail}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error revoking individual access:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to revoke access',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

