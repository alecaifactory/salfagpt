import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { listOrganizations, listUserOrganizations } from '../../../lib/organizations';

/**
 * GET /api/context-sources/count-by-organization
 * 
 * LIGHTWEIGHT endpoint that returns ONLY counts, not actual document data
 * Used for fast initial loading before user explicitly requests to see documents
 * 
 * Access Control:
 * - SuperAdmins: See ALL organizations
 * - Admins: See ONLY their organization(s)
 * - Users: Forbidden
 * 
 * Response Format:
 * {
 *   organizations: [
 *     {
 *       id: string,
 *       name: string,
 *       totalSources: number,
 *       domains: [
 *         {
 *           domainId: string,
 *           domainName: string,
 *           sourceCount: number
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const SUPERADMIN_EMAILS = [
  'alec@getaifactory.com',
  'aleclara@gmail.com'
];

export const GET: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = session.email?.toLowerCase() || '';
    const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);
    
    console.log('📊 Loading document counts by organization (FAST MODE)...');
    console.log(`   User: ${session.id} (${userEmail})`);
    console.log(`   Role: ${isSuperAdmin ? 'SuperAdmin' : 'Admin'}`);

    // 2. Get user data
    const userDoc = await firestore
      .collection(COLLECTIONS.USERS)
      .doc(session.id)
      .get();
    
    if (!userDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role || 'user';

    // 3. Verify authorization
    if (!isSuperAdmin && userRole !== 'admin') {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - Only SuperAdmins and Admins can access' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get organizations
    let accessibleOrgs: any[] = [];
    
    if (isSuperAdmin) {
      console.log('   🔓 SuperAdmin: Loading ALL organizations');
      accessibleOrgs = await listOrganizations();
    } else {
      console.log('   🔒 Admin: Loading user\'s organizations');
      accessibleOrgs = await listUserOrganizations(session.id);
    }

    console.log(`   📊 Found ${accessibleOrgs.length} accessible organizations`);

    // 5. For each organization, get ONLY counts (no document data)
    const organizationsWithCounts = await Promise.all(
      accessibleOrgs.map(async (org) => {
        console.log(`   🔢 Counting sources for org: ${org.name}`);
        
        // Get users in this org
        const usersSnapshot = await firestore
          .collection(COLLECTIONS.USERS)
          .where('organizationId', '==', org.id)
          .select('email') // Minimal field selection
          .get();

        const orgUserIds = usersSnapshot.docs.map(doc => doc.id);
        const userEmailMap = new Map(
          usersSnapshot.docs.map(doc => [doc.id, doc.data().email])
        );

        if (orgUserIds.length === 0) {
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            totalSources: 0,
            domains: org.domains.map((d: string) => ({
              domainId: d,
              domainName: d,
              sourceCount: 0
            }))
          };
        }

        // Count sources by organizationId (fast - single query)
        const newSourcesSnapshot = await firestore
          .collection(COLLECTIONS.CONTEXT_SOURCES)
          .where('organizationId', '==', org.id)
          .select('domainId') // Only need domainId for grouping
          .get();
        
        const sourceCounts = new Map<string, number>();
        newSourcesSnapshot.docs.forEach(doc => {
          const domainId = doc.data().domainId || org.primaryDomain || org.domains[0];
          sourceCounts.set(domainId, (sourceCounts.get(domainId) || 0) + 1);
        });

        console.log(`      Found ${newSourcesSnapshot.size} sources with organizationId`);

        // Count legacy sources (by userId, in batches)
        if (orgUserIds.length > 0) {
          const batchSize = 10;
          let legacyCount = 0;
          
          for (let i = 0; i < orgUserIds.length; i += batchSize) {
            const userIdBatch = orgUserIds.slice(i, i + batchSize);
            
            const legacySnapshot = await firestore
              .collection(COLLECTIONS.CONTEXT_SOURCES)
              .where('userId', 'in', userIdBatch)
              .select('userId', 'domainId') // Minimal fields
              .get();
            
            legacySnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (!data.organizationId) { // Only count legacy (without orgId)
                legacyCount++;
                
                // Determine domain for counting
                const userEmail = userEmailMap.get(data.userId);
                const emailDomain = userEmail?.split('@')[1]?.toLowerCase();
                let assignedDomain = data.domainId || org.primaryDomain;
                
                if (!assignedDomain && emailDomain) {
                  const matched = org.domains.find((d: string) => d.toLowerCase() === emailDomain);
                  assignedDomain = matched || org.primaryDomain;
                }
                
                if (assignedDomain) {
                  sourceCounts.set(assignedDomain, (sourceCounts.get(assignedDomain) || 0) + 1);
                }
              }
            });
          }
          
          console.log(`      Found ${legacyCount} legacy sources`);
        }

        // Build domain response with counts only
        const domains = org.domains.map((domainName: string) => ({
          domainId: domainName,
          domainName: domainName,
          sourceCount: sourceCounts.get(domainName) || 0
        }));

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          totalSources: Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0),
          domains: domains.sort((a, b) => b.sourceCount - a.sourceCount)
        };
      })
    );

    const duration = Date.now() - startTime;
    const totalSources = organizationsWithCounts.reduce((sum, org) => sum + org.totalSources, 0);
    
    console.log(`✅ Counted sources for ${organizationsWithCounts.length} organizations in ${duration}ms`);
    console.log(`   Total sources: ${totalSources}`);

    return new Response(
      JSON.stringify({ 
        organizations: organizationsWithCounts,
        metadata: {
          totalOrganizations: organizationsWithCounts.length,
          totalSources,
          durationMs: duration,
          mode: 'count-only'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error counting sources by organization:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to count sources' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

