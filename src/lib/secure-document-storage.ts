/**
 * Secure Document Storage System
 * 
 * Compliance: Nubox Security Requirements
 * - TLS 1.2+ en tránsito
 * - AES-256 en reposo
 * - Ley 19.628 (Chile privacy law)
 * - Auto-deletion after retention period
 * 
 * Created: 2025-11-17
 */

import { Storage } from '@google-cloud/storage';
import { firestore } from './firestore';
import crypto from 'crypto';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const BUCKET_NAME = `${PROJECT_ID}-secure-documents`;

const storage = new Storage({
  projectId: PROJECT_ID,
});

// ============================================================================
// ENCRYPTION (AES-256)
// ============================================================================

const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

/**
 * Encrypt document data (AES-256-CBC)
 */
function encryptDocument(buffer: Buffer): { encrypted: Buffer; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);
  
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt document data
 */
function decryptDocument(encrypted: Buffer, ivHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

// ============================================================================
// DOCUMENT LIFECYCLE STATES
// ============================================================================

export type DocumentStatus = 
  | 'uploaded'        // Just uploaded, not processed
  | 'processing'      // Currently being processed
  | 'completed'       // Successfully processed
  | 'failed'          // Processing failed
  | 'retained'        // Failed, kept for analysis (with password)
  | 'scheduled_deletion'; // Marked for deletion

export interface SecureDocument {
  id: string;
  
  // File info
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  
  // Storage (encrypted)
  gcsPath: string;              // Path in Cloud Storage (encrypted)
  encryptionIV: string;         // IV for AES-256 decryption
  
  // Processing
  status: DocumentStatus;
  uploadedAt: Date;
  processedAt?: Date;
  processingError?: string;
  
  // Password (only for failed docs, encrypted)
  passwordEncrypted?: string;   // For password-protected PDFs that failed
  
  // Retention (Ley 19.628 compliance)
  retentionUntil: Date;         // Auto-delete after this
  deletedAt?: Date;
  
  // Ownership & access control
  userId: string;               // Owner
  companyId: string;            // Company (for multi-tenant)
  accessRoles: string[];        // Who can access
  
  // Result reference
  resultId?: string;            // Link to extraction result
  
  // Audit trail (non-sensitive)
  auditLog: Array<{
    timestamp: Date;
    action: 'uploaded' | 'processed' | 'accessed' | 'deleted';
    userId: string;
    ip?: string;                // Hashed IP
  }>;
}

// ============================================================================
// SECURE STORAGE OPERATIONS
// ============================================================================

/**
 * Upload document securely (encrypted at rest)
 */
export async function uploadSecureDocument(
  buffer: Buffer,
  metadata: {
    fileName: string;
    userId: string;
    companyId: string;
    password?: string;          // If PDF is password-protected
  }
): Promise<SecureDocument> {
  
  console.log('🔐 [Secure Storage] Uploading document...');
  console.log(`   File: ${metadata.fileName}`);
  console.log(`   Size: ${buffer.length} bytes`);
  console.log(`   Encryption: AES-256-CBC`);
  
  // 1. Encrypt document (AES-256)
  const { encrypted, iv } = encryptDocument(buffer);
  console.log('✅ Document encrypted');
  
  // 2. Generate unique ID and path
  const docId = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const gcsPath = `secure-documents/${metadata.companyId}/${docId}.enc`;
  
  // 3. Upload to Cloud Storage (encrypted)
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(gcsPath);
  
  await file.save(encrypted, {
    metadata: {
      contentType: 'application/octet-stream', // Encrypted, so generic type
      metadata: {
        originalName: metadata.fileName,
        encrypted: 'true',
        algorithm: 'aes-256-cbc',
        // DO NOT store IV in GCS metadata for security
      },
    },
  });
  
  console.log('✅ Uploaded to Cloud Storage (encrypted)');
  
  // 4. Encrypt password if provided (for failed docs analysis)
  let passwordEncrypted: string | undefined;
  if (metadata.password) {
    const passwordCipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
    passwordEncrypted = Buffer.concat([
      passwordCipher.update(metadata.password, 'utf8'),
      passwordCipher.final(),
    ]).toString('hex');
    console.log('✅ Password encrypted (for retention if processing fails)');
  }
  
  // 5. Set retention period (7 days per Nubox spec)
  const retentionDays = 7;
  const retentionUntil = new Date();
  retentionUntil.setDate(retentionUntil.getDate() + retentionDays);
  
  // 6. Create document record in Firestore
  const secureDoc: SecureDocument = {
    id: docId,
    originalFileName: metadata.fileName,
    fileSize: buffer.length,
    mimeType: 'application/pdf',
    gcsPath: gcsPath,
    encryptionIV: iv,
    status: 'uploaded',
    uploadedAt: new Date(),
    retentionUntil: retentionUntil,
    userId: metadata.userId,
    companyId: metadata.companyId,
    accessRoles: ['owner', 'admin'],
    passwordEncrypted: passwordEncrypted,
    auditLog: [{
      timestamp: new Date(),
      action: 'uploaded',
      userId: metadata.userId,
    }],
  };
  
  await firestore.collection('secure_documents').doc(docId).set({
    ...secureDoc,
    uploadedAt: new Date(),
    retentionUntil: retentionUntil,
  });
  
  console.log('✅ Document record created in Firestore');
  console.log(`   ID: ${docId}`);
  console.log(`   Retention until: ${retentionUntil.toISOString()}`);
  
  return secureDoc;
}

/**
 * Mark document as successfully processed → Schedule for deletion
 */
export async function markDocumentProcessed(
  docId: string,
  resultId: string
): Promise<void> {
  
  console.log('✅ [Secure Storage] Marking document as processed...');
  console.log(`   Document ID: ${docId}`);
  console.log(`   Result ID: ${resultId}`);
  
  await firestore.collection('secure_documents').doc(docId).update({
    status: 'completed',
    processedAt: new Date(),
    resultId: resultId,
  });
  
  // Schedule for immediate deletion (successful processing)
  console.log('🗑️ [Secure Storage] Scheduling for deletion...');
  await scheduleDocumentDeletion(docId, 0); // Delete immediately
}

/**
 * Mark document as failed → Retain for analysis
 */
export async function markDocumentFailed(
  docId: string,
  error: string
): Promise<void> {
  
  console.log('⚠️ [Secure Storage] Marking document as failed...');
  console.log(`   Document ID: ${docId}`);
  console.log(`   Error: ${error}`);
  
  await firestore.collection('secure_documents').doc(docId).update({
    status: 'retained',
    processedAt: new Date(),
    processingError: error,
  });
  
  // Keep for retention period (7 days) for analysis
  console.log('📦 [Secure Storage] Document retained for analysis');
  console.log('   Will be deleted after retention period');
}

/**
 * Schedule document for deletion
 */
async function scheduleDocumentDeletion(
  docId: string,
  delayMinutes: number = 0
): Promise<void> {
  
  const deleteAt = new Date();
  deleteAt.setMinutes(deleteAt.getMinutes() + delayMinutes);
  
  await firestore.collection('deletion_queue').add({
    documentId: docId,
    scheduledFor: deleteAt,
    reason: 'processing_complete',
    createdAt: new Date(),
  });
  
  console.log(`🗑️ Scheduled deletion at: ${deleteAt.toISOString()}`);
}

/**
 * Delete document (Cloud Storage + Firestore)
 */
export async function deleteSecureDocument(docId: string): Promise<void> {
  
  console.log('🗑️ [Secure Storage] Deleting document...');
  console.log(`   ID: ${docId}`);
  
  try {
    // 1. Get document info
    const docSnap = await firestore.collection('secure_documents').doc(docId).get();
    if (!docSnap.exists) {
      console.warn('⚠️ Document not found in Firestore');
      return;
    }
    
    const doc = docSnap.data() as SecureDocument;
    
    // 2. Delete from Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.file(doc.gcsPath).delete();
    console.log('✅ Deleted from Cloud Storage');
    
    // 3. Mark as deleted in Firestore (keep audit trail)
    await firestore.collection('secure_documents').doc(docId).update({
      status: 'scheduled_deletion',
      deletedAt: new Date(),
      gcsPath: '[DELETED]',
      encryptionIV: '[DELETED]',
      passwordEncrypted: '[DELETED]',
    });
    
    console.log('✅ Document deleted, audit trail preserved');
    
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    throw error;
  }
}

/**
 * Cleanup expired documents (run periodically)
 */
export async function cleanupExpiredDocuments(): Promise<number> {
  
  console.log('🧹 [Cleanup] Starting expired documents cleanup...');
  
  const now = new Date();
  const snapshot = await firestore
    .collection('secure_documents')
    .where('retentionUntil', '<=', now)
    .where('status', 'in', ['completed', 'retained'])
    .get();
  
  console.log(`   Found ${snapshot.size} expired documents`);
  
  let deleted = 0;
  for (const doc of snapshot.docs) {
    try {
      await deleteSecureDocument(doc.id);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete ${doc.id}:`, error);
    }
  }
  
  console.log(`✅ Cleanup complete: ${deleted}/${snapshot.size} deleted`);
  return deleted;
}

// ============================================================================
// WEBHOOK SENDING (TLS 1.2+ Required)
// ============================================================================

export interface WebhookPayload {
  document_id: string;
  status: 'completed' | 'failed' | 'processing';
  processed_at: string;         // ISO 8601
  message: string;
  result_url?: string;
  error_code?: string;
}

/**
 * Send webhook notification (TLS 1.2+ enforced)
 */
export async function sendSecureWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  options: {
    companyToken?: string;      // Company-specific auth token
    maxRetries?: number;
  } = {}
): Promise<void> {
  
  const { companyToken, maxRetries = 3 } = options;
  
  console.log('📨 [Webhook] Sending secure notification...');
  console.log(`   URL: ${webhookUrl}`);
  console.log(`   Status: ${payload.status}`);
  console.log(`   Document: ${payload.document_id}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Flow-Nubox-Integration/1.0',
    'X-Webhook-Signature': generateWebhookSignature(payload),
  };
  
  if (companyToken) {
    headers['Authorization'] = `Bearer ${companyToken}`;
  }
  
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`📨 [Webhook] Attempt ${attempt}/${maxRetries}...`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        // Note: Node.js fetch uses TLS 1.2+ by default
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ [Webhook] Sent successfully');
      
      // Log successful delivery
      await logWebhookDelivery(payload.document_id, webhookUrl, 'success');
      
      return;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ [Webhook] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error('❌ [Webhook] All retries failed');
  await logWebhookDelivery(payload.document_id, webhookUrl, 'failed', lastError?.message);
  
  throw new Error(`Webhook delivery failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Generate HMAC signature for webhook (for recipient to verify)
 */
function generateWebhookSignature(payload: WebhookPayload): string {
  const secret = process.env.WEBHOOK_SECRET || 'default_secret_change_in_production';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery(
  documentId: string,
  webhookUrl: string,
  status: 'success' | 'failed',
  error?: string
): Promise<void> {
  
  await firestore.collection('webhook_logs').add({
    documentId,
    webhookUrl: webhookUrl.substring(0, 100), // Truncate for security
    status,
    error,
    timestamp: new Date(),
  });
}

// ============================================================================
// DOCUMENT LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Complete workflow: Upload → Process → Webhook → Delete
 */
export async function processDocumentWorkflow(
  buffer: Buffer,
  metadata: {
    fileName: string;
    userId: string;
    companyId: string;
    webhookUrl?: string;
    password?: string;
  },
  extractionFunction: (buffer: Buffer) => Promise<any>
): Promise<{
  document: SecureDocument;
  result: any;
  webhookSent: boolean;
}> {
  
  console.log('🔄 [Workflow] Starting secure document workflow...');
  
  // Step 1: Upload encrypted
  const secureDoc = await uploadSecureDocument(buffer, metadata);
  console.log('✅ Step 1: Document uploaded (encrypted)');
  
  // Step 2: Update status to processing
  await firestore.collection('secure_documents').doc(secureDoc.id).update({
    status: 'processing',
  });
  console.log('✅ Step 2: Status → processing');
  
  let result: any;
  let webhookSent = false;
  
  try {
    // Step 3: Extract data
    result = await extractionFunction(buffer);
    console.log('✅ Step 3: Extraction complete');
    
    // Step 4: Mark as completed
    await markDocumentProcessed(secureDoc.id, result.document_id || secureDoc.id);
    console.log('✅ Step 4: Marked as completed');
    
    // Step 5: Send webhook (if configured)
    if (metadata.webhookUrl) {
      const webhookPayload: WebhookPayload = {
        document_id: secureDoc.id,
        status: 'completed',
        processed_at: new Date().toISOString(),
        message: 'Archivo procesado correctamente',
        result_url: `https://flow.getaifactory.com/api/results/${secureDoc.id}`,
      };
      
      try {
        await sendSecureWebhook(metadata.webhookUrl, webhookPayload, {
          companyToken: undefined, // TODO: Get from company settings
        });
        webhookSent = true;
        console.log('✅ Step 5: Webhook sent');
      } catch (webhookError) {
        console.warn('⚠️ Step 5: Webhook failed (non-critical)');
      }
    }
    
    // Step 6: Schedule for immediate deletion (successful processing)
    await scheduleDocumentDeletion(secureDoc.id, 5); // Delete in 5 minutes
    console.log('✅ Step 6: Scheduled for deletion (5 minutes)');
    
  } catch (extractionError) {
    // Extraction failed - keep for analysis
    console.error('❌ Step 3: Extraction failed');
    await markDocumentFailed(secureDoc.id, extractionError instanceof Error ? extractionError.message : 'Unknown error');
    
    // Send failure webhook
    if (metadata.webhookUrl) {
      const webhookPayload: WebhookPayload = {
        document_id: secureDoc.id,
        status: 'failed',
        processed_at: new Date().toISOString(),
        message: 'Error al procesar el archivo',
        error_code: 'EXTRACTION_FAILED',
      };
      
      try {
        await sendSecureWebhook(metadata.webhookUrl, webhookPayload);
        webhookSent = true;
      } catch {}
    }
    
    throw extractionError;
  }
  
  return {
    document: secureDoc,
    result: result,
    webhookSent: webhookSent,
  };
}

// ============================================================================
// COMPLIANCE & AUDIT
// ============================================================================

/**
 * Generate compliance report (Ley 19.628)
 */
export async function generateComplianceReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalDocuments: number;
  processed: number;
  failed: number;
  deleted: number;
  retained: number;
  averageRetentionDays: number;
}> {
  
  const snapshot = await firestore
    .collection('secure_documents')
    .where('companyId', '==', companyId)
    .where('uploadedAt', '>=', startDate)
    .where('uploadedAt', '<=', endDate)
    .get();
  
  const docs = snapshot.docs.map(d => d.data() as SecureDocument);
  
  return {
    totalDocuments: docs.length,
    processed: docs.filter(d => d.status === 'completed').length,
    failed: docs.filter(d => d.status === 'failed').length,
    deleted: docs.filter(d => d.deletedAt).length,
    retained: docs.filter(d => d.status === 'retained').length,
    averageRetentionDays: calculateAverageRetention(docs),
  };
}

function calculateAverageRetention(docs: SecureDocument[]): number {
  const deletedDocs = docs.filter(d => d.deletedAt && d.uploadedAt);
  if (deletedDocs.length === 0) return 0;
  
  const totalDays = deletedDocs.reduce((sum, d) => {
    const days = (d.deletedAt!.getTime() - d.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);
  
  return totalDays / deletedDocs.length;
}

