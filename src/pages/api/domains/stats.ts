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

    // Load all conversations (agents)
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();

    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

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
      const userIds = domainUsers.map(u => u.id);

      // Count created agents (owned by users from this domain)
      const createdAgents = conversations.filter(c => userIds.includes(c.userId));
      const createdAgentCount = createdAgents.length;

      // Count shared agents (shared WITH users from this domain)
      const sharedAgentIds = new Set<string>();
      shares.forEach(share => {
        const sharedWith = share.sharedWith || [];
        sharedWith.forEach((target: any) => {
          if (target.type === 'user') {
            // Check if this target user is from this domain
            if (userIds.includes(target.id) || target.domain === domainId) {
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

