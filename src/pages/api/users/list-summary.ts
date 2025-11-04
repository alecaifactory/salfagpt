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

    // 4. Load users (in parallel with conversations)
    const [usersSnapshot, conversationsSnapshot] = await Promise.all([
      firestore.collection('users').get(),
      firestore
        .collection('conversations')
        .select('userId', 'sharedWith') // Only get fields we need
        .get(),
    ]);

    console.log(`✅ Loaded ${usersSnapshot.size} users and ${conversationsSnapshot.size} conversations in ${Date.now() - startTime}ms`);

    // 5. Build conversation maps for efficient lookup
    const conversationsByUser = new Map<string, number>(); // userId -> owned count
    const sharedWithUser = new Map<string, number>(); // userId -> shared count

    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const ownerId = data.userId;
      const sharedWith = data.sharedWith || [];

      // Count owned agents
      conversationsByUser.set(ownerId, (conversationsByUser.get(ownerId) || 0) + 1);

      // Count shared agents
      sharedWith.forEach((userId: string) => {
        if (userId !== ownerId) {
          sharedWithUser.set(userId, (sharedWithUser.get(userId) || 0) + 1);
        }
      });
    });

    // 6. Map users with counts
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const userId = doc.id;

      // Helper to convert Firestore timestamps to ISO strings
      const toISOString = (timestamp: any) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toISOString();
        if (timestamp instanceof Date) return timestamp.toISOString();
        return timestamp;
      };

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
        // Computed counts
        ownedAgentsCount: conversationsByUser.get(userId) || 0,
        sharedAgentsCount: sharedWithUser.get(userId) || 0,
        // Keep legacy fields for backward compatibility
        agentAccessCount: (conversationsByUser.get(userId) || 0) + (sharedWithUser.get(userId) || 0),
        contextAccessCount: data.contextAccessCount || 0,
      };
    });

    console.log(`✅ User summary prepared in ${Date.now() - startTime}ms total`);

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

