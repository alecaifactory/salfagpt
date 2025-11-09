// User Contribution Dashboard
// Created: 2025-11-09
// Purpose: Personal metrics, funnel, badges, and impact for end users

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Star, 
  Award, 
  Users, 
  MessageSquare,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Share2,
  Zap
} from 'lucide-react';
import type { 
  UserContributionMetrics,
  Badge,
  ConversionRates
} from '../../types/analytics';
import { getUserBadges, getNextBadgeProgress } from '../../lib/expert-review/gamification-service';
import { calculateConversionRates } from '../../lib/expert-review/funnel-tracking-service';

interface UserContributionDashboardProps {
  userId: string;
  domainId: string;
  onClose: () => void;
}

export default function UserContributionDashboard({
  userId,
  domainId,
  onClose
}: UserContributionDashboardProps) {
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserContributionMetrics | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [nextBadge, setNextBadge] = useState<any>(null);
  const [funnel, setFunnel] = useState<ConversionRates | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [userId, domainId]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load personal metrics
      const metricsResponse = await fetch(
        `/api/expert-review/user-metrics?userId=${userId}&domainId=${domainId}`
      );
      
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Load badges
        const userBadges = await getUserBadges(userId);
        setBadges(userBadges.badges);

        // Get next badge progress
        if (metricsData) {
          const next = await getNextBadgeProgress(userId, metricsData);
          setNextBadge(next);
        }

        // Load funnel data
        const funnelData = await calculateConversionRates(domainId, 'user', 30);
        setFunnel(funnelData);
      }

    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No hay datos disponibles aún</p>
        <p className="text-sm text-slate-500 mt-2">
          Comienza dando feedback para ver tus métricas
        </p>
      </div>
    );
  }

  const trendIcon = metrics.avgImpactScore > 0 ? ArrowUp : 
                     metrics.avgImpactScore < 0 ? ArrowDown : Minus;
  
  const trendColor = metrics.avgImpactScore > 0 ? 'text-green-600' :
                      metrics.avgImpactScore < 0 ? 'text-red-600' : 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mi Contribución</h2>
          <p className="text-sm text-slate-600">
            Tu impacto en la calidad del sistema
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cerrar
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className={`${trendColor}`}>
              {React.createElement(trendIcon, { className: 'w-4 h-4' })}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {metrics.totalInteractions}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Interacciones
          </div>
        </div>

        {/* Feedback Given */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              {((metrics.feedbackUsefulRate || 0) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {metrics.feedbackGiven}
          </div>
          <div className="text-xs text-green-700 mt-1">
            Feedback Dado
          </div>
        </div>

        {/* Responses Improved */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {metrics.responsesImproved}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            Respuestas Mejoradas
          </div>
        </div>

        {/* Share Count */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Share2 className="w-5 h-5 text-pink-600" />
            <Users className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-pink-900">
            {metrics.shareCount}
          </div>
          <div className="text-xs text-pink-700 mt-1">
            Veces Compartido
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      {funnel && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            📊 Mi Funnel de Contribución
          </h3>

          <div className="space-y-3">
            {funnel.stages.map((stage, index) => {
              const percentage = (stage.rate * 100).toFixed(0);
              const color = stage.rate >= 0.6 ? 'bg-green-500' :
                           stage.rate >= 0.4 ? 'bg-yellow-500' :
                           'bg-red-500';

              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {stage.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">
                        {stage.count}
                      </span>
                      {index > 0 && (
                        <span className={`text-xs font-semibold ${
                          stage.rate >= 0.6 ? 'text-green-600' :
                          stage.rate >= 0.4 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {index > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Conversión Overall
              </span>
              <span className="text-lg font-bold text-blue-600">
                {(funnel.overallConversion * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Badges Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            🏆 Mis Badges
          </h3>
          <span className="text-sm text-slate-600">
            {badges.length} ganados
          </span>
        </div>

        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">Aún no has ganado badges</p>
            <p className="text-xs text-slate-500">
              Sigue contribuyendo para ganar tu primer badge
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((badge, index) => {
              const rarityColors = {
                common: 'border-slate-300 bg-slate-50',
                uncommon: 'border-green-300 bg-green-50',
                rare: 'border-blue-300 bg-blue-50',
                epic: 'border-purple-300 bg-purple-50',
                legendary: 'border-amber-300 bg-amber-50'
              };

              return (
                <div
                  key={index}
                  className={`
                    ${rarityColors[badge.rarity]}
                    border-2 rounded-lg p-3 text-center
                    hover:shadow-md transition-all cursor-pointer
                  `}
                  title={badge.description}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-bold text-slate-900 mb-1">
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-slate-600 capitalize">
                    {badge.rarity}
                  </div>
                  {badge.earnedAt && (
                    <div className="text-[9px] text-slate-500 mt-1">
                      {new Date(badge.earnedAt).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Next Badge Progress */}
        {nextBadge && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl opacity-50">
                🎯
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Próximo Badge: {nextBadge.name}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {(nextBadge.progress * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${nextBadge.progress * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  Requirement: {nextBadge.requirement}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Tu Impacto
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {metrics.responsesImproved}
            </div>
            <div className="text-xs text-blue-700">
              Respuestas Mejoradas
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-green-900 mb-1">
              {(metrics.avgImpactScore || 0).toFixed(1)}
            </div>
            <div className="text-xs text-green-700">
              Score Promedio
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {metrics.helpedColleagues || 0}
            </div>
            <div className="text-xs text-purple-700">
              Colegas Ayudados
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-pink-900 mb-1">
              {((metrics.returnRate || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-pink-700">
              Tasa de Retorno
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {metrics.responsesImproved < 3 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-800">
              💡 <strong>Próxima meta:</strong> Mejora 3 respuestas para ganar el badge "Impact Maker"
            </p>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          📈 Engagement
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Feedback Útil</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {metrics.feedbackUseful}
              </span>
              <span className="text-xs text-slate-500">
                / {metrics.feedbackGiven}
              </span>
              <span className={`text-xs font-semibold ${
                metrics.feedbackUsefulRate >= 0.6 ? 'text-green-600' :
                metrics.feedbackUsefulRate >= 0.4 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                ({(metrics.feedbackUsefulRate * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Feedback Prioritario</span>
            <div className="text-lg font-bold text-amber-600">
              {metrics.priorityFeedback}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Tiempo Promedio de Respuesta</span>
            <div className="text-lg font-bold text-slate-900">
              {(metrics.avgResponseTime || 0).toFixed(0)} min
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">NPS Score</span>
            <div className={`text-lg font-bold ${
              metrics.npsScore >= 50 ? 'text-green-600' :
              metrics.npsScore >= 0 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.npsScore}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          ⚡ Actividad Reciente
        </h3>

        <div className="text-sm text-slate-600 text-center py-8">
          Próximamente: Historial de contribuciones
        </div>
      </div>
    </div>
  );
}

