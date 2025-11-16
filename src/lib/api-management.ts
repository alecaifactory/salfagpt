/**
 * API Management Library
 * 
 * Purpose: Manage API organizations, keys, invitations, and usage
 * Created: 2025-11-16
 * 
 * Functions for:
 * - API organization CRUD
 * - API key generation and validation
 * - Invitation management
 * - Usage tracking and quota enforcement
 */

import { firestore } from './firestore';
import type {
  APIOrganization,
  APIKey,
  APIInvitation,
  APIUsageLog,
  APIOrganizationTier,
  APIScope,
  APIValidationResult,
  QuotaCheckResult,
  TierQuotas,
  TIER_QUOTAS,
} from '../types/api-system';
import bcrypt from 'bcryptjs';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLECTIONS = {
  API_ORGANIZATIONS: 'api_organizations',
  API_KEYS: 'api_keys',
  API_INVITATIONS: 'api_invitations',
  API_USAGE_LOGS: 'api_usage_logs',
  API_REQUIREMENT_WORKFLOWS: 'api_requirement_workflows',
} as const;

// ============================================================================
// API ORGANIZATIONS
// ============================================================================

/**
 * Create API organization for a developer
 */
export async function createAPIOrganization(
  userId: string,
  userEmail: string,
  invitationCode: string
): Promise<APIOrganization> {
  try {
    // Validate invitation
    const invitation = await validateInvitationCode(invitationCode);
    if (!invitation.valid) {
      throw new Error('Invalid invitation code');
    }
    
    // Extract domain from email
    const domain = userEmail.split('@')[1];
    
    // Check if organization already exists for this domain
    const existing = await firestore
      .collection(COLLECTIONS.API_ORGANIZATIONS)
      .where('domain', '==', domain)
      .where('ownerId', '==', userId)
      .limit(1)
      .get();
    
    if (!existing.empty) {
      throw new Error('API organization already exists for this domain');
    }
    
    // Get quotas for tier
    const quotas = TIER_QUOTAS[invitation.tier];
    
    // Create organization
    const orgData: Omit<APIOrganization, 'id'> = {
      name: `${domain}-API`,
      domain: domain,
      ownerId: userId,
      ownerEmail: userEmail,
      memberIds: [userId],
      type: 'api_consumer',
      tier: invitation.tier,
      quotas: {
        monthlyRequests: quotas.monthlyRequests,
        dailyRequests: quotas.dailyRequests,
        concurrentRequests: quotas.concurrentRequests,
        maxFileSize: quotas.maxFileSize,
      },
      usage: {
        totalRequests: 0,
        currentMonthRequests: 0,
        currentDayRequests: 0,
        totalDocumentsProcessed: 0,
        totalTokensUsed: 0,
        totalCost: 0,
      },
      status: invitation.tier === 'trial' ? 'trial' : 'active',
      trialEndsAt: invitation.tier === 'trial' && quotas.durationDays
        ? new Date(Date.now() + quotas.durationDays * 24 * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const docRef = await firestore
      .collection(COLLECTIONS.API_ORGANIZATIONS)
      .add(orgData);
    
    const organization = {
      id: docRef.id,
      ...orgData,
    } as APIOrganization;
    
    // Update invitation redemption count
    await redeemInvitation(invitation.id, userId, userEmail, docRef.id);
    
    console.log('✅ API organization created:', organization.id);
    
    return organization;
  } catch (error) {
    console.error('❌ Error creating API organization:', error);
    throw error;
  }
}

/**
 * Get API organization by ID
 */
export async function getAPIOrganization(
  organizationId: string
): Promise<APIOrganization | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.API_ORGANIZATIONS)
      .doc(organizationId)
      .get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data(),
    } as APIOrganization;
  } catch (error) {
    console.error('❌ Error getting API organization:', error);
    return null;
  }
}

/**
 * Get user's API organizations
 */
export async function getUserAPIOrganizations(
  userId: string
): Promise<APIOrganization[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.API_ORGANIZATIONS)
      .where('memberIds', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as APIOrganization[];
  } catch (error) {
    console.error('❌ Error getting user API organizations:', error);
    return [];
  }
}

/**
 * Update API organization usage
 */
export async function incrementAPIUsage(
  organizationId: string,
  tokensUsed: number,
  costUSD: number
): Promise<void> {
  try {
    const orgRef = firestore
      .collection(COLLECTIONS.API_ORGANIZATIONS)
      .doc(organizationId);
    
    await orgRef.update({
      'usage.totalRequests': firestore.FieldValue.increment(1),
      'usage.currentMonthRequests': firestore.FieldValue.increment(1),
      'usage.currentDayRequests': firestore.FieldValue.increment(1),
      'usage.totalDocumentsProcessed': firestore.FieldValue.increment(1),
      'usage.totalTokensUsed': firestore.FieldValue.increment(tokensUsed),
      'usage.totalCost': firestore.FieldValue.increment(costUSD),
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('❌ Error incrementing API usage:', error);
    throw error;
  }
}

// ============================================================================
// API KEYS
// ============================================================================

/**
 * Generate and store new API key
 */
export async function createAPIKey(
  organizationId: string,
  createdBy: string,
  createdByEmail: string,
  name: string,
  scopes: APIScope[]
): Promise<{ key: string; keyInfo: APIKey }> {
  try {
    // Generate API key
    const key = generateAPIKey(getEnvironmentSource());
    const keyHash = await bcrypt.hash(key, 10);
    const keyPrefix = key.substring(0, 8);
    
    // Create key document
    const keyData: Omit<APIKey, 'id'> = {
      key: keyHash,
      keyPrefix: keyPrefix,
      organizationId: organizationId,
      createdBy: createdBy,
      createdByEmail: createdByEmail,
      name: name,
      scopes: scopes,
      status: 'active',
      createdAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const docRef = await firestore
      .collection(COLLECTIONS.API_KEYS)
      .add(keyData);
    
    const keyInfo = {
      id: docRef.id,
      ...keyData,
    } as APIKey;
    
    console.log('✅ API key created:', keyInfo.id);
    
    // Return actual key (shown only once!) and metadata
    return { key, keyInfo };
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    throw error;
  }
}

/**
 * Validate API key and return organization
 */
export async function validateAPIKey(
  apiKey: string
): Promise<APIValidationResult> {
  try {
    // Get all active keys (we need to hash-compare)
    const snapshot = await firestore
      .collection(COLLECTIONS.API_KEYS)
      .where('status', '==', 'active')
      .get();
    
    // Find matching key
    for (const doc of snapshot.docs) {
      const keyData = doc.data() as APIKey;
      const matches = await bcrypt.compare(apiKey, keyData.key);
      
      if (matches) {
        // Check if expired
        if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
          return {
            valid: false,
            error: {
              code: 'KEY_EXPIRED',
              message: 'API key has expired',
            },
          };
        }
        
        // Get organization
        const organization = await getAPIOrganization(keyData.organizationId);
        
        if (!organization) {
          return {
            valid: false,
            error: {
              code: 'ORG_NOT_FOUND',
              message: 'Organization not found',
            },
          };
        }
        
        // Check organization status
        if (organization.status === 'suspended') {
          return {
            valid: false,
            error: {
              code: 'ORG_SUSPENDED',
              message: 'Organization is suspended',
            },
          };
        }
        
        // Check trial expiration
        if (organization.status === 'trial' && organization.trialEndsAt) {
          if (new Date(organization.trialEndsAt) < new Date()) {
            return {
              valid: false,
              error: {
                code: 'TRIAL_EXPIRED',
                message: 'Trial period has ended',
              },
            };
          }
        }
        
        // Update last used
        await firestore
          .collection(COLLECTIONS.API_KEYS)
          .doc(doc.id)
          .update({
            lastUsedAt: new Date(),
          });
        
        return {
          valid: true,
          organization: organization,
          scopes: keyData.scopes,
        };
      }
    }
    
    // No matching key found
    return {
      valid: false,
      error: {
        code: 'INVALID_KEY',
        message: 'Invalid API key',
      },
    };
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error validating API key',
      },
    };
  }
}

/**
 * Check if request is within quota limits
 */
export async function checkQuotas(
  organizationId: string
): Promise<QuotaCheckResult> {
  try {
    const organization = await getAPIOrganization(organizationId);
    
    if (!organization) {
      return {
        allowed: false,
        reason: 'Organization not found',
      };
    }
    
    // Check monthly quota
    if (organization.usage.currentMonthRequests >= organization.quotas.monthlyRequests) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        reason: 'Monthly quota exceeded',
        quotas: {
          limit: organization.quotas.monthlyRequests,
          used: organization.usage.currentMonthRequests,
          remaining: 0,
          resetsAt: nextMonth.toISOString(),
        },
      };
    }
    
    // Check daily quota
    if (organization.usage.currentDayRequests >= organization.quotas.dailyRequests) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        reason: 'Daily quota exceeded',
        quotas: {
          limit: organization.quotas.dailyRequests,
          used: organization.usage.currentDayRequests,
          remaining: 0,
          resetsAt: tomorrow.toISOString(),
        },
      };
    }
    
    // Within quotas
    return {
      allowed: true,
      quotas: {
        limit: organization.quotas.monthlyRequests,
        used: organization.usage.currentMonthRequests,
        remaining: organization.quotas.monthlyRequests - organization.usage.currentMonthRequests,
        resetsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      },
    };
  } catch (error) {
    console.error('❌ Error checking quotas:', error);
    return {
      allowed: false,
      reason: 'Error checking quotas',
    };
  }
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Create API invitation (SuperAdmin only)
 */
export async function createAPIInvitation(
  createdBy: string,
  createdByEmail: string,
  targetAudience: string,
  description: string,
  maxRedemptions: number,
  defaultTier: APIOrganizationTier,
  expiresInDays?: number,
  allowedDomains?: string[]
): Promise<APIInvitation> {
  try {
    const invitationCode = generateInvitationCode(targetAudience);
    
    const invitationData: Omit<APIInvitation, 'id'> = {
      invitationCode: invitationCode,
      createdBy: createdBy,
      createdByEmail: createdByEmail,
      targetAudience: targetAudience,
      description: description,
      allowedDomains: allowedDomains,
      maxRedemptions: maxRedemptions,
      currentRedemptions: 0,
      defaultTier: defaultTier,
      trialDuration: defaultTier === 'trial' ? TIER_QUOTAS.trial.durationDays : undefined,
      status: 'active',
      redeemedBy: [],
      createdAt: new Date(),
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      source: getEnvironmentSource(),
    };
    
    const docRef = await firestore
      .collection(COLLECTIONS.API_INVITATIONS)
      .add(invitationData);
    
    const invitation = {
      id: docRef.id,
      ...invitationData,
    } as APIInvitation;
    
    console.log('✅ API invitation created:', invitation.invitationCode);
    
    return invitation;
  } catch (error) {
    console.error('❌ Error creating API invitation:', error);
    throw error;
  }
}

/**
 * Validate invitation code
 */
async function validateInvitationCode(
  code: string
): Promise<{ valid: boolean; tier: APIOrganizationTier; id: string }> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.API_INVITATIONS)
      .where('invitationCode', '==', code)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { valid: false, tier: 'trial', id: '' };
    }
    
    const invitation = snapshot.docs[0].data() as APIInvitation;
    
    // Check expiration
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { valid: false, tier: 'trial', id: '' };
    }
    
    // Check redemption limit
    if (invitation.currentRedemptions >= invitation.maxRedemptions) {
      return { valid: false, tier: 'trial', id: '' };
    }
    
    return {
      valid: true,
      tier: invitation.defaultTier,
      id: snapshot.docs[0].id,
    };
  } catch (error) {
    console.error('❌ Error validating invitation:', error);
    return { valid: false, tier: 'trial', id: '' };
  }
}

/**
 * Redeem invitation
 */
async function redeemInvitation(
  invitationId: string,
  userId: string,
  userEmail: string,
  organizationId: string
): Promise<void> {
  try {
    await firestore
      .collection(COLLECTIONS.API_INVITATIONS)
      .doc(invitationId)
      .update({
        currentRedemptions: firestore.FieldValue.increment(1),
        redeemedBy: firestore.FieldValue.arrayUnion({
          userId: userId,
          userEmail: userEmail,
          organizationId: organizationId,
          redeemedAt: new Date(),
        }),
      });
    
    console.log('✅ Invitation redeemed:', invitationId);
  } catch (error) {
    console.error('❌ Error redeeming invitation:', error);
    throw error;
  }
}

/**
 * Get all invitations (SuperAdmin)
 */
export async function getAllAPIInvitations(): Promise<APIInvitation[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.API_INVITATIONS)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as APIInvitation[];
  } catch (error) {
    console.error('❌ Error getting invitations:', error);
    return [];
  }
}

// ============================================================================
// USAGE LOGGING
// ============================================================================

/**
 * Log API usage
 */
export async function logAPIUsage(
  organizationId: string,
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  success: boolean,
  details: {
    fileType?: string;
    fileSize?: number;
    model?: string;
    extractionMethod?: string;
    tokensUsed?: number;
    costUSD?: number;
    durationMs: number;
    ipAddress: string;
    userAgent: string;
    errorMessage?: string;
    errorCode?: string;
  }
): Promise<void> {
  try {
    const logData: Omit<APIUsageLog, 'id'> = {
      organizationId: organizationId,
      apiKeyId: apiKeyId,
      endpoint: endpoint,
      method: method,
      statusCode: statusCode,
      success: success,
      fileType: details.fileType,
      fileSize: details.fileSize,
      model: details.model,
      extractionMethod: details.extractionMethod,
      tokensUsed: details.tokensUsed,
      costUSD: details.costUSD,
      durationMs: details.durationMs,
      ipAddress: hashIP(details.ipAddress),
      userAgent: details.userAgent,
      errorMessage: details.errorMessage,
      errorCode: details.errorCode,
      timestamp: new Date(),
      source: getEnvironmentSource(),
    };
    
    // Non-blocking insert
    firestore
      .collection(COLLECTIONS.API_USAGE_LOGS)
      .add(logData)
      .catch(err => console.warn('⚠️ Failed to log API usage (non-critical):', err));
    
    // If successful, increment organization usage
    if (success && details.tokensUsed && details.costUSD) {
      await incrementAPIUsage(organizationId, details.tokensUsed, details.costUSD);
    }
  } catch (error) {
    console.error('❌ Error logging API usage:', error);
    // Non-critical - don't throw
  }
}

/**
 * Get usage logs for organization
 */
export async function getAPIUsageLogs(
  organizationId: string,
  limit: number = 100
): Promise<APIUsageLog[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.API_USAGE_LOGS)
      .where('organizationId', '==', organizationId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as APIUsageLog[];
  } catch (error) {
    console.error('❌ Error getting usage logs:', error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get environment source
 */
function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  return isDevelopment ? 'localhost' : 'production';
}

/**
 * Generate API key
 */
function generateAPIKey(environment: 'localhost' | 'production'): string {
  const prefix = environment === 'production' ? 'fv_live' : 'fv_test';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${prefix}_${random}`;
}

/**
 * Generate invitation code
 */
function generateInvitationCode(audience: string): string {
  const date = new Date().toISOString().slice(0, 7).replace('-', '');
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const audienceCode = audience.toUpperCase().replace(/\s+/g, '-').slice(0, 10);
  
  return `FLOW-${audienceCode}-${date}-${random}`;
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  // Simple hash for IP privacy
  return Buffer.from(ip).toString('base64').substring(0, 16);
}

