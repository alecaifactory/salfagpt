/**
 * Staging-Production Feedback Loop API
 * 
 * POST /api/staging/feedback-loop - Report production issue
 * GET  /api/staging/feedback-loop/test-invites - Get staging test invitations
 * POST /api/staging/feedback-loop/approve - Approve staging fix
 * 
 * Flow:
 * 1. Developer reports issue in production
 * 2. Issue logged and prioritized
 * 3. Fixed in staging environment
 * 4. Developer invited to test staging
 * 5. Developer approves → Deploy to production
 * 6. Close feedback loop
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

// ============================================================================
// POST - Report Production Issue
// ============================================================================

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    const body = await request.json();
    const { description, severity, reproducible, steps, expectedBehavior, actualBehavior } = body;
    
    if (!description || !severity) {
      return jsonError('Missing required fields: description, severity', 400);
    }
    
    // Create staging feedback issue
    const issue = {
      reportedBy: session.id,
      reportedByEmail: session.email,
      description: description,
      severity: severity, // 'low' | 'medium' | 'high' | 'critical'
      reproducible: reproducible || false,
      stepsToReproduce: steps || '',
      expectedBehavior: expectedBehavior || '',
      actualBehavior: actualBehavior || '',
      
      // Staging workflow
      fixedInStaging: false,
      stagingTestUrl: null,
      testedByDeveloper: false,
      developerApproval: null,
      deployedToProduction: false,
      
      status: 'reported',
      priority: calculatePriority(severity, reproducible),
      
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'production',
    };
    
    const docRef = await firestore
      .collection('staging_feedback_issues')
      .add(issue);
    
    // Notify admin immediately for high/critical severity
    if (severity === 'high' || severity === 'critical') {
      await notifyAdminUrgent(session.email, description, severity);
    }
    
    console.log(`✅ Staging feedback issue created: ${docRef.id} (${severity})`);
    
    return jsonSuccess({
      id: docRef.id,
      ...issue,
      message: 'Issue reported successfully. Our team will investigate and fix in staging.',
      estimatedResolution: getEstimatedResolution(severity),
    }, 201);
    
  } catch (error) {
    console.error('❌ Error reporting issue:', error);
    return jsonError('Failed to report issue', 500);
  }
};

// ============================================================================
// GET - Get Staging Test Invitations
// ============================================================================

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    // Get staging test invites for this developer
    const snapshot = await firestore
      .collection('staging_feedback_issues')
      .where('reportedBy', '==', session.id)
      .where('fixedInStaging', '==', true)
      .where('testedByDeveloper', '==', false)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const testInvites = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        description: data.description,
        severity: data.severity,
        stagingTestUrl: data.stagingTestUrl,
        fixDescription: data.fixDescription,
        createdAt: data.createdAt,
        fixedAt: data.fixedAt,
      };
    });
    
    return jsonSuccess({ testInvites });
    
  } catch (error) {
    console.error('❌ Error fetching test invites:', error);
    return jsonError('Failed to fetch test invites', 500);
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function calculatePriority(severity: string, reproducible: boolean): string {
  if (severity === 'critical') return 'critical';
  if (severity === 'high' && reproducible) return 'high';
  if (severity === 'high' || severity === 'medium') return 'medium';
  return 'low';
}

function getEstimatedResolution(severity: string): string {
  switch (severity) {
    case 'critical': return '< 4 hours';
    case 'high': return '< 24 hours';
    case 'medium': return '< 72 hours';
    case 'low': return '< 1 week';
    default: return 'TBD';
  }
}

async function notifyAdminUrgent(userEmail: string, description: string, severity: string) {
  await firestore.collection('admin_notifications').add({
    type: 'urgent_api_issue',
    userEmail: userEmail,
    description: description,
    severity: severity,
    priority: 'urgent',
    read: false,
    createdAt: new Date(),
  });
  
  // TODO: Send email to admin
  console.log(`🚨 Urgent notification sent to admin: ${severity} issue from ${userEmail}`);
}

function jsonSuccess(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }, null, 2),
    {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  return isDevelopment ? 'localhost' : 'production';
}

