import React, { useState, useRef } from 'react';
import { Upload, Sparkles, FileText, Loader2, Check, X, AlertCircle, Download } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface AgentPromptEnhancerProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  currentPrompt: string;
  onPromptSuggested: (enhancedPrompt: string, documentUrl: string) => void;
}

interface ExtractionProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'complete';
  message: string;
  percentage: number;
  details?: string; // ✅ NEW: Detailed progress info for tooltip
}

export default function AgentPromptEnhancer({
  isOpen,
  onClose,
  agentId,
  agentName,
  currentPrompt,
  onPromptSuggested,
}: AgentPromptEnhancerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [suggestedPrompt, setSuggestedPrompt] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false); // ✅ NEW: Track applying state
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Formato no válido. Solo se aceptan archivos PDF, DOC, o DOCX.');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError('Archivo demasiado grande. Máximo 50MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Upload with very granular progress (0-35%)
      setProgress({
        stage: 'uploading',
        message: 'Preparando archivo...',
        percentage: 2,
        details: `Validando ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Create granular upload progress
      let uploadPercentage = 2;
      const uploadInterval = setInterval(() => {
        uploadPercentage = Math.min(uploadPercentage + 1, 30);
        setProgress(prev => {
          if (!prev || prev.stage !== 'uploading') return prev;
          const messages = [
            { max: 5, msg: 'Preparando archivo...', detail: 'Validando formato y tamaño' },
            { max: 10, msg: 'Iniciando subida...', detail: 'Conectando con Cloud Storage' },
            { max: 15, msg: 'Subiendo archivo...', detail: `Transferido ${Math.floor(uploadPercentage * 3.33)}%` },
            { max: 22, msg: 'Subiendo archivo...', detail: `Transferido ${Math.floor(uploadPercentage * 3.33)}%` },
            { max: 28, msg: 'Verificando integridad...', detail: 'Confirmando archivo en servidor' },
            { max: 35, msg: 'Archivo subido', detail: 'Preparando para extracción' },
          ];
          
          const current = messages.find(m => uploadPercentage <= m.max) || messages[messages.length - 1];
          
          return {
            ...prev,
            percentage: uploadPercentage,
            message: current.msg,
            details: current.detail,
          };
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', agentId);
      formData.append('purpose', 'prompt-enhancement');

      console.log('📤 [FRONTEND] Uploading file:', file.name);
      console.log('📤 [FRONTEND] Agent ID:', agentId);
      console.log('📤 [FRONTEND] File size:', file.size, 'bytes');

      const uploadResponse = await fetch('/api/agents/upload-setup-document', {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Error al subir el documento: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      setDocumentUrl(uploadData.documentUrl);

      // Step 2: Extraction with granular progress (35-55%)
      let extractPercentage = 35;
      const extractInterval = setInterval(() => {
        extractPercentage = Math.min(extractPercentage + 1, 54);
        setProgress(prev => {
          if (!prev || prev.stage !== 'extracting') return prev;
          const details = [
            { max: 38, detail: 'Convirtiendo documento a formato procesable' },
            { max: 42, detail: 'Extrayendo texto de páginas (1-5)' },
            { max: 46, detail: 'Extrayendo texto de páginas (5-10)' },
            { max: 50, detail: 'Procesando tablas y estructura' },
            { max: 55, detail: 'Finalizando extracción completa' },
          ];
          const current = details.find(d => extractPercentage <= d.max) || details[details.length - 1];
          return {
            stage: 'extracting',
            message: 'Extrayendo contenido completo del documento...',
            percentage: extractPercentage,
            details: current.detail,
          };
        });
      }, 400);

      setProgress({
        stage: 'extracting',
        message: 'Extrayendo contenido completo del documento...',
        percentage: 35,
        details: 'Iniciando extracción con Gemini AI',
      });

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular extracción
      clearInterval(extractInterval);

      setExtractedContent(uploadData.extractedContent);

      setProgress({
        stage: 'extracting',
        message: 'Contenido extraído exitosamente',
        percentage: 55,
        details: `${uploadData.extractedContent.length.toLocaleString()} caracteres extraídos`,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Analysis with granular progress (55-75%)
      let analyzePercentage = 55;
      const analysisInterval = setInterval(() => {
        analyzePercentage = Math.min(analyzePercentage + 1, 74);
        setProgress(prev => {
          if (!prev || prev.stage !== 'analyzing') return prev;
          const details = [
            { max: 58, detail: 'Identificando secciones clave del documento' },
            { max: 62, detail: 'Analizando objetivos y audiencia del agente' },
            { max: 66, detail: 'Extrayendo ejemplos de preguntas y respuestas' },
            { max: 70, detail: 'Identificando tono y estilo requerido' },
            { max: 75, detail: 'Detectando restricciones y limitaciones' },
          ];
          const current = details.find(d => analyzePercentage <= d.max) || details[details.length - 1];
          return {
            ...prev,
            percentage: analyzePercentage,
            details: current.detail,
          };
        });
      }, 350);

      setProgress({
        stage: 'analyzing',
        message: 'Analizando contenido y estructura del documento...',
        percentage: 55,
        details: 'Preparando análisis inteligente',
      });

      const enhanceResponse = await fetch('/api/agents/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          agentName,
          currentPrompt,
          extractedContent: uploadData.extractedContent,
        }),
      });

      clearInterval(analysisInterval);

      if (!enhanceResponse.ok) {
        throw new Error('Error al generar prompt mejorado');
      }

      const enhanceData = await enhanceResponse.json();

      // Step 4: Generation with granular progress (75-98%)
      let generatePercentage = 75;
      const generationInterval = setInterval(() => {
        generatePercentage = Math.min(generatePercentage + 1, 98);
        setProgress(prev => {
          if (!prev || prev.stage !== 'generating') return prev;
          const details = [
            { max: 78, detail: 'Estructurando prompt con mejores prácticas' },
            { max: 82, detail: 'Incorporando contexto y objetivos claros' },
            { max: 86, detail: 'Agregando ejemplos y casos de uso' },
            { max: 90, detail: 'Definiendo tono y estilo de respuesta' },
            { max: 94, detail: 'Añadiendo restricciones y guías' },
            { max: 98, detail: 'Optimizando estructura final' },
          ];
          const current = details.find(d => generatePercentage <= d.max) || details[details.length - 1];
          return {
            ...prev,
            percentage: generatePercentage,
            details: current.detail,
          };
        });
      }, 250);

      setProgress({
        stage: 'generating',
        message: 'Aplicando mejores prácticas de prompt engineering...',
        percentage: 75,
        details: 'Generando prompt optimizado',
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(generationInterval);

      setSuggestedPrompt(enhanceData.enhancedPrompt);

      // Final step: Complete (stop at 100%, don't continue)
      setProgress({
        stage: 'complete',
        message: '✅ Prompt mejorado generado exitosamente',
        percentage: 100,
        details: `Prompt de ${enhanceData.enhancedPrompt.length} caracteres listo`,
      });

    } catch (err: any) {
      setError(err.message || 'Error al procesar el documento');
      setProgress(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplySuggestion = async () => {
    setApplying(true);
    try {
      console.log('🔄 [ENHANCER] Applying suggested prompt...');
      console.log('📝 [ENHANCER] Prompt length:', suggestedPrompt.length);
      
      // Call the parent handler and wait for it to complete
      await onPromptSuggested(suggestedPrompt, documentUrl);
      
      console.log('✅ [ENHANCER] Prompt applied successfully');
      
      // Only close after successful save
      onClose();
    } catch (error) {
      console.error('❌ [ENHANCER] Error applying prompt:', error);
      setError('Error al guardar el prompt. Por favor, intenta de nuevo.');
    } finally {
      setApplying(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setProgress(null);
    setExtractedContent('');
    setSuggestedPrompt('');
    setDocumentUrl('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Mejorar Prompt del Agente
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
          {/* Info Banner */}
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  🎯 Mejora Automática de Prompt con IA
                </p>
                <p className="text-xs text-purple-800">
                  Sube un documento con especificaciones, objetivos, audiencia, o ejemplos de uso de este agente.
                  La IA extraerá el contenido completo y generará un <strong>prompt mejorado</strong> siguiendo
                  mejores prácticas de prompt engineering para maximizar la calidad de las respuestas.
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          {!progress && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <Check className="w-16 h-16 text-green-600" />
                    <div>
                      <p className="text-lg font-semibold text-green-800">{file.name}</p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-16 h-16 text-slate-400" />
                    <div>
                      <p className="text-lg font-semibold text-slate-700">
                        Click para subir o arrastra el archivo aquí
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        PDF, Word (.doc, .docx) - Máximo 50MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* What to include - Based on Ficha de Asistente Virtual */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  ¿Qué debe incluir el documento? (Ficha de Asistente Virtual)
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">1.</span>
                      <span><strong>Nombre del Asistente:</strong> Identidad única</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">2.</span>
                      <span><strong>Objetivo y Descripción:</strong> Propósito y alcance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">3.</span>
                      <span><strong>Encargado del Proyecto:</strong> Responsable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">4.</span>
                      <span><strong>Usuarios Piloto:</strong> Quiénes validarán</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">5.</span>
                      <span><strong>Usuarios Finales:</strong> Quiénes lo usarán</span>
                    </li>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">6.</span>
                      <span><strong>Preguntas Tipo:</strong> Ejemplos de uso</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">7.</span>
                      <span><strong>Respuestas Tipo:</strong> Nivel de detalle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">8.</span>
                      <span><strong>Documentación:</strong> Normativas, manuales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">9.</span>
                      <span><strong>Restricciones:</strong> Límites y exclusiones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">10.</span>
                      <span><strong>Tono:</strong> Formal, técnico, empático</span>
                    </li>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-300">
                  <p className="text-[10px] text-slate-500 italic">
                    💡 Tip: Usa la plantilla "Ficha de Asistente Virtual" para obtener mejores resultados.
                    El sistema reconoce automáticamente esta estructura y extrae toda la información relevante.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Error</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Display */}
          {progress && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">{progress.message}</p>
                  <span className="text-sm font-bold text-purple-600">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                {/* Real-time details */}
                {progress.details && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    {progress.stage !== 'complete' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                        <span className="italic text-slate-600">{progress.details}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="font-medium text-green-700">{progress.details}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Stage Indicator with Tooltips */}
              <div className="flex items-center justify-center gap-8">
                {['uploading', 'extracting', 'analyzing', 'generating', 'complete'].map((stage, idx) => {
                  const stageLabels = {
                    uploading: 'Subiendo',
                    extracting: 'Extrayendo',
                    analyzing: 'Analizando',
                    generating: 'Generando',
                    complete: 'Completo'
                  };
                  
                  const isActive = progress.stage === stage;
                  const isCompleted = idx < ['uploading', 'extracting', 'analyzing', 'generating', 'complete'].indexOf(progress.stage);
                  const shouldAnimate = isActive && progress.stage !== 'complete'; // ✅ Stop animation at complete
                  
                  return (
                    <div 
                      key={stage} 
                      className="relative flex flex-col items-center gap-2 group"
                      title={isActive && progress.details ? progress.details : ''}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isActive
                            ? 'border-purple-600 bg-purple-100'
                            : isCompleted
                            ? 'border-green-600 bg-green-100'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                      >
                        {shouldAnimate ? (
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        ) : progress.stage === 'complete' && stage === 'complete' ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : isCompleted ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-slate-400 text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 text-center max-w-[60px]">
                        {stageLabels[stage as keyof typeof stageLabels]}
                      </p>
                      
                      {/* Tooltip with details on hover */}
                      {isActive && progress.details && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                            {progress.details}
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Extracted Content Preview (if available) */}
              {extractedContent && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    📄 Contenido Extraído ({extractedContent.length.toLocaleString()} caracteres)
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                      {extractedContent.substring(0, 500)}
                      {extractedContent.length > 500 && '\n\n... (continúa)'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggested Prompt Display */}
          {suggestedPrompt && progress?.stage === 'complete' && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">
                    ✨ Prompt Mejorado Generado
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Se ha analizado el documento y generado un prompt optimizado usando mejores
                    prácticas de prompt engineering. Revisa la sugerencia y aplícala si te parece adecuada.
                  </p>
                </div>
              </div>

              {/* Current vs Suggested Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Prompt */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    Prompt Actual
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">
                    {currentPrompt.length} caracteres
                  </p>
                  <div className="max-h-60 overflow-y-auto bg-slate-50 p-3 rounded text-xs text-slate-700">
                    <pre className="whitespace-pre-wrap font-mono">
                      {currentPrompt || '(Sin prompt personalizado)'}
                    </pre>
                  </div>
                </div>

                {/* Suggested Prompt */}
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  <h3 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Prompt Mejorado Sugerido
                  </h3>
                  <p className="text-xs text-purple-600 mb-2 flex items-center justify-between">
                    <span>{suggestedPrompt.length} caracteres</span>
                    <span className="font-bold">
                      {suggestedPrompt.length > currentPrompt.length 
                        ? `+${suggestedPrompt.length - currentPrompt.length}` 
                        : `${suggestedPrompt.length - currentPrompt.length}`} chars
                    </span>
                  </p>
                  <div className="max-h-60 overflow-y-auto bg-white p-3 rounded text-xs text-slate-700 border border-purple-200">
                    <pre className="whitespace-pre-wrap font-mono">
                      {suggestedPrompt}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Document Reference */}
              {documentUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Documento de Referencia Guardado
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-700">{file?.name}</p>
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Descargar
                    </a>
                  </div>
                </div>
              )}

              {/* What Changed */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  📝 Mejoras Aplicadas
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>✓ Propósito y objetivos clarificados</li>
                  <li>✓ Audiencia y contexto de uso especificados</li>
                  <li>✓ Tono y estilo definidos</li>
                  <li>✓ Formato de respuesta estructurado</li>
                  <li>✓ Restricciones y límites documentados</li>
                  <li>✓ Ejemplos de uso integrados</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>

          {!suggestedPrompt && (
            <button
              onClick={handleProcessDocument}
              disabled={!file || processing}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generar Prompt Mejorado
                </>
              )}
            </button>
          )}

          {suggestedPrompt && (
            <button
              onClick={handleApplySuggestion}
              disabled={applying}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aplicar Prompt Mejorado
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

