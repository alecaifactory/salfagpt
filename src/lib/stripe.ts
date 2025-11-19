/**
 * Stripe Payment Integration
 * 
 * Handles:
 * - Checkout session creation
 * - Webhook processing
 * - Subscription management
 * - Customer portal
 * 
 * Created: 2025-11-18
 */

import Stripe from 'stripe';
import { firestore, COLLECTIONS } from './firestore.js';
import { convertTrialToPaid, resetMonthlyUsage } from './subscriptions.js';

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeKey && process.env.NODE_ENV === 'production') {
  console.error('❌ STRIPE_SECRET_KEY not configured!');
}

export const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia'
    })
  : null;

/**
 * ========================================
 * CHECKOUT
 * ========================================
 */

/**
 * Create Stripe Checkout session
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  billingCycle: 'monthly' | 'annual' = 'monthly',
  currency: 'USD' | 'CLP' = 'USD'
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    // Get price ID from environment
    const priceId = billingCycle === 'annual'
      ? (currency === 'USD' 
          ? process.env.STRIPE_PRICE_ANNUAL_USD 
          : process.env.STRIPE_PRICE_ANNUAL_CLP)
      : (currency === 'USD'
          ? process.env.STRIPE_PRICE_MONTHLY_USD
          : process.env.STRIPE_PRICE_MONTHLY_CLP);

    if (!priceId) {
      throw new Error(`Price ID not configured for ${billingCycle} ${currency}`);
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe/cancel`,
      metadata: {
        userId,
        organizationId: 'latamlab-ai',
        billingCycle,
        currency,
      },
      subscription_data: {
        metadata: {
          userId,
          organizationId: 'latamlab-ai',
        },
      },
    });

    console.log('✅ Checkout session created:', session.id);

    return session.url!;
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create customer portal session
 * Allows users to manage their subscription
 */
export async function createPortalSession(
  stripeCustomerId: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/settings/subscription`,
    });

    return session.url;
  } catch (error) {
    console.error('❌ Error creating portal session:', error);
    throw error;
  }
}

/**
 * ========================================
 * WEBHOOK HANDLING
 * ========================================
 */

/**
 * Main webhook handler
 */
export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('📨 Stripe webhook received:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log('ℹ️ Unhandled webhook event:', event.type);
    }

    console.log('✅ Webhook processed successfully');
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    throw error;
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('🎉 Subscription created:', subscription.id);

  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('❌ No userId in subscription metadata');
    return;
  }

  const customer = subscription.customer as string;

  // Find user's trial subscription
  const snapshot = await firestore
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('userId', '==', userId)
    .where('status', '==', 'trial')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('❌ No trial subscription found for user:', userId);
    return;
  }

  const subDoc = snapshot.docs[0];

  // Get payment method
  const paymentMethods = await stripe.paymentMethods.list({
    customer,
    type: 'card',
    limit: 1,
  });

  const last4 = paymentMethods.data[0]?.card?.last4 || 'Unknown';

  // Convert trial to paid
  await convertTrialToPaid(
    subDoc.id,
    customer,
    subscription.id,
    last4
  );

  console.log('✅ Trial converted to paid subscription');
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('🔄 Subscription updated:', subscription.id);

  const snapshot = await firestore
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('❌ Subscription not found:', subscription.id);
    return;
  }

  const subDoc = snapshot.docs[0];

  // Update status based on Stripe status
  const statusMap: Record<string, any> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'past_due',
  };

  await subDoc.ref.update({
    status: statusMap[subscription.status] || subscription.status,
    updatedAt: new Date(),
  });

  console.log('✅ Subscription status updated');
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('❌ Subscription deleted:', subscription.id);

  const snapshot = await firestore
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('❌ Subscription not found:', subscription.id);
    return;
  }

  const subDoc = snapshot.docs[0];
  const now = new Date();

  await subDoc.ref.update({
    status: 'canceled',
    canceledAt: now,
    expiresAt: now,
    updatedAt: now,
  });

  console.log('✅ Subscription marked as canceled');
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('💰 Payment succeeded:', invoice.id);

  const subscription = invoice.subscription as string;

  const snapshot = await firestore
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('stripeSubscriptionId', '==', subscription)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('❌ Subscription not found for invoice');
    return;
  }

  const subDoc = snapshot.docs[0];
  const periodEnd = new Date((invoice.lines.data[0].period.end) * 1000);

  // Reset monthly usage counters
  await resetMonthlyUsage(subDoc.id);

  // Update period dates
  await subDoc.ref.update({
    currentPeriodStart: new Date((invoice.lines.data[0].period.start) * 1000),
    currentPeriodEnd: periodEnd,
    nextBillingDate: periodEnd,
    updatedAt: new Date(),
  });

  console.log('✅ Payment processed, usage reset');
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('⚠️ Payment failed:', invoice.id);

  const subscription = invoice.subscription as string;

  const snapshot = await firestore
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('stripeSubscriptionId', '==', subscription)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error('❌ Subscription not found for invoice');
    return;
  }

  const subDoc = snapshot.docs[0];

  await subDoc.ref.update({
    status: 'past_due',
    updatedAt: new Date(),
  });

  console.log('✅ Subscription marked as past_due');

  // TODO: Send email notification to user
}

