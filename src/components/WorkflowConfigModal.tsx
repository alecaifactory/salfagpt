import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Workflow, WorkflowConfig } from '../types/context';

interface WorkflowConfigModalProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflowId: string, config: WorkflowConfig) => void;
}

export default function WorkflowConfigModal({
  workflow,
  isOpen,
  onClose,
  onSave,
}: WorkflowConfigModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>(
    workflow?.config || {
      maxFileSize: 50,
      maxOutputLength: 10000,
      extractImages: false,
      extractTables: false,
      ocrEnabled: false,
      language: 'es',
    }
  );

  if (!isOpen || !workflow) return null;

  const handleSave = () => {
    onSave(workflow.id, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configurar Workflow</h2>
            <p className="text-sm text-slate-600 mt-1">{workflow.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Max File Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tamaño Máximo de Archivo (MB)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={config.maxFileSize || 50}
              onChange={(e) =>
                setConfig({ ...config, maxFileSize: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Archivos más grandes pueden tardar más en procesarse
            </p>
          </div>

          {/* Max Output Length */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Longitud Máxima de Salida (tokens)
            </label>
            <input
              type="number"
              min="1000"
              max="100000"
              step="1000"
              value={config.maxOutputLength || 10000}
              onChange={(e) =>
                setConfig({ ...config, maxOutputLength: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Controla cuánto texto se extrae del documento
            </p>
          </div>

          {/* Extract Images (for PDF workflows) */}
          {(workflow.sourceType === 'pdf-images' || workflow.sourceType === 'pdf-text') && (
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Extraer Imágenes</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Procesar imágenes incrustadas en el PDF
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.extractImages || false}
                  onChange={(e) =>
                    setConfig({ ...config, extractImages: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Extract Tables */}
          {(workflow.sourceType === 'pdf-tables' || workflow.sourceType === 'pdf-text') && (
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Extraer Tablas</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Identificar y procesar tablas estructuradas
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.extractTables || false}
                  onChange={(e) =>
                    setConfig({ ...config, extractTables: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* OCR Enabled */}
          {workflow.sourceType === 'pdf-images' && (
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Habilitar OCR</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Reconocimiento óptico de caracteres para imágenes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.ocrEnabled || false}
                  onChange={(e) =>
                    setConfig({ ...config, ocrEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Idioma del Documento
            </label>
            <select
              value={config.language || 'es'}
              onChange={(e) => setConfig({ ...config, language: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

