/**
 * Subscription & Billing Types - AI Factory Community Edition
 * 
 * Monetization model:
 * - $20 USD/month per user
 * - Full platform access
 * - 5 priority support tickets/month
 * - Community access & apps
 * 
 * Architecture:
 * - Built on existing Organization system
 * - LATAMLAB.AI = Organization
 * - Domains = Community Groups (El Club de la IA, Reforge LATAM, etc.)
 * - First user in domain = Domain Admin
 * 
 * Created: 2025-11-18
 * Part of: feat/community-edition-monetization
 */

import type { DataSource } from './organizations.js';

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionStatus = 
  | 'trial'           // 14-day free trial
  | 'active'          // Paid and active
  | 'past_due'        // Payment failed
  | 'canceled'        // User canceled
  | 'expired';        // Trial/subscription ended

export type BillingCycle = 
  | 'monthly'         // $20/month
  | 'annual';         // $200/year (save $40)

export type PaymentProvider = 
  | 'stripe'          // Stripe Checkout
  | 'mercadopago'     // Latin America
  | 'manual';         // Wire transfer (enterprise)

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription {
  // Identity
  id: string;
  userId: string;                     // Who owns this subscription
  userEmail: string;
  organizationId: string;             // LATAMLAB.AI
  
  // Tier (Community Edition = single tier)
  planName: 'Community Edition';
  status: SubscriptionStatus;
  
  // Billing
  pricePerMonth: number;              // $20 USD
  billingCycle: BillingCycle;
  currency: 'USD' | 'CLP';            // USD or Chilean Pesos
  
  // Payment
  paymentProvider: PaymentProvider;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  mercadopagoCustomerId?: string;
  mercadopagoSubscriptionId?: string;
  paymentMethodLast4?: string;
  
  // Current period
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  
  // Trial (14 days free)
  isTrialPeriod: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  
  // Features included
  features: {
    fullPlatformAccess: boolean;      // All AI apps
    priorityTickets: number;          // 5 per month
    communityAccess: boolean;         // Access to community groups
    storageGB: number;                // 10 GB included
    monthlyTokenLimit: number;        // 10M tokens/month
  };
  
  // Usage tracking (current period)
  currentPeriodUsage: {
    tokensUsed: number;
    storageUsed: number;              // In bytes
    ticketsUsed: number;              // Out of 5
    apiCalls: number;
  };
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  source: DataSource;
  referredBy?: string;                // User ID who referred (for growth)
}

// ============================================
// SUPPORT TICKET
// ============================================

export type TicketStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type TicketPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface SupportTicket {
  // Identity
  id: string;
  ticketNumber: string;               // Human-readable (e.g., "LATAM-00123")
  userId: string;
  userEmail: string;
  subscriptionId: string;
  
  // Ticket details
  subject: string;
  description: string;
  category: string;                   // 'bug' | 'feature-request' | 'use-case' | 'question'
  priority: TicketPriority;
  status: TicketStatus;
  
  // Assignment
  assignedTo?: string;                // Support team member
  assignedAt?: Date;
  
  // Resolution
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  
  // Conversation thread
  messages: Array<{
    id: string;
    role: 'user' | 'support' | 'system';
    content: string;
    timestamp: Date;
    userId: string;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  
  // Source
  source: DataSource;
}

// ============================================
// COMMUNITY GROUP (Domain)
// ============================================

export interface CommunityGroup {
  // Identity
  id: string;                         // Domain ID
  name: string;                       // Display name (e.g., "El Club de la IA")
  slug: string;                       // URL-friendly
  organizationId: string;             // LATAMLAB.AI
  
  // Domain (used for email matching and data routing)
  domain: string;                     // e.g., "elclubdelaia"
  
  // Administration
  adminUserId: string;                // First user who created this group
  moderators: string[];               // User IDs with moderation permissions
  
  // Membership
  memberCount: number;
  inviteOnly: boolean;                // false = anyone can join
  
  // Features
  features: {
    sharedAgents: boolean;            // Members can share agents
    sharedContext: boolean;           // Members can share context
    groupChat: boolean;               // Group discussions (future)
  };
  
  // Metadata
  description?: string;
  logoUrl?: string;
  industry?: string;                  // Construction, Mining, Banking, etc.
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Source
  source: DataSource;
}

// ============================================
// GROUP INVITATION
// ============================================

export interface GroupInvitation {
  id: string;
  groupId: string;                    // Community group ID
  groupName: string;
  invitedBy: string;                  // User ID
  invitedByEmail: string;
  
  // Recipient
  recipientEmail: string;
  recipientUserId?: string;           // If user exists
  
  // Invitation
  message?: string;
  inviteToken: string;                // Unique token for URL
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Date;
  declinedAt?: Date;
  expiresAt: Date;                    // 7 days from creation
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  
  // Source
  source: DataSource;
}

// ============================================
// BILLING INVOICE
// ============================================

export interface BillingInvoice {
  id: string;
  subscriptionId: string;
  userId: string;
  userEmail: string;
  
  // Invoice details
  invoiceNumber: string;              // e.g., "INV-2025-001234"
  amount: number;
  currency: 'USD' | 'CLP';
  
  // Period covered
  periodStart: Date;
  periodEnd: Date;
  
  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
  // Payment
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;             // Stripe/MercadoPago transaction
  
  // URLs
  invoiceUrl?: string;                // PDF download
  paymentUrl?: string;                // Payment link
  
  // Lifecycle
  createdAt: Date;
  dueDate: Date;
  
  // Source
  source: DataSource;
}

// ============================================
// USAGE METRICS
// ============================================

export interface UsageMetrics {
  userId: string;
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Token usage
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  
  // API usage
  apiCallsTotal: number;
  apiCallsSuccess: number;
  apiCallsFailed: number;
  
  // Storage
  storageBytes: number;
  contextSourcesCount: number;
  
  // Activity
  agentsCreated: number;
  messagesCreated: number;
  activeAgents: number;
  
  // Tickets
  ticketsCreated: number;
  ticketsRemaining: number;           // Out of 5
  
  // Computed at
  lastUpdated: Date;
}

// ============================================
// PAYMENT METHOD
// ============================================

export interface PaymentMethod {
  id: string;
  userId: string;
  
  // Type
  type: 'card' | 'bank_transfer' | 'mercadopago';
  
  // Card details (if applicable)
  cardLast4?: string;
  cardBrand?: string;                 // 'visa' | 'mastercard' | 'amex'
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // Provider
  provider: PaymentProvider;
  providerPaymentMethodId?: string;   // Stripe payment method ID
  
  // Status
  isDefault: boolean;
  isValid: boolean;
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  
  // Source
  source: DataSource;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate trial end date (14 days from start)
 */
export function calculateTrialEnd(trialStart: Date): Date {
  const end = new Date(trialStart);
  end.setDate(end.getDate() + 14);
  return end;
}

/**
 * Calculate next billing date
 */
export function calculateNextBillingDate(
  currentPeriodEnd: Date,
  billingCycle: BillingCycle
): Date {
  const next = new Date(currentPeriodEnd);
  
  if (billingCycle === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setFullYear(next.getFullYear() + 1);
  }
  
  return next;
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status === 'canceled' || subscription.status === 'expired') {
    return false;
  }
  
  // Trial active
  if (subscription.isTrialPeriod && subscription.trialEnd) {
    return new Date() < subscription.trialEnd;
  }
  
  // Paid active
  return subscription.status === 'active';
}

/**
 * Check if user can create more tickets
 */
export function canCreateTicket(subscription: Subscription): boolean {
  return subscription.currentPeriodUsage.ticketsUsed < subscription.features.priorityTickets;
}

/**
 * Calculate remaining tickets
 */
export function getRemainingTickets(subscription: Subscription): number {
  return Math.max(
    0,
    subscription.features.priorityTickets - subscription.currentPeriodUsage.ticketsUsed
  );
}

/**
 * Generate unique ticket number
 */
export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LATAM-${timestamp}${random}`;
}

/**
 * Default subscription features (Community Edition)
 */
export const COMMUNITY_EDITION_FEATURES = {
  fullPlatformAccess: true,
  priorityTickets: 5,
  communityAccess: true,
  storageGB: 10,
  monthlyTokenLimit: 10_000_000,      // 10M tokens
};

/**
 * Pricing
 */
export const PRICING = {
  monthly: {
    USD: 20,
    CLP: 18000,                       // ~$20 USD
  },
  annual: {
    USD: 200,                         // Save $40/year
    CLP: 180000,
  },
};

/**
 * Industries for community groups
 */
export const INDUSTRIES = [
  'Construction',
  'Mining',
  'Mobility',
  'Banking',
  'Retail',
  'Agro',
  'Corporate',
  'Legal',
  'Accounting',
  'Finance',
  'Operations',
  'Telecommunications',
  'Sustainability',
  'AI',
  'LLM',
  'Agents',
  'Marketing',
  'Growth',
  'Management',
  'Business',
] as const;

export type Industry = typeof INDUSTRIES[number];

