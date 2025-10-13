import type { APIRoute } from 'astro';
import {
  updateContextSource,
  deleteContextSource,
  firestore,
  COLLECTIONS,
} from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

// PUT /api/context-sources/:id - Update context source
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceId = params.id;
    const body = await request.json();

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this source
    const sourceDoc = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(sourceId)
      .get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (sourceDoc.data()?.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot modify other user sources' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceId = params.id;

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this source
    const sourceDoc = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(sourceId)
      .get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (sourceDoc.data()?.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot delete other user sources' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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

