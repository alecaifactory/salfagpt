import type { APIRoute } from 'astro';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  addGroupMembers,
  removeGroupMembers,
  deleteGroup,
} from '../../lib/firestore-context-access';
import type { GroupType } from '../../types/contextAccess';

// GET /api/groups - Get all groups
// POST /api/groups - Create a new group
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('id');

    if (groupId) {
      // Get specific group
      const group = await getGroupById(groupId);
      
      if (!group) {
        return new Response(
          JSON.stringify({ error: 'Group not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ group }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all groups
    const groups = await getAllGroups();

    return new Response(
      JSON.stringify({ groups }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch groups',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, type, description, createdBy } = body;

    // Validation
    if (!name || !type || !createdBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, type, createdBy' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create group
    const group = await createGroup(name, type as GroupType, description || '', createdBy);

    return new Response(
      JSON.stringify({ group }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error creating group:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create group',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/groups - Update a group
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { groupId, updates, action, memberIds } = body;

    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: groupId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'add-members') {
      if (!memberIds || !Array.isArray(memberIds)) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid memberIds array' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      await addGroupMembers(groupId, memberIds);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Members added successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove-members') {
      if (!memberIds || !Array.isArray(memberIds)) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid memberIds array' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      await removeGroupMembers(groupId, memberIds);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Members removed successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default: update group
    if (!updates) {
      return new Response(
        JSON.stringify({ error: 'Missing updates object' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateGroup(groupId, updates);

    return new Response(
      JSON.stringify({ success: true, message: 'Group updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error updating group:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update group',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/groups - Delete a group (soft delete)
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('id');

    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteGroup(groupId);

    return new Response(
      JSON.stringify({ success: true, message: 'Group deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error deleting group:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete group',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

