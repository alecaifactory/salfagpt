/**
 * API Endpoint: Tim MCP Server
 * POST /api/mcp/tim
 * 
 * Handles MCP requests for Tim digital twin testing agent
 */

import type { APIRoute } from 'astro';
import { handleTimMCPRequest } from '../../../mcp/tim';
import type { TimMCPRequest } from '../../../mcp/tim';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse request body
    const body = await request.json();
    
    // 2. Extract API key from header or body
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || body.apiKey;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: {
            code: 'MISSING_API_KEY',
            message: 'API key required (Authorization header or apiKey field)'
          }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Extract requester ID (from body or token)
    const requesterId = body.requesterId || body.userId;
    
    if (!requesterId) {
      return new Response(
        JSON.stringify({ 
          error: {
            code: 'MISSING_REQUESTER_ID',
            message: 'requesterId required'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Build MCP request
    const mcpRequest: TimMCPRequest = {
      method: body.method || body.jsonrpc === '2.0' ? body.method : 'tools/call',
      params: body.params,
      apiKey,
      requesterId
    };

    // 5. Handle request
    console.log('🤖 Tim MCP request:', mcpRequest.method, mcpRequest.params?.name);
    
    const response = await handleTimMCPRequest(mcpRequest);

    // 6. Return response
    if (response.error) {
      const statusCode = response.error.code === 'UNAUTHORIZED' ? 401 : 400;
      return new Response(
        JSON.stringify(response),
        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Tim MCP API error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Support GET for capability discovery
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      name: 'Tim Digital Twin MCP Server',
      version: '1.0.0',
      description: 'Create digital twins and test user issues automatically',
      capabilities: {
        tools: ['tim/create-twin', 'tim/list-sessions', 'tim/get-session', 'tim/list-twins'],
        resources: ['tim://sessions', 'tim://twins', 'tim://analytics']
      },
      documentation: 'https://localhost:3000/docs/tim',
      status: 'active'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};


