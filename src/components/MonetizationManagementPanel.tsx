/**
 * Monetization Management Panel
 * 
 * SuperAdmin interface for managing monetization across organizations
 * Features:
 * - Pricing plans per organization
 * - Usage-based billing
 * - Subscription management
 * - Revenue tracking
 * 
 * Created: 2025-11-11
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Loader2
} from 'lucide-react';
import type { Organization } from '../types/organizations';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    maxUsers: number;
    maxAgents: number;
    maxTokens: number;
  };
}

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export default function MonetizationManagementPanel({ currentUserId, currentUserRole }: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const pricingPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 99,
      annualPrice: 990,
      features: ['Up to 10 users', '50 agents', '1M tokens/month', 'Email support'],
      limits: { maxUsers: 10, maxAgents: 50, maxTokens: 1000000 }
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPrice: 299,
      annualPrice: 2990,
      features: ['Up to 50 users', '200 agents', '5M tokens/month', 'Priority support', 'Custom branding'],
      limits: { maxUsers: 50, maxAgents: 200, maxTokens: 5000000 }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 999,
      annualPrice: 9990,
      features: ['Unlimited users', 'Unlimited agents', '20M tokens/month', '24/7 support', 'Dedicated infrastructure'],
      limits: { maxUsers: -1, maxAgents: -1, maxTokens: 20000000 }
    },
  ];

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations', {
        credentials: 'include' // ✅ Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalMRR = organizations.length * 299; // Mock calculation
  const totalARR = totalMRR * 12;
  const activeSubscriptions = organizations.filter(o => o.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monetization</h2>
          <p className="text-sm text-slate-600">Revenue and pricing management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">MRR</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalMRR.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">ARR</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalARR.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">Annual run rate</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-slate-600">Active Subs</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{activeSubscriptions}</p>
          <p className="text-xs text-slate-500 mt-1">organizations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-slate-600">ARPU</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${(totalMRR / activeSubscriptions).toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-1">per organization</p>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Pricing Plans</h3>
        <div className="grid grid-cols-3 gap-6">
          {pricingPlans.map(plan => (
            <div key={plan.id} className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
              <h4 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">${plan.monthlyPrice}</span>
                <span className="text-slate-600">/mo</span>
                <p className="text-sm text-slate-500 mt-1">
                  ${plan.annualPrice}/year (save {Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100)}%)
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Subscriptions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Organization Subscriptions</h3>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">MRR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Users</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map(org => (
                <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{org.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">Professional</td>
                  <td className="px-4 py-3 font-semibold text-green-700">$299</td>
                  <td className="px-4 py-3 text-sm text-slate-600">-</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

