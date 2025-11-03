/**
 * CLI Auth Verification Endpoint
 * 
 * Verifies API key and returns user information
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import crypto from 'crypto';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Extract API key from header
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Hash the API key to compare with stored hash
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
    
    // Query for API key in Firestore
    const apiKeysSnapshot = await firestore
      .collection('api_keys')
      .where('key', '==', hashedKey)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (apiKeysSnapshot.empty) {
      console.warn('🚨 Invalid API key attempt:', {
        keyPreview: apiKey.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const apiKeyDoc = apiKeysSnapshot.docs[0];
    const apiKeyData = apiKeyDoc.data();
    
    // Check if expired
    if (apiKeyData.expiresAt && apiKeyData.expiresAt.toDate() < new Date()) {
      console.warn('🚨 Expired API key used:', {
        keyId: apiKeyDoc.id,
        assignedTo: apiKeyData.assignedTo,
        expiredAt: apiKeyData.expiresAt.toDate().toISOString(),
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'API key expired',
          expiredAt: apiKeyData.expiresAt.toDate().toISOString(),
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update last used
    await firestore.collection('api_keys').doc(apiKeyDoc.id).update({
      lastUsedAt: new Date(),
      requestCount: (apiKeyData.requestCount || 0) + 1,
    });
    
    console.log('✅ API key verified:', {
      keyId: apiKeyDoc.id,
      assignedTo: apiKeyData.assignedTo,
      domain: apiKeyData.domain,
    });
    
    // Return user information
    return new Response(
      JSON.stringify({
        status: 'authenticated',
        user: {
          email: apiKeyData.assignedTo,
          domain: apiKeyData.domain,
          role: 'admin', // All API keys are for admins (SuperAdmin creates them)
          permissions: apiKeyData.permissions,
        },
        apiKey: {
          id: apiKeyDoc.id,
          name: apiKeyData.name,
          createdAt: apiKeyData.createdAt.toDate().toISOString(),
          expiresAt: apiKeyData.expiresAt?.toDate().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error verifying API key:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};








