import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/domains/stats
 * Returns domains with accurate real-time counts for:
 * - Users (from users collection)
 * - Created Agents (owned by users from this domain)
 * - Shared Agents (shared with users from this domain)
 * - Context Sources (created by users from this domain)
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load all domains
    const domainsSnapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .get();

    // Load all users
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

    // ✅ Build user ID mappings (email-based ID ↔️ OAuth numeric ID)
    // This is CRITICAL for matching agents to users correctly
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
    });

    // Load all ACTIVE conversations, then filter to agents in memory
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('status', 'in', ['active', null]) // Include null for backward compatibility
      .get();

    // Filter to AGENTS only (not chats)
    // Agent = isAgent:true OR (isAgent:undefined AND agentId:undefined)
    // Chat = isAgent:false OR agentId exists
    const agents = conversationsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        const isAgentDoc = data.isAgent === true || (data.isAgent === undefined && !data.agentId);
        return isAgentDoc;
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<any>;
    
    console.log(`📊 Loaded ${conversationsSnapshot.size} active conversations, filtered to ${agents.length} agents`);

    // Load all agent shares
    const sharesSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_SHARES)
      .get();

    const shares = sharesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

    // Load all context sources
    const contextSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .get();

    const contextSources = contextSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

    // Calculate stats for each domain
    const domainsWithStats = domainsSnapshot.docs.map(doc => {
      const domainData = doc.data();
      const domainId = doc.id;

      // Count users from this domain
      const domainUsers = users.filter(u => {
        const userDomain = u.email?.split('@')[1]?.toLowerCase();
        return userDomain === domainId.toLowerCase();
      });
      const userCount = domainUsers.length;
      
      // Get both email-based IDs and OAuth numeric IDs
      const userIds = domainUsers.map(u => u.id); // Email-based (e.g., alec_getaifactory_com)
      const userOAuthIds = domainUsers
        .map(u => u.userId) // OAuth numeric ID (e.g., 114671162830729001607)
        .filter(id => id); // Filter out undefined
      
      // Combine both ID arrays for comprehensive matching
      const allUserIds = [...userIds, ...userOAuthIds];

      // Count created AGENTS (owned by users from this domain)
      // ✅ FIXED: Match by EITHER email-based ID OR OAuth ID
      let createdAgentCount = 0;
      const createdAgents = agents.filter(a => {
        const agentUserId = a.userId;
        
        // Check if agent's userId matches any user in this domain (either format)
        const matchesEmailBased = userIds.includes(agentUserId);
        const matchesOAuth = userOAuthIds.includes(agentUserId);
        const matches = matchesEmailBased || matchesOAuth;
        
        if (matches) {
          createdAgentCount++;
        }
        
        return matches;
      });
      
      // Debug logging for specific domain
      if (domainId === 'getaifactory.com') {
        console.log(`🔍 Debug for ${domainId}:`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Email-based IDs: ${userIds}`);
        console.log(`   OAuth IDs: ${userOAuthIds}`);
        console.log(`   Total AGENTS in DB: ${agents.length}`);
        console.log(`   AGENTS matching domain users: ${createdAgentCount}`);
        
        // Sample a few agents
        agents.slice(0, 5).forEach(a => {
          const matchesEmail = userIds.includes(a.userId);
          const matchesOAuth = userOAuthIds.includes(a.userId);
          console.log(`     Agent "${a.title}" userId=${a.userId} matchesEmail=${matchesEmail} matchesOAuth=${matchesOAuth}`);
        });
      }

      // Count shared agents (shared WITH users from this domain)
      const sharedAgentIds = new Set<string>();
      shares.forEach(share => {
        const sharedWith = share.sharedWith || [];
        sharedWith.forEach((target: any) => {
          if (target.type === 'user') {
            // Check if this target user is from this domain
            // Match by: any user ID format OR domain
            if (
              allUserIds.includes(target.id) ||
              target.domain === domainId
            ) {
              sharedAgentIds.add(share.agentId);
            }
          }
        });
      });
      const sharedAgentCount = sharedAgentIds.size;

      // Count context sources (created by users from this domain)
      const domainContextSources = contextSources.filter(c => userIds.includes(c.userId));
      const contextCount = domainContextSources.length;

      return {
        id: domainId,
        name: domainData.name || domainId,
        enabled: domainData.enabled === true,
        createdBy: domainData.createdBy || 'unknown',
        createdAt: domainData.createdAt?.toDate?.() || new Date(),
        updatedAt: domainData.updatedAt?.toDate?.() || new Date(),
        description: domainData.description || '',
        
        // Real-time counts
        userCount,
        createdAgentCount,
        sharedAgentCount,
        totalAgentCount: createdAgentCount + sharedAgentCount,
        contextCount,
        
        // Legacy fields (for backward compatibility)
        allowedAgents: [],
        allowedContextSources: [],
      };
    });

    // Sort by enabled status, then by user count
    domainsWithStats.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return b.userCount - a.userCount;
    });

    return new Response(
      JSON.stringify({ domains: domainsWithStats }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error loading domain stats:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load domain stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

