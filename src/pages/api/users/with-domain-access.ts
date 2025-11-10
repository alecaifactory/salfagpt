// API: Get Users with Access to Domain Agents
// GET - Get users who have been granted access to agents shared by a domain

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
    
    // Only admin/superadmin can view
    const userRole = session.role || 'user';
    if (!['admin', 'superadmin'].includes(userRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔍 Finding users with access to domain agents:', domain);
    
    // Step 1: Find all agents owned by users in this domain
    const allUsersSnapshot = await firestore.collection('users').get();
    const domainOwners = allUsersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        email: doc.data().email || ''
      }))
      .filter(user => {
        const userDomain = user.email.split('@')[1];
        return userDomain === domain;
      });
    
    const domainOwnerIds = domainOwners.map(u => u.id);
    console.log('  Domain owners:', domainOwnerIds.length);
    
    if (domainOwnerIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Find all agents owned by these users
    const agentIds: string[] = [];
    
    // Query in chunks (Firestore 'in' limit is 10)
    for (let i = 0; i < domainOwnerIds.length; i += 10) {
      const chunk = domainOwnerIds.slice(i, i + 10);
      const agentsSnapshot = await firestore
        .collection('conversations')
        .where('userId', 'in', chunk)
        .where('isAgent', '==', true)
        .get();
      
      agentsSnapshot.docs.forEach(doc => {
        agentIds.push(doc.id);
      });
    }
    
    console.log('  Domain agents:', agentIds.length);
    
    if (agentIds.length === 0) {
      // No agents in domain yet
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 3: Find all agent_sharing records for these agents
    const userIdsWithAccess = new Set<string>();
    const sharedAgentCounts = new Map<string, number>();
    
    // Query in chunks
    for (let i = 0; i < agentIds.length; i += 10) {
      const chunk = agentIds.slice(i, i + 10);
      const sharingSnapshot = await firestore
        .collection('agent_sharing')
        .where('agentId', 'in', chunk)
        .get();
      
      sharingSnapshot.docs.forEach(doc => {
        const sharedWith = doc.data().sharedWith || [];
        sharedWith.forEach((userObj: any) => {
          const sharedUserId = typeof userObj === 'string' ? userObj : userObj.userId;
          userIdsWithAccess.add(sharedUserId);
          sharedAgentCounts.set(
            sharedUserId, 
            (sharedAgentCounts.get(sharedUserId) || 0) + 1
          );
        });
      });
    }
    
    console.log('  Users with access:', userIdsWithAccess.size);
    
    // Step 4: Get user details for those with access
    const usersWithAccess = [];
    
    for (const sharedUserId of userIdsWithAccess) {
      const userDoc = await firestore.collection('users').doc(sharedUserId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        usersWithAccess.push({
          id: userDoc.id,
          email: userData?.email || '',
          name: userData?.name || 'Unknown',
          role: userData?.role || 'user',
          sharedAgentCount: sharedAgentCounts.get(sharedUserId) || 0
        });
      }
    }
    
    console.log('✅ Users with domain access:', usersWithAccess.length);
    
    return new Response(JSON.stringify(usersWithAccess), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/users/with-domain-access:', error);
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

