import type { APIRoute } from 'astro';
import { getAllUsers, createUser } from '../../../lib/firestore';
import { getUserByEmail } from '../../../lib/firestore';

// GET /api/users - List all users (SuperAdmin only)
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get current user from session
    const sessionCookie = cookies.get('flow_session');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In production, decode JWT to get user email
    // For now, we'll use a simple approach
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

    // Load all users
    const users = await getAllUsers();

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al cargar usuarios',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST /api/users - Create new user (SuperAdmin only)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionCookie = cookies.get('flow_session');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { email, name, roles, company, department, createdBy } = body;

    if (!email || !name || !roles || !company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if requester is SuperAdmin
    const requester = await getUserByEmail(createdBy);
    if (!requester || !requester.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user
    const newUser = await createUser(email, name, roles, company, createdBy, department);

    return new Response(JSON.stringify({ user: newUser }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al crear usuario',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
