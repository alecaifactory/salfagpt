/**
 * Subscription Management Library
 * 
 * Handles:
 * - Subscription creation & management
 * - Payment processing (Stripe)
 * - Usage tracking
 * - Support ticket management
 * - Community group operations
 * 
 * Created: 2025-11-18
 * Part of: feat/community-edition-monetization
 */

import { firestore, COLLECTIONS } from './firestore.js';
import type {
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  SupportTicket,
  TicketStatus,
  TicketPriority,
  CommunityGroup,
  GroupInvitation,
  BillingInvoice,
  UsageMetrics,
  PaymentMethod,
} from '../types/subscriptions.js';
import {
  COMMUNITY_EDITION_FEATURES,
  PRICING,
  calculateTrialEnd,
  calculateNextBillingDate,
  isSubscriptionActive,
  canCreateTicket,
  getRemainingTickets,
  generateTicketNumber,
} from '../types/subscriptions.js';

/**
 * ========================================
 * SUBSCRIPTION CRUD
 * ========================================
 */

/**
 * Create subscription for new user
 * Starts with 14-day free trial
 */
export async function createSubscription(
  userId: string,
  userEmail: string,
  organizationId: string = 'latamlab-ai',
  billingCycle: BillingCycle = 'monthly',
  currency: 'USD' | 'CLP' = 'USD'
): Promise<Subscription> {
  try {
    // Check if user already has active subscription
    const existing = await getUserSubscription(userId);
    if (existing && isSubscriptionActive(existing)) {
      throw new Error('User already has active subscription');
    }
    
    const now = new Date();
    const trialEnd = calculateTrialEnd(now);
    
    const subscription: Omit<Subscription, 'id'> = {
      userId,
      userEmail,
      organizationId,
      planName: 'Community Edition',
      status: 'trial',
      pricePerMonth: PRICING.monthly[currency],
      billingCycle,
      currency,
      paymentProvider: 'stripe',
      
      // Trial period
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      nextBillingDate: trialEnd,
      isTrialPeriod: true,
      trialStart: now,
      trialEnd,
      
      // Features
      features: COMMUNITY_EDITION_FEATURES,
      
      // Usage (starts at 0)
      currentPeriodUsage: {
        tokensUsed: 0,
        storageUsed: 0,
        ticketsUsed: 0,
        apiCalls: 0,
      },
      
      // Lifecycle
      createdAt: now,
      updatedAt: now,
      source: getEnvironmentSource(),
    };
    
    const subRef = await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).add(subscription);
    
    console.log('✅ Subscription created:', subRef.id, '(trial until', trialEnd.toISOString(), ')');
    
    return {
      id: subRef.id,
      ...subscription,
    };
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .where('userId', '==', userId)
      .where('status', 'in', ['trial', 'active', 'past_due'])
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      id: doc.id,
      currentPeriodStart: data.currentPeriodStart?.toDate?.() || data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd?.toDate?.() || data.currentPeriodEnd,
      nextBillingDate: data.nextBillingDate?.toDate?.() || data.nextBillingDate,
      trialStart: data.trialStart?.toDate?.() || data.trialStart,
      trialEnd: data.trialEnd?.toDate?.() || data.trialEnd,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      canceledAt: data.canceledAt?.toDate?.() || data.canceledAt,
      expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
    } as Subscription;
  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    return null;
  }
}

/**
 * Update subscription (convert from trial to paid)
 */
export async function convertTrialToPaid(
  subscriptionId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  paymentMethodLast4: string
): Promise<void> {
  try {
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
      status: 'active',
      isTrialPeriod: false,
      stripeCustomerId,
      stripeSubscriptionId,
      paymentMethodLast4,
      currentPeriodStart: now,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      updatedAt: now,
    });
    
    console.log('✅ Subscription converted to paid:', subscriptionId);
  } catch (error) {
    console.error('❌ Error converting subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  try {
    const now = new Date();
    
    const updateData: any = {
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      canceledAt: now,
      updatedAt: now,
    };
    
    if (!cancelAtPeriodEnd) {
      updateData.expiresAt = now;
    }
    
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update(updateData);
    
    console.log('✅ Subscription canceled:', subscriptionId);
  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    throw error;
  }
}

/**
 * ========================================
 * SUPPORT TICKETS
 * ========================================
 */

/**
 * Create support ticket
 */
export async function createSupportTicket(
  userId: string,
  userEmail: string,
  subscriptionId: string,
  data: {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
  }
): Promise<SupportTicket> {
  try {
    // Verify user has tickets remaining
    const subscription = await firestore
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .doc(subscriptionId)
      .get();
    
    if (!subscription.exists) {
      throw new Error('Subscription not found');
    }
    
    const subData = subscription.data() as Subscription;
    
    if (!canCreateTicket(subData)) {
      throw new Error(`Ticket limit reached (${subData.features.priorityTickets} per month)`);
    }
    
    const now = new Date();
    const ticketNumber = generateTicketNumber();
    
    const ticket: Omit<SupportTicket, 'id'> = {
      ticketNumber,
      userId,
      userEmail,
      subscriptionId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || 'normal',
      status: 'open',
      messages: [
        {
          id: `${Date.now()}-${Math.random()}`,
          role: 'user',
          content: data.description,
          timestamp: now,
          userId,
        },
      ],
      createdAt: now,
      updatedAt: now,
      source: getEnvironmentSource(),
    };
    
    const ticketRef = await firestore.collection(COLLECTIONS.SUPPORT_TICKETS).add(ticket);
    
    // Increment ticket usage
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
      'currentPeriodUsage.ticketsUsed': (subData.currentPeriodUsage.ticketsUsed || 0) + 1,
      updatedAt: now,
    });
    
    console.log('✅ Support ticket created:', ticketNumber);
    
    return {
      id: ticketRef.id,
      ...ticket,
    };
  } catch (error) {
    console.error('❌ Error creating support ticket:', error);
    throw error;
  }
}

/**
 * Get user's support tickets
 */
export async function getUserTickets(
  userId: string,
  options?: {
    status?: TicketStatus;
    limit?: number;
  }
): Promise<SupportTicket[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.SUPPORT_TICKETS)
      .where('userId', '==', userId);
    
    if (options?.status) {
      query = query.where('status', '==', options.status);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      assignedAt: doc.data().assignedAt?.toDate?.() || doc.data().assignedAt,
      resolvedAt: doc.data().resolvedAt?.toDate?.() || doc.data().resolvedAt,
      closedAt: doc.data().closedAt?.toDate?.() || doc.data().closedAt,
      messages: doc.data().messages?.map((m: any) => ({
        ...m,
        timestamp: m.timestamp?.toDate?.() || m.timestamp,
      })),
    })) as SupportTicket[];
  } catch (error) {
    console.error('❌ Error getting user tickets:', error);
    return [];
  }
}

/**
 * ========================================
 * COMMUNITY GROUPS
 * ========================================
 */

/**
 * Create community group (domain)
 * First user becomes admin
 */
export async function createCommunityGroup(
  name: string,
  adminUserId: string,
  adminEmail: string,
  options?: {
    description?: string;
    industry?: string;
    inviteOnly?: boolean;
  }
): Promise<CommunityGroup> {
  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Use slug as domain identifier
    const domain = slug;
    
    // Check if domain already exists
    const existing = await firestore
      .collection(COLLECTIONS.COMMUNITY_GROUPS)
      .where('domain', '==', domain)
      .get();
    
    if (!existing.empty) {
      throw new Error(`Community group "${name}" already exists`);
    }
    
    const now = new Date();
    
    const group: Omit<CommunityGroup, 'id'> = {
      name,
      slug,
      organizationId: 'latamlab-ai',
      domain,
      adminUserId,
      moderators: [adminUserId],
      memberCount: 1,
      inviteOnly: options?.inviteOnly || false,
      features: {
        sharedAgents: true,
        sharedContext: true,
        groupChat: false, // Future
      },
      description: options?.description,
      industry: options?.industry,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      source: getEnvironmentSource(),
    };
    
    const groupRef = await firestore.collection(COLLECTIONS.COMMUNITY_GROUPS).add(group);
    
    // Update user's domainId
    await firestore.collection(COLLECTIONS.USERS).doc(adminUserId).update({
      domainId: domain,
      updatedAt: now,
    });
    
    console.log('✅ Community group created:', name, '(domain:', domain, ')');
    
    return {
      id: groupRef.id,
      ...group,
    };
  } catch (error) {
    console.error('❌ Error creating community group:', error);
    throw error;
  }
}

/**
 * Get community group by domain
 */
export async function getCommunityGroupByDomain(domain: string): Promise<CommunityGroup | null> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.COMMUNITY_GROUPS)
      .where('domain', '==', domain.toLowerCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as CommunityGroup;
  } catch (error) {
    console.error('❌ Error getting community group:', error);
    return null;
  }
}

/**
 * List all community groups
 */
export async function listCommunityGroups(
  options?: {
    organizationId?: string;
    industry?: string;
    limit?: number;
  }
): Promise<CommunityGroup[]> {
  try {
    let query = firestore
      .collection(COLLECTIONS.COMMUNITY_GROUPS)
      .where('isActive', '==', true);
    
    if (options?.organizationId) {
      query = query.where('organizationId', '==', options.organizationId);
    }
    
    if (options?.industry) {
      query = query.where('industry', '==', options.industry);
    }
    
    query = query.orderBy('memberCount', 'desc');
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    })) as CommunityGroup[];
  } catch (error) {
    console.error('❌ Error listing community groups:', error);
    return [];
  }
}

/**
 * Join community group
 * Creates domain assignment for user
 */
export async function joinCommunityGroup(
  userId: string,
  groupId: string
): Promise<void> {
  try {
    const groupDoc = await firestore
      .collection(COLLECTIONS.COMMUNITY_GROUPS)
      .doc(groupId)
      .get();
    
    if (!groupDoc.exists) {
      throw new Error('Community group not found');
    }
    
    const group = groupDoc.data() as CommunityGroup;
    const now = new Date();
    
    // Update user's domainId
    await firestore.collection(COLLECTIONS.USERS).doc(userId).update({
      domainId: group.domain,
      updatedAt: now,
    });
    
    // Increment member count
    await groupDoc.ref.update({
      memberCount: (group.memberCount || 0) + 1,
      updatedAt: now,
    });
    
    console.log('✅ User joined community group:', userId, '→', group.name);
  } catch (error) {
    console.error('❌ Error joining community group:', error);
    throw error;
  }
}

/**
 * ========================================
 * GROUP INVITATIONS
 * ========================================
 */

/**
 * Send group invitation
 */
export async function sendGroupInvitation(
  groupId: string,
  invitedByUserId: string,
  invitedByEmail: string,
  recipientEmail: string,
  message?: string
): Promise<GroupInvitation> {
  try {
    const groupDoc = await firestore
      .collection(COLLECTIONS.COMMUNITY_GROUPS)
      .doc(groupId)
      .get();
    
    if (!groupDoc.exists) {
      throw new Error('Community group not found');
    }
    
    const group = groupDoc.data() as CommunityGroup;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept
    
    // Generate invite token
    const inviteToken = generateInviteToken();
    
    const invitation: Omit<GroupInvitation, 'id'> = {
      groupId,
      groupName: group.name,
      invitedBy: invitedByUserId,
      invitedByEmail,
      recipientEmail: recipientEmail.toLowerCase(),
      message,
      inviteToken,
      status: 'pending',
      expiresAt,
      createdAt: now,
      updatedAt: now,
      source: getEnvironmentSource(),
    };
    
    const inviteRef = await firestore.collection(COLLECTIONS.GROUP_INVITATIONS).add(invitation);
    
    console.log('✅ Group invitation sent:', recipientEmail, '→', group.name);
    
    // TODO: Send email notification
    
    return {
      id: inviteRef.id,
      ...invitation,
    };
  } catch (error) {
    console.error('❌ Error sending group invitation:', error);
    throw error;
  }
}

/**
 * Accept group invitation
 */
export async function acceptGroupInvitation(
  inviteToken: string,
  userId: string
): Promise<{ groupId: string; groupName: string }> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.GROUP_INVITATIONS)
      .where('inviteToken', '==', inviteToken)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      throw new Error('Invalid or expired invitation');
    }
    
    const inviteDoc = snapshot.docs[0];
    const invitation = inviteDoc.data() as GroupInvitation;
    
    // Check expiration
    const expiresAt = invitation.expiresAt?.toDate?.() || invitation.expiresAt;
    if (new Date() > expiresAt) {
      throw new Error('Invitation has expired');
    }
    
    const now = new Date();
    
    // Mark invitation as accepted
    await inviteDoc.ref.update({
      status: 'accepted',
      recipientUserId: userId,
      acceptedAt: now,
      updatedAt: now,
    });
    
    // Join the group
    await joinCommunityGroup(userId, invitation.groupId);
    
    console.log('✅ Group invitation accepted:', userId, '→', invitation.groupName);
    
    return {
      groupId: invitation.groupId,
      groupName: invitation.groupName,
    };
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    throw error;
  }
}

/**
 * ========================================
 * USAGE TRACKING
 * ========================================
 */

/**
 * Track token usage
 */
export async function trackTokenUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      console.warn('⚠️ No subscription found for user:', userId);
      return;
    }
    
    const totalTokens = inputTokens + outputTokens;
    const currentUsage = subscription.currentPeriodUsage.tokensUsed || 0;
    
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscription.id).update({
      'currentPeriodUsage.tokensUsed': currentUsage + totalTokens,
      updatedAt: new Date(),
    });
    
    // Check if approaching limit
    const limit = subscription.features.monthlyTokenLimit;
    const usagePercent = ((currentUsage + totalTokens) / limit) * 100;
    
    if (usagePercent > 90) {
      console.warn('⚠️ User approaching token limit:', userId, `${usagePercent.toFixed(1)}%`);
      // TODO: Send notification
    }
  } catch (error) {
    console.error('❌ Error tracking token usage:', error);
    // Non-blocking - don't throw
  }
}

/**
 * Track API call
 */
export async function trackAPICall(userId: string): Promise<void> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return;
    
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscription.id).update({
      'currentPeriodUsage.apiCalls': (subscription.currentPeriodUsage.apiCalls || 0) + 1,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('❌ Error tracking API call:', error);
    // Non-blocking
  }
}

/**
 * Reset monthly usage counters
 * Called when billing period rolls over
 */
export async function resetMonthlyUsage(subscriptionId: string): Promise<void> {
  try {
    await firestore.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
      'currentPeriodUsage.tokensUsed': 0,
      'currentPeriodUsage.ticketsUsed': 0,
      'currentPeriodUsage.apiCalls': 0,
      updatedAt: new Date(),
    });
    
    console.log('✅ Monthly usage reset:', subscriptionId);
  } catch (error) {
    console.error('❌ Error resetting usage:', error);
    throw error;
  }
}

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */

function getEnvironmentSource(): 'localhost' | 'staging' | 'production' {
  const envName = process.env.ENVIRONMENT_NAME;
  if (envName === 'staging') return 'staging';
  if (envName === 'production') return 'production';
  if (process.env.NODE_ENV === 'development') return 'localhost';
  return 'production';
}

function generateInviteToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `invite_${timestamp}${random}`;
}

/**
 * Get usage metrics for period
 */
export async function getUserUsageMetrics(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageMetrics> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    throw new Error('No subscription found');
  }
  
  // Return current period usage
  return {
    userId,
    subscriptionId: subscription.id,
    periodStart,
    periodEnd,
    tokensInput: 0, // TODO: Track separately
    tokensOutput: 0, // TODO: Track separately
    tokensTotal: subscription.currentPeriodUsage.tokensUsed,
    apiCallsTotal: subscription.currentPeriodUsage.apiCalls,
    apiCallsSuccess: subscription.currentPeriodUsage.apiCalls, // TODO: Track failures
    apiCallsFailed: 0,
    storageBytes: subscription.currentPeriodUsage.storageUsed,
    contextSourcesCount: 0, // TODO: Query
    agentsCreated: 0, // TODO: Query
    messagesCreated: 0, // TODO: Query
    activeAgents: 0, // TODO: Query
    ticketsCreated: subscription.currentPeriodUsage.ticketsUsed,
    ticketsRemaining: getRemainingTickets(subscription),
    lastUpdated: new Date(),
  };
}


