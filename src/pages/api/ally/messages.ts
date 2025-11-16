/**
 * Ally Messages API
 * 
 * GET /api/ally/messages?conversationId=xxx - List messages
 * POST /api/ally/messages - Send message to Ally
 */

import type { APIRoute } from 'astro';
import { getAllyMessages, sendAllyMessage, getAllyConversation } from '../../../lib/ally';
import { getUserFeatureFlags } from '../../../lib/feature-flags';
import { verifyJWT } from '../../../lib/auth';

/**
 * GET /api/ally/messages?conversationId=xxx
 * List messages in Ally conversation
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('📨 [API] GET /api/ally/messages');
    
    // 1. Verify authentication
    const session = verifyJWT(cookies.get('flow_session')?.value);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Check Ally beta access
    const featureFlags = await getUserFeatureFlags(session.id, session.email || '');
    if (!featureFlags.allyBetaAccess) {
      return new Response(JSON.stringify({ error: 'Ally beta access not granted' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Parse query params
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Missing conversationId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Verify conversation ownership
    const conversation = await getAllyConversation(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user is owner or collaborator
    const isOwner = conversation.userId === session.id;
    const isCollaborator = conversation.collaborators?.some(c => c.userId === session.id);
    
    if (!isOwner && !isCollaborator) {
      return new Response(JSON.stringify({ error: 'Forbidden - Not authorized to access this conversation' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 5. Get messages
    const messages = await getAllyMessages(conversationId);
    
    console.log(`  ✅ Loaded ${messages.length} messages`);
    
    return new Response(JSON.stringify({
      messages,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error in GET /api/ally/messages:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/ally/messages
 * Send message to Ally
 * 
 * Body:
 * - conversationId: string
 * - userId: string
 * - message: string
 * - contextInputs?: { organizationInfo, domainInfo, agentIds }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('📨 [API] POST /api/ally/messages');
    
    // 1. Verify authentication
    const session = verifyJWT(cookies.get('flow_session')?.value);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Check Ally beta access
    const featureFlags = await getUserFeatureFlags(session.id, session.email || '');
    if (!featureFlags.allyBetaAccess) {
      return new Response(JSON.stringify({ error: 'Ally beta access not granted' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Parse request body
    const body = await request.json();
    const { conversationId, userId, message, contextInputs } = body;
    
    // 4. Validate required fields
    if (!conversationId || !userId || !message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: conversationId, userId, message' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 5. Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 6. Verify conversation access
    const conversation = await getAllyConversation(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const isOwner = conversation.userId === session.id;
    const isCollaborator = conversation.collaborators?.some(c => c.userId === session.id);
    
    if (!isOwner && !isCollaborator) {
      return new Response(JSON.stringify({ error: 'Forbidden - Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 7. Send message to Ally
    const result = await sendAllyMessage(conversationId, userId, message, contextInputs);
    
    console.log(`  ✅ Message sent successfully`);
    
    return new Response(JSON.stringify({
      userMessage: result.userMessage,
      allyResponse: result.allyResponse,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error in POST /api/ally/messages:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

