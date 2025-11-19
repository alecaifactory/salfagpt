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
 * ✅ NEW: Ally is now ENABLED BY DEFAULT for all users.
 * 
 * Can be disabled:
 * - Globally: Set ENABLE_ALLY_BETA=false in environment
 * - Per user: Set user.allyBetaAccess.enabled = false in Firestore
 * 
 * SuperAdmin (alec@getaifactory.com) always has access regardless.
 */
export async function getUserFeatureFlags(
  userId: string,
  userEmail: string
): Promise<FeatureFlags> {
  
  console.log('🚩 [FEATURE FLAGS] Checking for:', userEmail);
  
  try {
    // ✅ NEW: Default to TRUE for all users (Ally is now generally available)
    // Environment variable can DISABLE if needed (ENABLE_ALLY_BETA=false)
    const envDisabled = process.env.ENABLE_ALLY_BETA === 'false';
    
    if (envDisabled) {
      console.log('  ⚠️ Ally DISABLED via environment variable');
      return {
        allyBetaAccess: false,
      };
    }
    
    // SuperAdmin override (alec@getaifactory.com always has access)
    const isSuperAdmin = userEmail === 'alec@getaifactory.com';
    
    if (isSuperAdmin) {
      console.log('  ✅ SuperAdmin detected - granting Ally access');
      return {
        allyBetaAccess: true,
      };
    }
    
    // Check user-specific disable (allow blocking individual users)
    let userDisabled = false;
    try {
      const userDoc = await firestore
        .collection('users')
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        userDisabled = userData?.allyBetaAccess?.enabled === false;
        console.log(`  User-specific allyBetaAccess disabled: ${userDisabled}`);
      }
    } catch (error) {
      console.warn('  Failed to load user-specific flags:', error);
    }
    
    // ✅ NEW LOGIC: Default TRUE, unless explicitly disabled
    const allyAccess = !userDisabled;
    
    console.log(`  Final allyBetaAccess: ${allyAccess} (default: enabled for all users)`);
    
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

