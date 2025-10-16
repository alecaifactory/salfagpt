import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Loading setup document for agent:', agentId);

    const setupDocSnap = await firestore
      .collection('agent_setup_docs')
      .doc(agentId)
      .get();

    if (!setupDocSnap.exists) {
      console.log('ℹ️ No setup document found for agent:', agentId);
      return new Response(
        JSON.stringify({ 
          exists: false,
          agentId 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const setupDoc = setupDocSnap.data();
    
    // Convert Firestore Timestamps to ISO strings
    const serializedDoc = {
      ...setupDoc,
      uploadedAt: setupDoc?.uploadedAt?.toDate ? setupDoc.uploadedAt.toDate().toISOString() : null
    };

    console.log('✅ Setup document loaded:', {
      fileName: setupDoc?.fileName,
      examplesCount: setupDoc?.inputExamples?.length || 0
    });

    return new Response(
      JSON.stringify({
        exists: true,
        ...serializedDoc
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error loading setup document:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to load setup document',
        exists: false
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

