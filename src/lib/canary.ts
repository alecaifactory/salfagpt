/**
 * Canary Deployment System
 * 
 * Enables safe progressive rollout with instant rollback
 * Only canary users see new version, everyone else on stable
 */

import { firestore } from './firestore';
import type { CanaryConfig, CanaryDeploymentInfo } from '../types/canary';

/**
 * Get current canary configuration
 */
export async function getCanaryConfig(): Promise<CanaryConfig | null> {
  try {
    const doc = await firestore.collection('canary_config').doc('current').get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      lastUpdatedAt: data?.lastUpdatedAt?.toDate() || new Date(),
      completedAt: data?.completedAt?.toDate(),
      rolledBackAt: data?.rolledBackAt?.toDate(),
    } as CanaryConfig;
  } catch (error) {
    console.error('❌ Error getting canary config:', error);
    return null;
  }
}

/**
 * Check if user should see canary version
 */
export async function isCanaryUser(userEmail: string): Promise<CanaryDeploymentInfo> {
  try {
    const config = await getCanaryConfig();
    
    // No active canary - everyone on stable
    if (!config || config.status === 'rolled-back' || config.status === 'complete') {
      return {
        isCanary: false,
        revision: config?.stableRevision || 'stable',
        version: 'stable',
        rolloutPercentage: 0
      };
    }
    
    // Check if user in canary list
    if (config.canaryUsers.includes(userEmail)) {
      return {
        isCanary: true,
        revision: config.canaryRevision,
        version: config.version,
        rolloutPercentage: config.rolloutPercentage
      };
    }
    
    // Check rollout percentage (deterministic hash)
    if (config.rolloutPercentage > 0) {
      const hash = simpleHash(userEmail);
      const bucket = hash % 100;
      
      if (bucket < config.rolloutPercentage) {
        return {
          isCanary: true,
          revision: config.canaryRevision,
          version: config.version,
          rolloutPercentage: config.rolloutPercentage
        };
      }
    }
    
    // Default to stable
    return {
      isCanary: false,
      revision: config.stableRevision,
      version: 'stable',
      rolloutPercentage: config.rolloutPercentage
    };
    
  } catch (error) {
    console.error('❌ Error checking canary status:', error);
    // On error, default to stable (safe)
    return {
      isCanary: false,
      revision: 'stable',
      version: 'stable',
      rolloutPercentage: 0
    };
  }
}

/**
 * Simple hash function for deterministic user bucketing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Initialize canary config (if doesn't exist)
 */
export async function initializeCanaryConfig(stableRevision: string): Promise<void> {
  try {
    const exists = await firestore.collection('canary_config').doc('current').get();
    
    if (!exists.exists) {
      await firestore.collection('canary_config').doc('current').set({
        id: 'current',
        version: 'stable',
        status: 'complete',
        stableRevision,
        canaryRevision: stableRevision,
        canaryUsers: ['alec@getaifactory.com'],
        rolloutPercentage: 0,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        description: 'Initial canary configuration'
      });
      
      console.log('✅ Canary config initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing canary config:', error);
  }
}

