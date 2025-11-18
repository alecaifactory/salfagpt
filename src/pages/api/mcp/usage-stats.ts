/**
 * API Endpoint: MCP Usage Stats Server
 * POST /api/mcp/usage-stats
 * 
 * Purpose: MCP-compatible endpoint for usage statistics
 * Access: SuperAdmin (all domains), Admin (own domain)
 * Protocol: Model Context Protocol (MCP)
 */

import type { APIRoute } from 'astro';
import { handleMCPRequest } from '../../../mcp/usage-stats';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Get session for requesterId
    const session = getSession({ cookies } as any);
    
    if (!session) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Unauthorized - Please login',
          },
          id: null,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Parse MCP request
    const body = await request.json();
    const { method, params, jsonrpc, id } = body;

    // 3. Get API key from header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || '';

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Missing API key in Authorization header',
          },
          id: id || null,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Handle MCP request
    const response = await handleMCPRequest({
      method,
      params,
      apiKey,
      requesterId: session.id,
    });

    // 5. Return MCP-formatted response
    if (response.error) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: response.error.message,
            data: { code: response.error.code },
          },
          id: id || null,
        }),
        {
          status: 200, // MCP uses 200 with error in body
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: response.resources || response.content,
        id: id || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ MCP endpoint error:', error);
    
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};















