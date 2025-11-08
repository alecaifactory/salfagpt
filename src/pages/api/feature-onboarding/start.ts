// Start Feature Tutorial API
// POST: Mark tutorial as started

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { startTutorial } from '../../../lib/feature-onboarding';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { featureId } = await request.json();
    
    if (!featureId) {
      return new Response(
        JSON.stringify({ error: 'featureId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await startTutorial(session.id, featureId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Start tutorial error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start tutorial' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

