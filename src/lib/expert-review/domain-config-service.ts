// Domain Review Configuration Service
// Created: 2025-11-09
// Purpose: Manage domain-level expert review settings

import { firestore } from '../firestore';
import type { DomainReviewConfig } from '../../types/expert-review';

const COLLECTION = 'domain_review_config';

/**
 * Get domain review configuration
 */
export async function getDomainReviewConfig(domainId: string): Promise<DomainReviewConfig | null> {
  try {
    const doc = await firestore.collection(COLLECTION).doc(domainId).get();
    
    if (!doc.exists) {
      console.log(`ℹ️ No review config for domain: ${domainId}`);
      return null;
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      domainName: data?.domainName || domainId,
      priorityThresholds: data?.priorityThresholds || getDefaultThresholds(),
      supervisors: data?.supervisors || [],
      specialists: data?.specialists || [],
      implementers: data?.implementers || [],
      notifications: data?.notifications || getDefaultNotifications(),
      automation: data?.automation || getDefaultAutomation(),
      customSettings: data?.customSettings || getDefaultCustomSettings(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      createdBy: data?.createdBy || '',
      lastReviewActivity: data?.lastReviewActivity?.toDate(),
      source: data?.source || 'localhost'
    } as DomainReviewConfig;
    
  } catch (error) {
    console.error('❌ Error getting domain review config:', error);
    return null;
  }
}

/**
 * Create domain review configuration
 */
export async function createDomainReviewConfig(
  domainId: string,
  domainName: string,
  createdBy: string
): Promise<DomainReviewConfig> {
  
  const config: Omit<DomainReviewConfig, 'id'> = {
    domainName,
    priorityThresholds: getDefaultThresholds(),
    supervisors: [],
    specialists: [],
    implementers: [],
    notifications: getDefaultNotifications(),
    automation: getDefaultAutomation(),
    customSettings: getDefaultCustomSettings(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    source: getEnvironmentSource()
  };
  
  await firestore.collection(COLLECTION).doc(domainId).set(config);
  
  console.log('✅ Domain review config created:', domainId);
  
  return {
    id: domainId,
    ...config
  };
}

/**
 * Add supervisor to domain
 */
export async function addSupervisorToDomain(
  domainId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  
  const config = await getDomainReviewConfig(domainId);
  
  if (!config) {
    throw new Error('Domain config not found');
  }
  
  // Check if already exists
  if (config.supervisors.some(s => s.userId === userId)) {
    console.log('ℹ️ Supervisor already exists:', userId);
    return;
  }
  
  const newSupervisor = {
    userId,
    userEmail,
    name: userName,
    assignedAt: new Date(),
    canApproveCorrections: true,
    activeAssignments: 0
  };
  
  await firestore.collection(COLLECTION).doc(domainId).update({
    supervisors: [...config.supervisors, newSupervisor],
    updatedAt: new Date()
  });
  
  console.log('✅ Supervisor added to domain:', { domainId, userId });
}

/**
 * Add specialist to domain
 */
export async function addSpecialistToDomain(
  domainId: string,
  userId: string,
  userEmail: string,
  userName: string,
  specialty: string,
  domains: string[],
  maxConcurrentAssignments: number = 10
): Promise<void> {
  
  const config = await getDomainReviewConfig(domainId);
  
  if (!config) {
    throw new Error('Domain config not found');
  }
  
  // Check if already exists
  if (config.specialists.some(s => s.userId === userId)) {
    console.log('ℹ️ Specialist already exists:', userId);
    return;
  }
  
  const newSpecialist = {
    userId,
    userEmail,
    name: userName,
    specialty,
    domains,
    maxConcurrentAssignments,
    autoAssign: true,
    notificationPreferences: {
      weeklyDigest: true,
      instantAlerts: false,
      emailEnabled: true
    }
  };
  
  await firestore.collection(COLLECTION).doc(domainId).update({
    specialists: [...config.specialists, newSpecialist],
    updatedAt: new Date()
  });
  
  console.log('✅ Specialist added to domain:', { domainId, userId, specialty });
}

/**
 * Update priority thresholds
 */
export async function updatePriorityThresholds(
  domainId: string,
  thresholds: DomainReviewConfig['priorityThresholds']
): Promise<void> {
  
  await firestore.collection(COLLECTION).doc(domainId).update({
    priorityThresholds: thresholds,
    updatedAt: new Date()
  });
  
  console.log('✅ Priority thresholds updated:', domainId);
}

// Default configurations
function getDefaultThresholds() {
  return {
    userStarThreshold: 3,
    expertRatingThreshold: 'inaceptable' as const,
    autoFlagInaceptable: true,
    minimumSimilarQuestions: 5
  };
}

function getDefaultNotifications() {
  return {
    supervisorAlertThreshold: 10,
    specialistWeeklyDigest: {
      enabled: true,
      dayOfWeek: 'monday' as const,
      time: '09:00'
    },
    adminBatchReportFrequency: 'weekly' as const
  };
}

function getDefaultAutomation() {
  return {
    autoGenerateAISuggestions: true,
    autoRunImpactAnalysis: true,
    autoMatchSpecialists: true,
    batchImplementationEnabled: true
  };
}

function getDefaultCustomSettings() {
  return {
    language: 'es',
    timezone: 'America/Santiago',
    qualityGoals: {
      targetCSAT: 4.5,
      targetNPS: 90,
      minimumAcceptableRating: 3.5
    }
  };
}

function getEnvironmentSource(): 'localhost' | 'production' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
}

