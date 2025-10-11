import React, { useState } from 'react';
import { X, FileText, Link as LinkIcon, Code, Upload, ChevronRight } from 'lucide-react';
import type { SourceType } from '../types/context';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (type: SourceType, file?: File, url?: string, apiConfig?: any) => Promise<void>;
}

type StepType = 'select-type' | 'configure' | 'processing';

export default function AddSourceModal({ isOpen, onClose, onAddSource }: AddSourceModalProps) {
  const [currentStep, setCurrentStep] = useState<StepType>('select-type');
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const sourceTypes = [
    {
      type: 'pdf-text' as SourceType,
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
    { type: 'pdf-text' as SourceType, label: 'PDF con Texto', icon: '📄' },
    { type: 'pdf-images' as SourceType, label: 'PDF con Imágenes', icon: '🖼️' },
    { type: 'pdf-tables' as SourceType, label: 'PDF con Tablas', icon: '📊' },
    { type: 'csv' as SourceType, label: 'CSV', icon: '📈' },
    { type: 'excel' as SourceType, label: 'Excel', icon: '📊' },
    { type: 'word' as SourceType, label: 'Word', icon: '📝' },
    { type: 'folder' as SourceType, label: 'Carpeta', icon: '📁' },
  ];

  const handleTypeSelect = (type: SourceType) => {
    setSelectedType(type);
    if (type === 'pdf-text') {
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
      if (selectedType === 'web-url') {
        await onAddSource(selectedType, undefined, url);
      } else if (selectedType === 'api') {
        await onAddSource(selectedType, undefined, undefined, { endpoint: apiEndpoint });
      } else if (file) {
        await onAddSource(selectedType, file);
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

          {currentStep === 'configure' && selectedType === 'pdf-text' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Selecciona el tipo de archivo
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {fileTypes.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setSelectedType(type.type)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedType === type.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="text-sm font-medium text-slate-800">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subir Archivo
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

