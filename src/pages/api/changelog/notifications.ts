// Changelog Notifications API
// GET: Get user's notifications
// POST: Create notifications for new changelog entry
// PUT: Mark notification as read/dismissed

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getUserNotifications,
  markNotificationRead,
  markNotificationDismissed,
  createNotifications
} from '../../../lib/changelog';

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
    const onlyUnread = url.searchParams.get('unread') === 'true';

    const notifications = await getUserNotifications(session.id, onlyUnread);

    return new Response(JSON.stringify({ notifications }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
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

    // TODO: Check if user is admin/superadmin

    const { changelogEntryId, userIds } = await request.json();

    if (!changelogEntryId || !userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await createNotifications(changelogEntryId, userIds);

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Create notifications error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create notifications' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { notificationId, action } = await request.json();

    if (!notificationId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'read') {
      await markNotificationRead(notificationId);
    } else if (action === 'dismiss') {
      await markNotificationDismissed(notificationId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Update notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update notification' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};






