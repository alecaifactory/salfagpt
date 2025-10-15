/**
 * Provider Management Dashboard
 * 
 * Admin-only dashboard to view and manage AI provider pricing.
 * Used to track costs for agents and context uploads.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  Database,
  Zap,
} from 'lucide-react';
import type { Provider, ModelPricing } from '../types/providers';
import { DEFAULT_PROVIDER, getPricingDisplay, getModelColor } from '../config/providers';

interface ProviderManagementDashboardProps {
  onClose: () => void;
  currentUser: any;
}

export default function ProviderManagementDashboard({ 
  onClose,
  currentUser,
}: ProviderManagementDashboardProps) {
  const [provider, setProvider] = useState<Provider>(DEFAULT_PROVIDER);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPricing | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load provider data from Firestore
  useEffect(() => {
    loadProviderData();
  }, []);

  async function loadProviderData() {
    setLoading(true);
    try {
      const response = await fetch('/api/providers/google-gemini');
      if (response.ok) {
        const data = await response.json();
        setProvider({
          ...data,
          lastSyncedAt: new Date(data.lastSyncedAt),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      } else {
        // Use default if not in Firestore yet
        setProvider(DEFAULT_PROVIDER);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      setProvider(DEFAULT_PROVIDER);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncPricing() {
    if (!confirm('¿Actualizar precios desde la configuración más reciente?')) return;
    
    setSyncing(true);
    try {
      const response = await fetch('/api/providers/google-gemini/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          source: 'manual',
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProvider({
          ...updated,
          lastSyncedAt: new Date(updated.lastSyncedAt),
          createdAt: new Date(updated.createdAt),
          updatedAt: new Date(updated.updatedAt),
        });
        alert('✅ Precios actualizados correctamente');
      } else {
        throw new Error('Failed to sync pricing');
      }
    } catch (error) {
      console.error('Error syncing pricing:', error);
      alert('❌ Error al actualizar precios');
    } finally {
      setSyncing(false);
    }
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'text': return <Sparkles className="w-4 h-4" />;
      case 'multimodal': return <Database className="w-4 h-4" />;
      case 'embedding': return <Zap className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Gestión de Proveedores</h2>
              <p className="text-sm text-slate-600">
                Modelos de IA disponibles y precios actualizados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Provider Info */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{provider.displayName}</h3>
                <p className="text-sm text-slate-600">{provider.description}</p>
                <a 
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  {provider.website} ↗
                </a>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Última sincronización:</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {formatDate(provider.lastSyncedAt)}
              </p>
              {provider.syncedBy && (
                <p className="text-xs text-slate-500 mt-1">
                  Por: {provider.syncedBy}
                </p>
              )}
              <button
                onClick={handleSyncPricing}
                disabled={syncing}
                className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Actualizar Precios'}
              </button>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Modelos Totales</span>
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{provider.models.length}</p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Modelos Gratuitos</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {provider.models.filter(m => m.free.available).length}
                  </p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Más Económico</span>
                    <TrendingUp className="w-5 h-5 text-cyan-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Flash Lite</p>
                  <p className="text-xs text-slate-600">$0.10 / 1M tokens</p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Más Potente</span>
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">2.5 Pro</p>
                  <p className="text-xs text-slate-600">$1.25 / 1M tokens</p>
                </div>
              </div>

              {/* Models Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                        Modelo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                        Categoría
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                        Contexto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">
                        Input (Pagado)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">
                        Output (Pagado)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                        Cache
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {provider.models.map((model) => {
                      const color = getModelColor(model.model);
                      
                      return (
                        <tr 
                          key={model.model}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedModel(model)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(model.category)}
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">
                                  {model.displayName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {model.model}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 bg-${color}-100 text-${color}-700 rounded-full text-xs font-semibold`}>
                              {model.category}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-mono text-slate-700">
                              {(model.capabilities.contextWindow / 1000).toLocaleString()}K
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-mono text-slate-800">
                              {getPricingDisplay(model.paid.inputPrice)}
                            </span>
                            <p className="text-xs text-slate-500">/ 1M tokens</p>
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-mono text-slate-800">
                              {getPricingDisplay(model.paid.outputPrice)}
                            </span>
                            <p className="text-xs text-slate-500">/ 1M tokens</p>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            {model.capabilities.supportsContextCaching ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-slate-300 mx-auto" />
                            )}
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {model.isPreview && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                                  Preview
                                </span>
                              )}
                              {model.free.available && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  Free
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModel(model);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Ver Detalles
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pricing Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm text-blue-800">
                    <p className="font-semibold">Notas sobre precios:</p>
                    <ul className="list-disc ml-4 space-y-1 text-blue-700">
                      <li>Todos los precios son por 1 millón de tokens procesados</li>
                      <li>Free tier incluye límites generosos para desarrollo</li>
                      <li>Paid tier incluye límites más altos para producción</li>
                      <li>Context Caching reduce costos para contextos reutilizados</li>
                      <li>Batch API ofrece 50% de descuento (donde esté disponible)</li>
                      <li>Grounding con Google Search: 1,500 RPD gratis, luego $35 / 1,000 requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              Precios actualizados: {formatDate(provider.lastSyncedAt)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white transition-colors text-slate-700 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(selectedModel.category)}
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {selectedModel.displayName}
                    </h3>
                    <p className="text-sm text-slate-600">{selectedModel.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Pricing Tiers */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3">Precios</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Free Tier */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                        FREE TIER
                      </span>
                      {!selectedModel.free.available && (
                        <span className="text-xs text-slate-500">(No disponible)</span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Input:</span>
                        <span className="font-mono font-semibold">
                          {selectedModel.free.available ? 'Gratis' : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Output:</span>
                        <span className="font-mono font-semibold">
                          {selectedModel.free.available ? 'Gratis' : 'N/A'}
                        </span>
                      </div>
                      {selectedModel.usedForTraining && (
                        <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                          ⚠️ Datos usados para mejorar el producto
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Paid Tier */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">
                        PAID TIER
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Input:</span>
                        <span className="font-mono font-semibold text-blue-800">
                          {getPricingDisplay(selectedModel.paid.inputPrice)} / 1M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Output:</span>
                        <span className="font-mono font-semibold text-blue-800">
                          {getPricingDisplay(selectedModel.paid.outputPrice)} / 1M
                        </span>
                      </div>
                      {selectedModel.paid.contextCachingPrice && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Caching:</span>
                          <span className="font-mono font-semibold text-blue-800">
                            ${selectedModel.paid.contextCachingPrice.toFixed(3)} / 1M
                          </span>
                        </div>
                      )}
                      {selectedModel.paid.groundingPrice && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Grounding:</span>
                          <span className="font-mono font-semibold text-blue-800">
                            ${selectedModel.paid.groundingPrice} / 1K req
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2">
                        ✓ Datos NO usados para entrenamiento
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3">Capacidades</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${selectedModel.capabilities.supportsContextCaching ? 'text-green-600' : 'text-slate-300'}`} />
                    <span className={selectedModel.capabilities.supportsContextCaching ? 'text-slate-700' : 'text-slate-400'}>
                      Context Caching
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${selectedModel.capabilities.supportsGrounding ? 'text-green-600' : 'text-slate-300'}`} />
                    <span className={selectedModel.capabilities.supportsGrounding ? 'text-slate-700' : 'text-slate-400'}>
                      Grounding
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${selectedModel.capabilities.supportsBatch ? 'text-green-600' : 'text-slate-300'}`} />
                    <span className={selectedModel.capabilities.supportsBatch ? 'text-slate-700' : 'text-slate-400'}>
                      Batch API
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${selectedModel.capabilities.supportsThinking ? 'text-green-600' : 'text-slate-300'}`} />
                    <span className={selectedModel.capabilities.supportsThinking ? 'text-slate-700' : 'text-slate-400'}>
                      Thinking Mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Specs */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3">Especificaciones Técnicas</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ventana de Contexto:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedModel.capabilities.contextWindow.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Max Output Tokens:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedModel.capabilities.maxTokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Última Actualización:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedModel.lastUpdated.toLocaleDateString('es')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Example */}
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3">Ejemplo de Costo</h4>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-slate-700 mb-3">
                    Para una conversación típica con:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">• 1,000 tokens de entrada</span>
                      <span className="font-mono text-slate-800">
                        ${((1000 / 1000000) * (typeof selectedModel.paid.inputPrice === 'number' ? selectedModel.paid.inputPrice : selectedModel.paid.inputPrice.base)).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">• 500 tokens de salida</span>
                      <span className="font-mono text-slate-800">
                        ${((500 / 1000000) * (typeof selectedModel.paid.outputPrice === 'number' ? selectedModel.paid.outputPrice : selectedModel.paid.outputPrice.base)).toFixed(4)}
                      </span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-semibold">
                      <span className="text-slate-700">Costo Total:</span>
                      <span className="font-mono text-blue-800">
                        ${(
                          ((1000 / 1000000) * (typeof selectedModel.paid.inputPrice === 'number' ? selectedModel.paid.inputPrice : selectedModel.paid.inputPrice.base)) +
                          ((500 / 1000000) * (typeof selectedModel.paid.outputPrice === 'number' ? selectedModel.paid.outputPrice : selectedModel.paid.outputPrice.base))
                        ).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedModel(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

