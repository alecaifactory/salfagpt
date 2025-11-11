import type { APIRoute } from 'astro';
import { getAllUsers, createUser, getUserByEmail, firestore, COLLECTIONS } from '../../../lib/firestore';

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

    // Check if requester is admin (only admins can list users)
    const requester = await getUserByEmail(requesterEmail);
    if (!requester || !requester.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load all users (admin-only access)
    let allUsers = await getAllUsers();
    
    // ROLE-BASED FILTERING:
    // - SuperAdmin: See ALL users with their organizations
    // - Admin: See ONLY users in their organization(s)
    const isSuperAdmin = requester.roles?.includes('superadmin') || requester.role === 'superadmin';
    
    if (!isSuperAdmin) {
      // Admin: Filter to only users in same organization(s)
      const requesterOrgs = [
        requester.organizationId,
        ...(requester.assignedOrganizations || [])
      ].filter(Boolean);
      
      allUsers = allUsers.filter(user => {
        const userOrgs = [
          user.organizationId,
          ...(user.assignedOrganizations || [])
        ].filter(Boolean);
        
        // User visible if they share ANY organization with requester
        return userOrgs.some(org => requesterOrgs.includes(org));
      });
      
      console.log(`🔒 Admin ${requesterEmail} filtered to ${allUsers.length} users in org(s): ${requesterOrgs.join(', ')}`);
    } else {
      console.log(`👑 SuperAdmin ${requesterEmail} viewing all ${allUsers.length} users`);
    }
    
    // Enrich users with organization info
    const enrichedUsers = await Promise.all(allUsers.map(async (user) => {
      let organizationName = '-';
      let domainName = '-';
      
      // Get organization name
      if (user.organizationId) {
        try {
          const orgDoc = await firestore.collection('organizations').doc(user.organizationId).get();
          if (orgDoc.exists) {
            organizationName = orgDoc.data()?.name || user.organizationId;
          }
        } catch (err) {
          console.error('Error fetching org:', err);
        }
      }
      
      // Get domain from email
      if (user.email) {
        const emailDomain = user.email.split('@')[1];
        if (emailDomain) {
          domainName = emailDomain;
        }
      }
      
      return {
        ...user,
        organizationName,
        domainName
      };
    }));

    return new Response(JSON.stringify({ users: enrichedUsers }), {
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
    const body = await request.json();
    const { email, name, roles, company, department, createdBy, organizationId, initFirstAdmin } = body;

    if (!email || !name || !roles || !company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Special case: Allow creating first admin without auth if initFirstAdmin flag is set
    if (initFirstAdmin === true) {
      console.log('🔧 Init first admin user:', email);
      const user = await createUser(email, name, roles, company, 'system-init', department, organizationId);
      
      return new Response(JSON.stringify({ user, message: 'First admin created successfully' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Regular creation requires auth
    const sessionCookie = cookies.get('flow_session');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
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
    const newUser = await createUser(email, name, roles, company, createdBy, department, organizationId);

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
