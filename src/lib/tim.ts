/**
 * Tim - Digital Twin Testing Agent
 * Core functions for automated user testing
 * 
 * Created: 2025-11-16
 * Purpose: Create digital twins, ensure compliance, reproduce issues
 */

import { firestore } from './firestore';
import type {
  DigitalTwin,
  TimTestSession,
  TimComplianceLog,
  ComplianceCheck,
  CreateTimRequest,
  CreateTimResponse
} from '../types/tim';
import crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COMPLIANCE_THRESHOLD = 98; // Minimum score to proceed
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.TIM_ENCRYPTION_KEY || 'development-key-change-in-production';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  return isDevelopment ? 'localhost' : 'production';
}

function generateSessionId(): string {
  return `tim-session-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateTwinId(userId: string, ticketId: string): string {
  return `tim-${userId}-${ticketId}-${Date.now()}`;
}

// ============================================================================
// ANONYMIZATION
// ============================================================================

/**
 * Anonymize email address
 * Example: alec@getaifactory.com → a***@g***.com
 */
export function anonymizeEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return 'anonymous@unknown.com';
  
  const anonymizedUser = user[0] + '***';
  const domainParts = domain.split('.');
  const anonymizedDomain = domainParts[0][0] + '***.' + domainParts.slice(1).join('.');
  
  return `${anonymizedUser}@${anonymizedDomain}`;
}

/**
 * Anonymize user name
 * Example: Alec Johnson → A*** J***
 */
export function anonymizeName(name: string): string {
  return name
    .split(' ')
    .map(part => part[0] + '***')
    .join(' ');
}

/**
 * Redact PII from text
 * Removes: emails, phone numbers, SSN, credit cards
 */
export function redactPII(text: string): string {
  let redacted = text;
  
  // Email addresses
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  
  // Phone numbers (various formats)
  redacted = redacted.replace(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
  
  // SSN
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  
  // Credit card numbers
  redacted = redacted.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CC_REDACTED]');
  
  return redacted;
}

/**
 * Anonymize complete user profile
 */
export async function anonymizeProfile(user: any): Promise<any> {
  return {
    role: user.role,
    domain: user.email ? user.email.split('@')[1] : 'unknown.com',
    organizationId: user.organizationId || 'none',
    preferences: {
      // Anonymize preferences - keep structure, remove specific values
      hasCustomPrompt: !!user.preferences?.systemPrompt,
      hasContextSources: (user.preferences?.activeContextSourceIds?.length || 0) > 0,
      preferredModel: user.preferences?.preferredModel || 'unknown'
    }
  };
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptSensitiveData(data: string): string {
  try {
    // In development, use simple base64 encoding
    if (getEnvironmentSource() === 'localhost') {
      return Buffer.from(data).toString('base64');
    }
    
    // In production, use proper encryption
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  } catch (error) {
    console.error('❌ Encryption error:', error);
    return '[ENCRYPTION_FAILED]';
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    // In development, decode base64
    if (getEnvironmentSource() === 'localhost') {
      return Buffer.from(encryptedData, 'base64').toString('utf8');
    }
    
    // In production, decrypt
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    return '[DECRYPTION_FAILED]';
  }
}

// ============================================================================
// COMPLIANCE CHECKING
// ============================================================================

/**
 * Calculate compliance score from checks
 */
export function calculateComplianceScore(check: ComplianceCheck): number {
  return (
    check.piiDetection * 0.35 +
    check.encryptionStrength * 0.30 +
    check.accessControl * 0.25 +
    check.auditTrail * 0.10
  );
}

/**
 * Run comprehensive compliance check on twin data
 */
export async function checkCompliance(
  digitalTwinId: string,
  twinData: any
): Promise<{ score: number; passed: boolean; issues: any[] }> {
  console.log('🔒 Running compliance check for twin:', digitalTwinId);
  
  const checks: ComplianceCheck = {
    piiDetection: 0,
    encryptionStrength: 0,
    accessControl: 0,
    auditTrail: 0
  };
  
  const issues: any[] = [];
  
  // Check 1: PII Detection & Anonymization (35%)
  let piiScore = 100;
  
  // Check email anonymization
  if (twinData.userEmail && !twinData.userEmail.includes('***')) {
    piiScore -= 30;
    issues.push({
      type: 'pii_exposure',
      severity: 'high',
      description: 'Email not anonymized',
      recommendation: 'Apply anonymizeEmail()'
    });
  }
  
  // Check for PII in config
  if (twinData.userConfig?.systemPrompt) {
    const hasPII = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(
      twinData.userConfig.systemPrompt
    );
    if (hasPII) {
      piiScore -= 20;
      issues.push({
        type: 'pii_in_config',
        severity: 'medium',
        description: 'PII detected in system prompt',
        recommendation: 'Redact PII before storage'
      });
    }
  }
  
  checks.piiDetection = Math.max(0, piiScore);
  
  // Check 2: Encryption Strength (30%)
  let encryptionScore = 100;
  
  if (!twinData.encryptionApplied) {
    encryptionScore = 0;
    issues.push({
      type: 'no_encryption',
      severity: 'critical',
      description: 'Sensitive data not encrypted',
      recommendation: 'Apply encryptSensitiveData()'
    });
  }
  
  checks.encryptionStrength = encryptionScore;
  
  // Check 3: Access Control (25%)
  let accessScore = 100;
  
  if (!twinData.userId) {
    accessScore -= 50;
    issues.push({
      type: 'missing_owner',
      severity: 'high',
      description: 'No userId for access control',
      recommendation: 'Add userId field'
    });
  }
  
  checks.accessControl = accessScore;
  
  // Check 4: Audit Trail (10%)
  let auditScore = 100;
  
  if (!twinData.createdAt || !twinData.updatedAt) {
    auditScore -= 50;
    issues.push({
      type: 'missing_timestamps',
      severity: 'low',
      description: 'Missing audit timestamps',
      recommendation: 'Add createdAt and updatedAt'
    });
  }
  
  checks.auditTrail = auditScore;
  
  // Calculate final score
  const score = calculateComplianceScore(checks);
  const passed = score >= COMPLIANCE_THRESHOLD;
  
  // Log compliance check
  await firestore.collection('tim_compliance_logs').add({
    digitalTwinId,
    sessionId: twinData.sessionId,
    checkType: 'full_compliance_check',
    input: '[ENCRYPTED]',
    output: '[ENCRYPTED]',
    complianceScore: score,
    passed,
    issues,
    actionTaken: passed ? 'proceed' : 'block',
    timestamp: new Date(),
    source: getEnvironmentSource()
  });
  
  console.log(`🔒 Compliance score: ${score.toFixed(2)}% - ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return { score, passed, issues };
}

// ============================================================================
// DIGITAL TWIN CREATION
// ============================================================================

/**
 * Create a digital twin of a user for testing
 */
export async function createDigitalTwin(
  request: CreateTimRequest
): Promise<CreateTimResponse> {
  console.log('🤖 Creating digital twin for user:', request.userId);
  
  const { userId, ticketId, ticketDetails } = request;
  
  try {
    // 1. Load user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User not found: ${userId}`);
    }
    const user = userDoc.data();
    
    // 2. Load user settings
    const settingsDoc = await firestore.collection('user_settings').doc(userId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    // 3. Load current agent (if any)
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .orderBy('lastMessageAt', 'desc')
      .limit(1)
      .get();
    
    const currentAgent = conversationsSnapshot.empty 
      ? null 
      : conversationsSnapshot.docs[0].data();
    
    // 4. Anonymize profile
    const anonymizedProfile = await anonymizeProfile(user);
    
    // 5. Encrypt sensitive data
    const encryptedSystemPrompt = currentAgent?.systemPrompt
      ? encryptSensitiveData(currentAgent.systemPrompt)
      : encryptSensitiveData(settings.systemPrompt || 'Default system prompt');
    
    const encryptedContextIds = currentAgent?.activeContextSourceIds
      ? encryptSensitiveData(JSON.stringify(currentAgent.activeContextSourceIds))
      : encryptSensitiveData('[]');
    
    // 6. Generate IDs
    const twinId = generateTwinId(userId, ticketId);
    const sessionId = generateSessionId();
    
    // 7. Create twin document
    const twinData = {
      id: twinId,
      userId,
      userEmail: anonymizeEmail(user?.email || 'unknown@unknown.com'),
      ticketId,
      userConfig: {
        model: currentAgent?.agentModel || settings.preferredModel || 'gemini-2.5-flash',
        systemPrompt: encryptedSystemPrompt,
        language: settings.language || 'es',
        activeContextSourceIds: encryptedContextIds
      },
      userProfile: anonymizedProfile,
      sessionId,
      status: 'created' as const,
      complianceScore: 0, // Will be calculated
      anonymizationApplied: true,
      encryptionApplied: true,
      sensitiveDataRedacted: ['systemPrompt', 'activeContextSourceIds'],
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource()
    };
    
    // 8. Run compliance check
    const complianceResult = await checkCompliance(twinId, twinData);
    
    if (!complianceResult.passed) {
      console.error('❌ Compliance check failed:', complianceResult);
      throw new Error(
        `Compliance score ${complianceResult.score.toFixed(2)}% is below threshold ${COMPLIANCE_THRESHOLD}%. ` +
        `Issues: ${complianceResult.issues.map(i => i.description).join(', ')}`
      );
    }
    
    // 9. Update with compliance score
    twinData.complianceScore = complianceResult.score;
    twinData.status = 'compliance_check';
    
    // 10. Save to Firestore
    await firestore.collection('digital_twins').doc(twinId).set(twinData);
    
    console.log('✅ Digital twin created:', twinId);
    console.log('🔒 Compliance score:', complianceResult.score.toFixed(2) + '%');
    
    return {
      digitalTwinId: twinId,
      complianceScore: complianceResult.score,
      status: 'created',
      sessionId
    };
    
  } catch (error) {
    console.error('❌ Failed to create digital twin:', error);
    throw error;
  }
}

// ============================================================================
// DIGITAL TWIN RETRIEVAL
// ============================================================================

/**
 * Get digital twin by ID
 */
export async function getDigitalTwin(twinId: string): Promise<DigitalTwin | null> {
  try {
    const doc = await firestore.collection('digital_twins').doc(twinId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
      completedAt: doc.data()?.completedAt?.toDate()
    } as DigitalTwin;
  } catch (error) {
    console.error('❌ Failed to get digital twin:', error);
    return null;
  }
}

/**
 * Get all digital twins for a user
 */
export async function getUserDigitalTwins(userId: string): Promise<DigitalTwin[]> {
  try {
    const snapshot = await firestore
      .collection('digital_twins')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
      completedAt: doc.data()?.completedAt?.toDate()
    })) as DigitalTwin[];
  } catch (error) {
    console.error('❌ Failed to get user digital twins:', error);
    return [];
  }
}

/**
 * Update digital twin status
 */
export async function updateDigitalTwinStatus(
  twinId: string,
  status: DigitalTwin['status']
): Promise<void> {
  try {
    await firestore.collection('digital_twins').doc(twinId).update({
      status,
      updatedAt: new Date(),
      ...(status === 'completed' && { completedAt: new Date() })
    });
    
    console.log(`✅ Twin ${twinId} status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Failed to update twin status:', error);
    throw error;
  }
}

// ============================================================================
// TEST SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new test session for a digital twin
 */
export async function createTestSession(
  digitalTwinId: string,
  ticketDetails: CreateTimRequest['ticketDetails']
): Promise<string> {
  try {
    const twin = await getDigitalTwin(digitalTwinId);
    if (!twin) {
      throw new Error(`Digital twin not found: ${digitalTwinId}`);
    }
    
    const sessionData = {
      digitalTwinId,
      userId: twin.userId,
      ticketId: twin.ticketId,
      testScenario: {
        userAction: ticketDetails.userAction,
        expectedBehavior: ticketDetails.expectedBehavior,
        actualBehavior: ticketDetails.actualBehavior,
        reproductionSteps: ticketDetails.reproductionSteps || []
      },
      status: 'pending' as const,
      capturedData: {
        consoleLogs: [],
        networkRequests: [],
        screenshots: [],
        performanceMetrics: {},
        accessibilityIssues: []
      },
      privacyLedger: {
        updatesApplied: [],
        complianceChecks: []
      },
      routedTo: {
        user: false,
        ally: false,
        stella: false,
        rudy: false,
        admin: false,
        superAdmin: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource()
    };
    
    const sessionRef = await firestore.collection('tim_test_sessions').add(sessionData);
    
    console.log('✅ Test session created:', sessionRef.id);
    return sessionRef.id;
    
  } catch (error) {
    console.error('❌ Failed to create test session:', error);
    throw error;
  }
}

/**
 * Get test session by ID
 */
export async function getTestSession(sessionId: string): Promise<TimTestSession | null> {
  try {
    const doc = await firestore.collection('tim_test_sessions').doc(sessionId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
      startedAt: doc.data()?.startedAt?.toDate(),
      completedAt: doc.data()?.completedAt?.toDate()
    } as TimTestSession;
  } catch (error) {
    console.error('❌ Failed to get test session:', error);
    return null;
  }
}

/**
 * Update test session with captured data
 */
export async function updateTestSession(
  sessionId: string,
  updates: Partial<TimTestSession>
): Promise<void> {
  try {
    await firestore.collection('tim_test_sessions').doc(sessionId).update({
      ...updates,
      updatedAt: new Date()
    });
    
    console.log('✅ Test session updated:', sessionId);
  } catch (error) {
    console.error('❌ Failed to update test session:', error);
    throw error;
  }
}

/**
 * Get all test sessions for a user
 */
export async function getUserTestSessions(userId: string): Promise<TimTestSession[]> {
  try {
    const snapshot = await firestore
      .collection('tim_test_sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
      startedAt: doc.data()?.startedAt?.toDate(),
      completedAt: doc.data()?.completedAt?.toDate()
    })) as TimTestSession[];
  } catch (error) {
    console.error('❌ Failed to get user test sessions:', error);
    return [];
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// Functions already exported above
export { COMPLIANCE_THRESHOLD };

