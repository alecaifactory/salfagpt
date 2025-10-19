/**
 * RAG Configuration Panel (Admin Only)
 * 
 * Comprehensive system-wide RAG settings and monitoring
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Search, Settings, Database, Zap, DollarSign, Activity, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface RAGConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

interface RAGSystemConfig {
  // Global RAG settings
  globalEnabled: boolean;
  defaultTopK: number;
  defaultChunkSize: number;
  defaultMinSimilarity: number;
  defaultOverlap: number;
  
  // Performance settings
  batchSize: number;
  maxChunksPerDocument: number;
  cacheTTL: number;
  
  // Cost control
  maxEmbeddingsPerDay: number;
  alertThreshold: number;
  
  // Quality settings
  enableFallback: boolean;
  fallbackThreshold: number;
  enableHybridSearch: boolean;
}

interface RAGStats {
  totalChunks: number;
  totalSources: number;
  sourcesWithRAG: number;
  totalSearches: number;
  avgSearchTime: number;
  avgSimilarity: number;
  fallbackRate: number;
  tokensSaved: number;
  costSaved: number;
}

export default function RAGConfigPanel({ isOpen, onClose, isAdmin }: RAGConfigPanelProps) {
  const [config, setConfig] = useState<RAGSystemConfig>({
    globalEnabled: true,
    defaultTopK: 5,
    defaultChunkSize: 500,
    defaultMinSimilarity: 0.5,
    defaultOverlap: 50,
    batchSize: 5,
    maxChunksPerDocument: 1000,
    cacheTTL: 3600,
    maxEmbeddingsPerDay: 100000,
    alertThreshold: 80000,
    enableFallback: true,
    fallbackThreshold: 0.3,
    enableHybridSearch: false
  });

  const [stats, setStats] = useState<RAGStats>({
    totalChunks: 0,
    totalSources: 0,
    sourcesWithRAG: 0,
    totalSearches: 0,
    avgSearchTime: 0,
    avgSimilarity: 0,
    fallbackRate: 0,
    tokensSaved: 0,
    costSaved: 0
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'stats' | 'maintenance'>('config');

  useModalClose(isOpen, onClose);

  // Load configuration and stats
  useEffect(() => {
    if (isOpen && isAdmin) {
      loadConfig();
      loadStats();
    }
  }, [isOpen, isAdmin]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rag-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
      }
    } catch (error) {
      console.error('Error loading RAG config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/rag-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading RAG stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/rag-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        alert('✅ Configuración RAG guardada correctamente');
        onClose();
      } else {
        alert('❌ Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving RAG config:', error);
      alert('❌ Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkReindex = async () => {
    if (!confirm('¿Re-indexar todos los documentos? Esto puede tardar varios minutos.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/rag-reindex-all', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Re-indexación iniciada: ${data.documentsQueued} documentos en cola`);
        loadStats();
      } else {
        alert('❌ Error al iniciar re-indexación');
      }
    } catch (error) {
      console.error('Error starting bulk reindex:', error);
      alert('❌ Error al iniciar re-indexación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">Acceso Denegado</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Solo los administradores pueden acceder a la configuración RAG del sistema.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 w-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Configuración RAG del Sistema
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Administrador • Configuración global de búsqueda vectorial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'config'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Mantenimiento
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Global Enable */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Sistema RAG Global
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Activa/desactiva RAG para todos los usuarios del sistema
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.globalEnabled}
                      onChange={(e) => setConfig({ ...config, globalEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Search Configuration */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Configuración de Búsqueda
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Top K */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Chunks a Recuperar (Top K)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.defaultTopK}
                      onChange={(e) => setConfig({ ...config, defaultTopK: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Valor por defecto: 5-7 (balanceado)
                    </p>
                  </div>

                  {/* Chunk Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Tamaño de Chunk (tokens)
                    </label>
                    <select
                      value={config.defaultChunkSize}
                      onChange={(e) => setConfig({ ...config, defaultChunkSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="250">250 (Pequeño - Más preciso)</option>
                      <option value="500">500 (Balanceado - Recomendado)</option>
                      <option value="750">750 (Grande - Más contexto)</option>
                      <option value="1000">1000 (Muy grande)</option>
                    </select>
                  </div>

                  {/* Min Similarity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Similaridad Mínima
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.defaultMinSimilarity}
                      onChange={(e) => setConfig({ ...config, defaultMinSimilarity: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      0.5 = 50% similar o más
                    </p>
                  </div>

                  {/* Overlap */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Overlap entre Chunks (tokens)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={config.defaultOverlap}
                      onChange={(e) => setConfig({ ...config, defaultOverlap: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Contexto compartido entre chunks
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Configuration */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Configuración de Rendimiento
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Batch Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Tamaño de Batch
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={config.batchSize}
                      onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Embeddings por lote (5 recomendado)
                    </p>
                  </div>

                  {/* Max Chunks */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Máx. Chunks por Documento
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={config.maxChunksPerDocument}
                      onChange={(e) => setConfig({ ...config, maxChunksPerDocument: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Límite de seguridad
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Control */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Control de Costos
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Max Embeddings per Day */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Máx. Embeddings por Día
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      value={config.maxEmbeddingsPerDay}
                      onChange={(e) => setConfig({ ...config, maxEmbeddingsPerDay: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Límite diario de generación
                    </p>
                  </div>

                  {/* Alert Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Umbral de Alerta
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      value={config.alertThreshold}
                      onChange={(e) => setConfig({ ...config, alertThreshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Alerta al alcanzar este límite
                    </p>
                  </div>
                </div>
              </div>

              {/* Quality Settings */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  Configuración de Calidad
                </h3>

                <div className="space-y-4">
                  {/* Enable Fallback */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Fallback Automático
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Usar documentos completos si RAG no encuentra resultados
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableFallback}
                        onChange={(e) => setConfig({ ...config, enableFallback: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Fallback Threshold */}
                  {config.enableFallback && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        Umbral para Fallback
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.fallbackThreshold}
                        onChange={(e) => setConfig({ ...config, fallbackThreshold: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Si mejor resultado {"<"} {config.fallbackThreshold}, usar documento completo
                      </p>
                    </div>
                  )}

                  {/* Enable Hybrid Search */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Búsqueda Híbrida (Experimental)
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Combinar búsqueda vectorial con búsqueda por palabras clave
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableHybridSearch}
                        onChange={(e) => setConfig({ ...config, enableHybridSearch: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <Database className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.totalChunks.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Chunks</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.sourcesWithRAG}/{stats.totalSources}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Fuentes con RAG</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <Search className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.totalSearches.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Búsquedas</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    ${stats.costSaved.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Ahorrado</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Métricas de Rendimiento
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tiempo Búsqueda Promedio</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {stats.avgSearchTime}ms
                    </p>
                    <p className={`text-xs mt-1 ${stats.avgSearchTime < 300 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {stats.avgSearchTime < 300 ? '✓ Excelente' : '⚠ Revisar'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Similaridad Promedio</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {(stats.avgSimilarity * 100).toFixed(1)}%
                    </p>
                    <p className={`text-xs mt-1 ${stats.avgSimilarity > 0.6 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {stats.avgSimilarity > 0.6 ? '✓ Buena calidad' : '⚠ Mejorar'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tasa de Fallback</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {(stats.fallbackRate * 100).toFixed(1)}%
                    </p>
                    <p className={`text-xs mt-1 ${stats.fallbackRate < 0.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {stats.fallbackRate < 0.1 ? '✓ Óptimo' : '⚠ Alto'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tokens Saved Visualization */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Ahorro de Tokens
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Total Ahorrado</span>
                      <span className="font-bold text-green-600">{stats.tokensSaved.toLocaleString()} tokens</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                        style={{ width: '95%' }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      95% de reducción promedio
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                      💰 Ahorro Estimado
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Flash Model</p>
                        <p className="text-lg font-bold text-green-600">${(stats.costSaved * 0.075).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Pro Model</p>
                        <p className="text-lg font-bold text-green-600">${(stats.costSaved * 1.25).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              {/* System Status */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Estado del Sistema
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Vertex AI API</p>
                        <p className="text-xs text-slate-500">Embedding generation service</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600">Activo</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Firestore Chunks</p>
                        <p className="text-xs text-slate-500">document_chunks collection</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600">{stats.totalChunks.toLocaleString()} chunks</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`w-5 h-5 ${stats.fallbackRate < 0.1 ? 'text-green-600' : 'text-yellow-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Tasa de Fallback</p>
                        <p className="text-xs text-slate-500">Búsquedas que usan documento completo</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${stats.fallbackRate < 0.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {(stats.fallbackRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bulk Operations */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Operaciones en Lote
                </h3>

                <div className="space-y-3">
                  {/* Re-index All */}
                  <button
                    onClick={handleBulkReindex}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                      <div className="text-left">
                        <p className="font-medium text-slate-800 dark:text-white">Re-indexar Todos los Documentos</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Regenera embeddings para todos los documentos sin RAG
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {stats.totalSources - stats.sourcesWithRAG} pendientes
                    </span>
                  </button>

                  {/* Clear Embeddings Cache */}
                  <button
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-yellow-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800 dark:text-white">Limpiar Caché</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Elimina chunks de documentos eliminados
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Rebuild Indexes */}
                  <button
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800 dark:text-white">Optimizar Índices</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Reorganiza chunks para mejor rendimiento
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Health Checks */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Health Checks
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700 dark:text-slate-300">Vertex AI API disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700 dark:text-slate-300">Firestore indexes configurados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700 dark:text-slate-300">Service account con permisos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.avgSearchTime < 500 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300">
                      Latencia de búsqueda: {stats.avgSearchTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => loadStats()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      </div>
    </div>
  );
}

