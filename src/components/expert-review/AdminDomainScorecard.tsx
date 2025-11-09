// Admin Domain Scorecard
// Created: 2025-11-09
// Purpose: Domain-level metrics, DQS tracking, ROI, and competitive positioning

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap,
  DollarSign,
  Users,
  BarChart3,
  Target,
  CheckCircle
} from 'lucide-react';
import type { AdminDomainMetrics } from '../../types/analytics';

interface AdminDomainScorecardProps {
  userId: string;
  domainId: string;
  onClose: () => void;
}

export default function AdminDomainScorecard({
  userId,
  domainId,
  onClose
}: AdminDomainScorecardProps) {
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminDomainMetrics | null>(null);

  useEffect(() => {
    loadScorecardData();
  }, [userId, domainId]);

  async function loadScorecardData() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/expert-review/admin-metrics?userId=${userId}&domainId=${domainId}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }

    } catch (error) {
      console.error('❌ Failed to load admin scorecard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando scorecard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No hay datos disponibles</p>
      </div>
    );
  }

  const trendIcon = metrics.trendDirection === 'up' ? TrendingUp :
                     metrics.trendDirection === 'down' ? TrendingDown :
                     Minus;

  const trendColor = metrics.trendDirection === 'up' ? 'text-green-600' :
                      metrics.trendDirection === 'down' ? 'text-red-600' :
                      'text-slate-400';

  const dqsColor = metrics.dqsEnd >= 90 ? 'text-purple-600' :
                   metrics.dqsEnd >= 85 ? 'text-green-600' :
                   metrics.dqsEnd >= 70 ? 'text-yellow-600' :
                   'text-red-600';

  return (
    <div className="space-y-6">
      {/* DQS Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Domain Quality Score</h2>
            <p className="text-purple-100">
              {domainId}
            </p>
          </div>
          <Award className="w-16 h-16 text-purple-200" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Current DQS */}
          <div className="text-center">
            <div className="text-sm text-purple-200 mb-2">Actual</div>
            <div className="text-5xl font-bold">
              {metrics.dqsEnd.toFixed(1)}
            </div>
            <div className="text-xs text-purple-200 mt-1">/ 100</div>
          </div>

          {/* Change */}
          <div className="text-center">
            <div className="text-sm text-purple-200 mb-2">Cambio</div>
            <div className={`text-5xl font-bold flex items-center justify-center gap-2 ${
              metrics.dqsChange > 0 ? 'text-green-300' :
              metrics.dqsChange < 0 ? 'text-red-300' :
              'text-purple-200'
            }`}>
              {metrics.dqsChange > 0 && <TrendingUp className="w-8 h-8" />}
              {metrics.dqsChange < 0 && <TrendingDown className="w-8 h-8" />}
              {metrics.dqsChange === 0 && <Minus className="w-8 h-8" />}
              {metrics.dqsChange > 0 ? '+' : ''}{metrics.dqsChange.toFixed(1)}
            </div>
            <div className="text-xs text-purple-200 mt-1">puntos</div>
          </div>

          {/* Rank */}
          <div className="text-center">
            <div className="text-sm text-purple-200 mb-2">Ranking</div>
            <div className="text-5xl font-bold">
              #{metrics.domainRankByDQS}
            </div>
            <div className="text-xs text-purple-200 mt-1">
              {metrics.domainRankByDQS === 1 ? '🏆 #1!' :
               metrics.domainRankByDQS <= 3 ? '🥈 Top 3' :
               metrics.domainRankByDQS <= 5 ? '🥉 Top 5' :
               'de todos'}
            </div>
          </div>
        </div>

        {/* Next Milestone */}
        {metrics.dqsEnd < 90 && (
          <div className="mt-6 pt-6 border-t border-purple-400">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-200" />
              <span className="text-sm font-semibold text-purple-100">
                Próxima Meta:
              </span>
            </div>
            <p className="text-sm text-purple-200">
              {metrics.dqsEnd < 85 
                ? `Alcanzar 85 puntos (world-class) - Faltan ${(85 - metrics.dqsEnd).toFixed(1)} puntos`
                : `Alcanzar 90 puntos (elite) - Faltan ${(90 - metrics.dqsEnd).toFixed(1)} puntos`
              }
            </p>
          </div>
        )}
      </div>

      {/* Review Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-blue-900">
            {metrics.proposalsReceived}
          </div>
          <div className="text-xs text-blue-700">
            Propuestas Recibidas
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-green-900">
            {(metrics.approvalRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-green-700">
            Tasa Aprobación
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Zap className="w-5 h-5 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-purple-900">
            {metrics.batchApprovalsCount}
          </div>
          <div className="text-xs text-purple-700">
            Aprobaciones Batch
          </div>
          <div className="text-[10px] text-purple-600 mt-1">
            Avg: {metrics.avgBatchSize.toFixed(1)}/batch
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Clock className="w-5 h-5 text-yellow-600 mb-2" />
          <div className="text-2xl font-bold text-yellow-900">
            {metrics.avgReviewTime.toFixed(1)}
          </div>
          <div className="text-xs text-yellow-700">
            Horas/Review
          </div>
        </div>
      </div>

      {/* Batch Efficiency */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Eficiencia Batch
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Aprobaciones Batch</span>
            <div className="text-lg font-bold text-purple-600">
              {metrics.batchApprovalsCount}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tamaño Promedio Batch</span>
            <div className="text-lg font-bold text-slate-900">
              {metrics.avgBatchSize.toFixed(1)} correcciones
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tiempo Ahorrado</span>
            <div className="text-lg font-bold text-green-600">
              {metrics.batchTimeSaved.toFixed(1)} horas
            </div>
          </div>

          {/* Efficiency Badge */}
          <div className="mt-4 pt-4 border-t border-slate-200 bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                Eficiencia: {(metrics.batchApprovalsCount / metrics.proposalsReceived * 100).toFixed(0)}% de aprobaciones son batch
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Return on Investment
        </h3>

        <div className="text-center mb-4">
          <div className="text-5xl font-bold text-green-600 mb-2">
            {metrics.roiEstimate.toFixed(1)}x
          </div>
          <p className="text-sm text-green-700">
            Horas ahorradas / Horas invertidas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 mb-1">Tiempo Invertido</div>
            <div className="text-xl font-bold text-slate-900">
              {(metrics.proposalsReviewed * metrics.avgReviewTime).toFixed(1)}h
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 mb-1">Tiempo Ahorrado</div>
            <div className="text-xl font-bold text-green-600">
              {(metrics.proposalsReviewed * metrics.avgReviewTime * metrics.roiEstimate).toFixed(1)}h
            </div>
          </div>
        </div>

        {metrics.roiEstimate >= 10 && (
          <div className="mt-4 bg-green-600 text-white rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-bold">
                🏆 ROI Excepcional - Potencial para "ROI Champion" badge
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Competitive Position */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          🏆 Posición Competitiva
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Ranking por DQS</span>
            <div className={`text-2xl font-bold ${
              metrics.domainRankByDQS === 1 ? 'text-amber-600' :
              metrics.domainRankByDQS <= 3 ? 'text-slate-400' :
              'text-slate-600'
            }`}>
              #{metrics.domainRankByDQS}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tendencia</span>
            <div className="flex items-center gap-2">
              {React.createElement(trendIcon, { className: `w-5 h-5 ${trendColor}` })}
              <span className={`text-lg font-bold ${trendColor}`}>
                {metrics.trendDirection === 'up' ? 'Mejorando' :
                 metrics.trendDirection === 'down' ? 'Bajando' :
                 'Estable'}
              </span>
            </div>
          </div>

          {/* Prediction */}
          {metrics.dqsChange > 0 && metrics.domainRankByDQS > 1 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Proyección
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Al ritmo actual (+{metrics.dqsChange.toFixed(1)} puntos/{metrics.period}), 
                podrías alcanzar 
                {metrics.dqsEnd < 85 && <strong> 85 puntos (world-class)</strong>}
                {metrics.dqsEnd >= 85 && metrics.dqsEnd < 90 && <strong> 90 puntos (elite)</strong>}
                {metrics.dqsEnd >= 90 && <strong> #1 ranking</strong>}
                {' '}en aproximadamente {
                  metrics.dqsEnd < 85 
                    ? Math.ceil((85 - metrics.dqsEnd) / metrics.dqsChange) 
                    : metrics.dqsEnd < 90
                    ? Math.ceil((90 - metrics.dqsEnd) / metrics.dqsChange)
                    : 1
                } períodos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              Actividad
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {metrics.proposalsReviewed}
          </div>
          <div className="text-xs text-blue-700">
            Propuestas Revisadas
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Tiempo promedio: {metrics.avgReviewTime.toFixed(1)}h
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-slate-700">
              Aprobación
            </span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${
            metrics.approvalRate >= 0.8 ? 'text-green-600' :
            metrics.approvalRate >= 0.7 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {(metrics.approvalRate * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-green-700">
            Tasa de Aprobación
          </div>
          {metrics.approvalRate >= 0.75 && (
            <div className="mt-2 text-xs text-green-600 font-semibold">
              ✅ Por encima del target (75%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

