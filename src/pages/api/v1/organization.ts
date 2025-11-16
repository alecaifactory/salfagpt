/**
 * API Organization Management
 * 
 * GET   /api/v1/organization - Get organization info
 * PATCH /api/v1/organization - Update organization settings
 * 
 * Authentication: API key (Bearer token)
 */

import type { APIRoute } from 'astro';
import { validateAPIKey } from '../../../lib/api-management';
import { firestore } from '../../../lib/firestore';

// ============================================================================
// GET - Get organization info
// ============================================================================

export const GET: APIRoute = async ({ request }) => {
  try {
    // Authenticate
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Missing or invalid Authorization header', 401);
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    const validation = await validateAPIKey(apiKey);
    
    if (!validation.valid || !validation.organization) {
      return jsonError('Invalid API key', 401);
    }
    
    // Return organization (excluding sensitive data)
    const org = validation.organization;
    const safeOrg = {
      id: org.id,
      name: org.name,
      domain: org.domain,
      type: org.type,
      tier: org.tier,
      quotas: org.quotas,
      usage: org.usage,
      status: org.status,
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
    };
    
    return jsonSuccess(safeOrg);
    
  } catch (error) {
    console.error('❌ Error getting organization:', error);
    return jsonError('Failed to get organization', 500);
  }
};

// ============================================================================
// PATCH - Update organization settings
// ============================================================================

export const PATCH: APIRoute = async ({ request }) => {
  try {
    // Authenticate
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Missing or invalid Authorization header', 401);
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    const validation = await validateAPIKey(apiKey);
    
    if (!validation.valid || !validation.organization) {
      return jsonError('Invalid API key', 401);
    }
    
    // Check scope
    const scopes = validation.scopes || [];
    if (!scopes.includes('org:write')) {
      return jsonError('Insufficient scope - requires org:write', 403);
    }
    
    // Parse update
    const body = await request.json();
    const { webhookUrl, allowedIPs } = body;
    
    const updates: any = {
      updatedAt: new Date(),
    };
    
    if (webhookUrl !== undefined) {
      // Validate webhook URL
      if (webhookUrl && !isValidUrl(webhookUrl)) {
        return jsonError('Invalid webhook URL', 400);
      }
      updates.webhookUrl = webhookUrl;
      
      // Generate webhook secret if setting URL
      if (webhookUrl && !validation.organization.webhookSecret) {
        updates.webhookSecret = generateWebhookSecret();
      }
    }
    
    if (allowedIPs !== undefined) {
      // Validate IPs
      if (!Array.isArray(allowedIPs)) {
        return jsonError('allowedIPs must be an array', 400);
      }
      updates.allowedIPs = allowedIPs;
    }
    
    // Update organization
    await firestore
      .collection('api_organizations')
      .doc(validation.organization.id)
      .update(updates);
    
    console.log('✅ Organization updated:', validation.organization.id);
    
    // Return updated org
    const updatedOrg = await firestore
      .collection('api_organizations')
      .doc(validation.organization.id)
      .get();
    
    return jsonSuccess({
      ...updatedOrg.data(),
      id: updatedOrg.id,
    });
    
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    return jsonError('Failed to update organization', 500);
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function jsonSuccess(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: getErrorCode(status),
        message: message,
      },
    }, null, 2),
    {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function getErrorCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 500: return 'INTERNAL_ERROR';
    default: return 'ERROR';
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

