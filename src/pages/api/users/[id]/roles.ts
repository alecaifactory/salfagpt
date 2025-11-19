import type { APIRoute } from 'astro';
import { updateUserRoles, getUserById } from '../../../../lib/firestore';
import { getUserByEmail } from '../../../../lib/firestore';

// PUT /api/users/:id/roles - Update user roles (SuperAdmin only)
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const sessionCookie = cookies.get(cookieName);
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

    const body = await request.json();
    const { roles, requesterEmail } = body;

    if (!roles || !Array.isArray(roles) || !requesterEmail) {
      return new Response(JSON.stringify({ error: 'roles array and requesterEmail required' }), {
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

    // Update roles
    await updateUserRoles(id, roles);

    // Return updated user
    const updatedUser = await getUserById(id);

    return new Response(JSON.stringify({ user: updatedUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user roles:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al actualizar roles',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

