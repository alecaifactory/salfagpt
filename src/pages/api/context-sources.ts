import type { APIRoute } from 'astro';
import {
  getContextSources,
  createContextSource,
  updateContextSource,
  deleteContextSource,
} from '../../lib/firestore';
import { getSession } from '../../lib/auth';

// GET /api/context-sources - List user's context sources
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user can only access their own context sources
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sources = await getContextSources(userId);

    return new Response(
      JSON.stringify({ sources }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in context-sources API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch context sources' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/context-sources - Create new context source
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, ...sourceData } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user can only create sources for themselves
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot create sources for other users' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const source = await createContextSource(userId, sourceData);

    return new Response(
      JSON.stringify({ source }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating context source:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create context source' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

