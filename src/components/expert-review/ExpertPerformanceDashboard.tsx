// Expert Performance Dashboard
// Created: 2025-11-09
// Purpose: Metrics, rankings, AI efficiency for expert supervisors

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Zap,
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  Bot
} from 'lucide-react';
import type { ExpertPerformanceMetrics, Badge } from '../../types/analytics';
// ✅ CLIENT-SAFE: Import from client wrapper instead of server service
import { getUserBadges } from '../../lib/expert-review-client';

interface ExpertPerformanceDashboardProps {
  userId: string;
  domainId: string;
  onClose: () => void;
}

export default function ExpertPerformanceDashboard({
  userId,
  domainId,
  onClose
}: ExpertPerformanceDashboardProps) {
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ExpertPerformanceMetrics | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [userId, domainId]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/expert-review/expert-metrics?userId=${userId}&domainId=${domainId}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);

        const userBadges = await getUserBadges(userId);
        setBadges(userBadges.badges);
      }

    } catch (error) {
      console.error('❌ Failed to load expert dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando performance...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Rankings */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mi Performance</h2>
            <p className="text-sm text-amber-700">
              Expert Supervisor · Período: {metrics.period}
            </p>
          </div>
          <Award className="w-12 h-12 text-amber-500" />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-amber-700 mb-1">Global</div>
            <div className="text-3xl font-bold text-amber-900">
              #{metrics.globalRank}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-amber-700 mb-1">Domain</div>
            <div className="text-3xl font-bold text-amber-900">
              #{metrics.domainRank}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-amber-700 mb-1">Speed</div>
            <div className="text-3xl font-bold text-green-900">
              #{metrics.speedRank}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-amber-700 mb-1">Quality</div>
            <div className="text-3xl font-bold text-blue-900">
              #{metrics.qualityRank}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-blue-900">
            {metrics.evaluated}
          </div>
          <div className="text-xs text-blue-700">
            Evaluaciones
          </div>
          <div className="text-[10px] text-blue-600 mt-1">
            {metrics.evaluationsPerDay.toFixed(1)}/día
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-green-900">
            {(metrics.approvalRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-green-700">
            Aprobación
          </div>
          {metrics.approvalRate >= 0.9 && (
            <div className="text-[10px] text-green-600 mt-1">
              ⭐ Excelente
            </div>
          )}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Bot className="w-5 h-5 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-purple-900">
            {(metrics.aiAdoptionRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-purple-700">
            Uso de AI
          </div>
          <div className="text-[10px] text-purple-600 mt-1">
            {metrics.timeSavedWithAI.toFixed(1)}h ahorradas
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Clock className="w-5 h-5 text-yellow-600 mb-2" />
          <div className="text-2xl font-bold text-yellow-900">
            {metrics.avgEvaluationTime.toFixed(1)}
          </div>
          <div className="text-xs text-yellow-700">
            Min/Eval
          </div>
          {metrics.avgEvaluationTime < 8 && (
            <div className="text-[10px] text-yellow-600 mt-1">
              ⚡ Top Speed
            </div>
          )}
        </div>
      </div>

      {/* AI Efficiency */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          Eficiencia con AI
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Evaluaciones con AI</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {metrics.aiAssisted}
              </span>
              <span className="text-xs text-slate-500">
                / {metrics.evaluated}
              </span>
              <span className={`text-xs font-semibold ${
                metrics.aiAdoptionRate >= 0.8 ? 'text-green-600' :
                metrics.aiAdoptionRate >= 0.7 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                ({(metrics.aiAdoptionRate * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tiempo Ahorrado</span>
            <div className="text-lg font-bold text-green-600">
              {metrics.timeSavedWithAI.toFixed(1)} horas
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tiempo sin AI (estimado)</span>
            <div className="text-lg font-bold text-slate-400">
              {((metrics.avgEvaluationTime * metrics.evaluated) / 60).toFixed(1)} h
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                Eficiencia AI
              </span>
            </div>
            <p className="text-xs text-purple-700">
              Ahorras <strong>{(metrics.timeSavedWithAI / (metrics.avgEvaluationTime * metrics.evaluated / 60) * 100).toFixed(0)}%</strong> de tu tiempo usando AI.
              {metrics.aiAdoptionRate < 0.8 && (
                <span className="block mt-1">
                  💡 Aumenta tu adopción de AI para ahorrar aún más tiempo.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          ✨ Calidad
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Precisión de Correcciones</span>
            <div className={`text-lg font-bold ${
              metrics.correctionAccuracy >= 0.95 ? 'text-green-600' :
              metrics.correctionAccuracy >= 0.85 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(metrics.correctionAccuracy * 100).toFixed(0)}%
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Rating Promedio Dado</span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.expertRatingAvg.toFixed(1)} / 100
            </div>
          </div>

          {/* Quality Status */}
          <div className={`mt-4 p-3 rounded-lg ${
            metrics.correctionAccuracy >= 0.95 ? 'bg-green-50 border border-green-200' :
            metrics.correctionAccuracy >= 0.85 ? 'bg-yellow-50 border border-yellow-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {metrics.correctionAccuracy >= 0.95 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">
                    Calidad Excelente
                  </span>
                </>
              ) : metrics.correctionAccuracy >= 0.85 ? (
                <>
                  <Target className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-900">
                    Buen Nivel
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-900">
                    Mejorar Calibración
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

