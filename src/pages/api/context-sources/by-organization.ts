import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { listOrganizations, getUserOrganizationFromEmail, listUserOrganizations } from '../../../lib/organizations';

/**
 * GET /api/context-sources/by-organization
 * 
 * Get context sources grouped by organization and domain
 * 
 * Access Control:
 * - SuperAdmins: See ALL organizations and their context sources
 * - Admins: See ONLY their organization(s) context sources
 * - Users: Forbidden (use regular /api/context-sources instead)
 * 
 * Response Format:
 * {
 *   organizations: [
 *     {
 *       id: string,
 *       name: string,
 *       domains: [
 *         {
 *           domainId: string,
 *           domainName: string,
 *           sources: ContextSource[]
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
    
    console.log('🔍 Loading context sources by organization...');
    console.log(`   User: ${session.id} (${userEmail})`);
    console.log(`   Role: ${isSuperAdmin ? 'SuperAdmin' : 'Admin'}`);

    // 2. Get user data to check their organization(s)
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

    // 3. Verify user is admin or superadmin
    if (!isSuperAdmin && userRole !== 'admin') {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - Only SuperAdmins and Admins can access organization context sources' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Determine which organizations this user can see
    let accessibleOrgs: any[] = [];
    
    if (isSuperAdmin) {
      // SuperAdmin: See ALL organizations
      console.log('   🔓 SuperAdmin: Loading ALL organizations');
      const allOrgs = await listOrganizations();
      accessibleOrgs = allOrgs;
    } else {
      // Admin: See only their organization(s)
      console.log('   🔒 Admin: Loading user\'s organizations');
      const userOrgs = await listUserOrganizations(session.id);
      accessibleOrgs = userOrgs;
    }

    console.log(`   📊 Found ${accessibleOrgs.length} accessible organizations`);

    // 5. For each organization, get context sources grouped by domain
    const organizationsWithContext = await Promise.all(
      accessibleOrgs.map(async (org) => {
        console.log(`   📁 Loading context for org: ${org.name} (${org.domains.length} domains)`);
        
        // Get all users in this organization
        const usersSnapshot = await firestore
          .collection(COLLECTIONS.USERS)
          .where('organizationId', '==', org.id)
          .get();

        const orgUserIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`      Found ${orgUserIds.length} users in org ${org.name}`);

        // If no users, return empty org
        if (orgUserIds.length === 0) {
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            domainCount: org.domains.length,
            totalSources: 0,
            domains: []
          };
        }

        // Query context sources for these users
        // Firestore has a limit of 10 items for 'in' queries, so we batch
        const allOrgSources: any[] = [];
        const batchSize = 10;
        
        for (let i = 0; i < orgUserIds.length; i += batchSize) {
          const batch = orgUserIds.slice(i, i + batchSize);
          const sourcesSnapshot = await firestore
            .collection(COLLECTIONS.CONTEXT_SOURCES)
            .where('userId', 'in', batch)
            .get();
          
          sourcesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            allOrgSources.push({
              id: doc.id,
              ...data,
              addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
            });
          });
        }

        console.log(`      ✅ Found ${allOrgSources.length} sources for ${org.name}`);

        // Group sources by domain (using user's domainId or email domain)
        const domainGroups = new Map<string, any[]>();
        
        // Get user emails for domain assignment
        const userEmailMap = new Map<string, string>();
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.email) {
            userEmailMap.set(doc.id, data.email);
          }
        });

        allOrgSources.forEach((source: any) => {
          // Determine domain from user's email or domainId
          const userEmail = userEmailMap.get(source.userId);
          const emailDomain = userEmail?.split('@')[1]?.toLowerCase();
          
          // Find which org domain this matches
          const matchedDomain = org.domains.find((d: string) => 
            d.toLowerCase() === emailDomain
          );
          
          if (matchedDomain) {
            if (!domainGroups.has(matchedDomain)) {
              domainGroups.set(matchedDomain, []);
            }
            domainGroups.get(matchedDomain)!.push(source);
          }
        });

        // Convert to array format
        const domains = Array.from(domainGroups.entries()).map(([domainName, sources]) => ({
          domainId: domainName,
          domainName: domainName,
          sourceCount: sources.length,
          sources: sources.map((s: any) => ({
            // Return minimal metadata (no extractedData for performance)
            id: s.id,
            name: s.name,
            type: s.type,
            status: s.status,
            labels: s.labels,
            addedAt: s.addedAt,
            userId: s.userId, // Include userId for tracking
            metadata: {
              originalFileName: s.metadata?.originalFileName,
              pageCount: s.metadata?.pageCount,
              validated: s.metadata?.validated,
              validatedBy: s.metadata?.validatedBy,
              uploaderEmail: userEmailMap.get(s.userId) || s.metadata?.uploaderEmail,
            }
          }))
        }));

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          domainCount: org.domains.length,
          totalSources: allOrgSources.length,
          domains: domains.sort((a, b) => b.sourceCount - a.sourceCount) // Most sources first
        };
      })
    );

    // Filter out organizations with no context sources
    const orgsWithSources = organizationsWithContext.filter(org => org.totalSources > 0);

    const duration = Date.now() - startTime;
    console.log(`✅ Loaded context for ${orgsWithSources.length} organizations in ${duration}ms`);
    console.log(`   Total sources: ${orgsWithSources.reduce((sum, org) => sum + org.totalSources, 0)}`);

    return new Response(
      JSON.stringify({ 
        organizations: orgsWithSources,
        metadata: {
          totalOrganizations: orgsWithSources.length,
          totalSources: orgsWithSources.reduce((sum, org) => sum + org.totalSources, 0),
          loadedBy: isSuperAdmin ? 'superadmin' : 'admin',
          durationMs: duration
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error loading context sources by organization:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load context sources by organization' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

