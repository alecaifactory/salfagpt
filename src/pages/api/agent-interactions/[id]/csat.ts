/**
 * CSAT Rating API
 * 
 * POST /api/agent-interactions/:id/csat
 * 
 * Record user satisfaction rating for an interaction
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const interactionId = params.id;
    const body = await request.json();
    const { score, categories, comment } = body;

    if (!interactionId || !score) {
      return new Response(
        JSON.stringify({ error: 'interactionId and score are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate score
    if (![1, 2, 3, 4, 5].includes(score)) {
      return new Response(
        JSON.stringify({ error: 'Score must be 1-5' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update interaction with CSAT
    const interactionDoc = firestore.collection('agent_interactions').doc(interactionId);
    const doc = await interactionDoc.get();

    if (!doc.exists) {
      return new Response(
        JSON.stringify({ error: 'Interaction not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await interactionDoc.update({
      'csat.score': score,
      'csat.ratedAt': new Date(),
      'csat.comment': comment || null,
      'csat.categories': categories || null
    });

    console.log(`⭐ CSAT recorded: ${score}/5 for interaction ${interactionId}`);

    // Trigger optimization analysis if needed
    // (Future: analyze CSAT patterns and generate suggestions)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error recording CSAT:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to record CSAT',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

