// NPS Tracking API
// Created: 2025-11-09
// Purpose: Submit and retrieve NPS scores with social sharing tracking

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { trackNPS, getNPSScore, getDetractorsNeedingFollowUp } from '../../../lib/expert-review/experience-tracking-service';

// POST /api/expert-review/nps - Submit NPS score
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
      userEmail,
      domainId, 
      score,
      reason,
      sharedWith 
    } = body;

    if (!userId || !userEmail || !domainId || score === undefined) {
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

    // Validate score range
    if (score < 0 || score > 10) {
      return new Response(JSON.stringify({ 
        error: 'Score must be between 0 and 10' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Track NPS
    await trackNPS(
      userId,
      userEmail,
      domainId,
      score,
      reason,
      sharedWith
    );

    // Return category for client
    const category = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';

    return new Response(JSON.stringify({ 
      success: true,
      category,
      message: category === 'promoter' 
        ? '🎉 ¡Gracias por ser un promotor!'
        : category === 'passive'
        ? 'Gracias por tu feedback'
        : 'Lamentamos la experiencia. Te contactaremos pronto.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error tracking NPS:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET /api/expert-review/nps - Get NPS score for domain
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
    const action = url.searchParams.get('action'); // 'score' or 'detractors'

    if (!domainId) {
      return new Response(JSON.stringify({ error: 'Missing domainId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'detractors') {
      // Get detractors needing follow-up (admin only)
      if (session.role !== 'admin' && session.role !== 'expert') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const detractors = await getDetractorsNeedingFollowUp(domainId);
      
      return new Response(JSON.stringify({ detractors }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get NPS score
    const npsData = await getNPSScore(domainId, periodDays);

    return new Response(JSON.stringify(npsData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error getting NPS:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

