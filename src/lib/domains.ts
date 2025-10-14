/**
 * Domain Management System
 * 
 * Manages domain-level access control, enabling/disabling domains,
 * and domain-level agent and context access.
 */

import { firestore } from './firestore';
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Domain interface
 */
export interface Domain {
  id: string;                       // Domain name (e.g., 'getaifactory.com')
  name: string;                     // Display name (e.g., 'GetAI Factory')
  enabled: boolean;                 // Whether domain is active
  createdBy: string;                // User email who created
  createdAt: Date;                  // Creation timestamp
  updatedAt: Date;                  // Last update timestamp
  
  // Access control
  allowedAgents: string[];          // Agent IDs accessible to this domain
  allowedContextSources: string[];  // Context source IDs accessible to this domain
  
  // Metadata
  userCount?: number;               // Number of users in this domain
  description?: string;             // Optional description
  settings?: DomainSettings;        // Domain-specific settings
}

export interface DomainSettings {
  maxUsersPerDomain?: number;
  defaultUserRole?: string;
  requireEmailVerification?: boolean;
  allowedFeatures?: string[];
}

/**
 * Get domain from email
 */
export function getDomainFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '';
  }
  return email.split('@')[1].toLowerCase().trim();
}

/**
 * Get all domains
 */
export async function getDomains(): Promise<Domain[]> {
  try {
    const snapshot = await firestore
      .collection('domains')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        enabled: data.enabled ?? true,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        allowedAgents: data.allowedAgents || [],
        allowedContextSources: data.allowedContextSources || [],
        userCount: data.userCount || 0,
        description: data.description,
        settings: data.settings,
      };
    });
  } catch (error) {
    console.error('❌ Error getting domains:', error);
    return [];
  }
}

/**
 * Get a single domain by ID
 */
export async function getDomain(domainId: string): Promise<Domain | null> {
  try {
    const doc = await firestore.collection('domains').doc(domainId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    return {
      id: doc.id,
      name: data.name || doc.id,
      enabled: data.enabled ?? true,
      createdBy: data.createdBy || '',
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      allowedAgents: data.allowedAgents || [],
      allowedContextSources: data.allowedContextSources || [],
      userCount: data.userCount || 0,
      description: data.description,
      settings: data.settings,
    };
  } catch (error) {
    console.error('❌ Error getting domain:', error);
    return null;
  }
}

/**
 * Create new domain
 */
export async function createDomain(
  domainId: string,
  data: {
    name: string;
    createdBy: string;
    enabled?: boolean;
    description?: string;
    allowedAgents?: string[];
    allowedContextSources?: string[];
    settings?: DomainSettings;
  }
): Promise<Domain> {
  try {
    const domainData = {
      name: data.name,
      enabled: data.enabled ?? true,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      allowedAgents: data.allowedAgents || [],
      allowedContextSources: data.allowedContextSources || [],
      userCount: 0,
      description: data.description || '',
      settings: data.settings || {},
    };
    
    await firestore.collection('domains').doc(domainId).set(domainData);
    
    console.log('✅ Domain created:', domainId);
    
    return {
      id: domainId,
      ...domainData,
    };
  } catch (error) {
    console.error('❌ Error creating domain:', error);
    throw new Error(`Failed to create domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update domain
 */
export async function updateDomain(
  domainId: string,
  updates: Partial<Omit<Domain, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await firestore.collection('domains').doc(domainId).update(updateData);
    
    console.log('✅ Domain updated:', domainId);
  } catch (error) {
    console.error('❌ Error updating domain:', error);
    throw new Error(`Failed to update domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete domain
 */
export async function deleteDomain(domainId: string): Promise<void> {
  try {
    await firestore.collection('domains').doc(domainId).delete();
    
    console.log('✅ Domain deleted:', domainId);
  } catch (error) {
    console.error('❌ Error deleting domain:', error);
    throw new Error(`Failed to delete domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enable/disable domain
 */
export async function setDomainEnabled(domainId: string, enabled: boolean): Promise<void> {
  try {
    await firestore.collection('domains').doc(domainId).update({
      enabled,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Domain ${enabled ? 'enabled' : 'disabled'}:`, domainId);
  } catch (error) {
    console.error('❌ Error updating domain status:', error);
    throw new Error(`Failed to ${enabled ? 'enable' : 'disable'} domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a user's domain is enabled
 */
export async function isUserDomainEnabled(userEmail: string): Promise<boolean> {
  const domainId = getDomainFromEmail(userEmail);
  
  if (!domainId) {
    return false;
  }
  
  try {
    const domain = await getDomain(domainId);
    return domain?.enabled ?? true; // Default to enabled if domain doesn't exist
  } catch (error) {
    console.error('❌ Error checking domain status:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Add agent access to domain
 */
export async function addAgentToDomain(domainId: string, agentId: string): Promise<void> {
  try {
    const domain = await getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }
    
    if (!domain.allowedAgents.includes(agentId)) {
      await firestore.collection('domains').doc(domainId).update({
        allowedAgents: [...domain.allowedAgents, agentId],
        updatedAt: new Date(),
      });
      
      console.log('✅ Agent added to domain:', { domainId, agentId });
    }
  } catch (error) {
    console.error('❌ Error adding agent to domain:', error);
    throw new Error(`Failed to add agent to domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove agent access from domain
 */
export async function removeAgentFromDomain(domainId: string, agentId: string): Promise<void> {
  try {
    const domain = await getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }
    
    await firestore.collection('domains').doc(domainId).update({
      allowedAgents: domain.allowedAgents.filter(id => id !== agentId),
      updatedAt: new Date(),
    });
    
    console.log('✅ Agent removed from domain:', { domainId, agentId });
  } catch (error) {
    console.error('❌ Error removing agent from domain:', error);
    throw new Error(`Failed to remove agent from domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add context source access to domain
 */
export async function addContextToDomain(domainId: string, contextSourceId: string): Promise<void> {
  try {
    const domain = await getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }
    
    if (!domain.allowedContextSources.includes(contextSourceId)) {
      await firestore.collection('domains').doc(domainId).update({
        allowedContextSources: [...domain.allowedContextSources, contextSourceId],
        updatedAt: new Date(),
      });
      
      console.log('✅ Context added to domain:', { domainId, contextSourceId });
    }
  } catch (error) {
    console.error('❌ Error adding context to domain:', error);
    throw new Error(`Failed to add context to domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove context source access from domain
 */
export async function removeContextFromDomain(domainId: string, contextSourceId: string): Promise<void> {
  try {
    const domain = await getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }
    
    await firestore.collection('domains').doc(domainId).update({
      allowedContextSources: domain.allowedContextSources.filter(id => id !== contextSourceId),
      updatedAt: new Date(),
    });
    
    console.log('✅ Context removed from domain:', { domainId, contextSourceId });
  } catch (error) {
    console.error('❌ Error removing context from domain:', error);
    throw new Error(`Failed to remove context from domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get users count for a domain
 */
export async function getUserCountForDomain(domainId: string): Promise<number> {
  try {
    const snapshot = await firestore
      .collection('users')
      .get();
    
    const count = snapshot.docs.filter(doc => {
      const email = doc.data().email || '';
      return getDomainFromEmail(email) === domainId;
    }).length;
    
    return count;
  } catch (error) {
    console.error('❌ Error counting users for domain:', error);
    return 0;
  }
}

/**
 * Batch create domains from comma-separated list
 */
export async function batchCreateDomains(
  domainList: string,
  createdBy: string,
  enabled: boolean = true
): Promise<{ created: string[]; failed: string[] }> {
  const domains = domainList.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
  const created: string[] = [];
  const failed: string[] = [];
  
  for (const domainId of domains) {
    try {
      await createDomain(domainId, {
        name: domainId,
        createdBy,
        enabled,
      });
      created.push(domainId);
    } catch (error) {
      console.error(`❌ Failed to create domain ${domainId}:`, error);
      failed.push(domainId);
    }
  }
  
  return { created, failed };
}

