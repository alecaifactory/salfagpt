// Domain Quality Dashboard - DQS and metrics visualization
// Created: 2025-11-09

import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Award, X, Loader2, BarChart3 } from 'lucide-react';
import { calculateDomainQuality } from '../../lib/expert-review/metrics-service';

interface DomainQualityDashboardProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DomainQualityDashboard({
  userId, userEmail, isOpen, onClose
}: DomainQualityDashboardProps) {
  
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const userDomain = userEmail.split('@')[1];
  
  useEffect(() => {
    if (isOpen) {
      loadQualityMetrics();
    }
  }, [isOpen]);
  
  const loadQualityMetrics = async () => {
    setLoading(true);
    try {
      const metrics = await calculateDomainQuality(userDomain);
      setQualityMetrics(metrics);
    } catch (error) {
      console.error('Error loading quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  const dqs = qualityMetrics?.domainQualityScore || 0;
  const status = qualityMetrics?.status || 'acceptable';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard de Calidad</h2>
                <p className="text-sm text-slate-600">Domain: {userDomain}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <>
              {/* North Star Metric */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">🌟 North Star Metric</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    status === 'excellence' ? 'bg-purple-100 text-purple-700' :
                    status === 'world-class' ? 'bg-green-100 text-green-700' :
                    status === 'acceptable' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {status === 'excellence' ? '🏆 Excellence' :
                     status === 'world-class' ? '✨ World-Class' :
                     status === 'acceptable' ? '✅ Acceptable' : '⚠️ Below Acceptable'}
                  </span>
                </div>
                
                <div className="text-center mb-4">
                  <p className="text-6xl font-bold text-green-600 mb-2">{dqs.toFixed(1)}</p>
                  <p className="text-sm text-slate-600">Domain Quality Score (DQS)</p>
                  <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        dqs >= 90 ? 'bg-purple-600' :
                        dqs >= 85 ? 'bg-green-600' :
                        dqs >= 70 ? 'bg-blue-600' : 'bg-orange-600'
                      }`}
                      style={{ width: `${Math.min(100, dqs)}%` }}
                    />
                  </div>
                </div>
                
                {/* Component Scores */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{qualityMetrics?.csatScore || 0}</p>
                    <p className="text-xs text-slate-600">CSAT (30%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{qualityMetrics?.npsScore || 0}</p>
                    <p className="text-xs text-slate-600">NPS (25%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{qualityMetrics?.expertRatingScore || 0}</p>
                    <p className="text-xs text-slate-600">Expert (25%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{qualityMetrics?.resolutionScore || 0}</p>
                    <p className="text-xs text-slate-600">Resolution (10%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{qualityMetrics?.accuracyScore || 0}</p>
                    <p className="text-xs text-slate-600">Accuracy (10%)</p>
                  </div>
                </div>
              </div>
              
              {/* Trend */}
              {qualityMetrics?.trend && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-6 h-6 ${
                      qualityMetrics.trend === 'improving' ? 'text-green-600' :
                      qualityMetrics.trend === 'declining' ? 'text-red-600' : 'text-slate-600'
                    }`} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Tendencia: {
                          qualityMetrics.trend === 'improving' ? '📈 Mejorando' :
                          qualityMetrics.trend === 'declining' ? '📉 Declinando' : '📊 Estable'
                        }
                      </p>
                      {qualityMetrics.changeFromPrevious && (
                        <p className="text-sm text-slate-600">
                          {qualityMetrics.changeFromPrevious > 0 ? '+' : ''}
                          {qualityMetrics.changeFromPrevious.toFixed(1)} points vs mes anterior
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  💡 El Domain Quality Score (DQS) mide la calidad general de las respuestas del agente
                  en tu dominio. Se calcula en tiempo real basándose en feedback de usuarios y expertos.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

