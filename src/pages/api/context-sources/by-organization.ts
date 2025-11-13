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

        // Query context sources for this organization
        // PERFORMANCE OPTIMIZED: 
        // - Uses index: organizationId + addedAt DESC (CICAgNi47oMK)
        // - Excludes extractedData to avoid transferring 4.4MB+ of data
        // - Only loads minimal metadata needed for listing
        const allOrgSources: any[] = [];
        
        const sourcesSnapshot = await firestore
          .collection(COLLECTIONS.CONTEXT_SOURCES)
          .where('organizationId', '==', org.id)
          .orderBy('addedAt', 'desc')
          .select(
            'name',
            'type', 
            'status',
            'labels',
            'userId',
            'addedAt',
            'assignedToAgents',
            'ragEnabled',
            'metadata'
            // ✅ Excludes: extractedData, ragMetadata.chunks (huge fields)
          )
          .get();
        
        sourcesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allOrgSources.push({
            id: doc.id,
            ...data,
            addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
          });
        });

        console.log(`      ✅ Found ${allOrgSources.length} sources for ${org.name}`);

        // Group sources by domain
        // STRATEGY: For CLI-uploaded sources (no user in users collection)
        //   1. Check source.domainId (if explicitly set)
        //   2. If org has single domain, use that (e.g., GetAI Factory)
        //   3. Otherwise use org.primaryDomain as fallback
        const domainGroups = new Map<string, any[]>();
        
        // Get user emails for domain assignment (for web-uploaded sources)
        const userEmailMap = new Map<string, string>();
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.email) {
            userEmailMap.set(doc.id, data.email);
          }
        });

        allOrgSources.forEach((source: any) => {
          let assignedDomain: string | null = null;
          
          // Priority 1: Explicit domainId on source (most reliable)
          if (source.domainId) {
            assignedDomain = source.domainId;
          }
          // Priority 2: User's email domain (for web uploads)
          else {
            const userEmail = userEmailMap.get(source.userId);
            const emailDomain = userEmail?.split('@')[1]?.toLowerCase();
            
            if (emailDomain) {
              const matchedDomain = org.domains.find((d: string) => 
                d.toLowerCase() === emailDomain
              );
              if (matchedDomain) {
                assignedDomain = matchedDomain;
              }
            }
          }
          // Priority 3: Org has single domain (e.g., GetAI Factory)
          if (!assignedDomain && org.domains.length === 1) {
            assignedDomain = org.domains[0];
          }
          // Priority 4: Use primary domain as fallback
          if (!assignedDomain && org.primaryDomain) {
            assignedDomain = org.primaryDomain;
          }
          
          // Add to domain group if we determined a domain
          if (assignedDomain) {
            if (!domainGroups.has(assignedDomain)) {
              domainGroups.set(assignedDomain, []);
            }
            domainGroups.get(assignedDomain)!.push(source);
          } else {
            console.warn(`      ⚠️ Could not determine domain for source: ${source.name} (userId: ${source.userId})`);
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

