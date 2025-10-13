import type { APIRoute } from 'astro';
import {
  updateContextSource,
  deleteContextSource,
} from '../../../lib/firestore';

// PUT /api/context-sources/:id - Update context source
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const sourceId = params.id;
    const body = await request.json();

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateContextSource(sourceId, body);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating context source:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update context source' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/context-sources/:id - Delete context source
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const sourceId = params.id;

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteContextSource(sourceId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting context source:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete context source' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

