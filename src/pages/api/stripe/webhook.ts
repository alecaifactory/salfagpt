/**
 * Stripe Webhook Handler
 * 
 * POST /api/stripe/webhook
 * 
 * Processes Stripe events (subscriptions, payments)
 * 
 * CRITICAL: This endpoint must NOT require authentication
 * (Stripe sends webhooks, not authenticated users)
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { handleWebhook } from '../../../lib/stripe.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature in request');
      return new Response('No signature', { status: 400 });
    }

    // 2. Process webhook
    await handleWebhook(body, signature);

    // 3. Return success (Stripe expects 200)
    return new Response('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Return 400 to tell Stripe this webhook failed
    return new Response('Webhook Error', { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};


