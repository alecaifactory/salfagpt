import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { hasAnalyticsAccess, getUserRole, getTableSample, convertToCSV, convertToJSON } from '../../../lib/analytics';

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
    const tableName = url.searchParams.get('table');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const format = url.searchParams.get('format') || 'json';
    
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Table name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get sample data
    const sample = await getTableSample(tableName, Math.min(limit, 1000));
    
    // Return in requested format
    if (format === 'csv') {
      const csv = convertToCSV(sample);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${tableName}_sample.csv"`,
        },
      });
    } else if (format === 'json-download') {
      const json = convertToJSON(sample);
      return new Response(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${tableName}_sample.json"`,
        },
      });
    } else {
      // Default JSON response
      return new Response(JSON.stringify(sample), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching table sample:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

