// Specialist Dashboard
// Created: 2025-11-09
// Purpose: Specialty metrics, matching scores, and category rankings

import React, { useState, useEffect } from 'react';
import {
  Award,
  Target,
  Clock,
  TrendingUp,
  Briefcase,
  Star
} from 'lucide-react';
import type { SpecialistPerformanceMetrics, Badge } from '../../types/analytics';
// ✅ CLIENT-SAFE: Import from client wrapper instead of server service
import { getUserBadges } from '../../lib/expert-review-client';

interface SpecialistDashboardProps {
  userId: string;
  domainId: string;
  specialty: string;
  onClose: () => void;
}

export default function SpecialistDashboard({
  userId,
  domainId,
  specialty,
  onClose
}: SpecialistDashboardProps) {
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SpecialistPerformanceMetrics | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [userId, domainId, specialty]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/expert-review/specialist-metrics?userId=${userId}&domainId=${domainId}&specialty=${specialty}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);

        const userBadges = await getUserBadges(userId);
        setBadges(userBadges.badges.filter(b => 
          b.type.includes('specialist') || b.type.includes('domain-expert')
        ));
      }

    } catch (error) {
      console.error('❌ Failed to load specialist dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando especialidad...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No hay datos disponibles</p>
      </div>
    );
  }

  const specialtyEmojis: Record<string, string> = {
    legal: '⚖️',
    technical: '⚙️',
    medical: '🏥',
    financial: '💰',
    regulatory: '📋',
    safety: '🛡️'
  };

  const specialtyIcon = specialtyEmojis[metrics.specialty.toLowerCase()] || '🎯';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {specialtyIcon} {metrics.specialty}
            </h2>
            <p className="text-sm text-indigo-700">
              Specialist Performance
            </p>
          </div>
          
          {/* Specialty Rank */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              metrics.specialtyRank === 1 ? 'text-amber-500' :
              metrics.specialtyRank <= 3 ? 'text-slate-400' :
              'text-slate-600'
            }`}>
              #{metrics.specialtyRank}
            </div>
            <div className="text-xs text-indigo-700">
              en {metrics.specialty}
            </div>
          </div>
        </div>

        {/* Elite Status */}
        {metrics.specialtyRank === 1 && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-900">
              🏆 #1 Specialist en {metrics.specialty}
            </span>
          </div>
        )}
      </div>

      {/* Assignment Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              Asignaciones
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Recibidas</span>
              <span className="text-lg font-bold text-slate-900">
                {metrics.assignmentsReceived}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Completadas</span>
              <span className="text-lg font-bold text-green-600">
                {metrics.assignmentsCompleted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Tasa</span>
              <span className={`text-lg font-bold ${
                (metrics.assignmentsCompleted / metrics.assignmentsReceived) >= 0.9 ? 'text-green-600' :
                (metrics.assignmentsCompleted / metrics.assignmentsReceived) >= 0.7 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {((metrics.assignmentsCompleted / metrics.assignmentsReceived) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-slate-700">
              Match Score
            </span>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {(metrics.avgMatchScore * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-slate-600">
              Precisión de Matching AI
            </p>
            {metrics.avgMatchScore >= 0.9 && (
              <div className="mt-2 text-xs text-purple-600 font-semibold">
                🎯 Perfect Fit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          ⚡ Performance
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-slate-700">
                Tiempo Promedio
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {metrics.avgCompletionTime.toFixed(1)} h
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-slate-700">
                Aprobación en Especialidad
              </span>
            </div>
            <div className={`text-lg font-bold ${
              metrics.approvalRateInSpecialty >= 0.95 ? 'text-green-600' :
              metrics.approvalRateInSpecialty >= 0.85 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(metrics.approvalRateInSpecialty * 100).toFixed(0)}%
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-slate-700">
                Expertise Score
              </span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {metrics.expertiseScore.toFixed(0)} / 100
            </div>
          </div>
        </div>

        {/* Expertise Gauge */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Nivel de Expertise
            </span>
            <span className="text-xs text-slate-600">
              {metrics.expertiseScore >= 90 ? 'Elite' :
               metrics.expertiseScore >= 75 ? 'Advanced' :
               metrics.expertiseScore >= 60 ? 'Intermediate' :
               'Developing'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                metrics.expertiseScore >= 90 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                metrics.expertiseScore >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                metrics.expertiseScore >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                'bg-gradient-to-r from-slate-400 to-slate-500'
              }`}
              style={{ width: `${metrics.expertiseScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          🏅 Rankings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-900">
              #{metrics.specialtyRank}
            </div>
            <div className="text-xs text-amber-700">
              En {metrics.specialty}
            </div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              #{metrics.crossDomainRank}
            </div>
            <div className="text-xs text-blue-700">
              Cross-Domain
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

