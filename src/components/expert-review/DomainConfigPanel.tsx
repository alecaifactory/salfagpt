// Domain Configuration Panel
// Created: 2025-11-10
// Purpose: Configure expert review settings, assign experts/specialists

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  UserPlus, 
  X, 
  Check, 
  AlertTriangle,
  Mail,
  Bell,
  Zap,
  Target,
  Clock,
  Shield,
  TrendingUp,
  Save,
  RefreshCw
} from 'lucide-react';

// Types
interface DomainReviewConfig {
  id: string;
  domainName: string;
  priorityThresholds: {
    userStarThreshold: number;
    expertRatingThreshold: 'inaceptable' | 'mejorable' | 'aceptable';
    autoFlagInaceptable: boolean;
    minimumSimilarQuestions: number;
  };
  supervisors: Array<{
    userId: string;
    userEmail: string;
    name: string;
    assignedAt: Date;
    canApproveCorrections: boolean;
    activeAssignments: number;
  }>;
  specialists: Array<{
    userId: string;
    userEmail: string;
    name: string;
    specialty: string;
    domains: string[];
    maxConcurrentAssignments: number;
    autoAssign: boolean;
    notificationPreferences: {
      weeklyDigest: boolean;
      instantAlerts: boolean;
      emailEnabled: boolean;
    };
  }>;
  implementers: Array<{
    userId: string;
    userEmail: string;
    name: string;
    canImplement: boolean;
  }>;
  notifications: {
    supervisorAlertThreshold: number;
    specialistWeeklyDigest: {
      enabled: boolean;
      dayOfWeek: string;
      time: string;
    };
    adminBatchReportFrequency: string;
  };
  automation: {
    autoGenerateAISuggestions: boolean;
    autoRunImpactAnalysis: boolean;
    autoMatchSpecialists: boolean;
    batchImplementationEnabled: boolean;
  };
  customSettings: {
    language: string;
    timezone: string;
    qualityGoals: {
      targetCSAT: number;
      targetNPS: number;
      minimumAcceptableRating: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastReviewActivity?: Date;
  source: 'localhost' | 'production';
}

interface DomainConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export default function DomainConfigPanel({
  isOpen,
  onClose,
  userRole,
  userId,
  userEmail,
  userName
}: DomainConfigPanelProps) {
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DomainReviewConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'experts' | 'thresholds' | 'automation' | 'goals'>('experts');
  const [showAddExpert, setShowAddExpert] = useState(false);
  
  // Derive domain from email
  const userDomain = userEmail.split('@')[1];
  const isSuperAdmin = userRole === 'superadmin';
  
  // Load config on mount
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, userDomain]);
  
  const loadConfig = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/expert-review/domain-config?domainId=${userDomain}`);
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        console.log('✅ Domain config loaded:', data);
      } else if (response.status === 404) {
        // No config yet - create default
        await createDefaultConfig();
      } else {
        throw new Error('Failed to load config');
      }
      
    } catch (error) {
      console.error('❌ Error loading config:', error);
      alert('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };
  
  const createDefaultConfig = async () => {
    try {
      const response = await fetch('/api/expert-review/domain-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: userDomain,
          domainName: userDomain,
          createdBy: userId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        console.log('✅ Default config created');
      }
    } catch (error) {
      console.error('❌ Error creating default config:', error);
    }
  };
  
  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      
      const response = await fetch('/api/expert-review/domain-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: userDomain,
          config
        })
      });
      
      if (response.ok) {
        console.log('✅ Config saved');
        alert('Configuración guardada exitosamente');
      } else {
        throw new Error('Failed to save');
      }
      
    } catch (error) {
      console.error('❌ Error saving config:', error);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };
  
  const addSupervisor = async (expertEmail: string, expertName: string) => {
    if (!config) return;
    
    try {
      const response = await fetch('/api/expert-review/add-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: userDomain,
          userId: expertEmail.replace('@', '_').replace(/\./g, '_'),
          userEmail: expertEmail,
          userName: expertName
        })
      });
      
      if (response.ok) {
        await loadConfig(); // Reload
        setShowAddExpert(false);
        console.log('✅ Supervisor added');
      }
    } catch (error) {
      console.error('❌ Error adding supervisor:', error);
      alert('Error al agregar supervisor');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Configuración de Evaluación
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isSuperAdmin ? 'Configuración Global' : `Dominio: ${userDomain}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Cargando configuración...</p>
            </div>
          </div>
        ) : !config ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No se pudo cargar la configuración</p>
              <button
                onClick={loadConfig}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('experts')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'experts'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4 inline-block mr-2" />
                Expertos & Especialistas
              </button>
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'thresholds'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Target className="w-4 h-4 inline-block mr-2" />
                Umbrales
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'automation'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 inline-block mr-2" />
                Automatización
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'goals'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline-block mr-2" />
                Metas de Calidad
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Experts Tab */}
              {activeTab === 'experts' && (
                <div className="space-y-6">
                  
                  {/* Supervisors Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Supervisores ({config.supervisors.length})
                      </h3>
                      <button
                        onClick={() => setShowAddExpert(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Agregar Supervisor
                      </button>
                    </div>
                    
                    {config.supervisors.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          No hay supervisores asignados
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {config.supervisors.map((supervisor, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                {supervisor.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {supervisor.name}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {supervisor.userEmail}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right text-sm">
                                <p className="text-slate-600 dark:text-slate-400">
                                  {supervisor.activeAssignments} asignaciones activas
                                </p>
                                {supervisor.canApproveCorrections && (
                                  <p className="text-green-600 dark:text-green-400 flex items-center gap-1 justify-end">
                                    <Shield className="w-3 h-3" />
                                    Puede aprobar correcciones
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Specialists Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Especialistas ({config.specialists.length})
                      </h3>
                      <button
                        onClick={() => alert('Feature: Agregar Especialista - Coming soon')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        Agregar Especialista
                      </button>
                    </div>
                    
                    {config.specialists.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          No hay especialistas asignados
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {config.specialists.map((specialist, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {specialist.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                                    {specialist.name}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {specialist.specialty}
                                  </p>
                                </div>
                              </div>
                              {specialist.autoAssign && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                  Auto
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <p>Max asignaciones: {specialist.maxConcurrentAssignments}</p>
                              <p>Dominios: {specialist.domains.join(', ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>
              )}
              
              {/* Thresholds Tab */}
              {activeTab === 'thresholds' && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* User Star Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Umbral de Estrellas Usuario
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={config.priorityThresholds.userStarThreshold}
                        onChange={(e) => setConfig({
                          ...config,
                          priorityThresholds: {
                            ...config.priorityThresholds,
                            userStarThreshold: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Interacciones con ≤ esta calificación requieren revisión
                      </p>
                    </div>
                    
                    {/* Expert Rating Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Umbral de Evaluación Experto
                      </label>
                      <select
                        value={config.priorityThresholds.expertRatingThreshold}
                        onChange={(e) => setConfig({
                          ...config,
                          priorityThresholds: {
                            ...config.priorityThresholds,
                            expertRatingThreshold: e.target.value as any
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="inaceptable">Inaceptable</option>
                        <option value="mejorable">Mejorable</option>
                        <option value="aceptable">Aceptable</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Evaluaciones ≤ este nivel requieren acción
                      </p>
                    </div>
                    
                    {/* Auto Flag */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.priorityThresholds.autoFlagInaceptable}
                          onChange={(e) => setConfig({
                            ...config,
                            priorityThresholds: {
                              ...config.priorityThresholds,
                              autoFlagInaceptable: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Auto-marcar respuestas inaceptables
                        </span>
                      </label>
                      <p className="mt-1 ml-6 text-xs text-slate-600 dark:text-slate-400">
                        Alertar automáticamente al supervisor
                      </p>
                    </div>
                    
                    {/* Minimum Similar Questions */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Mínimo Preguntas Similares
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={config.priorityThresholds.minimumSimilarQuestions}
                        onChange={(e) => setConfig({
                          ...config,
                          priorityThresholds: {
                            ...config.priorityThresholds,
                            minimumSimilarQuestions: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Mínimo para análisis de impacto
                      </p>
                    </div>
                    
                  </div>
                  
                </div>
              )}
              
              {/* Automation Tab */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  
                  <div className="space-y-4">
                    
                    {/* AI Suggestions */}
                    <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={config.automation.autoGenerateAISuggestions}
                        onChange={(e) => setConfig({
                          ...config,
                          automation: {
                            ...config.automation,
                            autoGenerateAISuggestions: e.target.checked
                          }
                        })}
                        className="w-5 h-5 text-blue-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          Generar Sugerencias AI Automáticamente
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          El sistema generará correcciones sugeridas para cada interacción marcada
                        </p>
                      </div>
                    </label>
                    
                    {/* Impact Analysis */}
                    <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={config.automation.autoRunImpactAnalysis}
                        onChange={(e) => setConfig({
                          ...config,
                          automation: {
                            ...config.automation,
                            autoRunImpactAnalysis: e.target.checked
                          }
                        })}
                        className="w-5 h-5 text-blue-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          Ejecutar Análisis de Impacto Automático
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Calcular automáticamente cuántos usuarios se beneficiarían de cada corrección
                        </p>
                      </div>
                    </label>
                    
                    {/* Auto Match Specialists */}
                    <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={config.automation.autoMatchSpecialists}
                        onChange={(e) => setConfig({
                          ...config,
                          automation: {
                            ...config.automation,
                            autoMatchSpecialists: e.target.checked
                          }
                        })}
                        className="w-5 h-5 text-blue-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          Asignar Especialistas Automáticamente
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Asignar especialistas según dominio y disponibilidad
                        </p>
                      </div>
                    </label>
                    
                    {/* Batch Implementation */}
                    <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={config.automation.batchImplementationEnabled}
                        onChange={(e) => setConfig({
                          ...config,
                          automation: {
                            ...config.automation,
                            batchImplementationEnabled: e.target.checked
                          }
                        })}
                        className="w-5 h-5 text-blue-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          Implementación por Lotes Habilitada
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Aplicar múltiples correcciones a la vez para máxima eficiencia
                        </p>
                      </div>
                    </label>
                    
                  </div>
                  
                </div>
              )}
              
              {/* Goals Tab */}
              {activeTab === 'goals' && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Target CSAT */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        CSAT Objetivo
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={config.customSettings.qualityGoals.targetCSAT}
                        onChange={(e) => setConfig({
                          ...config,
                          customSettings: {
                            ...config.customSettings,
                            qualityGoals: {
                              ...config.customSettings.qualityGoals,
                              targetCSAT: parseFloat(e.target.value)
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Meta de satisfacción (1-5)
                      </p>
                    </div>
                    
                    {/* Target NPS */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        NPS Objetivo
                      </label>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        value={config.customSettings.qualityGoals.targetNPS}
                        onChange={(e) => setConfig({
                          ...config,
                          customSettings: {
                            ...config.customSettings,
                            qualityGoals: {
                              ...config.customSettings.qualityGoals,
                              targetNPS: parseInt(e.target.value)
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Meta de promotores netos (-100 a 100)
                      </p>
                    </div>
                    
                    {/* Minimum Acceptable Rating */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Rating Mínimo Aceptable
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={config.customSettings.qualityGoals.minimumAcceptableRating}
                        onChange={(e) => setConfig({
                          ...config,
                          customSettings: {
                            ...config.customSettings,
                            qualityGoals: {
                              ...config.customSettings.qualityGoals,
                              minimumAcceptableRating: parseFloat(e.target.value)
                            }
                          }
                        })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Por debajo se considera problema
                      </p>
                    </div>
                    
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      <strong>Nota:</strong> Estas metas se usan para calcular el rendimiento del sistema y determinar 
                      prioridades de revisión. Las interacciones que no cumplan estas metas serán marcadas para revisión.
                    </p>
                  </div>
                  
                </div>
              )}
              
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Última actualización: {config.updatedAt.toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Configuración
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}

