// Context Access Management - Firestore Functions
import { firestore, COLLECTIONS } from './firestore';
import type { Group, ContextAccessRule, GroupType } from '../types/contextAccess';

// ============================================
// GROUPS CRUD
// ============================================

/**
 * Create a new group
 */
export async function createGroup(
  name: string,
  type: GroupType,
  description: string,
  createdBy: string
): Promise<Group> {
  const groupRef = firestore.collection(COLLECTIONS.GROUPS).doc();
  
  const newGroup: Group = {
    id: groupRef.id,
    name,
    type,
    description,
    memberIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    isActive: true,
  };

  await groupRef.set({
    ...newGroup,
    createdAt: newGroup.createdAt.toISOString(),
    updatedAt: newGroup.updatedAt.toISOString(),
  });

  console.log('✅ Group created in Firestore:', groupRef.id);
  return newGroup;
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<Group[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.GROUPS)
      .where('isActive', '==', true)
      .orderBy('name')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as Group;
    });
  } catch (error) {
    // ⚠️ FALLBACK: If index not ready, fetch all and filter in memory
    console.warn('⚠️ Groups index not ready, using fallback query');
    const snapshot = await firestore
      .collection(COLLECTIONS.GROUPS)
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        } as Group;
      })
      .filter(g => g.isActive !== false)  // Filter in memory
      .sort((a, b) => a.name.localeCompare(b.name));  // Sort in memory
  }
}

/**
 * Get group by ID
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  const doc = await firestore.collection(COLLECTIONS.GROUPS).doc(groupId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) return null;

  return {
    ...data,
    id: doc.id,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  } as Group;
}

/**
 * Update group
 */
export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  await firestore.collection(COLLECTIONS.GROUPS).doc(groupId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Group updated in Firestore:', groupId);
}

/**
 * Add members to group
 */
export async function addGroupMembers(
  groupId: string,
  memberIds: string[]
): Promise<void> {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const uniqueMembers = Array.from(new Set([...group.memberIds, ...memberIds]));

  await updateGroup(groupId, { memberIds: uniqueMembers });
  console.log(`✅ Added ${memberIds.length} members to group ${groupId}`);
}

/**
 * Remove members from group
 */
export async function removeGroupMembers(
  groupId: string,
  memberIds: string[]
): Promise<void> {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const updatedMembers = group.memberIds.filter((id) => !memberIds.includes(id));

  await updateGroup(groupId, { memberIds: updatedMembers });
  console.log(`✅ Removed ${memberIds.length} members from group ${groupId}`);
}

/**
 * Delete group (soft delete)
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await firestore.collection(COLLECTIONS.GROUPS).doc(groupId).update({
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Group deleted (soft) from Firestore:', groupId);
}

/**
 * Get groups for user
 */
export async function getGroupsForUser(userId: string): Promise<Group[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.GROUPS)
    .where('memberIds', 'array-contains', userId)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as Group;
  });
}

// ============================================
// CONTEXT ACCESS RULES CRUD
// ============================================

/**
 * Create context access rule
 */
export async function createContextAccessRule(
  contextId: string,
  contextName: string,
  targetType: 'user' | 'group',
  targetId: string,
  targetName: string,
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  },
  createdBy: string,
  expiresAt?: Date,
  duration?: number
): Promise<ContextAccessRule> {
  const ruleRef = firestore.collection(COLLECTIONS.CONTEXT_ACCESS_RULES).doc();

  const newRule: ContextAccessRule = {
    id: ruleRef.id,
    contextId,
    contextName,
    grantedTo: {
      type: targetType,
      id: targetId,
      name: targetName,
    },
    permissions,
    expiresAt,
    duration,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    isActive: true,
  };

  await ruleRef.set({
    ...newRule,
    createdAt: newRule.createdAt.toISOString(),
    updatedAt: newRule.updatedAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  });

  console.log('✅ Context access rule created in Firestore:', ruleRef.id);
  return newRule;
}

/**
 * Get all access rules for a context
 */
export async function getAccessRulesForContext(contextId: string): Promise<ContextAccessRule[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_ACCESS_RULES)
    .where('contextId', '==', contextId)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    } as ContextAccessRule;
  });
}

/**
 * Get all access rules for a user (direct or via groups)
 */
export async function getAccessRulesForUser(userId: string): Promise<ContextAccessRule[]> {
  // Get user's groups
  const userGroups = await getGroupsForUser(userId);
  const groupIds = userGroups.map((g) => g.id);

  // Get rules for user directly
  const userRulesSnapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_ACCESS_RULES)
    .where('grantedTo.type', '==', 'user')
    .where('grantedTo.id', '==', userId)
    .where('isActive', '==', true)
    .get();

  const userRules = userRulesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    } as ContextAccessRule;
  });

  // Get rules for user's groups
  let groupRules: ContextAccessRule[] = [];
  if (groupIds.length > 0) {
    // Firestore 'in' query supports up to 10 items
    const groupRulesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_ACCESS_RULES)
      .where('grantedTo.type', '==', 'group')
      .where('grantedTo.id', 'in', groupIds.slice(0, 10))
      .where('isActive', '==', true)
      .get();

    groupRules = groupRulesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as ContextAccessRule;
    });
  }

  // Combine and filter expired rules
  const allRules = [...userRules, ...groupRules];
  const now = new Date();
  
  return allRules.filter((rule) => {
    if (!rule.expiresAt) return true;
    return rule.expiresAt > now;
  });
}

/**
 * Check if user has access to context
 */
export async function checkUserAccess(
  userId: string,
  contextId: string,
  permission: 'canView' | 'canEdit' | 'canShare' | 'canDelete'
): Promise<boolean> {
  const rules = await getAccessRulesForUser(userId);
  const contextRules = rules.filter((r) => r.contextId === contextId);

  if (contextRules.length === 0) return false;

  // User has access if ANY rule grants the permission
  return contextRules.some((rule) => rule.permissions[permission]);
}

/**
 * Update access rule
 */
export async function updateContextAccessRule(
  ruleId: string,
  updates: Partial<Omit<ContextAccessRule, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const updateData: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.expiresAt) {
    updateData.expiresAt = updates.expiresAt.toISOString();
  }

  await firestore.collection(COLLECTIONS.CONTEXT_ACCESS_RULES).doc(ruleId).update(updateData);

  console.log('✅ Context access rule updated in Firestore:', ruleId);
}

/**
 * Revoke access rule (soft delete)
 */
export async function revokeContextAccessRule(ruleId: string): Promise<void> {
  await firestore.collection(COLLECTIONS.CONTEXT_ACCESS_RULES).doc(ruleId).update({
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Context access rule revoked in Firestore:', ruleId);
}

/**
 * Get all active rules (for admin)
 */
export async function getAllContextAccessRules(): Promise<ContextAccessRule[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_ACCESS_RULES)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    } as ContextAccessRule;
  });
}

/**
 * Clean up expired rules (run periodically)
 */
export async function cleanupExpiredRules(): Promise<number> {
  const now = new Date();
  const snapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_ACCESS_RULES)
    .where('isActive', '==', true)
    .where('expiresAt', '<', now.toISOString())
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isActive: false,
      updatedAt: now.toISOString(),
    });
  });

  await batch.commit();
  
  console.log(`✅ Cleaned up ${snapshot.size} expired access rules`);
  return snapshot.size;
}

// ============================================
// CONTEXT SOURCES (for context management)
// ============================================

/**
 * Store context source metadata
 */
export async function saveContextSource(
  name: string,
  type: string,
  size: number,
  extractedData: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<string> {
  const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc();

  const contextSource = {
    id: sourceRef.id,
    name,
    type,
    size,
    extractedData,
    userId,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  await sourceRef.set(contextSource);

  console.log('✅ Context source saved in Firestore:', sourceRef.id);
  return sourceRef.id;
}

/**
 * Get all context sources
 */
export async function getAllContextSources(): Promise<any[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: new Date(doc.data().createdAt),
    updatedAt: new Date(doc.data().updatedAt),
  }));
}

