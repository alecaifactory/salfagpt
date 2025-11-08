// Changelog System Types - AI Factory Platform
// Created: 2025-11-08

export type IndustryVertical =
  | 'construction'
  | 'real-estate'
  | 'mobility-as-service'
  | 'banking'
  | 'fintech'
  | 'health'
  | 'corporate-venture-capital'
  | 'agriculture'
  | 'multi-family-office'
  | 'retail'
  | 'ecommerce'
  | 'higher-education'
  | 'smbs';

export type FeatureCategory =
  | 'ai-agents'
  | 'context-management'
  | 'security'
  | 'compliance'
  | 'integrations'
  | 'analytics'
  | 'collaboration'
  | 'deployment'
  | 'developer-tools'
  | 'productivity'
  | 'communication';

export type FeatureStatus = 'beta' | 'stable' | 'deprecated' | 'coming-soon';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ChangelogEntry {
  // Identity
  id: string;
  version: string; // Semantic versioning (e.g., '0.3.0')
  releaseDate: Date;
  
  // Content
  title: string;
  subtitle?: string;
  description: string; // Rich markdown content
  
  // Classification
  category: FeatureCategory;
  status: FeatureStatus;
  industries: IndustryVertical[]; // Which industries benefit most
  
  // Priority & Impact
  priority: PriorityLevel;
  impactScore: number; // 1-10 scale
  userRequestCount: number; // How many users requested this
  
  // User Feedback
  userFeedbackSource?: string; // Link to feedback ticket/request
  requestedBy: string[]; // User IDs or names who requested
  alignmentReason: string; // Why this aligns with platform purpose
  
  // Value Proposition
  valueProposition: string; // Business value statement
  useCases: UseCase[];
  
  // Technical Details
  technicalDetails?: {
    githubPRs: string[]; // PR numbers
    commits: string[]; // Commit hashes
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    breakingChanges: boolean;
    migrationGuide?: string; // Markdown link
  };
  
  // Media & Showcase
  showcase?: {
    videoUrl?: string;
    imageUrls: string[];
    demoUrl?: string;
    interactiveTutorial?: string; // URL to tutorial
  };
  
  // Metadata
  createdBy: string; // User ID
  publishedBy: string; // Admin/Expert who approved
  tags: string[];
  relatedFeatures: string[]; // IDs of related changelog entries
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface UseCase {
  industry: IndustryVertical;
  title: string;
  description: string;
  beforeAfter?: {
    before: string; // Problem statement
    after: string; // Solution with this feature
  };
  metrics?: {
    timeSaved?: string; // e.g., "80% faster"
    costReduction?: string; // e.g., "$5k/month saved"
    qualityImprovement?: string; // e.g., "95% accuracy"
  };
}

export interface ChangelogNotification {
  id: string;
  userId: string;
  changelogEntryId: string;
  
  // Notification state
  read: boolean;
  readAt?: Date;
  dismissed: boolean;
  
  // Tutorial state
  tutorialCompleted: boolean;
  tutorialStartedAt?: Date;
  tutorialCompletedAt?: Date;
  tutorialProgress: number; // 0-100%
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangelogViewAnalytics {
  id: string;
  changelogEntryId: string;
  userId: string;
  
  // Engagement
  viewCount: number;
  totalTimeSpent: number; // seconds
  tutorialStarted: boolean;
  tutorialCompleted: boolean;
  
  // Feedback
  helpful: boolean | null; // Thumbs up/down
  feedbackText?: string;
  
  // Timestamps
  firstViewedAt: Date;
  lastViewedAt: Date;
}

// Frontend display grouping
export interface ChangelogGroup {
  version: string;
  releaseDate: Date;
  entries: ChangelogEntry[];
  highlights: string[]; // Key bullet points
}

// Industry-specific showcase
export interface IndustryShowcase {
  industry: IndustryVertical;
  displayName: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  description: string;
  features: {
    changelogId: string;
    title: string;
    impact: string;
  }[];
}

