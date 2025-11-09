// CSAT Tracking API
// Created: 2025-11-09
// Purpose: Submit and retrieve CSAT ratings for experience validation

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { trackCSAT, getCSATSummary, triggerCSATSurvey } from '../../../lib/expert-review/experience-tracking-service';

// POST /api/expert-review/csat - Submit CSAT rating
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
      interactionId,
      experienceType,
      rating,
      comment,
      metadata 
    } = body;

    if (!userId || !domainId || !interactionId || !experienceType || !rating) {
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

    // Track CSAT
    await trackCSAT(
      userId,
      domainId,
      interactionId,
      experienceType,
      rating,
      comment,
      metadata
    );

    // Check if rating is low (<=2) - create follow-up ticket
    if (rating <= 2) {
      console.log('⚠️ Low CSAT rating - creating follow-up:', {
        userId,
        experienceType,
        rating
      });
      
      // TODO: Create follow-up ticket in feedback system
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'CSAT tracked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error tracking CSAT:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET /api/expert-review/csat - Get CSAT summary
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

    // Get CSAT summary
    const summary = await getCSATSummary(domainId, periodDays);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error getting CSAT summary:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

