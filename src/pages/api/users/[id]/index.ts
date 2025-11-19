import type { APIRoute } from 'astro';
import { deleteUser, getUserById, getUserByEmail, firestore, COLLECTIONS } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

// PATCH /api/users/:id - Update user properties (Admin only)
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
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

    // Check if requester is admin
    const requester = await getUserByEmail(session.email);
    if (!requester || !requester.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, name, company, department, roles } = body;

    // Validate required fields
    if (!email || !name || !company) {
      return new Response(JSON.stringify({ error: 'Email, nombre y empresa son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'El usuario debe tener al menos un rol' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user document
    const updates: any = {
      email,
      name,
      company,
      department: department || null,
      roles,
      role: roles[0], // Primary role
      updatedAt: new Date(),
    };

    await firestore
      .collection(COLLECTIONS.USERS)
      .doc(id)
      .update(updates);

    console.log('✅ User updated:', { id, email, name, company, roles });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al actualizar usuario',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE /api/users/:id - Delete user (SuperAdmin only)
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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

