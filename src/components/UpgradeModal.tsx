/**
 * Upgrade Modal
 * 
 * Prompts users to upgrade from trial to paid
 * Shows pricing options (monthly vs annual)
 * Redirects to Stripe Checkout
 * 
 * Created: 2025-11-18
 */

import { useState } from 'react';
import { X, Check, Sparkles, Zap, Users, Ticket, Database } from 'lucide-react';
import type { Subscription } from '../types/subscriptions';

interface UpgradeModalProps {
  subscription?: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ subscription, isOpen, onClose }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const monthlyPrice = 20;
  const annualPrice = 200;
  const annualSavings = 40;

  async function handleUpgrade() {
    try {
      setLoading(true);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingCycle,
          currency: 'USD',
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.message || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error starting checkout');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Community Edition</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-2">
              {subscription?.isTrialPeriod ? 'Upgrade to Continue' : 'Join the Community'}
            </h2>
            
            <p className="text-lg text-blue-100">
              Full platform access • Priority support • Community features
            </p>
          </div>
        </div>

        {/* Pricing Toggle */}
        <div className="p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Monthly
            </button>
            
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold">
                Save ${annualSavings}
              </span>
            </button>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto mb-8">
            <div className="border-2 border-blue-600 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-slate-900 mb-2">
                  ${billingCycle === 'monthly' ? monthlyPrice : Math.round(annualPrice / 12)}
                  <span className="text-2xl text-slate-600 font-normal">/month</span>
                </div>
                
                {billingCycle === 'annual' && (
                  <p className="text-sm text-green-600 font-medium">
                    Billed annually: ${annualPrice} (save ${annualSavings}/year)
                  </p>
                )}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2 mb-6"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Zap className="w-5 h-5" />
                    {subscription?.isTrialPeriod ? 'Subscribe Now' : 'Start Free Trial'}
                  </>
                )}
              </button>

              {!subscription?.isTrialPeriod && (
                <p className="text-center text-sm text-slate-600">
                  14-day free trial • No credit card required
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FeatureItem
              icon={<Sparkles className="w-5 h-5 text-blue-600" />}
              title="Unlimited AI Agents"
              description="Create specialized agents for every task"
            />
            
            <FeatureItem
              icon={<Database className="w-5 h-5 text-blue-600" />}
              title="10 GB Storage"
              description="Upload PDFs, docs, and context"
            />
            
            <FeatureItem
              icon={<Ticket className="w-5 h-5 text-blue-600" />}
              title="5 Priority Tickets/Month"
              description="Expert help within 24 hours"
            />
            
            <FeatureItem
              icon={<Users className="w-5 h-5 text-blue-600" />}
              title="Community Access"
              description="Join groups, share agents"
            />

            <FeatureItem
              icon={<Zap className="w-5 h-5 text-blue-600" />}
              title="10M Tokens/Month"
              description="~2,000 AI conversations"
            />

            <FeatureItem
              icon={<Check className="w-5 h-5 text-blue-600" />}
              title="All Future Features"
              description="New capabilities at no extra cost"
            />
          </div>

          {/* Social Proof */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <p className="text-center text-slate-700 mb-4">
              <span className="font-bold text-2xl text-blue-600">500+</span> professionals already building with AI
            </p>
            
            <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                24-hour support
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                No hidden fees
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-3 text-sm">
            <details className="group">
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                What happens after my trial ends?
              </summary>
              <p className="mt-2 text-slate-600 pl-4">
                Your trial ends after 14 days. We'll remind you before it expires. If you don't subscribe, you'll lose access but your data is saved for 30 days.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                Can I cancel anytime?
              </summary>
              <p className="mt-2 text-slate-600 pl-4">
                Yes! Cancel anytime from your subscription settings. You'll keep access until the end of your billing period.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                What are priority tickets?
              </summary>
              <p className="mt-2 text-slate-600 pl-4">
                Get expert help for bugs, feature requests, or use case optimization. We respond within 24 hours (8 hours for urgent issues).
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}


