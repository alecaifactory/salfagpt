// Notification System - Real-time notifications for users
// Created: 2025-11-08

import { firestore } from './firestore';

export interface PlatformNotification {
  id: string;
  userId: string;
  type: 'changelog' | 'feature' | 'update' | 'announcement' | 'alert';
  title: string;
  message: string;
  
  // Links
  actionUrl?: string;
  actionLabel?: string;
  
  // State
  read: boolean;
  readAt?: Date;
  dismissed: boolean;
  
  // Priority
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Related entity
  relatedEntityType?: 'changelog' | 'agent' | 'context' | 'conversation';
  relatedEntityId?: string;
  
  // Metadata
  icon?: string; // Lucide icon name
  color?: string; // Tailwind color
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const NOTIFICATIONS_COLLECTION = 'platform_notifications';

// ===== CREATE =====

export async function createNotification(
  notification: Omit<PlatformNotification, 'id' | 'createdAt' | 'updatedAt' | 'read' | 'dismissed'>
): Promise<PlatformNotification> {
  try {
    const docRef = await firestore.collection(NOTIFICATIONS_COLLECTION).add({
      ...notification,
      read: false,
      dismissed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      readAt: doc.data()?.readAt?.toDate(),
      expiresAt: doc.data()?.expiresAt?.toDate()
    } as PlatformNotification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
}

// Broadcast notification to multiple users
export async function broadcastNotification(
  userIds: string[],
  notification: Omit<PlatformNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'read' | 'dismissed'>
): Promise<void> {
  try {
    const batch = firestore.batch();

    userIds.forEach(userId => {
      const ref = firestore.collection(NOTIFICATIONS_COLLECTION).doc();
      batch.set(ref, {
        ...notification,
        userId,
        read: false,
        dismissed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    console.log(`✅ Broadcast notification to ${userIds.length} users`);
  } catch (error) {
    console.error('❌ Failed to broadcast notification:', error);
    throw error;
  }
}

// ===== READ =====

export async function getUserNotifications(
  userId: string,
  filters?: {
    onlyUnread?: boolean;
    type?: string;
    limit?: number;
  }
): Promise<PlatformNotification[]> {
  try {
    let query = firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId);

    if (filters?.onlyUnread) {
      query = query.where('read', '==', false);
    }

    if (filters?.type) {
      query = query.where('type', '==', filters.type);
    }

    query = query.orderBy('createdAt', 'desc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate()
    })) as PlatformNotification[];
  } catch (error) {
    console.error('❌ Failed to get notifications:', error);
    return [];
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const snapshot = await firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .where('dismissed', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('❌ Failed to get unread count:', error);
    return 0;
  }
}

// ===== UPDATE =====

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await firestore.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to mark as read:', error);
    throw error;
  }
}

export async function markAsDismissed(notificationId: string): Promise<void> {
  try {
    await firestore.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
      dismissed: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to dismiss notification:', error);
    throw error;
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const snapshot = await firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    console.log(`✅ Marked ${snapshot.size} notifications as read`);
  } catch (error) {
    console.error('❌ Failed to mark all as read:', error);
    throw error;
  }
}

// ===== DELETE =====

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await firestore.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).delete();
  } catch (error) {
    console.error('❌ Failed to delete notification:', error);
    throw error;
  }
}

// Clean up expired notifications (run periodically)
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const now = new Date();
    const snapshot = await firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where('expiresAt', '<=', now)
      .get();

    if (snapshot.empty) return 0;

    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Cleaned up ${snapshot.size} expired notifications`);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Failed to cleanup notifications:', error);
    return 0;
  }
}

// ===== CHANGELOG-SPECIFIC HELPERS =====

export async function notifyChangelogRelease(
  changelogEntryId: string,
  title: string,
  version: string,
  allUserIds: string[]
): Promise<void> {
  await broadcastNotification(allUserIds, {
    type: 'changelog',
    title: `🎉 Nueva versión ${version}`,
    message: title,
    actionUrl: `/changelog#${changelogEntryId}`,
    actionLabel: 'Ver Novedades',
    priority: 'medium',
    relatedEntityType: 'changelog',
    relatedEntityId: changelogEntryId,
    icon: 'Sparkles',
    color: 'blue'
  });
}






