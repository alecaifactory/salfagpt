/**
 * Domain Prompt API Endpoint
 * 
 * Manages domain-specific AI prompts that are applied to all agents in the domain.
 * These prompts override organization-level prompts.
 * 
 * Created: 2025-11-11
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { getDomain, updateDomain } from '../../../../lib/domains';

// Superadmin emails (hardcoded for now)
const SUPERADMIN_EMAILS = ['alec@getaifactory.com'];

/**
 * GET /api/domains/:id/prompt
 * Get domain-specific prompt
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get domain
    const domain = await getDomain(id);
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        domainPrompt: domain.domainPrompt || '',
        domainId: domain.id,
        domainName: domain.name,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error getting domain prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get domain prompt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * PUT /api/domains/:id/prompt
 * Update domain-specific prompt (SuperAdmin only)
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Domain ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin access
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { domainPrompt } = body;

    if (domainPrompt === undefined) {
      return new Response(
        JSON.stringify({ error: 'domainPrompt is required in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify domain exists
    const domain = await getDomain(id);
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update domain prompt
    await updateDomain(id, { domainPrompt });

    console.log('✅ Domain prompt updated:', id, `(${domainPrompt.length} chars)`);

    return new Response(
      JSON.stringify({ 
        success: true,
        domainPrompt,
        domainId: id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error updating domain prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update domain prompt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};






