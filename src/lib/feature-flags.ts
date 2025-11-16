/**
 * Feature Flags System
 * 
 * Controls access to beta features like Ally.
 * Supports user-level and environment-level flags.
 * 
 * Version: 1.0.0
 * Date: 2025-11-16
 */

import { firestore } from './firestore';
import type { FeatureFlags, UserFeatureAccess } from '../types/ally';

/**
 * Get feature flags for a specific user
 * 
 * Checks both environment variables and user-specific settings.
 * SuperAdmin (alec@getaifactory.com) always has access to beta features.
 */
export async function getUserFeatureFlags(
  userId: string,
  userEmail: string
): Promise<FeatureFlags> {
  
  console.log('🚩 [FEATURE FLAGS] Checking for:', userEmail);
  
  try {
    // Check environment variable (global override)
    const envEnabled = process.env.ENABLE_ALLY_BETA === 'true';
    console.log(`  Environment ENABLE_ALLY_BETA: ${envEnabled}`);
    
    // SuperAdmin override (alec@getaifactory.com always has access)
    const isSuperAdmin = userEmail === 'alec@getaifactory.com';
    
    if (isSuperAdmin) {
      console.log('  ✅ SuperAdmin detected - granting Ally beta access');
      return {
        allyBetaAccess: true,
      };
    }
    
    // Check user-specific access
    let userEnabled = false;
    try {
      const userDoc = await firestore
        .collection('users')
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        userEnabled = userData?.allyBetaAccess?.enabled || false;
        console.log(`  User-specific allyBetaAccess: ${userEnabled}`);
      }
    } catch (error) {
      console.warn('  Failed to load user-specific flags:', error);
    }
    
    // Combine: environment AND (superadmin OR user-specific)
    const allyAccess = envEnabled && (isSuperAdmin || userEnabled);
    
    console.log(`  Final allyBetaAccess: ${allyAccess}`);
    
    return {
      allyBetaAccess: allyAccess,
    };
    
  } catch (error) {
    console.error('❌ [FEATURE FLAGS] Error:', error);
    
    // Default to false on error (safe fallback)
    return {
      allyBetaAccess: false,
    };
  }
}

/**
 * Grant Ally beta access to a user
 * 
 * Only SuperAdmin can grant access.
 */
export async function grantAllyBetaAccess(
  targetUserId: string,
  grantedBy: string,
  grantedByEmail: string
): Promise<void> {
  
  // Verify granter is SuperAdmin
  if (grantedByEmail !== 'alec@getaifactory.com') {
    throw new Error('Only SuperAdmin can grant Ally beta access');
  }
  
  console.log(`🔓 [FEATURE FLAGS] Granting Ally beta access to: ${targetUserId}`);
  
  await firestore.collection('users').doc(targetUserId).update({
    allyBetaAccess: {
      enabled: true,
      enabledAt: new Date(),
      enabledBy: grantedBy,
    },
  });
  
  console.log('✅ [FEATURE FLAGS] Ally beta access granted');
}

/**
 * Revoke Ally beta access from a user
 * 
 * Only SuperAdmin can revoke access.
 */
export async function revokeAllyBetaAccess(
  targetUserId: string,
  revokedBy: string,
  revokedByEmail: string
): Promise<void> {
  
  // Verify revoker is SuperAdmin
  if (revokedByEmail !== 'alec@getaifactory.com') {
    throw new Error('Only SuperAdmin can revoke Ally beta access');
  }
  
  console.log(`🔒 [FEATURE FLAGS] Revoking Ally beta access from: ${targetUserId}`);
  
  await firestore.collection('users').doc(targetUserId).update({
    allyBetaAccess: {
      enabled: false,
      disabledAt: new Date(),
      disabledBy: revokedBy,
    },
  });
  
  console.log('✅ [FEATURE FLAGS] Ally beta access revoked');
}

/**
 * List all users with Ally beta access
 * 
 * Only accessible by SuperAdmin.
 */
export async function listAllyBetaUsers(
  requestedByEmail: string
): Promise<UserFeatureAccess[]> {
  
  // Verify requester is SuperAdmin
  if (requestedByEmail !== 'alec@getaifactory.com') {
    throw new Error('Only SuperAdmin can list beta users');
  }
  
  const snapshot = await firestore
    .collection('users')
    .where('allyBetaAccess.enabled', '==', true)
    .get();
  
  return snapshot.docs.map(doc => ({
    userId: doc.id,
    features: {
      allyBeta: doc.data().allyBetaAccess,
    },
  }));
}

