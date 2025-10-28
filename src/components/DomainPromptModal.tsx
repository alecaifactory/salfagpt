import React, { useState, useEffect } from 'react';
import { X, Save, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface DomainPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  currentDomainPrompt?: string;
  onSave: (domainPrompt: string) => Promise<void>;
}

export default function DomainPromptModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  currentDomainPrompt = '',
  onSave,
}: DomainPromptModalProps) {
  const [domainPrompt, setDomainPrompt] = useState(currentDomainPrompt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  useEffect(() => {
    if (isOpen) {
      setDomainPrompt(currentDomainPrompt);
      setError(null);
    }
  }, [isOpen, currentDomainPrompt]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(domainPrompt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el prompt de dominio');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Configuración de Dominio
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {organizationName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID: {organizationId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  ¿Qué es el Prompt de Dominio?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  El prompt de dominio define el contexto, políticas y comportamiento compartido por 
                  <strong> todos los agentes de tu organización</strong>. Se combina automáticamente con 
                  los prompts específicos de cada agente.
                </p>
              </div>
            </div>
          </div>

          {/* Hierarchy Visualization */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
              Jerarquía de Prompts:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded p-2">
                  <span className="font-medium text-blue-700 dark:text-blue-400">Prompt de Dominio</span>
                  <span className="text-xs text-slate-500 ml-2">(Nivel Organización)</span>
                </div>
              </div>
              <div className="ml-4 w-0.5 h-4 bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded p-2">
                  <span className="font-medium text-green-700 dark:text-green-400">Prompt del Agente</span>
                  <span className="text-xs text-slate-500 ml-2">(Específico de cada agente)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Prompt Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Prompt de Dominio
            </label>
            <textarea
              value={domainPrompt}
              onChange={(e) => setDomainPrompt(e.target.value)}
              placeholder="Ejemplo:&#10;&#10;Somos [Nombre de Organización], una empresa de [sector].&#10;&#10;Valores corporativos:&#10;- Excelencia en el servicio&#10;- Transparencia&#10;- Innovación&#10;&#10;Políticas importantes:&#10;- Siempre confirmar disponibilidad antes de comprometer fechas&#10;- Escalar a supervisor si el monto > $10,000&#10;- Usar lenguaje profesional pero cercano"
              className="w-full h-80 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {domainPrompt.length} caracteres • Este prompt se aplicará a todos los agentes de la organización
            </p>
          </div>

          {/* Examples */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
              💡 Sugerencias para el Prompt de Dominio:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Define quién es la organización y qué hace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Especifica valores corporativos y tono de comunicación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Incluye políticas importantes que TODOS los agentes deben seguir</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Menciona limitaciones o restricciones generales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Define el formato de respuesta preferido (opcional)</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Prompt de Dominio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

