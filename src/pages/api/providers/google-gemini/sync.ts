/**
 * API: Sync Google Gemini Provider Pricing
 * 
 * POST /api/providers/google-gemini/sync
 * Updates provider pricing in Firestore with latest data
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore } from '../../../../lib/firestore';
import { DEFAULT_PROVIDER } from '../../../../config/providers';
import type { Provider } from '../../../../types/providers';

export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verify admin access
    // TODO: Add proper role-based access control
    
    // 3. Parse request body
    const body = await context.request.json();
    const { userId, source = 'manual' } = body;

    // 4. Create updated provider object
    const provider: Provider = {
      ...DEFAULT_PROVIDER,
      lastSyncedAt: new Date(),
      syncedBy: userId,
      source: source as 'manual' | 'automatic',
      updatedAt: new Date(),
    };

    // 5. Save to Firestore
    try {
      await firestore
        .collection('providers')
        .doc('google-gemini')
        .set(
          {
            id: provider.id,
            name: provider.name,
            displayName: provider.displayName,
            description: provider.description,
            website: provider.website,
            models: provider.models,
            lastSyncedAt: new Date(),
            syncedBy: userId,
            source: source,
            isActive: provider.isActive,
            createdAt: provider.createdAt,
            updatedAt: new Date(),
          },
          { merge: true }
        );

      console.log('✅ Provider pricing synced to Firestore by:', userId);

      // 6. Return updated provider
      return new Response(JSON.stringify(provider), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (firestoreError) {
      console.error('Failed to sync to Firestore:', firestoreError);
      console.warn('💡 Returning in-memory provider data');
      
      // Return the provider data even if Firestore fails
      return new Response(JSON.stringify({
        ...provider,
        warning: 'Synced in-memory but failed to persist to Firestore. Check Firestore connection.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in POST /api/providers/google-gemini/sync:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
