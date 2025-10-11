import type { APIRoute } from 'astro';
import { createFolder, getFolders } from '../../../lib/firestore';

/**
 * GET /api/folders - Get user's folders
 * POST /api/folders - Create a new folder
 */

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const folders = await getFolders(userId);
      return new Response(
        JSON.stringify({ folders }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (firestoreError) {
      // If Firestore fails (e.g., in dev mode), return empty folders
      console.warn('⚠️ Firestore unavailable, returning empty folders');
      return new Response(
        JSON.stringify({ folders: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch folders' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return new Response(
        JSON.stringify({ error: 'userId and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const folder = await createFolder(userId, name);
      return new Response(
        JSON.stringify({ folder }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (firestoreError) {
      // If Firestore fails (e.g., in dev mode), return a temporary folder
      console.warn('⚠️ Firestore unavailable, creating temporary folder');
      const tempFolder = {
        id: `temp-folder-${Date.now()}`,
        userId,
        name,
        createdAt: new Date(),
        conversationCount: 0,
      };

      return new Response(
        JSON.stringify({ folder: tempFolder }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error creating folder:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create folder' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

