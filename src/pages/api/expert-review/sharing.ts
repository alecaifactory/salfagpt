// Social Sharing API
// Created: 2025-11-09
// Purpose: Track social sharing events and get viral metrics

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { trackSocialSharing, getSharingActivity } from '../../../lib/expert-review/experience-tracking-service';

// POST /api/expert-review/sharing - Track a sharing event
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      userId,
      domainId,
      shareType,
      platform,
      recipientCount,
      context
    } = body;

    if (!userId || !domainId || !shareType || !platform || recipientCount === undefined) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user
    if (session.id !== userId && session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Track sharing
    await trackSocialSharing(
      userId,
      domainId,
      shareType,
      platform,
      recipientCount,
      context || {}
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Sharing tracked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error tracking sharing:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET /api/expert-review/sharing - Get sharing activity metrics
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');
    const periodDays = parseInt(url.searchParams.get('periodDays') || '30');

    if (!domainId) {
      return new Response(JSON.stringify({ error: 'Missing domainId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins can view full sharing activity
    if (session.role !== 'admin' && session.role !== 'expert') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const activity = await getSharingActivity(domainId, periodDays);

    return new Response(JSON.stringify(activity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error getting sharing activity:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

