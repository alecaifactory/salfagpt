import type { APIRoute } from 'astro';
import {
  getDomains,
  createDomain,
  batchCreateDomains,
} from '../../../lib/domains';
import { getSession, verifyJWT } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

// SuperAdmin emails (hardcoded list)
const SUPERADMIN_EMAILS = ['alec@getaifactory.com', 'admin@getaifactory.com'];

// GET /api/domains - List all domains (SuperAdmin only, or active domains for user creation)
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🆕 Allow any authenticated user to fetch active domains (for user creation)
    // Only SuperAdmins can fetch all domains (including inactive)
    if (!activeOnly && !SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Loading domains from organizations...');
    
    // 🔄 NEW: Load domains from organizations collection (multi-org compatible)
    const orgsSnapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .get();

    const domains: Array<{ id: string; name: string; enabled: boolean }> = [];

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      const orgDomains = orgData.domains || [];
      const isActive = orgData.isActive !== false;
      const companyInfo = orgData.companyInfo || {};

      // Extract each domain from the organization
      for (const domainId of orgDomains) {
        // 🆕 Filter to only active domains if requested
        if (activeOnly && !isActive) {
          continue; // Skip inactive organizations
        }

        // Use domain-specific company info if available, fallback to org name
        const domainCompanyInfo = companyInfo[domainId];
        const displayName = domainCompanyInfo?.companyName || orgData.name || domainId;

        domains.push({
          id: domainId,
          name: displayName,
          enabled: isActive,
        });
      }
    }

    console.log(`   ✅ Loaded ${domains.length} domains from ${orgsSnapshot.size} organizations`);

    return new Response(
      JSON.stringify({ domains }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in domains API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch domains' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/domains - Create new domain or batch create (SuperAdmin only)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify SuperAdmin email
    if (!SUPERADMIN_EMAILS.includes(session.email?.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { domainId, name, enabled, description, domainList, isBatch } = body;

    // Batch creation
    if (isBatch && domainList) {
      const result = await batchCreateDomains(
        domainList,
        session.email,
        enabled ?? true
      );

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Single domain creation
    if (!domainId) {
      return new Response(
        JSON.stringify({ error: 'domainId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const domain = await createDomain(domainId, {
      name: name || domainId,
      createdBy: session.email,
      enabled: enabled ?? true,
      description: description || '',
    });

    return new Response(
      JSON.stringify({ domain }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating domain:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create domain' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

