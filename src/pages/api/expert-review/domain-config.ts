// API: Domain Review Configuration
// GET - Get domain config
// POST - Create domain config
// PUT - Update domain config

import type { APIRoute } from 'astro';
import { 
  getDomainReviewConfig, 
  createDomainReviewConfig,
  updatePriorityThresholds
} from '../../../lib/expert-review/domain-config-service';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get domainId from query
    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');
    
    if (!domainId) {
      return new Response(JSON.stringify({ error: 'domainId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get config
    const config = await getDomainReviewConfig(domainId);
    
    if (!config) {
      return new Response(JSON.stringify({ error: 'Config not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/expert-review/domain-config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { domainId, domainName, createdBy } = body;
    
    if (!domainId || !domainName) {
      return new Response(JSON.stringify({ error: 'domainId and domainName required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create config
    const config = await createDomainReviewConfig(
      domainId, 
      domainName, 
      createdBy || session.id
    );
    
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/expert-review/domain-config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { domainId, config } = body;
    
    if (!domainId || !config) {
      return new Response(JSON.stringify({ error: 'domainId and config required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update thresholds (expandir para otros campos si necesario)
    await updatePriorityThresholds(domainId, config.priorityThresholds);
    
    // Reload config
    const updatedConfig = await getDomainReviewConfig(domainId);
    
    return new Response(JSON.stringify(updatedConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in PUT /api/expert-review/domain-config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
