/**
 * API Key Creation Endpoint
 * 
 * Purpose: Generate API keys for third-party integrations
 * Created: 2025-11-17
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import crypto from 'crypto';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request
    const body = await request.json();
    const { name, scopes = ['extract:read', 'extract:write'], rateLimit = 1000 } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'API key name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Generate API key
    const apiKey = generateAPIKey();
    const apiKeyHash = hashAPIKey(apiKey);

    // 4. Store in Firestore
    const keyDoc = await firestore.collection('api_keys').add({
      userId: session.id,
      name,
      keyHash: apiKeyHash,
      scopes,
      rateLimit,
      usageCount: 0,
      createdAt: new Date(),
      lastUsedAt: null,
      isActive: true,
    });

    console.log('✅ API key created:', {
      id: keyDoc.id,
      userId: session.id,
      name,
    });

    // 5. Return key (only shown once)
    return new Response(JSON.stringify({
      apiKey, // ⚠️ Only returned once - user must save it
      keyId: keyDoc.id,
      name,
      scopes,
      rateLimit,
      createdAt: new Date().toISOString(),
      warning: 'Save this key securely - it will not be shown again',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating API key:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create API key',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Generate cryptographically secure API key
 */
function generateAPIKey(): string {
  const randomBytes = crypto.randomBytes(32);
  const hex = randomBytes.toString('hex');
  return `flow_api_${hex}`;
}

/**
 * Hash API key for secure storage
 */
function hashAPIKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Verify API key (for use in protected endpoints)
 */
export async function verifyAPIKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  scopes?: string[];
}> {
  try {
    const keyHash = hashAPIKey(apiKey);
    
    const snapshot = await firestore
      .collection('api_keys')
      .where('keyHash', '==', keyHash)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false };
    }

    const keyData = snapshot.docs[0].data();
    
    // Update last used
    await snapshot.docs[0].ref.update({
      lastUsedAt: new Date(),
      usageCount: (keyData.usageCount || 0) + 1,
    });

    return {
      valid: true,
      userId: keyData.userId,
      scopes: keyData.scopes || [],
    };

  } catch (error) {
    console.error('Error verifying API key:', error);
    return { valid: false };
  }
}

