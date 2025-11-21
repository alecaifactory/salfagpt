import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import type { ReferralNetwork } from '../../../types/collaboration';

/**
 * GET /api/referral-network
 * Get anonymized referral network data
 * 
 * Returns network graph for visualization
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Optional authentication - network is anonymized anyway
    const session = getSession({ cookies } as any);
    
    // Get all network nodes
    const snapshot = await firestore
      .collection('referral_network')
      .where('anonymousInGraph', '==', true)
      .get();

    const nodes = snapshot.docs.map(doc => {
      const data = doc.data() as ReferralNetwork;
      
      // Calculate position (simple tree layout)
      const depth = data.networkDepth || 0;
      const y = 100 + (depth * 120); // Vertical spacing by depth
      
      // Horizontal spacing (distribute evenly)
      const siblings = snapshot.docs.filter(d => 
        (d.data() as ReferralNetwork).networkDepth === depth
      ).length;
      const index = snapshot.docs
        .filter(d => (d.data() as ReferralNetwork).networkDepth === depth)
        .findIndex(d => d.id === doc.id);
      
      const x = (800 / (siblings + 1)) * (index + 1);
      
      return {
        id: data.hashedId,
        invitedBy: data.invitedBy,
        directReferrals: data.directReferrals,
        networkSize: data.networkSize,
        depth: data.networkDepth,
        status: data.status,
        x,
        y,
      };
    });

    // Calculate stats
    const stats = {
      totalUsers: nodes.length,
      activeUsers: nodes.filter(n => n.status === 'active' || n.status === 'premium').length,
      averageDepth: nodes.reduce((sum, n) => sum + n.depth, 0) / nodes.length || 0,
      largestNetwork: Math.max(...nodes.map(n => n.networkSize), 0),
    };

    return new Response(JSON.stringify({ 
      nodes,
      stats,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error loading referral network:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

/**
 * POST /api/referral-network/request-invitation
 * User requests an invitation to the platform
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, name, referredBy } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
    }

    // Check if already has invitation
    const existing = await firestore
      .collection('invitation_requests')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existing.empty) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Ya tienes una solicitud de invitación pendiente' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create invitation request
    const requestRef = firestore.collection('invitation_requests').doc();
    
    await requestRef.set({
      id: requestRef.id,
      email: email.toLowerCase(),
      name: name || '',
      referredBy: referredBy || null,
      status: 'pending',
      requestedAt: new Date(),
      source: 'collaboration_feature', // Where they found the button
    });

    console.log('✅ Invitation request created:', requestRef.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Solicitud de invitación enviada. Te contactaremos pronto.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating invitation request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};






