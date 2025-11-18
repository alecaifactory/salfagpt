// Feature Onboarding & Tutorial Tracking
// Created: 2025-11-08

export interface FeatureOnboarding {
  id: string;
  featureId: string; // Links to changelog entry
  userId: string;
  
  // Tutorial State
  tutorialStarted: boolean;
  tutorialStartedAt?: Date;
  tutorialCompleted: boolean;
  tutorialCompletedAt?: Date;
  tutorialProgress: number; // 0-100%
  currentStep: number;
  totalSteps: number;
  
  // Feature Interaction
  featureAccessed: boolean;
  firstAccessedAt?: Date;
  timesAccessed: number;
  
  // Engagement
  dismissed: boolean;
  dismissedAt?: Date;
  helpful: boolean | null; // null = no feedback yet
  feedbackText?: string;
  
  // Notifications
  notificationSent: boolean;
  notificationSentAt?: Date;
  notificationRead: boolean;
  notificationReadAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidedTutorialStep {
  id: string;
  title: string;
  description: string;
  
  // UI Highlighting
  highlightSelector?: string; // CSS selector to highlight
  highlightPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  // Action Required
  action?: {
    type: 'click' | 'input' | 'navigate' | 'observe';
    target: string;
    validation?: string; // How to verify step completed
  };
  
  // Visual Aid
  screenshot?: string;
  videoUrl?: string;
  interactiveDemo?: string; // HTML for demo
  
  // Navigation
  canSkip: boolean;
  autoAdvance: boolean; // Auto-advance when action completed
}

export interface FeatureTutorial {
  id: string;
  featureId: string;
  title: string;
  estimatedDuration: number; // seconds
  
  // Steps
  steps: GuidedTutorialStep[];
  
  // Completion Reward
  completionMessage: string;
  completionBadge?: string;
  
  // Entry Point
  entryPointUrl: string; // Where to start tutorial
  entryPointElement?: string; // Element to highlight
}

export interface FeatureNotificationCenter {
  userId: string;
  features: {
    featureId: string;
    title: string;
    category: string;
    releaseDate: Date;
    priority: 'high' | 'medium' | 'low';
    
    // Status
    tutorialCompleted: boolean;
    tutorialProgress: number;
    dismissed: boolean;
    
    // Badge
    showDot: boolean; // True if not completed
    dotColor: 'red' | 'orange' | 'blue';
  }[];
  
  // Stats
  totalFeatures: number;
  completedTutorials: number;
  pendingTutorials: number;
}






