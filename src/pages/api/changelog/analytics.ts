// Changelog Analytics API
// GET: Get analytics for a changelog entry
// POST: Track feedback

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getChangelogAnalytics, updateChangelogFeedback } from '../../../lib/changelog';

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
    const changelogEntryId = url.searchParams.get('entryId');

    if (!changelogEntryId) {
      return new Response(
        JSON.stringify({ error: 'entryId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const analytics = await getChangelogAnalytics(changelogEntryId);

    return new Response(JSON.stringify({ analytics }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Get analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { changelogEntryId, helpful, feedbackText } = await request.json();

    if (!changelogEntryId || helpful === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateChangelogFeedback(
      changelogEntryId,
      session.id,
      helpful,
      feedbackText
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Update feedback error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};






