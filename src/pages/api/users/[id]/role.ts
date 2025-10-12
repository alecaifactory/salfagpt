import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { verifyJWT } from '../../../../lib/auth';
import { getPermissionsForRole } from '../../../../lib/permissions';
import type { UserRole } from '../../../../types/user';

// PUT /api/users/:id/role - Update user role (admin only)
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const token = cookies.get('flow_session')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = verifyJWT(token);
    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { role } = await request.json();
    if (!role) {
      return new Response(JSON.stringify({ error: 'Role required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate role
    const validRoles: UserRole[] = [
      'admin', 'expert', 'user',
      'context_signoff', 'context_reviewer', 'context_creator', 'context_feedback',
      'agent_signoff', 'agent_reviewer', 'agent_creator', 'agent_feedback'
    ];
    
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update user role and permissions
    await firestore.collection('users').doc(id).update({
      role: role,
      permissions: getPermissionsForRole(role),
      updatedAt: new Date(),
    });

    console.log('✅ User role updated:', id, role);

    return new Response(JSON.stringify({ success: true, role }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

