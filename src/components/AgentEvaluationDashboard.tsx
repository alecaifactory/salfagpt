import { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Play,
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  BarChart3,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Target,
  Award,
  Clock,
  Users as UsersIcon
} from 'lucide-react';
import type { AgentEvaluation, UserFeedback } from '../types/agent-config';

interface Agent {
  id: string;
  name: string;
  version: string;
  model: string;
  status: 'draft' | 'testing' | 'approved' | 'active' | 'deprecated';
  
  // Evaluation metrics
  totalEvaluations: number;
  lastEvaluationScore?: number;
  lastEvaluationDate?: Date;
  
  // User feedback
  totalFeedback: number;
  averageCSAT?: number; // 1-5
  feedbackDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  
  // Configuration
  acceptanceThreshold: number; // e.g., 85%
  testCasesCount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userRole: string;
  conversations: any[]; // Real agents from system
}

export default function AgentEvaluationDashboard({ isOpen, onClose, userEmail, userRole, conversations }: Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  
  const [viewMode, setViewMode] = useState<'list' | 'precheck' | 'evaluate' | 'results'>('list');
  const [hasConfiguration, setHasConfiguration] = useState(true); // Check if agent is configured
  
  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);
  
  const loadAgents = async () => {
    // Convert real conversations to agent evaluation format
    const agentList: Agent[] = conversations
      .filter(c => c.status !== 'archived')
      .map((conv, idx) => ({
        id: conv.id,
        name: conv.title,
        version: '1.0.0', // Default version
        model: 'gemini-2.5-flash', // Default, should come from agent config
        status: idx === 0 ? 'active' : 'testing', // First is active, rest testing
        totalEvaluations: Math.floor(Math.random() * 5), // Mock for now
        lastEvaluationScore: idx === 0 ? 92 : 78, // Mock scores
        lastEvaluationDate: new Date(),
        totalFeedback: Math.floor(Math.random() * 300),
        averageCSAT: idx === 0 ? 4.6 : 3.8,
        feedbackDistribution: idx === 0 
          ? { 5: 195, 4: 63, 3: 20, 2: 6, 1: 3 }
          : { 5: 12, 4: 18, 3: 10, 2: 3, 1: 2 },
        acceptanceThreshold: 85,
        testCasesCount: 15
      }));
    
    setAgents(agentList);
  };
  
  const runEvaluation = async (agent: Agent) => {
    setIsRunningEvaluation(true);
    setEvaluationProgress(0);
    setCurrentTest(0);
    setTotalTests(agent.testCasesCount);
    setViewMode('evaluate');
    
    // Simulate evaluation
    for (let i = 1; i <= agent.testCasesCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentTest(i);
      setEvaluationProgress((i / agent.testCasesCount) * 100);
    }
    
    // Show results
    const passedTests = Math.floor(agent.testCasesCount * 0.92); // 92% pass rate
    setEvaluationResults({
      totalTests: agent.testCasesCount,
      passedTests,
      failedTests: agent.testCasesCount - passedTests,
      overallScore: 92,
      criteriaScores: {
        precision: 95,
        clarity: 93,
        completeness: 90,
        speed: 88
      },
      recommendation: passedTests / agent.testCasesCount >= 0.85 ? 'approve' : 'improve',
      suggestedChanges: passedTests / agent.testCasesCount < 0.85 
        ? ['Optimizar tiempo de respuesta', 'Mejorar estructura de respuestas largas']
        : []
    });
    
    setIsRunningEvaluation(false);
    setViewMode('results');
  };
  
  const approveAgent = async () => {
    console.log('✅ Agente aprobado:', selectedAgent?.name);
    alert(`Agente "${selectedAgent?.name}" v${selectedAgent?.version} certificado como ACTIVO ✅`);
    setViewMode('list');
    setSelectedAgent(null);
  };
  
  if (!isOpen) return null;
  
  const canEvaluate = ['admin', 'expert', 'agent_reviewer', 'agent_signoff'].some(r => 
    userEmail.includes(r) || userRole === r
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Award className="w-7 h-7 text-purple-600" />
              Evaluaciones de Agentes
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Sistema de calidad y certificación de agentes AI
            </p>
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
          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Overview Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                    <span className="text-2xl font-bold text-slate-900">{agents.length}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Total Agentes</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">
                      {agents.filter(a => a.status === 'active').length}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Activos Certificados</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Loader2 className="w-5 h-5 text-slate-600" />
                    <span className="text-2xl font-bold text-slate-900">
                      {agents.filter(a => a.status === 'testing').length}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">En Testing</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5 text-slate-600" />
                    <span className="text-2xl font-bold text-slate-900">
                      {agents.length > 0 ? (agents.reduce((sum, a) => sum + (a.averageCSAT || 0), 0) / agents.length).toFixed(1) : '0'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">CSAT Promedio</p>
                </div>
              </div>
              
              {/* Agents List */}
              <div className="space-y-3">
                {agents.map(agent => (
                  <div 
                    key={agent.id}
                    className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">{agent.name}</h3>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            v{agent.version}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            agent.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            agent.status === 'testing' ? 'bg-slate-100 text-slate-700' :
                            agent.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {agent.status === 'active' ? '✅ ACTIVO' :
                             agent.status === 'testing' ? '🧪 TESTING' :
                             agent.status === 'approved' ? '✓ APROBADO' :
                             agent.status}
                          </span>
                          {agent.model === 'gemini-2.5-pro' ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Pro
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Flash
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          // TODO: Check if agent has configuration
                          setViewMode('precheck');
                        }}
                        disabled={!canEvaluate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Evaluar Agente
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {/* Evaluations */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">Evaluaciones</span>
                          <span className="text-lg font-bold text-slate-900">{agent.totalEvaluations}</span>
                        </div>
                        {agent.lastEvaluationScore && (
                          <>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-slate-600">Última:</span>
                              <span className={`font-bold ${
                                agent.lastEvaluationScore >= agent.acceptanceThreshold 
                                  ? 'text-blue-600' 
                                  : 'text-slate-700'
                              }`}>
                                {agent.lastEvaluationScore}%
                              </span>
                            </div>
                            <div className="mt-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  agent.lastEvaluationScore >= agent.acceptanceThreshold
                                    ? 'bg-blue-600'
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${agent.lastEvaluationScore}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* User Feedback */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">Feedback Usuarios</span>
                          <span className="text-lg font-bold text-slate-900">{agent.totalFeedback}</span>
                        </div>
                        {agent.averageCSAT && (
                          <>
                            <div className="mt-2 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= Math.round(agent.averageCSAT!)
                                      ? 'fill-blue-600 text-blue-600'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-sm font-bold text-slate-900">
                                {agent.averageCSAT.toFixed(1)}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-5 gap-0.5">
                              {[5, 4, 3, 2, 1].map(rating => {
                                const count = agent.feedbackDistribution?.[rating as keyof typeof agent.feedbackDistribution] || 0;
                                const percentage = agent.totalFeedback > 0 ? (count / agent.totalFeedback) * 100 : 0;
                                return (
                                  <div key={rating} className="text-center">
                                    <div className="h-8 bg-slate-200 rounded-t flex items-end">
                                      <div 
                                        className="w-full bg-blue-600 rounded-t"
                                        style={{ height: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] text-slate-600">{rating}★</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Acceptance Criteria */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-blue-700">Criterio Aceptación</span>
                          <span className="text-lg font-bold text-blue-900">{agent.acceptanceThreshold}%</span>
                        </div>
                        <div className="mt-2 space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tests:</span>
                            <span className="font-semibold text-slate-800">{agent.testCasesCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            {agent.lastEvaluationScore && (
                              <span className={`font-semibold ${
                                agent.lastEvaluationScore >= agent.acceptanceThreshold
                                  ? 'text-blue-600'
                                  : 'text-slate-700'
                              }`}>
                                {agent.lastEvaluationScore >= agent.acceptanceThreshold ? '✅ PASA' : '❌ NO PASA'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Pre-Check View - Before Running Evaluation */}
          {viewMode === 'precheck' && selectedAgent && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Configuración de Evaluación
                  </h3>
                  <p className="text-slate-600">
                    {selectedAgent.name} v{selectedAgent.version}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedAgent(null);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ← Volver
                </button>
              </div>
              
              {/* Check if configured */}
              {!hasConfiguration ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-red-900 mb-2">
                        ⚠️ Agente No Configurado
                      </h4>
                      <p className="text-slate-700 mb-4">
                        Este agente no tiene configuración de evaluación. Necesitas configurarlo primero para poder ejecutar evaluaciones.
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        <strong>Requerido:</strong> Documento con caso de negocio, criterios de aceptación, ejemplos de entradas/salidas esperadas.
                      </p>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          alert('Abre "Configurar Agente" desde el header del chat para este agente');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ir a Configuración
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Evaluation Overview */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      🎯 Proceso de Evaluación
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Qué se Evaluará:</p>
                        <ul className="space-y-2 text-sm text-slate-700">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>Tests a Ejecutar:</strong> {selectedAgent.testCasesCount} casos de prueba</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>Criterios:</strong> Precisión, Claridad, Velocidad, Completitud</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>Modelo:</strong> {selectedAgent.model}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>Tiempo Estimado:</strong> ~{(selectedAgent.testCasesCount * 0.8).toFixed(0)} segundos</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Criterio de Aceptación:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">Score Mínimo:</p>
                              <div className="mt-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-full"
                                  style={{ width: `${selectedAgent.acceptanceThreshold}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">{selectedAgent.acceptanceThreshold}%</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-3">
                            <strong>Si Score ≥ {selectedAgent.acceptanceThreshold}%:</strong> Agente puede ser certificado como ACTIVO
                          </p>
                          <p className="text-xs text-slate-600">
                            <strong>Si Score &lt; {selectedAgent.acceptanceThreshold}%:</strong> Se generarán recomendaciones de mejora
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-800 mb-2">Costo Estimado de Evaluación:</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-600">
                          <p>• {selectedAgent.testCasesCount} tests × ~1,000 tokens promedio</p>
                          <p>• Modelo: {selectedAgent.model}</p>
                          <p className="mt-1 text-[10px]">
                            Tarifa: {selectedAgent.model === 'gemini-2.5-pro' ? '$1.25/1M input + $10/1M output' : '$0.30/1M input + $2.50/1M output'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Costo Estimado:</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${(selectedAgent.testCasesCount * (selectedAgent.model === 'gemini-2.5-pro' ? 0.015 : 0.003)).toFixed(3)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Previous Evaluations */}
                  {selectedAgent.totalEvaluations > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="text-lg font-bold text-slate-800 mb-3">
                        📜 Evaluaciones Anteriores ({selectedAgent.totalEvaluations})
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">Última Evaluación</p>
                              <p className="text-xs text-slate-600">
                                {selectedAgent.lastEvaluationDate?.toLocaleDateString('es-ES', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">Score:</p>
                              <p className={`text-2xl font-bold ${
                                (selectedAgent.lastEvaluationScore || 0) >= selectedAgent.acceptanceThreshold
                                  ? 'text-blue-600'
                                  : 'text-slate-700'
                              }`}>
                                {selectedAgent.lastEvaluationScore}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${
                                (selectedAgent.lastEvaluationScore || 0) >= selectedAgent.acceptanceThreshold
                                  ? 'bg-blue-600'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${selectedAgent.lastEvaluationScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setViewMode('list');
                        setSelectedAgent(null);
                      }}
                      className="px-6 py-3 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={() => runEvaluation(selectedAgent)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Evaluación
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Evaluation Progress View */}
          {viewMode === 'evaluate' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Ejecutando Evaluación
                </h3>
                <p className="text-slate-600">
                  {selectedAgent?.name} v{selectedAgent?.version}
                </p>
              </div>
              
              <div className="bg-white border-2 border-blue-300 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-slate-800">
                    Test {currentTest} de {totalTests}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {evaluationProgress.toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${evaluationProgress}%` }}
                  />
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-600 mb-1">Generando entrada de prueba...</p>
                    <p className="text-xs text-slate-500">
                      Basado en configuración del agente
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-600 mb-1">Evaluando respuesta...</p>
                    <p className="text-xs text-slate-500">
                      Comparando con criterios de aceptación
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm text-slate-500">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimado: {Math.ceil((totalTests - currentTest) * 0.8)} segundos restantes
              </div>
            </div>
          )}
          
          {/* Results View */}
          {viewMode === 'results' && evaluationResults && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className={`border-2 rounded-xl p-6 ${
                evaluationResults.recommendation === 'approve'
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      {evaluationResults.recommendation === 'approve' ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-blue-600" />
                          <span className="text-blue-900">✅ Agente APROBADO</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-8 h-8 text-slate-600" />
                          <span className="text-slate-900">⚠️ Requiere Mejoras</span>
                        </>
                      )}
                    </h3>
                    <p className="text-lg text-slate-700">
                      Score: <span className="font-bold text-2xl">{evaluationResults.overallScore}%</span>
                      <span className="text-sm ml-2">
                        (Umbral: {selectedAgent?.acceptanceThreshold}%)
                      </span>
                    </p>
                  </div>
                  
                  {evaluationResults.recommendation === 'approve' && canEvaluate && (
                    <button
                      onClick={approveAgent}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Award className="w-5 h-5" />
                      Certificar como ACTIVO
                    </button>
                  )}
                </div>
              </div>
              
              {/* Test Results Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ThumbsUp className="w-5 h-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-900">
                      {evaluationResults.passedTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tests Aprobados</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {((evaluationResults.passedTests / evaluationResults.totalTests) * 100).toFixed(0)}% del total
                  </p>
                </div>
                
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ThumbsDown className="w-5 h-5 text-slate-600" />
                    <span className="text-3xl font-bold text-slate-900">
                      {evaluationResults.failedTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tests Fallidos</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {((evaluationResults.failedTests / evaluationResults.totalTests) * 100).toFixed(0)}% del total
                  </p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-slate-600" />
                    <span className="text-3xl font-bold text-slate-900">
                      {evaluationResults.totalTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Total Ejecutados</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Según configuración
                  </p>
                </div>
              </div>
              
              {/* Criteria Scores */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Score por Criterio
                </h4>
                <div className="space-y-3">
                  {Object.entries(evaluationResults.criteriaScores).map(([criterion, score]: [string, any]) => (
                    <div key={criterion}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 capitalize">{criterion}</span>
                        <span className={`font-bold ${
                          score >= 85 ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            score >= 85 ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommendations */}
              {evaluationResults.recommendation === 'improve' && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                    💡 Recomendaciones para Mejorar
                  </h4>
                  <ul className="space-y-2">
                    {evaluationResults.suggestedChanges.map((change: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 font-bold">→</span>
                        <span className="text-slate-700">{change}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-white border border-orange-200 rounded-lg">
                    <p className="text-xs font-semibold text-orange-800 mb-2">
                      Próximos Pasos:
                    </p>
                    <ol className="text-xs text-slate-700 space-y-1 ml-4 list-decimal">
                      <li>Actualizar configuración del agente</li>
                      <li>Crear nueva versión (v{incrementVersion(selectedAgent?.version || '1.0.0')})</li>
                      <li>Ejecutar nueva evaluación</li>
                      <li>Si pasa ≥85%, certificar como ACTIVO</li>
                    </ol>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedAgent(null);
                    setEvaluationResults(null);
                  }}
                  className="px-4 py-2 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ← Volver a Lista
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    className="px-4 py-2 border-2 border-blue-500 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles de Tests
                  </button>
                  
                  {evaluationResults.recommendation === 'improve' && (
                    <button
                      className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Crear Nueva Versión
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function
function incrementVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[1] || '0') + 1;
  return `${parts[0]}.${minor}.0`;
}

