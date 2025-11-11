/**
 * Organization Management Library
 * 
 * Complete CRUD operations for multi-organization system
 * Supports multi-domain organizations, admin management, and hierarchy validation
 * 
 * BACKWARD COMPATIBLE: All functions are NEW (no modifications to existing)
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import { firestore, COLLECTIONS } from './firestore.js';
import type { 
  Organization, 
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationStats,
  OrganizationMembership,
  DomainEvaluationConfig,
  DataSource
} from '../types/organizations.js';
import { 
  generateOrgSlug, 
  validateOrganization, 
  DEFAULT_ORGANIZATION_CONFIG,
  isDomainInOrganization 
} from '../types/organizations.js';

/**
 * ========================================
 * ORGANIZATION CRUD OPERATIONS
 * ========================================
 */

/**
 * Create a new organization
 * Only SuperAdmins can create organizations
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  // Validate input
  const tempOrg: Partial<Organization> = {
    name: input.name,
    domains: input.domains,
    primaryDomain: input.primaryDomain,
    ownerUserId: input.ownerUserId,
  };
  
  const errors = validateOrganization(tempOrg);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  // Generate slug
  const slug = generateOrgSlug(input.name);
  
  // Check if slug already exists
  const existing = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .where('slug', '==', slug)
    .get();
    
  if (!existing.empty) {
    throw new Error(`Organization with slug "${slug}" already exists`);
  }
  
  // Create organization document
  const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc();
  
  const now = new Date();
  const organization: Organization = {
    id: orgRef.id,
    name: input.name,
    slug,
    domains: input.domains.map(d => d.toLowerCase()),
    primaryDomain: input.primaryDomain.toLowerCase(),
    admins: [input.ownerUserId], // Owner is first admin
    ownerUserId: input.ownerUserId,
    
    // Merge with defaults
    tenant: {
      ...DEFAULT_ORGANIZATION_CONFIG.tenant,
      ...input.tenant,
    },
    branding: {
      ...DEFAULT_ORGANIZATION_CONFIG.branding,
      ...input.branding,
    },
    evaluationConfig: {
      ...DEFAULT_ORGANIZATION_CONFIG.evaluationConfig,
      ...input.evaluationConfig,
    },
    privacy: {
      ...DEFAULT_ORGANIZATION_CONFIG.privacy,
      ...input.privacy,
    },
    limits: {
      ...DEFAULT_ORGANIZATION_CONFIG.limits,
      ...input.limits,
    },
    
    // Versioning
    version: 1,
    lastModifiedIn: getEnvironmentSource(),
    
    // Metadata
    isActive: true,
    createdAt: now,
    updatedAt: now,
    source: getEnvironmentSource(),
  };
  
  await orgRef.set(organization);
  
  console.log('✅ Organization created:', organization.id, organization.name);
  
  return organization;
}

/**
 * Get organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(orgId)
      .get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
      promotedAt: data?.promotedAt?.toDate?.() || data?.promotedAt,
    } as Organization;
  } catch (error) {
    console.error('❌ Error getting organization:', error);
    return null;
  }
}

/**
 * Get organization by domain
 * Finds the org that owns a specific domain
 */
export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  try {
    const normalizedDomain = domain.toLowerCase();
    
    const snapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .where('domains', 'array-contains', normalizedDomain)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
    } as Organization;
  } catch (error) {
    console.error('❌ Error getting organization by domain:', error);
    return null;
  }
}

/**
 * List all organizations
 * SuperAdmin only - returns all orgs
 */
export async function listOrganizations(): Promise<Organization[]> {
  try {
    console.log('📊 Querying organizations collection...');
    
    const snapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log('✅ Organizations query result:', {
      count: snapshot.size,
      docs: snapshot.docs.map(d => ({ id: d.id, name: d.data().name }))
    });
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
      } as Organization;
    });
  } catch (error) {
    console.error('❌ Error listing organizations:', error);
    return [];
  }
}

/**
 * List organizations user can access
 * For org admins - returns only their assigned orgs
 */
export async function listUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .where('admins', 'array-contains', userId)
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
      } as Organization;
    });
  } catch (error) {
    console.error('❌ Error listing user organizations:', error);
    return [];
  }
}

/**
 * Update organization
 * Increments version for conflict detection
 */
export async function updateOrganization(
  orgId: string,
  updates: UpdateOrganizationInput
): Promise<void> {
  try {
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    const currentVersion = currentOrg.version || 1;
    
    // Build update object (only non-undefined fields)
    const updateData: any = {
      updatedAt: new Date(),
      version: currentVersion + 1,  // Increment version
      lastModifiedIn: getEnvironmentSource(),
    };
    
    // Add only provided fields
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.primaryDomain !== undefined) {
      updateData.primaryDomain = updates.primaryDomain.toLowerCase();
    }
    if (updates.branding !== undefined) {
      updateData.branding = { ...currentOrg.branding, ...updates.branding };
    }
    if (updates.evaluationConfig !== undefined) {
      updateData.evaluationConfig = { ...currentOrg.evaluationConfig, ...updates.evaluationConfig };
    }
    if (updates.privacy !== undefined) {
      updateData.privacy = { ...currentOrg.privacy, ...updates.privacy };
    }
    if (updates.limits !== undefined) {
      updateData.limits = { ...currentOrg.limits, ...updates.limits };
    }
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    await orgRef.update(updateData);
    
    console.log('✅ Organization updated:', orgId, `v${currentVersion} → v${currentVersion + 1}`);
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    throw error;
  }
}

/**
 * Delete organization (soft delete - mark as inactive)
 * SuperAdmin only
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  try {
    await firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(orgId)
      .update({
        isActive: false,
        updatedAt: new Date(),
      });
    
    console.log('✅ Organization deleted (soft):', orgId);
  } catch (error) {
    console.error('❌ Error deleting organization:', error);
    throw error;
  }
}

/**
 * ========================================
 * MULTI-DOMAIN OPERATIONS
 * ========================================
 */

/**
 * Add domain to organization
 */
export async function addDomainToOrganization(
  orgId: string,
  domain: string
): Promise<void> {
  try {
    const normalizedDomain = domain.toLowerCase();
    
    // Verify domain not already in another org
    const existing = await getOrganizationByDomain(normalizedDomain);
    if (existing && existing.id !== orgId) {
      throw new Error(`Domain ${domain} already belongs to organization ${existing.name}`);
    }
    
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    const currentDomains = currentOrg.domains || [];
    
    if (currentDomains.includes(normalizedDomain)) {
      console.log('ℹ️ Domain already in organization:', normalizedDomain);
      return;
    }
    
    await orgRef.update({
      domains: [...currentDomains, normalizedDomain],
      updatedAt: new Date(),
      version: (currentOrg.version || 1) + 1,
    });
    
    console.log('✅ Domain added to organization:', normalizedDomain, '→', orgId);
  } catch (error) {
    console.error('❌ Error adding domain:', error);
    throw error;
  }
}

/**
 * Remove domain from organization
 * Cannot remove primary domain
 */
export async function removeDomainFromOrganization(
  orgId: string,
  domain: string
): Promise<void> {
  try {
    const normalizedDomain = domain.toLowerCase();
    
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    
    // Cannot remove primary domain
    if (currentOrg.primaryDomain === normalizedDomain) {
      throw new Error('Cannot remove primary domain. Set a different primary domain first.');
    }
    
    const currentDomains = currentOrg.domains || [];
    const updatedDomains = currentDomains.filter(d => d !== normalizedDomain);
    
    if (updatedDomains.length === currentDomains.length) {
      console.log('ℹ️ Domain not in organization:', normalizedDomain);
      return;
    }
    
    await orgRef.update({
      domains: updatedDomains,
      updatedAt: new Date(),
      version: (currentOrg.version || 1) + 1,
    });
    
    console.log('✅ Domain removed from organization:', normalizedDomain, 'from', orgId);
  } catch (error) {
    console.error('❌ Error removing domain:', error);
    throw error;
  }
}

/**
 * ========================================
 * ADMIN MANAGEMENT
 * ========================================
 */

/**
 * Add admin to organization
 * Grants full org management permissions
 */
export async function addOrgAdmin(
  orgId: string,
  userId: string
): Promise<void> {
  try {
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    const currentAdmins = currentOrg.admins || [];
    
    if (currentAdmins.includes(userId)) {
      console.log('ℹ️ User already admin of organization:', userId);
      return;
    }
    
    await orgRef.update({
      admins: [...currentAdmins, userId],
      updatedAt: new Date(),
      version: (currentOrg.version || 1) + 1,
    });
    
    console.log('✅ Admin added to organization:', userId, '→', orgId);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
    throw error;
  }
}

/**
 * Remove admin from organization
 * Cannot remove owner
 */
export async function removeOrgAdmin(
  orgId: string,
  userId: string
): Promise<void> {
  try {
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    
    // Cannot remove owner
    if (currentOrg.ownerUserId === userId) {
      throw new Error('Cannot remove organization owner. Transfer ownership first.');
    }
    
    const currentAdmins = currentOrg.admins || [];
    const updatedAdmins = currentAdmins.filter(id => id !== userId);
    
    if (updatedAdmins.length === currentAdmins.length) {
      console.log('ℹ️ User not admin of organization:', userId);
      return;
    }
    
    await orgRef.update({
      admins: updatedAdmins,
      updatedAt: new Date(),
      version: (currentOrg.version || 1) + 1,
    });
    
    console.log('✅ Admin removed from organization:', userId, 'from', orgId);
  } catch (error) {
    console.error('❌ Error removing admin:', error);
    throw error;
  }
}

/**
 * Check if user is admin of organization
 */
export async function isOrgAdmin(
  userId: string,
  orgId: string
): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) return false;
    
    return org.ownerUserId === userId || org.admins.includes(userId);
  } catch (error) {
    console.error('❌ Error checking org admin:', error);
    return false;
  }
}

/**
 * ========================================
 * USER-ORGANIZATION RELATIONSHIPS
 * ========================================
 */

/**
 * Get users in organization
 */
export async function getUsersInOrganization(
  orgId: string,
  options?: {
    includeInactive?: boolean;
    role?: string;
  }
): Promise<any[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.USERS)
      .where('organizationId', '==', orgId);
    
    if (!options?.includeInactive) {
      query = query.where('isActive', '==', true);
    }
    
    if (options?.role) {
      query = query.where('role', '==', options.role);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt,
      updatedAt: doc.data()?.updatedAt?.toDate?.() || doc.data()?.updatedAt,
    }));
  } catch (error) {
    console.error('❌ Error getting users in organization:', error);
    return [];
  }
}

/**
 * Assign user to organization
 * Updates user document with organizationId
 */
export async function assignUserToOrganization(
  userId: string,
  orgId: string,
  options?: {
    domainId?: string;
    addToAssignedOrgs?: boolean;
  }
): Promise<void> {
  try {
    const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }
    
    const org = await getOrganization(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Set as primary org if not already set
    const currentUser = userDoc.data();
    if (!currentUser?.organizationId || options?.addToAssignedOrgs === false) {
      updateData.organizationId = orgId;
    }
    
    // Add to assigned organizations for multi-org access
    if (options?.addToAssignedOrgs && currentUser?.organizationId !== orgId) {
      const currentAssigned = currentUser?.assignedOrganizations || [];
      if (!currentAssigned.includes(orgId)) {
        updateData.assignedOrganizations = [...currentAssigned, orgId];
      }
    }
    
    // Set domain if specified
    if (options?.domainId) {
      updateData.domainId = options.domainId;
    }
    
    await userRef.update(updateData);
    
    console.log('✅ User assigned to organization:', userId, '→', orgId);
  } catch (error) {
    console.error('❌ Error assigning user to organization:', error);
    throw error;
  }
}

/**
 * Remove user from organization
 */
export async function removeUserFromOrganization(
  userId: string,
  orgId: string
): Promise<void> {
  try {
    const userRef = firestore.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }
    
    const currentUser = userDoc.data();
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // If this is primary org, remove it
    if (currentUser?.organizationId === orgId) {
      updateData.organizationId = null;
      updateData.domainId = null;
    }
    
    // Remove from assigned organizations
    if (currentUser?.assignedOrganizations?.includes(orgId)) {
      updateData.assignedOrganizations = currentUser.assignedOrganizations.filter(
        (id: string) => id !== orgId
      );
    }
    
    await userRef.update(updateData);
    
    console.log('✅ User removed from organization:', userId, 'from', orgId);
  } catch (error) {
    console.error('❌ Error removing user from organization:', error);
    throw error;
  }
}

/**
 * ========================================
 * HIERARCHY VALIDATION (Best Practice #6)
 * ========================================
 */

/**
 * Validate user belongs to organization
 * Used before granting access to org resources
 */
export async function validateUserInOrganization(
  userId: string,
  orgId: string
): Promise<boolean> {
  try {
    const userDoc = await firestore
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();
    
    if (!userDoc.exists) return false;
    
    const user = userDoc.data();
    
    // Check primary org
    if (user?.organizationId === orgId) return true;
    
    // Check assigned orgs
    if (user?.assignedOrganizations?.includes(orgId)) return true;
    
    return false;
  } catch (error) {
    console.error('❌ Error validating user in organization:', error);
    return false;
  }
}

/**
 * Validate domain belongs to organization
 */
export async function validateDomainInOrganization(
  domain: string,
  orgId: string
): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) return false;
    
    return isDomainInOrganization(domain, org);
  } catch (error) {
    console.error('❌ Error validating domain in organization:', error);
    return false;
  }
}

/**
 * Get user's organization from their email domain
 * Useful for auto-assignment during user creation
 */
export async function getUserOrganizationFromEmail(
  email: string
): Promise<Organization | null> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  return await getOrganizationByDomain(domain);
}

/**
 * ========================================
 * ORGANIZATION STATISTICS
 * ========================================
 */

/**
 * Calculate organization statistics
 * Cached for performance
 */
export async function calculateOrganizationStats(
  orgId: string
): Promise<OrganizationStats> {
  try {
    // Get users
    const users = await getUsersInOrganization(orgId, { includeInactive: false });
    const totalUsers = users.length;
    const adminCount = users.filter((u: any) => u.role === 'admin' || u.roles?.includes('admin')).length;
    
    // ✅ MIGRATION COMPLETE - Now querying real data
    
    // Get conversations (agents)
    const conversations = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('organizationId', '==', orgId)
      .get();
    
    const allConvs = conversations.docs.map(d => d.data());
    const totalAgents = allConvs.length;
    const activeAgents = allConvs.filter(c => c.status !== 'archived').length;
    const sharedAgents = allConvs.filter(c => c.isShared).length;
    
    // Get context sources
    const contextSources = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('organizationId', '==', orgId)
      .get();
    
    const allSources = contextSources.docs.map(d => d.data());
    const totalContextSources = allSources.length;
    const validatedSources = allSources.filter(s => s.metadata?.validated || s.certified).length;
    
    // Get messages (for token usage) - limit to recent for performance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const messages = await firestore
      .collection(COLLECTIONS.MESSAGES)
      .where('organizationId', '==', orgId)
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();
    
    const totalMessages = messages.size;
    const totalTokensUsed = messages.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.tokenCount || 0);
    }, 0);
    
    // Estimate cost (Gemini pricing: ~$0.000002 per token average)
    const estimatedMonthlyCost = totalTokensUsed * 0.000002;
    
    const stats: OrganizationStats = {
      organizationId: orgId,
      totalUsers,
      activeUsers: totalUsers,
      adminCount,
      totalAgents,
      activeAgents,
      sharedAgents,
      totalContextSources,
      validatedSources,
      totalMessages,
      totalTokensUsed,
      estimatedMonthlyCost,
      computedAt: new Date(),
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Error calculating organization stats:', error);
    // Return empty stats instead of throwing
    return {
      organizationId: orgId,
      totalUsers: 0,
      activeUsers: 0,
      adminCount: 0,
      totalAgents: 0,
      activeAgents: 0,
      sharedAgents: 0,
      totalContextSources: 0,
      validatedSources: 0,
      totalMessages: 0,
      totalTokensUsed: 0,
      estimatedMonthlyCost: 0,
      computedAt: new Date(),
    };
  }
}

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */

/**
 * Get environment source (reuse from firestore.ts if available, or local implementation)
 */
function getEnvironmentSource(): DataSource {
  // Check explicit environment variable first
  const envName = process.env.ENVIRONMENT_NAME;
  if (envName === 'staging') return 'staging';
  if (envName === 'production') return 'production';
  if (envName === 'local' || envName === 'localhost') return 'localhost';
  
  // Check Cloud Run service name
  const serviceName = process.env.K_SERVICE;
  if (serviceName) {
    if (serviceName.includes('staging')) return 'staging';
    if (serviceName.includes('production') || serviceName.includes('prod')) return 'production';
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'development' || !process.env.K_SERVICE) {
    return 'localhost';
  }
  
  return 'production';
}

/**
 * Batch assign users to organization by domain
 * Useful for bulk migration
 */
export async function batchAssignUsersByDomain(
  orgId: string,
  domains: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  try {
    // Get all users with matching email domains
    const normalizedDomains = domains.map(d => d.toLowerCase());
    
    const allUsers = await firestore
      .collection(COLLECTIONS.USERS)
      .get();
    
    const usersToAssign = allUsers.docs.filter(doc => {
      const email = doc.data().email?.toLowerCase() || '';
      const emailDomain = email.split('@')[1];
      return emailDomain && normalizedDomains.includes(emailDomain);
    });
    
    console.log(`📊 Found ${usersToAssign.length} users to assign to organization ${orgId}`);
    
    // Batch update (Firestore limit: 500 operations per batch)
    const batchSize = 500;
    for (let i = 0; i < usersToAssign.length; i += batchSize) {
      const batch = firestore.batch();
      const chunk = usersToAssign.slice(i, i + batchSize);
      
      chunk.forEach(doc => {
        const userRef = firestore.collection(COLLECTIONS.USERS).doc(doc.id);
        batch.update(userRef, {
          organizationId: orgId,
          updatedAt: new Date(),
        });
      });
      
      await batch.commit();
      results.success += chunk.length;
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} complete: ${chunk.length} users assigned`);
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in batch assignment:', errorMsg);
    results.failed++;
    results.errors.push(errorMsg);
  }
  
  return results;
}

/**
 * Get organization evaluation configuration
 * Integrates with existing domain_review_configs
 */
export async function getOrganizationEvaluationConfig(
  orgId: string
): Promise<Record<string, DomainEvaluationConfig>> {
  try {
    const org = await getOrganization(orgId);
    if (!org || !org.evaluationConfig.enabled) {
      return {};
    }
    
    return org.evaluationConfig.domainConfigs || {};
  } catch (error) {
    console.error('❌ Error getting org evaluation config:', error);
    return {};
  }
}

/**
 * Update organization evaluation configuration for a domain
 */
export async function updateDomainEvaluationConfig(
  orgId: string,
  domainId: string,
  config: Partial<DomainEvaluationConfig>
): Promise<void> {
  try {
    const orgRef = firestore.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      throw new Error(`Organization ${orgId} not found`);
    }
    
    const currentOrg = orgDoc.data() as Organization;
    const currentDomainConfigs = currentOrg.evaluationConfig?.domainConfigs || {};
    const currentDomainConfig = currentDomainConfigs[domainId] || {};
    
    const updatedConfig = {
      ...currentDomainConfig,
      ...config,
      domainId, // Ensure domainId is set
    };
    
    await orgRef.update({
      [`evaluationConfig.domainConfigs.${domainId}`]: updatedConfig,
      updatedAt: new Date(),
      version: (currentOrg.version || 1) + 1,
    });
    
    console.log('✅ Domain evaluation config updated:', domainId, 'in org', orgId);
  } catch (error) {
    console.error('❌ Error updating domain evaluation config:', error);
    throw error;
  }
}

