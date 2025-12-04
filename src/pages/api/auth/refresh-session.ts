/**
 * API: Refresh Session
 * POST /api/auth/refresh-session
 * 
 * Refreshes the user's JWT token with the latest role/permissions from Firestore.
 * This allows role changes to take effect without requiring a full re-login.
 */

import type { APIRoute } from 'astro';
import { verifyJWT, generateJWT } from '../../../lib/auth';
import { getUserByEmail } from '../../../lib/firestore';
import { getDomainFromEmail } from '../../../lib/domains';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // 1. Get current session
    const token = cookies.get('flow_session')?.value;
    
    if (!token) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No session found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Verify current JWT
    const decoded = verifyJWT(token);
    
    if (!decoded || !decoded.email) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Get latest user data from Firestore
    const user = await getUserByEmail(decoded.email);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Check if role has changed
    const oldRole = decoded.role || 'user';
    const newRole = user.role || 'user';
    const roleChanged = oldRole !== newRole;
    
    console.log('🔄 Session refresh:', {
      email: user.email,
      oldRole,
      newRole,
      roleChanged,
      timestamp: new Date().toISOString(),
    });
    
    // 5. Create new JWT with updated data
    const newUserData = {
      id: user.id,
      googleUserId: decoded.googleUserId, // Preserve Google OAuth ID
      email: user.email,
      name: user.name,
      picture: decoded.picture, // Preserve picture from original OAuth
      verified_email: decoded.verified_email,
      role: user.role || 'user',
      roles: user.roles || ['user'],
      domain: getDomainFromEmail(user.email),
    };
    
    const newToken = generateJWT(newUserData);
    
    // 6. Set new session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookies.set('flow_session', newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 604800, // 7 days
      path: '/',
    });
    
    console.log('✅ Session refreshed:', {
      email: user.email,
      role: newRole,
      roleChanged,
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      roleChanged,
      oldRole,
      newRole,
      message: roleChanged 
        ? `Role updated from ${oldRole} to ${newRole}. Please refresh the page.`
        : 'Session refreshed successfully.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Session refresh error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Session refresh failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also support GET for easy testing
export const GET: APIRoute = async (context) => {
  return POST(context);
};

