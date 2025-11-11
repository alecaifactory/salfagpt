import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  logAuditEntry,
  getAuditTrail
} from '../../../lib/expert-review/audit-service';

/**
 * Expert Review Audit API
 * 
 * POST /api/expert-review/audit - Log audit event
 * GET /api/expert-review/audit?userId={id} - Get audit log
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { userId, action, targetType, targetId, metadata, impact } = body;

    if (!userId || !action || !targetType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, action, targetType' }),
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEntry({
      userId,
      action: action as any,
      targetType: targetType as any,
      targetId,
      metadata,
      impact: impact as any,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error logging audit event:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to log audit event',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: userId' }),
        { status: 400 }
      );
    }

    // Get audit log
    const auditLog = await getAuditTrail(userId, limit);

    return new Response(
      JSON.stringify(auditLog),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error getting audit log:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get audit log',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

