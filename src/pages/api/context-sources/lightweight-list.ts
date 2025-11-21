import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/context-sources/lightweight-list
 * 
 * OPTIMIZED lightweight endpoint for fast Context Management loading
 * 
 * Features:
 * - Pagination support (20-50 items per page)
 * - Minimal fields only (no extractedData, no chunk data)
 * - Fast domain/org grouping counts
 * - On-demand detail loading
 * 
 * Query Params:
 * - page: number (default: 0)
 * - pageSize: number (default: 50)
 * - organizationId: string (optional - filter by org)
 * - domainId: string (optional - filter by domain)
 * - tag: string (optional - filter by tag)
 * - sort: 'date' | 'name' (default: 'date')
 * 
 * Response:
 * {
 *   sources: [...],        // Paginated sources (lightweight)
 *   totalCount: number,    // Total matching sources
 *   hasMore: boolean,      // More pages available?
 *   organizations: [...],  // Org summary (name, count only)
 *   domains: [...],        // Domain summary (name, count only)
 *   tags: [...]           // Tag summary (name, count only)
 * }
 */

const SUPERADMIN_EMAILS = [
  'alec@getaifactory.com',
  'aleclara@gmail.com'
];

export const GET: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // 1. Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = session.email?.toLowerCase() || '';
    const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);

    // 2. Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const filterOrgId = url.searchParams.get('organizationId') || '';
    const filterDomainId = url.searchParams.get('domainId') || '';
    const filterTag = url.searchParams.get('tag') || '';
    const sortBy = url.searchParams.get('sort') || 'date';

    console.log('🚀 Lightweight context sources list:', {
      user: userEmail,
      page,
      pageSize,
      filterOrgId,
      filterDomainId,
      filterTag,
      sortBy
    });

    // 3. Get user role
    const userDoc = await firestore.collection(COLLECTIONS.USERS).doc(session.id).get();
    if (!userDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role || 'user';
    const isAdmin = userRole === 'admin';
    const isOrgScoped = isSuperAdmin || isAdmin;

    // 4. Build query based on access level
    let query: any = firestore.collection(COLLECTIONS.CONTEXT_SOURCES);

    if (!isOrgScoped) {
      // Regular user: only their sources
      query = query.where('userId', '==', session.id);
    } else {
      // Admin/SuperAdmin: apply org/domain filters
      if (filterOrgId) {
        query = query.where('organizationId', '==', filterOrgId);
      }
      if (filterDomainId) {
        query = query.where('domainId', '==', filterDomainId);
      }
      
      // If no filters and admin (not superadmin), filter by user's org
      if (!filterOrgId && !filterDomainId && isAdmin && !isSuperAdmin) {
        const userOrgId = userData?.organizationId;
        if (userOrgId) {
          query = query.where('organizationId', '==', userOrgId);
        }
      }
    }

    // 5. Apply tag filter if specified
    if (filterTag) {
      query = query.where('labels', 'array-contains', filterTag);
    }

    // 6. Sort
    const sortField = sortBy === 'name' ? 'name' : 'addedAt';
    const sortDirection = sortBy === 'name' ? 'asc' : 'desc';
    query = query.orderBy(sortField, sortDirection);

    // 7. Select only lightweight fields (CRITICAL for performance)
    query = query.select(
      'name',
      'type',
      'status',
      'labels',
      'userId',
      'organizationId',
      'domainId',
      'addedAt',
      'ragEnabled',
      'metadata.originalFileName',
      'metadata.pageCount',
      'metadata.validated',
      'metadata.uploaderEmail'
      // ✅ EXCLUDES: extractedData, ragMetadata.chunks, ragMetadata.embeddings
    );

    // 8. Pagination
    const offset = page * pageSize;
    query = query.offset(offset).limit(pageSize + 1); // +1 to check hasMore

    // 9. Execute query
    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    // 10. Format sources (lightweight)
    const sources = docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        status: data.status,
        labels: data.labels || [],
        userId: data.userId,
        organizationId: data.organizationId,
        domainId: data.domainId,
        addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
        ragEnabled: data.ragEnabled || false,
        metadata: {
          originalFileName: data.metadata?.originalFileName,
          pageCount: data.metadata?.pageCount,
          validated: data.metadata?.validated,
          uploaderEmail: data.metadata?.uploaderEmail
        }
      };
    });

    // 11. Get summary counts (for filters/facets)
    // This is lightweight - only counts, not full data
    let summaryQuery: any = firestore.collection(COLLECTIONS.CONTEXT_SOURCES);
    
    if (!isOrgScoped) {
      summaryQuery = summaryQuery.where('userId', '==', session.id);
    } else if (isAdmin && !isSuperAdmin && userData?.organizationId) {
      summaryQuery = summaryQuery.where('organizationId', '==', userData.organizationId);
    }

    // Get counts by organization (lightweight aggregation)
    const allSourcesSnapshot = await summaryQuery
      .select('organizationId', 'domainId', 'labels')
      .get();

    const orgCounts = new Map<string, number>();
    const domainCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    allSourcesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.organizationId) {
        orgCounts.set(data.organizationId, (orgCounts.get(data.organizationId) || 0) + 1);
      }
      
      if (data.domainId) {
        domainCounts.set(data.domainId, (domainCounts.get(data.domainId) || 0) + 1);
      }
      
      const labels = data.labels || [];
      if (labels.length === 0) {
        tagCounts.set('General', (tagCounts.get('General') || 0) + 1);
      } else {
        labels.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // 12. Load org/domain names (lightweight - no sources)
    const organizations = await Promise.all(
      Array.from(orgCounts.entries()).map(async ([orgId, count]) => {
        const orgDoc = await firestore.collection('organizations').doc(orgId).get();
        const orgData = orgDoc.data();
        return {
          id: orgId,
          name: orgData?.name || orgId,
          count
        };
      })
    );

    const domains = Array.from(domainCounts.entries()).map(([domainId, count]) => ({
      id: domainId,
      name: domainId,
      count
    }));

    const tags = Array.from(tagCounts.entries())
      .sort(([a], [b]) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
      })
      .map(([name, count]) => ({ name, count }));

    const duration = Date.now() - startTime;

    console.log(`✅ Lightweight list loaded in ${duration}ms:`, {
      sources: sources.length,
      total: allSourcesSnapshot.size,
      hasMore,
      orgs: organizations.length,
      domains: domains.length,
      tags: tags.length
    });

    return new Response(
      JSON.stringify({
        sources,
        totalCount: allSourcesSnapshot.size,
        hasMore,
        page,
        pageSize,
        organizations,
        domains,
        tags,
        metadata: {
          durationMs: duration,
          loadedBy: isSuperAdmin ? 'superadmin' : isAdmin ? 'admin' : 'user'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error loading lightweight context sources:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load context sources' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


