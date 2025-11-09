// Analytics Types
// Created: 2025-11-09
// Purpose: Types for funnel tracking, gamification, and user metrics

export type FunnelStage = 
  | 'feedback'      // User gave feedback
  | 'priority'      // Feedback marked as priority
  | 'evaluated'     // Expert evaluated
  | 'approved'      // Admin approved
  | 'applied'       // Correction applied to prompt
  | 'validated';    // Success validated

export interface FunnelEvent {
  id: string;
  domainId: string;
  userId: string;
  userEmail: string;
  stage: FunnelStage;
  timestamp: Date;
  metadata: {
    interactionId?: string;
    evaluationId?: string;
    ticketId?: string;
    timeToComplete?: number;
    aiAssisted?: boolean;
    batchSize?: number;
    [key: string]: any;
  };
  source: 'localhost' | 'production';
}

export interface ConversionRates {
  funnelType: 'user' | 'expert' | 'admin';
  domainId: string;
  periodDays: number;
  stages: Array<{
    name: string;
    count: number;
    rate: number; // 0-1
  }>;
  overallConversion: number; // End-to-end conversion rate
  calculatedAt: Date;
}

export interface FunnelBottleneck {
  stage: string;
  currentRate: number;
  targetRate: number;
  gap: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  affectedCount: number;
  funnel?: 'user' | 'expert' | 'admin';
}

// Gamification Types

export type BadgeType = 
  // User badges
  | 'quality-contributor'      // 5+ useful feedback
  | 'power-user'               // 20+ interactions
  | 'impact-maker'             // Feedback improved 3+ responses
  | 'community-champion'       // Shared 5+ times
  | 'early-adopter'            // First 100 users
  | 'feedback-hero'            // 50+ feedback given
  // Expert badges
  | 'calibration-master'       // 90%+ approval rate
  | 'speed-demon'              // <8min avg evaluation
  | 'platinum-expert'          // 50+ evaluations
  | 'ai-champion'              // 80%+ AI adoption
  | 'quality-guardian'         // 95%+ accuracy
  | 'efficiency-expert'        // Top 10% speed
  // Specialist badges
  | 'domain-expert'            // 95%+ approval in specialty
  | 'specialist-elite'         // #1 in category
  | 'deep-knowledge'           // 100+ specialty evals
  // Admin badges
  | 'excellence-leader'        // Domain DQS >90
  | 'batch-master'             // 50+ batch approvals
  | 'roi-champion'             // Highest ROI
  | 'growth-driver'            // +10 DQS points
  // Social badges
  | 'team-player'              // Helped 5+ colleagues
  | 'mentor'                   // Trained 3+ new users
  | 'innovator';               // Suggested feature implemented

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    metric: string;
    threshold: number;
    operator: '>=' | '<=' | '==' | '>';
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface UserBadges {
  userId: string;
  userEmail: string;
  badges: Badge[];
  totalPoints: number; // Sum of badge rarities
  rank: number; // Global rank
  updatedAt: Date;
}

export interface AchievementEvent {
  id: string;
  userId: string;
  badgeType: BadgeType;
  earnedAt: Date;
  metadata: {
    metricValue: number;
    rank?: number;
    celebrationShown: boolean;
  };
}

// Personal Metrics Types

export interface UserContributionMetrics {
  userId: string;
  domainId: string;
  period: string; // 'YYYY-MM'
  
  // Funnel metrics
  totalInteractions: number;
  feedbackGiven: number;
  feedbackUseful: number; // Expert marked as useful
  feedbackUsefulRate: number;
  priorityFeedback: number;
  
  // Impact metrics
  responsesImproved: number; // How many responses improved by their feedback
  avgImpactScore: number; // Average impact of their feedback
  shareCount: number; // Times they shared improvements
  
  // Engagement
  avgResponseTime: number; // Minutes to give feedback
  returnRate: number; // % of times they return after feedback
  npsScore: number; // 0-100
  
  // Social
  helpedColleagues: number;
  mentionedInFeedback: number;
  
  updatedAt: Date;
}

export interface ExpertPerformanceMetrics {
  userId: string;
  domainId: string;
  period: string;
  
  // Funnel metrics
  queueSize: number;
  evaluated: number;
  aiAssisted: number;
  aiAdoptionRate: number;
  approvalRate: number;
  
  // Efficiency
  avgEvaluationTime: number; // Minutes
  timeSavedWithAI: number; // Hours
  evaluationsPerDay: number;
  
  // Quality
  correctionAccuracy: number; // % that actually improved
  expertRatingAvg: number; // Avg expert rating given
  
  // Ranking
  globalRank: number;
  domainRank: number;
  speedRank: number;
  qualityRank: number;
  
  updatedAt: Date;
}

export interface SpecialistPerformanceMetrics {
  userId: string;
  domainId: string;
  specialty: string;
  period: string;
  
  // Assignment
  assignmentsReceived: number;
  assignmentsCompleted: number;
  avgMatchScore: number; // AI matching accuracy
  
  // Performance
  avgCompletionTime: number; // Hours
  approvalRateInSpecialty: number;
  expertiseScore: number; // Calculated based on performance
  
  // Ranking
  specialtyRank: number; // #1, #2, etc in this specialty
  crossDomainRank: number;
  
  updatedAt: Date;
}

export interface AdminDomainMetrics {
  userId: string;
  domainId: string;
  period: string;
  
  // Review activity
  proposalsReceived: number;
  proposalsReviewed: number;
  approvalRate: number;
  avgReviewTime: number; // Hours
  
  // Batch efficiency
  batchApprovalsCount: number;
  avgBatchSize: number;
  batchTimeSaved: number; // Hours
  
  // Impact
  dqsStart: number;
  dqsEnd: number;
  dqsChange: number;
  roiEstimate: number; // Hours saved / hours invested
  
  // Ranking
  domainRankByDQS: number;
  trendDirection: 'up' | 'stable' | 'down';
  
  updatedAt: Date;
}

// CSAT & NPS Tracking

export interface CSATEvent {
  id: string;
  userId: string;
  domainId: string;
  interactionId: string;
  experienceType: 'feedback_flow' | 'expert_review' | 'admin_approval' | 'correction_impact';
  rating: 1 | 2 | 3 | 4 | 5; // 1-5 stars
  comment?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NPSEvent {
  id: string;
  userId: string;
  domainId: string;
  score: number; // 0-10
  category: 'detractor' | 'passive' | 'promoter';
  reason?: string;
  sharedWith?: string[]; // If they promoted, who did they tell
  timestamp: Date;
  followUpDate?: Date; // When to follow up
}

export interface SocialSharingEvent {
  id: string;
  userId: string;
  domainId: string;
  shareType: 'improvement' | 'achievement' | 'milestone' | 'success_story';
  platform: 'slack' | 'teams' | 'email' | 'internal';
  recipientCount: number;
  context: {
    badgeEarned?: BadgeType;
    improvementId?: string;
    dqsGain?: number;
  };
  timestamp: Date;
}

// Dashboard Data Types

export interface PersonalDashboardData {
  userId: string;
  role: 'user' | 'expert' | 'specialist' | 'admin';
  
  // Current metrics
  currentMetrics: UserContributionMetrics | ExpertPerformanceMetrics | SpecialistPerformanceMetrics | AdminDomainMetrics;
  
  // Badges
  badges: Badge[];
  nextBadge?: {
    type: BadgeType;
    progress: number; // 0-1
    requirement: string;
  };
  
  // Funnel
  funnelData: ConversionRates;
  
  // Rankings
  globalRank: number;
  domainRank: number;
  categoryRank?: number;
  
  // Impact
  totalImpact: {
    dqsContribution: number;
    responsesImproved: number;
    timeSaved: number;
    usersHelped: number;
  };
  
  // Trends
  trends: {
    thisWeek: number;
    lastWeek: number;
    change: number;
    direction: 'up' | 'stable' | 'down';
  };
  
  updatedAt: Date;
}

