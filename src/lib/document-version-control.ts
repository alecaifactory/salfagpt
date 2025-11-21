/**
 * Document Version Control System
 * 
 * Manages document versions, history, and weighting for RAG
 * 
 * Features:
 * - Version tracking
 * - History management
 * - Version weighting for search results
 * - Supersession relationships
 */

import { firestore, COLLECTIONS } from './firestore';
import type { RAGSearchResult } from './rag-search';

// ============================================================================
// Types
// ============================================================================

export interface DocumentVersion {
  id: string;
  sourceId: string; // Current version source ID
  parentSourceId?: string; // Previous version source ID
  
  version: number; // Version number (1, 2, 3, ...)
  versionTag: string; // Human-readable tag (e.g., "2025-11-18", "v2.0", "latest")
  
  date: Date;
  url?: string;
  
  isLatest: boolean;
  supersedes?: string; // Previous version sourceId
  supersededBy?: string; // Newer version sourceId
  
  metadata: {
    updateType: 'manual' | 'automatic' | 'internet_refresh' | 'admin_upload';
    changes?: string[];
    approvedBy?: string;
    updateRequestId?: string;
    originalUploadDate?: Date;
  };
  
  tags?: string[];
  userId: string;
  domainId?: string;
  
  createdAt: Date;
  createdBy: string;
}

export interface DocumentUpdateRequest {
  id: string;
  sourceId: string;
  userId: string;
  agentId: string;
  domainId?: string;
  
  originalDocument: {
    name: string;
    url?: string;
    version: string;
    date: Date;
  };
  
  proposedUpdate: {
    url: string;
    date: Date;
    preview: string;
    estimatedChanges?: string[];
  };
  
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  
  requestedBy: string;
  requestedAt: Date;
  
  approvedBy?: string;
  approvedAt?: Date;
  
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  processedAt?: Date;
  newSourceId?: string;
  
  error?: string;
}

export interface DocumentUpdateLog {
  id: string;
  updateRequestId?: string;
  sourceId: string;
  timestamp: Date;
  
  action: 'check_started' | 'update_found' | 'update_requested' | 'update_approved' | 
          'update_rejected' | 'update_processing' | 'update_completed' | 'update_failed';
  
  userId: string;
  details: Record<string, any>;
}

// ============================================================================
// Version Management
// ============================================================================

/**
 * Create a new document version record
 */
export async function createDocumentVersion(
  version: Omit<DocumentVersion, 'id' | 'createdAt'>
): Promise<DocumentVersion> {
  const versionRef = firestore.collection('document_versions').doc();
  
  const versionData: DocumentVersion = {
    id: versionRef.id,
    ...version,
    createdAt: new Date()
  };
  
  await versionRef.set(versionData);
  
  console.log(`📝 Document version created: ${versionRef.id} (${version.versionTag})`);
  
  // If this is the latest version, mark previous versions as not latest
  if (version.isLatest && version.supersedes) {
    await markVersionAsSuperseded(version.supersedes, versionData.sourceId);
  }
  
  return versionData;
}

/**
 * Mark a version as superseded by a newer version
 */
async function markVersionAsSuperseded(
  oldVersionSourceId: string,
  newVersionSourceId: string
): Promise<void> {
  const versionsSnapshot = await firestore
    .collection('document_versions')
    .where('sourceId', '==', oldVersionSourceId)
    .get();
  
  const batch = firestore.batch();
  
  versionsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      isLatest: false,
      supersededBy: newVersionSourceId
    });
  });
  
  await batch.commit();
  
  console.log(`   Marked version ${oldVersionSourceId} as superseded by ${newVersionSourceId}`);
}

/**
 * Get version history for a document (all versions)
 */
export async function getDocumentVersionHistory(
  sourceId: string
): Promise<DocumentVersion[]> {
  // Find the root document (the original one)
  let currentVersion = await getVersionBySourceId(sourceId);
  
  if (!currentVersion) {
    // This source has no version tracking yet
    return [];
  }
  
  // Walk backwards to find root
  while (currentVersion.parentSourceId) {
    const parent = await getVersionBySourceId(currentVersion.parentSourceId);
    if (!parent) break;
    currentVersion = parent;
  }
  
  // Now collect all versions starting from root
  const versions: DocumentVersion[] = [currentVersion];
  
  // Walk forward through supersededBy chain
  while (currentVersion.supersededBy) {
    const next = await getVersionBySourceId(currentVersion.supersededBy);
    if (!next) break;
    versions.push(next);
    currentVersion = next;
  }
  
  return versions.sort((a, b) => a.version - b.version);
}

/**
 * Get version by source ID
 */
async function getVersionBySourceId(sourceId: string): Promise<DocumentVersion | null> {
  const versionSnapshot = await firestore
    .collection('document_versions')
    .where('sourceId', '==', sourceId)
    .limit(1)
    .get();
  
  if (versionSnapshot.empty) {
    return null;
  }
  
  return versionSnapshot.docs[0].data() as DocumentVersion;
}

/**
 * Get latest version for a document family
 */
export async function getLatestVersion(sourceId: string): Promise<DocumentVersion | null> {
  const history = await getDocumentVersionHistory(sourceId);
  return history.find(v => v.isLatest) || null;
}

/**
 * Get all latest versions for a user
 */
export async function getLatestVersionsForUser(userId: string): Promise<DocumentVersion[]> {
  const versionsSnapshot = await firestore
    .collection('document_versions')
    .where('userId', '==', userId)
    .where('isLatest', '==', true)
    .get();
  
  return versionsSnapshot.docs.map(doc => doc.data() as DocumentVersion);
}

// ============================================================================
// Update Request Management
// ============================================================================

/**
 * Create an update request
 */
export async function createUpdateRequest(
  request: Omit<DocumentUpdateRequest, 'id'>
): Promise<DocumentUpdateRequest> {
  const requestRef = firestore.collection('document_update_requests').doc();
  
  const requestData: DocumentUpdateRequest = {
    id: requestRef.id,
    ...request
  };
  
  await requestRef.set(requestData);
  
  console.log(`📋 Update request created: ${requestRef.id}`);
  
  // Log the request
  await createUpdateLog({
    updateRequestId: requestRef.id,
    sourceId: request.sourceId,
    action: 'update_requested',
    userId: request.requestedBy,
    details: {
      agentId: request.agentId,
      proposedUrl: request.proposedUpdate.url,
      proposedDate: request.proposedUpdate.date
    }
  });
  
  return requestData;
}

/**
 * Get update request by ID
 */
export async function getUpdateRequest(requestId: string): Promise<DocumentUpdateRequest | null> {
  const doc = await firestore.collection('document_update_requests').doc(requestId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as DocumentUpdateRequest;
}

/**
 * Update request status
 */
export async function updateRequestStatus(
  requestId: string,
  status: DocumentUpdateRequest['status'],
  additionalData?: Partial<DocumentUpdateRequest>
): Promise<void> {
  await firestore.collection('document_update_requests').doc(requestId).update({
    status,
    ...additionalData
  });
  
  console.log(`   Update request ${requestId}: ${status}`);
}

/**
 * Get pending update requests for a user
 */
export async function getPendingUpdateRequests(userId: string): Promise<DocumentUpdateRequest[]> {
  const requestsSnapshot = await firestore
    .collection('document_update_requests')
    .where('userId', '==', userId)
    .where('status', '==', 'pending')
    .orderBy('requestedAt', 'desc')
    .get();
  
  return requestsSnapshot.docs.map(doc => doc.data() as DocumentUpdateRequest);
}

/**
 * Get all update requests for a source
 */
export async function getUpdateRequestsForSource(sourceId: string): Promise<DocumentUpdateRequest[]> {
  const requestsSnapshot = await firestore
    .collection('document_update_requests')
    .where('sourceId', '==', sourceId)
    .orderBy('requestedAt', 'desc')
    .get();
  
  return requestsSnapshot.docs.map(doc => doc.data() as DocumentUpdateRequest);
}

// ============================================================================
// Update Logging
// ============================================================================

/**
 * Create an update log entry
 */
export async function createUpdateLog(
  log: Omit<DocumentUpdateLog, 'id' | 'timestamp'>
): Promise<DocumentUpdateLog> {
  const logRef = firestore.collection('document_update_logs').doc();
  
  const logData: DocumentUpdateLog = {
    id: logRef.id,
    timestamp: new Date(),
    ...log
  };
  
  await logRef.set(logData);
  
  return logData;
}

/**
 * Get update logs for a source
 */
export async function getUpdateLogsForSource(
  sourceId: string,
  limit: number = 50
): Promise<DocumentUpdateLog[]> {
  const logsSnapshot = await firestore
    .collection('document_update_logs')
    .where('sourceId', '==', sourceId)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return logsSnapshot.docs.map(doc => doc.data() as DocumentUpdateLog);
}

// ============================================================================
// Version Weighting for RAG
// ============================================================================

/**
 * Apply version weighting to RAG search results
 * 
 * Prioritizes newer versions while keeping old versions as references
 */
export async function applyVersionWeighting(
  results: RAGSearchResult[],
  userId: string
): Promise<RAGSearchResult[]> {
  // Get version metadata for all sources in results
  const sourceIds = [...new Set(results.map(r => r.sourceId))];
  
  const versionMetadata = new Map<string, DocumentVersion>();
  
  await Promise.all(
    sourceIds.map(async sourceId => {
      const version = await getVersionBySourceId(sourceId);
      if (version) {
        versionMetadata.set(sourceId, version);
      }
    })
  );
  
  // Apply weights
  return results.map(result => {
    const version = versionMetadata.get(result.sourceId);
    
    if (!version) {
      // No version info, keep as-is
      return result;
    }
    
    // Calculate version boost
    let versionBoost = 1.0;
    
    if (version.isLatest) {
      versionBoost = 1.3; // 30% boost for latest version
    } else if (version.supersededBy) {
      versionBoost = 0.7; // 30% penalty for superseded versions
    }
    
    // Calculate age boost (newer = higher)
    const ageInDays = (Date.now() - version.date.getTime()) / (1000 * 60 * 60 * 24);
    const ageBoost = Math.max(0.5, 1 - (ageInDays / 365)); // Decay over 1 year, min 0.5
    
    // Combined boost
    const finalBoost = versionBoost * ageBoost;
    
    // Apply to similarity score
    const weightedSimilarity = result.similarity * finalBoost;
    
    return {
      ...result,
      similarity: weightedSimilarity,
      metadata: {
        ...result.metadata,
        versionInfo: {
          version: version.version,
          versionTag: version.versionTag,
          isLatest: version.isLatest,
          date: version.date,
          versionBoost,
          ageBoost,
          finalBoost
        }
      }
    };
  }).sort((a, b) => b.similarity - a.similarity); // Re-sort by weighted similarity
}

/**
 * Get statistics about document versions
 */
export async function getVersionStatistics(userId: string): Promise<{
  totalDocuments: number;
  versionedDocuments: number;
  totalVersions: number;
  averageVersionsPerDocument: number;
  latestVersions: number;
  supersededVersions: number;
}> {
  const versionsSnapshot = await firestore
    .collection('document_versions')
    .where('userId', '==', userId)
    .get();
  
  const versions = versionsSnapshot.docs.map(doc => doc.data() as DocumentVersion);
  
  const uniqueDocuments = new Set<string>();
  let latestCount = 0;
  let supersededCount = 0;
  
  versions.forEach(v => {
    // Track unique document families (by root sourceId)
    if (!v.parentSourceId) {
      uniqueDocuments.add(v.sourceId);
    }
    
    if (v.isLatest) latestCount++;
    if (v.supersededBy) supersededCount++;
  });
  
  return {
    totalDocuments: uniqueDocuments.size,
    versionedDocuments: uniqueDocuments.size,
    totalVersions: versions.length,
    averageVersionsPerDocument: uniqueDocuments.size > 0 
      ? versions.length / uniqueDocuments.size 
      : 0,
    latestVersions: latestCount,
    supersededVersions: supersededCount
  };
}


