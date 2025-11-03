/**
 * SuperAdmin API Key Management
 * 
 * CRUD operations for Flow API keys
 * Only accessible by SuperAdmins (alec@getaifactory.com)
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import crypto from 'crypto';

/**
 * Generate secure API key
 */
function generateAPIKey(): string {
  // Generate 32-byte random key, encode as base64
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash API key for storage
 */
function hashAPIKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * GET - List all API keys (SuperAdmin only)
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // 1. Verify SuperAdmin
    const session = getSession({ cookies });
    
    if (!session || session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized API key access attempt:', {
        email: session?.email,
        timestamp: new Date().toISOString(),
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Fetch all API keys
    const apiKeysSnapshot = await firestore
      .collection('api_keys')
      .orderBy('createdAt', 'desc')
      .get();
    
    const apiKeys = apiKeysSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      key: undefined, // Never return actual key
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate().toISOString(),
      lastUsedAt: doc.data().lastUsedAt?.toDate().toISOString(),
    }));
    
    return new Response(
      JSON.stringify({ apiKeys }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST - Create new API key (SuperAdmin only)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify SuperAdmin
    const session = getSession({ cookies });
    
    if (!session || session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Parse request
    const body = await request.json();
    const { 
      name,
      assignedTo,
      domain,
      expiresInDays,
      description,
    } = body;
    
    if (!name || !assignedTo || !domain) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['name', 'assignedTo', 'domain'],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Generate API key
    const apiKey = generateAPIKey();
    const hashedKey = hashAPIKey(apiKey);
    const keyPreview = apiKey.substring(apiKey.length - 8);
    
    // 4. Calculate expiration
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    // 5. Create API key document
    const apiKeyDoc = await firestore.collection('api_keys').add({
      name,
      key: hashedKey,
      keyPreview,
      createdBy: session.email,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      
      // Assignment
      assignedTo,
      domain,
      
      // Permissions (v0.1.0: Read-only)
      permissions: {
        canReadUsageStats: true,
        canReadDomainStats: false,  // Future
        canManageAgents: false,     // Future
        canManageContext: false,    // Future
      },
      
      // Usage tracking
      requestCount: 0,
      
      // Metadata
      description: description || '',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    });
    
    console.log('✅ API key created:', {
      id: apiKeyDoc.id,
      assignedTo,
      domain,
      expiresAt: expiresAt?.toISOString(),
    });
    
    // 6. Return the UNHASHED key (only time it's visible)
    return new Response(
      JSON.stringify({
        success: true,
        apiKey: {
          id: apiKeyDoc.id,
          key: apiKey, // ⚠️ ONLY time this is returned
          keyPreview,
          name,
          assignedTo,
          domain,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt?.toISOString(),
          permissions: {
            canReadUsageStats: true,
          },
        },
        warning: 'Save this API key securely. It will not be shown again.',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE - Revoke API key (SuperAdmin only)
 */
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify SuperAdmin
    const session = getSession({ cookies });
    
    if (!session || session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Parse request
    const body = await request.json();
    const { apiKeyId } = body;
    
    if (!apiKeyId) {
      return new Response(
        JSON.stringify({ error: 'Missing apiKeyId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Soft delete (mark as inactive)
    await firestore.collection('api_keys').doc(apiKeyId).update({
      isActive: false,
      revokedAt: new Date(),
      revokedBy: session.email,
    });
    
    console.log('✅ API key revoked:', apiKeyId);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error revoking API key:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};








