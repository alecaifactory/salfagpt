import type { APIRoute } from 'astro';
import { deleteUser, getUserById } from '../../../../lib/firestore';
import { getUserByEmail } from '../../../../lib/firestore';

// DELETE /api/users/:id - Delete user (SuperAdmin only)
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const sessionCookie = cookies.get('flow_session');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const requesterEmail = url.searchParams.get('requesterEmail');

    if (!requesterEmail) {
      return new Response(JSON.stringify({ error: 'requesterEmail required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if requester is SuperAdmin
    const requester = await getUserByEmail(requesterEmail);
    if (!requester || !requester.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-deletion
    if (id === requester.id) {
      return new Response(JSON.stringify({ error: 'No puedes eliminar tu propia cuenta' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete user
    await deleteUser(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al eliminar usuario',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

