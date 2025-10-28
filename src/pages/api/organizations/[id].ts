import type { APIRoute } from 'astro';
import { getOrganization, saveOrganization } from '../../../lib/firestore';

// GET /api/organizations/:id - Get organization by ID
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const organization = await getOrganization(id);

    if (!organization) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(organization), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting organization:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get organization' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/organizations/:id - Update organization (domain prompt)
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, domainPrompt } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Organization name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const organization = await saveOrganization(id, {
      name,
      domainPrompt: domainPrompt || '',
    });

    console.log('✅ Organization updated:', id);

    return new Response(JSON.stringify(organization), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update organization' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

