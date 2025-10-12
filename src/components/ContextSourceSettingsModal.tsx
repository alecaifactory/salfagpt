import { useState, useEffect } from 'react';
import { X, RefreshCw, FileText, Clock, HardDrive, Zap, Info, Settings } from 'lucide-react';
import type { ContextSource, WorkflowConfig } from '../types/context';

interface ContextSourceSettingsModalProps {
  source: ContextSource;
  isOpen: boolean;
  onClose: () => void;
  onReExtract: (sourceId: string, newConfig: WorkflowConfig) => Promise<void>;
}

export default function ContextSourceSettingsModal({
  source,
  isOpen,
  onClose,
  onReExtract,
}: ContextSourceSettingsModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>(source.metadata?.extractionConfig || {});
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [showModelTooltip, setShowModelTooltip] = useState(false);

  useEffect(() => {
    if (source.metadata?.extractionConfig) {
      setConfig(source.metadata.extractionConfig);
    }
  }, [source]);

  if (!isOpen) return null;

  const handleReExtract = async () => {
    setIsReExtracting(true);
    try {
      await onReExtract(source.id, config);
      onClose();
    } catch (error) {
      console.error('Error re-extracting:', error);
    } finally {
      setIsReExtracting(false);
    }
  };

  const getSourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pdf': 'PDF',
      'csv': 'CSV',
      'excel': 'Excel',
      'word': 'Word',
      'folder': 'Carpeta',
      'web-url': 'URL Web',
      'api': 'API',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-ES');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Configuración de Extracción</h2>
                <p className="text-blue-100 mt-1">{source.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Original Source Info */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Fuente Original
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nombre del Archivo</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.originalFileName || source.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tipo de Fuente</p>
                  <p className="text-sm font-medium text-slate-800">
                    {getSourceTypeLabel(source.type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tamaño del Archivo</p>
                  <p className="text-sm font-medium text-slate-800">
                    {formatFileSize(source.metadata?.originalFileSize)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Agregado</p>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(source.addedAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Extraction Details */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Detalles de Extracción
            </h3>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Workflow Usado</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.workflowName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Modelo de IA</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.modelUsed || config.model || 'gemini-2.5-flash'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fecha de Extracción</p>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(source.metadata?.extractionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tiempo de Procesamiento</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.extractionTime 
                      ? `${(source.metadata.extractionTime / 1000).toFixed(2)}s`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Caracteres Extraídos</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.charactersExtracted?.toLocaleString() || 
                     source.extractedData?.length.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tokens Estimados</p>
                  <p className="text-sm font-medium text-slate-800">
                    {source.metadata?.tokensEstimate?.toLocaleString() ||
                     (source.extractedData ? Math.ceil(source.extractedData.length / 4).toLocaleString() : 'N/A')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Current Configuration */}
          <section className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              Configuración Actual
            </h3>
            <div className="space-y-4">
              {/* Max File Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tamaño Máximo de Archivo (MB)
                </label>
                <input
                  type="number"
                  value={config.maxFileSize || 50}
                  onChange={(e) => setConfig({ ...config, maxFileSize: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Max Output Length */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Longitud Máxima de Salida (tokens)
                </label>
                <input
                  type="number"
                  value={config.maxOutputLength || 10000}
                  onChange={(e) => setConfig({ ...config, maxOutputLength: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* AI Model Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Modelo de IA
                  <button
                    onMouseEnter={() => setShowModelTooltip(true)}
                    onMouseLeave={() => setShowModelTooltip(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </label>

                {showModelTooltip && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-700">
                    <p className="font-semibold mb-1">💡 Recomendación:</p>
                    <p>Flash: Rápido y económico ($0.000075/1K tokens) - Ideal para la mayoría de documentos</p>
                    <p className="mt-1">Pro: Mayor precisión ($0.00125/1K tokens) - Para documentos complejos</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfig({ ...config, model: 'gemini-2.5-flash' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      config.model === 'gemini-2.5-flash' || !config.model
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-slate-800">Flash</span>
                    </div>
                    <p className="text-xs text-slate-600">Económico y rápido</p>
                  </button>

                  <button
                    onClick={() => setConfig({ ...config, model: 'gemini-2.5-pro' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      config.model === 'gemini-2.5-pro'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-slate-800">Pro</span>
                    </div>
                    <p className="text-xs text-slate-600">Mayor precisión</p>
                  </button>
                </div>
              </div>

              {/* Info about automatic extraction */}
              {source.type === 'pdf' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold mb-1">✨ Extracción Inteligente Automática</p>
                      <p>
                        Gemini AI extrae automáticamente <strong>todo el contenido</strong> del PDF:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                        <li>Texto completo con formato preservado</li>
                        <li>Tablas en formato de texto estructurado</li>
                        <li>Imágenes descritas en texto detallado (ASCII art cuando sea relevante)</li>
                      </ul>
                      <p className="mt-2 text-xs text-slate-600">
                        No necesitas configurar opciones adicionales. El modelo se encarga de todo.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Re-extraction Notice */}
          {source.originalFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">💡 Re-extracción disponible</p>
                <p>
                  Puedes volver a procesar este documento con una configuración diferente.
                  El archivo original se conservó para permitir re-procesamiento.
                </p>
              </div>
            </div>
          )}

          {!source.originalFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">⚠️ Archivo original no disponible</p>
                <p>
                  El archivo original no está guardado. Para re-procesar, deberás subir el archivo nuevamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>

          {source.originalFile && (
            <button
              onClick={handleReExtract}
              disabled={isReExtracting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              {isReExtracting ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Re-extraer con Nueva Configuración
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

