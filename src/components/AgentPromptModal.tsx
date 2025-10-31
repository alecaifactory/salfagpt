import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, AlertCircle, Lightbulb, Copy, Check, Clock } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';
import { 
  PROMPT_TEMPLATES, 
  CATEGORY_LABELS, 
  getTemplatesByCategory,
  getPromptCategories,
  type PromptTemplate 
} from '../lib/promptTemplates';

interface AgentPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  currentAgentPrompt?: string;
  domainPrompt?: string; // To show hierarchy
  userId?: string; // For version history
  onSave: (agentPrompt: string) => Promise<void>;
  onOpenEnhancer?: () => void; // ✅ NEW: Open AI enhancer modal
  onOpenVersionHistory?: () => void; // ✅ NEW: Open version history modal
}

export default function AgentPromptModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  currentAgentPrompt = '',
  domainPrompt,
  userId,
  onSave,
  onOpenEnhancer,
  onOpenVersionHistory,
}: AgentPromptModalProps) {
  const [agentPrompt, setAgentPrompt] = useState(currentAgentPrompt);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  useEffect(() => {
    if (isOpen) {
      setAgentPrompt(currentAgentPrompt);
      setSelectedTemplate(null);
      setShowTemplates(false);
      setError(null);
    }
  }, [isOpen, currentAgentPrompt]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(agentPrompt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el prompt del agente');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setAgentPrompt(template.agentPrompt);
    setShowTemplates(false);
  };

  const handleCopyFinalPrompt = () => {
    const finalPrompt = domainPrompt 
      ? `# Contexto de Dominio\n${domainPrompt}\n\n# Instrucciones del Agente\n${agentPrompt}`
      : agentPrompt;
    
    navigator.clipboard.writeText(finalPrompt);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  if (!isOpen) return null;

  const categories = getPromptCategories();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-700 dark:to-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              Configuración del Agente
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {agentName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID: {agentId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
          {/* Left Column - Templates */}
          <div className="col-span-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                Plantillas Sugeridas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Selecciona una plantilla base y personalízala
              </p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {categories.map(category => {
                const templates = getTemplatesByCategory(category);
                return (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase">
                      {CATEGORY_LABELS[category] || category}
                    </p>
                    <div className="space-y-1">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{template.icon}</span>
                            <span className="text-xs font-medium text-slate-800 dark:text-white">
                              {template.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Editor & Preview */}
          <div className="col-span-2 space-y-4">
            {/* Hierarchy Info */}
            {domainPrompt && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Prompt de Dominio Activo
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 line-clamp-2">
                      {domainPrompt}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Prompt Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Prompt del Agente
              </label>
              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Define el comportamiento específico de este agente...&#10;&#10;Ejemplo:&#10;Eres un asistente especializado en [función específica].&#10;&#10;Tu objetivo es [objetivo concreto].&#10;&#10;Siempre debes:&#10;- [Comportamiento 1]&#10;- [Comportamiento 2]"
                className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-900 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {agentPrompt.length} caracteres • Específico para este agente
              </p>
            </div>

            {/* Final Combined Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Vista Previa del Prompt Final
                </label>
                <button
                  onClick={handleCopyFinalPrompt}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                  {domainPrompt && (
                    <>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold"># Contexto de Dominio</span>
                      {'\n'}
                      {domainPrompt}
                      {'\n\n'}
                    </>
                  )}
                  {agentPrompt && (
                    <>
                      <span className="text-green-600 dark:text-green-400 font-semibold"># Instrucciones del Agente</span>
                      {'\n'}
                      {agentPrompt}
                    </>
                  )}
                  {!domainPrompt && !agentPrompt && (
                    <span className="text-slate-400 dark:text-slate-500 italic">
                      (Se usará el prompt predeterminado)
                    </span>
                  )}
                </pre>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Este es el prompt completo que verá el modelo de IA
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            
            {/* ✅ NEW: AI Enhancer Button */}
            {onOpenEnhancer && (
              <button
                onClick={onOpenEnhancer}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                title="Mejorar prompt automáticamente con IA"
              >
                <Sparkles className="w-4 h-4" />
                Mejorar con IA
              </button>
            )}
            
            {/* ✅ NEW: Version History Button */}
            {onOpenVersionHistory && (
              <button
                onClick={onOpenVersionHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Ver historial de versiones del prompt"
              >
                <Clock className="w-4 h-4" />
                Ver Historial
              </button>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Prompt del Agente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

