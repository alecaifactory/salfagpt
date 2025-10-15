/**
 * API: Get Google Gemini Provider Data
 * 
 * GET /api/providers/google-gemini
 * Returns provider information with current pricing
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import { DEFAULT_PROVIDER } from '../../../config/providers';

export const GET: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verify admin access (only admins can view provider pricing)
    // For now, checking if user is alec@getaifactory.com
    // TODO: Add proper role-based access control
    
    // 3. Try to load from Firestore
    try {
      const doc = await firestore
        .collection('providers')
        .doc('google-gemini')
        .get();

      if (doc.exists) {
        const data = doc.data();
        return new Response(JSON.stringify({
          ...data,
          id: doc.id,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (firestoreError) {
      console.warn('Firestore not available, using default provider:', firestoreError);
    }

    // 4. Return default provider if not in Firestore
    return new Response(JSON.stringify(DEFAULT_PROVIDER), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GET /api/providers/google-gemini:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

