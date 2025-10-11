import React, { useState } from 'react';
import { X, Check, FileText, Calendar, User, MessageSquare, Share2, Copy } from 'lucide-react';
import type { ContextSource } from '../types/context';
import type { SourceValidation } from '../types/sharing';

interface SourceDetailPanelProps {
  source: ContextSource;
  validation?: SourceValidation;
  onClose: () => void;
  onValidate: (sourceId: string, comments: string) => void;
  onShare: (sourceId: string) => void;
}

export default function SourceDetailPanel({
  source,
  validation,
  onClose,
  onValidate,
  onShare,
}: SourceDetailPanelProps) {
  const [comments, setComments] = useState('');
  const [showValidateForm, setShowValidateForm] = useState(false);

  const handleValidate = () => {
    if (comments.trim()) {
      onValidate(source.id, comments);
      setShowValidateForm(false);
      setComments('');
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-white flex-shrink-0" />
              <h2 className="text-lg font-bold text-white truncate">
                {source.name}
              </h2>
            </div>
            <p className="text-sm text-blue-100">
              {source.type.replace('-', ' ').toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="space-y-2">
          {source.metadata?.fileSize && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700">
                {formatFileSize(source.metadata.fileSize)}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">
              Agregado: {new Date(source.addedAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {validation?.validated && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">
                Validado por {validation.validatedBy}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Contenido Extraído
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
              {source.extractedData || 'Sin contenido extraído'}
            </pre>
          </div>
        </div>

        {/* Validation Section */}
        {validation?.validated ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Documento Validado</h4>
            </div>
            {validation.comments && (
              <div className="mt-2">
                <p className="text-xs font-medium text-green-700 mb-1">Comentarios:</p>
                <p className="text-sm text-green-800">{validation.comments}</p>
              </div>
            )}
            {validation.validatedAt && (
              <p className="text-xs text-green-600 mt-2">
                {new Date(validation.validatedAt).toLocaleString('es-ES')}
              </p>
            )}
          </div>
        ) : showValidateForm ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Validar Documento</h4>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Comentarios sobre la calidad de la extracción..."
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={4}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleValidate}
                disabled={!comments.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Validar
              </button>
              <button
                onClick={() => {
                  setShowValidateForm(false);
                  setComments('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowValidateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <Check className="w-5 h-5" />
            Validar Calidad del Documento
          </button>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => onShare(source.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
        >
          <Share2 className="w-5 h-5" />
          Compartir Documento
        </button>
      </div>
    </div>
  );
}

