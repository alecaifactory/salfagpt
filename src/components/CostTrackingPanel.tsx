/**
 * Cost Tracking Panel
 * 
 * SuperAdmin interface for tracking costs across organizations
 * Features:
 * - AI model usage costs (Gemini API)
 * - Infrastructure costs (Cloud Run, Firestore, etc.)
 * - Cost per organization
 * - Budget alerts
 * 
 * Created: 2025-11-11
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  AlertCircle,
  Building2,
  Cpu,
  Database,
  Zap,
  Calendar
} from 'lucide-react';

interface CostData {
  organizationId: string;
  organizationName: string;
  aiCosts: number;
  infrastructureCosts: number;
  totalCosts: number;
  tokensUsed: number;
  period: string;
}

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export default function CostTrackingPanel({ currentUserId, currentUserRole }: Props) {
  const [costs, setCosts] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadCosts();
  }, [period]);

  async function loadCosts() {
    try {
      setLoading(true);
      // Mock data for MVP
      const mockCosts: CostData[] = [
        {
          organizationId: 'salfa-corp',
          organizationName: 'Salfa Corp',
          aiCosts: 450.50,
          infrastructureCosts: 89.00,
          totalCosts: 539.50,
          tokensUsed: 12500000,
          period: 'November 2025'
        },
      ];
      setCosts(mockCosts);
    } catch (error) {
      console.error('Error loading costs:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalAICosts = costs.reduce((sum, c) => sum + c.aiCosts, 0);
  const totalInfraCosts = costs.reduce((sum, c) => sum + c.infrastructureCosts, 0);
  const grandTotal = costs.reduce((sum, c) => sum + c.totalCosts, 0);
  const totalTokens = costs.reduce((sum, c) => sum + c.tokensUsed, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cost Tracking</h2>
          <p className="text-sm text-slate-600">Monitor costs across all organizations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              period === 'day' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              period === 'week' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              period === 'month' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-slate-600">AI Costs</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalAICosts.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            -8% vs last month
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-slate-600">Infrastructure</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalInfraCosts.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Firestore, Cloud Run</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-slate-600">Total Costs</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${grandTotal.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">This month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-slate-600">Tokens Used</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{(totalTokens / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-slate-500 mt-1">Across all orgs</p>
        </div>
      </div>

      {/* Cost Breakdown by Organization */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Cost by Organization</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Organization</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">AI Costs</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Infrastructure</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Tokens</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Budget</th>
            </tr>
          </thead>
          <tbody>
            {costs.map(cost => {
              const budgetUsage = (cost.totalCosts / 1000) * 100; // Assuming $1000 budget
              const budgetColor = budgetUsage > 90 ? 'text-red-600' : budgetUsage > 70 ? 'text-yellow-600' : 'text-green-600';
              
              return (
                <tr key={cost.organizationId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{cost.organizationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-purple-700">
                    ${cost.aiCosts.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-blue-700">
                    ${cost.infrastructureCosts.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-800">
                    ${cost.totalCosts.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-600">
                    {(cost.tokensUsed / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            budgetUsage > 90 ? 'bg-red-600' : budgetUsage > 70 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${budgetColor}`}>
                        {budgetUsage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}





