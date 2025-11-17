// Platform Notifications API
// GET: Get user notifications
// PUT: Mark as read/dismissed
// POST: Mark all as read

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAsDismissed,
  markAllAsRead
} from '../../../lib/notifications';

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
    const type = url.searchParams.get('type') || undefined;
    const countOnly = url.searchParams.get('count') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Return count only
    if (countOnly) {
      const count = await getUnreadCount(session.id);
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return full notifications
    const notifications = await getUserNotifications(session.id, {
      onlyUnread,
      type,
      limit
    });

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

    switch (action) {
      case 'read':
        await markAsRead(notificationId);
        break;
      case 'dismiss':
        await markAsDismissed(notificationId);
        break;
      default:
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { action } = await request.json();

    if (action === 'mark-all-read') {
      await markAllAsRead(session.id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Notification action error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to perform action' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



