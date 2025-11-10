/**
 * Data Lineage API
 * 
 * GET /api/lineage/:collection/:id - Get lineage history for a document
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { getDocumentLineage } from '../../../../lib/promotion';
import { isSuperAdmin, isOrganizationAdmin } from '../../../../types/users';

/**
 * GET /api/lineage/:collection/:id
 * Get complete lineage history for a document
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { collection, id } = params;
    if (!collection || !id) {
      return new Response(JSON.stringify({ 
        error: 'Collection and document ID required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get lineage
    const lineage = await getDocumentLineage(collection, id);
    
    if (lineage.length === 0) {
      return new Response(JSON.stringify({
        lineage: [],
        count: 0,
        message: 'No lineage found for this document'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check permission (if organizationId present in lineage)
    const firstEvent = lineage[0];
    if (firstEvent.organizationId) {
      const user = { role: session.role, id: session.id } as any;
      const canAccess = isSuperAdmin(user) || isOrganizationAdmin(user, firstEvent.organizationId);
      
      if (!canAccess) {
        return new Response(JSON.stringify({
          error: 'Forbidden',
          message: 'You do not have permission to view lineage for this organization'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      lineage,
      count: lineage.length,
      collection,
      documentId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error getting lineage:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

