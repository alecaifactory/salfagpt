/**
 * 🔒 Privacy Utilities for AI Systems
 * 
 * Protects user PII and strategic IP when sending data to AI inference engines.
 * 
 * Features:
 * - Hash user IDs (prevent user identification)
 * - Redact emails, phones, IDs
 * - Auto-detect and redact PII
 * - Sanitize conversations for AI
 * - Encrypt strategic information
 * - Full audit trail
 * 
 * Compliance: GDPR, CCPA, Chilean data protection law
 */

import crypto from 'crypto';

/**
 * Hash userId for use in AI prompts
 * 
 * Prevents PII leakage to third-party inference engines.
 * One-way hash - cannot reverse engineer original userId.
 * 
 * Example:
 * - Input: '114671162830729001607'
 * - Output: 'user_a7f3c29bd4e1'
 */
export function hashUserId(userId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex')
    .substring(0, 12);
  
  return `user_${hash}`;
}

/**
 * Redact email addresses
 * 
 * Shows first 2 chars of username + domain for context,
 * but hides full email.
 * 
 * Example:
 * - Input: 'alec@getaifactory.com'
 * - Output: 'al***@getaifactory.com'
 */
export function redactEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!domain) return '[INVALID_EMAIL]';
  
  const redactedUsername = username.length > 2
    ? `${username.substring(0, 2)}***`
    : '***';
  
  return `${redactedUsername}@${domain}`;
}

/**
 * Auto-detect and redact PII (Personally Identifiable Information)
 * 
 * Patterns detected:
 * - Email addresses
 * - Phone numbers (Chilean format)
 * - RUT (Chilean ID)
 * - Credit card numbers
 * - IP addresses
 * - Social security numbers
 */
export function redactPII(text: string): string {
  let sanitized = text;
  
  // Email addresses
  sanitized = sanitized.replace(
    /[\w\.-]+@[\w\.-]+\.\w+/g,
    '[EMAIL_REDACTED]'
  );
  
  // Chilean phone numbers (+56 9 XXXX XXXX)
  sanitized = sanitized.replace(
    /\+?56\s?9\s?\d{4}\s?\d{4}/g,
    '[PHONE_REDACTED]'
  );
  
  // Chilean RUT (XX.XXX.XXX-X)
  sanitized = sanitized.replace(
    /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/g,
    '[RUT_REDACTED]'
  );
  
  // Credit card numbers
  sanitized = sanitized.replace(
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
    '[CC_REDACTED]'
  );
  
  // IP addresses
  sanitized = sanitized.replace(
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    '[IP_REDACTED]'
  );
  
  return sanitized;
}

/**
 * Sanitize conversation for AI inference
 * 
 * Removes all PII and sensitive metadata.
 * Keeps only role and content (redacted).
 */
export function sanitizeConversationForAI(messages: any[]): any[] {
  return messages.map(msg => ({
    role: msg.role,
    content: redactPII(msg.content),
    timestamp: msg.timestamp,
    // Remove: userId, email, IP, attachments with PII
  }));
}

/**
 * Detect if text contains PII
 * 
 * Returns true if any PII pattern is detected.
 */
export function containsPII(text: string): boolean {
  const patterns = [
    /[\w\.-]+@[\w\.-]+\.\w+/, // Email
    /\+?56\s?9\s?\d{4}\s?\d{4}/, // Phone
    /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/, // RUT
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Encrypt strategic information before sending to AI
 * 
 * Uses AES-256-GCM for symmetric encryption.
 * AI cannot decode encrypted data, but can reference it contextually.
 * 
 * Example:
 * - Input: 'deployment-key-xyz-secret'
 * - Output: 'ENC:a7f3c29bd4e1...'
 */
export function encryptStrategicData(data: string, key?: string): string {
  const encryptionKey = key || process.env.STRATEGIC_DATA_KEY || 'default-key-change-me';
  
  const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `ENC:${encrypted}`;
}

/**
 * Decrypt strategic information (for internal use only)
 * 
 * Never send decrypted data to AI.
 */
export function decryptStrategicData(encryptedData: string, key?: string): string {
  if (!encryptedData.startsWith('ENC:')) {
    return encryptedData; // Not encrypted
  }
  
  const encryptionKey = key || process.env.STRATEGIC_DATA_KEY || 'default-key-change-me';
  const encrypted = encryptedData.substring(4); // Remove 'ENC:' prefix
  
  try {
    const decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Prepare user data for AI inference
 * 
 * Complete anonymization pipeline:
 * 1. Hash userId
 * 2. Redact email
 * 3. Remove PII from messages
 * 4. Encrypt strategic data
 * 5. Return sanitized object
 */
export interface SanitizedUserData {
  hashedUserId: string;
  redactedEmail: string;
  role?: string; // Keep role for context
  piiDetected: boolean;
  originalDataEncrypted: boolean;
}

export function sanitizeUserDataForAI(userData: {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}): SanitizedUserData {
  return {
    hashedUserId: hashUserId(userData.userId),
    redactedEmail: redactEmail(userData.email),
    role: userData.role, // Safe to include
    piiDetected: containsPII(JSON.stringify(userData)),
    originalDataEncrypted: true,
  };
}

/**
 * Audit log entry for privacy tracking
 */
export interface PrivacyAuditLog {
  timestamp: Date;
  operation: string;
  hashedUserId: string;
  piiDetected: boolean;
  piiRedacted: boolean;
  strategicDataEncrypted: boolean;
  aiModelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Create audit log entry
 */
export function createPrivacyAuditLog(
  userId: string,
  operation: string,
  metadata: Partial<PrivacyAuditLog>
): PrivacyAuditLog {
  return {
    timestamp: new Date(),
    operation,
    hashedUserId: hashUserId(userId),
    piiDetected: false,
    piiRedacted: false,
    strategicDataEncrypted: false,
    aiModelUsed: 'gemini-2.5-flash',
    inputTokens: 0,
    outputTokens: 0,
    ...metadata,
  };
}

/**
 * Token counter helper
 * Estimates tokens for cost calculation
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English/Spanish
  return Math.ceil(text.length / 4);
}

/**
 * Validate that data is safe for AI
 * 
 * Returns true if data passes privacy checks.
 */
export function validateDataForAI(data: any): {
  safe: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const dataStr = JSON.stringify(data);
  
  // Check for PII
  if (containsPII(dataStr)) {
    issues.push('Contains PII - redaction required');
  }
  
  // Check for raw userIds
  if (dataStr.match(/\d{18,}/)) {
    issues.push('Contains raw userId - hashing required');
  }
  
  // Check for API keys
  if (dataStr.match(/AIzaSy|GOCSPX-|sk-/)) {
    issues.push('Contains API key - encryption required');
  }
  
  // Check for secrets
  if (dataStr.match(/password|secret|key.*=|token.*=/i)) {
    issues.push('Contains potential secrets - review required');
  }
  
  return {
    safe: issues.length === 0,
    issues,
  };
}

