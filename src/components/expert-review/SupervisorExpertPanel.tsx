// Supervisor Expert Panel - Main dashboard for domain quality supervision
// Created: 2025-11-09

import React, { useState, useEffect } from 'react';
import { 
  Award, Filter, Search, Star, AlertTriangle, Clock, Target,
  TrendingUp, Sparkles, User, Calendar, X, Loader2, MessageSquare,
  CheckCircle, Send
} from 'lucide-react';

interface SupervisorExpertPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupervisorExpertPanel({
  userId, userEmail, userName, userRole, isOpen, onClose
}: SupervisorExpertPanelProps) {
  
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pendiente');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ evaluatedThisMonth: 0, approvalRate: 0, ranking: 2, avgTimePerEval: 8 });
  
  const userDomain = userEmail.split('@')[1];
  
  useEffect(() => {
    if (isOpen) {
      loadInteractions();
      loadStats();
    }
  }, [isOpen, filterStatus]);
  
  const loadInteractions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expert-review/interactions?domain=${userDomain}&status=${filterStatus}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setInteractions(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const response = await fetch(
        `/api/expert-review/stats?userId=${userId}&domain=${userDomain}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Panel Experto Supervisor</h2>
                <p className="text-sm text-slate-600">{userName} • Domain: {userDomain}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Personal Dashboard */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <p className="text-xs font-semibold text-amber-900 mb-2">TU IMPACTO ESTE MES</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Evaluadas</p>
              <p className="text-2xl font-bold text-amber-900">{stats.evaluatedThisMonth}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Tasa Aprobación</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvalRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Ranking</p>
              <p className="text-2xl font-bold text-purple-600">#{stats.ranking}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgTimePerEval}min</p>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar interacciones..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="pendiente">Pendientes</option>
              <option value="en-revision">En Revisión</option>
              <option value="all">Todas</option>
            </select>
            <button
              onClick={loadInteractions}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>
        
        {/* Interaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <span className="ml-3 text-slate-600">Cargando interacciones...</span>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No hay interacciones {filterStatus !== 'all' ? filterStatus : ''}
              </h3>
              <p className="text-sm text-slate-500">
                {filterStatus === 'pendiente' 
                  ? 'Todas las interacciones prioritarias han sido evaluadas' 
                  : 'No se encontraron interacciones con los filtros seleccionados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.filter(i => 
                !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((interaction) => (
                <div
                  key={interaction.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-500">#{interaction.id?.substring(0,8)}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          interaction.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          interaction.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {interaction.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1">{interaction.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{interaction.description?.substring(0, 150)}...</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {interaction.reportedByEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {interaction.createdAt ? new Date(interaction.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {interaction.originalFeedback?.rating || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Evaluation modal - Integrate with ExpertFeedbackPanel')}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                    >
                      Evaluar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

