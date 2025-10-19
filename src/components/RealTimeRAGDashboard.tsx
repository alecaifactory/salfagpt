/**
 * Real-Time RAG Monitoring Dashboard
 * 
 * Live monitoring of RAG system performance and health
 */

import React, { useState, useEffect } from 'react';
import { Activity, Search, Zap, Database, X, RefreshCw, TrendingUp } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface RealTimeRAGDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RAGMetrics {
  last5min: {
    queries: number;
    ragHits: number;
    avgSearchTime: number;
    avgSimilarity: number;
    tokensSaved: number;
    costSaved: number;
  };
  activeNow: {
    queriesInProgress: number;
  };
  systemHealth: {
    vertexAI: 'healthy' | 'degraded' | 'down';
    firestoreChunks: 'healthy' | 'degraded' | 'down';
    searchLatency: number;
    errorRate: number;
  };
}

export default function RealTimeRAGDashboard({
  isOpen,
  onClose
}: RealTimeRAGDashboardProps) {
  const [metrics, setMetrics] = useState<RAGMetrics | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useModalClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
      
      if (autoRefresh) {
        const interval = setInterval(loadMetrics, 5000); // Refresh every 5s
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  const loadMetrics = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/admin/rag-metrics-realtime');
      // const data = await response.json();
      
      // Mock data for now
      setMetrics({
        last5min: {
          queries: Math.floor(Math.random() * 20) + 5,
          ragHits: Math.floor(Math.random() * 18) + 4,
          avgSearchTime: Math.floor(Math.random() * 100) + 200,
          avgSimilarity: 0.75 + Math.random() * 0.15,
          tokensSaved: Math.floor(Math.random() * 100000) + 500000,
          costSaved: (Math.random() * 2) + 0.5
        },
        activeNow: {
          queriesInProgress: Math.floor(Math.random() * 5)
        },
        systemHealth: {
          vertexAI: 'healthy',
          firestoreChunks: 'healthy',
          searchLatency: Math.floor(Math.random() * 100) + 200,
          errorRate: Math.random() * 0.05
        }
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Monitor RAG en Tiempo Real
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Actualización automática cada 5s
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600 dark:text-slate-400">Auto-refresh</span>
            </label>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {metrics && (
            <>
              {/* Last 5 Minutes */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                  Últimos 5 Minutos
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <Search className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {metrics.last5min.queries}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Queries Totales</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {metrics.last5min.ragHits} con RAG ({((metrics.last5min.ragHits / metrics.last5min.queries) * 100).toFixed(1)}%)
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {metrics.last5min.avgSearchTime}ms
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Latencia Promedio</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {(metrics.last5min.avgSimilarity * 100).toFixed(1)}% similaridad avg
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      ${metrics.last5min.costSaved.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Ahorrado</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {metrics.last5min.tokensSaved.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Now */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                  Activo Ahora
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {metrics.activeNow.queriesInProgress}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        queries en progreso
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                  Salud del Sistema
                </h3>
                <div className="space-y-2">
                  <HealthIndicator
                    label="Vertex AI API"
                    status={metrics.systemHealth.vertexAI}
                    detail="Servicio de embeddings"
                  />
                  <HealthIndicator
                    label="Firestore Chunks"
                    status={metrics.systemHealth.firestoreChunks}
                    detail="document_chunks collection"
                  />
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Latencia de Búsqueda
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tiempo promedio de RAG search
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        metrics.systemHealth.searchLatency < 300 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {metrics.systemHealth.searchLatency}ms
                      </p>
                      <p className="text-xs text-slate-500">
                        {metrics.systemHealth.searchLatency < 300 ? '✓ Excelente' : '⚠ Revisar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tasa de Error
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Búsquedas fallidas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        metrics.systemHealth.errorRate < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(metrics.systemHealth.errorRate * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {metrics.systemHealth.errorRate < 0.01 ? '✓ Excelente' : '✗ Alto'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthIndicator({ label, status, detail }: { label: string; status: string; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          status === 'healthy' ? 'bg-green-500' :
          status === 'degraded' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
        status === 'healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
        status === 'degraded' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      }`}>
        {status === 'healthy' ? 'Activo' : status === 'degraded' ? 'Degradado' : 'Inactivo'}
      </span>
    </div>
  );
}

