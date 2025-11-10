// Changelog Operations - Firestore Integration
// Created: 2025-11-08

import { firestore } from './firestore';
import type { 
  ChangelogEntry, 
  ChangelogNotification, 
  ChangelogViewAnalytics,
  ChangelogGroup 
} from '../types/changelog';

const COLLECTIONS = {
  CHANGELOG_ENTRIES: 'changelog_entries',
  CHANGELOG_NOTIFICATIONS: 'changelog_notifications',
  CHANGELOG_ANALYTICS: 'changelog_analytics'
} as const;

// ===== CHANGELOG ENTRIES =====

export async function createChangelogEntry(
  entry: Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ChangelogEntry> {
  try {
    const docRef = await firestore.collection(COLLECTIONS.CHANGELOG_ENTRIES).add({
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date(),
      releaseDate: entry.releaseDate || new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data()
    } as ChangelogEntry;
  } catch (error) {
    console.error('❌ Failed to create changelog entry:', error);
    throw error;
  }
}

export async function getChangelogEntries(
  filters?: {
    category?: string;
    status?: string;
    industry?: string;
    limit?: number;
  }
): Promise<ChangelogEntry[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.CHANGELOG_ENTRIES)
      .orderBy('releaseDate', 'desc');

    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    
    let entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      releaseDate: doc.data().releaseDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      publishedAt: doc.data().publishedAt?.toDate()
    })) as ChangelogEntry[];

    // Filter by industry if specified (array contains check)
    if (filters?.industry) {
      entries = entries.filter(entry => 
        entry.industries.includes(filters.industry as any)
      );
    }

    return entries;
  } catch (error) {
    console.error('❌ Failed to get changelog entries:', error);
    return [];
  }
}

export async function getChangelogEntry(id: string): Promise<ChangelogEntry | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.CHANGELOG_ENTRIES)
      .doc(id)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
      releaseDate: doc.data()?.releaseDate?.toDate() || new Date(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
      publishedAt: doc.data()?.publishedAt?.toDate()
    } as ChangelogEntry;
  } catch (error) {
    console.error('❌ Failed to get changelog entry:', error);
    return null;
  }
}

export async function updateChangelogEntry(
  id: string,
  updates: Partial<ChangelogEntry>
): Promise<void> {
  try {
    await firestore.collection(COLLECTIONS.CHANGELOG_ENTRIES).doc(id).update({
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to update changelog entry:', error);
    throw error;
  }
}

export async function deleteChangelogEntry(id: string): Promise<void> {
  try {
    await firestore.collection(COLLECTIONS.CHANGELOG_ENTRIES).doc(id).delete();
  } catch (error) {
    console.error('❌ Failed to delete changelog entry:', error);
    throw error;
  }
}

// Group entries by version for display
export async function getGroupedChangelog(): Promise<ChangelogGroup[]> {
  const entries = await getChangelogEntries();
  
  const grouped = entries.reduce((acc, entry) => {
    const existing = acc.find(g => g.version === entry.version);
    
    if (existing) {
      existing.entries.push(entry);
    } else {
      acc.push({
        version: entry.version,
        releaseDate: entry.releaseDate,
        entries: [entry],
        highlights: [] // Will be populated from entries
      });
    }
    
    return acc;
  }, [] as ChangelogGroup[]);

  // Sort by release date descending
  grouped.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

  // Generate highlights for each group
  grouped.forEach(group => {
    group.highlights = group.entries
      .filter(e => e.priority === 'critical' || e.priority === 'high')
      .slice(0, 5)
      .map(e => e.title);
  });

  return grouped;
}

// ===== NOTIFICATIONS =====

export async function createNotifications(
  changelogEntryId: string,
  userIds: string[]
): Promise<void> {
  try {
    const batch = firestore.batch();

    userIds.forEach(userId => {
      const ref = firestore.collection(COLLECTIONS.CHANGELOG_NOTIFICATIONS).doc();
      batch.set(ref, {
        userId,
        changelogEntryId,
        read: false,
        dismissed: false,
        tutorialCompleted: false,
        tutorialProgress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    console.log(`✅ Created ${userIds.length} notifications for entry ${changelogEntryId}`);
  } catch (error) {
    console.error('❌ Failed to create notifications:', error);
    throw error;
  }
}

export async function getUserNotifications(
  userId: string,
  onlyUnread = false
): Promise<ChangelogNotification[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.CHANGELOG_NOTIFICATIONS)
      .where('userId', '==', userId);

    if (onlyUnread) {
      query = query.where('read', '==', false);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate(),
      tutorialStartedAt: doc.data().tutorialStartedAt?.toDate(),
      tutorialCompletedAt: doc.data().tutorialCompletedAt?.toDate()
    })) as ChangelogNotification[];
  } catch (error) {
    console.error('❌ Failed to get notifications:', error);
    return [];
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    await firestore.collection(COLLECTIONS.CHANGELOG_NOTIFICATIONS).doc(notificationId).update({
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to mark notification read:', error);
    throw error;
  }
}

export async function markNotificationDismissed(
  notificationId: string
): Promise<void> {
  try {
    await firestore.collection(COLLECTIONS.CHANGELOG_NOTIFICATIONS).doc(notificationId).update({
      dismissed: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to dismiss notification:', error);
    throw error;
  }
}

export async function updateTutorialProgress(
  notificationId: string,
  progress: number,
  completed: boolean = false
): Promise<void> {
  try {
    const update: any = {
      tutorialProgress: progress,
      updatedAt: new Date()
    };

    if (progress > 0 && !completed) {
      update.tutorialStartedAt = new Date();
    }

    if (completed) {
      update.tutorialCompleted = true;
      update.tutorialCompletedAt = new Date();
    }

    await firestore.collection(COLLECTIONS.CHANGELOG_NOTIFICATIONS).doc(notificationId).update(update);
  } catch (error) {
    console.error('❌ Failed to update tutorial progress:', error);
    throw error;
  }
}

// ===== ANALYTICS =====

export async function trackChangelogView(
  changelogEntryId: string,
  userId: string
): Promise<void> {
  try {
    // Check if analytics record exists
    const existing = await firestore
      .collection(COLLECTIONS.CHANGELOG_ANALYTICS)
      .where('changelogEntryId', '==', changelogEntryId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (existing.empty) {
      // Create new record
      await firestore.collection(COLLECTIONS.CHANGELOG_ANALYTICS).add({
        changelogEntryId,
        userId,
        viewCount: 1,
        totalTimeSpent: 0,
        tutorialStarted: false,
        tutorialCompleted: false,
        helpful: null,
        firstViewedAt: new Date(),
        lastViewedAt: new Date()
      });
    } else {
      // Update existing
      const docRef = existing.docs[0].ref;
      await docRef.update({
        viewCount: (existing.docs[0].data().viewCount || 0) + 1,
        lastViewedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to track view:', error);
    // Non-critical, don't throw
  }
}

export async function updateChangelogFeedback(
  changelogEntryId: string,
  userId: string,
  helpful: boolean,
  feedbackText?: string
): Promise<void> {
  try {
    const existing = await firestore
      .collection(COLLECTIONS.CHANGELOG_ANALYTICS)
      .where('changelogEntryId', '==', changelogEntryId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (existing.empty) {
      await firestore.collection(COLLECTIONS.CHANGELOG_ANALYTICS).add({
        changelogEntryId,
        userId,
        viewCount: 0,
        totalTimeSpent: 0,
        tutorialStarted: false,
        tutorialCompleted: false,
        helpful,
        feedbackText,
        firstViewedAt: new Date(),
        lastViewedAt: new Date()
      });
    } else {
      await existing.docs[0].ref.update({
        helpful,
        feedbackText: feedbackText || existing.docs[0].data().feedbackText
      });
    }
  } catch (error) {
    console.error('❌ Failed to update feedback:', error);
    throw error;
  }
}

export async function getChangelogAnalytics(
  changelogEntryId: string
): Promise<{
  totalViews: number;
  uniqueUsers: number;
  avgTimeSpent: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tutorialCompletionRate: number;
}> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.CHANGELOG_ANALYTICS)
      .where('changelogEntryId', '==', changelogEntryId)
      .get();

    const analytics = snapshot.docs.map(doc => doc.data());
    
    const totalViews = analytics.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    const totalTime = analytics.reduce((sum, a) => sum + (a.totalTimeSpent || 0), 0);
    const helpfulCount = analytics.filter(a => a.helpful === true).length;
    const notHelpfulCount = analytics.filter(a => a.helpful === false).length;
    const tutorialCompleted = analytics.filter(a => a.tutorialCompleted).length;

    return {
      totalViews,
      uniqueUsers: analytics.length,
      avgTimeSpent: analytics.length > 0 ? totalTime / analytics.length : 0,
      helpfulCount,
      notHelpfulCount,
      tutorialCompletionRate: analytics.length > 0 
        ? (tutorialCompleted / analytics.length) * 100 
        : 0
    };
  } catch (error) {
    console.error('❌ Failed to get analytics:', error);
    return {
      totalViews: 0,
      uniqueUsers: 0,
      avgTimeSpent: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      tutorialCompletionRate: 0
    };
  }
}


