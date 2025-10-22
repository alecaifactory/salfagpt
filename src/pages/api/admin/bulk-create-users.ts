/**
 * Bulk Create Users API Endpoint
 * 
 * Admin-only endpoint to create multiple users at once.
 * Requires admin authentication.
 */

import type { APIRoute } from 'astro';
import { createUser } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies });
    
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'No session found. Please login first.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verify admin role
    if (session.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'Only admins can bulk create users.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Parse request body
    const body = await request.json();
    const { users } = body as {
      users: Array<{
        email: string;
        name: string;
        company: string;
        department?: string;
      }>;
    };

    if (!users || !Array.isArray(users)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request',
        message: 'Expected array of users in request body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`👥 Creating ${users.length} users...`);

    // 4. Create users
    const results = {
      created: [] as string[],
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const userData of users) {
      try {
        await createUser(
          userData.email,
          userData.name,
          ['user'], // Standard user role
          userData.company,
          session.email, // Created by current admin
          userData.department
        );

        results.created.push(userData.email);
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ 
          email: userData.email, 
          error: errorMessage 
        });
        console.error(`❌ Failed to create ${userData.email}:`, errorMessage);
      }
    }

    // 5. Return results
    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: users.length,
        created: results.created.length,
        failed: results.errors.length,
      },
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Bulk create users error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

