import type { APIRoute } from 'astro';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  setUserActive,
  deleteUser,
  isUserAdmin,
} from '../../../lib/firestore';
import type { UserRole } from '../../../types/users';

// GET - Get all users
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const checkId = url.searchParams.get('checkId');

    // If checking specific user
    if (checkId) {
      const user = await getUserById(checkId);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
        });
      }
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if requesting user is admin
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
      });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Get all users
    const users = await getAllUsers();

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
    });
  }
};

// POST - Create new user
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, email, name, role, company, department } = body;

    // Check if requesting user is admin
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
      });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Validate required fields
    if (!email || !name || !role || !company) {
      return new Response(
        JSON.stringify({ error: 'email, name, role, and company are required' }),
        { status: 400 }
      );
    }

    // Create user
    const newUser = await createUser(email, name, role as UserRole, company, department);

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
    });
  }
};

// PUT - Update user
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, targetUserId, updates } = body;

    // Check if requesting user is admin
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
      });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
      });
    }

    // Update user
    await updateUser(targetUserId, updates);

    // Get updated user
    const updatedUser = await getUserById(targetUserId);

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
    });
  }
};

// PATCH - Update user role or status
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, targetUserId, action, value } = body;

    // Check if requesting user is admin
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
      });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    if (!targetUserId || !action) {
      return new Response(
        JSON.stringify({ error: 'targetUserId and action are required' }),
        { status: 400 }
      );
    }

    // Perform action
    if (action === 'updateRole') {
      await updateUserRole(targetUserId, value as UserRole);
    } else if (action === 'setActive') {
      await setUserActive(targetUserId, value as boolean);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
      });
    }

    // Get updated user
    const updatedUser = await getUserById(targetUserId);

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
    });
  }
};

// DELETE - Delete user
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const targetUserId = url.searchParams.get('targetUserId');

    // Check if requesting user is admin
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
      });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), {
        status: 400,
      });
    }

    // Cannot delete yourself
    if (userId === targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400 }
      );
    }

    // Delete user
    await deleteUser(targetUserId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
    });
  }
};

