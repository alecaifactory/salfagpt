// Export API for Expert Review
// Created: 2025-11-09
// Purpose: Export interactions and evaluations for reporting

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins and supervisors can export
    if (!['admin', 'superadmin', 'supervisor'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Export requires admin/supervisor role' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');
    const agentId = url.searchParams.get('agentId');
    const state = url.searchParams.get('state');
    const priority = url.searchParams.get('priority');

    // Build query
    let query = firestore.collection('message_feedback');

    // Filter by domain (admins are domain-scoped)
    if (session.role === 'admin' && domainId) {
      query = query.where('domain', '==', domainId) as any;
    } else if (session.role === 'supervisor' && agentId) {
      // Supervisors see only their assigned agents
      query = query.where('conversationId', '==', agentId) as any;
    }

    // Apply filters
    if (state) {
      query = query.where('status', '==', state) as any;
    }

    if (priority) {
      query = query.where('priority', '==', priority) as any;
    }

    // Execute query
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(1000) // Max 1000 for export
      .get();

    const interactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate() || new Date(),
        domain: data.domain,
        userEmail: data.userEmail,
        userQuery: data.messageContent?.userMessage || '',
        assistantResponse: data.messageContent?.assistantResponse || '',
        userStars: data.userStars,
        userComment: data.userComment,
        priority: data.priority,
        status: data.status || 'pending',
        feedbackType: data.feedbackType
      };
    });

    // Get evaluations for these interactions
    const interactionIds = interactions.map(i => i.id);
    const evaluations: any[] = [];

    if (interactionIds.length > 0) {
      // Query in chunks (Firestore 'in' limit = 10)
      const chunks = chunkArray(interactionIds, 10);

      for (const chunk of chunks) {
        const evalSnapshot = await firestore
          .collection('expert_evaluations')
          .where('feedbackId', 'in', chunk)
          .get();

        evalSnapshot.docs.forEach(doc => {
          const evalData = doc.data();
          evaluations.push({
            id: doc.id,
            feedbackId: evalData.feedbackId,
            evaluatedAt: evalData.evaluatedAt?.toDate() || new Date(),
            expertId: evalData.expertId,
            expertName: evalData.expertName,
            expertRating: evalData.expertRating,
            npsScore: evalData.npsScore,
            csatScore: evalData.csatScore,
            correctionType: evalData.correctionType,
            proposedCorrection: evalData.proposedCorrection,
            status: evalData.status,
            approvedBy: evalData.approvedBy,
            appliedAt: evalData.appliedAt?.toDate()
          });
        });
      }
    }

    return new Response(JSON.stringify({
      interactions,
      evaluations,
      exportedAt: new Date().toISOString(),
      exportedBy: session.email,
      filters: {
        domainId,
        agentId,
        state,
        priority
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
    return new Response(JSON.stringify({
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

