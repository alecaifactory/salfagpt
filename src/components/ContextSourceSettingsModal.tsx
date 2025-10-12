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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold">Configuración de Extracción</h2>
              <p className="text-xs text-blue-100">{source.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Compact 2-Column Layout */}
        <div className="p-4 flex-1 grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Original Source Info - Compact */}
            <section className="bg-slate-50 rounded-lg p-3">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Fuente Original
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Archivo:</span>
                  <span className="font-medium text-slate-800 truncate ml-2">
                    {source.metadata?.originalFileName || source.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo:</span>
                  <span className="font-medium text-slate-800">{getSourceTypeLabel(source.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamaño:</span>
                  <span className="font-medium text-slate-800">{formatFileSize(source.metadata?.originalFileSize)}</span>
                </div>
              </div>
            </section>

            {/* Extraction Details - Compact */}
            <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-600" />
                Extracción
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Modelo:</span>
                  <span className="font-medium text-slate-800">
                    {source.metadata?.modelUsed || config.model || 'gemini-2.5-flash'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiempo:</span>
                  <span className="font-medium text-slate-800">
                    {source.metadata?.extractionTime 
                      ? `${(source.metadata.extractionTime / 1000).toFixed(2)}s`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Caracteres:</span>
                  <span className="font-medium text-slate-800">
                    {source.metadata?.charactersExtracted?.toLocaleString() || 
                     source.extractedData?.length.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tokens:</span>
                  <span className="font-medium text-slate-800">
                    {source.metadata?.tokensEstimate?.toLocaleString() ||
                     (source.extractedData ? Math.ceil(source.extractedData.length / 4).toLocaleString() : 'N/A')}
                  </span>
                </div>
              </div>
            </section>

            {/* Info about automatic extraction - Compact */}
            {source.type === 'pdf' && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700">
                    <p className="font-semibold mb-1">✨ Extracción Automática</p>
                    <p className="text-[10px] leading-tight">
                      Gemini extrae texto, tablas e imágenes descritas automáticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Current Configuration - Compact */}
            <section className="bg-white border border-slate-200 rounded-lg p-3">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-green-600" />
                Configuración
              </h3>
              <div className="space-y-2.5">
                {/* Max File Size - Compact */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tamaño Max (MB)
                  </label>
                  <input
                    type="number"
                    value={config.maxFileSize || 50}
                    onChange={(e) => setConfig({ ...config, maxFileSize: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Max Output Length - Compact */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Longitud Max (tokens)
                  </label>
                  <input
                    type="number"
                    value={config.maxOutputLength || 10000}
                    onChange={(e) => setConfig({ ...config, maxOutputLength: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* AI Model Selection - Compact */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    Modelo de IA
                    <button
                      onMouseEnter={() => setShowModelTooltip(true)}
                      onMouseLeave={() => setShowModelTooltip(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </label>

                  {showModelTooltip && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-slate-700 leading-tight">
                      <p className="font-semibold">💡 Flash: $0.000075/1K | Pro: $0.00125/1K</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-2.5-flash' })}
                      className={`p-2 rounded-lg border transition-all ${
                        config.model === 'gemini-2.5-flash' || !config.model
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 justify-center">
                        <Zap className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-semibold text-slate-800">Flash</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-2.5-pro' })}
                      className={`p-2 rounded-lg border transition-all ${
                        config.model === 'gemini-2.5-pro'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 justify-center">
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-semibold text-slate-800">Pro</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Re-extraction Notice - Compact */}
            {source.originalFile ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold mb-0.5">💡 Re-extracción disponible</p>
                  <p className="text-[10px] leading-tight">
                    Archivo guardado. Puedes re-procesar con nueva configuración.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold mb-0.5">⚠️ Archivo no guardado</p>
                  <p className="text-[10px] leading-tight">
                    Necesitarás subir el archivo nuevamente para re-procesar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200 rounded transition-colors font-medium"
          >
            Cerrar
          </button>

          {source.originalFile && (
            <button
              onClick={handleReExtract}
              disabled={isReExtracting}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 font-medium"
            >
              {isReExtracting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Re-extraer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

