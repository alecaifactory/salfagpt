import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { hasAnalyticsAccess, getUserRole, generateSampleSummary } from '../../../lib/analytics';

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
    // Get summary metrics
    const summary = generateSampleSummary();
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

