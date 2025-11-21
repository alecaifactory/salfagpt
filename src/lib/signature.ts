/**
 * Digital Signature System for Metrics Integrity
 * 
 * Purpose: Ensure metrics have not been tampered with
 * Method: HMAC-SHA256 with secret key
 * Use cases:
 * - Verify cached metrics are authentic
 * - Detect unauthorized modifications
 * - Audit trail for compliance
 * 
 * Created: 2025-11-18
 */

import crypto from 'crypto';
import type { SignatureVerification } from '../types/metrics-cache';

/**
 * Get the signing secret from environment
 * CRITICAL: This must be kept secret and rotated regularly
 */
function getSigningSecret(): string {
  const secret = process.env.METRICS_SIGNING_KEY || 
                 process.env.JWT_SECRET; // Fallback to JWT secret
  
  if (!secret) {
    throw new Error('METRICS_SIGNING_KEY or JWT_SECRET must be set');
  }
  
  return secret;
}

/**
 * Create a digital signature for metrics data
 * 
 * @param agentId - Agent identifier
 * @param count - Document count (or other metric)
 * @param timestamp - When the metric was calculated (unix ms)
 * @returns Hex string signature
 * 
 * @example
 * ```typescript
 * const sig = signMetrics('agent-123', 5, Date.now());
 * // Returns: "a1b2c3d4..."
 * ```
 */
export function signMetrics(
  agentId: string,
  count: number,
  timestamp: number
): string {
  const data = `${agentId}:${count}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(data)
    .digest('hex');
  
  return signature;
}

/**
 * Verify a metrics signature
 * 
 * @param agentId - Agent identifier
 * @param count - Document count to verify
 * @param timestamp - Timestamp used in original signature (unix ms)
 * @param signature - Signature to verify
 * @returns True if signature is valid
 * 
 * @example
 * ```typescript
 * const isValid = verifySignature('agent-123', 5, 1700000000000, 'a1b2c3...');
 * ```
 */
export function verifySignature(
  agentId: string,
  count: number,
  timestamp: number,
  signature: string
): boolean {
  try {
    const expected = signMetrics(agentId, count, timestamp);
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Verify a complete metrics object signature
 * 
 * @param metrics - Metrics object with _signature field
 * @returns Verification result with details
 * 
 * @example
 * ```typescript
 * const verification = verifyMetricsSignature(metricsData);
 * if (!verification.isValid) {
 *   console.warn('Invalid signature:', verification.message);
 * }
 * ```
 */
export function verifyMetricsSignature(metrics: {
  agentId: string;
  documentCount: number;
  lastUpdated: { toMillis(): number } | Date;
  _signature: string;
}): SignatureVerification {
  const timestamp = metrics.lastUpdated instanceof Date
    ? metrics.lastUpdated.getTime()
    : metrics.lastUpdated.toMillis();
  
  const isValid = verifySignature(
    metrics.agentId,
    metrics.documentCount,
    timestamp,
    metrics._signature
  );
  
  return {
    isValid,
    algorithm: 'sha256',
    verifiedAt: new Date(),
    message: isValid ? undefined : 'Signature verification failed'
  };
}

/**
 * Sign a complete metrics object
 * Adds _signature field to the object
 * 
 * @param metrics - Metrics object to sign
 * @returns Same object with _signature field added
 */
export function signMetricsObject<T extends {
  agentId: string;
  documentCount: number;
  lastUpdated: Date | { toMillis(): number };
}>(metrics: T): T & { _signature: string } {
  const timestamp = metrics.lastUpdated instanceof Date
    ? metrics.lastUpdated.getTime()
    : metrics.lastUpdated.toMillis();
  
  const signature = signMetrics(
    metrics.agentId,
    metrics.documentCount,
    timestamp
  );
  
  return {
    ...metrics,
    _signature: signature
  };
}

/**
 * Generate a unique signature for bulk operations
 * Combines multiple signatures into one
 * 
 * @param signatures - Array of individual signatures
 * @returns Combined signature
 */
export function combineBulkSignatures(signatures: string[]): string {
  const combined = signatures.sort().join(':');
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
}

/**
 * Hash an IP address for privacy-preserving logging
 * 
 * @param ipAddress - IP address to hash
 * @returns Hashed IP address
 */
export function hashIPAddress(ipAddress: string): string {
  return crypto
    .createHash('sha256')
    .update(ipAddress + getSigningSecret())
    .digest('hex')
    .substring(0, 16); // First 16 chars for storage efficiency
}

/**
 * Validate signature age
 * Metrics older than threshold should be refreshed
 * 
 * @param timestamp - When signature was created (unix ms)
 * @param maxAgeSeconds - Maximum age in seconds (default: 5 minutes)
 * @returns True if signature is still fresh
 */
export function isSignatureFresh(
  timestamp: number,
  maxAgeSeconds: number = 300
): boolean {
  const ageSeconds = (Date.now() - timestamp) / 1000;
  return ageSeconds < maxAgeSeconds;
}


