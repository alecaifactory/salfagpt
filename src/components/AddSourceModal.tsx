import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Code, Upload, ChevronRight, Sparkles, Info } from 'lucide-react';
import type { SourceType } from '../types/context';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (type: SourceType, file?: File, url?: string, config?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro', apiEndpoint?: string }) => Promise<void>;
  preSelectedType?: SourceType; // Optional: pre-select source type and skip to configure step
}

type StepType = 'select-type' | 'configure' | 'processing';

export default function AddSourceModal({ isOpen, onClose, onAddSource, preSelectedType }: AddSourceModalProps) {
  const [currentStep, setCurrentStep] = useState<StepType>(preSelectedType ? 'configure' : 'select-type');
  const [selectedType, setSelectedType] = useState<SourceType | null>(preSelectedType || null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-2.5-pro'>('gemini-2.5-flash');
  const [showModelTooltip, setShowModelTooltip] = useState(false);

  // Reset state when modal opens or preSelectedType changes
  useEffect(() => {
    if (isOpen) {
      if (preSelectedType) {
        setSelectedType(preSelectedType);
        setCurrentStep('configure');
      } else {
        setSelectedType(null);
        setCurrentStep('select-type');
      }
      setFile(null);
      setUrl('');
      setApiEndpoint('');
      setIsProcessing(false);
      setSelectedModel('gemini-2.5-flash');
    }
  }, [isOpen, preSelectedType]);

  if (!isOpen) return null;

  const sourceTypes = [
    {
      type: 'pdf' as SourceType,
      icon: <FileText className="w-6 h-6" />,
      title: 'Archivo',
      description: 'Sube un documento, hoja de cálculo, etc.',
      accepts: '.pdf,.doc,.docx,.csv,.xlsx,.xls',
    },
    {
      type: 'web-url' as SourceType,
      icon: <LinkIcon className="w-6 h-6" />,
      title: 'URL Web',
      description: 'Link a un sitio web o artículo público.',
    },
    {
      type: 'api' as SourceType,
      icon: <Code className="w-6 h-6" />,
      title: 'API',
      description: 'Conecta a una API interna o externa.',
    },
  ];

  const fileTypes = [
    { type: 'pdf' as SourceType, label: 'PDF (Auto: texto, tablas, imágenes)', icon: '📄' },
    { type: 'csv' as SourceType, label: 'CSV', icon: '📈' },
    { type: 'excel' as SourceType, label: 'Excel', icon: '📊' },
    { type: 'word' as SourceType, label: 'Word', icon: '📝' },
    { type: 'folder' as SourceType, label: 'Carpeta', icon: '📁' },
  ];

  const handleTypeSelect = (type: SourceType) => {
    setSelectedType(type);
    if (type === 'pdf') {
      // For file uploads, go to file type selection
      setCurrentStep('configure');
    } else {
      setCurrentStep('configure');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      const config = { model: selectedModel };
      
      if (selectedType === 'web-url') {
        await onAddSource(selectedType, undefined, url, config);
      } else if (selectedType === 'api') {
        await onAddSource(selectedType, undefined, undefined, { ...config, apiEndpoint });
      } else {
        // Use real file if available, otherwise create a mock file for testing
        const fileToUse = file || new File(
          ["Contenido de prueba del documento"], 
          `documento-prueba-${Date.now()}.pdf`, 
          { type: "application/pdf" }
        );
        await onAddSource(selectedType, fileToUse, undefined, config);
      }
      
      // Reset and close
      handleClose();
    } catch (error) {
      console.error('Error adding source:', error);
      setIsProcessing(false);
      setCurrentStep('configure');
    }
  };

  const handleClose = () => {
    setCurrentStep('select-type');
    setSelectedType(null);
    setFile(null);
    setUrl('');
    setApiEndpoint('');
    setIsProcessing(false);
    setSelectedModel('gemini-2.5-flash');
    setShowModelTooltip(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Agregar Fuente de Contexto</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'select-type' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'configure' || currentStep === 'processing' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'processing' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'select-type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                ¿Qué tipo de fuente quieres agregar?
              </h3>
              
              {sourceTypes.map((source) => (
                <button
                  key={source.type}
                  onClick={() => handleTypeSelect(source.type)}
                  className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex-shrink-0 text-slate-600 group-hover:text-blue-600 transition-colors">
                    {source.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-slate-800">{source.title}</h4>
                    <p className="text-sm text-slate-600">{source.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {currentStep === 'configure' && selectedType === 'pdf' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Subir Documento
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  El modelo extraerá automáticamente texto, tablas e imágenes (como descripciones de texto).
                </p>
                
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Selecciona un archivo
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.csv,.xlsx,.xls"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Haz clic para seleccionar o arrastra aquí
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          PDF, Word, Excel, CSV (máx. 100 MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Modelo de IA para Extracción
                  </label>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowModelTooltip(true)}
                      onMouseLeave={() => setShowModelTooltip(false)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {showModelTooltip && (
                      <div className="absolute left-6 top-0 w-80 bg-slate-900 text-white text-xs rounded-lg p-3 z-50 shadow-xl">
                        <p className="font-semibold mb-2">💡 Recomendación</p>
                        <p className="mb-2">Comienza con <strong>Flash</strong> para validar tu caso de uso:</p>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li><strong>94% más económico</strong> ($0.001875 vs $0.03125 por 1M tokens)</li>
                          <li>Ideal para documentos simples</li>
                          <li>Respuesta 2x más rápida</li>
                        </ul>
                        <p className="mt-2 text-blue-300">Usa <strong>Pro</strong> cuando necesites:</p>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li>Mayor precisión en documentos complejos</li>
                          <li>Análisis de contexto profundo</li>
                        </ul>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-slate-300">💸 Ahorro típico: <span className="text-green-400 font-semibold">$28 USD</span> por cada millón de tokens con Flash</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedModel('gemini-2.5-flash')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedModel === 'gemini-2.5-flash'
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-5 h-5 ${selectedModel === 'gemini-2.5-flash' ? 'text-green-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-800">Flash</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Rápido y económico</p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Ahorra 94% 💰
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedModel('gemini-2.5-pro')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedModel === 'gemini-2.5-pro'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className={`w-5 h-5 ${selectedModel === 'gemini-2.5-pro' ? 'text-purple-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-800">Pro</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Avanzado
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Mayor precisión</p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      Documentos complejos
                    </p>
                  </button>
                </div>

                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium">Próximamente: Sistema de Evaluación de Expertos</p>
                      <p className="mt-1 text-blue-700">
                        Los expertos podrán evaluar la calidad de las extracciones, comparar modelos A/B, 
                        y proporcionar feedback automático sobre qué modelo usar según el caso de uso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'configure' && selectedType === 'web-url' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Ingresa la URL
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL del sitio web
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ejemplo.com/articulo"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 'configure' && selectedType === 'api' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Configura la API
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endpoint de la API
                </label>
                <input
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.ejemplo.com/endpoint"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Procesando fuente...
              </h3>
              <p className="text-sm text-slate-600">
                Esto puede tomar unos momentos
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'processing' && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={currentStep === 'select-type' ? handleClose : () => setCurrentStep('select-type')}
              className="px-6 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              {currentStep === 'select-type' ? 'Cancelar' : 'Atrás'}
            </button>
            
            {currentStep === 'configure' && (
              <button
                onClick={handleSubmit}
                disabled={
                  (selectedType === 'web-url' && !url) ||
                  (selectedType === 'api' && !apiEndpoint) ||
                  (selectedType !== 'web-url' && selectedType !== 'api' && !file)
                }
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar Fuente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

