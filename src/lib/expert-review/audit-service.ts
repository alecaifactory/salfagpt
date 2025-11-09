// Audit Trail Service
// Created: 2025-11-09
// Purpose: Complete traceability for compliance

import { firestore } from '../firestore';
import type { AuditTrailEntry, AuditActionType } from '../../types/expert-review';
import * as crypto from 'crypto';

const COLLECTION = 'audit_trail';

/**
 * Log an action to audit trail
 */
export async function logAuditEntry(params: {
  actor: {
    userId: string;
    userEmail: string;
    userRole: string;
    userDomain: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
  action: {
    type: AuditActionType;
    category: 'quality-review' | 'feature-prioritization' | 'system-config';
    description: string;
    severity: 'info' | 'warning' | 'critical';
  };
  subject: {
    type: 'ticket' | 'agent' | 'domain' | 'user' | 'configuration';
    id: string;
    domain: string;
    metadata?: Record<string, any>;
  };
  context?: {
    previousState?: any;
    newState?: any;
    diff?: any;
    reasoning?: string;
    approvals?: Array<{
      approverId: string;
      approvedAt: Date;
      approvalNotes: string;
    }>;
    relatedEntities?: string[];
  };
  compliance?: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPeriod: number;
    encryptedFields: string[];
    consentRequired: boolean;
    consentObtained?: boolean;
    regulatoryFrameworks: string[];
  };
  correlationId?: string;
  parentAuditId?: string;
}): Promise<string> {
  
  const timestamp = new Date();
  
  // Hash IP address for privacy
  const hashedIP = params.actor.ipAddress 
    ? hashData(params.actor.ipAddress)
    : 'unknown';
  
  // Build audit entry
  const entry: Omit<AuditTrailEntry, 'id'> = {
    timestamp,
    actor: {
      ...params.actor,
      ipAddress: hashedIP,
      userAgent: params.actor.userAgent || 'unknown',
      sessionId: params.actor.sessionId || 'unknown'
    },
    action: params.action,
    subject: {
      ...params.subject,
      metadata: params.subject.metadata || {}
    },
    context: params.context || {},
    compliance: params.compliance || {
      dataClassification: 'internal',
      retentionPeriod: 365 * 7, // 7 years for SOC 2
      encryptedFields: ['actor.userEmail', 'actor.ipAddress'],
      consentRequired: false,
      regulatoryFrameworks: ['SOC2', 'ISO27001']
    },
    correlationId: params.correlationId,
    parentAuditId: params.parentAuditId,
    source: getEnvironmentSource(),
    environment: process.env.NODE_ENV || 'development',
    integrity: {
      hash: '', // Will be generated below
      verified: false,
      signature: undefined
    }
  };
  
  // Generate SHA-256 hash for integrity
  const hash = generateEntryHash(entry);
  entry.integrity.hash = hash;
  entry.integrity.verified = true;
  
  // Save to Firestore
  const docRef = await firestore.collection(COLLECTION).add(entry);
  
  console.log('📝 Audit entry logged:', {
    id: docRef.id,
    action: params.action.type,
    severity: params.action.severity
  });
  
  return docRef.id;
}

/**
 * Verify audit entry integrity
 */
export async function verifyAuditIntegrity(auditId: string): Promise<boolean> {
  try {
    const doc = await firestore.collection(COLLECTION).doc(auditId).get();
    
    if (!doc.exists) {
      return false;
    }
    
    const entry = doc.data() as AuditTrailEntry;
    const storedHash = entry.integrity.hash;
    
    // Regenerate hash
    const tempEntry = { ...entry };
    tempEntry.integrity.hash = '';
    const recalculatedHash = generateEntryHash(tempEntry);
    
    // Compare
    const isValid = storedHash === recalculatedHash;
    
    console.log('🔍 Audit integrity check:', {
      auditId,
      isValid,
      storedHash: storedHash.substring(0, 16) + '...',
      recalculated: recalculatedHash.substring(0, 16) + '...'
    });
    
    return isValid;
    
  } catch (error) {
    console.error('❌ Error verifying audit integrity:', error);
    return false;
  }
}

/**
 * Get audit trail for entity
 */
export async function getAuditTrail(
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<AuditTrailEntry[]> {
  
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('subject.type', '==', entityType)
      .where('subject.id', '==', entityId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as AuditTrailEntry));
    
  } catch (error) {
    console.error('❌ Error getting audit trail:', error);
    return [];
  }
}

// Helper functions
function generateEntryHash(entry: any): string {
  // Create stable string representation
  const dataString = JSON.stringify({
    timestamp: entry.timestamp.toISOString(),
    actor: entry.actor,
    action: entry.action,
    subject: entry.subject,
    context: entry.context
  }, Object.keys(entry).sort());
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getEnvironmentSource(): 'localhost' | 'production' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
}

