import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getCheckpointInfo } from '../../../lib/extraction-checkpoint';

export const GET: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please login' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get parameters
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const fileName = url.searchParams.get('fileName');

    if (!userId || !fileName) {
      return new Response(JSON.stringify({ 
        error: 'Missing userId or fileName' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden - Cannot check other user checkpoints' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Get checkpoint info
    const checkpointInfo = await getCheckpointInfo(userId, fileName);

    if (!checkpointInfo) {
      return new Response(JSON.stringify({ 
        exists: false,
        resumable: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(checkpointInfo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error checking for checkpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

