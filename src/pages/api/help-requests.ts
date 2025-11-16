/**
 * Help Request API
 * 
 * POST /api/help-requests - Create help request
 * GET  /api/help-requests - List help requests
 * 
 * Integrates with:
 * - Admin notifications (email + dashboard)
 * - Ally AI assistant (contextual help)
 * - Stella ticketing system (formal support)
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { firestore } from '../../lib/firestore';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    const body = await request.json();
    const { type, message, context, workflowId } = body;
    
    if (!type || !message) {
      return jsonError('Missing required fields: type, message', 400);
    }
    
    const validTypes = ['admin', 'ally', 'stella'];
    if (!validTypes.includes(type)) {
      return jsonError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    
    // Create help request
    const helpRequest = {
      userId: session.id,
      userEmail: session.email,
      type: type,
      message: message,
      context: context || {},
      workflowId: workflowId,
      status: 'open',
      createdAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      source: getEnvironmentSource(),
    };
    
    const docRef = await firestore
      .collection('help_requests')
      .add(helpRequest);
    
    // Route to appropriate system
    switch (type) {
      case 'admin':
        await notifyAdmin(session.id, session.email, message, context);
        break;
      
      case 'ally':
        await createAllyConversation(session.id, message, context);
        break;
      
      case 'stella':
        await createStellaTicket(session.id, session.email, message, context);
        break;
    }
    
    console.log(`✅ Help request created: ${type} for user ${session.email}`);
    
    return jsonSuccess({
      id: docRef.id,
      ...helpRequest,
      message: getSuccessMessage(type),
    }, 201);
    
  } catch (error) {
    console.error('❌ Error creating help request:', error);
    return jsonError('Failed to create help request', 500);
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    // Get user's help requests
    const snapshot = await firestore
      .collection('help_requests')
      .where('userId', '==', session.id)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return jsonSuccess({ requests });
    
  } catch (error) {
    console.error('❌ Error fetching help requests:', error);
    return jsonError('Failed to fetch help requests', 500);
  }
};

// ============================================================================
// INTEGRATION FUNCTIONS
// ============================================================================

async function notifyAdmin(userId: string, userEmail: string, message: string, context: any) {
  // Send email to admin (alec@getaifactory.com)
  // Create notification in admin dashboard
  
  await firestore.collection('admin_notifications').add({
    type: 'help_request',
    userId: userId,
    userEmail: userEmail,
    message: message,
    context: context,
    read: false,
    createdAt: new Date(),
  });
  
  console.log('📧 Admin notification created');
}

async function createAllyConversation(userId: string, message: string, context: any) {
  // Create conversation with Ally AI assistant
  
  await firestore.collection('ally_conversations').add({
    userId: userId,
    conversationType: 'help_request',
    initialMessage: message,
    context: context,
    status: 'active',
    createdAt: new Date(),
  });
  
  console.log('🤖 Ally conversation created');
}

async function createStellaTicket(userId: string, userEmail: string, message: string, context: any) {
  // Create formal support ticket in Stella system
  
  await firestore.collection('feedback_tickets').add({
    reportedBy: userId,
    reportedByEmail: userEmail,
    type: 'help_request',
    category: 'api_support',
    description: message,
    context: context,
    status: 'open',
    priority: 'medium',
    createdAt: new Date(),
  });
  
  console.log('🎫 Stella ticket created');
}

// ============================================================================
// HELPERS
// ============================================================================

function getSuccessMessage(type: string): string {
  switch (type) {
    case 'admin':
      return 'Admin has been notified and will respond within 24 hours';
    case 'ally':
      return 'Ally is ready to assist you. Check your chat.';
    case 'stella':
      return 'Support ticket created. We\'ll respond within 48 hours.';
    default:
      return 'Help request submitted successfully';
  }
}

function jsonSuccess(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }, null, 2),
    {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  return isDevelopment ? 'localhost' : 'production';
}

