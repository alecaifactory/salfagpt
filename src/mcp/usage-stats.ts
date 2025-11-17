/**
 * MCP Server: Usage Stats (Read-Only)
 * 
 * Purpose: Provide secure, read-only access to usage statistics
 * Access: SuperAdmin (all domains), Admin (own domain)
 * 
 * Resources:
 * - usage-stats://{domainId}/summary
 * - usage-stats://{domainId}/agents
 * - usage-stats://{domainId}/users
 * - usage-stats://{domainId}/costs
 */

import { firestore } from '../lib/firestore';

// Types
export interface MCPRequest {
  method: 'resources/list' | 'resources/read';
  params?: {
    uri?: string;
  };
  apiKey: string;
  requesterId: string; // User ID making the request
}

export interface MCPResponse {
  resources?: MCPResource[];
  content?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface UsageSummary {
  domain: string;
  period: string;
  totalAgents: number;
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  totalCost: number;
  averageMessagesPerAgent: number;
  modelBreakdown: {
    flash: { count: number; percentage: number };
    pro: { count: number; percentage: number };
  };
}

export interface AgentStats {
  agentId: string;
  agentTitle: string;
  conversationCount: number;
  messageCount: number;
  uniqueUsers: number;
  lastUsed: Date;
  model: string;
  averageResponseTime?: number;
}

// Authentication & Authorization
async function verifyMCPAccess(apiKey: string, requesterId: string): Promise<{
  valid: boolean;
  role?: string;
  domain?: string;
  error?: string;
}> {
  try {
    // 1. Verify API key exists and is valid
    const serverSnapshot = await firestore
      .collection('mcp_servers')
      .where('apiKeyHash', '==', hashAPIKey(apiKey))
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (serverSnapshot.empty) {
      return { valid: false, error: 'Invalid API key' };
    }

    const serverDoc = serverSnapshot.docs[0];
    const server = serverDoc.data();

    // 2. Check expiration
    if (server.expiresAt && server.expiresAt.toDate() < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // 3. Get user and verify role
    const userDoc = await firestore.collection('users').doc(requesterId).get();
    
    if (!userDoc.exists) {
      return { valid: false, error: 'User not found' };
    }

    const user = userDoc.data();
    
    // 4. Only SuperAdmin and Admin allowed
    if (!['superadmin', 'admin'].includes(user?.role || '')) {
      return { valid: false, error: 'Insufficient permissions' };
    }

    // 5. Get user's domain
    const userEmail = user?.email || '';
    const domain = userEmail.split('@')[1] || '';

    return {
      valid: true,
      role: user?.role,
      domain,
    };
  } catch (error) {
    console.error('❌ MCP auth error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

// Simple hash for API keys (production should use bcrypt)
function hashAPIKey(apiKey: string): string {
  // In production, use proper hashing (bcrypt, argon2)
  // For now, simple hash for development
  return Buffer.from(apiKey).toString('base64');
}

// List available resources
export async function listResources(
  apiKey: string,
  requesterId: string
): Promise<MCPResponse> {
  const auth = await verifyMCPAccess(apiKey, requesterId);

  if (!auth.valid) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error || 'Access denied',
      },
    };
  }

  const domain = auth.domain!;
  const isSuperAdmin = auth.role === 'superadmin';

  // SuperAdmin sees all domains, Admin sees only their domain
  const domains = isSuperAdmin 
    ? await getAllDomains()
    : [domain];

  const resources: MCPResource[] = [];

  for (const domainId of domains) {
    resources.push(
      {
        uri: `usage-stats://${domainId}/summary`,
        name: `Usage Summary - ${domainId}`,
        description: `Overall usage statistics for ${domainId}`,
        mimeType: 'application/json',
      },
      {
        uri: `usage-stats://${domainId}/agents`,
        name: `Agent Stats - ${domainId}`,
        description: `Per-agent usage statistics for ${domainId}`,
        mimeType: 'application/json',
      },
      {
        uri: `usage-stats://${domainId}/users`,
        name: `User Activity - ${domainId}`,
        description: `Per-user activity statistics for ${domainId}`,
        mimeType: 'application/json',
      },
      {
        uri: `usage-stats://${domainId}/costs`,
        name: `Cost Breakdown - ${domainId}`,
        description: `Cost analysis by agent and model for ${domainId}`,
        mimeType: 'application/json',
      }
    );
  }

  return { resources };
}

// Read a specific resource
export async function readResource(
  uri: string,
  apiKey: string,
  requesterId: string
): Promise<MCPResponse> {
  const auth = await verifyMCPAccess(apiKey, requesterId);

  if (!auth.valid) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error || 'Access denied',
      },
    };
  }

  // Parse URI: usage-stats://{domainId}/{resource}
  const match = uri.match(/^usage-stats:\/\/([^/]+)\/(.+)$/);
  
  if (!match) {
    return {
      error: {
        code: 'INVALID_URI',
        message: 'URI format must be: usage-stats://{domainId}/{resource}',
      },
    };
  }

  const [, domainId, resource] = match;

  // Security: Verify access to domain
  const isSuperAdmin = auth.role === 'superadmin';
  const userDomain = auth.domain!;

  if (!isSuperAdmin && domainId !== userDomain) {
    return {
      error: {
        code: 'FORBIDDEN',
        message: `Access denied to domain: ${domainId}`,
      },
    };
  }

  // Fetch data based on resource type
  try {
    let data: any;

    switch (resource) {
      case 'summary':
        data = await getUsageSummary(domainId);
        break;
      case 'agents':
        data = await getAgentStats(domainId);
        break;
      case 'users':
        data = await getUserStats(domainId);
        break;
      case 'costs':
        data = await getCostBreakdown(domainId);
        break;
      default:
        return {
          error: {
            code: 'NOT_FOUND',
            message: `Unknown resource: ${resource}`,
          },
        };
    }

    return {
      content: JSON.stringify(data, null, 2),
    };
  } catch (error) {
    console.error('❌ MCP resource read error:', error);
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to read resource',
      },
    };
  }
}

// Get all domains (SuperAdmin only)
async function getAllDomains(): Promise<string[]> {
  const orgsSnapshot = await firestore
    .collection('organizations')
    .where('isActive', '==', true)
    .get();

  return orgsSnapshot.docs.map(doc => doc.data().domain || doc.id);
}

// Get usage summary for a domain
async function getUsageSummary(domainId: string): Promise<UsageSummary> {
  // Get all users in domain
  const usersSnapshot = await firestore
    .collection('users')
    .where('email', '>=', `@${domainId}`)
    .where('email', '<=', `@${domainId}\uf8ff`)
    .get();

  const userIds = usersSnapshot.docs.map(doc => doc.id);

  if (userIds.length === 0) {
    return {
      domain: domainId,
      period: 'all-time',
      totalAgents: 0,
      totalConversations: 0,
      totalMessages: 0,
      activeUsers: 0,
      totalCost: 0,
      averageMessagesPerAgent: 0,
      modelBreakdown: {
        flash: { count: 0, percentage: 0 },
        pro: { count: 0, percentage: 0 },
      },
    };
  }

  // Get conversations for these users
  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('userId', 'in', userIds.slice(0, 10)) // Firestore 'in' limit is 10
    .get();

  const conversations = conversationsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Calculate stats
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((sum, conv: any) => sum + (conv.messageCount || 0), 0);
  
  const flashCount = conversations.filter((conv: any) => 
    conv.agentModel?.includes('flash')
  ).length;
  
  const proCount = conversations.filter((conv: any) => 
    conv.agentModel?.includes('pro')
  ).length;

  const activeUsers = new Set(conversations.map((conv: any) => conv.userId)).size;

  // Estimate cost (rough calculation)
  const estimatedCost = (flashCount * 0.05) + (proCount * 0.50); // Rough per-agent cost

  return {
    domain: domainId,
    period: 'all-time',
    totalAgents: totalConversations,
    totalConversations,
    totalMessages,
    activeUsers,
    totalCost: estimatedCost,
    averageMessagesPerAgent: totalConversations > 0 
      ? totalMessages / totalConversations 
      : 0,
    modelBreakdown: {
      flash: {
        count: flashCount,
        percentage: totalConversations > 0 
          ? (flashCount / totalConversations) * 100 
          : 0,
      },
      pro: {
        count: proCount,
        percentage: totalConversations > 0 
          ? (proCount / totalConversations) * 100 
          : 0,
      },
    },
  };
}

// Get per-agent statistics
async function getAgentStats(domainId: string): Promise<AgentStats[]> {
  // Get all users in domain
  const usersSnapshot = await firestore
    .collection('users')
    .where('email', '>=', `@${domainId}`)
    .where('email', '<=', `@${domainId}\uf8ff`)
    .get();

  const userIds = usersSnapshot.docs.map(doc => doc.id);

  if (userIds.length === 0) {
    return [];
  }

  // Get conversations (agents)
  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('userId', 'in', userIds.slice(0, 10))
    .orderBy('lastMessageAt', 'desc')
    .limit(50) // Top 50 agents
    .get();

  return conversationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      agentId: doc.id,
      agentTitle: data.title || 'Untitled Agent',
      conversationCount: 1, // Each conversation is an agent
      messageCount: data.messageCount || 0,
      uniqueUsers: 1, // For now, 1:1 agent:user
      lastUsed: data.lastMessageAt?.toDate() || new Date(),
      model: data.agentModel || 'unknown',
    };
  });
}

// Get per-user statistics
async function getUserStats(domainId: string): Promise<any[]> {
  const usersSnapshot = await firestore
    .collection('users')
    .where('email', '>=', `@${domainId}`)
    .where('email', '<=', `@${domainId}\uf8ff`)
    .get();

  const stats = [];

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    
    // Count user's conversations
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userDoc.id)
      .get();

    const totalMessages = conversationsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().messageCount || 0),
      0
    );

    stats.push({
      userId: userDoc.id,
      email: user.email,
      name: user.name,
      role: user.role,
      totalAgents: conversationsSnapshot.size,
      totalMessages,
      lastActive: user.lastLoginAt?.toDate() || null,
    });
  }

  return stats.sort((a, b) => b.totalMessages - a.totalMessages);
}

// Get cost breakdown
async function getCostBreakdown(domainId: string): Promise<any> {
  const usersSnapshot = await firestore
    .collection('users')
    .where('email', '>=', `@${domainId}`)
    .where('email', '<=', `@${domainId}\uf8ff`)
    .get();

  const userIds = usersSnapshot.docs.map(doc => doc.id);

  if (userIds.length === 0) {
    return {
      domain: domainId,
      totalCost: 0,
      byModel: { flash: 0, pro: 0 },
      byUser: [],
    };
  }

  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('userId', 'in', userIds.slice(0, 10))
    .get();

  const flashAgents = conversationsSnapshot.docs.filter(doc => 
    doc.data().agentModel?.includes('flash')
  ).length;

  const proAgents = conversationsSnapshot.docs.filter(doc => 
    doc.data().agentModel?.includes('pro')
  ).length;

  // Rough cost estimates (per agent)
  const flashCost = flashAgents * 0.05;
  const proCost = proAgents * 0.50;

  return {
    domain: domainId,
    totalCost: flashCost + proCost,
    byModel: {
      flash: flashCost,
      pro: proCost,
    },
    byAgent: {
      flash: flashAgents,
      pro: proAgents,
    },
  };
}

// Main MCP handler
export async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  const { method, params, apiKey, requesterId } = request;

  // Verify access
  const auth = await verifyMCPAccess(apiKey, requesterId);

  if (!auth.valid) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error || 'Access denied',
      },
    };
  }

  // Handle request
  try {
    switch (method) {
      case 'resources/list':
        return await listResources(apiKey, requesterId);
      
      case 'resources/read':
        if (!params?.uri) {
          return {
            error: {
              code: 'INVALID_REQUEST',
              message: 'URI required for resources/read',
            },
          };
        }
        return await readResource(params.uri, apiKey, requesterId);
      
      default:
        return {
          error: {
            code: 'METHOD_NOT_SUPPORTED',
            message: `Method not supported: ${method}`,
          },
        };
    }
  } catch (error) {
    console.error('❌ MCP request error:', error);
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}












