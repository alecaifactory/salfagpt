import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/analytics/domain-reports
 * Returns comprehensive domain verification reports
 * - Active domains table
 * - User-domain assignments
 * - Domain statistics
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

    // Load all organizations
    const orgsSnapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .get();

    const organizations = orgsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

    // Load all users
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<any>;

    // Build Report 1: Active Domains
    const activeDomains = organizations
      .filter(org => org.enabled === true)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(org => {
        const domainUsers = users.filter(u => u.email?.split('@')[1] === org.id);
        const createdDate = org.createdAt?.toDate?.() || new Date();
        const formattedDate = createdDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });

        return {
          id: org.id,
          name: org.name || 'N/A',
          createdBy: org.createdBy || 'unknown',
          createdDate: formattedDate,
          userCount: domainUsers.length,
        };
      });

    // Build Report 2: User-Domain Assignments
    const userDomainAssignments = users
      .sort((a, b) => {
        const domainA = a.email?.split('@')[1] || '';
        const domainB = b.email?.split('@')[1] || '';
        return domainA.localeCompare(domainB) || a.email.localeCompare(b.email);
      })
      .map(user => {
        const domain = user.email?.split('@')[1] || 'unknown';
        const domainOrg = organizations.find(org => org.id === domain);
        const domainStatus = domainOrg?.enabled === true ? 'Active' : 'Not Active';

        return {
          email: user.email,
          name: user.name || 'N/A',
          role: user.role || 'user',
          domain,
          domainStatus,
        };
      });

    // Build Report 3: Domain Statistics
    const domainStats = new Map<string, {
      count: number;
      enabled: boolean;
      name: string;
    }>();

    users.forEach(user => {
      const domain = user.email?.split('@')[1];
      if (!domain) return;

      if (!domainStats.has(domain)) {
        const org = organizations.find(o => o.id === domain);
        domainStats.set(domain, {
          count: 0,
          enabled: org?.enabled === true,
          name: org?.name || domain,
        });
      }

      const stats = domainStats.get(domain)!;
      stats.count++;
    });

    const domainStatsArray = Array.from(domainStats.entries())
      .sort((a, b) => b[1].count - a[1].count) // Sort by user count desc
      .map(([domain, stats]) => ({
        domain,
        name: stats.name,
        userCount: stats.count,
        status: stats.enabled ? '✅ Active' : '❌ Inactive',
      }));

    return new Response(
      JSON.stringify({
        activeDomains,
        userDomainAssignments,
        domainStats: domainStatsArray,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating domain reports:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate domain reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

