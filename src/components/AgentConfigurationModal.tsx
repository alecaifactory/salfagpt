import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Eye,
  Download,
  Settings as SettingsIcon,
  Brain,
  Target,
  MessageSquare,
  Users as UsersIcon,
  XCircle,
  RefreshCw
} from 'lucide-react';
import type { AgentConfiguration, ExtractionProgress, AgentRequirementsDoc } from '../types/agent-config';
import { useModalClose } from '../hooks/useModalClose';
import { 
  detectRequiredSources,
  inferDomain,
  extractCategories,
  analyzeComplexityDistribution,
  identifyDepartments,
  migrateConfigToSimplified
} from '../lib/agent-config-helpers';

interface AgentConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string; // If editing existing agent
  agentName?: string;
  onConfigSaved: (config: AgentConfiguration) => void;
  onOpenEnhancer?: () => void; // ✅ NEW: Callback to open AgentPromptEnhancer
}

export default function AgentConfigurationModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  onConfigSaved,
  onOpenEnhancer, // ✅ NEW: Callback to open enhancer
}: AgentConfigurationModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'prompt' | 'enhance'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedConfig, setExtractedConfig] = useState<AgentConfiguration | null>(null);
  const [requirementsDoc, setRequirementsDoc] = useState<AgentRequirementsDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  
  // Prompt mode state
  const [promptInputs, setPromptInputs] = useState({
    purpose: '',
    audience: '',
    inputTypes: '',
    outputFormat: '',
    quality: '',
    undesirable: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);
  
  // Load existing configuration when modal opens
  useEffect(() => {
    if (isOpen && agentId) {
      loadExistingConfiguration();
    } else if (!isOpen) {
      // Clear all state when modal closes
      setFile(null);
      setUploading(false);
      setProgress(null);
      setExtractedConfig(null);
      setRequirementsDoc(null);
      setError(null);
      setUploadMode('file');
      setLoadingExisting(false);
      setPromptInputs({
        purpose: '',
        audience: '',
        inputTypes: '',
        outputFormat: '',
        quality: '',
        undesirable: '',
      });
    }
  }, [isOpen, agentId]);
  
  const loadExistingConfiguration = async () => {
    if (!agentId) return;
    
    setLoadingExisting(true);
    try {
      console.log('📥 [CONFIG LOAD] Starting load for agent:', agentId);
      console.log('📥 [CONFIG LOAD] Calling: /api/agent-setup/get?agentId=' + agentId);
      
      const setupResponse = await fetch(`/api/agent-setup/get?agentId=${agentId}`);
      console.log('📥 [CONFIG LOAD] Response status:', setupResponse.status);
      console.log('📥 [CONFIG LOAD] Response OK:', setupResponse.ok);
      
      if (setupResponse.ok) {
        const data = await setupResponse.json();
        console.log('📥 [CONFIG LOAD] Data received:', JSON.stringify(data, null, 2).substring(0, 500));
        console.log('📥 [CONFIG LOAD] data.exists:', data.exists);
        console.log('📥 [CONFIG LOAD] data.inputExamples:', data.inputExamples);
        console.log('📥 [CONFIG LOAD] data.inputExamples?.length:', data.inputExamples?.length);
        
        if (data.exists && data.inputExamples && data.inputExamples.length > 0) {
          console.log('✅ [CONFIG LOAD] FOUND EXISTING CONFIG!');
          console.log('✅ [CONFIG LOAD] Examples count:', data.inputExamples.length);
          console.log('✅ [CONFIG LOAD] File name:', data.fileName);
          console.log('✅ [CONFIG LOAD] Purpose:', data.agentPurpose?.substring(0, 100));
          
          // BACKWARD COMPATIBILITY: Migrate old format to new simplified format
          const rawConfig = {
            agentName: agentName || data.agentName || data.fileName,
            agentPurpose: data.agentPurpose || '',
            targetAudience: data.targetAudience || [],
            pilotUsers: data.pilotUsers || [], // NEW field
            recommendedModel: data.recommendedModel || 'gemini-2.5-flash',
            systemPrompt: data.systemPrompt || data.setupInstructions || '',
            tone: data.tone || '',
            expectedInputTypes: data.expectedInputTypes || [],
            expectedInputExamples: data.inputExamples || [],
            expectedOutputFormat: data.expectedOutputFormat || '',
            expectedOutputExamples: data.correctOutputs || data.expectedOutputExamples || [],
            responseRequirements: data.responseRequirements || {},
            requiredContextSources: data.requiredContextSources || [],
            domainExpert: data.domainExpert,
            // Optional/legacy fields (preserve if exist)
            businessCase: data.businessCase,
            qualityCriteria: data.qualityCriteria,
            undesirableOutputs: data.undesirableOutputs,
            acceptanceCriteria: data.acceptanceCriteria,
            recommendedContextSources: data.recommendedContextSources,
            evaluationCriteria: data.evaluationCriteria,
            successMetrics: data.successMetrics
          };
          
          // Use migration helper to ensure compatibility
          const fullConfig = migrateConfigToSimplified(rawConfig) as AgentConfiguration;
          
          setExtractedConfig(fullConfig);
          
          console.log('✅ [CONFIG LOAD] Config migrated to new format');
          console.log('✅ [CONFIG LOAD] Core fields:', Object.keys(fullConfig).filter(k => !k.startsWith('business') && !k.startsWith('quality')));
        } else {
          console.log('ℹ️ [CONFIG LOAD] No existing configuration found');
          console.log('ℹ️ [CONFIG LOAD] Reason: exists=' + data.exists + ', examples=' + (data.inputExamples?.length || 0));
        }
      } else {
        console.log('⚠️ [CONFIG LOAD] Response not OK, status:', setupResponse.status);
        const errorText = await setupResponse.text();
        console.log('⚠️ [CONFIG LOAD] Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ [CONFIG LOAD] Exception:', error);
      console.error('❌ [CONFIG LOAD] Error details:', error instanceof Error ? error.message : 'Unknown');
    } finally {
      setLoadingExisting(false);
    }
  };
  
  if (!isOpen) return null;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };
  
  const runEvaluation = async (config: AgentConfiguration) => {
    console.log('🧪 Running real agent evaluation...');
    setEvaluating(true);
    setEvaluationResults(null);
    
    try {
      const response = await fetch('/api/agents/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentConfig: config,
          qualityCriteria: config.qualityCriteria || [],
          acceptanceCriteria: config.acceptanceCriteria || [],
          undesirableOutputs: config.undesirableOutputs || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Evaluation complete:', data.evaluation);
      setEvaluationResults(data.evaluation);
      
    } catch (error: any) {
      console.error('❌ Error running evaluation:', error);
      setError(`Error al evaluar agente: ${error.message}`);
    } finally {
      setEvaluating(false);
    }
  };
  
  const simulateExtractionProgress = () => {
    const stages: ExtractionProgress['stage'][] = [
      'uploading',
      'analyzing',
      'extracting-purpose',
      'mapping-inputs',
      'mapping-outputs',
      'extracting-criteria',
      'generating-config',
      'complete'
    ];
    
    const messages: Record<ExtractionProgress['stage'], string> = {
      'uploading': 'Subiendo documento de requerimientos...',
      'analyzing': 'Identificando caso de negocio y dolores...',
      'extracting-purpose': 'Extrayendo propósito y user personas afectadas...',
      'mapping-inputs': 'Mapeando expectativas de entrada (cómo preguntan)...',
      'mapping-outputs': 'Identificando solución diferencial esperada (cómo debe responder)...',
      'extracting-criteria': 'Extrayendo criterios de evaluación del éxito...',
      'generating-config': 'Definiendo criterios de aceptación y certificación...',
      'complete': '✅ Caso de uso y configuración generados',
      'error': 'Error en el procesamiento'
    };
    
    let currentStage = 0;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      if (currentStage >= stages.length - 1) {
        clearInterval(interval);
        setProgress({
          stage: 'complete',
          percentage: 100,
          message: messages['complete'],
          currentStep: stages.length,
          totalSteps: stages.length,
          startTime,
          elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
        });
        
        // Show extracted config (mock for now)
        setTimeout(() => {
          setExtractedConfig({
            agentName: agentName || 'Asistente Legal Territorial RDI',
            agentPurpose: 'Proveer información actualizada sobre normativas y leyes que afectan proyectos inmobiliarios en territorios específicos de Chile',
            targetAudience: ['Arquitectos', 'Constructores', 'Equipo Legal', 'Gerentes de Proyecto', 'Usuarios IACO'],
            businessCase: {
              painPoint: 'Los profesionales dedican horas navegando miles de páginas de LGUC, OGUC y DDU para encontrar normativas específicas, retrasando decisiones críticas en proyectos',
              affectedPersonas: ['Arquitectos (15 usuarios)', 'Constructores (8 usuarios)', 'Equipo Legal (5 usuarios)', 'Gerentes de Proyecto (6 usuarios)'],
              businessArea: 'Legal y Desarrollo Territorial',
              businessImpact: {
                quantitative: {
                  usersAffected: 34,
                  frequency: '30-40 consultas legales por día',
                  timeSavingsPerQuery: '15-30 minutos',
                  estimatedAnnualValue: '$800,000 USD en tiempo profesional'
                },
                qualitative: {
                  description: 'Decisiones legales más rápidas e informadas, reducción de riesgos normativos, mayor confianza en cumplimiento',
                  benefitAreas: ['Velocidad en decisiones legales', 'Precisión normativa', 'Reducción de riesgos', 'Mejor cumplimiento'],
                  risksMitigated: ['Errores normativos costosos', 'Retrasos en proyectos por consultas legales', 'Multas por incumplimiento', 'Pérdida de tiempo en búsqueda manual']
                }
              },
              alignment: {
                companyOKRs: ['Aumentar eficiencia operacional en proyectos 25%', 'Reducir riesgos legales en desarrollo territorial'],
                departmentGoals: ['Reducir tiempo respuesta legal 50%', 'Zero multas por incumplimiento normativo'],
                strategicValue: 'high'
              },
              roi: {
                timeSaved: '3 horas/día por profesional',
                costSaved: '$800K anuales en tiempo profesional',
                qualityImprovement: 'Reducción 70% errores normativos',
                userSatisfactionTarget: 4.5
              }
            },
            recommendedModel: 'gemini-2.5-pro',
            systemPrompt: 'Eres un asistente legal especializado en normativas urbanas y construcción de Chile (LGUC, OGUC, DDU). Proporciona información actualizada, precisa y con referencias a artículos específicos. Usa terminología técnica apropiada. Cita siempre la fuente (ley, artículo, DDU). Sé adaptativo según la complejidad de la pregunta.',
            tone: 'Técnico y especializado',
            expectedInputTypes: ['Consultas sobre permisos de edificación', 'Requisitos de loteo/subdivisión', 'Diferencias normativas', 'Jurisprudencia MINVU', 'Análisis de casos complejos'],
            expectedInputExamples: [],
            expectedOutputFormat: 'Adaptativo según complejidad, siempre con referencias a artículos y DDU',
            expectedOutputExamples: [],
            responseRequirements: {
              format: 'Adaptativo (breve para preguntas simples, detallado para casos complejos)',
              length: { min: 100, max: 500, target: 250 },
              precision: 'exact',
              speed: { target: 3, maximum: 8 },
              mustInclude: ['Referencia a artículo específico (LGUC/OGUC)', 'DDU aplicable si existe', 'Número de artículo'],
              mustAvoid: ['Respuestas sin citar fuente', 'Información desactualizada', 'Simplificación excesiva que omita detalles legales importantes'],
              citations: true
            },
            qualityCriteria: [
              { id: '1', criterion: 'Precisión Legal', weight: 0.4, description: 'Información 100% correcta según normativa vigente', examples: [] },
              { id: '2', criterion: 'Referencias Completas', weight: 0.3, description: 'Cita artículos, DDU y jurisprudencia', examples: [] },
              { id: '3', criterion: 'Adaptabilidad', weight: 0.2, description: 'Respuesta ajustada a complejidad de pregunta', examples: [] },
              { id: '4', criterion: 'Actualización', weight: 0.1, description: 'Usa normativa más reciente', examples: [] }
            ],
            undesirableOutputs: [
              { id: '1', example: '"Consulta con un abogado"', reason: 'Debe proporcionar la información legal disponible', howToAvoid: 'Buscar en LGUC, OGUC y DDU antes de derivar' },
              { id: '2', example: 'Respuesta sin citar artículo', reason: 'Falta trazabilidad legal', howToAvoid: 'Siempre incluir "Artículo X.X.X de OGUC" o "DDU N°..."' },
              { id: '3', example: 'Información desactualizada', reason: 'Normativas cambian', howToAvoid: 'Verificar versión más reciente de documentos' }
            ],
            acceptanceCriteria: [
              { id: '1', criterion: '95% de respuestas con referencias completas', description: 'Toda respuesta debe citar artículo LGUC/OGUC o DDU', isRequired: true, testable: true, howToTest: 'Verificar presencia de citación en respuesta' },
              { id: '2', criterion: '100% precisión en artículos citados', description: 'Artículos citados deben existir y ser correctos', isRequired: true, testable: true, howToTest: 'Validar contra documentos fuente' },
              { id: '3', criterion: 'Adaptativo según complejidad', description: 'Respuestas simples para preguntas simples, detalladas para complejas', isRequired: true, testable: true, howToTest: 'Evaluar longitud y profundidad vs pregunta' }
            ],
            requiredContextSources: [],
            recommendedContextSources: [],
            evaluationCriteria: [],
            successMetrics: []
          });
          
          setUploading(false);
        }, 500);
        
        return;
      }
      
      currentStage++;
      const percentage = Math.floor((currentStage / stages.length) * 100);
      
      setProgress({
        stage: stages[currentStage],
        percentage,
        message: messages[stages[currentStage]],
        currentStep: currentStage + 1,
        totalSteps: stages.length,
        startTime,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
      });
    }, 1500); // Each stage takes ~1.5 seconds
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setProgress({
      stage: 'uploading',
      percentage: 0,
      message: 'Subiendo documento...',
      currentStep: 0,
      totalSteps: 8,
      startTime: Date.now(),
      elapsedSeconds: 0
    });
    
    try {
      // Real API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', agentId || 'new');
      
      // Start progress simulation while API processes
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (!prev || prev.percentage >= 90) return prev;
          
          const stages: ExtractionProgress['stage'][] = [
            'uploading', 'analyzing', 'extracting-purpose', 'mapping-inputs',
            'mapping-outputs', 'extracting-criteria', 'generating-config'
          ];
          
          const currentStageIndex = Math.floor(prev.percentage / (100 / stages.length));
          const nextStage = stages[Math.min(currentStageIndex, stages.length - 1)];
          
          return {
            ...prev,
            stage: nextStage,
            percentage: Math.min(prev.percentage + 2, 90),
            currentStep: Math.min(currentStageIndex + 1, stages.length),
            elapsedSeconds: Math.floor((Date.now() - prev.startTime!) / 1000)
          };
        });
      }, 500);
      
      console.log('📤 Calling extraction API...');
      const response = await fetch('/api/agents/extract-config', {
        method: 'POST',
        body: formData
      });
      
      console.log('📥 API response status:', response.status);
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Extraction successful:', data);
      
      // Complete progress
      setProgress({
        stage: 'complete',
        percentage: 100,
        message: '✅ Caso de uso y configuración generados',
        currentStep: 8,
        totalSteps: 8,
        startTime: progress?.startTime || Date.now(),
        elapsedSeconds: Math.floor((Date.now() - (progress?.startTime || Date.now())) / 1000)
      });
      
      // Show extracted config
      setTimeout(async () => {
        setExtractedConfig(data.config);
        setRequirementsDoc({
          fileName: data.metadata.fileName,
          uploadedAt: new Date(data.metadata.extractedAt),
          uploadedBy: 'current-user', // TODO: Get from session
          fileUrl: undefined, // TODO: Upload to Cloud Storage
          extractedConfig: data.config,
          extractedAt: new Date(data.metadata.extractedAt),
          extractionModel: data.metadata.extractionModel
        });
        setUploading(false);
        
        // Automatically run evaluation
        await runEvaluation(data.config);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error extracting config:', error);
      
      // More detailed error message
      let errorMessage = 'Error al procesar el documento';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.message?.includes('API key')) {
        errorMessage = 'API key de Gemini no configurada. Verifica GOOGLE_AI_API_KEY en el servidor.';
      }
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica que el servidor esté corriendo.';
      }
      
      setError(errorMessage);
      setUploading(false);
      setProgress(null);
      
      // Log to console for debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        file: file?.name,
        fileType: file?.type,
        fileSize: file?.size
      });
    }
  };
  
  const handleSaveConfig = () => {
    if (extractedConfig) {
      onConfigSaved(extractedConfig);
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              Configuración del Agente
            </h2>
            {agentName && (
              <p className="text-sm text-slate-600 mt-1">{agentName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingExisting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Cargando configuración del agente...</p>
            </div>
          ) : !uploading && !extractedConfig ? (
            <>
              {/* Upload Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  ¿Cómo deseas configurar el agente?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setUploadMode('file')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      uploadMode === 'file'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">Subir Documento</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Archivo con especificaciones completas
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setUploadMode('prompt')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      uploadMode === 'prompt'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">Describir con Prompts</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Guía paso a paso con ejemplos
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setUploadMode('enhance')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      uploadMode === 'enhance'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">Mejorar Prompt</p>
                    <p className="text-xs text-slate-600 mt-1">
                      IA mejora el prompt usando Ficha
                    </p>
                  </button>
                </div>
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Click para subir o arrastra el archivo aquí
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF, Word, o documento de texto
                    </p>
                    {file && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">{file.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* Template Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      ¿Qué debe incluir el documento?
                    </p>
                    <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                      <li className="flex items-start gap-2">
                        <Target className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Propósito:</strong> Para qué sirve este agente y qué problemas resuelve</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <UsersIcon className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Audiencia:</strong> Quiénes usarán este agente (usuarios, roles, departamentos)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Inputs Esperados:</strong> Tipos de preguntas o solicitudes que recibirá</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Outputs Correctos:</strong> Ejemplos de respuestas bien formuladas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Outputs Incorrectos:</strong> Ejemplos de respuestas NO deseables y por qué</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Criterios de Calidad:</strong> Cómo evaluar si el agente responde bien</span>
                      </li>
                    </ul>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="text-xs text-red-800">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Mode */}
              {uploadMode === 'prompt' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Te guiaremos paso a paso
                    </p>
                    <p className="text-xs text-slate-700">
                      Responde cada sección con la mayor claridad posible. El sistema generará la configuración automáticamente.
                    </p>
                  </div>
                  
                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      1. ¿Cuál es el propósito de este agente?
                    </label>
                    <textarea
                      value={promptInputs.purpose}
                      onChange={(e) => setPromptInputs({...promptInputs, purpose: e.target.value})}
                      placeholder="Ejemplo: Asistir al equipo de ventas con información sobre productos, precios, y disponibilidad en tiempo real..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={3}
                    />
                  </div>
                  
                  {/* Audience */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      2. ¿Quiénes usarán este agente?
                    </label>
                    <input
                      value={promptInputs.audience}
                      onChange={(e) => setPromptInputs({...promptInputs, audience: e.target.value})}
                      placeholder="Ejemplo: Equipo de ventas, gerentes de cuenta, soporte al cliente"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Input Types */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      3. ¿Qué tipo de preguntas o solicitudes recibirá?
                    </label>
                    <textarea
                      value={promptInputs.inputTypes}
                      onChange={(e) => setPromptInputs({...promptInputs, inputTypes: e.target.value})}
                      placeholder="Ejemplo: Consultas sobre precios, disponibilidad de productos, comparaciones, términos de contrato..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={3}
                    />
                  </div>
                  
                  {/* Output Format */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      4. ¿Cómo debe responder el agente?
                    </label>
                    <textarea
                      value={promptInputs.outputFormat}
                      onChange={(e) => setPromptInputs({...promptInputs, outputFormat: e.target.value})}
                      placeholder="Ejemplo: Respuestas directas con datos específicos, incluir precios con moneda, citar fuentes cuando sea posible..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={3}
                    />
                  </div>
                  
                  {/* Quality Criteria */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      5. ¿Qué hace que una respuesta sea de calidad?
                    </label>
                    <textarea
                      value={promptInputs.quality}
                      onChange={(e) => setPromptInputs({...promptInputs, quality: e.target.value})}
                      placeholder="Ejemplo: Precisión de datos, claridad, inclusión de ejemplos, tono profesional..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={2}
                    />
                  </div>
                  
                  {/* Undesirable */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      6. ¿Qué NO debe hacer el agente?
                    </label>
                    <textarea
                      value={promptInputs.undesirable}
                      onChange={(e) => setPromptInputs({...promptInputs, undesirable: e.target.value})}
                      placeholder="Ejemplo: No inventar precios, no prometer disponibilidad sin verificar, no usar lenguaje técnico excesivo..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              )}
              
              {/* ✅ NEW: Enhance Mode - Upload Ficha for Prompt Improvement */}
              {uploadMode === 'enhance' && (
                <div className="space-y-4">
                  {/* Info Banner */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900 mb-1">
                          🎯 Mejora Automática del Prompt del Agente
                        </p>
                        <p className="text-xs text-purple-800 mb-2">
                          Sube una <strong>"Ficha de Asistente Virtual"</strong> con las especificaciones completas
                          del agente. La IA analizará el documento y generará un prompt optimizado siguiendo
                          mejores prácticas de prompt engineering.
                        </p>
                        <p className="text-xs text-purple-700">
                          El prompt mejorado se aplicará directamente al agente y el documento quedará guardado
                          como referencia en Cloud Storage.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Click para subir Ficha de Asistente Virtual
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF o Word (.doc, .docx) - Máximo 50MB
                    </p>
                    
                    {file && (
                      <div className="mt-4 bg-purple-100 border border-purple-300 rounded-lg p-3 inline-block">
                        <p className="text-sm font-semibold text-purple-900">{file.name}</p>
                        <p className="text-xs text-purple-700">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* What to Include */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      Contenido de la Ficha (10 elementos clave):
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">1.</span>
                        <span>Nombre del Asistente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">6.</span>
                        <span>Preguntas Tipo (ejemplos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">2.</span>
                        <span>Objetivo y Descripción</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">7.</span>
                        <span>Nivel de Detalle esperado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">3.</span>
                        <span>Usuarios Piloto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">8.</span>
                        <span>Documentos de Referencia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">4.</span>
                        <span>Usuarios Finales</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">9.</span>
                        <span>Restricciones y Límites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">5.</span>
                        <span>Encargado del Proyecto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">10.</span>
                        <span>Tono y Formato</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      <p className="text-[10px] text-slate-500 italic">
                        💡 Usa la plantilla: <code className="bg-slate-200 px-1 rounded">docs/templates/Ficha-Asistente-Virtual-Template.md</code>
                      </p>
                    </div>
                  </div>
                  
                  {/* Note about prompt-only enhancement */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      <strong>Nota:</strong> Esta opción mejora SOLO el prompt del agente. Si necesitas configurar
                      inputs/outputs esperados completos, usa la opción "Subir Documento" (ARD).
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Progress View */}
          {uploading && progress && !extractedConfig && (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Procesando Documento</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Extrayendo configuración del agente...
                </p>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    {progress.message}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>
                    Paso {progress.currentStep} de {progress.totalSteps}
                  </span>
                  <span>
                    {progress.elapsedSeconds}s transcurridos
                  </span>
                </div>
              </div>
              
              {/* Stages List */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Etapas del Proceso:</h4>
                <div className="space-y-2">
                  {[
                    { stage: 'uploading', label: '📤 Subiendo documento de requerimientos', icon: Upload },
                    { stage: 'analyzing', label: '🎯 Identificando caso de negocio y dolores', icon: Eye },
                    { stage: 'extracting-purpose', label: '👥 Extrayendo user personas afectadas', icon: Target },
                    { stage: 'mapping-inputs', label: '💬 Expectativas de entrada (cómo preguntan)', icon: MessageSquare },
                    { stage: 'mapping-outputs', label: '✨ Solución diferencial (cómo responde)', icon: CheckCircle },
                    { stage: 'extracting-criteria', label: '📊 Criterios de evaluación del éxito', icon: Sparkles },
                    { stage: 'generating-config', label: '🏆 Criterios de aceptación y certificación', icon: SettingsIcon },
                  ].map(({ stage, label, icon: Icon }) => {
                    const isPast = getStageIndex(progress.stage) > getStageIndex(stage as any);
                    const isCurrent = progress.stage === stage;
                    
                    return (
                      <div key={stage} className={`flex items-center gap-3 text-sm ${
                        isPast ? 'text-green-600' :
                        isCurrent ? 'text-blue-600 font-medium' :
                        'text-slate-400'
                      }`}>
                        {isPast ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Extracted Config View */}
          {extractedConfig && (
            <div className="space-y-6">
              {/* Success Header with Actions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-900">✅ Configuración Generada</h3>
                    <p className="text-sm text-slate-700 mt-1">
                      Revisa la configuración extraída y ajusta si es necesario.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file && (
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(file);
                          window.open(url, '_blank');
                        }}
                        className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-xs font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Ver Documento
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Clear current config to allow re-upload
                        setExtractedConfig(null);
                        setFile(null);
                        setError(null);
                        setEvaluationResults(null);
                        // Re-focus file input
                        setTimeout(() => fileInputRef.current?.click(), 100);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                      title="Subir ARD nuevamente para mejorar la extracción"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-procesar ARD
                    </button>
                  </div>
                </div>
                
                {/* Data Completeness Warning */}
                {(!extractedConfig.targetAudience || extractedConfig.targetAudience.length === 0 || 
                  !extractedConfig.pilotUsers || extractedConfig.pilotUsers.length === 0 ||
                  !extractedConfig.tone) && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">
                        ⚠️ Extracción Incompleta
                      </p>
                      <p className="text-xs text-yellow-800">
                        Algunos campos no se extrajeron correctamente. 
                        <strong className="ml-1">Click "Re-procesar ARD"</strong> para volver a extraer con el sistema mejorado.
                      </p>
                      <div className="mt-2 text-[10px] text-yellow-700">
                        Faltantes: {[
                          (!extractedConfig.targetAudience || extractedConfig.targetAudience.length === 0) && 'Usuarios Finales',
                          (!extractedConfig.pilotUsers || extractedConfig.pilotUsers.length === 0) && 'Usuarios Piloto',
                          !extractedConfig.tone && 'Tono de Respuestas',
                          !extractedConfig.recommendedModel && 'Modelo Recomendado'
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* SECTION 1: Use Case & Intent */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
                <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                  🎯 Caso de Uso e Intención
                </h3>
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                  {extractedConfig.agentPurpose}
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs mt-3 pt-3 border-t border-blue-200">
                  <div>
                    <p className="text-blue-700 font-semibold mb-1">📍 Responsable</p>
                    <p className="text-slate-800">{extractedConfig.domainExpert?.name || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-semibold mb-1">🏢 Dominio</p>
                    <p className="text-slate-800">{inferDomain(extractedConfig.agentPurpose)}</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-semibold mb-1">⚙️ Modelo</p>
                    {extractedConfig.recommendedModel === 'gemini-2.5-pro' ? (
                      <span className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Gemini 2.5 Pro
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Gemini 2.5 Flash
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* SECTION 2: Users Who Find Value */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                  Usuarios que Encontrarán Valor
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Pilot Users */}
                  {extractedConfig.pilotUsers && extractedConfig.pilotUsers.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
                      <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-1.5">
                        🧪 Fase de Prueba
                      </h4>
                      <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                        {extractedConfig.pilotUsers.map((user, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                            {user}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-yellow-700 mt-3 pt-3 border-t border-yellow-200 font-bold">
                        {extractedConfig.pilotUsers.length} usuarios de prueba
                      </p>
                    </div>
                  )}
                  
                  {/* End Users */}
                  <div className={`bg-green-50 rounded-lg p-4 border-2 border-green-300 ${!extractedConfig.pilotUsers || extractedConfig.pilotUsers.length === 0 ? 'col-span-2' : ''}`}>
                    <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-1.5">
                      ✅ Usuarios Finales
                    </h4>
                    <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                      {(extractedConfig.targetAudience || []).map((user, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          {user}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-green-700 mt-3 pt-3 border-t border-green-200 font-bold">
                      {extractedConfig.targetAudience?.length || 0} usuarios finales
                    </p>
                  </div>
                </div>
                
                {/* Derived Insights */}
                {extractedConfig.targetAudience && extractedConfig.targetAudience.length > 0 && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-600 font-semibold mb-1">📊 Alcance</p>
                        <p className="text-slate-800">
                          ~{extractedConfig.targetAudience.length + (extractedConfig.pilotUsers?.length || 0)} profesionales total
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold mb-1">🏢 Departamentos Identificados</p>
                        <div className="flex flex-wrap gap-1">
                          {identifyDepartments([...(extractedConfig.targetAudience || []), ...(extractedConfig.pilotUsers || [])]).map((dept, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium text-[10px]">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* SECTION 3: Input & Output Examples */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  Ejemplos de Consultas y Respuestas
                </h3>
                
                {/* Input Examples */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">💬 Preguntas que el Agente Recibirá</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {extractedConfig.expectedInputExamples?.length || 0} ejemplos
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(extractedConfig.expectedInputExamples || []).slice(0, 5).map((example, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-sm mt-0.5 flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-800">
                              {example.question}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                                {example.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                example.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                example.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {example.difficulty === 'hard' ? '🔴 Difícil' :
                                 example.difficulty === 'medium' ? '🟡 Media' :
                                 '🟢 Fácil'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(extractedConfig.expectedInputExamples?.length || 0) > 5 && (
                      <details className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                        <summary className="font-medium">
                          Ver las {(extractedConfig.expectedInputExamples?.length || 0) - 5} preguntas restantes...
                        </summary>
                        <div className="mt-2 space-y-2">
                          {extractedConfig.expectedInputExamples.slice(5).map((example, idx) => (
                            <div key={idx + 5} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold text-sm">
                                  {idx + 6}.
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-800">{example.question}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                                      {example.category}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      example.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                      example.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {example.difficulty === 'hard' ? '🔴 Difícil' :
                                       example.difficulty === 'medium' ? '🟡 Media' :
                                       '🟢 Fácil'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  
                  {/* Category & Complexity Distribution */}
                  {extractedConfig.expectedInputExamples && extractedConfig.expectedInputExamples.length > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-600 font-semibold mb-2">📊 Categorías Identificadas</p>
                          <div className="flex flex-wrap gap-1">
                            {extractCategories(extractedConfig.expectedInputExamples).map((cat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium text-[10px]">
                                {cat} ({extractedConfig.expectedInputExamples.filter(e => e.category === cat).length})
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-600 font-semibold mb-2">📈 Distribución por Complejidad</p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const dist = analyzeComplexityDistribution(extractedConfig.expectedInputExamples);
                              return (
                                <>
                                  <span className="text-green-700 font-bold">🟢 {dist.easy}</span>
                                  <span className="text-yellow-700 font-bold">🟡 {dist.medium}</span>
                                  <span className="text-red-700 font-bold">🔴 {dist.hard}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Output Style */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">📝 Estilo de Respuestas Esperado</h4>
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-slate-800 font-medium mb-3">
                      {extractedConfig.expectedOutputFormat}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white rounded p-2">
                        <p className="text-slate-600 mb-1">Tono:</p>
                        <p className="font-semibold text-slate-900">{extractedConfig.tone}</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-slate-600 mb-1">Precisión:</p>
                        <p className="font-semibold text-slate-900 capitalize">
                          {extractedConfig.responseRequirements?.precision || 'Approximate'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-slate-600 mb-1">Citaciones:</p>
                        <p className={`font-semibold ${extractedConfig.responseRequirements?.citations ? 'text-green-700' : 'text-slate-700'}`}>
                          {extractedConfig.responseRequirements?.citations ? '✅ Obligatorias' : 'Opcionales'}
                        </p>
                      </div>
                    </div>
                    
                    {extractedConfig.responseRequirements?.citations && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs text-purple-800 font-medium">
                          💡 Formato de respuesta esperado: Respuesta directa → Fundamento normativo → Consideraciones → Fuentes citadas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Real Agent Evaluation Results */}
              {(evaluating || evaluationResults) && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-purple-900 mb-2 flex items-center gap-2">
                    ⚡ SALIDA REAL DEL AGENTE
                  </h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Respuesta correcta y completa que sigue los lineamientos establecidos en la configuración del agente. Incluye todos los pasos necesarios y referencias apropiadas.
                  </p>
                  
                  {evaluating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      <span className="ml-3 text-purple-700 font-medium">Evaluando agente con criterios reales...</span>
                    </div>
                  ) : evaluationResults && (
                    <div className="space-y-4">
                      {/* Overall Score */}
                      <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-slate-900">Puntuación General</h4>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              evaluationResults.overallScore >= 80 ? 'text-green-600' :
                              evaluationResults.overallScore >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {evaluationResults.overallScore}/100
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {evaluationResults.passedCriteria}/{evaluationResults.totalCriteria} criterios aprobados
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${
                          evaluationResults.overallScore >= 80 ? 'text-green-700' :
                          evaluationResults.overallScore >= 60 ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {evaluationResults.recommendation}
                        </p>
                      </div>
                      
                      {/* Criteria Breakdown */}
                      <div className="bg-white rounded-lg p-5 border border-slate-200">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          📊 DESGLOSE POR CRITERIO
                        </h4>
                        
                        <div className="space-y-3">
                          {evaluationResults.results.map((result: any, idx: number) => (
                            <details key={idx} className="group">
                              <summary className={`cursor-pointer p-3 rounded-lg border-2 ${
                                result.passed 
                                  ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                  : 'bg-red-50 border-red-300 hover:bg-red-100'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    {result.passed ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900">{result.criterion}</p>
                                      <p className="text-xs text-slate-600 mt-0.5">{result.feedback}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-xl font-bold ${
                                      result.score >= 80 ? 'text-green-600' :
                                      result.score >= 60 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {result.score}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-1">/100</span>
                                  </div>
                                </div>
                              </summary>
                              
                              <div className="mt-3 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-700 mb-1">❓ Pregunta de Prueba:</p>
                                  <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded italic">
                                    "{result.testQuery}"
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-bold text-slate-700 mb-1">🤖 Respuesta del Agente:</p>
                                  <p className="text-sm text-slate-800 bg-blue-50 p-3 rounded border border-blue-200">
                                    {result.agentResponse}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-bold text-slate-700 mb-1">🧠 Evaluación del Evaluador:</p>
                                  <pre className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                                    {result.evaluatorReasoning}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                      
                      {/* Re-evaluate Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => runEvaluation(extractedConfig!)}
                          disabled={evaluating}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 font-medium flex items-center gap-2"
                        >
                          {evaluating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Evaluando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5" />
                              Re-evaluar Agente
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* SECTION 4: Knowledge Sources Required */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-orange-600" />
                  Fuentes de Conocimiento Requeridas
                </h3>
                
                {/* Detected Sources */}
                {extractedConfig.expectedInputExamples && extractedConfig.expectedInputExamples.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      🤖 Auto-detectadas en las Preguntas
                    </h4>
                    <div className="space-y-2">
                      {detectRequiredSources(extractedConfig.expectedInputExamples).map((source, idx) => (
                        <div key={idx} className={`rounded-lg p-3 border-2 ${
                          source.priority === 'critical' ? 'bg-red-50 border-red-300' :
                          source.priority === 'recommended' ? 'bg-yellow-50 border-yellow-300' :
                          'bg-slate-50 border-slate-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className={`w-4 h-4 ${
                                source.priority === 'critical' ? 'text-red-600' :
                                source.priority === 'recommended' ? 'text-yellow-600' :
                                'text-slate-600'
                              }`} />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{source.name}</p>
                                <p className="text-xs text-slate-600">
                                  Mencionado {source.mentions} {source.mentions === 1 ? 'vez' : 'veces'} en las preguntas
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                source.priority === 'critical' ? 'bg-red-600 text-white' :
                                source.priority === 'recommended' ? 'bg-yellow-600 text-white' :
                                'bg-slate-600 text-white'
                              }`}>
                                {source.priority === 'critical' ? '🔴 CRÍTICO' :
                                 source.priority === 'recommended' ? '🟡 RECOMENDADO' :
                                 '⚪ OPCIONAL'}
                              </span>
                              <p className="text-xs text-slate-600 mt-1">
                                {source.isLoaded ? '✅ Cargado' : '❌ No cargado'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Upload Reminder */}
                    {detectRequiredSources(extractedConfig.expectedInputExamples).some(s => s.priority === 'critical') && (
                      <div className="mt-4 bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-orange-900 mb-1">
                              ⚠️ Documentos Críticos Requeridos
                            </p>
                            <p className="text-xs text-orange-800">
                              Este agente necesita las fuentes marcadas como CRÍTICO para poder responder con precisión. 
                              Súbelas después de guardar la configuración.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* From ARD Document Table */}
                {extractedConfig.requiredContextSources && extractedConfig.requiredContextSources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">📄 Documentos Listados en ARD</h4>
                    <div className="space-y-2">
                      {extractedConfig.requiredContextSources.map((source, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-slate-900">{source}</span>
                          </div>
                          <span className="text-xs text-green-700 font-semibold">Especificado en ARD</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* SECTION 5: System Prompt (Auto-generated) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  System Prompt (Auto-generado)
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Generado automáticamente desde el propósito, tono, y requisitos del agente. Puedes editarlo si necesario.
                </p>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {extractedConfig.systemPrompt}
                  </pre>
                </div>
              </div>
              
              {/* Document Source Link */}
              {file && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Documento Fuente:</span>
                    <span className="text-sm text-slate-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(file);
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          
          <div className="flex items-center gap-3">
            {!uploading && !extractedConfig && uploadMode === 'file' && (
              <button
                onClick={handleUpload}
                disabled={!file}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Procesar Documento
              </button>
            )}
            
            {!uploading && !extractedConfig && uploadMode === 'prompt' && (
              <button
                onClick={() => {
                  // Generate config from prompts
                  console.log('Generating config from prompts:', promptInputs);
                  setUploading(true);
                  simulateExtractionProgress();
                }}
                disabled={!promptInputs.purpose || !promptInputs.audience}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Generar Configuración
              </button>
            )}
            
            {!uploading && !extractedConfig && uploadMode === 'enhance' && (
              <button
                onClick={() => {
                  // ✅ NEW: Open AgentPromptEnhancer modal instead of showing alert
                  if (onOpenEnhancer) {
                    onClose(); // Close this modal first
                    onOpenEnhancer(); // Open AgentPromptEnhancer
                  } else {
                    alert('Error: onOpenEnhancer callback no está configurado');
                  }
                }}
                disabled={!onOpenEnhancer}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Mejorar Prompt con IA
              </button>
            )}
            
            {extractedConfig && (
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Guardar Configuración
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function getStageIndex(stage: ExtractionProgress['stage']): number {
  const stages: ExtractionProgress['stage'][] = [
    'uploading',
    'analyzing',
    'extracting-purpose',
    'mapping-inputs',
    'mapping-outputs',
    'extracting-criteria',
    'generating-config',
    'complete'
  ];
  return stages.indexOf(stage);
}

