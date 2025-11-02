import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

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
        error: 'Forbidden - Cannot check other user data' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Query Firestore for duplicate
    const snapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('name', '==', fileName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return new Response(JSON.stringify({ 
        exists: false,
        source: null 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the existing source info
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const source = {
      id: doc.id,
      name: data.name,
      status: data.status,
      addedAt: data.addedAt?.toDate().toISOString(),
      metadata: {
        extractionDate: data.metadata?.extractionDate?.toDate().toISOString(),
        model: data.metadata?.model,
        extractionTime: data.metadata?.extractionTime,
      }
    };

    return new Response(JSON.stringify({ 
      exists: true,
      source 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error checking for duplicate:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

