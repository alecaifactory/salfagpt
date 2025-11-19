/**
 * Create Subscription API
 * 
 * POST /api/subscriptions/create
 * 
 * Creates new subscription for user (starts with 14-day trial)
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { createSubscription } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request
    const body = await request.json();
    const { 
      billingCycle = 'monthly',
      currency = 'USD',
      organizationId = 'latamlab-ai'
    } = body;

    // 3. Create subscription
    const subscription = await createSubscription(
      session.id,
      session.email,
      organizationId,
      billingCycle,
      currency
    );

    // 4. Return subscription
    return new Response(JSON.stringify({
      subscription,
      message: `Trial started! You have 14 days to explore the platform.`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

