import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/domains/list-all-domains
 * 
 * Returns a flattened list of all domains across all organizations
 * - SuperAdmin: See ALL domains from ALL organizations
 * - Admin: See only domains from their organization(s)
 * 
 * Each domain includes:
 * - Domain ID (e.g., 'getaifactory.com')
 * - Organization it belongs to
 * - User count, agent count, etc.
 */

const SUPERADMIN_EMAILS = ['alec@getaifactory.com', 'admin@getaifactory.com'];

interface DomainRow {
  // Domain identity
  domainId: string;                     // e.g., 'getaifactory.com'
  domainName?: string;                  // Display name (optional, from companyInfo)
  
  // Organization relationship
  organizationId: string;               // e.g., 'getai-factory'
  organizationName: string;             // e.g., 'GetAI Factory'
  isPrimaryDomain: boolean;             // Is this the primary domain for the org?
  
  // Domain Prompt (organization-level AI instructions)
  domainPrompt?: string;                // Optional prompt inherited by all agents
  
  // Status
  enabled: boolean;                     // Organization enabled status
  isActive: boolean;                    // Organization active status
  
  // Counts
  userCount: number;
  createdAgentCount: number;
  sharedAgentCount: number;
  contextCount: number;
  
  // Metadata
  createdBy: string;                    // Who created the organization
  createdAt: Date;
  updatedAt: Date;
}

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

    console.log('📊 Loading all domains (flattened)...');
    const startTime = Date.now();

    const isSuperAdmin = SUPERADMIN_EMAILS.includes(session.email?.toLowerCase() || '');
    
    // Get current user to check their domains
    let userDomains: string[] = [];
    if (!isSuperAdmin) {
      const userDoc = await firestore
        .collection(COLLECTIONS.USERS)
        .doc(session.id)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userEmail = userData?.email || session.email || '';
        const emailDomain = userEmail.split('@')[1]?.toLowerCase();
        if (emailDomain) {
          userDomains.push(emailDomain);
        }
      }
    }

    // Load all organizations
    const orgsSnapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .get();

    console.log(`   ✅ Loaded ${orgsSnapshot.size} organizations`);

    // Flatten organizations → domains
    const domainRows: DomainRow[] = [];

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data() as any;
      const orgId = orgDoc.id;
      const orgDomains = orgData.domains || [];
      const primaryDomain = orgData.primaryDomain;

      // Filter organizations for non-superadmins
      if (!isSuperAdmin) {
        // Check if user has access to any domain in this org
        const hasAccess = orgDomains.some((d: string) => 
          userDomains.includes(d.toLowerCase())
        );
        
        if (!hasAccess) {
          continue; // Skip this organization
        }
      }

      // ✅ FAST PATH: Return basic data without stats for now
      // Stats can be loaded on-demand when user clicks on a domain
      const stats = {
        userCount: 0,
        createdAgentCount: 0,
        sharedAgentCount: 0,
        contextCount: 0,
      };

      // Create a row for each domain in the organization
      for (const domainId of orgDomains) {
        // For non-superadmins, only show domains they have access to
        if (!isSuperAdmin && !userDomains.includes(domainId.toLowerCase())) {
          continue;
        }

        // ✅ Load domain-specific settings (including domain-specific prompt)
        let domainSpecificPrompt = '';
        try {
          const domainDoc = await firestore.collection('domains').doc(domainId).get();
          if (domainDoc.exists) {
            const domainData = domainDoc.data();
            domainSpecificPrompt = domainData?.domainPrompt || '';
          }
        } catch (error) {
          console.warn(`⚠️ Could not load domain doc for ${domainId}:`, error);
        }

        domainRows.push({
          domainId,
          domainName: orgData.name, // Use org name as domain display name for now
          organizationId: orgId,
          organizationName: orgData.name || orgId,
          isPrimaryDomain: domainId === primaryDomain,
          domainPrompt: domainSpecificPrompt, // ✅ Use domain-specific prompt (not org prompt)
          enabled: orgData.isActive !== false, // Default to enabled
          isActive: orgData.isActive !== false,
          userCount: stats.userCount,
          createdAgentCount: stats.createdAgentCount,
          sharedAgentCount: stats.sharedAgentCount,
          contextCount: stats.contextCount,
          createdBy: orgData.ownerUserId || 'unknown',
          createdAt: orgData.createdAt?.toDate?.() || new Date(),
          updatedAt: orgData.updatedAt?.toDate?.() || new Date(),
        });
      }
    }

    // Sort: Primary domains first, then by user count
    domainRows.sort((a, b) => {
      if (a.isPrimaryDomain !== b.isPrimaryDomain) {
        return a.isPrimaryDomain ? -1 : 1;
      }
      return b.userCount - a.userCount;
    });

    const duration = Date.now() - startTime;
    console.log(`   ✅ Completed in ${duration}ms - ${domainRows.length} domains`);

    return new Response(
      JSON.stringify({ 
        domains: domainRows,
        isSuperAdmin,
        totalCount: domainRows.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error loading domains list:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load domains',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Get statistics for an organization
 * OPTIMIZED: Uses organizationId field directly instead of scanning all users
 */
async function getOrgStats(orgId: string) {
  try {
    // Get organization data
    const orgDoc = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(orgId)
      .get();
    
    if (!orgDoc.exists) {
      return { userCount: 0, createdAgentCount: 0, sharedAgentCount: 0, contextCount: 0 };
    }

    const orgData = orgDoc.data() as any;

    // ✅ OPTIMIZED: Query users by organizationId field directly
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .where('organizationId', '==', orgId)
      .get();

    const userCount = usersSnapshot.size;
    const oauthIds = usersSnapshot.docs
      .map(doc => doc.data().userId)
      .filter(Boolean);

    // ✅ OPTIMIZED: Query agents by organizationId field directly
    const createdAgentsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('organizationId', '==', orgId)
      .get();
    
    const createdAgentCount = createdAgentsSnapshot.size;

    // Shared agents - simplified for now
    const sharedAgentCount = 0;

    // ✅ OPTIMIZED: Query context sources by organizationId field directly  
    const contextSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('organizationId', '==', orgId)
      .get();
    
    const contextCount = contextSnapshot.size;

    return {
      userCount,
      createdAgentCount,
      sharedAgentCount,
      contextCount,
    };
  } catch (error) {
    console.error(`Error getting stats for org ${orgId}:`, error);
    return { userCount: 0, createdAgentCount: 0, sharedAgentCount: 0, contextCount: 0 };
  }
}

