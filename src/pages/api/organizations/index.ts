/**
 * Organizations API - List & Create
 * 
 * GET  /api/organizations - List all organizations (superadmin) or user's orgs (admin)
 * POST /api/organizations - Create organization (superadmin only)
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  listOrganizations, 
  listUserOrganizations,
  createOrganization 
} from '../../../lib/organizations';
import { isSuperAdmin } from '../../../types/users';
import type { CreateOrganizationInput } from '../../../types/organizations';

/**
 * GET /api/organizations
 * List organizations based on user role
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    
    console.log('🔍 Organizations API - Session check:', {
      hasSession: !!session,
      sessionData: session ? { id: session.id, email: session.email, role: session.role } : null,
      cookies: cookies.get('flow_session') ? 'present' : 'missing'
    });
    
    if (!session) {
      console.error('❌ Organizations API - No session found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // IMPORTANT: Get fresh user data from Firestore to check actual role
    // JWT might have old role cached
    let user = { role: session.role, id: session.id, roles: session.roles } as any;
    
    // For alec@getaifactory.com specifically, force superadmin check from database
    if (session.email === 'alec@getaifactory.com' || session.id === 'usr_uhwqffaqag1wrryd82tw') {
      try {
        const { getUserById } = await import('../../../lib/firestore.js');
        const dbUser = await getUserById(session.id);
        if (dbUser) {
          user.role = dbUser.role;
          user.roles = dbUser.roles;
          console.log('🔄 Updated user role from database:', {
            oldRole: session.role,
            newRole: dbUser.role,
            roles: dbUser.roles
          });
        }
      } catch (error) {
        console.warn('⚠️ Could not refresh user role from database:', error);
      }
    }
    
    console.log('✅ Organizations API - User authenticated:', {
      userId: user.id,
      userRole: user.role,
      userRoles: user.roles,
      isSuperAdmin: isSuperAdmin(user)
    });
    
    // SuperAdmin: See all organizations
    if (isSuperAdmin(user)) {
      const orgs = await listOrganizations();
      
      return new Response(JSON.stringify({
        organizations: orgs,
        count: orgs.length,
        userRole: 'superadmin'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Admin: See only assigned organizations
    if (session.role === 'admin') {
      const orgs = await listUserOrganizations(session.id);
      
      return new Response(JSON.stringify({
        organizations: orgs,
        count: orgs.length,
        userRole: 'admin'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Other roles: No organization access
    return new Response(JSON.stringify({
      organizations: [],
      count: 0,
      message: 'Organization management requires admin or superadmin role'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error listing organizations:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/organizations
 * Create new organization (superadmin only)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check SuperAdmin permission
    const user = { role: session.role, id: session.id } as any;
    if (!isSuperAdmin(user)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: 'Only superadmins can create organizations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.domains || body.domains.length === 0) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'name and domains are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build input
    const input: CreateOrganizationInput = {
      name: body.name,
      domains: body.domains,
      primaryDomain: body.primaryDomain || body.domains[0],
      ownerUserId: session.id,
      tenant: body.tenant,
      branding: body.branding,
      evaluationConfig: body.evaluationConfig,
      privacy: body.privacy,
      limits: body.limits,
    };
    
    // Create organization
    const organization = await createOrganization(input);
    
    console.log('✅ Organization created via API:', organization.id);
    
    return new Response(JSON.stringify({
      success: true,
      organization
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error creating organization:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      error: 'Failed to create organization',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

