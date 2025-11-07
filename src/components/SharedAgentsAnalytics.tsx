/**
 * Shared Agents Analytics Component
 * 
 * Displays comprehensive analytics on shared agent usage:
 * - Which agents are shared and with whom
 * - Usage patterns (queries, users, success rates)
 * - Reference quality metrics (success/failure rates)
 * - Cost efficiency and ROI
 * - Traceability audit trail
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Share2, TrendingUp, AlertCircle, CheckCircle, XCircle, 
  BarChart3, PieChart, Activity, Target, DollarSign, Clock,
  ChevronDown, ChevronRight, FileText, Zap, Award, Eye
} from 'lucide-react';

interface SharedAgentStats {
  agentId: string;
  agentName: string;
  ownerId: string;
  ownerEmail: string;
  
  // Sharing info
  totalShares: number;
  activeUsers: number;
  domains: string[];
  accessLevels: { view: number; use: number; admin: number };
  
  // Usage metrics
  totalQueries: number;
  queriesLast7Days: number;
  queriesLast30Days: number;
  avgQueriesPerUser: number;
  
  // Reference quality
  totalReferences: number;
  referencesSucceeded: number;  // RAG chunks found
  referencesFailed: number;      // Emergency fallback
  referenceSuccessRate: number;  // %
  avgSimilarity: number;         // Avg similarity score
  
  // Breakdown by access type
  ownerQueries: number;          // Admin's own queries
  sharedQueries: number;         // Non-admin shared access
  
  // Source usage
  topSources: Array<{
    name: string;
    timesReferenced: number;
    avgSimilarity: number;
  }>;
  
  // Cost & efficiency
  indexingCost: number;          // One-time cost
  queryCost: number;             // Total query costs
  costPerQuery: number;          // Avg
  roi: number;                   // Multiplier
}

interface UserSharedAccessStats {
  userId: string;
  userEmail: string;
  domain: string;
  
  // Access summary
  sharedAgentsAccessed: number;
  totalQueries: number;
  uniqueSourcesAccessed: number;
  
  // Quality metrics
  avgSimilarity: number;
  referenceSuccessRate: number;
  
  // Most used
  topAgent: { name: string; queries: number };
  topSource: { name: string; references: number };
  
  // Timeline
  firstAccess: Date;
  lastAccess: Date;
  queriesLast7Days: number;
}

interface ReferenceQualityMetrics {
  // Overall
  totalMessages: number;
  messagesWithReferences: number;
  messagesWithoutReferences: number;
  
  // By access type
  ownerMessages: {
    total: number;
    withRefs: number;
    avgRefsPerMessage: number;
    avgSimilarity: number;
    successRate: number;
  };
  
  sharedMessages: {
    total: number;
    withRefs: number;
    avgRefsPerMessage: number;
    avgSimilarity: number;
    successRate: number;
  };
  
  // By search method
  ragChunks: number;        // Semantic search succeeded
  fullDocuments: number;    // Emergency fallback
  noReferences: number;     // No context available
  
  // Failure reasons
  failureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export default function SharedAgentsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [sharedAgents, setSharedAgents] = useState<SharedAgentStats[]>([]);
  const [userStats, setUserStats] = useState<UserSharedAccessStats[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<ReferenceQualityMetrics | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agents' | 'users' | 'quality'>('agents');

  useEffect(() => {
    loadSharedAgentsAnalytics();
  }, []);

  const loadSharedAgentsAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/shared-agents');
      if (response.ok) {
        const data = await response.json();
        setSharedAgents(data.agents || []);
        setUserStats(data.users || []);
        setQualityMetrics(data.quality || null);
      }
    } catch (error) {
      console.error('Error loading shared agents analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando analíticas de agentes compartidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Share2 className="w-8 h-8 text-blue-600" />
          Shared Agents Analytics
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Analíticas completas de agentes compartidos, uso por usuarios, calidad de referencias y trazabilidad
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('agents')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'agents'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Agentes Compartidos
          </div>
        </button>
        <button
          onClick={() => setViewMode('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuarios Compartidos
          </div>
        </button>
        <button
          onClick={() => setViewMode('quality')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'quality'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Calidad de Referencias
          </div>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-900">Agentes Compartidos</h3>
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{sharedAgents.length}</p>
          <p className="text-xs text-blue-700 mt-1">
            {sharedAgents.reduce((sum, a) => sum + a.activeUsers, 0)} usuarios activos
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-green-900">Consultas Totales</h3>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">
            {sharedAgents.reduce((sum, a) => sum + a.sharedQueries, 0).toLocaleString()}
          </p>
          <p className="text-xs text-green-700 mt-1">
            vía acceso compartido
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-900">Tasa de Éxito</h3>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {qualityMetrics?.sharedMessages.successRate.toFixed(1)}%
          </p>
          <p className="text-xs text-purple-700 mt-1">
            referencias generadas correctamente
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-amber-900">Ahorro Total</h3>
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900">
            ${((sharedAgents.reduce((sum, a) => sum + a.roi, 0) / sharedAgents.length) || 0).toFixed(0)}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            promedio por agente compartido
          </p>
        </div>
      </div>

      {/* Main Content - Tabbed View */}
      {viewMode === 'agents' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Agentes Compartidos - Detalles
          </h3>

          <div className="space-y-3">
            {sharedAgents.map((agent, index) => (
              <div
                key={agent.agentId}
                className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
              >
                {/* Agent Header */}
                <button
                  onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-slate-900 text-lg">{agent.agentName}</h4>
                      <p className="text-sm text-slate-600">
                        Dueño: {agent.ownerEmail} • {agent.activeUsers} usuarios activos
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quick Stats */}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{agent.sharedQueries}</p>
                        <p className="text-xs text-slate-600">Consultas</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {agent.referenceSuccessRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-600">Éxito Refs</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {agent.avgSimilarity.toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-600">Similitud</p>
                      </div>
                    </div>

                    {selectedAgent === agent.agentId ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {selectedAgent === agent.agentId && (
                  <div className="p-6 bg-white space-y-6">
                    {/* Usage Overview */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Resumen de Uso
                      </h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Total Consultas</p>
                          <p className="text-2xl font-bold text-slate-900">{agent.totalQueries}</p>
                          <div className="mt-2 text-xs space-y-1">
                            <p className="text-green-600">↑ Últimos 7 días: {agent.queriesLast7Days}</p>
                            <p className="text-blue-600">↑ Últimos 30 días: {agent.queriesLast30Days}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Desglose por Tipo</p>
                          <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-700">Admin (propio):</span>
                              <span className="text-sm font-bold text-purple-600">{agent.ownerQueries}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-700">Users (compartido):</span>
                              <span className="text-sm font-bold text-blue-600">{agent.sharedQueries}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-xs font-semibold text-slate-800">Promedio/usuario:</span>
                              <span className="text-sm font-bold text-slate-900">
                                {agent.avgQueriesPerUser.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-1">Compartido Con</p>
                          <p className="text-2xl font-bold text-slate-900">{agent.activeUsers}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-700">
                              {agent.totalShares} shares activos
                            </p>
                            <p className="text-xs text-slate-700">
                              {agent.domains.length} dominios
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reference Quality Metrics */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        Calidad de Referencias
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Success/Failure Breakdown */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-semibold text-green-900">
                              Referencias Exitosas (RAG)
                            </h6>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-green-800">Total:</span>
                              <span className="text-xl font-bold text-green-900">
                                {agent.referencesSucceeded}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-green-800">Tasa de éxito:</span>
                              <span className="text-lg font-bold text-green-900">
                                {agent.referenceSuccessRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-green-800">Similitud promedio:</span>
                              <span className="text-lg font-bold text-green-900">
                                {agent.avgSimilarity.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-green-700">
                              ✅ Búsqueda semántica funcionando correctamente
                            </p>
                          </div>
                        </div>

                        {/* Fallback Usage */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-semibold text-amber-900">
                              Modo Emergencia (Full Doc)
                            </h6>
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-amber-800">Total:</span>
                              <span className="text-xl font-bold text-amber-900">
                                {agent.referencesFailed}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-amber-800">Tasa:</span>
                              <span className="text-lg font-bold text-amber-900">
                                {(100 - agent.referenceSuccessRate).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-amber-800">Razón:</span>
                              <span className="text-xs font-semibold text-amber-900">
                                No indexado
                              </span>
                            </div>
                          </div>

                          {agent.referencesFailed > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <p className="text-xs text-amber-700">
                                ⚠️ Documentos necesitan indexación para mejor calidad
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-700">
                            Distribución de Referencias
                          </span>
                          <span className="text-xs text-slate-600">
                            {agent.totalReferences} referencias totales
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                          <div
                            className="bg-green-500 flex items-center justify-center"
                            style={{ width: `${agent.referenceSuccessRate}%` }}
                            title={`RAG: ${agent.referencesSucceeded} referencias`}
                          >
                            {agent.referenceSuccessRate > 10 && (
                              <span className="text-[10px] font-bold text-white">
                                RAG {agent.referenceSuccessRate.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div
                            className="bg-amber-400 flex items-center justify-center"
                            style={{ width: `${100 - agent.referenceSuccessRate}%` }}
                            title={`Fallback: ${agent.referencesFailed} referencias`}
                          >
                            {(100 - agent.referenceSuccessRate) > 10 && (
                              <span className="text-[10px] font-bold text-white">
                                Fallback {(100 - agent.referenceSuccessRate).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Sources Referenced */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Fuentes Más Usadas (Top 5)
                      </h5>
                      <div className="space-y-2">
                        {agent.topSources.slice(0, 5).map((source, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium text-slate-800 truncate">
                                {source.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-xs text-slate-600">Referencias</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {source.timesReferenced}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-600">Similitud</p>
                                <p className={`text-lg font-bold ${
                                  source.avgSimilarity >= 70 ? 'text-green-600' :
                                  source.avgSimilarity >= 60 ? 'text-yellow-600' :
                                  'text-orange-600'
                                }`}>
                                  {source.avgSimilarity.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost & ROI */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        Eficiencia de Costos
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-xs text-slate-600 mb-2">Inversión Inicial</p>
                          <p className="text-sm text-slate-700">
                            Indexación: <span className="font-bold">${agent.indexingCost.toFixed(2)}</span>
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            Consultas: <span className="font-bold">${agent.queryCost.toFixed(2)}</span>
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-600">Costo por consulta:</p>
                            <p className="text-lg font-bold text-slate-900">
                              ${agent.costPerQuery.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <p className="text-xs text-green-800 mb-2">ROI - Retorno de Inversión</p>
                          <p className="text-4xl font-bold text-green-900">
                            {agent.roi.toFixed(0)}x
                          </p>
                          <p className="text-xs text-green-700 mt-2">
                            1 indexación → {agent.activeUsers} usuarios beneficiados
                          </p>
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-green-800">
                              Ahorro vs duplicación:
                            </p>
                            <p className="text-lg font-bold text-green-900">
                              ${((agent.activeUsers - 1) * agent.indexingCost).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shared With */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Compartido Con
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {agent.domains.map(domain => (
                          <span
                            key={domain}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Ver</p>
                          <p className="text-lg font-bold text-slate-900">
                            {agent.accessLevels.view}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Usar</p>
                          <p className="text-lg font-bold text-slate-900">
                            {agent.accessLevels.use}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Admin</p>
                          <p className="text-lg font-bold text-slate-900">
                            {agent.accessLevels.admin}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sharedAgents.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Share2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No hay agentes compartidos</p>
                <p className="text-sm mt-2">Comparte un agente para ver analíticas aquí</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'users' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Usuarios con Acceso Compartido
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">#</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Usuario</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Agentes</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Consultas</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Fuentes</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Similitud</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Última Consulta</th>
                </tr>
              </thead>
              <tbody>
                {userStats.map((user, idx) => (
                  <tr key={user.userId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{user.userEmail}</p>
                        <p className="text-xs text-slate-500">{user.domain}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        {user.sharedAgentsAccessed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <p className="font-bold text-slate-900">{user.totalQueries}</p>
                        <p className="text-xs text-green-600">
                          {user.queriesLast7Days} últimos 7d
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-purple-600">
                        {user.uniqueSourcesAccessed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        user.avgSimilarity >= 70 ? 'text-green-600' :
                        user.avgSimilarity >= 60 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        {user.avgSimilarity.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {new Date(user.lastAccess).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {userStats.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No hay usuarios con acceso compartido</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'quality' && qualityMetrics && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Calidad de Referencias - Análisis Completo
          </h3>

          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Mensajes Totales</h4>
              </div>
              <p className="text-3xl font-bold text-blue-900">{qualityMetrics.totalMessages}</p>
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-blue-700">
                  ✅ Con referencias: {qualityMetrics.messagesWithReferences} ({((qualityMetrics.messagesWithReferences / qualityMetrics.totalMessages) * 100).toFixed(1)}%)
                </p>
                <p className="text-blue-700">
                  ❌ Sin referencias: {qualityMetrics.messagesWithoutReferences} ({((qualityMetrics.messagesWithoutReferences / qualityMetrics.totalMessages) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">RAG Exitoso</h4>
              </div>
              <p className="text-3xl font-bold text-green-900">{qualityMetrics.ragChunks}</p>
              <div className="mt-3 text-xs text-green-700">
                Búsqueda semántica funcionó correctamente
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Modo Emergencia</h4>
              </div>
              <p className="text-3xl font-bold text-amber-900">{qualityMetrics.fullDocuments}</p>
              <div className="mt-3 text-xs text-amber-700">
                Documentos completos usados (no indexados)
              </div>
            </div>
          </div>

          {/* Admin vs User Comparison */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4">
              Comparación: Admin (Propio) vs Users (Compartido)
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Admin Stats */}
              <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-violet-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-bold text-purple-900 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Admin (Acceso Propio)
                  </h5>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                    OWNER
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-800">Total mensajes:</span>
                    <span className="text-xl font-bold text-purple-900">
                      {qualityMetrics.ownerMessages.total}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-800">Con referencias:</span>
                    <span className="text-lg font-bold text-purple-900">
                      {qualityMetrics.ownerMessages.withRefs}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-800">Tasa de éxito:</span>
                    <span className="text-lg font-bold text-green-600">
                      {qualityMetrics.ownerMessages.successRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-800">Refs promedio/msg:</span>
                    <span className="text-lg font-bold text-purple-900">
                      {qualityMetrics.ownerMessages.avgRefsPerMessage.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                    <span className="text-sm font-semibold text-purple-800">Similitud promedio:</span>
                    <span className="text-xl font-bold text-purple-900">
                      {qualityMetrics.ownerMessages.avgSimilarity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Shared Users Stats */}
              <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-bold text-blue-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Users (Acceso Compartido)
                  </h5>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                    SHARED
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total mensajes:</span>
                    <span className="text-xl font-bold text-blue-900">
                      {qualityMetrics.sharedMessages.total}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Con referencias:</span>
                    <span className="text-lg font-bold text-blue-900">
                      {qualityMetrics.sharedMessages.withRefs}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Tasa de éxito:</span>
                    <span className="text-lg font-bold text-green-600">
                      {qualityMetrics.sharedMessages.successRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Refs promedio/msg:</span>
                    <span className="text-lg font-bold text-blue-900">
                      {qualityMetrics.sharedMessages.avgRefsPerMessage.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                    <span className="text-sm font-semibold text-blue-800">Similitud promedio:</span>
                    <span className="text-xl font-bold text-blue-900">
                      {qualityMetrics.sharedMessages.avgSimilarity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Comparison Bar */}
            <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-sm font-bold text-slate-800 mb-4">
                Comparación de Calidad: Admin vs Users
              </h5>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-700">Tasa de Éxito (Referencias Generadas)</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-purple-600">
                        Admin: {qualityMetrics.ownerMessages.successRate.toFixed(1)}%
                      </span>
                      <span className="text-xs text-blue-600">
                        Users: {qualityMetrics.sharedMessages.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full"
                        style={{ width: `${qualityMetrics.ownerMessages.successRate}%` }}
                      />
                    </div>
                    <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${qualityMetrics.sharedMessages.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-700">Calidad Promedio (Similitud)</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-purple-600">
                        Admin: {qualityMetrics.ownerMessages.avgSimilarity.toFixed(1)}%
                      </span>
                      <span className="text-xs text-blue-600">
                        Users: {qualityMetrics.sharedMessages.avgSimilarity.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full"
                        style={{ width: `${qualityMetrics.ownerMessages.avgSimilarity}%` }}
                      />
                    </div>
                    <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${qualityMetrics.sharedMessages.avgSimilarity}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-700">
                  <strong>💡 Insight:</strong> {
                    Math.abs(qualityMetrics.ownerMessages.successRate - qualityMetrics.sharedMessages.successRate) < 5
                      ? 'La calidad es prácticamente idéntica para admin y users compartidos. ✅ Sharing funciona perfectamente!'
                      : qualityMetrics.ownerMessages.successRate > qualityMetrics.sharedMessages.successRate
                      ? `Admin tiene ${(qualityMetrics.ownerMessages.successRate - qualityMetrics.sharedMessages.successRate).toFixed(1)}% mejor tasa. Revisar indexación para users compartidos.`
                      : 'Users compartidos tienen mejor tasa. Posible diferencia en tipos de consultas.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Failure Analysis */}
          {qualityMetrics.failureReasons.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Análisis de Fallos (Por qué no se generaron referencias)
              </h4>
              
              <div className="space-y-2">
                {qualityMetrics.failureReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-red-900">{reason.reason}</p>
                        <p className="text-xs text-red-700 mt-1">
                          Afecta {reason.percentage.toFixed(1)}% de los mensajes sin referencias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-900">{reason.count}</p>
                      <p className="text-xs text-red-700">casos</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Recomendaciones
                </h5>
                <ul className="space-y-2 text-xs text-blue-800">
                  {qualityMetrics.fullDocuments > 0 && (
                    <li>• Indexar {qualityMetrics.fullDocuments} documentos que usan modo emergencia</li>
                  )}
                  {qualityMetrics.noReferences > 0 && (
                    <li>• Revisar {qualityMetrics.noReferences} agentes sin fuentes de contexto asignadas</li>
                  )}
                  {qualityMetrics.sharedMessages.successRate < 90 && (
                    <li>• Mejorar indexación para acceso compartido (actualmente {qualityMetrics.sharedMessages.successRate.toFixed(1)}%)</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Search Method Distribution */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4">
              Distribución de Métodos de Búsqueda
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-green-800 mb-1">RAG Semántico</p>
                <p className="text-3xl font-bold text-green-900">{qualityMetrics.ragChunks}</p>
                <p className="text-xs text-green-700 mt-2">
                  {((qualityMetrics.ragChunks / qualityMetrics.totalMessages) * 100).toFixed(1)}% del total
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-xs text-amber-800 mb-1">Docs Completos</p>
                <p className="text-3xl font-bold text-amber-900">{qualityMetrics.fullDocuments}</p>
                <p className="text-xs text-amber-700 mt-2">
                  {((qualityMetrics.fullDocuments / qualityMetrics.totalMessages) * 100).toFixed(1)}% del total
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-1">Sin Referencias</p>
                <p className="text-3xl font-bold text-slate-900">{qualityMetrics.noReferences}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {((qualityMetrics.noReferences / qualityMetrics.totalMessages) * 100).toFixed(1)}% del total
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={loadSharedAgentsAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Activity className="w-4 h-4" />
          Actualizar Datos
        </button>

        <button
          onClick={() => {
            // Export data
            const data = {
              agents: sharedAgents,
              users: userStats,
              quality: qualityMetrics,
              generatedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shared-agents-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Exportar Datos
        </button>
      </div>
    </div>
  );
}

// Helper component for Download icon (if not imported)
const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

