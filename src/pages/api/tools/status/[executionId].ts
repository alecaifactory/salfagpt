/**
 * API Endpoint: Get Tool Execution Status
 * 
 * GET /api/tools/status/:executionId
 * 
 * Returns current status of tool execution
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { getToolExecution } from '../../../../lib/tool-manager';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { executionId } = params;
    
    if (!executionId) {
      return new Response(JSON.stringify({ error: 'Missing executionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Get execution
    const execution = await getToolExecution(executionId);
    
    if (!execution) {
      return new Response(JSON.stringify({ error: 'Execution not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Verify ownership
    if (execution.userId !== session.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Return status
    return new Response(JSON.stringify({
      executionId: execution.id,
      status: execution.status,
      progressPercentage: execution.progressPercentage,
      progressMessage: execution.progressMessage,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      outputFiles: execution.outputFiles,
      metadata: execution.metadata,
      error: execution.error,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error getting tool status:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


