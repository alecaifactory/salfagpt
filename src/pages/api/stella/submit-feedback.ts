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
    const { userId, session: feedbackSession, pageContext } = body;
    
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
    
    // If user is Admin or SuperAdmin, create backlog item
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userRole = userDoc.data()?.role || 'user';
    
    let kanbanCardUrl = undefined;
    
    if (userRole === 'admin' || userRole === 'superadmin' || 
        userId === '114671162830729001607') {  // SuperAdmin alec@getaifactory.com
      
      try {
        const backlogItem = {
          title: extractTitle(feedbackSession.messages),
          description: extractDescription(feedbackSession.messages),
          type: feedbackSession.category === 'bug' ? 'bug' :
                feedbackSession.category === 'feature' ? 'feature' : 'improvement',
          priority: 'medium',
          status: 'backlog',
          category: feedbackSession.category,
          source: 'stella-chat',
          stellaTicketId: ticketId,
          stellaSessionId: sessionRef.id,
          metadata: {
            pageContext,
            messageCount: feedbackSession.messages.length,
            hasAttachments: extractAttachments(feedbackSession.messages).length > 0,
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const backlogRef = await firestore.collection('backlog_items').add(backlogItem);
        kanbanCardUrl = `/roadmap#${backlogRef.id}`;
        
        console.log('📋 Kanban backlog item created for Admin/SuperAdmin');
      } catch (error) {
        console.warn('Failed to create Kanban item (non-critical):', error);
      }
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









