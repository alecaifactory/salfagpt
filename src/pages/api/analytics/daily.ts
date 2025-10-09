import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { hasAnalyticsAccess, getUserRole, generateSampleDailyMetrics } from '../../../lib/analytics';

export const GET: APIRoute = async (context) => {
  // Check authentication
  const session = getSession(context);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Check analytics access
  const userRole = getUserRole(session.email);
  if (!hasAnalyticsAccess(session.email, userRole)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Analytics access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Get query parameters
    const url = new URL(context.request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Get daily metrics
    const metrics = generateSampleDailyMetrics(Math.min(days, 365));
    
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

