# 🛠️ Evaluation Management System - Implementation Guide

**Date:** 2025-11-16  
**Feature:** Centralized evaluation management for SuperAdmin and Admin  
**Status:** Ready to Implement  
**Estimated Effort:** 40-60 hours  

---

## 📋 Implementation Phases

### Phase 1: Backend Foundation (10-15 hours)

#### Step 1.1: Create Assignment Service

**File:** `src/lib/evaluation/assignment-service.ts`

```typescript
import { firestore, getEnvironmentSource } from '../firestore';
import type { EvaluationAssignment, AssignmentType } from '../../types/evaluation-management';

const COLLECTION = 'evaluation_assignments';

/**
 * Create new evaluation assignment
 */
export async function createAssignment(
  assignmentData: Omit<EvaluationAssignment, 'id' | 'createdAt' | 'updatedAt' | 'source'>
): Promise<EvaluationAssignment> {
  
  const assignment: Omit<EvaluationAssignment, 'id'> = {
    ...assignmentData,
    status: 'active',
    itemsReviewed: 0,
    itemsPending: 0,
    itemsApproved: 0,
    itemsRejected: 0,
    averageReviewTime: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: getEnvironmentSource()
  };
  
  const docRef = await firestore.collection(COLLECTION).add(assignment);
  
  console.log('✅ Assignment created:', docRef.id);
  
  return {
    id: docRef.id,
    ...assignment
  };
}

/**
 * Get assignments for supervisor (scoped)
 */
export async function getSupervisorAssignments(
  supervisorId: string,
  filters?: {
    status?: string;
    domainId?: string;
    agentId?: string;
  }
): Promise<EvaluationAssignment[]> {
  
  let query = firestore.collection(COLLECTION)
    .where('supervisorId', '==', supervisorId);
  
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  
  if (filters?.domainId) {
    query = query.where('domainId', '==', filters.domainId);
  }
  
  if (filters?.agentId) {
    query = query.where('agentId', '==', filters.agentId);
  }
  
  const snapshot = await query
    .orderBy('assignedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    assignedAt: doc.data().assignedAt.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as EvaluationAssignment[];
}

/**
 * Get assignments for evaluador (scoped)
 */
export async function getEvaluadorAssignments(
  evaluadorId: string
): Promise<EvaluationAssignment[]> {
  
  const snapshot = await firestore.collection(COLLECTION)
    .where('evaluadorIds', 'array-contains', evaluadorId)
    .where('status', '==', 'active')
    .orderBy('assignedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as EvaluationAssignment[];
}

/**
 * Assign evaluadores to assignment
 */
export async function assignEvaluadores(
  assignmentId: string,
  evaluadorIds: string[],
  evaluadorDetails: Array<{ userId: string; email: string; name: string; specialty?: string }>
): Promise<void> {
  
  await firestore.collection(COLLECTION).doc(assignmentId).update({
    evaluadorIds,
    evaluadorDetails: evaluadorDetails.map(e => ({
      ...e,
      assignedAt: new Date()
    })),
    updatedAt: new Date()
  });
  
  console.log('✅ Evaluadores assigned to:', assignmentId, evaluadorIds);
}

/**
 * Update assignment metrics
 */
export async function updateAssignmentMetrics(
  assignmentId: string,
  updates: {
    itemsReviewed?: number;
    itemsPending?: number;
    itemsApproved?: number;
    itemsRejected?: number;
    averageReviewTime?: number;
  }
): Promise<void> {
  
  await firestore.collection(COLLECTION).doc(assignmentId).update({
    ...updates,
    updatedAt: new Date()
  });
}
```

#### Step 1.2: Create Test Case Service

**File:** `src/lib/evaluation/test-case-service.ts`

```typescript
import { firestore, getEnvironmentSource } from '../firestore';
import type { EvaluationTestCase } from '../../types/evaluation-management';

const COLLECTION = 'evaluation_test_cases';

/**
 * Create test case from various sources
 */
export async function createTestCase(
  testCaseData: Omit<EvaluationTestCase, 'id' | 'testCount' | 'passCount' | 'failCount' | 'createdAt' | 'updatedAt' | 'source'>
): Promise<EvaluationTestCase> {
  
  const testCase: Omit<EvaluationTestCase, 'id'> = {
    ...testCaseData,
    testCount: 0,
    passCount: 0,
    failCount: 0,
    reviewStatus: 'pending',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: getEnvironmentSource()
  };
  
  const docRef = await firestore.collection(COLLECTION).add(testCase);
  
  console.log('✅ Test case created:', docRef.id);
  
  return {
    id: docRef.id,
    ...testCase
  };
}

/**
 * Get test cases for agent (scoped)
 */
export async function getTestCasesForAgent(
  agentId: string,
  filters?: {
    reviewStatus?: string;
    assignedSupervisorId?: string;
  }
): Promise<EvaluationTestCase[]> {
  
  let query = firestore.collection(COLLECTION)
    .where('agentId', '==', agentId)
    .where('isActive', '==', true);
  
  if (filters?.reviewStatus) {
    query = query.where('reviewStatus', '==', filters.reviewStatus);
  }
  
  if (filters?.assignedSupervisorId) {
    query = query.where('assignedSupervisorId', '==', filters.assignedSupervisorId);
  }
  
  const snapshot = await query
    .orderBy('priority', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as EvaluationTestCase[];
}

/**
 * Assign test case to supervisor/evaluadores
 */
export async function assignTestCase(
  testCaseId: string,
  supervisorId: string,
  supervisorEmail: string,
  evaluadorIds?: string[]
): Promise<void> {
  
  const updates: any = {
    assignedSupervisorId: supervisorId,
    assignedSupervisorEmail: supervisorEmail,
    assignedAt: new Date(),
    reviewStatus: 'in-review',
    updatedAt: new Date()
  };
  
  if (evaluadorIds && evaluadorIds.length > 0) {
    updates.assignedEvaluadorIds = evaluadorIds;
  }
  
  await firestore.collection(COLLECTION).doc(testCaseId).update(updates);
  
  console.log('✅ Test case assigned:', testCaseId, '→', supervisorId);
}

/**
 * Bulk assign test cases
 */
export async function bulkAssignTestCases(
  testCaseIds: string[],
  supervisorId: string,
  supervisorEmail: string,
  evaluadorIds?: string[]
): Promise<number> {
  
  const batch = firestore.batch();
  let count = 0;
  
  for (const testCaseId of testCaseIds) {
    const ref = firestore.collection(COLLECTION).doc(testCaseId);
    
    batch.update(ref, {
      assignedSupervisorId: supervisorId,
      assignedSupervisorEmail: supervisorEmail,
      assignedEvaluadorIds: evaluadorIds || [],
      assignedAt: new Date(),
      reviewStatus: 'in-review',
      updatedAt: new Date()
    });
    
    count++;
    
    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit();
    }
  }
  
  if (count % 450 !== 0) {
    await batch.commit();
  }
  
  console.log('✅ Bulk assigned', count, 'test cases to:', supervisorId);
  return count;
}

/**
 * Update test case review status
 */
export async function updateTestCaseReview(
  testCaseId: string,
  updates: {
    reviewStatus?: string;
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedByEmail?: string;
    correctionProposed?: boolean;
  }
): Promise<void> {
  
  await firestore.collection(COLLECTION).doc(testCaseId).update({
    ...updates,
    reviewedAt: new Date(),
    updatedAt: new Date()
  });
}

/**
 * Create test case from user feedback
 */
export async function createTestCaseFromFeedback(
  feedbackTicket: any
): Promise<EvaluationTestCase> {
  
  const testCase = await createTestCase({
    agentId: feedbackTicket.agentId || feedbackTicket.conversationId,
    agentName: feedbackTicket.agentName || 'Unknown Agent',
    domainId: feedbackTicket.domain || feedbackTicket.domainId,
    domainName: feedbackTicket.domainName || feedbackTicket.domain,
    organizationId: feedbackTicket.organizationId,
    
    question: feedbackTicket.originalFeedback?.comment || feedbackTicket.description,
    category: feedbackTicket.category || 'General',
    priority: feedbackTicket.priority || 'medium',
    
    sourceType: 'user-feedback',
    sourceId: feedbackTicket.id,
    
    createdFromFeedback: {
      feedbackId: feedbackTicket.feedbackId,
      messageId: feedbackTicket.messageId,
      userQuery: feedbackTicket.originalFeedback?.comment || '',
      aiResponse: feedbackTicket.description,
      userRating: feedbackTicket.originalFeedback?.rating,
      expertRating: feedbackTicket.originalFeedback?.rating
    },
    
    createdBy: feedbackTicket.reportedBy,
    createdByEmail: feedbackTicket.reportedByEmail,
    tags: [feedbackTicket.category, feedbackTicket.priority, 'from-feedback'],
    userImpact: feedbackTicket.userImpact || 'medium'
  });
  
  return testCase;
}
```

#### Step 1.3: Create Routing Service

**File:** `src/lib/evaluation/routing-service.ts`

```typescript
import { firestore, getEnvironmentSource } from '../firestore';
import { getDomainReviewConfig } from '../expert-review/domain-config-service';
import { calculateAutoRoutingPriority } from '../../types/evaluation-management';
import type { FeedbackRoutingMetadata } from '../../types/evaluation-management';

/**
 * Auto-route feedback to appropriate supervisor
 */
export async function autoRouteFeedback(
  feedbackId: string,
  feedback: any
): Promise<string | null> {
  
  console.log('🔀 Auto-routing feedback:', feedbackId);
  
  // 1. Determine domain
  const domainId = feedback.domainId || 
                   feedback.domain || 
                   extractDomainFromEmail(feedback.reportedByEmail);
  
  if (!domainId) {
    console.warn('⚠️ Cannot route: no domain identified');
    return null;
  }
  
  // 2. Load domain config
  const config = await getDomainReviewConfig(domainId);
  if (!config || config.supervisors.length === 0) {
    console.warn('⚠️ No supervisors configured for domain:', domainId);
    return null;
  }
  
  // 3. Calculate priority
  const priorityScore = calculateAutoRoutingPriority(feedback);
  
  // 4. Find supervisor with agent access (if agent-specific)
  if (feedback.agentId || feedback.conversationId) {
    const agentId = feedback.agentId || feedback.conversationId;
    const supervisor = await findSupervisorWithAgentAccess(config.supervisors, agentId);
    
    if (supervisor) {
      await assignFeedbackToSupervisor(feedbackId, supervisor.userId, {
        priorityScore,
        affectedAgents: [agentId],
        affectedDomains: [domainId],
        autoRoutedTo: supervisor.userId,
        routingReason: `Supervisor has access to agent ${agentId}`,
        routingConfidence: 95,
        calculatedAt: new Date(),
        calculatedBy: 'system'
      });
      
      return supervisor.userId;
    }
  }
  
  // 5. Load-balance across available supervisors
  const supervisor = await selectLeastLoadedSupervisor(config.supervisors);
  
  if (supervisor) {
    await assignFeedbackToSupervisor(feedbackId, supervisor.userId, {
      priorityScore,
      affectedAgents: feedback.agentId ? [feedback.agentId] : [],
      affectedDomains: [domainId],
      autoRoutedTo: supervisor.userId,
      routingReason: 'Load-balanced assignment',
      routingConfidence: 80,
      calculatedAt: new Date(),
      calculatedBy: 'system'
    });
    
    return supervisor.userId;
  }
  
  console.warn('⚠️ No available supervisor found for domain:', domainId);
  return null;
}

/**
 * Find supervisor with access to specific agent
 */
async function findSupervisorWithAgentAccess(
  supervisors: Array<{ userId: string }>,
  agentId: string
): Promise<{ userId: string } | null> {
  
  // Check agent sharing
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  const sharedWithUserIds = sharesSnapshot.docs.flatMap(doc => 
    doc.data().sharedWith?.map((s: any) => s.userId) || []
  );
  
  // Find first supervisor with access
  const supervisorWithAccess = supervisors.find(s => 
    sharedWithUserIds.includes(s.userId)
  );
  
  return supervisorWithAccess || null;
}

/**
 * Select least loaded supervisor
 */
async function selectLeastLoadedSupervisor(
  supervisors: Array<{ userId: string; activeAssignments?: number }>
): Promise<{ userId: string } | null> {
  
  if (supervisors.length === 0) return null;
  
  // Get current workloads
  const workloads = await Promise.all(
    supervisors.map(async s => {
      const assignmentsSnapshot = await firestore
        .collection('evaluation_assignments')
        .where('supervisorId', '==', s.userId)
        .where('status', '==', 'active')
        .get();
      
      const feedbackSnapshot = await firestore
        .collection('feedback_tickets')
        .where('assignedSupervisorId', '==', s.userId)
        .where('reviewStatus', 'in', ['pendiente', 'en-revision', 'corregida-propuesta'])
        .get();
      
      return {
        userId: s.userId,
        load: assignmentsSnapshot.size + feedbackSnapshot.size
      };
    })
  );
  
  // Sort by load (ascending) and pick first
  workloads.sort((a, b) => a.load - b.load);
  
  return workloads[0] ? { userId: workloads[0].userId } : null;
}

/**
 * Assign feedback to supervisor
 */
async function assignFeedbackToSupervisor(
  feedbackId: string,
  supervisorId: string,
  routingMetadata: FeedbackRoutingMetadata
): Promise<void> {
  
  await firestore.collection('feedback_tickets').doc(feedbackId).update({
    assignedSupervisorId: supervisorId,
    routingScore: routingMetadata,
    autoRoutedAt: new Date(),
    updatedAt: new Date()
  });
}

/**
 * Extract domain from email
 */
function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : null;
}
```

---

### Phase 2: API Endpoints (8-12 hours)

#### API 1: Assignment Management

**File:** `src/pages/api/evaluation/assignments/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  createAssignment,
  getSupervisorAssignments,
  getEvaluadorAssignments
} from '../../../../lib/evaluation/assignment-service';
import { canAccessEvaluationManagement } from '../../../../types/evaluation-management';

/**
 * GET /api/evaluation/assignments
 * List assignments (scoped by role)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Feature flag check
    const featureEnabled = process.env.ENABLE_EVALUATION_MANAGEMENT === 'true';
    if (!canAccessEvaluationManagement({ role: session.role, email: session.email }, featureEnabled)) {
      return new Response(JSON.stringify({ error: 'Feature not enabled or insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const supervisorId = url.searchParams.get('supervisorId');
    const evaluadorId = url.searchParams.get('evaluadorId');
    const domainId = url.searchParams.get('domainId');
    const agentId = url.searchParams.get('agentId');
    
    let assignments = [];
    
    // Scope based on query params and role
    if (supervisorId) {
      // Verify access
      if (session.role !== 'superadmin' && supervisorId !== session.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      assignments = await getSupervisorAssignments(supervisorId, { domainId, agentId });
    } else if (evaluadorId) {
      // Verify access
      if (session.role !== 'superadmin' && evaluadorId !== session.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      assignments = await getEvaluadorAssignments(evaluadorId);
    } else {
      return new Response(JSON.stringify({ error: 'supervisorId or evaluadorId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ assignments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error getting assignments:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/evaluation/assignments
 * Create new assignment
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only Admin or SuperAdmin can create assignments
    if (!['admin', 'superadmin'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.assignmentType || !body.supervisorId || !body.domainId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Domain access check for admin
    if (session.role === 'admin') {
      const userDomain = session.email.split('@')[1];
      if (body.domainId !== userDomain) {
        return new Response(JSON.stringify({ error: 'Forbidden - Domain access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    const assignment = await createAssignment({
      ...body,
      assignedBy: session.id,
      assignedByEmail: session.email,
      assignedByRole: session.role as 'admin' | 'superadmin'
    });
    
    return new Response(JSON.stringify({ assignment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

#### API 2: Test Case Management

**File:** `src/pages/api/evaluation/test-cases/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { 
  getTestCasesForAgent,
  assignTestCase,
  bulkAssignTestCases
} from '../../../../lib/evaluation/test-case-service';

/**
 * GET /api/evaluation/test-cases
 * List test cases (scoped by role and access)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId');
    const supervisorId = url.searchParams.get('supervisorId');
    const evaluadorId = url.searchParams.get('evaluadorId');
    const domainId = url.searchParams.get('domainId');
    
    if (!agentId && !supervisorId && !evaluadorId && !domainId) {
      return new Response(JSON.stringify({ error: 'At least one filter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let testCases = [];
    
    if (agentId) {
      testCases = await getTestCasesForAgent(agentId, {
        assignedSupervisorId: supervisorId || undefined
      });
    }
    // Add other filter logic...
    
    return new Response(JSON.stringify({ testCases }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error getting test cases:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/evaluation/test-cases/bulk-assign
 * Bulk assign test cases
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only Admin/SuperAdmin can bulk assign
    if (!['admin', 'superadmin'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { testCaseIds, supervisorId, supervisorEmail, evaluadorIds } = body;
    
    if (!testCaseIds || !supervisorId || !supervisorEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const count = await bulkAssignTestCases(
      testCaseIds,
      supervisorId,
      supervisorEmail,
      evaluadorIds
    );
    
    return new Response(JSON.stringify({ 
      success: true,
      assignedCount: count
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error bulk assigning test cases:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

### Phase 3: Frontend Components (15-20 hours)

#### Component 1: Evaluation Management Dashboard

**File:** `src/components/EvaluationManagementDashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Settings, AlertCircle } from 'lucide-react';
import type { EvaluationDashboardSummary, EvaluationAssignment } from '../types/evaluation-management';

interface Props {
  userRole: 'admin' | 'superadmin';
  userEmail: string;
  userId: string;
}

export default function EvaluationManagementDashboard({ userRole, userEmail, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'queue' | 'results'>('overview');
  const [summary, setSummary] = useState<EvaluationDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load dashboard summary
  useEffect(() => {
    loadSummary();
  }, [userId]);
  
  const loadSummary = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/evaluation/dashboard-summary?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Gestión de Evaluaciones
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {userRole === 'superadmin' ? 'Vista Global - Todas las Organizaciones' : 'Vista de Dominio'}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-blue-800">{summary?.totalPendingReviews || 0}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium">Críticos</p>
              <p className="text-2xl font-bold text-red-800">{summary?.criticalItems || 0}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-600 font-medium">Vencidos</p>
              <p className="text-2xl font-bold text-yellow-800">{summary?.overdueItems || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {summary && summary.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {summary.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-600' :
                  alert.severity === 'high' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">{alert.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{alert.actionRequired}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex gap-1 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Resumen de Asignaciones
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'queue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Cola de Feedback
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Gestión de Casos
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Resultados
            </div>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && <AssignmentOverviewTab summary={summary} userRole={userRole} />}
        {activeTab === 'queue' && <FeedbackQueueTab userId={userId} userRole={userRole} />}
        {activeTab === 'assignments' && <TestCaseManagementTab userId={userId} userRole={userRole} />}
        {activeTab === 'results' && <EvaluationResultsTab userId={userId} userRole={userRole} />}
      </div>
    </div>
  );
}

// Placeholder sub-components (implement in Phase 3)
function AssignmentOverviewTab({ summary, userRole }: any) {
  return <div>Assignment Overview (TODO)</div>;
}

function FeedbackQueueTab({ userId, userRole }: any) {
  return <div>Feedback Queue (TODO)</div>;
}

function TestCaseManagementTab({ userId, userRole }: any) {
  return <div>Test Case Management (TODO)</div>;
}

function EvaluationResultsTab({ userId, userRole }: any) {
  return <div>Evaluation Results (TODO)</div>;
}
```

---

### Phase 4: Feature Flag Integration (2-3 hours)

#### Environment Configuration

**File:** `.env` (add this variable)

```bash
# Evaluation Management System (SuperAdmin only initially)
ENABLE_EVALUATION_MANAGEMENT=false
```

#### Feature Flag Service

**File:** `src/lib/feature-flags.ts`

```typescript
/**
 * Feature flags for gradual rollout
 */
export const FeatureFlags = {
  // Evaluation Management System
  EVALUATION_MANAGEMENT: process.env.ENABLE_EVALUATION_MANAGEMENT === 'true',
  
  // Add other feature flags here...
} as const;

/**
 * Check if user can access feature
 */
export function canAccessFeature(
  feature: keyof typeof FeatureFlags,
  user: { role: string; email: string }
): boolean {
  if (!FeatureFlags[feature]) return false;
  
  switch (feature) {
    case 'EVALUATION_MANAGEMENT':
      // Initially SuperAdmin only
      return user.role === 'superadmin';
    
    default:
      return false;
  }
}

/**
 * Get feature flag status for user
 */
export function getFeatureFlagsForUser(user: { role: string; email: string }) {
  return {
    evaluationManagement: canAccessFeature('EVALUATION_MANAGEMENT', user),
    // Other features...
  };
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Review design document: `EVALUATION_MANAGEMENT_SYSTEM_ENHANCEMENT.md`
- [ ] Confirm all new fields are optional (backward compatibility)
- [ ] Create feature branch: `feat/evaluation-management-2025-11-16`
- [ ] Set `ENABLE_EVALUATION_MANAGEMENT=false` in `.env`

### Phase 1: Backend (Localhost)

- [ ] Create types: `src/types/evaluation-management.ts` ✅
- [ ] Create assignment service
- [ ] Create test case service
- [ ] Create routing service
- [ ] Test services in isolation
- [ ] Add indexes to `firestore.indexes.json` ✅
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes --project=salfagpt`
- [ ] Verify indexes in READY state

### Phase 2: APIs (Localhost)

- [ ] Create `/api/evaluation/assignments`
- [ ] Create `/api/evaluation/test-cases`
- [ ] Create `/api/evaluation/feedback-queue`
- [ ] Create `/api/evaluation/my-assignments`
- [ ] Test with Postman/curl
- [ ] Verify role-based access control
- [ ] Test scope filtering (domain, agent, etc.)

### Phase 3: Frontend (Localhost)

- [ ] Create `EvaluationManagementDashboard.tsx`
- [ ] Create `AssignmentOverviewTab.tsx`
- [ ] Create `FeedbackQueueTab.tsx`
- [ ] Create `TestCaseManagementTab.tsx`
- [ ] Create `EvaluationResultsTab.tsx`
- [ ] Add menu item (feature flag gated)
- [ ] Test as SuperAdmin
- [ ] Verify mobile responsive

### Phase 4: Testing

- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] E2E test: Create assignment
- [ ] E2E test: Route feedback
- [ ] E2E test: Bulk assign test cases
- [ ] Multi-user testing (SuperAdmin, Admin, Supervisor, Evaluador)
- [ ] Performance testing (large datasets)

### Phase 5: Documentation

- [ ] Update `data.mdc` with new collections ✅
- [ ] Create admin user guide
- [ ] Create supervisor workflow guide
- [ ] Create evaluador workflow guide
- [ ] API documentation
- [ ] Update README with feature flag

### Phase 6: Rollout

**Week 1: SuperAdmin Only**
- [ ] Enable flag for SuperAdmin in production
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Refine based on feedback

**Week 2: Add Admins**
- [ ] Update feature flag to include Admin
- [ ] Test with domain admins
- [ ] Monitor performance
- [ ] Verify scope isolation

**Week 3: Add Supervisors**
- [ ] Enable for Supervisor role
- [ ] Test supervisor workflows
- [ ] Verify assignment routing
- [ ] Check performance at scale

**Week 4: Full Rollout**
- [ ] Enable for all roles
- [ ] Monitor adoption
- [ ] Track metrics
- [ ] Plan enhancements

---

## ✅ Success Criteria

### Technical

- [ ] All indexes deployed and READY
- [ ] All APIs respond < 1s (p95)
- [ ] Zero TypeScript errors
- [ ] Zero console errors in browser
- [ ] Backward compatible (old code works)
- [ ] Feature flag works correctly

### Functional

- [ ] SuperAdmin can view all assignments
- [ ] Admin can view own domain assignments
- [ ] Supervisor can see assigned work
- [ ] Evaluador can see assigned work
- [ ] Auto-routing assigns to correct supervisor
- [ ] Bulk assignment works for 100+ items
- [ ] Feedback from all sources appears in queue

### Performance

- [ ] Dashboard loads < 2s
- [ ] Assignment creation < 500ms
- [ ] Bulk assign 100 items < 3s
- [ ] Query response < 1s
- [ ] No N+1 queries

### User Experience

- [ ] Intuitive UI
- [ ] Clear scope indicators
- [ ] Easy assignment workflow
- [ ] Helpful error messages
- [ ] Mobile responsive

---

**Status:** Ready to implement  
**Next Step:** Begin Phase 1 with services creation  
**Risk:** Low (additive, feature-flagged, backward compatible)

