/**
 * Create Support Ticket API
 * 
 * POST /api/tickets/create
 * 
 * Creates priority support ticket (max 5 per month per subscription)
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { createSupportTicket, getUserSubscription } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';
import { canCreateTicket } from '../../../types/subscriptions.js';

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

    // 2. Verify user has active subscription
    const subscription = await getUserSubscription(session.id);
    
    if (!subscription) {
      return new Response(JSON.stringify({ 
        error: 'No subscription found',
        message: 'You need an active subscription to create support tickets'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Check if user can create more tickets
    if (!canCreateTicket(subscription)) {
      return new Response(JSON.stringify({ 
        error: 'Ticket limit reached',
        message: `You've used all ${subscription.features.priorityTickets} priority tickets this month. Resets on ${subscription.nextBillingDate.toLocaleDateString()}`
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Parse request
    const body = await request.json();
    const { subject, description, category, priority } = body;

    if (!subject || !description) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'Subject and description are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Create ticket
    const ticket = await createSupportTicket(
      session.id,
      session.email,
      subscription.id,
      {
        subject,
        description,
        category: category || 'use-case',
        priority: priority || 'normal',
      }
    );

    // 6. Return ticket
    return new Response(JSON.stringify({
      ticket,
      message: `Ticket ${ticket.ticketNumber} created. We'll respond within 24 hours.`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating support ticket:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create support ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

