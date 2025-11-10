/**
 * Client-Safe Expert Review API Wrapper
 * 
 * This module provides client-side functions that call API endpoints
 * instead of accessing Firestore directly (which causes hydration errors).
 * 
 * Server-side services remain in src/lib/expert-review/*.ts
 * Client-side components should import from THIS file instead.
 */

import type { 
  UserContributionMetrics,
  ExpertPerformanceMetrics,
  SpecialistPerformanceMetrics,
  AdminDomainMetrics,
  ConversionRates,
  Badge
} from '../types/analytics';

// ===== FUNNEL TRACKING =====

export async function trackFunnelEvent(params: {
  action: string;
  userId: string;
  messageId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const response = await fetch('/api/expert-review/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to track funnel event: ${response.statusText}`);
  }
}

export async function getConversionRates(domainId: string): Promise<ConversionRates> {
  const response = await fetch(`/api/expert-review/funnel?type=conversions&domainId=${domainId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get conversion rates: ${response.statusText}`);
  }

  return response.json();
}

export async function getBottlenecks(domainId: string) {
  const response = await fetch(`/api/expert-review/funnel?type=bottlenecks&domainId=${domainId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get bottlenecks: ${response.statusText}`);
  }

  return response.json();
}

export async function getMilestoneTimes(userId: string) {
  const response = await fetch(`/api/expert-review/funnel?type=milestones&userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get milestone times: ${response.statusText}`);
  }

  return response.json();
}

// ===== GAMIFICATION =====

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const response = await fetch(`/api/expert-review/badges?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get user badges: ${response.statusText}`);
  }

  const data = await response.json();
  return data.badges || [];
}

export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const response = await fetch('/api/expert-review/badges/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to check badges: ${response.statusText}`);
  }

  const data = await response.json();
  return data.newBadges || [];
}

export async function getRecentAchievements(userId: string) {
  const response = await fetch(`/api/expert-review/badges?userId=${userId}&type=recent`);
  
  if (!response.ok) {
    throw new Error(`Failed to get recent achievements: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get progress toward next badge (client-side calculation from already-fetched data)
 * For full server-side calculation with Firestore, use the server-side service directly in API routes
 */
export async function getNextBadgeProgress(
  userId: string,
  metrics: any
): Promise<{
  type: string;
  name: string;
  progress: number;
  requirement: string;
} | null> {
  
  try {
    // Get current badges via API
    const badgesData = await getUserBadges(userId);
    const badges = Array.isArray(badgesData) ? badgesData : (badgesData as any).badges || [];
    
    // Find first badge not yet earned
    const unearned = badges.find((b: any) => !b.isEarned && !b.earnedAt);
    
    if (!unearned) {
      return null; // All badges earned!
    }

    // Return simple progress
    // More sophisticated calculation would be done server-side
    return {
      type: unearned.type || 'unknown',
      name: unearned.name,
      progress: 0, // Would need to calculate based on badge criteria
      requirement: unearned.description || '',
    };
  } catch (error) {
    console.error('Error getting next badge progress:', error);
    return null;
  }
}

// ===== EXPERIENCE TRACKING =====

export async function trackCSATRating(params: {
  userId: string;
  messageId: string;
  conversationId?: string;
  rating: number;
  feedback?: string;
  category?: string;
}): Promise<void> {
  const response = await fetch('/api/expert-review/experience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'csat', ...params }),
  });

  if (!response.ok) {
    throw new Error(`Failed to track CSAT: ${response.statusText}`);
  }
}

export async function trackNPSScore(params: {
  userId: string;
  score: number;
  feedback?: string;
  category?: string;
}): Promise<void> {
  const response = await fetch('/api/expert-review/experience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'nps', ...params }),
  });

  if (!response.ok) {
    throw new Error(`Failed to track NPS: ${response.statusText}`);
  }
}

export async function trackSocialShare(params: {
  userId: string;
  platform: string;
  action: string;
  messageId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const response = await fetch('/api/expert-review/experience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'social', ...params }),
  });

  if (!response.ok) {
    throw new Error(`Failed to track social share: ${response.statusText}`);
  }
}

export async function getCSATMetrics(domainId: string) {
  const response = await fetch(
    `/api/expert-review/experience?type=metrics&domainId=${domainId}&metricType=csat`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get CSAT metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getNPSMetrics(domainId: string) {
  const response = await fetch(
    `/api/expert-review/experience?type=metrics&domainId=${domainId}&metricType=nps`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get NPS metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getSocialMetrics(domainId: string) {
  const response = await fetch(
    `/api/expert-review/experience?type=metrics&domainId=${domainId}&metricType=social`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get social metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getLatestFeedback(userId: string) {
  const response = await fetch(
    `/api/expert-review/experience?type=feedback&userId=${userId}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get latest feedback: ${response.statusText}`);
  }

  return response.json();
}

// ===== METRICS =====

export async function getUserContributionMetrics(userId: string): Promise<UserContributionMetrics> {
  const response = await fetch(`/api/expert-review/metrics?type=user&userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get user metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getExpertPerformanceMetrics(userId: string): Promise<ExpertPerformanceMetrics> {
  const response = await fetch(`/api/expert-review/metrics?type=expert&userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get expert metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getSpecialistPerformanceMetrics(userId: string): Promise<SpecialistPerformanceMetrics> {
  const response = await fetch(`/api/expert-review/metrics?type=specialist&userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get specialist metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function getAdminDomainMetrics(domainId: string): Promise<AdminDomainMetrics> {
  const response = await fetch(`/api/expert-review/metrics?type=admin&domainId=${domainId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get admin metrics: ${response.statusText}`);
  }

  return response.json();
}

export async function calculateDomainQuality(domainId: string, period: string = 'Last 30 days') {
  const response = await fetch(
    `/api/expert-review/metrics?type=domain-quality&domainId=${domainId}&period=${encodeURIComponent(period)}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to calculate domain quality: ${response.statusText}`);
  }

  return response.json();
}

// ===== AUDIT =====

export async function logAuditEvent(params: {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  impact?: string;
}): Promise<void> {
  const response = await fetch('/api/expert-review/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to log audit event: ${response.statusText}`);
  }
}

export async function getAuditLog(userId: string, limit: number = 50) {
  const response = await fetch(`/api/expert-review/audit?userId=${userId}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get audit log: ${response.statusText}`);
  }

  return response.json();
}

// ===== DOMAIN CONFIG =====

export async function getDomainConfig(domainId: string) {
  const response = await fetch(`/api/expert-review/domain-config?domainId=${domainId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get domain config: ${response.statusText}`);
  }

  return response.json();
}

export async function updateDomainConfig(domainId: string, config: any): Promise<void> {
  const response = await fetch('/api/expert-review/domain-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domainId, config }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update domain config: ${response.statusText}`);
  }
}

export async function toggleSupervisorActive(domainId: string): Promise<void> {
  const response = await fetch('/api/expert-review/domain-config/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domainId, toggleType: 'supervisor' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle supervisor: ${response.statusText}`);
  }
}

export async function toggleSpecialistActive(domainId: string): Promise<void> {
  const response = await fetch('/api/expert-review/domain-config/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domainId, toggleType: 'specialist' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle specialist: ${response.statusText}`);
  }
}

export async function toggleAdminRequired(domainId: string): Promise<void> {
  const response = await fetch('/api/expert-review/domain-config/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domainId, toggleType: 'admin' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle admin: ${response.statusText}`);
  }
}

// ===== HELPER: Calculate Funnel Conversion Rates (Client-side) =====

export function calculateConversionRates(events: any[]): Partial<ConversionRates> {
  // This is a client-side helper that doesn't touch Firestore
  // It processes already-fetched data
  
  const stages = [
    'message_feedback_submitted',
    'expert_reviewed', 
    'specialist_corrected',
    'admin_approved'
  ];

  const stageCounts = stages.reduce((acc, stage) => {
    acc[stage] = events.filter(e => e.stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  const rates: any = {};
  
  for (let i = 0; i < stages.length - 1; i++) {
    const from = stages[i];
    const to = stages[i + 1];
    const fromCount = stageCounts[from] || 0;
    const toCount = stageCounts[to] || 0;
    
    rates[`${from}_to_${to}`] = fromCount > 0 
      ? (toCount / fromCount) * 100 
      : 0;
  }

  return {
    overall: stageCounts['admin_approved'] / Math.max(stageCounts['message_feedback_submitted'], 1) * 100,
    byStage: rates,
    stageCounts,
  } as Partial<ConversionRates>;
}

