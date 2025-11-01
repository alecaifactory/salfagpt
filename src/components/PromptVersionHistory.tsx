import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, FileText, Check, Loader2 } from 'lucide-react';

interface PromptVersion {
  id: string;
  agentId: string;
  userId: string;
  prompt: string;
  model: string;
  createdAt: string;
  versionNumber: number;
  changeType: 'manual_update' | 'before_revert' | 'ai_enhanced';
}

interface PromptVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  currentPrompt: string;
  userId: string;
  onRevert: (prompt: string, versionNumber: number) => void;
}

export default function PromptVersionHistory({
  isOpen,
  onClose,
  agentId,
  agentName,
  currentPrompt,
  userId,
  onRevert,
}: PromptVersionHistoryProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, agentId]);

  const loadVersions = async () => {
    setLoading(true);
    console.log('📚 [HISTORY] Loading versions for agent:', agentId, 'user:', userId);
    try {
      // 🔒 PRIVACY: Pass userId to filter versions
      const url = `/api/agents/${agentId}/prompt-versions?userId=${userId}`;
      console.log('📥 [HISTORY] Fetching:', url);
      
      const response = await fetch(url);
      console.log('📥 [HISTORY] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 [HISTORY] Response data:', data);
        setVersions(data.versions || []);
        console.log('📚 [HISTORY] Loaded', data.versions?.length || 0, 'versions');
      } else {
        const errorData = await response.json();
        console.error('❌ [HISTORY] Error response:', errorData);
      }
    } catch (error) {
      console.error('❌ [HISTORY] Exception loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (versionId: string, prompt: string, versionNumber: number) => {
    if (!confirm(`¿Revertir al prompt de la versión ${versionNumber}? Esto guardará una copia del prompt actual antes de revertir.`)) {
      return;
    }

    setReverting(versionId);
    try {
      const response = await fetch(`/api/agents/${agentId}/prompt-versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revert version');
      }

      const data = await response.json();
      onRevert(data.agentPrompt, data.promptVersion);
      await loadVersions(); // Reload versions
      alert('✅ Prompt revertido exitosamente');
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Error al revertir la versión');
    } finally {
      setReverting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es');
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'initial_version': return '🎯 Versión inicial';
      case 'manual_update': return '✏️ Actualización manual';
      case 'before_revert': return '↩️ Antes de revertir';
      case 'ai_enhanced': return '✨ Mejorado con IA';
      default: return '📝 Cambio';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Historial de Versiones del Prompt
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {agentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Cargando historial...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No hay versiones anteriores</p>
              <p className="text-xs text-slate-500 mt-2">
                El historial comenzará a guardarse con la próxima actualización
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current Version */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 text-sm">Versión Actual</p>
                      <p className="text-xs text-blue-700">En uso ahora</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    ACTUAL
                  </span>
                </div>
                <div className="bg-white rounded p-3 border border-blue-200">
                  <p className="text-xs text-slate-500 mb-1">{currentPrompt.length} caracteres</p>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                    {currentPrompt}
                  </pre>
                </div>
              </div>

              {/* Previous Versions */}
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="font-bold text-slate-600">v{version.versionNumber}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          Versión {version.versionNumber}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(version.createdAt)}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{getChangeTypeLabel(version.changeType)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedVersion?.id === version.id ? (
                        <button
                          onClick={() => setSelectedVersion(null)}
                          className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                        >
                          Ocultar
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedVersion(version)}
                          className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Ver Detalles
                        </button>
                      )}
                      <button
                        onClick={() => handleRevert(version.id, version.prompt, version.versionNumber)}
                        disabled={reverting !== null}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-300 flex items-center gap-1"
                      >
                        {reverting === version.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Revirtiendo...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Revertir
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Version Details (expandable) */}
                  {selectedVersion?.id === version.id && (
                    <div className="mt-3 bg-slate-50 rounded p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-700">Contenido del Prompt</p>
                        <span className="text-xs text-slate-500">{version.prompt.length} caracteres</span>
                      </div>
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto bg-white p-3 rounded border border-slate-200">
                        {version.prompt}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <p>💡 Cada vez que actualizas el prompt, se guarda la versión anterior</p>
            <p>Puedes revertir a cualquier versión con un click</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

