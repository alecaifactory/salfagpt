import type { APIRoute } from 'astro';
import { getConversation } from '../../../lib/firestore';

/**
 * DEBUG: Verificar datos de GOP GPT
 * GET /api/debug/gop-data
 */
export const GET: APIRoute = async () => {
  try {
    const GOP_ID = 'Pn6WPNxv8orckxX6xL4L';
    
    const gopData = await getConversation(GOP_ID);
    
    if (!gopData) {
      return new Response(JSON.stringify({ error: 'GOP not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      id: gopData.id,
      title: gopData.title,
      userId: gopData.userId,
      sharedWith: gopData.sharedWith || [],
      sharedWithCount: gopData.sharedWith?.length || 0,
      sharedWithStructure: gopData.sharedWith?.slice(0, 3) || [],
      tags: gopData.tags,
      status: gopData.status,
      certified: gopData.certified,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





