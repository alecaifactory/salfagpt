/**
 * API Endpoint: MCP Servers Management
 * 
 * GET /api/mcp/servers - List servers
 * POST /api/mcp/servers - Create server (SuperAdmin only)
 * PUT /api/mcp/servers/:id - Update server (SuperAdmin only)
 * DELETE /api/mcp/servers/:id - Delete server (SuperAdmin only)
 * 
 * Access:
 * - SuperAdmin: Can create, view all, manage all
 * - Admin: Can view servers assigned to their domain (read-only)
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { verifyJWT } from '../../../lib/auth';
import type { MCPServer } from '../../../types/mcp';

// GET /api/mcp/servers
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

    // 2. Get user
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const user = userDoc.data();

    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admins only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Load servers based on role
    let query = firestore.collection('mcp_servers');

    if (user.role === 'admin') {
      // Admin sees only servers assigned to their domain
      const userDomain = (user.email || '').split('@')[1];
      query = query.where('assignedDomains', 'array-contains', userDomain) as any;
    }

    // SuperAdmin sees all servers
    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const servers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      lastUsed: doc.data().lastUsed?.toDate(),
    })) as MCPServer[];

    return new Response(
      JSON.stringify({ servers }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading MCP servers:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load servers',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST /api/mcp/servers - Create new MCP server (SuperAdmin only)
export const POST: APIRoute = async ({ request, cookies }) => {
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

    // 2. CRITICAL: Only SuperAdmin can create servers
    if (session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized MCP server creation attempt:', {
        email: session.email,
        userId: session.id,
      });

      return new Response(
        JSON.stringify({ error: 'Forbidden - SuperAdmin only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request
    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      assignedDomains, 
      resources,
      expiresInDays = 90,
    } = body;

    if (!name || !type || !assignedDomains || !resources) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['name', 'type', 'assignedDomains', 'resources'],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate API key
    const apiKey = generateMCPAPIKey('localhost'); // or 'production'
    const apiKeyHash = hashAPIKey(apiKey);
    const keyPrefix = apiKey.substring(0, 12); // For display

    // 5. Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // 6. Create server document
    const serverData: Omit<MCPServer, 'id'> = {
      name,
      description: description || '',
      type,
      createdBy: session.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      apiKeyHash,
      isActive: true,
      expiresAt,
      assignedDomains: Array.isArray(assignedDomains) ? assignedDomains : [assignedDomains],
      allowedRoles: ['superadmin', 'admin'],
      resources: Array.isArray(resources) ? resources : [resources],
      endpoint: `/api/mcp/${type}`,
      usageCount: 0,
    };

    const serverRef = await firestore.collection('mcp_servers').add(serverData);

    // 7. Store API key separately (for initial retrieval)
    await firestore.collection('mcp_api_keys').add({
      serverId: serverRef.id,
      keyHash: apiKeyHash,
      keyPrefix,
      createdBy: session.id,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      usageCount: 0,
      metadata: {
        description: `API key for ${name}`,
        environment: 'localhost',
      },
    });

    console.log('✅ MCP server created:', {
      serverId: serverRef.id,
      name,
      type,
      domains: assignedDomains,
    });

    return new Response(
      JSON.stringify({
        server: {
          id: serverRef.id,
          ...serverData,
        },
        apiKey, // ONLY returned on creation
        warning: 'Store this API key securely. It will not be shown again.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error creating MCP server:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create server',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Helper: Generate secure API key
function generateMCPAPIKey(environment: 'localhost' | 'production'): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `mcp_${environment}_${random}`;
}

// Helper: Hash API key (simple for now, use bcrypt in production)
function hashAPIKey(apiKey: string): string {
  return Buffer.from(apiKey).toString('base64');
}




