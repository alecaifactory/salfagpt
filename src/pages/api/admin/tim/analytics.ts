/**
 * API: Admin - Tim Analytics
 * GET /api/admin/tim/analytics
 * 
 * Aggregate analytics across all Tim sessions
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore } from '../../../../lib/firestore';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Verify admin/superadmin
    if (!['admin', 'superadmin'].includes(session.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Generate analytics
    const analytics = await generateTimAnalytics(
      session.role === 'admin' ? session.organizationId : undefined
    );

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error generating Tim analytics:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Generate comprehensive Tim analytics
 */
async function generateTimAnalytics(organizationId?: string) {
  console.log('📊 Generating Tim analytics...');
  
  // Query sessions
  let query = firestore.collection('tim_test_sessions');
  
  if (organizationId) {
    // Admin: Get users in organization first
    const orgUsersSnapshot = await firestore
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();
    
    const userIds = orgUsersSnapshot.docs.map(doc => doc.id);
    
    // Filter by org users (limit: 10 for Firestore 'in' query)
    if (userIds.length > 0) {
      query = query.where('userId', 'in', userIds.slice(0, 10)) as any;
    }
  }
  
  const sessionsSnapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(1000) // Last 1000 sessions
    .get();
  
  const sessions = sessionsSnapshot.docs.map(doc => doc.data());
  
  // Calculate overview metrics
  const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
  const totalIssues = sessions.filter(s => 
    s.aiAnalysis && ['critical', 'high'].includes(s.aiAnalysis.severity)
  ).length;
  const resolved = sessions.filter(s => s.status === 'completed').length;
  
  const proactiveTests = sessions.filter(s => 
    s.testMetadata?.testType === 'proactive'
  ).length;
  
  // Calculate by-feature metrics
  const byFeature: Record<string, any> = {};
  
  const featureNames = [...new Set(sessions
    .map(s => s.testMetadata?.coreFeature)
    .filter(Boolean)
  )];
  
  for (const featureName of featureNames) {
    const featureSessions = sessions.filter(s => 
      s.testMetadata?.coreFeature === featureName
    );
    
    const failures = featureSessions.filter(s => s.status === 'failed').length;
    const successRate = featureSessions.length > 0
      ? ((featureSessions.length - failures) / featureSessions.length * 100)
      : 0;
    
    byFeature[featureName] = {
      tests: featureSessions.length,
      failures,
      successRate: parseFloat(successRate.toFixed(2))
    };
  }
  
  // Common issues pattern detection
  const issuePatterns = new Map<string, number>();
  
  sessions.forEach(s => {
    if (s.aiAnalysis?.rootCause) {
      const key = s.aiAnalysis.rootCause.substring(0, 100); // First 100 chars
      issuePatterns.set(key, (issuePatterns.get(key) || 0) + 1);
    }
  });
  
  const commonIssues = Array.from(issuePatterns.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, frequency]) => ({
      pattern,
      frequency,
      affectedUsers: frequency, // Approximate
      severity: 'medium',
      status: 'open'
    }));
  
  // Performance metrics
  const durations = sessions
    .map(s => s.durationMs)
    .filter(Boolean)
    .sort((a, b) => a - b);
  
  const avgDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;
  
  const p95Duration = durations.length > 0
    ? durations[Math.floor(durations.length * 0.95)]
    : 0;
  
  return {
    overview: {
      totalSessions: sessions.length,
      uniqueUsers,
      totalIssuesDetected: totalIssues,
      issuesResolved: resolved,
      avgResolutionTime: 0, // Would calculate from tickets
      proactiveTests,
      reactiveTests: sessions.length - proactiveTests
    },
    
    byFeature,
    
    commonIssues,
    
    performanceMetrics: {
      avgTestDuration: Math.round(avgDuration),
      p95TestDuration: Math.round(p95Duration),
      avgMemoryUsage: 0, // Would aggregate from performance snapshots
      avgLoadTime: 0,
      avgApiLatency: 0
    },
    
    generatedAt: new Date().toISOString()
  };
}




