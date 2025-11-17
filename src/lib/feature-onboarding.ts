// Feature Onboarding Operations
// Created: 2025-11-08

import { firestore } from './firestore';
import type { FeatureOnboarding } from '../types/feature-onboarding';

const COLLECTION = 'feature_onboarding';

// ===== CREATE =====

export async function initializeFeatureOnboarding(
  userId: string,
  featureId: string,
  totalSteps: number
): Promise<FeatureOnboarding> {
  try {
    // Check if already exists
    const existing = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        tutorialStartedAt: doc.data().tutorialStartedAt?.toDate(),
        tutorialCompletedAt: doc.data().tutorialCompletedAt?.toDate(),
        firstAccessedAt: doc.data().firstAccessedAt?.toDate(),
        dismissedAt: doc.data().dismissedAt?.toDate(),
        notificationSentAt: doc.data().notificationSentAt?.toDate(),
        notificationReadAt: doc.data().notificationReadAt?.toDate()
      } as FeatureOnboarding;
    }

    const docRef = await firestore.collection(COLLECTION).add({
      featureId,
      userId,
      tutorialStarted: false,
      tutorialCompleted: false,
      tutorialProgress: 0,
      currentStep: 0,
      totalSteps,
      featureAccessed: false,
      timesAccessed: 0,
      dismissed: false,
      helpful: null,
      notificationSent: false,
      notificationRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: doc.data()?.updatedAt?.toDate() || new Date()
    } as FeatureOnboarding;
  } catch (error) {
    console.error('❌ Failed to initialize onboarding:', error);
    throw error;
  }
}

// ===== READ =====

export async function getUserOnboarding(userId: string): Promise<FeatureOnboarding[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      tutorialStartedAt: doc.data().tutorialStartedAt?.toDate(),
      tutorialCompletedAt: doc.data().tutorialCompletedAt?.toDate(),
      firstAccessedAt: doc.data().firstAccessedAt?.toDate(),
      dismissedAt: doc.data().dismissedAt?.toDate(),
      notificationSentAt: doc.data().notificationSentAt?.toDate(),
      notificationReadAt: doc.data().notificationReadAt?.toDate()
    })) as FeatureOnboarding[];
  } catch (error) {
    console.error('❌ Failed to get onboarding:', error);
    return [];
  }
}

export async function getPendingTutorials(userId: string): Promise<FeatureOnboarding[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('tutorialCompleted', '==', false)
      .where('dismissed', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as FeatureOnboarding[];
  } catch (error) {
    console.error('❌ Failed to get pending tutorials:', error);
    return [];
  }
}

// ===== UPDATE =====

export async function startTutorial(
  userId: string,
  featureId: string
): Promise<void> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        tutorialStarted: true,
        tutorialStartedAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to start tutorial:', error);
    throw error;
  }
}

export async function updateTutorialProgress(
  userId: string,
  featureId: string,
  step: number,
  totalSteps: number
): Promise<void> {
  try {
    const progress = Math.round((step / totalSteps) * 100);
    
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        currentStep: step,
        tutorialProgress: progress,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to update progress:', error);
    throw error;
  }
}

export async function completeTutorial(
  userId: string,
  featureId: string
): Promise<void> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        tutorialCompleted: true,
        tutorialCompletedAt: new Date(),
        tutorialProgress: 100,
        currentStep: snapshot.docs[0].data().totalSteps,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to complete tutorial:', error);
    throw error;
  }
}

export async function trackFeatureAccess(
  userId: string,
  featureId: string
): Promise<void> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const currentData = snapshot.docs[0].data();
      await snapshot.docs[0].ref.update({
        featureAccessed: true,
        firstAccessedAt: currentData.firstAccessedAt || new Date(),
        timesAccessed: (currentData.timesAccessed || 0) + 1,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to track access:', error);
    // Non-critical, don't throw
  }
}

export async function dismissFeature(
  userId: string,
  featureId: string
): Promise<void> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('featureId', '==', featureId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        dismissed: true,
        dismissedAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Failed to dismiss feature:', error);
    throw error;
  }
}

// ===== BATCH OPERATIONS =====

export async function initializeAllUsersForFeature(
  featureId: string,
  totalSteps: number,
  userIds: string[]
): Promise<void> {
  try {
    const batch = firestore.batch();

    for (const userId of userIds) {
      const ref = firestore.collection(COLLECTION).doc();
      batch.set(ref, {
        featureId,
        userId,
        tutorialStarted: false,
        tutorialCompleted: false,
        tutorialProgress: 0,
        currentStep: 0,
        totalSteps,
        featureAccessed: false,
        timesAccessed: 0,
        dismissed: false,
        helpful: null,
        notificationSent: true,
        notificationSentAt: new Date(),
        notificationRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await batch.commit();
    console.log(`✅ Initialized ${userIds.length} users for feature ${featureId}`);
  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
    throw error;
  }
}

// ===== ANALYTICS =====

export async function getFeatureOnboardingStats(featureId: string): Promise<{
  totalUsers: number;
  tutorialsStarted: number;
  tutorialsCompleted: number;
  featureAccessed: number;
  dismissed: number;
  avgProgress: number;
  completionRate: number;
}> {
  try {
    const snapshot = await firestore
      .collection(COLLECTION)
      .where('featureId', '==', featureId)
      .get();

    const docs = snapshot.docs.map(doc => doc.data());
    
    const totalUsers = docs.length;
    const tutorialsStarted = docs.filter(d => d.tutorialStarted).length;
    const tutorialsCompleted = docs.filter(d => d.tutorialCompleted).length;
    const featureAccessed = docs.filter(d => d.featureAccessed).length;
    const dismissed = docs.filter(d => d.dismissed).length;
    const avgProgress = docs.reduce((sum, d) => sum + (d.tutorialProgress || 0), 0) / (totalUsers || 1);
    const completionRate = totalUsers > 0 ? (tutorialsCompleted / totalUsers) * 100 : 0;

    return {
      totalUsers,
      tutorialsStarted,
      tutorialsCompleted,
      featureAccessed,
      dismissed,
      avgProgress,
      completionRate
    };
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    return {
      totalUsers: 0,
      tutorialsStarted: 0,
      tutorialsCompleted: 0,
      featureAccessed: 0,
      dismissed: 0,
      avgProgress: 0,
      completionRate: 0
    };
  }
}



