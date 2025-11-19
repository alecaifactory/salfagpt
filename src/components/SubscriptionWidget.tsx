/**
 * Subscription Widget
 * 
 * Displays subscription status in top-right corner
 * Shows:
 * - Trial countdown (if in trial)
 * - Active subscription status
 * - Tickets remaining
 * - Quick upgrade CTA
 * 
 * Created: 2025-11-18
 */

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Ticket, CreditCard, AlertCircle } from 'lucide-react';
import type { Subscription } from '../types/subscriptions';
import { isSubscriptionActive, getRemainingTickets } from '../types/subscriptions';

interface SubscriptionWidgetProps {
  userId: string;
  onUpgradeClick?: () => void;
}

export function SubscriptionWidget({ userId, onUpgradeClick }: SubscriptionWidgetProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  async function loadSubscription() {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscriptions/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);

        // Calculate days left if in trial
        if (data.subscription?.isTrialPeriod && data.subscription.trialEnd) {
          const end = new Date(data.subscription.trialEnd);
          const now = new Date();
          const diff = end.getTime() - now.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, days));
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-2 bg-slate-100 rounded-lg animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!subscription) {
    // No subscription - show CTA to start trial
    return (
      <button
        onClick={onUpgradeClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
      >
        <Clock className="w-4 h-4" />
        Start Free Trial
      </button>
    );
  }

  // Trial period
  if (subscription.isTrialPeriod) {
    const isExpiring = daysLeft <= 3;

    return (
      <div className={`px-4 py-2 rounded-lg border ${
        isExpiring 
          ? 'bg-yellow-50 border-yellow-300' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isExpiring ? 'text-yellow-600' : 'text-blue-600'}`} />
            <span className={`text-sm font-medium ${isExpiring ? 'text-yellow-800' : 'text-blue-800'}`}>
              Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </span>
          </div>
          
          <button
            onClick={onUpgradeClick}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              isExpiring
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // Active subscription
  if (subscription.status === 'active') {
    const ticketsRemaining = getRemainingTickets(subscription);
    const ticketsTotal = subscription.features.priorityTickets;

    return (
      <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Community Edition
          </span>
          
          <div className="flex items-center gap-1.5 text-xs">
            <Ticket className="w-3.5 h-3.5 text-green-600" />
            <span className={`font-medium ${
              ticketsRemaining === 0 ? 'text-red-600' : 'text-green-700'
            }`}>
              {ticketsRemaining}/{ticketsTotal}
            </span>
          </div>
          
          <button
            onClick={onUpgradeClick}
            className="text-xs text-green-700 hover:text-green-800 hover:underline"
            title="Manage subscription"
          >
            <CreditCard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Past due
  if (subscription.status === 'past_due') {
    return (
      <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            Payment Failed
          </span>
          
          <button
            onClick={onUpgradeClick}
            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Update Payment
          </button>
        </div>
      </div>
    );
  }

  // Canceled
  if (subscription.status === 'canceled' || subscription.status === 'expired') {
    return (
      <div className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">
            Subscription Ended
          </span>
          
          <button
            onClick={onUpgradeClick}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reactivate
          </button>
        </div>
      </div>
    );
  }

  return null;
}

