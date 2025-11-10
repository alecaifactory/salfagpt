/**
 * Promotion Workflow Library
 * 
 * Manages staging-to-production promotion workflow with:
 * - Dual approval (org admin + superadmin)
 * - Conflict detection
 * - Snapshot system for rollback
 * - Data lineage tracking
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import { firestore, COLLECTIONS } from './firestore.js';
import type {
  PromotionRequest,
  PromotionStatus,
  PromotionSnapshot,
  Conflict,
  ConflictResolution,
  DataLineageEvent,
  DataSource
} from '../types/organizations.js';

/**
 * ========================================
 * PROMOTION REQUEST OPERATIONS
 * ========================================
 */

/**
 * Create promotion request
 * Initiates workflow to promote changes from staging to production
 */
export async function createPromotionRequest(input: {
  organizationId: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  requestedBy: string;
  changes: Array<{ field: string; oldValue: any; newValue: any }>;
}): Promise<PromotionRequest> {
  try {
    const requestRef = firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc();
    
    const now = new Date();
    const request: PromotionRequest = {
      id: requestRef.id,
      organizationId: input.organizationId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      sourceEnvironment: 'staging',
      destinationEnvironment: 'production',
      changes: input.changes,
      status: 'pending',
      requestedBy: input.requestedBy,
      requestedAt: now,
      approvals: [],
      createdAt: now,
      updatedAt: now,
    };
    
    await requestRef.set(request);
    
    console.log('✅ Promotion request created:', request.id);
    
    return request;
  } catch (error) {
    console.error('❌ Error creating promotion request:', error);
    throw error;
  }
}

/**
 * Get promotion request by ID
 */
export async function getPromotionRequest(requestId: string): Promise<PromotionRequest | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.PROMOTION_REQUESTS)
      .doc(requestId)
      .get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      requestedAt: data?.requestedAt?.toDate?.() || data?.requestedAt,
      executedAt: data?.executedAt?.toDate?.() || data?.executedAt,
      createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
    } as PromotionRequest;
  } catch (error) {
    console.error('❌ Error getting promotion request:', error);
    return null;
  }
}

/**
 * List promotion requests for organization
 */
export async function listPromotionRequests(
  organizationId: string,
  status?: PromotionStatus
): Promise<PromotionRequest[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.PROMOTION_REQUESTS)
      .where('organizationId', '==', organizationId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        requestedAt: data?.requestedAt?.toDate?.() || data?.requestedAt,
        executedAt: data?.executedAt?.toDate?.() || data?.executedAt,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
      } as PromotionRequest;
    });
  } catch (error) {
    console.error('❌ Error listing promotion requests:', error);
    return [];
  }
}

/**
 * ========================================
 * APPROVAL WORKFLOW (Best Practice #7)
 * ========================================
 */

/**
 * Approve promotion request
 * Requires both org admin + superadmin approval
 */
export async function approvePromotion(
  requestId: string,
  approverId: string,
  role: 'admin' | 'superadmin',
  notes?: string
): Promise<void> {
  try {
    const requestRef = firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new Error(`Promotion request ${requestId} not found`);
    }
    
    const request = requestDoc.data() as PromotionRequest;
    
    // Check if already approved by this role
    const alreadyApproved = request.approvals?.some(a => a.role === role);
    if (alreadyApproved) {
      console.log('ℹ️ Already approved by', role);
      return;
    }
    
    // Add approval
    const approval = {
      userId: approverId,
      role,
      approvedAt: new Date(),
      notes,
    };
    
    const approvals = [...(request.approvals || []), approval];
    
    // Check if both approvals present
    const hasOrgAdmin = approvals.some(a => a.role === 'admin');
    const hasSuperAdmin = approvals.some(a => a.role === 'superadmin');
    
    const newStatus: PromotionStatus = 
      hasOrgAdmin && hasSuperAdmin ? 'approved-super' :
      hasOrgAdmin ? 'approved-org' :
      'pending';
    
    await requestRef.update({
      approvals,
      status: newStatus,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Promotion approved by ${role}:`, requestId, `→ status: ${newStatus}`);
    
    // If fully approved, could auto-execute (or wait for manual trigger)
    if (newStatus === 'approved-super') {
      console.log('🎯 Promotion fully approved - ready to execute');
    }
  } catch (error) {
    console.error('❌ Error approving promotion:', error);
    throw error;
  }
}

/**
 * Reject promotion request
 */
export async function rejectPromotion(
  requestId: string,
  rejecterId: string,
  role: 'admin' | 'superadmin',
  reason: string
): Promise<void> {
  try {
    const requestRef = firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new Error(`Promotion request ${requestId} not found`);
    }
    
    const request = requestDoc.data() as PromotionRequest;
    
    const rejection = {
      userId: rejecterId,
      role,
      rejectedAt: new Date(),
      reason,
    };
    
    await requestRef.update({
      rejections: [...(request.rejections || []), rejection],
      status: 'rejected',
      updatedAt: new Date(),
    });
    
    console.log('✅ Promotion rejected by', role, ':', requestId);
  } catch (error) {
    console.error('❌ Error rejecting promotion:', error);
    throw error;
  }
}

/**
 * ========================================
 * CONFLICT DETECTION (Best Practice #1)
 * ========================================
 */

/**
 * Detect conflicts between staging and production versions
 */
export async function detectConflicts(
  stagingDoc: any,
  productionDoc: any
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];
  
  // Check version mismatch
  const stagingProdVersion = stagingDoc.productionVersion || 0;
  const actualProdVersion = productionDoc.version || 0;
  
  if (stagingProdVersion !== actualProdVersion) {
    // Production was modified since staging branched
    // Find which fields conflict
    const stagingFields = Object.keys(stagingDoc);
    
    for (const field of stagingFields) {
      // Skip metadata fields
      if (['id', 'createdAt', 'updatedAt', 'version', 'source'].includes(field)) {
        continue;
      }
      
      const stagingValue = stagingDoc[field];
      const prodValue = productionDoc[field];
      
      // Check if values differ
      if (JSON.stringify(stagingValue) !== JSON.stringify(prodValue)) {
        conflicts.push({
          id: `conflict-${field}-${Date.now()}`,
          field,
          stagingValue,
          productionValue,
          stagingVersion: stagingDoc.version || 0,
          productionVersion: actualProdVersion,
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Resolve conflict
 */
export async function resolveConflict(
  requestId: string,
  conflictId: string,
  resolution: ConflictResolution,
  resolvedBy: string
): Promise<void> {
  try {
    const requestRef = firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      throw new Error(`Promotion request ${requestId} not found`);
    }
    
    const request = requestDoc.data() as PromotionRequest;
    const conflicts = request.conflicts || [];
    
    // Update conflict resolution
    const updatedConflicts = conflicts.map(c => 
      c.id === conflictId 
        ? { ...c, resolved: true, resolution }
        : c
    );
    
    // Track resolution
    const resolutionRecord = {
      conflictId,
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    };
    
    await requestRef.update({
      conflicts: updatedConflicts,
      conflictResolutions: [...(request.conflictResolutions || []), resolutionRecord],
      updatedAt: new Date(),
    });
    
    console.log('✅ Conflict resolved:', conflictId, '→', resolution);
  } catch (error) {
    console.error('❌ Error resolving conflict:', error);
    throw error;
  }
}

/**
 * ========================================
 * PROMOTION EXECUTION
 * ========================================
 */

/**
 * Execute promotion (apply changes from staging to production)
 */
export async function executePromotion(
  requestId: string,
  executedBy: string
): Promise<void> {
  try {
    const request = await getPromotionRequest(requestId);
    if (!request) {
      throw new Error(`Promotion request ${requestId} not found`);
    }
    
    // Verify fully approved
    if (request.status !== 'approved-super') {
      throw new Error(`Promotion not fully approved. Status: ${request.status}`);
    }
    
    // Check for unresolved conflicts
    const unresolvedConflicts = request.conflicts?.filter(c => !c.resolved) || [];
    if (unresolvedConflicts.length > 0) {
      throw new Error(`${unresolvedConflicts.length} unresolved conflicts`);
    }
    
    // Update status to executing
    await firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId).update({
      status: 'executing',
      updatedAt: new Date(),
    });
    
    // Create snapshot before changes (for rollback)
    const snapshot = await createPromotionSnapshot(request);
    
    // Execute promotion (apply changes)
    const success = await applyPromotionChanges(request);
    
    // Update request with result
    await firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId).update({
      status: success ? 'completed' : 'failed',
      executedAt: new Date(),
      executedBy,
      executionResult: {
        success,
        message: success ? 'Promotion completed successfully' : 'Promotion failed',
        snapshotId: snapshot.id,
      },
      updatedAt: new Date(),
    });
    
    console.log(success ? '✅ Promotion executed successfully' : '❌ Promotion execution failed');
  } catch (error) {
    console.error('❌ Error executing promotion:', error);
    
    // Mark as failed
    await firestore.collection(COLLECTIONS.PROMOTION_REQUESTS).doc(requestId).update({
      status: 'failed',
      executionResult: {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      updatedAt: new Date(),
    });
    
    throw error;
  }
}

/**
 * Apply promotion changes to production
 * Internal function used by executePromotion
 */
async function applyPromotionChanges(request: PromotionRequest): Promise<boolean> {
  try {
    // Get the staging document
    // Note: This would need access to staging Firestore
    // For now, changes are in the request.changes array
    
    // Build update object from changes
    const updateData: any = {
      updatedAt: new Date(),
      version: (request.changes[0].newValue?.version || 1) + 1,
      lastModifiedIn: 'production',
      promotedFromStaging: true,
      promotedAt: new Date(),
      stagingId: request.resourceId,
    };
    
    // Apply each change
    request.changes.forEach(change => {
      updateData[change.field] = change.newValue;
    });
    
    // Update production document
    const collection = getCollectionForResourceType(request.resourceType);
    await firestore
      .collection(collection)
      .doc(request.resourceId)
      .update(updateData);
    
    // Track in data lineage
    await trackDataLineage({
      documentId: request.resourceId,
      collection,
      action: 'promoted',
      source: 'production',
      organizationId: request.organizationId,
      performedBy: request.requestedBy,
      changes: request.changes,
      promotionRequestId: request.id,
      previousSource: 'staging',
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error applying promotion changes:', error);
    return false;
  }
}

/**
 * Get collection name for resource type
 */
function getCollectionForResourceType(resourceType: string): string {
  const mapping: Record<string, string> = {
    'agent': COLLECTIONS.CONVERSATIONS,
    'conversation': COLLECTIONS.CONVERSATIONS,
    'context_source': COLLECTIONS.CONTEXT_SOURCES,
    'user': COLLECTIONS.USERS,
  };
  
  return mapping[resourceType] || resourceType;
}

/**
 * ========================================
 * SNAPSHOT SYSTEM (Best Practice #10)
 * ========================================
 */

/**
 * Create promotion snapshot for rollback capability
 */
export async function createPromotionSnapshot(
  request: PromotionRequest
): Promise<PromotionSnapshot> {
  try {
    const snapshotRef = firestore.collection(COLLECTIONS.PROMOTION_SNAPSHOTS).doc();
    
    // Get current production state
    const collection = getCollectionForResourceType(request.resourceType);
    const prodDoc = await firestore
      .collection(collection)
      .doc(request.resourceId)
      .get();
    
    const snapshot: PromotionSnapshot = {
      id: snapshotRef.id,
      promotionRequestId: request.id,
      organizationId: request.organizationId,
      beforeState: {
        resourceId: request.resourceId,
        resourceType: request.resourceType,
        data: prodDoc.exists ? prodDoc.data() : null,
        version: prodDoc.exists ? (prodDoc.data()?.version || 1) : 0,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
    
    await snapshotRef.set(snapshot);
    
    console.log('📸 Snapshot created:', snapshot.id);
    
    return snapshot;
  } catch (error) {
    console.error('❌ Error creating snapshot:', error);
    throw error;
  }
}

/**
 * Rollback to snapshot
 * Restores production state from before promotion
 */
export async function rollbackToSnapshot(snapshotId: string): Promise<void> {
  try {
    const snapshotDoc = await firestore
      .collection(COLLECTIONS.PROMOTION_SNAPSHOTS)
      .doc(snapshotId)
      .get();
    
    if (!snapshotDoc.exists) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }
    
    const snapshot = snapshotDoc.data() as PromotionSnapshot;
    
    // Check if snapshot expired
    const expiresAt = snapshot.expiresAt?.toDate?.() || snapshot.expiresAt;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      throw new Error('Snapshot has expired (>90 days old)');
    }
    
    // Restore production state
    const collection = getCollectionForResourceType(snapshot.beforeState.resourceType);
    
    if (snapshot.beforeState.data) {
      await firestore
        .collection(collection)
        .doc(snapshot.beforeState.resourceId)
        .set({
          ...snapshot.beforeState.data,
          updatedAt: new Date(),
          lastModifiedIn: 'production',
        });
    } else {
      // Document didn't exist before - delete it
      await firestore
        .collection(collection)
        .doc(snapshot.beforeState.resourceId)
        .delete();
    }
    
    console.log('✅ Rolled back to snapshot:', snapshotId);
  } catch (error) {
    console.error('❌ Error rolling back:', error);
    throw error;
  }
}

/**
 * ========================================
 * DATA LINEAGE (Best Practice #9)
 * ========================================
 */

/**
 * Track data lineage event
 * Complete audit trail of data journey
 */
export async function trackDataLineage(event: Omit<DataLineageEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    const lineageRef = firestore.collection(COLLECTIONS.DATA_LINEAGE).doc();
    
    const lineageEvent: DataLineageEvent = {
      id: lineageRef.id,
      ...event,
      timestamp: new Date(),
    };
    
    await lineageRef.set(lineageEvent);
    
    console.log('📝 Data lineage tracked:', event.action, event.documentId);
  } catch (error) {
    // Non-critical - don't throw
    console.warn('⚠️ Failed to track data lineage (non-critical):', error);
  }
}

/**
 * Get data lineage for document
 */
export async function getDocumentLineage(
  collection: string,
  documentId: string
): Promise<DataLineageEvent[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.DATA_LINEAGE)
      .where('collection', '==', collection)
      .where('documentId', '==', documentId)
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        timestamp: data?.timestamp?.toDate?.() || data?.timestamp,
      } as DataLineageEvent;
    });
  } catch (error) {
    console.error('❌ Error getting document lineage:', error);
    return [];
  }
}

/**
 * Get organization lineage (all events for an org)
 */
export async function getOrganizationLineage(
  organizationId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }
): Promise<DataLineageEvent[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.DATA_LINEAGE)
      .where('organizationId', '==', organizationId);
    
    if (options?.action) {
      query = query.where('action', '==', options.action);
    }
    
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(1000)  // Prevent huge queries
      .get();
    
    let events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        timestamp: data?.timestamp?.toDate?.() || data?.timestamp,
      } as DataLineageEvent;
    });
    
    // Filter by date range (client-side if needed)
    if (options?.startDate) {
      events = events.filter(e => new Date(e.timestamp) >= options.startDate!);
    }
    if (options?.endDate) {
      events = events.filter(e => new Date(e.timestamp) <= options.endDate!);
    }
    
    return events;
  } catch (error) {
    console.error('❌ Error getting organization lineage:', error);
    return [];
  }
}

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */

/**
 * Check if promotion is ready to execute
 */
export function isPromotionReadyToExecute(request: PromotionRequest): boolean {
  // Must be fully approved
  if (request.status !== 'approved-super') return false;
  
  // All conflicts must be resolved
  const unresolvedConflicts = request.conflicts?.filter(c => !c.resolved) || [];
  if (unresolvedConflicts.length > 0) return false;
  
  return true;
}

/**
 * Get promotion request summary for display
 */
export function getPromotionSummary(request: PromotionRequest): string {
  const changesCount = request.changes.length;
  const conflictsCount = request.conflicts?.length || 0;
  const unresolvedCount = request.conflicts?.filter(c => !c.resolved).length || 0;
  
  return `${request.resourceType} "${request.resourceName}" | ${changesCount} changes | ${conflictsCount} conflicts (${unresolvedCount} unresolved)`;
}

