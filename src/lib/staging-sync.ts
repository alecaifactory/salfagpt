/**
 * Staging-Production Sync Library
 * 
 * Bidirectional sync between staging and production environments:
 * - Production → Staging: Refresh staging with latest production data
 * - Staging → Production: Promotion workflow (via promotion.ts)
 * 
 * Best Practice #2: Bidirectional sync
 * Best Practice #4: Read-only production access from staging
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import { Firestore } from '@google-cloud/firestore';
import { firestore as localFirestore, COLLECTIONS } from './firestore.js';
import type { DataSource } from '../types/organizations.js';

/**
 * Get Firestore client for specific environment
 */
function getFirestoreClient(projectId: string): Firestore {
  return new Firestore({
    projectId,
    // Uses Application Default Credentials or Workload Identity
  });
}

/**
 * Configuration for sync
 */
interface SyncConfig {
  productionProjectId: string;
  stagingProjectId: string;
  collections: string[];
  batchSize: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  productionProjectId: process.env.PROD_PROJECT_ID || 'salfagpt',
  stagingProjectId: process.env.STAGING_PROJECT_ID || 'salfagpt-staging',
  collections: [
    COLLECTIONS.CONVERSATIONS,
    COLLECTIONS.MESSAGES,
    COLLECTIONS.USERS,
    COLLECTIONS.CONTEXT_SOURCES,
    COLLECTIONS.FOLDERS,
    COLLECTIONS.ORGANIZATIONS,
    // Add others as needed
  ],
  batchSize: 500,  // Firestore batch limit
};

/**
 * ========================================
 * PRODUCTION → STAGING SYNC
 * ========================================
 */

/**
 * Sync data from production to staging (refresh staging)
 * READ-ONLY access to production - safe operation
 */
export async function syncProductionToStaging(
  options?: {
    collections?: string[];
    dryRun?: boolean;
  }
): Promise<{
  success: boolean;
  collections: Record<string, { synced: number; errors: number }>;
  errors: string[];
}> {
  const config = DEFAULT_SYNC_CONFIG;
  const collections = options?.collections || config.collections;
  const dryRun = options?.dryRun ?? false;
  
  const result = {
    success: true,
    collections: {} as Record<string, { synced: number; errors: number }>,
    errors: [] as string[],
  };
  
  console.log('🔄 Starting production → staging sync...');
  console.log(`📦 Collections to sync: ${collections.length}`);
  console.log(`🏃 Dry run: ${dryRun ? 'YES (preview only)' : 'NO (will apply changes)'}`);
  console.log('');
  
  try {
    const prodFirestore = getFirestoreClient(config.productionProjectId);
    const stagingFirestore = getFirestoreClient(config.stagingProjectId);
    
    for (const collection of collections) {
      console.log(`📂 Syncing collection: ${collection}...`);
      
      result.collections[collection] = { synced: 0, errors: 0 };
      
      try {
        // Read from production (READ-ONLY)
        const prodSnapshot = await prodFirestore
          .collection(collection)
          .get();
        
        console.log(`  📊 Found ${prodSnapshot.size} documents in production`);
        
        if (dryRun) {
          result.collections[collection].synced = prodSnapshot.size;
          console.log(`  ✅ Dry run: Would sync ${prodSnapshot.size} documents`);
          continue;
        }
        
        // Sync in batches
        const batches = Math.ceil(prodSnapshot.size / config.batchSize);
        
        for (let i = 0; i < batches; i++) {
          const batch = stagingFirestore.batch();
          const start = i * config.batchSize;
          const end = Math.min((i + 1) * config.batchSize, prodSnapshot.size);
          const docs = prodSnapshot.docs.slice(start, end);
          
          docs.forEach(doc => {
            const data = doc.data();
            
            // Update source tag to indicate synced from production
            const syncedData = {
              ...data,
              source: 'staging',  // Mark as staging data
              syncedFromProduction: true,
              syncedAt: new Date(),
              productionVersion: data.version || 1,
            };
            
            const stagingRef = stagingFirestore
              .collection(collection)
              .doc(doc.id);  // Same ID as production
            
            batch.set(stagingRef, syncedData, { merge: true });
          });
          
          await batch.commit();
          result.collections[collection].synced += docs.length;
          
          console.log(`  ✅ Batch ${i + 1}/${batches}: ${docs.length} documents synced`);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  ❌ Error syncing ${collection}:`, errorMsg);
        result.collections[collection].errors++;
        result.errors.push(`${collection}: ${errorMsg}`);
        result.success = false;
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sync failed:', errorMsg);
    result.errors.push(errorMsg);
    result.success = false;
  }
  
  console.log('');
  console.log('🏁 Sync complete!');
  console.log('');
  
  // Summary
  const totalSynced = Object.values(result.collections).reduce((sum, c) => sum + c.synced, 0);
  const totalErrors = Object.values(result.collections).reduce((sum, c) => sum + c.errors, 0);
  
  console.log(`📊 Total synced: ${totalSynced} documents`);
  console.log(`❌ Total errors: ${totalErrors}`);
  
  if (result.success) {
    console.log('✅ All collections synced successfully');
  } else {
    console.log('⚠️  Some collections had errors (see above)');
  }
  
  return result;
}

/**
 * ========================================
 * CONFLICT DETECTION
 * ========================================
 */

/**
 * Compare staging and production versions
 * Detect documents that diverged
 */
export async function detectStagingProductionConflicts(
  collection: string,
  documentId: string
): Promise<{
  hasConflict: boolean;
  stagingVersion: number;
  productionVersion: number;
  conflictingFields: string[];
}> {
  const config = DEFAULT_SYNC_CONFIG;
  
  try {
    const prodFirestore = getFirestoreClient(config.productionProjectId);
    const stagingFirestore = getFirestoreClient(config.stagingProjectId);
    
    // Get both documents
    const [prodDoc, stagingDoc] = await Promise.all([
      prodFirestore.collection(collection).doc(documentId).get(),
      stagingFirestore.collection(collection).doc(documentId).get(),
    ]);
    
    if (!prodDoc.exists || !stagingDoc.exists) {
      return {
        hasConflict: false,
        stagingVersion: stagingDoc.exists ? (stagingDoc.data()?.version || 0) : 0,
        productionVersion: prodDoc.exists ? (prodDoc.data()?.version || 0) : 0,
        conflictingFields: [],
      };
    }
    
    const prodData = prodDoc.data()!;
    const stagingData = stagingDoc.data()!;
    
    const stagingProdVersion = stagingData.productionVersion || 0;
    const actualProdVersion = prodData.version || 0;
    
    // If staging's record of production version doesn't match actual, there's a conflict
    const hasConflict = stagingProdVersion !== actualProdVersion;
    
    const conflictingFields: string[] = [];
    
    if (hasConflict) {
      // Find which fields differ
      const allFields = new Set([
        ...Object.keys(prodData),
        ...Object.keys(stagingData),
      ]);
      
      for (const field of allFields) {
        // Skip metadata fields
        if (['id', 'createdAt', 'updatedAt', 'version', 'source', 'syncedAt', 'syncedFromProduction'].includes(field)) {
          continue;
        }
        
        if (JSON.stringify(prodData[field]) !== JSON.stringify(stagingData[field])) {
          conflictingFields.push(field);
        }
      }
    }
    
    return {
      hasConflict,
      stagingVersion: stagingData.version || 0,
      productionVersion: actualProdVersion,
      conflictingFields,
    };
    
  } catch (error) {
    console.error('❌ Error detecting conflicts:', error);
    throw error;
  }
}

/**
 * Batch check for conflicts across collection
 */
export async function batchDetectConflicts(
  collection: string,
  documentIds: string[]
): Promise<Record<string, {
  hasConflict: boolean;
  conflictingFields: string[];
}>> {
  const results: Record<string, any> = {};
  
  console.log(`🔍 Checking ${documentIds.length} documents for conflicts...`);
  
  for (const docId of documentIds) {
    try {
      const conflict = await detectStagingProductionConflicts(collection, docId);
      results[docId] = {
        hasConflict: conflict.hasConflict,
        conflictingFields: conflict.conflictingFields,
      };
    } catch (error) {
      console.error(`❌ Error checking ${docId}:`, error);
      results[docId] = {
        hasConflict: false,
        conflictingFields: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  const conflictCount = Object.values(results).filter(r => r.hasConflict).length;
  console.log(`📊 Conflicts detected: ${conflictCount}/${documentIds.length}`);
  
  return results;
}

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Get current environment from process
 */
function getCurrentEnvironment(): DataSource {
  const envName = process.env.ENVIRONMENT_NAME;
  if (envName === 'staging') return 'staging';
  if (envName === 'production') return 'production';
  
  const serviceName = process.env.K_SERVICE;
  if (serviceName?.includes('staging')) return 'staging';
  if (serviceName?.includes('prod')) return 'production';
  
  return 'localhost';
}

/**
 * Check if currently running in staging
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === 'staging';
}

/**
 * Check if currently running in production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Get opposite environment (for sync operations)
 */
export function getOppositeEnvironment(): 'staging' | 'production' {
  return isStaging() ? 'production' : 'staging';
}

/**
 * Validate sync is safe
 * Prevents accidental production writes
 */
export function validateSyncDirection(
  from: DataSource,
  to: DataSource
): { valid: boolean; error?: string } {
  // Production → Staging: Always safe (read-only prod access)
  if (from === 'production' && to === 'staging') {
    return { valid: true };
  }
  
  // Staging → Production: Only via promotion workflow
  if (from === 'staging' && to === 'production') {
    return {
      valid: false,
      error: 'Cannot sync directly to production. Use promotion workflow instead.',
    };
  }
  
  // Localhost → Anywhere: Not supported
  if (from === 'localhost') {
    return {
      valid: false,
      error: 'Cannot sync from localhost. Localhost is for development only.',
    };
  }
  
  return { valid: false, error: 'Invalid sync direction' };
}

/**
 * Log sync event for monitoring
 */
async function logSyncEvent(event: {
  action: string;
  source: DataSource;
  destination: DataSource;
  collections: string[];
  documentCount: number;
  success: boolean;
  errors?: string[];
}): Promise<void> {
  try {
    await localFirestore.collection('staging_sync_logs').add({
      ...event,
      timestamp: new Date(),
      performedBy: process.env.K_SERVICE || 'manual',
    });
  } catch (error) {
    // Non-critical - just log to console
    console.warn('⚠️ Failed to log sync event:', error);
  }
}

