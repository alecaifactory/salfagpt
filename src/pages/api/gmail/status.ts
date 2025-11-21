import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

/**
 * GET /api/gmail/status
 * Check if user has Gmail connected
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
    }

    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Check Gmail connection
    const gmailDoc = await firestore
      .collection('gmail_connections')
      .doc(userId)
      .get();

    const connected = gmailDoc.exists && gmailDoc.data()?.isConnected === true;
    
    const connectionData = gmailDoc.exists ? {
      connected,
      connectedAt: gmailDoc.data()?.connectedAt?.toDate()?.toISOString(),
      lastUsedAt: gmailDoc.data()?.lastUsedAt?.toDate()?.toISOString(),
      expiresAt: gmailDoc.data()?.expiresAt?.toDate()?.toISOString(),
    } : {
      connected: false,
    };

    return new Response(JSON.stringify(connectionData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};






