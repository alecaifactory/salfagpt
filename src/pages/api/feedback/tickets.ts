/**
 * API Endpoint: Get Feedback Tickets
 * GET /api/feedback/tickets?companyId={companyId}
 * 
 * Returns all feedback tickets for the roadmap system
 * 
 * 🔒 Security: Only accessible by alec@getaifactory.com
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { verifyJWT } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const token = cookies.get('flow_session')?.value;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const session = verifyJWT(token);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🔐 [TICKETS] Session verified:', {
      userId: session.id?.substring(0, 10) + '...',
      email: session.email,
      role: session.role,
    });
    
    // 2. Get query parameters
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const requestedUserId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    console.log('🔍 [TICKETS] Query params:', {
      companyId,
      requestedUserId: requestedUserId?.substring(0, 10) + '...',
      limit,
      offset,
    });
    
    // 3. Privacy-aware loading based on user role
    let query: any = firestore.collection('feedback_tickets');
    
    // Admin OR SuperAdmin: Can see ALL tickets from ALL users/domains
    // ✅ CHANGE: Admins now see all feedback (not just their domain)
    if (session.role === 'admin' || session.email === 'alec@getaifactory.com') {
      console.log('✅ [TICKETS] Admin/SuperAdmin access - loading all tickets from all users');
      
      // Optional domain filter for organizing view
      if (companyId && companyId !== 'all') {
        console.log(`   Optional filtering by domain: ${companyId}`);
        query = query.where('userDomain', '==', companyId);
      } else {
        console.log('   Loading ALL tickets (no domain filter)');
      }
    }
    // Expert: Can see tickets from their domain only
    else if (session.role === 'expert') {
      const expertDomain = session.email.split('@')[1];
      console.log(`✅ [TICKETS] Expert access - loading tickets from domain: ${expertDomain}`);
      query = query.where('userDomain', '==', expertDomain);
    }
    // User: Can only see their own tickets
    else {
      console.log(`✅ [TICKETS] User access - loading own tickets only for: ${session.id}`);
      query = query.where('reportedBy', '==', session.id);
    }
    
    // 4. Load tickets with pagination
    const ticketsSnapshot = await query.limit(limit).get();
    
    // 5. Transform data with complete metadata
    const tickets = ticketsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        
        // Build ticket with all necessary fields for roadmap display
        return {
          id: doc.id,
          
          // Core fields
          feedbackId: data.feedbackId || '',
          messageId: data.messageId || '',
          conversationId: data.conversationId || '',
          ticketId: data.ticketId || doc.id,
          
          // Title & Description
          title: data.title || 'Sin título',
          description: data.description || '',
          category: data.category || 'other',
          
          // User info for display
          createdByName: data.reportedByName || data.createdBy || 'Usuario',
          createdByEmail: data.reportedByEmail || '',
          createdByRole: data.reportedByRole || 'user',
          companyDomain: data.userDomain || data.companyDomain || 'unknown',
          reportedBy: data.reportedBy || '',
          
          // Agent context
          agentId: data.agentId || '',
          agentName: data.agentName || 'General',
          
          // Feedback data
          originalFeedback: data.originalFeedback || {},
          
          // Visual context
          screenshot: data.originalFeedback?.screenshots?.[0]?.imageDataUrl || '',
          annotations: data.originalFeedback?.screenshots?.[0]?.annotations || [],
          
          // AI Analysis
          aiSummary: data.aiAnalysis?.summary || data.description || 'Pendiente análisis',
          aiAnalysis: data.aiAnalysis || {},
          
          // OKR/KPI alignment
          okrAlignment: data.okrAlignment || [],
          estimatedCSAT: data.estimatedCSAT || data.originalFeedback?.csatScore || 0,
          estimatedNPS: data.estimatedNPS || data.originalFeedback?.npsScore || 0,
          estimatedROI: data.estimatedROI || 0,
          customKPIs: data.customKPIs || [],
          
          // Roadmap state
          lane: data.lane || 'backlog',
          priority: data.priority || 'medium',
          status: data.status || 'new',
          estimatedEffort: data.estimatedEffort || 'm',
          userImpact: data.userImpact || 'medium',
          
          // Social features
          upvotes: data.upvotes || 0,
          upvotedBy: data.upvotedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          shares: data.shares || 0,
          sharedBy: data.sharedBy || [],
          
          // Timestamps
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
          assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate() : null,
          
          // Other
          assignedTo: data.assignedTo,
          source: data.source || 'production',
        };
      })
      .slice(offset, offset + limit); // Apply pagination offset
    
    // Sort by createdAt desc in memory
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`✅ Loaded ${tickets.length} feedback tickets (role: ${session.role}, domain: ${session.email.split('@')[1]})`);
    console.log('📊 Tickets by lane:', {
      backlog: tickets.filter(t => t.lane === 'backlog').length,
      roadmap: tickets.filter(t => t.lane === 'roadmap').length,
      in_development: tickets.filter(t => t.lane === 'in_development').length,
      expert_review: tickets.filter(t => t.lane === 'expert_review').length,
      production: tickets.filter(t => t.lane === 'production').length,
    });
    
    return new Response(
      JSON.stringify(tickets),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error loading feedback tickets:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load feedback tickets',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

