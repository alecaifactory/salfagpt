import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';
import type { DocumentAnnotation } from '../../../types/collaboration';

/**
 * GET /api/annotations
 * List annotations for a document
 * 
 * Query params:
 * - sourceId: Document ID
 * - userId: User ID
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const sourceId = url.searchParams.get('sourceId');
    const userId = url.searchParams.get('userId');

    if (!sourceId || !userId) {
      return new Response(JSON.stringify({ error: 'sourceId and userId required' }), { status: 400 });
    }

    // 2. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 3. Get annotations for this document
    const snapshot = await firestore
      .collection('document_annotations')
      .where('sourceId', '==', sourceId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const annotations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    }));

    return new Response(JSON.stringify({ annotations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error loading annotations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

/**
 * POST /api/annotations
 * Create a new annotation
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { annotation, userId } = body;

    if (!annotation || !userId) {
      return new Response(JSON.stringify({ error: 'annotation and userId required' }), { status: 400 });
    }

    // 2. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 3. Create annotation in Firestore
    const annotationRef = firestore.collection('document_annotations').doc();
    
    const annotationData = {
      ...annotation,
      id: annotationRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await annotationRef.set(annotationData);

    console.log('✅ Annotation created:', annotationRef.id);

    return new Response(JSON.stringify({ 
      success: true,
      annotation: {
        ...annotationData,
        createdAt: annotationData.createdAt.toISOString(),
        updatedAt: annotationData.updatedAt.toISOString(),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating annotation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};


