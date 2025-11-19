/**
 * Stripe Customer Portal API
 * 
 * POST /api/stripe/portal
 * 
 * Creates Stripe Customer Portal session
 * Allows users to manage billing, update payment method, cancel subscription
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { createPortalSession } from '../../../lib/stripe.js';
import { getSession } from '../../../lib/auth.js';
import { getUserSubscription } from '../../../lib/subscriptions.js';

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

    // 2. Get user's subscription
    const subscription = await getUserSubscription(session.id);
    
    if (!subscription || !subscription.stripeCustomerId) {
      return new Response(JSON.stringify({ 
        error: 'No subscription found',
        message: 'You need an active subscription to access the billing portal'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Create portal session
    const portalUrl = await createPortalSession(subscription.stripeCustomerId);

    // 4. Return portal URL
    return new Response(JSON.stringify({ 
      url: portalUrl,
      message: 'Redirecting to billing portal...'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating portal session:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

