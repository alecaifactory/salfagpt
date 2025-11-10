// Changelog API - List and create entries
// GET: List all changelog entries (with filters)
// POST: Create new changelog entry (admin only)

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getChangelogEntries, createChangelogEntry, getGroupedChangelog } from '../../../lib/changelog';
import type { ChangelogEntry } from '../../../types/changelog';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication (optional for public changelog, required for drafts)
    const session = getSession({ cookies } as any);
    const url = new URL(request.url);
    
    // Parse filters
    const category = url.searchParams.get('category') || undefined;
    const status = url.searchParams.get('status') || 'stable'; // Default to stable only
    const industry = url.searchParams.get('industry') || undefined;
    const grouped = url.searchParams.get('grouped') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // If requesting drafts, must be authenticated
    if (status === 'beta' || status === 'coming-soon') {
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (grouped) {
      const groups = await getGroupedChangelog();
      return new Response(JSON.stringify({ groups }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entries = await getChangelogEntries({
      category,
      status,
      industry,
      limit
    });

    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Changelog API error:', error);
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
    // Authentication required
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Authorization: Only superadmin and admin can create
    // In production, check user role
    // For now, any authenticated user can create (adjust later)

    const body = await request.json();
    
    // Validation
    if (!body.version || !body.title || !body.description || !body.category) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['version', 'title', 'description', 'category']
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create entry
    const entry = await createChangelogEntry({
      ...body,
      createdBy: session.id,
      publishedBy: session.id,
      industries: body.industries || [],
      tags: body.tags || [],
      relatedFeatures: body.relatedFeatures || [],
      userRequestCount: body.userRequestCount || 0,
      impactScore: body.impactScore || 5,
      priority: body.priority || 'medium',
      status: body.status || 'stable'
    });

    return new Response(JSON.stringify({ entry }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Create changelog error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create changelog entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};


