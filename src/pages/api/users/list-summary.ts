import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getUserByEmail } from '../../../lib/firestore';

/**
 * GET /api/users/list-summary
 * 
 * Optimized endpoint that returns only the data needed for the User Management table:
 * - User basic info (id, email, name, roles, company, department, status)
 * - Owned agents count (conversations created by user)
 * - Shared agents count (conversations shared with user)
 * - Last login timestamp
 * 
 * Does NOT load full user data or all conversations - only what's needed for display
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify session
    const sessionCookie = cookies.get('flow_session');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Get requester
    const url = new URL(request.url);
    const requesterEmail = url.searchParams.get('requesterEmail');

    if (!requesterEmail) {
      return new Response(JSON.stringify({ error: 'requesterEmail required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify admin access
    const requester = await getUserByEmail(requesterEmail);
    if (!requester || !requester.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📊 Loading user summary data...');
    const startTime = Date.now();

    // 4. Load users (in parallel with ACTIVE conversations/agents and agent_shares)
    const [usersSnapshot, conversationsSnapshot, agentSharesSnapshot] = await Promise.all([
      firestore.collection('users').get(),
      firestore
        .collection('conversations')
        .where('status', 'in', ['active', null]) // Only active (null = legacy active)
        .select('userId', 'isAgent', 'agentId', 'title') // Get fields needed for filtering
        .get(),
      firestore.collection('agent_shares').get(), // Load agent shares
    ]);
    
    // 4b. ROLE-BASED FILTERING:
    // - SuperAdmin: See ALL users with their organizations
    // - Admin: See ONLY users in their organization(s)
    const isSuperAdmin = requester.roles?.includes('superadmin') || requester.role === 'superadmin';
    
    let filteredUsersSnapshot = usersSnapshot.docs;
    
    if (!isSuperAdmin) {
      // Admin: Filter to only users in same organization(s)
      const requesterOrgs = [
        requester.organizationId,
        ...(requester.assignedOrganizations || [])
      ].filter(Boolean);
      
      filteredUsersSnapshot = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const userOrgs = [
          userData.organizationId,
          ...(userData.assignedOrganizations || [])
        ].filter(Boolean);
        
        // User visible if they share ANY organization with requester
        return userOrgs.some(org => requesterOrgs.includes(org));
      });
      
      console.log(`🔒 Admin ${requesterEmail} filtered to ${filteredUsersSnapshot.length} users in org(s): ${requesterOrgs.join(', ')}`);
    } else {
      console.log(`👑 SuperAdmin ${requesterEmail} viewing all ${filteredUsersSnapshot.length} users`);
    }

    console.log(`✅ Loaded ${filteredUsersSnapshot.length} users (filtered), ${conversationsSnapshot.size} active conversations, and ${agentSharesSnapshot.size} shares in ${Date.now() - startTime}ms`);
    console.log(`   Building ID mappings for ${filteredUsersSnapshot.length} users...`);

    // 5. Build user ID mappings (email-based ID ↔️ OAuth numeric ID)
    const userIdToOAuthId = new Map<string, string>(); // email-based → OAuth
    const oauthIdToUserId = new Map<string, string>(); // OAuth → email-based
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const emailBasedId = doc.id; // e.g., alec_getaifactory_com
      const oauthId = data.userId; // e.g., 114671162830729001607
      
      if (oauthId) {
        userIdToOAuthId.set(emailBasedId, oauthId);
        oauthIdToUserId.set(oauthId, emailBasedId);
      }
      
      // Debug for specific user
      if (data.email === 'alec@getaifactory.com') {
        console.log(`🔍 User alec@getaifactory.com ID mapping:`);
        console.log(`   Email-based ID: ${emailBasedId}`);
        console.log(`   OAuth ID: ${oauthId}`);
      }
    });

    // 6. Build conversation maps for efficient lookup
    const conversationsByUser = new Map<string, number>(); // userId -> owned ACTIVE count
    const sharedWithUser = new Map<string, Set<string>>(); // userId -> Set of unique agent IDs shared WITH user
    const sharedByUser = new Map<string, Set<string>>(); // userId -> Set of unique agent IDs shared BY user

    // Count owned ACTIVE AGENTS
    // Filter: isAgent=true OR (isAgent is undefined AND agentId is undefined) = parent agents
    // Exclude: isAgent=false OR agentId exists = child chats
    let debugAgentCount = 0;
    let totalAgentsFiltered = 0;
    
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const convUserId = data.userId;
      
      // Determine if this is an agent (not a chat)
      const isAgentDoc = data.isAgent === true || (data.isAgent === undefined && !data.agentId);
      
      // Skip if it's a chat (isAgent=false or has agentId parent reference)
      if (!isAgentDoc) {
        return;
      }
      
      totalAgentsFiltered++;
      
      // Find which user owns this agent
      let ownerId = convUserId;
      
      // If convUserId is an OAuth ID, map it to email-based ID
      if (oauthIdToUserId.has(convUserId)) {
        const mappedId = oauthIdToUserId.get(convUserId)!;
        
        // Debug for alec's agents
        if (mappedId === 'alec_getaifactory_com' && debugAgentCount < 3) {
          console.log(`     Agent "${data.title}" userId=${convUserId} isAgent=${data.isAgent} agentId=${data.agentId || 'none'} → counted for ${mappedId}`);
          debugAgentCount++;
        }
        
        ownerId = mappedId;
      } else {
        // Debug for alec even if not OAuth
        if (convUserId === 'alec_getaifactory_com' && debugAgentCount < 3) {
          console.log(`     Agent "${data.title}" userId=${convUserId} isAgent=${data.isAgent} agentId=${data.agentId || 'none'} → counted`);
          debugAgentCount++;
        }
      }
      
      conversationsByUser.set(ownerId, (conversationsByUser.get(ownerId) || 0) + 1);
    });
    
    console.log(`   Filtered to ${totalAgentsFiltered} agents from ${conversationsSnapshot.size} total active conversations`);

    // Count unique agents shared WITH each user (received)
    // Count unique agents shared BY each user (sent)
    agentSharesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const ownerId = data.ownerId; // User who is sharing (sender)
      const agentId = data.agentId; // Agent being shared
      const sharedWith = data.sharedWith || [];

      // Normalize owner ID to email-based
      let normalizedOwnerId = ownerId;
      if (oauthIdToUserId.has(ownerId)) {
        normalizedOwnerId = oauthIdToUserId.get(ownerId)!;
      }

      // Count unique agents shared BY this owner
      if (!sharedByUser.has(normalizedOwnerId)) {
        sharedByUser.set(normalizedOwnerId, new Set());
      }
      sharedByUser.get(normalizedOwnerId)!.add(agentId);

      // Count unique agents shared WITH each target user
      sharedWith.forEach((target: any) => {
        if (target.type === 'user' && target.id) {
          // Normalize target ID to email-based
          let userId = target.id;
          if (oauthIdToUserId.has(target.id)) {
            userId = oauthIdToUserId.get(target.id)!;
          }
          
          if (!sharedWithUser.has(userId)) {
            sharedWithUser.set(userId, new Set());
          }
          sharedWithUser.get(userId)!.add(agentId); // Add unique agent ID
        }
      });
    });

    // 6. Map users with counts and enrich with organization data
    const users = await Promise.all(filteredUsersSnapshot.map(async (doc) => {
      const data = doc.data();
      const userId = doc.id;

      // Helper to convert Firestore timestamps to ISO strings
      const toISOString = (timestamp: any) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toISOString();
        if (timestamp instanceof Date) return timestamp.toISOString();
        return timestamp;
      };

      const ownedCount = conversationsByUser.get(userId) || 0;
      const sharedWithCount = sharedWithUser.get(userId)?.size || 0; // Unique agents shared WITH user
      const sharedByCount = sharedByUser.get(userId)?.size || 0; // Unique agents shared BY user
      
      // Debug logging for alec specifically
      if (data.email === 'alec@getaifactory.com') {
        console.log(`🔍 Alec agent counts:`);
        console.log(`   userId (lookup key): ${userId}`);
        console.log(`   conversationsByUser has key? ${conversationsByUser.has(userId)}`);
        console.log(`   ownedCount: ${ownedCount}`);
        console.log(`   All keys in conversationsByUser:`, Array.from(conversationsByUser.keys()));
      }
      
      // Debug logging for other users with counts
      if (ownedCount > 0 || sharedWithCount > 0 || sharedByCount > 0) {
        console.log(`  User ${data.email}: owned=${ownedCount}, receivedShares=${sharedWithCount}, sentShares=${sharedByCount}`);
      }
      
      // Enrich with organization info
      let organizationName = '-';
      if (data.organizationId) {
        try {
          const orgDoc = await firestore.collection('organizations').doc(data.organizationId).get();
          if (orgDoc.exists) {
            organizationName = orgDoc.data()?.name || data.organizationId;
          }
        } catch (err) {
          console.error('Error fetching org:', err);
        }
      }
      
      // Get domain from email
      const domainName = data.email ? data.email.split('@')[1] : '-';

      return {
        id: doc.id,
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        roles: data.roles || [data.role],
        company: data.company,
        department: data.department,
        createdBy: data.createdBy,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
        lastLoginAt: toISOString(data.lastLoginAt), // ✅ Properly converted
        isActive: data.isActive ?? true,
        avatarUrl: data.avatarUrl,
        // Multi-org fields
        organizationId: data.organizationId,
        organizationName,
        domainName,
        // Computed counts
        ownedAgentsCount: ownedCount, // ACTIVE agents owned by user
        sharedWithUserCount: sharedWithCount, // Unique agents shared WITH user (received)
        sharedByUserCount: sharedByCount, // Unique agents shared BY user (sent)
        // Legacy/deprecated fields for backward compatibility
        sharedAgentsCount: sharedWithCount, // Deprecated: use sharedWithUserCount
        agentAccessCount: ownedCount + sharedWithCount,
        contextAccessCount: data.contextAccessCount || 0,
      };
    }));

    const totalOwned = Array.from(conversationsByUser.values()).reduce((a, b) => a + b, 0);
    const totalSharedWith = Array.from(sharedWithUser.values()).reduce((a, b) => a + b.size, 0);
    const totalSharedBy = Array.from(sharedByUser.values()).reduce((a, b) => a + b.size, 0);
    
    console.log(`✅ User summary prepared: ${users.length} users in ${Date.now() - startTime}ms total`);
    console.log(`   ID mappings: ${userIdToOAuthId.size} email↔️OAuth pairs`);
    console.log(`   Total owned AGENTS: ${totalOwned} (filtered from ${conversationsSnapshot.size} active conversations)`);
    console.log(`   Unique agents shared WITH users: ${totalSharedWith}`);
    console.log(`   Unique agents shared BY users: ${totalSharedBy} (${agentSharesSnapshot.size} total shares)`);

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Always get fresh data
      },
    });
  } catch (error) {
    console.error('❌ Error loading user summary:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al cargar resumen de usuarios',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

