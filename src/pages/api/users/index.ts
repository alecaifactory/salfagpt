import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { verifyJWT } from '../../../lib/auth';
import { getPermissionsForRole } from '../../../lib/permissions';

// GET /api/users - List all users (admin only)
export const GET: APIRoute = async ({ request, cookies }) => {
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

    // Get all users
    const snapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get();
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate?.() || undefined,
      };
    });

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// POST /api/users - Create new user (admin only)
export const POST: APIRoute = async ({ request, cookies }) => {
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

    const { email, name, role, company, department } = await request.json();

    // Validate required fields
    if (!email || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user ID from email
    const userId = email.replace('@', '_').replace(/\./g, '_');

    // Check if user already exists
    const existingUser = await firestore.collection('users').doc(userId).get();
    if (existingUser.exists) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user
    const newUser = {
      id: userId,
      email,
      name,
      role,
      permissions: getPermissionsForRole(role),
      company: company || 'Demo Corp',
      department: department || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    await firestore.collection('users').doc(userId).set(newUser);

    console.log('✅ User created:', userId);

    return new Response(JSON.stringify({
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

