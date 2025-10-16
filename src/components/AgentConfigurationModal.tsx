import { useState, useRef } from 'react';
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
  XCircle
} from 'lucide-react';
import type { AgentConfiguration, ExtractionProgress, AgentRequirementsDoc } from '../types/agent-config';
import { useModalClose } from '../hooks/useModalClose';

interface AgentConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string; // If editing existing agent
  agentName?: string;
  onConfigSaved: (config: AgentConfiguration) => void;
}

export default function AgentConfigurationModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  onConfigSaved,
}: AgentConfigurationModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'prompt'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedConfig, setExtractedConfig] = useState<AgentConfiguration | null>(null);
  const [requirementsDoc, setRequirementsDoc] = useState<AgentRequirementsDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
  
  useModalClose(isOpen, onClose);
  
  if (!isOpen) return null;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
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
      'uploading': 'Subiendo documento...',
      'analyzing': 'Analizando estructura del documento...',
      'extracting-purpose': 'Extrayendo propósito y objetivos del agente...',
      'mapping-inputs': 'Mapeando tipos de entrada y ejemplos...',
      'mapping-outputs': 'Identificando formatos de salida esperados...',
      'extracting-criteria': 'Extrayendo criterios de calidad...',
      'generating-config': 'Generando configuración del agente...',
      'complete': 'Configuración generada exitosamente',
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
            agentName: agentName || 'Asistente de Ventas',
            agentPurpose: 'Proporcionar información rápida y precisa sobre productos, precios y disponibilidad al equipo de ventas',
            targetAudience: ['Ejecutivos de Ventas', 'Gerentes de Cuenta', 'Soporte Pre-Venta'],
            businessCase: {
              painPoint: 'El equipo de ventas dedica 2 horas diarias buscando información en múltiples documentos PDF, reduciendo tiempo disponible para ventas directas',
              affectedPersonas: ['Ejecutivos de Ventas (25 personas)', 'Gerentes de Cuenta (8 personas)', 'Soporte Pre-Venta (12 personas)'],
              businessArea: 'Ventas y Marketing',
              businessImpact: {
                quantitative: {
                  usersAffected: 45,
                  frequency: '50 consultas por día',
                  timeSavingsPerQuery: '2-3 minutos',
                  estimatedAnnualValue: '$500,000 USD'
                },
                qualitative: {
                  description: 'Decisiones más rápidas, mayor satisfacción del equipo, menos errores en cotizaciones',
                  benefitAreas: ['Velocidad de respuesta', 'Precisión de información', 'Satisfacción del equipo'],
                  risksMitigated: ['Pérdida de ventas por info incorrecta', 'Frustración del equipo', 'Inconsistencia en información']
                }
              },
              alignment: {
                companyOKRs: ['Aumentar eficiencia operacional 20%', 'Incrementar revenue 15%'],
                departmentGoals: ['Reducir tiempo ciclo venta 30%', 'Aumentar tasa cierre 15%'],
                strategicValue: 'high'
              },
              roi: {
                timeSaved: '2 horas/día por usuario',
                costSaved: '$500K anuales',
                qualityImprovement: '30% menos errores',
                userSatisfactionTarget: 4.5
              }
            },
            recommendedModel: 'gemini-2.5-flash',
            systemPrompt: 'Eres un asistente especializado en ventas. Proporciona información precisa sobre productos y precios. Cita siempre la fuente. Sé conciso y profesional.',
            tone: 'Profesional pero amigable',
            expectedInputTypes: ['Consultas de precios', 'Disponibilidad de productos', 'Comparaciones de productos'],
            expectedInputExamples: [],
            expectedOutputFormat: 'Bullet points con datos clave, máximo 150 palabras',
            expectedOutputExamples: [],
            responseRequirements: {
              format: 'Bullet points',
              length: { min: 50, max: 200, target: 150 },
              precision: 'exact',
              speed: { target: 2, maximum: 5 },
              mustInclude: ['Precio con moneda', 'Fuente del dato', 'Disponibilidad actual'],
              mustAvoid: ['Respuestas vagas', 'Inventar datos', 'Jerga técnica excesiva'],
              citations: true
            },
            qualityCriteria: [
              { id: '1', criterion: 'Precisión', weight: 0.3, description: '100% de datos verificables', examples: [] },
              { id: '2', criterion: 'Claridad', weight: 0.25, description: 'Lenguaje simple y directo', examples: [] },
              { id: '3', criterion: 'Velocidad', weight: 0.2, description: 'Respuesta en < 3 segundos', examples: [] }
            ],
            undesirableOutputs: [
              { id: '1', example: '"No sé"', reason: 'Debe buscar en contexto', howToAvoid: 'Siempre consultar documentos antes de responder' },
              { id: '2', example: '"Depende..."', reason: 'Muy vago', howToAvoid: 'Proporcionar rangos o condiciones específicas' }
            ],
            acceptanceCriteria: [
              { id: '1', criterion: '90% precisión en precios', description: 'Precios correctos en 9 de 10 consultas', isRequired: true, testable: true, howToTest: 'Comparar con catálogo oficial' },
              { id: '2', criterion: 'Cita fuentes siempre', description: 'Toda respuesta debe indicar fuente', isRequired: true, testable: true, howToTest: 'Verificar presencia de cita' }
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
      message: 'Iniciando subida...',
      currentStep: 0,
      totalSteps: 8,
      startTime: Date.now(),
      elapsedSeconds: 0
    });
    
    // Simulate extraction (replace with real API call)
    simulateExtractionProgress();
    
    // TODO: Real implementation
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('agentId', agentId || 'new');
    // 
    // const response = await fetch('/api/agents/extract-config', {
    //   method: 'POST',
    //   body: formData
    // });
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
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
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
          {!uploading && !extractedConfig && (
            <>
              {/* Upload Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  ¿Cómo deseas configurar el agente?
                </label>
                <div className="grid grid-cols-2 gap-4">
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
            </>
          )}

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
                    { stage: 'uploading', label: 'Subiendo documento', icon: Upload },
                    { stage: 'analyzing', label: 'Analizando estructura', icon: Eye },
                    { stage: 'extracting-purpose', label: 'Extrayendo propósito', icon: Target },
                    { stage: 'mapping-inputs', label: 'Mapeando entradas', icon: MessageSquare },
                    { stage: 'mapping-outputs', label: 'Mapeando salidas', icon: CheckCircle },
                    { stage: 'extracting-criteria', label: 'Extrayendo criterios', icon: Sparkles },
                    { stage: 'generating-config', label: 'Generando configuración', icon: SettingsIcon },
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
              {/* Success Header */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900">✅ Configuración Generada</h3>
                  <p className="text-sm text-slate-700 mt-1">
                    Revisa la configuración extraída y ajusta si es necesario.
                  </p>
                </div>
                {file && (
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(file);
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-xs font-medium flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Ver Documento Fuente
                  </button>
                )}
              </div>
              
              {/* Business Case Section - Full Width */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Caso de Uso Identificado
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1: Pain Point */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1.5">
                      ⚠️ Dolor Identificado
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {extractedConfig.businessCase.painPoint}
                    </p>
                  </div>
                  
                  {/* Column 2: Who Has It */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                      <UsersIcon className="w-4 h-4" />
                      Quiénes lo Tienen
                    </h4>
                    <ul className="space-y-1 text-xs">
                      {extractedConfig.businessCase.affectedPersonas.map((persona, idx) => (
                        <li key={idx} className="text-slate-700 flex items-start gap-1.5">
                          <span className="text-blue-600">•</span>
                          {persona}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-[10px] text-slate-600">
                        <strong>Área:</strong> {extractedConfig.businessCase.businessArea}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        <strong>Total:</strong> {extractedConfig.businessCase.businessImpact.quantitative.usersAffected} usuarios
                      </p>
                    </div>
                  </div>
                  
                  {/* Column 3: Solution Expectation */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1.5">
                      ✨ Solución Esperada
                    </h4>
                    <p className="text-xs text-slate-700 mb-2">
                      <strong>Propósito:</strong> {extractedConfig.agentPurpose}
                    </p>
                    <p className="text-xs text-slate-700">
                      <strong>Tono:</strong> {extractedConfig.tone}
                    </p>
                  </div>
                </div>
                
                {/* Impact Row */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Quantitative Impact */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-1.5">
                      📊 Impacto Cuantitativo
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-600">Frecuencia:</span>
                        <p className="font-semibold text-slate-900">{extractedConfig.businessCase.businessImpact.quantitative.frequency}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Ahorro/query:</span>
                        <p className="font-semibold text-green-600">{extractedConfig.businessCase.businessImpact.quantitative.timeSavingsPerQuery}</p>
                      </div>
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                        <span className="text-slate-600">Valor Anual Estimado:</span>
                        <p className="font-bold text-green-600 text-base mt-1">{extractedConfig.businessCase.businessImpact.quantitative.estimatedAnnualValue}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Qualitative Impact */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-1.5">
                      💎 Impacto Cualitativo
                    </h4>
                    <p className="text-xs text-slate-700 mb-2">{extractedConfig.businessCase.businessImpact.qualitative.description}</p>
                    <div className="space-y-1 text-[11px]">
                      <p className="font-semibold text-slate-700">Riesgos Mitigados:</p>
                      {extractedConfig.businessCase.businessImpact.qualitative.risksMitigated.map((risk, idx) => (
                        <p key={idx} className="text-slate-600 flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          {risk}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Success Criteria */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5">
                <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                  🎯 Evaluación del Éxito
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* What Makes Success */}
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h4 className="text-sm font-bold text-green-700 mb-3">✅ Qué Define Éxito</h4>
                    <div className="space-y-2">
                      {extractedConfig.qualityCriteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-800">{criterion.criterion}</p>
                            <p className="text-[11px] text-slate-600">{criterion.description}</p>
                            <div className="mt-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-green-500 h-full"
                                style={{ width: `${criterion.weight * 100}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Peso: {(criterion.weight * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-slate-700 mb-1">Criterios de Aceptación:</h5>
                        {extractedConfig.acceptanceCriteria.map((ac, idx) => (
                          <div key={idx} className="mt-1.5 bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-xs font-semibold text-green-800">{ac.criterion}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{ac.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* What Degrades Experience */}
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <h4 className="text-sm font-bold text-red-700 mb-3">❌ Qué Degrada la Experiencia</h4>
                    <div className="space-y-2">
                      {extractedConfig.undesirableOutputs.map((output, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-semibold text-red-800 mb-1">
                            Ejemplo: "{output.example}"
                          </p>
                          <p className="text-[11px] text-slate-700">
                            <strong>Por qué:</strong> {output.reason}
                          </p>
                          <p className="text-[11px] text-green-700 mt-1">
                            <strong>Cómo evitar:</strong> {output.howToAvoid}
                          </p>
                        </div>
                      ))}
                      
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-slate-700 mb-1">Debe Evitar:</h5>
                        <div className="space-y-0.5">
                          {extractedConfig.responseRequirements.mustAvoid.map((avoid, idx) => (
                            <p key={idx} className="text-xs text-red-700 flex items-start gap-1">
                              <span>✗</span>
                              {avoid}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Response Requirements */}
                <div className="mt-4 bg-white rounded-lg p-4 border border-yellow-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">📏 Requerimientos de Respuesta</h4>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-600">Formato:</span>
                      <p className="font-semibold text-slate-800">{extractedConfig.responseRequirements.format}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Longitud:</span>
                      <p className="font-semibold text-slate-800">
                        {extractedConfig.responseRequirements.length.target} palabras
                      </p>
                      <p className="text-[10px] text-slate-500">
                        (max: {extractedConfig.responseRequirements.length.max})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Velocidad:</span>
                      <p className="font-semibold text-green-600">
                        ⚡ {extractedConfig.responseRequirements.speed.target}s
                      </p>
                      <p className="text-[10px] text-slate-500">
                        (max: {extractedConfig.responseRequirements.speed.maximum}s)
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Precisión:</span>
                      <p className="font-semibold text-slate-800 capitalize">{extractedConfig.responseRequirements.precision}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">Debe Incluir:</p>
                        <ul className="space-y-0.5">
                          {extractedConfig.responseRequirements.mustInclude.map((item, idx) => (
                            <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1">
                              <span className="text-green-600">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-1">Citaciones:</p>
                        <p className="text-xs text-slate-700">
                          {extractedConfig.responseRequirements.citations ? '✅ Requeridas' : '❌ No requeridas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add Missing Context Section */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
                <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Añadir Contexto Adicional (Opcional)
                </h3>
                <p className="text-sm text-slate-700 mb-4">
                  Mejora la calidad de las respuestas proporcionando información adicional de tu empresa
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      🌐 URL de la Empresa
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.empresa.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Extraeremos información de misión, visión, productos y servicios
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      🎯 OKRs del Departamento
                    </label>
                    <textarea
                      placeholder="Objetivo: Incrementar ventas 20%&#10;KR1: 100 nuevos clientes&#10;KR2: $2M revenue"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      💼 Misión
                    </label>
                    <textarea
                      placeholder="Proporcionar soluciones de valor..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      🌟 Valores Clave
                    </label>
                    <div className="space-y-1 text-xs">
                      {['Integridad', 'Excelencia', 'Innovación', 'Colaboración'].map((valor, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-slate-300" />
                          <span className="text-slate-700">{valor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Configuration Preview - 2 Columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Información Básica
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-600">Nombre:</span>
                        <p className="font-medium text-slate-800 mt-1">{extractedConfig.agentName}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Propósito:</span>
                        <p className="font-medium text-slate-800 mt-1">{extractedConfig.agentPurpose}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Audiencia:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {extractedConfig.targetAudience.map((aud, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {aud}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-600">Modelo Recomendado:</span>
                        <div className="mt-1">
                          {extractedConfig.recommendedModel === 'gemini-2.5-pro' ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 inline-flex">
                              <Sparkles className="w-3 h-3" />
                              Gemini 2.5 Pro
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1 inline-flex">
                              <Sparkles className="w-3 h-3" />
                              Gemini 2.5 Flash
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">System Prompt</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono text-slate-700 max-h-32 overflow-y-auto">
                      {extractedConfig.systemPrompt}
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Tipos de Input</h4>
                    <ul className="space-y-1 text-xs">
                      {extractedConfig.expectedInputTypes.map((type, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Formato de Output</h4>
                    <p className="text-xs text-slate-700">{extractedConfig.expectedOutputFormat}</p>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Tono</h4>
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                      {extractedConfig.tone}
                    </span>
                  </div>
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

