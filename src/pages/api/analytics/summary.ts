import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { hasAnalyticsAccess, getUserRole, generateSampleSummary } from '../../../lib/analytics';
import { logger } from '../../../lib/logger';
import { reportError } from '../../../lib/error-reporting';

export const GET: APIRoute = async (context) => {
  const timer = logger.startTimer();
  
  // Check authentication
  const session = getSession(context);
  
  if (!session) {
    await logger.warn('Unauthorized analytics access attempt', {
      endpoint: '/api/analytics/summary',
      method: 'GET'
    });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Check analytics access
  const userRole = getUserRole(session.email);
  if (!hasAnalyticsAccess(session.email, userRole)) {
    await logger.warn('Forbidden analytics access attempt', {
      userId: session.id,
      userRole,
      endpoint: '/api/analytics/summary',
    });
    return new Response(JSON.stringify({ error: 'Forbidden: Analytics access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    await logger.info('Analytics summary request', {
      userId: session.id,
      userRole,
      action: 'analytics_summary',
    });

    // Get summary metrics
    const summary = generateSampleSummary();
    
    const duration = await timer.end('analytics_summary_request', { userId: session.id });
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await reportError(
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: session.id,
        endpoint: '/api/analytics/summary',
        method: 'GET'
      }
    );
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

