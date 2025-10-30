/**
 * CLI Usage Stats Endpoint
 * 
 * Read-only endpoint for domain usage statistics
 * Requires API key authentication
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import crypto from 'crypto';

/**
 * Verify API key and get permissions
 */
async function verifyAPIKey(apiKey: string): Promise<{
  valid: boolean;
  permissions?: any;
  assignedTo?: string;
  domain?: string;
}> {
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
  
  const apiKeysSnapshot = await firestore
    .collection('api_keys')
    .where('key', '==', hashedKey)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (apiKeysSnapshot.empty) {
    return { valid: false };
  }
  
  const apiKeyData = apiKeysSnapshot.docs[0].data();
  
  // Check expiration
  if (apiKeyData.expiresAt && apiKeyData.expiresAt.toDate() < new Date()) {
    return { valid: false };
  }
  
  return {
    valid: true,
    permissions: apiKeyData.permissions,
    assignedTo: apiKeyData.assignedTo,
    domain: apiKeyData.domain,
  };
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // 1. Verify API key
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const auth = await verifyAPIKey(apiKey);
    
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Check permission
    if (!auth.permissions?.canReadUsageStats) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Get query parameters
    const domain = url.searchParams.get('domain');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Missing domain parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. Verify access to domain
    // API keys can only access their assigned domain (or all for SuperAdmin)
    if (auth.domain !== domain && auth.assignedTo !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot access other domains',
          allowedDomain: auth.domain,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 5. Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    console.log('📊 CLI Usage stats request:', {
      domain,
      period: `${start.toISOString()} - ${end.toISOString()}`,
      requestedBy: auth.assignedTo,
    });
    
    // 6. Query domain users
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '>=', domain)
      .where('email', '<=', domain + '\uf8ff')
      .get();
    
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    const totalUsers = userIds.length;
    
    if (totalUsers === 0) {
      return new Response(
        JSON.stringify({
          domain,
          period: { start, end },
          totalUsers: 0,
          message: 'No users found for this domain',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 7. Query conversations for domain users in date range
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', 'in', userIds.slice(0, 30)) // Firestore 'in' limit
      .where('lastMessageAt', '>=', start)
      .where('lastMessageAt', '<=', end)
      .get();
    
    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastMessageAt: doc.data().lastMessageAt?.toDate(),
    }));
    
    // 8. Query messages for those conversations
    const conversationIds = conversations.map(c => c.id);
    let messagesSnapshot;
    
    if (conversationIds.length > 0) {
      messagesSnapshot = await firestore
        .collection('messages')
        .where('conversationId', 'in', conversationIds.slice(0, 30))
        .get();
    } else {
      messagesSnapshot = { docs: [] };
    }
    
    const messages = messagesSnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
    
    // 9. Calculate stats
    const activeUserIds = new Set(
      conversations.map(c => c.userId)
    );
    
    // Model usage
    const modelUsage = {
      flash: { requests: 0, tokens: 0, cost: 0 },
      pro: { requests: 0, tokens: 0, cost: 0 },
    };
    
    conversations.forEach(conv => {
      const model = conv.agentModel?.includes('pro') ? 'pro' : 'flash';
      const inputTokens = conv.totalInputTokens || 0;
      const outputTokens = conv.totalOutputTokens || 0;
      
      modelUsage[model].requests += 1;
      modelUsage[model].tokens += inputTokens + outputTokens;
      
      // Simple cost estimation (Flash: $0.15/1M, Pro: $6.25/1M)
      const costPer1M = model === 'pro' ? 6.25 : 0.15;
      modelUsage[model].cost += ((inputTokens + outputTokens) / 1000000) * costPer1M;
    });
    
    // Context sources
    const contextSnapshot = await firestore
      .collection('context_sources')
      .where('userId', 'in', userIds.slice(0, 30))
      .get();
    
    const totalContextTokens = contextSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().metadata?.tokensEstimate || 0);
    }, 0);
    
    // Calculate totals
    const totalCost = modelUsage.flash.cost + modelUsage.pro.cost;
    const totalMessages = messages.length;
    
    const stats = {
      domain,
      period: { start, end },
      
      // Users
      totalUsers,
      activeUsers: activeUserIds.size,
      
      // Agents
      totalAgents: conversations.length,
      totalConversations: conversations.length,
      totalMessages,
      
      // Model usage
      modelUsage,
      
      // Context
      totalContextSources: contextSnapshot.size,
      totalContextTokens,
      
      // Performance
      avgResponseTimeMs: 1500, // Placeholder - would need to calculate from metadata
      
      // Costs
      totalCost,
      costPerUser: totalUsers > 0 ? totalCost / totalUsers : 0,
      costPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
    };
    
    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error fetching usage stats:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


