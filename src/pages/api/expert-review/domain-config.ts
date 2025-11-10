import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getDomainConfig,
  updateDomainConfig,
  toggleSupervisorActive,
  toggleSpecialistActive,
  toggleAdminRequired
} from '../../../lib/expert-review/domain-config-service';

/**
 * Expert Review Domain Configuration API
 * 
 * GET /api/expert-review/domain-config?domainId={id} - Get domain config
 * PUT /api/expert-review/domain-config - Update domain config
 * POST /api/expert-review/domain-config/toggle - Toggle settings
 */

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');

    if (!domainId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: domainId' }),
        { status: 400 }
      );
    }

    // Get domain config
    const config = await getDomainConfig(domainId);

    return new Response(
      JSON.stringify(config),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error getting domain config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get domain config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { domainId, config } = body;

    if (!domainId || !config) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: domainId, config' }),
        { status: 400 }
      );
    }

    // Update domain config
    await updateDomainConfig(domainId, config);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error updating domain config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update domain config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { domainId, toggleType } = body;

    if (!domainId || !toggleType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: domainId, toggleType' }),
        { status: 400 }
      );
    }

    // Toggle based on type
    switch (toggleType) {
      case 'supervisor':
        await toggleSupervisorActive(domainId);
        break;
      case 'specialist':
        await toggleSpecialistActive(domainId);
        break;
      case 'admin':
        await toggleAdminRequired(domainId);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown toggleType: ${toggleType}` }),
          { status: 400 }
        );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error toggling domain config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to toggle domain config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

