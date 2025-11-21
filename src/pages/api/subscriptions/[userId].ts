/**
 * Get User Subscription API
 * 
 * GET /api/subscriptions/[userId]
 * 
 * Returns user's current subscription details
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { getUserSubscription } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get userId from params
    const { userId } = params;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Verify ownership (users can only view their own subscription)
    if (session.id !== userId && session.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Get subscription
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      return new Response(JSON.stringify({ 
        error: 'No subscription found',
        message: 'Start your free trial to access the platform'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Return subscription
    return new Response(JSON.stringify({ subscription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to get subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


