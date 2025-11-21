/**
 * Stella Submit Feedback API
 * 
 * Converts a Stella conversation into a feedback ticket.
 * 
 * Privacy Model:
 * - Each user's Stella conversations are private
 * - Feedback tickets are created with userId
 * - Backlog items visible only to Admin/SuperAdmin
 * - Regular users cannot see other users' feedback
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { userId, userEmail, userName, session: feedbackSession, pageContext } = body;
    
    // Verify user owns this session
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate ticket ID
    const ticketPrefix = feedbackSession.category === 'bug' ? 'BUG' :
                        feedbackSession.category === 'feature' ? 'FEAT' : 'IMP';
    const ticketId = await generateTicketId(ticketPrefix);
    
    // Create feedback_sessions document (PRIVATE to user)
    const sessionData = {
      userId,  // CRITICAL: User ownership
      sessionId: feedbackSession.id,
      category: feedbackSession.category,
      ticketId,
      messages: feedbackSession.messages,
      pageContext,
      status: 'submitted',
      createdAt: new Date(),
      submittedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const sessionRef = await firestore.collection('feedback_sessions').add(sessionData);
    
    // Create feedback_tickets document (PRIVATE to user)
    const ticketData = {
      userId,  // CRITICAL: User ownership
      userEmail,
      userName,
      sessionId: sessionRef.id,
      ticketId,
      category: feedbackSession.category,
      title: extractTitle(feedbackSession.messages),
      description: extractDescription(feedbackSession.messages),
      status: 'submitted',
      priority: 'medium',  // AI can suggest later
      attachments: extractAttachments(feedbackSession.messages),
      pageContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
    
    console.log('✅ Stella feedback submitted:', ticketId, 'by user:', userId);
    
    // Create notification for all admins/superadmins
    try {
      const adminsSnapshot = await firestore
        .collection('users')
        .where('role', 'in', ['admin', 'superadmin'])
        .get();
      
      const notificationPromises = adminsSnapshot.docs.map(adminDoc => {
        return firestore.collection('feedback_notifications').add({
          adminId: adminDoc.id,
          ticketId: ticketRef.id,
          ticketNumber: ticketId,
          category: feedbackSession.category,
          submittedBy: userId,
          submittedByEmail: userEmail,
          submittedByName: userName,
          title: ticketData.title,
          isRead: false,
          createdAt: new Date(),
          source: getEnvironmentSource(),
        });
      });
      
      await Promise.all(notificationPromises);
      console.log('🔔 Notifications sent to', adminsSnapshot.size, 'admins');
    } catch (error) {
      console.warn('⚠️ Failed to create notifications (non-critical):', error);
    }
    
    // ✅ ALWAYS create backlog item (for ALL users, not just admins)
    let kanbanCardUrl = undefined;
    
    try {
      const backlogItem = {
        title: extractTitle(feedbackSession.messages),
        description: extractDescription(feedbackSession.messages),
        type: feedbackSession.category === 'bug' ? 'bug' :
              feedbackSession.category === 'feature' ? 'feature' : 'improvement',
        priority: 'p2', // Medium by default, can be updated with impact assessment
        status: 'backlog',
        lane: 'backlog', // Roadmap lane
        category: feedbackSession.category,
        feedbackSource: 'stella-chat', // Renamed to avoid conflict with environment source
        stellaTicketId: ticketId,
        stellaSessionId: sessionRef.id,
        attachments: extractAttachments(feedbackSession.messages),
        impactAssessment: null, // Will be filled when user responds with metrics
        expedite: false, // Can be set to true for critical items
        metadata: {
          pageContext,
          messageCount: feedbackSession.messages.length,
          hasAttachments: extractAttachments(feedbackSession.messages).length > 0,
          submittedViaStella: true,
        },
        createdBy: userId,
        createdByEmail: userEmail,
        createdByName: userName,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: getEnvironmentSource(), // Environment source (localhost/production)
      };
      
      const backlogRef = await firestore.collection('backlog_items').add(backlogItem);
      kanbanCardUrl = `/roadmap#${backlogRef.id}`;
      
      console.log('📋 Backlog item created:', backlogRef.id, '| Ticket:', ticketId);
    } catch (error) {
      console.error('❌ Failed to create backlog item:', error);
      // Don't fail the whole request, but log the error
    }
    
    return new Response(JSON.stringify({
      success: true,
      ticketId,
      sessionId: sessionRef.id,
      ticketRef: ticketRef.id,
      kanbanCardUrl,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Stella submit feedback error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function generateTicketId(prefix: string): Promise<string> {
  const counterRef = firestore.collection('ticket_counters').doc(prefix);
  
  const counterDoc = await counterRef.get();
  const currentCount = counterDoc.exists ? counterDoc.data()?.count || 0 : 0;
  const nextCount = currentCount + 1;
  
  await counterRef.set({ count: nextCount, updatedAt: new Date() });
  
  return `${prefix}-${String(nextCount).padStart(4, '0')}`;
}

function extractTitle(messages: any[]): string {
  // Use first user message as title
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Feedback de Stella';
  
  const title = firstUserMessage.content.substring(0, 100);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
}

function extractDescription(messages: any[]): string {
  // Combine all user messages
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n\n');
  
  return userMessages || 'Sin descripción';
}

function extractAttachments(messages: any[]): any[] {
  const allAttachments: any[] = [];
  
  messages.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      allAttachments.push(...msg.attachments);
    }
  });
  
  return allAttachments;
}










