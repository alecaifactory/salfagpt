// Gamification Service
// Created: 2025-11-09
// Purpose: Badge awards, achievements, rankings, celebrations

import { firestore } from '../firestore';
import type { 
  Badge, 
  BadgeType, 
  UserBadges, 
  AchievementEvent,
  UserContributionMetrics,
  ExpertPerformanceMetrics,
  SpecialistPerformanceMetrics,
  AdminDomainMetrics
} from '../../types/analytics';

const IS_DEVELOPMENT = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.DEV 
  : process.env.NODE_ENV === 'development';

/**
 * All available badges with criteria
 */
const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
  // User badges
  'quality-contributor': {
    type: 'quality-contributor',
    name: 'Quality Contributor',
    description: 'Dio 5+ feedback útiles que mejoraron respuestas',
    icon: '⭐',
    color: 'yellow',
    criteria: { metric: 'feedbackUseful', threshold: 5, operator: '>=' },
    rarity: 'common'
  },
  'power-user': {
    type: 'power-user',
    name: 'Power User',
    description: 'Tuvo 20+ interacciones con el sistema',
    icon: '⚡',
    color: 'blue',
    criteria: { metric: 'totalInteractions', threshold: 20, operator: '>=' },
    rarity: 'common'
  },
  'impact-maker': {
    type: 'impact-maker',
    name: 'Impact Maker',
    description: 'Su feedback mejoró 3+ respuestas',
    icon: '🎯',
    color: 'green',
    criteria: { metric: 'responsesImproved', threshold: 3, operator: '>=' },
    rarity: 'uncommon'
  },
  'community-champion': {
    type: 'community-champion',
    name: 'Community Champion',
    description: 'Compartió 5+ mejoras con colegas',
    icon: '🤝',
    color: 'purple',
    criteria: { metric: 'shareCount', threshold: 5, operator: '>=' },
    rarity: 'uncommon'
  },
  'early-adopter': {
    type: 'early-adopter',
    name: 'Early Adopter',
    description: 'Uno de los primeros 100 usuarios',
    icon: '🌟',
    color: 'amber',
    criteria: { metric: 'userId', threshold: 100, operator: '<=' },
    rarity: 'rare'
  },
  'feedback-hero': {
    type: 'feedback-hero',
    name: 'Feedback Hero',
    description: 'Dio 50+ feedback al sistema',
    icon: '🦸',
    color: 'red',
    criteria: { metric: 'feedbackGiven', threshold: 50, operator: '>=' },
    rarity: 'epic'
  },
  
  // Expert badges
  'calibration-master': {
    type: 'calibration-master',
    name: 'Calibration Master',
    description: '90%+ de aprobación en evaluaciones',
    icon: '🎯',
    color: 'green',
    criteria: { metric: 'approvalRate', threshold: 0.90, operator: '>=' },
    rarity: 'uncommon'
  },
  'speed-demon': {
    type: 'speed-demon',
    name: 'Speed Demon',
    description: 'Promedio <8 min por evaluación',
    icon: '⚡',
    color: 'yellow',
    criteria: { metric: 'avgEvaluationTime', threshold: 8, operator: '<=' },
    rarity: 'uncommon'
  },
  'platinum-expert': {
    type: 'platinum-expert',
    name: 'Platinum Expert',
    description: 'Completó 50+ evaluaciones',
    icon: '💎',
    color: 'cyan',
    criteria: { metric: 'evaluated', threshold: 50, operator: '>=' },
    rarity: 'rare'
  },
  'ai-champion': {
    type: 'ai-champion',
    name: 'AI Champion',
    description: '80%+ de evaluaciones con asistencia AI',
    icon: '🤖',
    color: 'purple',
    criteria: { metric: 'aiAdoptionRate', threshold: 0.80, operator: '>=' },
    rarity: 'rare'
  },
  'quality-guardian': {
    type: 'quality-guardian',
    name: 'Quality Guardian',
    description: '95%+ de correcciones exitosas',
    icon: '🛡️',
    color: 'blue',
    criteria: { metric: 'correctionAccuracy', threshold: 0.95, operator: '>=' },
    rarity: 'epic'
  },
  'efficiency-expert': {
    type: 'efficiency-expert',
    name: 'Efficiency Expert',
    description: 'Top 10% en velocidad de evaluación',
    icon: '🚀',
    color: 'orange',
    criteria: { metric: 'speedRank', threshold: 10, operator: '<=' },
    rarity: 'epic'
  },
  
  // Specialist badges
  'domain-expert': {
    type: 'domain-expert',
    name: 'Domain Expert',
    description: '95%+ aprobación en su especialidad',
    icon: '👨‍⚕️',
    color: 'indigo',
    criteria: { metric: 'approvalRateInSpecialty', threshold: 0.95, operator: '>=' },
    rarity: 'rare'
  },
  'specialist-elite': {
    type: 'specialist-elite',
    name: 'Specialist Elite',
    description: '#1 en su categoría',
    icon: '🏆',
    color: 'gold',
    criteria: { metric: 'specialtyRank', threshold: 1, operator: '==' },
    rarity: 'legendary'
  },
  'deep-knowledge': {
    type: 'deep-knowledge',
    name: 'Deep Knowledge',
    description: '100+ evaluaciones en especialidad',
    icon: '📚',
    color: 'blue',
    criteria: { metric: 'assignmentsCompleted', threshold: 100, operator: '>=' },
    rarity: 'epic'
  },
  
  // Admin badges
  'excellence-leader': {
    type: 'excellence-leader',
    name: 'Excellence Leader',
    description: 'Domain DQS >90 (world-class)',
    icon: '👑',
    color: 'purple',
    criteria: { metric: 'dqsEnd', threshold: 90, operator: '>=' },
    rarity: 'legendary'
  },
  'batch-master': {
    type: 'batch-master',
    name: 'Batch Master',
    description: '50+ aprobaciones en batch',
    icon: '📦',
    color: 'green',
    criteria: { metric: 'batchApprovalsCount', threshold: 50, operator: '>=' },
    rarity: 'rare'
  },
  'roi-champion': {
    type: 'roi-champion',
    name: 'ROI Champion',
    description: 'ROI >10x en correcciones',
    icon: '💰',
    color: 'emerald',
    criteria: { metric: 'roiEstimate', threshold: 10, operator: '>=' },
    rarity: 'epic'
  },
  'growth-driver': {
    type: 'growth-driver',
    name: 'Growth Driver',
    description: 'Aumentó DQS en +10 puntos',
    icon: '📈',
    color: 'lime',
    criteria: { metric: 'dqsChange', threshold: 10, operator: '>=' },
    rarity: 'legendary'
  },
  
  // Social badges
  'team-player': {
    type: 'team-player',
    name: 'Team Player',
    description: 'Ayudó a 5+ colegas',
    icon: '🤝',
    color: 'pink',
    criteria: { metric: 'helpedColleagues', threshold: 5, operator: '>=' },
    rarity: 'uncommon'
  },
  'mentor': {
    type: 'mentor',
    name: 'Mentor',
    description: 'Entrenó a 3+ nuevos usuarios',
    icon: '🎓',
    color: 'indigo',
    criteria: { metric: 'trainedUsers', threshold: 3, operator: '>=' },
    rarity: 'rare'
  },
  'innovator': {
    type: 'innovator',
    name: 'Innovator',
    description: 'Sugerencia implementada en roadmap',
    icon: '💡',
    color: 'yellow',
    criteria: { metric: 'suggestionsImplemented', threshold: 1, operator: '>=' },
    rarity: 'legendary'
  }
};

/**
 * Check and award badges based on metrics
 */
export async function checkAndAwardBadges(
  userId: string,
  userEmail: string,
  metrics: UserContributionMetrics | ExpertPerformanceMetrics | SpecialistPerformanceMetrics | AdminDomainMetrics
): Promise<Badge[]> {
  
  console.log('🏆 Checking badges for user:', userId);

  try {
    // Get current badges
    const currentBadges = await getUserBadges(userId);
    const currentBadgeTypes = currentBadges.badges.map(b => b.type);
    const newBadges: Badge[] = [];

    // Check each badge criteria
    Object.values(BADGE_DEFINITIONS).forEach(badgeDef => {
      // Skip if already earned
      if (currentBadgeTypes.includes(badgeDef.type)) {
        return;
      }

      // Check criteria
      const metricValue = (metrics as any)[badgeDef.criteria.metric];
      
      if (metricValue !== undefined && meetsCriteria(metricValue, badgeDef.criteria)) {
        const earnedBadge: Badge = {
          ...badgeDef,
          earnedAt: new Date()
        };
        newBadges.push(earnedBadge);
      }
    });

    // Award new badges
    if (newBadges.length > 0) {
      await awardBadges(userId, userEmail, newBadges);
      console.log(`🎉 Awarded ${newBadges.length} new badges to ${userEmail}`);
    }

    return newBadges;

  } catch (error) {
    console.error('❌ Failed to check badges:', error);
    return [];
  }
}

/**
 * Check if metric meets badge criteria
 */
function meetsCriteria(
  value: number,
  criteria: { threshold: number; operator: '>=' | '<=' | '==' | '>' }
): boolean {
  switch (criteria.operator) {
    case '>=': return value >= criteria.threshold;
    case '<=': return value <= criteria.threshold;
    case '==': return value === criteria.threshold;
    case '>': return value > criteria.threshold;
    default: return false;
  }
}

/**
 * Award badges to user
 */
async function awardBadges(
  userId: string,
  userEmail: string,
  badges: Badge[]
): Promise<void> {
  
  if (IS_DEVELOPMENT) {
    console.log('🏆 [DEV] Would award badges:', badges.map(b => b.name));
    return;
  }

  try {
    const batch = firestore.batch();

    // Update user badges document
    const userBadgesRef = firestore.collection('user_badges').doc(userId);
    const currentDoc = await userBadgesRef.get();
    const currentBadges = currentDoc.exists ? currentDoc.data()?.badges || [] : [];

    batch.set(userBadgesRef, {
      userId,
      userEmail,
      badges: [...currentBadges, ...badges],
      totalPoints: calculateTotalPoints([...currentBadges, ...badges]),
      updatedAt: new Date()
    }, { merge: true });

    // Create achievement events
    badges.forEach(badge => {
      const eventRef = firestore.collection('achievement_events').doc();
      batch.set(eventRef, {
        id: eventRef.id,
        userId,
        badgeType: badge.type,
        earnedAt: new Date(),
        metadata: {
          badgeName: badge.name,
          rarity: badge.rarity,
          celebrationShown: false
        }
      });
    });

    await batch.commit();
    console.log('✅ Badges awarded successfully');

  } catch (error) {
    console.error('❌ Failed to award badges:', error);
    throw error;
  }
}

/**
 * Calculate total points from badges
 */
function calculateTotalPoints(badges: Badge[]): number {
  const rarityPoints: Record<string, number> = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 250
  };

  return badges.reduce((total, badge) => {
    return total + (rarityPoints[badge.rarity] || 0);
  }, 0);
}

/**
 * Get user badges
 */
export async function getUserBadges(userId: string): Promise<UserBadges> {
  
  try {
    const doc = await firestore
      .collection('user_badges')
      .doc(userId)
      .get();

    if (!doc.exists) {
      return {
        userId,
        userEmail: '',
        badges: [],
        totalPoints: 0,
        rank: 0,
        updatedAt: new Date()
      };
    }

    const data = doc.data();
    return {
      userId: data?.userId || userId,
      userEmail: data?.userEmail || '',
      badges: data?.badges || [],
      totalPoints: data?.totalPoints || 0,
      rank: data?.rank || 0,
      updatedAt: data?.updatedAt?.toDate() || new Date()
    };

  } catch (error) {
    console.error('❌ Failed to get user badges:', error);
    return {
      userId,
      userEmail: '',
      badges: [],
      totalPoints: 0,
      rank: 0,
      updatedAt: new Date()
    };
  }
}

/**
 * Get next badge progress
 */
export async function getNextBadgeProgress(
  userId: string,
  metrics: UserContributionMetrics | ExpertPerformanceMetrics | SpecialistPerformanceMetrics | AdminDomainMetrics
): Promise<{
  type: BadgeType;
  name: string;
  progress: number;
  requirement: string;
} | null> {
  
  try {
    const currentBadges = await getUserBadges(userId);
    const currentBadgeTypes = currentBadges.badges.map(b => b.type);

    // Find closest unearned badge
    let closestBadge: { type: BadgeType; progress: number; gap: number } | null = null;

    Object.values(BADGE_DEFINITIONS).forEach(badgeDef => {
      if (currentBadgeTypes.includes(badgeDef.type)) {
        return; // Already earned
      }

      const metricValue = (metrics as any)[badgeDef.criteria.metric] || 0;
      const threshold = badgeDef.criteria.threshold;
      
      // Calculate progress (only for >= operators)
      if (badgeDef.criteria.operator === '>=' || badgeDef.criteria.operator === '>') {
        const progress = Math.min(metricValue / threshold, 1);
        const gap = threshold - metricValue;

        if (gap > 0 && (!closestBadge || gap < closestBadge.gap)) {
          closestBadge = {
            type: badgeDef.type,
            progress,
            gap
          };
        }
      }
    });

    if (!closestBadge) {
      return null;
    }

    const badgeDef = BADGE_DEFINITIONS[closestBadge.type];
    return {
      type: closestBadge.type,
      name: badgeDef.name,
      progress: closestBadge.progress,
      requirement: `${badgeDef.criteria.threshold} ${badgeDef.criteria.metric}`
    };

  } catch (error) {
    console.error('❌ Failed to get next badge progress:', error);
    return null;
  }
}

/**
 * Update user rankings
 */
export async function updateUserRankings(domainId: string): Promise<void> {
  
  if (IS_DEVELOPMENT) {
    console.log('🏅 [DEV] Would update rankings for domain:', domainId);
    return;
  }

  try {
    // Get all user badges in domain
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '>=', `@${domainId}`)
      .where('email', '<=', `@${domainId}\uf8ff`)
      .get();

    const userIds = usersSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return;
    }

    // Get badges for all users
    const badgePromises = userIds.map(id => getUserBadges(id));
    const allBadges = await Promise.all(badgePromises);

    // Sort by total points
    const sorted = allBadges.sort((a, b) => b.totalPoints - a.totalPoints);

    // Update ranks
    const batch = firestore.batch();
    
    sorted.forEach((userBadges, index) => {
      const ref = firestore.collection('user_badges').doc(userBadges.userId);
      batch.update(ref, {
        rank: index + 1,
        updatedAt: new Date()
      });
    });

    await batch.commit();
    console.log(`✅ Updated rankings for ${sorted.length} users in domain ${domainId}`);

  } catch (error) {
    console.error('❌ Failed to update rankings:', error);
  }
}

/**
 * Get unshown achievement celebrations
 */
export async function getUnshownAchievements(userId: string): Promise<AchievementEvent[]> {
  
  try {
    const snapshot = await firestore
      .collection('achievement_events')
      .where('userId', '==', userId)
      .where('metadata.celebrationShown', '==', false)
      .orderBy('earnedAt', 'desc')
      .limit(5)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        badgeType: data.badgeType as BadgeType,
        earnedAt: data.earnedAt?.toDate() || new Date(),
        metadata: {
          metricValue: data.metadata?.metricValue || 0,
          rank: data.metadata?.rank,
          celebrationShown: data.metadata?.celebrationShown || false
        }
      };
    });

  } catch (error) {
    console.error('❌ Failed to get unshown achievements:', error);
    return [];
  }
}

/**
 * Mark achievement celebration as shown
 */
export async function markCelebrationShown(achievementId: string): Promise<void> {
  
  if (IS_DEVELOPMENT) {
    console.log('🎉 [DEV] Would mark celebration shown:', achievementId);
    return;
  }

  try {
    await firestore
      .collection('achievement_events')
      .doc(achievementId)
      .update({
        'metadata.celebrationShown': true,
        'metadata.shownAt': new Date()
      });

  } catch (error) {
    console.warn('⚠️ Failed to mark celebration shown:', error);
  }
}

/**
 * Get leaderboard for domain
 */
export async function getDomainLeaderboard(
  domainId: string,
  limit: number = 10
): Promise<Array<{
  userId: string;
  userEmail: string;
  rank: number;
  totalPoints: number;
  badges: Badge[];
  recentBadge?: Badge;
}>> {
  
  try {
    // Get all users in domain
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '>=', `@${domainId}`)
      .where('email', '<=', `@${domainId}\uf8ff`)
      .get();

    const userEmails = new Map(
      usersSnapshot.docs.map(doc => [doc.id, doc.data().email])
    );

    // Get badges for all users
    const badgesSnapshot = await firestore
      .collection('user_badges')
      .where('userId', 'in', Array.from(userEmails.keys()))
      .get();

    const leaderboard = badgesSnapshot.docs.map(doc => {
      const data = doc.data();
      const badges = (data.badges || []) as Badge[];
      const recentBadge = badges.length > 0 
        ? badges.sort((a, b) => {
            const dateA = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
            const dateB = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
            return dateB - dateA;
          })[0]
        : undefined;

      return {
        userId: doc.id,
        userEmail: userEmails.get(doc.id) || '',
        rank: data.rank || 0,
        totalPoints: data.totalPoints || 0,
        badges,
        recentBadge
      };
    });

    // Sort by rank and limit
    return leaderboard
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Failed to get leaderboard:', error);
    return [];
  }
}

/**
 * Get badge by type
 */
export function getBadgeDefinition(type: BadgeType): Badge {
  return BADGE_DEFINITIONS[type];
}

/**
 * Get all badge definitions
 */
export function getAllBadgeDefinitions(): Badge[] {
  return Object.values(BADGE_DEFINITIONS);
}

/**
 * Calculate rarity distribution
 */
export function getBadgeRarityStats(badges: Badge[]): Record<string, number> {
  const stats: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  badges.forEach(badge => {
    stats[badge.rarity] = (stats[badge.rarity] || 0) + 1;
  });

  return stats;
}

