import type { APIRoute } from 'astro';
import { getAgentIndividualAccess } from '../../../../lib/firestore';

/**
 * GET /api/agents/:id/individual-access
 * Get all individual access records for an agent (active + revoked history)
 * 
 * Returns flattened list of users with full metadata for table display
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id: agentId } = params;

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📊 Getting individual access for agent:', agentId);

    const access = await getAgentIndividualAccess(agentId);

    console.log(`✅ Found ${access.length} access records (active + revoked)`);
    console.log(`   Active: ${access.filter(a => a.isActive).length}`);
    console.log(`   Revoked: ${access.filter(a => !a.isActive).length}`);

    return new Response(
      JSON.stringify({ access }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error getting individual access:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get individual access',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

