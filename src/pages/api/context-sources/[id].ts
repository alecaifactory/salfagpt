import type { APIRoute } from 'astro';
import { getContextSource, userHasAccessToAgent } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/context-sources/[id]
 * Get a single context source with FULL data (includes extractedData)
 * 
 * Use this when you need the actual content, not just metadata
 * For list views, use /api/context-sources-metadata instead
 * 
 * 🔒 ACCESS CONTROL (2025-11-25):
 * Users can view a context source if:
 * 1. They own the source (source.userId === session.id), OR
 * 2. They are SuperAdmin, OR
 * 3. They have shared access to ANY agent that uses this source
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceId = params.id;
    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load FULL source including extractedData
    const source = await getContextSource(sourceId);
    
    if (!source) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. SECURITY: Verify access
    console.log('🔒 [CONTEXT ACCESS] Checking permissions for source:', sourceId);
    console.log('   User:', session.id, session.email);
    console.log('   Source owner:', source.userId);
    console.log('   Assigned to agents:', source.assignedToAgents?.length || 0);
    
    // Access granted if:
    // A) User owns the source
    const isOwner = source.userId === session.id;
    
    // B) User is SuperAdmin
    const isSuperAdmin = session.email === 'alec@getaifactory.com' || session.role === 'superadmin';
    
    // C) User has access to ANY agent that uses this source
    let hasAgentAccess = false;
    if (!isOwner && !isSuperAdmin && source.assignedToAgents && source.assignedToAgents.length > 0) {
      console.log('   🔍 Checking access to assigned agents...');
      
      // Check each agent this source is assigned to
      for (const agentId of source.assignedToAgents) {
        const access = await userHasAccessToAgent(session.id, agentId, session.email);
        if (access.hasAccess) {
          console.log(`   ✅ User has ${access.accessLevel} access to agent:`, agentId);
          hasAgentAccess = true;
          break; // Found access, no need to check more
        }
      }
    }
    
    // Deny if no access found
    if (!isOwner && !isSuperAdmin && !hasAgentAccess) {
      console.log('   ❌ Access denied - not owner, not superadmin, no agent access');
      return new Response(
        JSON.stringify({ error: 'Forbidden - You do not have access to this document' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('   ✅ Access granted:', { isOwner, isSuperAdmin, hasAgentAccess });

    console.log('✅ Loaded full context source:', sourceId, `(${source.extractedData?.length || 0} chars)`);

    return new Response(
      JSON.stringify({ source }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching context source:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch source' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
