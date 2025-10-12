import type { APIRoute } from 'astro';
import {
  createContextAccessRule,
  getAccessRulesForContext,
  getAccessRulesForUser,
  checkUserAccess,
  updateContextAccessRule,
  revokeContextAccessRule,
  getAllContextAccessRules,
  cleanupExpiredRules,
} from '../../lib/firestore-context-access';

// GET /api/access-rules - Get access rules
// POST /api/access-rules - Create a new access rule
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const contextId = url.searchParams.get('contextId');
    const userId = url.searchParams.get('userId');
    const checkAccess = url.searchParams.get('checkAccess');
    const permission = url.searchParams.get('permission') as 'canView' | 'canEdit' | 'canShare' | 'canDelete' | null;

    // Check specific permission
    if (checkAccess && userId && contextId && permission) {
      const hasAccess = await checkUserAccess(userId, contextId, permission);
      
      return new Response(
        JSON.stringify({ hasAccess }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get rules for specific context
    if (contextId) {
      const rules = await getAccessRulesForContext(contextId);
      
      return new Response(
        JSON.stringify({ rules }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get rules for specific user
    if (userId) {
      const rules = await getAccessRulesForUser(userId);
      
      return new Response(
        JSON.stringify({ rules }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all rules (admin only)
    const rules = await getAllContextAccessRules();

    return new Response(
      JSON.stringify({ rules }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error fetching access rules:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch access rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      contextId,
      contextName,
      targetType,
      targetId,
      targetName,
      permissions,
      createdBy,
      expiresAt,
      duration,
    } = body;

    // Validation
    if (!contextId || !contextName || !targetType || !targetId || !targetName || !permissions || !createdBy) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['contextId', 'contextName', 'targetType', 'targetId', 'targetName', 'permissions', 'createdBy'],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate target type
    if (targetType !== 'user' && targetType !== 'group') {
      return new Response(
        JSON.stringify({ error: 'targetType must be "user" or "group"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse expiration date if provided
    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;

    // Create access rule
    const rule = await createContextAccessRule(
      contextId,
      contextName,
      targetType,
      targetId,
      targetName,
      permissions,
      createdBy,
      expirationDate,
      duration
    );

    return new Response(
      JSON.stringify({ rule }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error creating access rule:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create access rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/access-rules - Update an access rule
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    if (!ruleId || !updates) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ruleId, updates' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse expiration date if in updates
    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }

    await updateContextAccessRule(ruleId, updates);

    return new Response(
      JSON.stringify({ success: true, message: 'Access rule updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error updating access rule:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update access rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/access-rules - Revoke an access rule
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const ruleId = url.searchParams.get('id');
    const cleanup = url.searchParams.get('cleanup');

    // Cleanup expired rules (admin action)
    if (cleanup === 'true') {
      const count = await cleanupExpiredRules();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Cleaned up ${count} expired access rules`,
          count,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ruleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await revokeContextAccessRule(ruleId);

    return new Response(
      JSON.stringify({ success: true, message: 'Access rule revoked successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error revoking access rule:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to revoke access rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

