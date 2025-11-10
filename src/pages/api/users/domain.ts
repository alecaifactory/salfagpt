// API: Get Users by Domain
// GET - Get all users in a specific domain

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get domain from query
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    
    if (!domain) {
      return new Response(JSON.stringify({ error: 'domain required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only admin/superadmin can view domain users
    const userRole = session.role || 'user';
    if (!['admin', 'superadmin'].includes(userRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get all users
    const usersSnapshot = await firestore
      .collection('users')
      .get();
    
    // Filter by domain (email contains @domain)
    const domainUsers = usersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLoginAt: doc.data().lastLoginAt?.toDate()
      }))
      .filter(user => {
        const userEmail = user.email || '';
        const userDomain = userEmail.split('@')[1];
        return userDomain === domain;
      })
      .filter(user => user.isActive !== false) // Only active users
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }));
    
    console.log(`✅ Found ${domainUsers.length} users in domain: ${domain}`);
    
    return new Response(JSON.stringify(domainUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/users/domain:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

