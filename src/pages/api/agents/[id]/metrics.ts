/**
 * Agent Metrics API Endpoint
 * 
 * GET /api/agents/:id/metrics
 * 
 * Purpose: High-performance agent metrics retrieval
 * Target: <100ms response time (typically <50ms)
 * 
 * Security: Dual authentication (API Key + Session)
 * Caching: 3-layer (Browser → Edge → Firestore)
 * Integrity: Digital signature verification
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { verifyAPIKey, logAPIKeyUsage, hasPermission } from '../../../../lib/api-keys';
import { getAgentMetrics, needsRefresh, triggerMetricsUpdate } from '../../../../lib/agent-metrics-cache';
import { EdgeCache } from '../../../../lib/cache-manager';
import { verifyMetricsSignature } from '../../../../lib/signature';
import { firestore } from '../../../../lib/firestore';
import type { MetricsAPIResponse, AgentMetricsCache } from '../../../../types/metrics-cache';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const startTime = Date.now();
  const endpoint = '/api/agents/:id/metrics';
  
  // ============================================
  // STEP 1: DUAL AUTHENTICATION
  // ============================================
  
  // 1a. Verify session (user is logged in)
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'No active session'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 1b. Verify API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '') || '';
  
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Missing API key in Authorization header'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const keyVerification = await verifyAPIKey(apiKey);
  
  if (!keyVerification.isValid || !keyVerification.keyData) {
    // Log failed attempt
    await logAPIKeyUsage('unknown', {
      userId: session.id,
      endpoint,
      method: 'GET',
      statusCode: 401,
      responseTimeMs: Date.now() - startTime,
      fromCache: false,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      rateLimitHit: false
    });
    
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: keyVerification.reason || 'Invalid API key'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const keyData = keyVerification.keyData;
  
  // 1c. Check rate limit
  if (keyVerification.rateLimitRemaining === 0) {
    await logAPIKeyUsage(keyData.id, {
      userId: session.id,
      endpoint,
      method: 'GET',
      statusCode: 429,
      responseTimeMs: Date.now() - startTime,
      fromCache: false,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      rateLimitHit: true
    });
    
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Try again in ${keyVerification.rateLimitReset}`,
      rateLimitReset: keyVerification.rateLimitReset
    }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': '60' // 1 minute
      }
    });
  }
  
  // ============================================
  // STEP 2: VERIFY PERMISSIONS
  // ============================================
  
  // 2a. Check permission to read agent metrics
  if (!hasPermission(keyData, 'read:agent-metrics') && 
      !hasPermission(keyData, 'admin:all')) {
    await logAPIKeyUsage(keyData.id, {
      userId: session.id,
      endpoint,
      method: 'GET',
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
      fromCache: false,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      rateLimitHit: false
    });
    
    return new Response(JSON.stringify({
      error: 'Forbidden',
      message: 'API key does not have read:agent-metrics permission'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 2b. Verify access to this specific agent
  const { id: agentId } = params;
  
  if (!agentId) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: 'Agent ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check agent ownership/access
  const canAccess = await verifyAgentAccess(session.id, agentId, keyData);
  
  if (!canAccess) {
    await logAPIKeyUsage(keyData.id, {
      userId: session.id,
      endpoint,
      method: 'GET',
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
      fromCache: false,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      rateLimitHit: false
    });
    
    return new Response(JSON.stringify({
      error: 'Forbidden',
      message: 'No access to this agent'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // ============================================
  // STEP 3: GET FROM CACHE (3 LAYERS)
  // ============================================
  
  let metrics: AgentMetricsCache | null = null;
  let fromCache = false;
  let cacheLayer: 'edge' | 'database' | 'none' = 'none';
  
  // Try Layer 2: Edge cache (server-side)
  metrics = EdgeCache.get(agentId);
  if (metrics) {
    fromCache = true;
    cacheLayer = 'edge';
  }
  
  // Try Layer 3: Database (Firestore derived view)
  if (!metrics) {
    metrics = await getAgentMetrics(agentId, true); // With signature verification
    if (metrics) {
      // Populate edge cache for next request
      EdgeCache.set(agentId, metrics);
      fromCache = true;
      cacheLayer = 'database';
    }
  }
  
  // If no cache hit, return 404
  if (!metrics) {
    // Trigger background update
    triggerMetricsUpdate(agentId, 'manual_refresh');
    
    await logAPIKeyUsage(keyData.id, {
      userId: session.id,
      endpoint,
      method: 'GET',
      statusCode: 404,
      responseTimeMs: Date.now() - startTime,
      fromCache: false,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      rateLimitHit: false
    });
    
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Metrics not yet calculated. Please try again in a moment.'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // ============================================
  // STEP 4: VERIFY SIGNATURE & FRESHNESS
  // ============================================
  
  const verification = verifyMetricsSignature(metrics);
  
  if (!verification.isValid) {
    console.warn(`⚠️ Invalid signature for agent ${agentId}, triggering recalc`);
    triggerMetricsUpdate(agentId, 'manual_refresh');
  }
  
  // Check if refresh needed (stale data)
  if (needsRefresh(metrics, 5)) { // 5 minutes threshold
    console.log(`🔄 Stale metrics for ${agentId}, triggering background refresh`);
    triggerMetricsUpdate(agentId, 'scheduled_refresh');
    // Don't wait - return stale data with metadata indicating it's being refreshed
  }
  
  // ============================================
  // STEP 5: BUILD RESPONSE
  // ============================================
  
  const duration = Date.now() - startTime;
  
  const cacheAgeSeconds = metrics.lastUpdated 
    ? Math.round((Date.now() - (metrics.lastUpdated as any).toMillis()) / 1000)
    : 0;
  
  const response: MetricsAPIResponse<AgentMetricsCache> = {
    data: {
      ...metrics,
      // Convert Firestore Timestamps to ISO strings for JSON
      lastUpdated: (metrics.lastUpdated as any).toDate().toISOString(),
      lastMessageAt: (metrics.lastMessageAt as any).toDate().toISOString(),
      lastActivityAt: (metrics.lastActivityAt as any).toDate().toISOString(),
    } as any,
    metadata: {
      respondedIn: `${duration}ms`,
      fromCache,
      cacheAge: cacheAgeSeconds,
      verified: verification.isValid,
      version: metrics._version,
      timestamp: new Date().toISOString()
    }
  };
  
  // ============================================
  // STEP 6: LOG USAGE & RETURN
  // ============================================
  
  await logAPIKeyUsage(keyData.id, {
    userId: session.id,
    endpoint,
    method: 'GET',
    statusCode: 200,
    responseTimeMs: duration,
    fromCache,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    rateLimitHit: false
  });
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Response-Time': `${duration}ms`,
      'X-Cache-Layer': cacheLayer,
      'X-Cache-Age': `${cacheAgeSeconds}s`,
      'X-Signature-Verified': verification.isValid.toString(),
      'Cache-Control': 'private, max-age=300', // Browser can cache for 5 min
      'X-RateLimit-Remaining': keyVerification.rateLimitRemaining?.toString() || '0',
      'X-RateLimit-Reset': keyVerification.rateLimitReset?.toISOString() || ''
    }
  });
};

/**
 * Verify user has access to an agent
 * Checks: owner, admin, or shared access
 * 
 * @param userId - User making the request
 * @param agentId - Agent being accessed
 * @param keyData - API key data (for scope checking)
 * @returns True if access allowed
 */
async function verifyAgentAccess(
  userId: string,
  agentId: string,
  keyData: any
): Promise<boolean> {
  try {
    // Get agent document
    const agentDoc = await firestore
      .collection('conversations')
      .doc(agentId)
      .get();
    
    if (!agentDoc.exists) {
      return false;
    }
    
    const agentData = agentDoc.data();
    
    // Check if user is owner
    if (agentData?.userId === userId) {
      return true;
    }
    
    // Check if admin:all permission
    if (keyData.permissions?.includes('admin:all')) {
      return true;
    }
    
    // Check if shared with user
    if (agentData?.sharedWith) {
      const hasAccess = agentData.sharedWith.some((share: any) => 
        share.type === 'user' && share.id === userId
      );
      if (hasAccess) return true;
    }
    
    // Check if API key is scoped to this agent
    if (keyData.agentIds && keyData.agentIds.includes(agentId)) {
      return true;
    }
    
    // Check organization scope (if SuperAdmin or OrgAdmin)
    if (agentData?.organizationId && keyData.organizationId === agentData.organizationId) {
      // Verify user is admin in this org
      const userDoc = await firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData?.role === 'superadmin' || userData?.role === 'admin') {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error verifying agent access:', error);
    return false;
  }
}


