import { useState, useEffect } from 'react';
import { X, RefreshCw, FileText, Clock, HardDrive, Zap, Info, Settings, CheckCircle, AlertCircle, User } from 'lucide-react';
import type { ContextSource, WorkflowConfig } from '../types/context';

interface ContextSourceSettingsModalProps {
  source: ContextSource | null;
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
  const [config, setConfig] = useState<WorkflowConfig>({});
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [showModelTooltip, setShowModelTooltip] = useState(false);

  useEffect(() => {
    if (source?.metadata?.extractionConfig) {
      setConfig(source.metadata.extractionConfig);
    }
  }, [source]);

  if (!isOpen || !source) return null;

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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Error Alert - Prominent if status is error */}
        {source.status === 'error' && source.error && (
          <div className="mx-4 mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-800 mb-2">
                  ❌ Error al Procesar el Documento
                </h3>
                <div className="bg-white rounded-lg p-3 border border-red-200 mb-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">Mensaje de error:</p>
                  <p className="text-sm text-red-600">{source.error.message}</p>
                  {source.error.details && (
                    <>
                      <p className="text-sm font-semibold text-red-700 mt-2 mb-1">Detalles técnicos:</p>
                      <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                        {source.error.details}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-slate-600 mt-2">
                    <strong>Timestamp:</strong> {source.error.timestamp ? formatDate(source.error.timestamp) : 'N/A'}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">💡 Posibles soluciones:</p>
                  {source.error?.suggestions && source.error.suggestions.length > 0 ? (
                    <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc">
                      {source.error.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc">
                      <li>Verifica que el archivo no esté corrupto</li>
                      <li>Intenta con un modelo diferente (Flash → Pro o viceversa)</li>
                      <li>Asegúrate de que el archivo sea del tipo correcto ({getSourceTypeLabel(source.type)})</li>
                      <li>Si el archivo es muy grande, intenta con uno más pequeño</li>
                      <li>Revisa que tengas conexión a internet y acceso a Gemini AI</li>
                    </ul>
                  )}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Acción sugerida:</strong> Cambia la configuración abajo y haz click en "Re-extraer" para intentar nuevamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content - Compact 2-Column Layout */}
        <div className="p-4 flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
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

            {/* Validation Status - New Section */}
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                {source.metadata?.validated ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                Estado de Validación
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estado:</span>
                  {source.metadata?.validated ? (
                    <span className="px-2 py-0.5 bg-green-600 text-white rounded-full text-[10px] font-semibold">
                      ✓ Validado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500 text-white rounded-full text-[10px] font-semibold">
                      ⏳ Pendiente
                    </span>
                  )}
                </div>
                
                {source.metadata?.validated && source.metadata?.validatedBy && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validado por:</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {source.metadata.validatedBy}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fecha:</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(source.metadata.validatedAt)}
                      </span>
                    </div>
                  </>
                )}

                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-[10px] text-slate-600 mb-1">
                    <strong>Permisos para validar:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['admin', 'context_signoff', 'context_owner', 'context_reviewer'].map(role => (
                      <span 
                        key={role}
                        className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {!source.metadata?.validated && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-[10px] text-yellow-800">
                      <strong>ℹ️ Nota:</strong> Este contexto debe ser validado por un experto del dominio antes de ser considerado oficial.
                    </p>
                  </div>
                )}
              </div>
            </section>
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

