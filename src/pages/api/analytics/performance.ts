import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

/**
 * POST /api/analytics/performance
 * 
 * Receives client-side performance metrics and stores them for analysis
 * 
 * Body:
 * {
 *   navigation: { fcp, lcp, cls, fid, ttfb, ... },
 *   resources: [...],
 *   interactions: [...],
 *   custom: {...}
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    
    // Get user info from session (optional)
    const sessionCookie = cookies.get('flow_session');
    let userId = 'anonymous';
    
    if (sessionCookie) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(
          sessionCookie.value,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as any;
        userId = decoded.id || decoded.userId;
      } catch (err) {
        // Continue with anonymous
      }
    }
    
    // Store performance metrics in Firestore
    const metricsRef = firestore.collection('performance_metrics');
    
    await metricsRef.add({
      userId,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ...data,
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Failed to store performance metrics:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to store metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /api/analytics/performance
 * 
 * Retrieves performance metrics for analysis
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - userId: Filter by user
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    
    let query = firestore.collection('performance_metrics').orderBy('timestamp', 'desc');
    
    // Filter by date range
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }
    
    // Filter by user
    if (userId && userId !== 'all') {
      query = query.where('userId', '==', userId);
    }
    
    // Limit to 1000 records
    query = query.limit(1000);
    
    const snapshot = await query.get();
    
    const metrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().toISOString() || doc.data().timestamp,
    }));
    
    // Calculate aggregates
    const aggregates = calculateAggregates(metrics);
    
    return new Response(
      JSON.stringify({
        metrics,
        aggregates,
        count: metrics.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Failed to retrieve performance metrics:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// ============================================================
// UTILITIES
// ============================================================

function calculateAggregates(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      fcp: { avg: 0, p50: 0, p95: 0, p99: 0 },
      lcp: { avg: 0, p50: 0, p95: 0, p99: 0 },
      fid: { avg: 0, p50: 0, p95: 0, p99: 0 },
      cls: { avg: 0, p50: 0, p95: 0, p99: 0 },
      ttfb: { avg: 0, p50: 0, p95: 0, p99: 0 },
    };
  }
  
  // Extract navigation metrics
  const fcpValues = metrics
    .map(m => m.navigation?.fcp)
    .filter(v => v !== undefined && v !== null);
  
  const lcpValues = metrics
    .map(m => m.navigation?.lcp)
    .filter(v => v !== undefined && v !== null);
  
  const fidValues = metrics
    .map(m => m.navigation?.fid)
    .filter(v => v !== undefined && v !== null);
  
  const clsValues = metrics
    .map(m => m.navigation?.cls)
    .filter(v => v !== undefined && v !== null);
  
  const ttfbValues = metrics
    .map(m => m.navigation?.ttfb)
    .filter(v => v !== undefined && v !== null);
  
  return {
    fcp: calculateStats(fcpValues),
    lcp: calculateStats(lcpValues),
    fid: calculateStats(fidValues),
    cls: calculateStats(clsValues),
    ttfb: calculateStats(ttfbValues),
  };
}

function calculateStats(values: number[]) {
  if (values.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0 };
  }
  
  const sorted = values.sort((a, b) => a - b);
  
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  
  return {
    avg: Math.round(avg * 100) / 100,
    p50: Math.round(p50 * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    p99: Math.round(p99 * 100) / 100,
  };
}

