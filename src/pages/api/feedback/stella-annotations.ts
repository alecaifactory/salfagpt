/**
 * 🔒 CONFIDENTIAL - Stella Annotations API
 * 
 * Handles Stella marker feedback submissions with ticket generation
 * and shareable card creation.
 * 
 * DO NOT SHARE - Proprietary competitive advantage
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import type { FeedbackTicket } from '../../../types/feedback';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      userId, 
      companyId, 
      position, 
      elementPath, 
      feedback, 
      pageUrl,
      viewport 
    } = body;
    
    // Validate required fields
    if (!userId || !companyId || !feedback || !pageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate ticket ID (format: FEAT-XXXX, BUG-XXXX, etc.)
    const ticketId = await generateTicketId(companyId, 'FEAT');
    
    // Determine type from feedback content (simple heuristic)
    const sessionType = detectFeedbackType(feedback);
    
    // Create feedback session first
    const sessionData = {
      userId,
      companyId,
      sessionType,
      status: 'submitted' as const,
      priority: 'medium' as const,
      title: feedback.substring(0, 100), // First 100 chars as title
      description: feedback,
      messages: [
        {
          id: `msg-${Date.now()}-user`,
          role: 'user' as const,
          content: feedback,
          timestamp: new Date(),
          metadata: {
            elementPath,
            position,
            pageUrl,
          },
        },
      ],
      screenshots: [],
      annotations: [
        {
          id: `annotation-${Date.now()}`,
          type: 'stella-marker' as const,
          position,
          color: '#a855f7', // Purple (Stella default)
          pageUrl,
          elementPath,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const sessionRef = await firestore.collection('feedback_sessions').add(sessionData);
    
    // Create ticket
    const ticketData: Omit<FeedbackTicket, 'id'> = {
      sessionId: sessionRef.id,
      userId,
      companyId,
      ticketId,
      type: sessionType,
      title: feedback.substring(0, 100),
      status: 'submitted',
      priority: 'medium',
      
      // Social features
      upvotes: 0,
      upvotedBy: [],
      views: 0,
      viewedBy: [],
      shares: 0,
      sharedBy: [],
      shareChain: [],
      viralCoefficient: 0,
      
      // Privacy
      isPublic: false,
      requiresAuth: true,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const ticketRef = await firestore.collection('feedback_tickets').add(ticketData);
    
    // Generate shareable card
    const shareCard = await generateShareCard(ticketRef.id, ticketId);
    
    console.log('✅ Stella feedback submitted:', ticketId);
    
    // Track in analytics (non-blocking)
    trackStellaSubmission({
      ticketId,
      userId,
      companyId,
      type: sessionType,
      feedbackLength: feedback.length,
      hasAnnotation: true,
    }).catch(err => console.warn('Analytics tracking failed:', err));
    
    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        sessionId: sessionRef.id,
        shareUrl: shareCard.shareUrl,
        shareCard,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error submitting Stella feedback:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Helper: Generate unique ticket ID
async function generateTicketId(companyId: string, prefix: string): Promise<string> {
  // Get current counter for company
  const counterRef = firestore
    .collection('ticket_counters')
    .doc(`${companyId}-${prefix}`);
  
  const counterDoc = await counterRef.get();
  const currentCount = counterDoc.exists ? counterDoc.data()?.count || 0 : 0;
  const nextCount = currentCount + 1;
  
  // Update counter
  await counterRef.set({ count: nextCount, updatedAt: new Date() });
  
  // Format: FEAT-0001, FEAT-0002, etc.
  return `${prefix}-${String(nextCount).padStart(4, '0')}`;
}

// Helper: Detect feedback type from content
function detectFeedbackType(feedback: string): string {
  const lowerFeedback = feedback.toLowerCase();
  
  // Bug keywords
  const bugKeywords = ['error', 'bug', 'broken', 'crash', 'no funciona', 'falla'];
  if (bugKeywords.some(keyword => lowerFeedback.includes(keyword))) {
    return 'bug_report';
  }
  
  // UI keywords
  const uiKeywords = ['confuso', 'confusing', 'unclear', 'button', 'color', 'layout'];
  if (uiKeywords.some(keyword => lowerFeedback.includes(keyword))) {
    return 'ui_improvement';
  }
  
  // Feature keywords
  const featureKeywords = ['necesito', 'need', 'want', 'would be great', 'suggestion'];
  if (featureKeywords.some(keyword => lowerFeedback.includes(keyword))) {
    return 'feature_request';
  }
  
  // Default
  return 'general_feedback';
}

// Helper: Generate share card
async function generateShareCard(firestoreId: string, ticketId: string) {
  const ticket = await firestore.collection('feedback_tickets').doc(firestoreId).get();
  const data = ticket.data();
  
  if (!data) {
    throw new Error('Ticket not found');
  }
  
  // Generate tracking token
  const trackingToken = createTrackingToken({
    ticketId,
    sharedBy: data.userId,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  });
  
  const shareUrl = `https://flow.ai/t/${ticketId}?ref=${trackingToken}`;
  
  // Get user and company for anonymization
  const user = await getUser(data.userId);
  const company = await getCompany(data.companyId);
  
  return {
    ticketId,
    shareUrl,
    preview: {
      emoji: getEmojiForType(data.type),
      type: formatType(data.type),
      createdBy: anonymizeUser(user),
      company: company?.name || 'Your Company',
      upvotes: data.upvotes || 0,
      timeAgo: 'just now',
    },
  };
}

// Helper: Create tracking token
function createTrackingToken(data: any): string {
  // Simple encoding for now (use JWT in production)
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function anonymizeUser(user: any): string {
  const dept = user?.department || 'Your';
  return `User from ${dept} Team`;
}

function getEmojiForType(type: string): string {
  const emojis: Record<string, string> = {
    'feature_request': '🚀',
    'bug_report': '🐛',
    'ui_improvement': '🎨',
    'general_feedback': '💬',
  };
  return emojis[type] || '📝';
}

function formatType(type: string): string {
  const formatted: Record<string, string> = {
    'feature_request': 'Feature Request',
    'bug_report': 'Bug Report',
    'ui_improvement': 'UI Improvement',
    'general_feedback': 'General Feedback',
  };
  return formatted[type] || type;
}

// Helper: Get user
async function getUser(userId: string) {
  const doc = await firestore.collection('users').doc(userId).get();
  return doc.exists ? doc.data() : null;
}

// Helper: Get company
async function getCompany(companyId: string) {
  const doc = await firestore.collection('companies').doc(companyId).get();
  return doc.exists ? doc.data() : null;
}

// Helper: Track analytics
async function trackStellaSubmission(data: any) {
  // Non-blocking analytics tracking
  console.log('📊 Tracking Stella submission:', data);
  // TODO: Implement BigQuery tracking
}

