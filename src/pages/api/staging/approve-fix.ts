/**
 * Approve Staging Fix
 * 
 * POST /api/staging/approve-fix - Developer approves staging fix
 * 
 * Flow:
 * 1. Developer tests fix in staging
 * 2. Developer approves (or rejects)
 * 3. If approved → Schedule production deployment
 * 4. Notify developer when live
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return jsonError('Unauthorized', 401);
    }
    
    const body = await request.json();
    const { issueId, approved, feedback } = body;
    
    if (!issueId || approved === undefined) {
      return jsonError('Missing required fields: issueId, approved', 400);
    }
    
    // Get issue
    const issueDoc = await firestore
      .collection('staging_feedback_issues')
      .doc(issueId)
      .get();
    
    if (!issueDoc.exists) {
      return jsonError('Issue not found', 404);
    }
    
    const issue = issueDoc.data();
    
    // Verify ownership
    if (issue?.reportedBy !== session.id) {
      return jsonError('Forbidden - not your issue', 403);
    }
    
    // Update issue
    await firestore
      .collection('staging_feedback_issues')
      .doc(issueId)
      .update({
        testedByDeveloper: true,
        developerApproval: approved,
        developerFeedback: feedback || '',
        testedAt: new Date(),
        updatedAt: new Date(),
        status: approved ? 'approved_for_production' : 'rejected_needs_revision',
      });
    
    if (approved) {
      // Schedule production deployment
      await scheduleProductionDeployment(issueId, issue);
      
      return jsonSuccess({
        message: 'Fix approved! Scheduled for production deployment.',
        estimatedDeployment: 'Within 24 hours',
        notificationMethod: 'Email when live',
      });
    } else {
      // Notify team that fix needs revision
      await notifyRevisionNeeded(issueId, feedback);
      
      return jsonSuccess({
        message: 'Feedback submitted. Team will revise the fix.',
        estimatedResolution: 'Within 48 hours',
      });
    }
    
  } catch (error) {
    console.error('❌ Error approving fix:', error);
    return jsonError('Failed to process approval', 500);
  }
};

async function scheduleProductionDeployment(issueId: string, issue: any) {
  await firestore.collection('production_deployment_queue').add({
    type: 'staging_fix',
    issueId: issueId,
    severity: issue.severity,
    approvedBy: issue.reportedBy,
    approvedAt: new Date(),
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    status: 'scheduled',
    createdAt: new Date(),
  });
  
  console.log(`📅 Production deployment scheduled for issue: ${issueId}`);
}

async function notifyRevisionNeeded(issueId: string, feedback: string) {
  await firestore.collection('admin_notifications').add({
    type: 'staging_fix_rejected',
    issueId: issueId,
    developerFeedback: feedback,
    priority: 'high',
    read: false,
    createdAt: new Date(),
  });
  
  console.log(`🔄 Revision notification sent for issue: ${issueId}`);
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

