import type { APIRoute } from 'astro';
import { updateFolder, deleteFolder } from '../../../lib/firestore';

/**
 * PUT /api/folders/:id - Update folder name
 * DELETE /api/folders/:id - Delete a folder
 */

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Folder ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Folder name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateFolder(id, name);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Folder updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating folder:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update folder' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Folder ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteFolder(id);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Folder deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete folder' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

