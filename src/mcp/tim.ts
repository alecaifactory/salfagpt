/**
 * MCP Server: Tim Digital Twin Testing Agent
 * 
 * Purpose: Invoke Tim to create digital twins and test user issues
 * Access: SuperAdmin, Admin (own domain users only)
 * 
 * Tools:
 * - tim/create-twin - Create a digital twin for a user
 * - tim/list-sessions - List Tim test sessions
 * - tim/get-session - Get detailed session info
 * - tim/execute-test - Execute browser automation test
 * 
 * Resources:
 * - tim://sessions/{userId} - User's Tim sessions
 * - tim://session/{sessionId} - Specific session details
 * - tim://analytics - Tim usage analytics
 */

import { firestore } from '../lib/firestore';
import { createDigitalTwin } from '../lib/tim';
import type { CreateTimRequest, DigitalTwin, TimTestSession } from '../types/tim';

// ============================================================================
// TYPES
// ============================================================================

export interface TimMCPRequest {
  method: 'tools/list' | 'tools/call' | 'resources/list' | 'resources/read';
  params?: {
    name?: string;
    arguments?: any;
    uri?: string;
  };
  apiKey: string;
  requesterId: string;
}

export interface TimMCPResponse {
  tools?: TimTool[];
  resources?: TimResource[];
  content?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface TimTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface TimResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function hashAPIKey(apiKey: string): string {
  return Buffer.from(apiKey).toString('base64');
}

async function verifyTimAccess(apiKey: string, requesterId: string): Promise<{
  valid: boolean;
  role?: string;
  userId?: string;
  domain?: string;
  error?: string;
}> {
  try {
    // 1. Verify API key
    const serverSnapshot = await firestore
      .collection('mcp_servers')
      .where('apiKeyHash', '==', hashAPIKey(apiKey))
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (serverSnapshot.empty) {
      return { valid: false, error: 'Invalid API key' };
    }

    const server = serverSnapshot.docs[0].data();

    // 2. Check expiration
    if (server.expiresAt && server.expiresAt.toDate() < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // 3. Get user
    const userDoc = await firestore.collection('users').doc(requesterId).get();
    
    if (!userDoc.exists) {
      return { valid: false, error: 'User not found' };
    }

    const user = userDoc.data();
    
    // 4. Check role (SuperAdmin, Admin, or the user themselves)
    if (!['superadmin', 'admin'].includes(user?.role || '')) {
      return { valid: false, error: 'Insufficient permissions - Tim requires admin access' };
    }

    const userEmail = user?.email || '';
    const domain = userEmail.split('@')[1] || '';

    return {
      valid: true,
      role: user?.role,
      userId: requesterId,
      domain,
    };
  } catch (error) {
    console.error('❌ Tim MCP auth error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}

// ============================================================================
// TOOLS DEFINITION
// ============================================================================

const TIM_TOOLS: TimTool[] = [
  {
    name: 'tim/create-twin',
    description: 'Create a digital twin for a user to test their issue. Requires userId, ticketId, and issue details.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to create digital twin for (e.g., usr_g14stel2ccwsl0eafp60)'
        },
        ticketId: {
          type: 'string',
          description: 'Support ticket ID (e.g., TIM-TEST-001)'
        },
        userAction: {
          type: 'string',
          description: 'What the user did (e.g., "Clicked Send button")'
        },
        expectedBehavior: {
          type: 'string',
          description: 'What should have happened (e.g., "Message should send")'
        },
        actualBehavior: {
          type: 'string',
          description: 'What actually happened (e.g., "Got error message")'
        },
        reproductionSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Steps to reproduce the issue'
        }
      },
      required: ['userId', 'ticketId', 'userAction', 'expectedBehavior', 'actualBehavior', 'reproductionSteps']
    }
  },
  {
    name: 'tim/list-sessions',
    description: 'List Tim test sessions. Can filter by userId or show all (admin only).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Filter by user ID (optional, defaults to all users for admin)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of sessions to return (default: 10)'
        }
      }
    }
  },
  {
    name: 'tim/get-session',
    description: 'Get detailed information about a specific Tim test session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Tim session ID (e.g., tim-session-1763428409974-abc123)'
        }
      },
      required: ['sessionId']
    }
  },
  {
    name: 'tim/list-twins',
    description: 'List digital twins created by Tim. Can filter by userId.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Filter by user ID (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of twins to return (default: 10)'
        }
      }
    }
  }
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

async function createTwin(args: any, requesterId: string, role: string): Promise<any> {
  const { userId, ticketId, userAction, expectedBehavior, actualBehavior, reproductionSteps } = args;

  // Validate required fields
  if (!userId || !ticketId || !userAction || !expectedBehavior || !actualBehavior || !reproductionSteps) {
    throw new Error('Missing required fields for creating digital twin');
  }

  // Admin can only create twins for users in their domain
  if (role === 'admin') {
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();
    const requesterDoc = await firestore.collection('users').doc(requesterId).get();
    const requester = requesterDoc.data();
    
    const userDomain = user?.email?.split('@')[1];
    const requesterDomain = requester?.email?.split('@')[1];
    
    if (userDomain !== requesterDomain) {
      throw new Error('Admin can only create twins for users in their domain');
    }
  }

  // Create digital twin
  const request: CreateTimRequest = {
    userId,
    ticketId,
    ticketDetails: {
      userAction,
      expectedBehavior,
      actualBehavior,
      reproductionSteps: Array.isArray(reproductionSteps) ? reproductionSteps : [reproductionSteps]
    }
  };

  const result = await createDigitalTwin(request);

  return {
    success: true,
    digitalTwinId: result.digitalTwinId,
    sessionId: result.sessionId,
    complianceScore: result.complianceScore,
    status: result.status,
    message: `✅ Digital twin created successfully! Compliance: ${result.complianceScore}%`,
    nextSteps: [
      'Use tim/get-session to view session details',
      'Execute browser automation with MCP browser tools',
      'Tim will capture diagnostics and route insights to appropriate agents'
    ]
  };
}

async function listSessions(args: any, requesterId: string, role: string): Promise<any> {
  const { userId, limit = 10 } = args;

  let query = firestore.collection('tim_test_sessions') as any;

  // Admin can only see sessions for users in their domain
  if (role === 'admin' && !userId) {
    const requesterDoc = await firestore.collection('users').doc(requesterId).get();
    const requester = requesterDoc.data();
    const requesterDomain = requester?.email?.split('@')[1];
    
    // Filter by domain (would need to add domain field to sessions in production)
    query = query.where('userId', '==', requesterId);
  } else if (userId) {
    query = query.where('userId', '==', userId);
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const sessions = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()
  }));

  return {
    success: true,
    count: sessions.length,
    sessions,
    message: `Found ${sessions.length} Tim test session(s)`
  };
}

async function getSession(args: any): Promise<any> {
  const { sessionId } = args;

  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  const sessionDoc = await firestore.collection('tim_test_sessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const session = {
    id: sessionDoc.id,
    ...sessionDoc.data(),
    createdAt: sessionDoc.data()?.createdAt?.toDate?.(),
    completedAt: sessionDoc.data()?.completedAt?.toDate?.()
  };

  return {
    success: true,
    session,
    message: `Session details for ${sessionId}`
  };
}

async function listTwins(args: any, requesterId: string, role: string): Promise<any> {
  const { userId, limit = 10 } = args;

  let query = firestore.collection('digital_twins') as any;

  // Admin can only see twins for users in their domain
  if (role === 'admin' && !userId) {
    const requesterDoc = await firestore.collection('users').doc(requesterId).get();
    const requester = requesterDoc.data();
    const requesterDomain = requester?.email?.split('@')[1];
    
    query = query.where('userId', '==', requesterId);
  } else if (userId) {
    query = query.where('userId', '==', userId);
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const twins = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    userId: doc.data().userId,
    userEmail: doc.data().userEmail,
    ticketId: doc.data().ticketId,
    status: doc.data().status,
    complianceScore: doc.data().complianceScore,
    createdAt: doc.data().createdAt?.toDate?.()
  }));

  return {
    success: true,
    count: twins.length,
    twins,
    message: `Found ${twins.length} digital twin(s)`
  };
}

// ============================================================================
// MCP HANDLERS
// ============================================================================

async function handleToolsList(): Promise<TimMCPResponse> {
  return {
    tools: TIM_TOOLS
  };
}

async function handleToolCall(
  toolName: string,
  args: any,
  requesterId: string,
  role: string
): Promise<TimMCPResponse> {
  try {
    let result;

    switch (toolName) {
      case 'tim/create-twin':
        result = await createTwin(args, requesterId, role);
        break;
      
      case 'tim/list-sessions':
        result = await listSessions(args, requesterId, role);
        break;
      
      case 'tim/get-session':
        result = await getSession(args);
        break;
      
      case 'tim/list-twins':
        result = await listTwins(args, requesterId, role);
        break;
      
      default:
        return {
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Tool not found: ${toolName}`
          }
        };
    }

    return { content: result };
  } catch (error) {
    console.error(`❌ Tim tool error (${toolName}):`, error);
    return {
      error: {
        code: 'TOOL_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Tool execution failed'
      }
    };
  }
}

async function handleResourcesList(): Promise<TimMCPResponse> {
  const resources: TimResource[] = [
    {
      uri: 'tim://sessions',
      name: 'Tim Test Sessions',
      description: 'List all Tim test sessions',
      mimeType: 'application/json'
    },
    {
      uri: 'tim://twins',
      name: 'Digital Twins',
      description: 'List all digital twins created by Tim',
      mimeType: 'application/json'
    },
    {
      uri: 'tim://analytics',
      name: 'Tim Analytics',
      description: 'Tim usage analytics and statistics',
      mimeType: 'application/json'
    }
  ];

  return { resources };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function handleTimMCPRequest(request: TimMCPRequest): Promise<TimMCPResponse> {
  const { method, params, apiKey, requesterId } = request;

  // Verify access
  const auth = await verifyTimAccess(apiKey, requesterId);

  if (!auth.valid) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: auth.error || 'Access denied'
      }
    };
  }

  // Handle request
  try {
    switch (method) {
      case 'tools/list':
        return await handleToolsList();
      
      case 'tools/call':
        if (!params?.name) {
          return {
            error: {
              code: 'INVALID_REQUEST',
              message: 'Tool name required'
            }
          };
        }
        return await handleToolCall(
          params.name,
          params.arguments || {},
          requesterId,
          auth.role!
        );
      
      case 'resources/list':
        return await handleResourcesList();
      
      case 'resources/read':
        // TODO: Implement resource reading
        return {
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Resource reading not yet implemented'
          }
        };
      
      default:
        return {
          error: {
            code: 'METHOD_NOT_SUPPORTED',
            message: `Method not supported: ${method}`
          }
        };
    }
  } catch (error) {
    console.error('❌ Tim MCP request error:', error);
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error'
      }
    };
  }
}



