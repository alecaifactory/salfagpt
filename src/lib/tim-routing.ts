/**
 * Tim Insight Routing System
 * Routes insights to appropriate agents and administrators
 * 
 * Created: 2025-11-16
 * Purpose: Connect Tim findings to Ally, Stella, Rudy, Admins
 */

import { firestore } from './firestore';
import type {
  TimInsight,
  AIAnalysis,
  DigitalTwin,
  InsightRouting
} from '../types/tim';

// ============================================================================
// CONFIGURATION
// ============================================================================

function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  return isDevelopment ? 'localhost' : 'production';
}

// ============================================================================
// INSIGHT CREATION
// ============================================================================

/**
 * Create insight from test analysis
 */
export async function createInsight(
  sessionId: string,
  userId: string,
  analysis: AIAnalysis,
  capturedData: any
): Promise<string> {
  console.log('💡 Creating Tim insight from analysis...');
  
  const insightData: Omit<TimInsight, 'id'> = {
    sessionId,
    userId,
    insightType: determineInsightType(analysis),
    title: `${analysis.severity.toUpperCase()}: ${analysis.rootCause.substring(0, 100)}`,
    description: analysis.rootCause,
    severity: analysis.severity,
    evidence: {
      consoleLogs: capturedData.consoleLogs
        .filter((log: any) => log.level === 'error')
        .map((log: any) => log.message)
        .slice(0, 10), // Top 10 errors
      screenshotUrls: capturedData.screenshots.map((s: any) => s.url),
      networkRequests: capturedData.networkRequests
        .filter((req: any) => req.status >= 400)
        .map((req: any) => `${req.method} ${req.url} - ${req.status}`),
      reproductionSteps: [] // Will be filled from session
    },
    routedTo: [],
    status: 'pending',
    tags: inferTags(analysis),
    affectedUsers: estimateAffectedUsers(analysis),
    createdAt: new Date(),
    source: getEnvironmentSource()
  };
  
  const insightRef = await firestore.collection('tim_insights').add(insightData);
  
  console.log('✅ Insight created:', insightRef.id);
  return insightRef.id;
}

// ============================================================================
// ROUTING LOGIC
// ============================================================================

/**
 * Route insights to appropriate agents and admins
 */
export async function routeInsights(
  sessionId: string,
  analysis: AIAnalysis,
  twin: DigitalTwin
): Promise<InsightRouting> {
  console.log('📨 Tim routing insights...');
  
  const routing: InsightRouting = {
    user: false,
    ally: false,
    stella: false,
    rudy: false,
    admin: false,
    superAdmin: false
  };
  
  // Get captured data for evidence
  const session = await firestore.collection('tim_test_sessions').doc(sessionId).get();
  const capturedData = session.data()?.capturedData || {};
  
  // Create insight first
  const insightId = await createInsight(sessionId, twin.userId, analysis, capturedData);
  
  // Route to User (always)
  routing.user = true;
  await sendReportToUser(twin.userId, insightId, twin.ticketId);
  
  // Route to Ally (user's personal agent) - always
  routing.ally = true;
  await updateAllyContext(twin.userId, insightId);
  
  // Route to Stella (Product) - UX/feature/bug insights
  if (['bug', 'ux', 'feature_request'].includes(determineInsightType(analysis))) {
    routing.stella = true;
    await notifyStella(insightId);
  }
  
  // Route to Rudy (Roadmap) - high severity or patterns
  if (analysis.severity === 'critical' || analysis.severity === 'high') {
    routing.rudy = true;
    await notifyRudy(insightId);
  }
  
  // Route to Admin - domain-specific issues
  if (shouldNotifyAdmin(analysis, twin.userProfile.domain)) {
    routing.admin = true;
    await notifyAdmin(twin.userProfile.organizationId || 'default', insightId);
  }
  
  // Route to SuperAdmin - platform-wide critical issues
  if (analysis.severity === 'critical' && analysis.affectedUsers.toLowerCase().includes('all')) {
    routing.superAdmin = true;
    await notifySuperAdmin(insightId);
  }
  
  // Update session with routing info
  await firestore.collection('tim_test_sessions').doc(sessionId).update({
    routedTo: routing,
    updatedAt: new Date()
  });
  
  console.log('✅ Tim insights routed:', routing);
  return routing;
}

// ============================================================================
// ROUTING FUNCTIONS
// ============================================================================

/**
 * Send report to user
 */
async function sendReportToUser(
  userId: string,
  insightId: string,
  ticketId: string
): Promise<void> {
  console.log('📧 Sending Tim report to user:', userId);
  
  // Create notification for user
  await firestore.collection('platform_notifications').add({
    userId,
    type: 'tim_test_complete',
    title: 'Tim Test Complete',
    message: `Your issue (Ticket #${ticketId}) has been analyzed by Tim.`,
    data: {
      insightId,
      ticketId,
      actionUrl: `/tickets/${ticketId}`
    },
    read: false,
    createdAt: new Date()
  });
  
  console.log('✅ User notified');
}

/**
 * Update Ally's context with Tim findings
 */
async function updateAllyContext(
  userId: string,
  insightId: string
): Promise<void> {
  console.log('🤝 Updating Ally context for user:', userId);
  
  const insight = await getInsight(insightId);
  if (!insight) return;
  
  await firestore.collection('ally_context_updates').add({
    userId,
    updateType: 'tim_test_result',
    insightId,
    summary: `User experienced: ${insight.title}`,
    rootCause: insight.description,
    recommendation: insight.description.substring(0, 200),
    priority: insight.severity,
    timestamp: new Date(),
    source: getEnvironmentSource()
  });
  
  console.log('✅ Ally context updated');
}

/**
 * Notify Stella (Product Agent) of insights
 */
async function notifyStella(insightId: string): Promise<void> {
  console.log('📊 Notifying Stella (Product)...');
  
  const insight = await getInsight(insightId);
  if (!insight) return;
  
  await firestore.collection('stella_product_insights').add({
    source: 'tim',
    insightId,
    category: insight.insightType,
    impact: {
      severity: insight.severity,
      affectedUsers: insight.affectedUsers,
      frequency: 1 // Will be aggregated later
    },
    recommendation: insight.description,
    evidence: insight.evidence.screenshotUrls,
    status: 'pending_review',
    createdAt: new Date()
  });
  
  console.log('✅ Stella notified');
}

/**
 * Notify Rudy (Roadmap Agent) of insights
 */
async function notifyRudy(insightId: string): Promise<void> {
  console.log('🗺️ Notifying Rudy (Roadmap)...');
  
  const insight = await getInsight(insightId);
  if (!insight) return;
  
  await firestore.collection('rudy_roadmap_inputs').add({
    source: 'tim',
    insightId,
    priority: calculatePriority(insight),
    impact: {
      users: insight.affectedUsers,
      severity: insight.severity,
      effort: 'Unknown' // Will be estimated by Rudy
    },
    recommendation: `Fix: ${insight.description}`,
    status: 'pending_prioritization',
    createdAt: new Date()
  });
  
  console.log('✅ Rudy notified');
}

/**
 * Notify organization admin
 */
async function notifyAdmin(
  organizationId: string,
  insightId: string
): Promise<void> {
  console.log('👔 Notifying Admin for org:', organizationId);
  
  const insight = await getInsight(insightId);
  if (!insight) return;
  
  // Get admins for this organization
  const adminsSnapshot = await firestore
    .collection('users')
    .where('organizationId', '==', organizationId)
    .where('role', '==', 'admin')
    .get();
  
  // Notify each admin
  for (const adminDoc of adminsSnapshot.docs) {
    await firestore.collection('platform_notifications').add({
      userId: adminDoc.id,
      type: 'tim_org_insight',
      title: `Tim Found Issue in Your Organization`,
      message: `Severity: ${insight.severity} - ${insight.title}`,
      data: {
        insightId,
        organizationId
      },
      read: false,
      createdAt: new Date()
    });
  }
  
  console.log(`✅ ${adminsSnapshot.size} admins notified`);
}

/**
 * Notify SuperAdmin of critical platform issues
 */
async function notifySuperAdmin(insightId: string): Promise<void> {
  console.log('🚨 Notifying SuperAdmin of critical issue...');
  
  const insight = await getInsight(insightId);
  if (!insight) return;
  
  // Get all superadmins
  const superAdminsSnapshot = await firestore
    .collection('users')
    .where('role', '==', 'superadmin')
    .get();
  
  // Notify each superadmin
  for (const adminDoc of superAdminsSnapshot.docs) {
    await firestore.collection('platform_notifications').add({
      userId: adminDoc.id,
      type: 'tim_critical_platform_issue',
      title: `🚨 CRITICAL: Platform-Wide Issue Detected by Tim`,
      message: `${insight.title}\nAffected: ${insight.affectedUsers}`,
      data: {
        insightId,
        severity: insight.severity
      },
      read: false,
      priority: 'critical',
      createdAt: new Date()
    });
  }
  
  console.log(`✅ ${superAdminsSnapshot.size} superadmins notified`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineInsightType(analysis: AIAnalysis): TimInsight['insightType'] {
  const rootCause = analysis.rootCause.toLowerCase();
  
  if (rootCause.includes('error') || rootCause.includes('crash') || rootCause.includes('fail')) {
    return 'bug';
  }
  
  if (rootCause.includes('slow') || rootCause.includes('latency') || rootCause.includes('performance')) {
    return 'performance';
  }
  
  if (rootCause.includes('confusing') || rootCause.includes('unclear') || rootCause.includes('ux')) {
    return 'ux';
  }
  
  if (rootCause.includes('missing') || rootCause.includes('need') || rootCause.includes('should')) {
    return 'feature_request';
  }
  
  return 'pattern';
}

function inferTags(analysis: AIAnalysis): string[] {
  const tags: string[] = [];
  
  const text = (analysis.rootCause + ' ' + analysis.recommendedFix).toLowerCase();
  
  if (text.includes('api')) tags.push('api');
  if (text.includes('ui') || text.includes('interface')) tags.push('ui');
  if (text.includes('database') || text.includes('firestore')) tags.push('database');
  if (text.includes('auth')) tags.push('authentication');
  if (text.includes('context')) tags.push('context');
  if (text.includes('agent')) tags.push('agent');
  if (text.includes('performance')) tags.push('performance');
  if (text.includes('security')) tags.push('security');
  
  tags.push(analysis.severity);
  
  return tags;
}

function estimateAffectedUsers(analysis: AIAnalysis): number {
  const affected = analysis.affectedUsers.toLowerCase();
  
  if (affected.includes('all users')) return 999999;
  if (affected.includes('most users')) return 10000;
  if (affected.includes('some users')) return 1000;
  if (affected.includes('few users')) return 100;
  if (affected.includes('role')) return 50;
  
  return 1; // Default: single user
}

function calculatePriority(insight: TimInsight): number {
  // Priority score: 1-10 (higher = more urgent)
  let priority = 5;
  
  // Severity adjustment
  if (insight.severity === 'critical') priority += 3;
  else if (insight.severity === 'high') priority += 2;
  else if (insight.severity === 'medium') priority += 1;
  
  // Affected users adjustment
  if (insight.affectedUsers > 1000) priority += 2;
  else if (insight.affectedUsers > 100) priority += 1;
  
  return Math.min(10, priority);
}

function shouldNotifyAdmin(analysis: AIAnalysis, domain: string): boolean {
  // Notify admin if:
  // 1. High or critical severity
  if (['high', 'critical'].includes(analysis.severity)) return true;
  
  // 2. Affects multiple users in domain
  if (analysis.affectedUsers.toLowerCase().includes('users')) return true;
  
  // 3. Security-related
  if (analysis.rootCause.toLowerCase().includes('security')) return true;
  
  return false;
}

async function getInsight(insightId: string): Promise<TimInsight | null> {
  try {
    const doc = await firestore.collection('tim_insights').doc(insightId).get();
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      resolvedAt: doc.data()?.resolvedAt?.toDate()
    } as TimInsight;
  } catch (error) {
    console.error('❌ Failed to get insight:', error);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  createInsight,
  routeInsights,
  determineInsightType,
  inferTags,
  estimateAffectedUsers
};

