import type { APIRoute } from 'astro';
import { createUsersBulk } from '../../../lib/firestore';
import { getUserByEmail } from '../../../lib/firestore';
import type { UserRole } from '../../../types/users';

// POST /api/users/bulk - Create multiple users from CSV (SuperAdmin only)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionCookie = cookies.get(cookieName);
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { csvText, createdBy } = body;

    if (!csvText || !createdBy) {
      return new Response(JSON.stringify({ error: 'Missing csvText or createdBy' }), {
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

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const users = lines
      .filter((line: string) => line.trim() && !line.startsWith('#')) // Skip comments
      .map((line: string) => {
        const [email, name, rolesStr, company, department] = line.split(',').map(s => s.trim());
        
        // Parse roles (semicolon-separated or single role)
        const roles = rolesStr.includes(';')
          ? rolesStr.split(';').map(r => r.trim() as UserRole)
          : [rolesStr.trim() as UserRole];

        return {
          email,
          name,
          roles,
          company,
          department: department || undefined,
        };
      })
      .filter(u => u.email && u.name && u.company); // Only valid entries

    // Create users in bulk
    const result = await createUsersBulk(users, createdBy);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bulk user creation:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al crear usuarios en masa',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

