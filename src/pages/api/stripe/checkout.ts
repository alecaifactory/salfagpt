/**
 * Stripe Checkout API
 * 
 * POST /api/stripe/checkout
 * 
 * Creates Stripe Checkout session for subscription
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { createCheckoutSession } from '../../../lib/stripe.js';
import { getSession } from '../../../lib/auth.js';
import { getUserSubscription } from '../../../lib/subscriptions.js';
import { isSubscriptionActive } from '../../../types/subscriptions.js';

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

    // 2. Check if user already has active subscription
    const subscription = await getUserSubscription(session.id);
    
    if (subscription && isSubscriptionActive(subscription) && !subscription.isTrialPeriod) {
      return new Response(JSON.stringify({ 
        error: 'Already subscribed',
        message: 'You already have an active subscription'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Parse request
    const body = await request.json();
    const { billingCycle = 'monthly', currency = 'USD' } = body;

    // 4. Create checkout session
    const checkoutUrl = await createCheckoutSession(
      session.id,
      session.email,
      billingCycle,
      currency
    );

    // 5. Return checkout URL
    return new Response(JSON.stringify({ 
      url: checkoutUrl,
      message: 'Redirecting to Stripe Checkout...'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

