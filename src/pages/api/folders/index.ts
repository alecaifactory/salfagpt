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
      // Log the actual error for debugging
      console.error('❌ Firestore error in getFolders:', firestoreError);
      console.error('Error details:', firestoreError instanceof Error ? firestoreError.message : String(firestoreError));
      
      // If it's an index error, provide helpful message
      if (firestoreError instanceof Error && firestoreError.message.includes('index')) {
        console.error('💡 This query requires a Firestore index. Run:');
        console.error('   firebase deploy --only firestore:indexes --project gen-lang-client-0986191192');
        console.error('   Or create manually in Firebase Console');
      }
      
      // Return empty folders but log the error
      console.warn('⚠️ Firestore query failed, returning empty folders');
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

