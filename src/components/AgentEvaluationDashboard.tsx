import { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Play,
  CheckCircle, 
  XCircle,
  AlertTriangle,
  AlertCircle,
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
  Settings,
  FileText
} from 'lucide-react';

interface AgentConfig {
  businessCase?: string;
  acceptanceCriteria?: string;
  testExamples?: Array<{
    input: string;
    expectedOutput: string;
    category: string;
  }>;
  systemPrompt?: string;
  model?: string;
}

interface Agent {
  id: string;
  name?: string;
  title?: string;
  status?: string;
}

interface TestResult {
  id: string;
  testNumber: number;
  category: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  score?: number;
  executionTime?: number;
  criteriaScores?: {
    precision: number;
    clarity: number;
    completeness: number;
    relevance: number;
  };
  feedback?: string;
  timestamp?: Date;
  evaluatedBy?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userRole: string;
  conversations: Agent[];
  onNavigateToAgent: (agentId: string) => void;
}

export default function AgentEvaluationDashboard({ isOpen, onClose, userEmail, userRole, conversations, onNavigateToAgent }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'precheck' | 'evaluate' | 'results'>('list');
  const [agentConfigStatus, setAgentConfigStatus] = useState<Record<string, boolean>>({});
  
  const activeAgents = conversations.filter(c => c.status !== 'archived');
  
  // Load configuration status for all agents
  useEffect(() => {
    if (isOpen && activeAgents.length > 0) {
      checkAgentConfigurations();
    }
  }, [isOpen, activeAgents.length]);
  
  const checkAgentConfigurations = async () => {
    const statusMap: Record<string, boolean> = {};
    
    for (const agent of activeAgents) {
      try {
        const response = await fetch(`/api/agent-config?conversationId=${agent.id}`);
        if (response.ok) {
          const config = await response.json();
          statusMap[agent.id] = !!(config.testExamples && config.testExamples.length > 0);
        } else {
          statusMap[agent.id] = false;
        }
      } catch (error) {
        console.error('Error checking config for agent:', agent.id, error);
        statusMap[agent.id] = false;
      }
    }
    
    setAgentConfigStatus(statusMap);
  };
  
  // Load agent configuration
  const loadAgentConfig = async (agentId: string) => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch(`/api/agent-config?conversationId=${agentId}`);
      if (response.ok) {
        const config = await response.json();
        setAgentConfig(config);
        return config;
      } else {
        setAgentConfig(null);
        return null;
      }
    } catch (error) {
      console.error('Error loading agent config:', error);
      setAgentConfig(null);
      return null;
    } finally {
      setIsLoadingConfig(false);
    }
  };
  
  // Select agent and load config
  const selectAgent = async (agent: Agent) => {
    setSelectedAgent(agent);
    const config = await loadAgentConfig(agent.id);
    
    if (!config || !config.testExamples || config.testExamples.length === 0) {
      setViewMode('precheck');
      return;
    }
    
    // Initialize test results from config
    const initialTests: TestResult[] = config.testExamples.map((example: any, idx: number) => ({
      id: `test-${idx + 1}`,
      testNumber: idx + 1,
      category: example.category,
      input: example.input,
      expectedOutput: example.expectedOutput,
      status: 'pending' as const
    }));
    
    setTestResults(initialTests);
    setViewMode('precheck');
  };
  
  // Run evaluation with real Gemini API
  const runEvaluation = async () => {
    if (!selectedAgent || !agentConfig || testResults.length === 0) return;
    
    setIsRunningEvaluation(true);
    setViewMode('evaluate');
    setCurrentTestIndex(0);
    
    // Load agent context
    let agentContext = '';
    try {
      const contextResponse = await fetch(`/api/conversation-context?conversationId=${selectedAgent.id}`);
      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        if (contextData.activeContextSourceIds && contextData.activeContextSourceIds.length > 0) {
          // Load active context sources
          const sourcesResponse = await fetch(`/api/context-sources?userId=${userEmail}`);
          if (sourcesResponse.ok) {
            const sources = await sourcesResponse.json();
            const activeSources = sources.filter((s: any) => 
              contextData.activeContextSourceIds.includes(s.id)
            );
            agentContext = activeSources
              .map((s: any) => `=== ${s.name} ===\n${s.extractedData || ''}`)
              .join('\n\n');
          }
        }
      }
    } catch (error) {
      console.warn('Could not load agent context:', error);
    }
    
    // Run tests sequentially
    for (let i = 0; i < testResults.length; i++) {
      setCurrentTestIndex(i);
      const test = testResults[i];
      
      // Update status to running
      setTestResults(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'running' as const } : t
      ));
      
      const startTime = Date.now();
      
      try {
        // Call evaluation API
        const response = await fetch('/api/evaluate-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            agentContext,
            systemPrompt: agentConfig.systemPrompt || '',
            model: agentConfig.model || 'gemini-2.5-flash',
            testInput: test.input,
            expectedOutput: test.expectedOutput,
            acceptanceCriteria: agentConfig.acceptanceCriteria || '',
            category: test.category
          })
        });
        
        const executionTime = Date.now() - startTime;
        
        if (response.ok) {
          const result = await response.json();
          
          // Update test with results
          setTestResults(prev => prev.map((t, idx) => 
            idx === i ? {
              ...t,
              actualOutput: result.agentResponse,
              passed: result.passed,
              score: result.score,
              executionTime,
              criteriaScores: result.criteriaScores,
              feedback: result.feedback,
              timestamp: new Date(),
              evaluatedBy: userEmail,
              status: 'completed' as const
            } : t
          ));
        } else {
          // Handle error
          setTestResults(prev => prev.map((t, idx) => 
            idx === i ? {
              ...t,
              status: 'error' as const,
              error: 'Error al ejecutar test',
              executionTime: Date.now() - startTime
            } : t
          ));
        }
      } catch (error) {
        console.error('Error running test:', error);
        setTestResults(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Error desconocido',
            executionTime: Date.now() - startTime
          } : t
        ));
      }
    }
    
    setIsRunningEvaluation(false);
    setViewMode('results');
  };
  
  // Calculate overall results
  const calculateOverallResults = () => {
    const completedTests = testResults.filter(t => t.status === 'completed');
    if (completedTests.length === 0) return null;
    
    const passedTests = completedTests.filter(t => t.passed);
    const failedTests = completedTests.filter(t => !t.passed);
    
    const overallScore = completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / completedTests.length;
    
    const criteriaScores = {
      precision: completedTests.reduce((sum, t) => sum + (t.criteriaScores?.precision || 0), 0) / completedTests.length,
      clarity: completedTests.reduce((sum, t) => sum + (t.criteriaScores?.clarity || 0), 0) / completedTests.length,
      completeness: completedTests.reduce((sum, t) => sum + (t.criteriaScores?.completeness || 0), 0) / completedTests.length,
      relevance: completedTests.reduce((sum, t) => sum + (t.criteriaScores?.relevance || 0), 0) / completedTests.length
    };
    
    return {
      totalTests: completedTests.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      overallScore: Math.round(overallScore),
      criteriaScores,
      recommendation: overallScore >= 85 ? 'approve' : 'improve'
    };
  };
  
  const overallResults = calculateOverallResults();
  
  const canEvaluate = ['admin', 'expert', 'agent_reviewer', 'agent_signoff'].some(r => 
    userEmail.includes(r) || userRole === r
  );
  
  if (!isOpen) return null;
  
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
              Sistema de evaluación automatizada con Gemini AI
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
          {/* Agent List */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  📋 Selecciona un Agente para Evaluar
                </h3>
                <p className="text-sm text-slate-700">
                  La evaluación utilizará <strong>Gemini 2.5 Flash</strong> como evaluador automatizado.
                  Ejecutará 10 tests basados en la configuración del agente.
                </p>
              </div>
              
              <div className="space-y-3">
                {activeAgents.map(agent => {
                  const hasConfig = agentConfigStatus[agent.id] ?? false;
                  
                  return (
                    <div 
                      key={agent.id}
                      className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                              {agent.title || agent.name || 'Agente sin nombre'}
                            </h3>
                            {hasConfig ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Configurado
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin configurar
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1 font-mono text-xs">
                            ID: {agent.id}
                          </p>
                        </div>
                        
                        {hasConfig ? (
                          <button
                            onClick={() => selectAgent(agent)}
                            disabled={!canEvaluate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center gap-2 font-medium"
                          >
                            <Play className="w-4 h-4" />
                            Evaluar
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateToAgent(agent.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium"
                          >
                            <Settings className="w-4 h-4" />
                            Configurar Agente
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Pre-Check View */}
          {viewMode === 'precheck' && selectedAgent && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Configuración de Evaluación
                  </h3>
                  <p className="text-slate-600">{selectedAgent.name}</p>
                </div>
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedAgent(null);
                    setAgentConfig(null);
                    setTestResults([]);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ← Volver
                </button>
              </div>
              
              {isLoadingConfig ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : !agentConfig || !agentConfig.testExamples || agentConfig.testExamples.length === 0 ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-red-900 mb-2">
                        ⚠️ Agente No Configurado
                      </h4>
                      <p className="text-slate-700 mb-4">
                        Este agente no tiene ejemplos de entrada configurados. Se requiere configuración para ejecutar evaluaciones.
                      </p>
                      <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-slate-800 mb-2">Se Requiere:</p>
                        <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                          <li>Caso de negocio del agente</li>
                          <li>Criterios de aceptación</li>
                          <li>Al menos 10 ejemplos de entrada con salidas esperadas</li>
                          <li>System prompt configurado</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          alert('Por favor configura este agente antes de evaluar. Abre el agente y haz click en "Configurar Agente" en el header.');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Ir a Configuración
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Configuration Summary */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      ✅ Agente Configurado
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-slate-800 mb-2">Configuración:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span>Modelo: {agentConfig.model || 'gemini-2.5-flash'}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span>System Prompt: Configurado</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span>Caso de Negocio: Definido</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span>Criterios de Aceptación: Definidos</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-slate-800 mb-2">Tests a Ejecutar:</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">Total de tests:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {testResults.length}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            <p>Categorías:</p>
                            {Array.from(new Set(testResults.map(t => t.category))).map(cat => (
                              <p key={cat} className="ml-2">• {cat}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Test Examples Table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">
                      📝 Ejemplos de Entrada a Utilizar
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">#</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Categoría</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Entrada de Prueba</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Salida Esperada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResults.map((test, idx) => (
                            <tr key={test.id} className={`border-b border-slate-100 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            }`}>
                              <td className="px-4 py-3 font-mono text-slate-600">{test.testNumber}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                  {test.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-800 max-w-md">
                                <div className="line-clamp-2">{test.input}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 max-w-md">
                                <div className="line-clamp-2">{test.expectedOutput}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Evaluation Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <h4 className="text-lg font-bold text-slate-800 mb-3">
                      🤖 Proceso de Evaluación Automatizada
                    </h4>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">1.</span>
                        <span>Se enviará cada pregunta de prueba al agente con su contexto activo</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">2.</span>
                        <span>El agente generará su respuesta usando su configuración</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">3.</span>
                        <span><strong>Gemini 2.5 Flash</strong> evaluará la respuesta contra los criterios de aceptación</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">4.</span>
                        <span>Se asignará un score (0-100%) y se evaluarán 4 criterios: Precisión, Claridad, Completitud, Relevancia</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">5.</span>
                        <span>Se procede con el siguiente test secuencialmente</span>
                      </p>
                    </div>
                    
                    <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
                      <p className="text-xs text-slate-600">
                        <strong>Tiempo estimado:</strong> ~{testResults.length * 3} segundos
                        (cada test toma aproximadamente 3 segundos)
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setViewMode('list');
                        setSelectedAgent(null);
                        setAgentConfig(null);
                        setTestResults([]);
                      }}
                      className="px-6 py-3 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={runEvaluation}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Evaluación ({testResults.length} tests)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Evaluation Progress View */}
          {viewMode === 'evaluate' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Ejecutando Evaluación
                </h3>
                <p className="text-slate-600">
                  {selectedAgent?.title || selectedAgent?.name}
                </p>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-slate-800">
                    Test {currentTestIndex + 1} de {testResults.length}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(((currentTestIndex + 1) / testResults.length) * 100)}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-4">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentTestIndex + 1) / testResults.length) * 100}%` }}
                  />
                </div>
                
                <div className="text-sm text-slate-700 bg-white rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold mb-2">
                    Evaluando: {testResults[currentTestIndex]?.category}
                  </p>
                  <p className="text-slate-600">
                    {testResults[currentTestIndex]?.input}
                  </p>
                </div>
              </div>
              
              {/* Progressive Test Results */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4">
                  📊 Progreso de Tests
                </h4>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {testResults.map((test, idx) => (
                    <div 
                      key={test.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        test.status === 'completed' && test.passed 
                          ? 'border-blue-200 bg-blue-50' 
                          : test.status === 'completed' && !test.passed
                          ? 'border-red-200 bg-red-50'
                          : test.status === 'running'
                          ? 'border-blue-400 bg-blue-100'
                          : test.status === 'error'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {test.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                          {test.status === 'running' && (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          )}
                          {test.status === 'completed' && test.passed && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                          {test.status === 'completed' && !test.passed && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {test.status === 'error' && (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800">
                              Test #{test.testNumber} - {test.category}
                            </p>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {test.input}
                            </p>
                          </div>
                        </div>
                        
                        {test.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-800">
                              {test.score}%
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              test.passed 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-red-600 text-white'
                            }`}>
                              {test.passed ? '✅ PASÓ' : '❌ FALLÓ'}
                            </span>
                          </div>
                        )}
                        
                        {test.status === 'running' && (
                          <span className="text-sm font-semibold text-blue-600">
                            Evaluando...
                          </span>
                        )}
                        
                        {test.status === 'error' && (
                          <span className="text-sm font-semibold text-orange-600">
                            Error
                          </span>
                        )}
                      </div>
                      
                      {/* Show feedback for completed tests */}
                      {test.status === 'completed' && test.feedback && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-600 mb-1">Evaluación:</p>
                          <p className="text-sm text-slate-700">{test.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Results View */}
          {viewMode === 'results' && overallResults && (
            <div className="space-y-6">
              {/* Overall Result */}
              <div className={`border-2 rounded-xl p-6 ${
                overallResults.recommendation === 'approve'
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-orange-50 border-orange-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      {overallResults.recommendation === 'approve' ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-blue-600" />
                          <span className="text-blue-900">✅ Agente APROBADO</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-8 h-8 text-orange-600" />
                          <span className="text-orange-900">⚠️ Requiere Mejoras</span>
                        </>
                      )}
                    </h3>
                    <p className="text-lg text-slate-700">
                      Score: <span className="font-bold text-2xl">{overallResults.overallScore}%</span>
                      <span className="text-sm ml-2">(Umbral: 85%)</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Test Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ThumbsUp className="w-5 h-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-900">
                      {overallResults.passedTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tests Aprobados</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {Math.round((overallResults.passedTests / overallResults.totalTests) * 100)}% del total
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <span className="text-3xl font-bold text-red-900">
                      {overallResults.failedTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tests Fallidos</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {Math.round((overallResults.failedTests / overallResults.totalTests) * 100)}% del total
                  </p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-slate-600" />
                    <span className="text-3xl font-bold text-slate-900">
                      {overallResults.totalTests}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Total Ejecutados</p>
                </div>
              </div>
              
              {/* Criteria Scores */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Score por Criterio
                </h4>
                <div className="space-y-3">
                  {Object.entries(overallResults.criteriaScores).map(([criterion, score]: [string, any]) => (
                    <div key={criterion}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {criterion === 'precision' ? 'Precisión' :
                           criterion === 'clarity' ? 'Claridad' :
                           criterion === 'completeness' ? 'Completitud' :
                           criterion === 'relevance' ? 'Relevancia' : criterion}
                        </span>
                        <span className={`font-bold ${
                          score >= 85 ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {Math.round(score)}%
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
              
              {/* Individual Test Results */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4">
                  🔍 Resultados Detallados por Test
                </h4>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {testResults.filter(t => t.status === 'completed').map((test) => (
                    <details 
                      key={test.id}
                      className={`group border-2 rounded-xl overflow-hidden transition-all ${
                        test.passed 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <summary className="cursor-pointer p-4 hover:bg-white transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {test.passed ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">
                                Test #{test.testNumber} - {test.category}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {test.timestamp?.toLocaleTimeString('es-ES')} • {test.executionTime}ms
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              test.passed 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {test.score}%
                            </span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              test.passed 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-red-600 text-white'
                            }`}>
                              {test.passed ? '✅ PASÓ' : '❌ FALLÓ'}
                            </span>
                          </div>
                        </div>
                      </summary>
                      
                      <div className="border-t-2 border-slate-200 bg-white p-5 space-y-4">
                        {/* Test Input */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" />
                            ENTRADA DEL TEST:
                          </p>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-sm text-slate-800">{test.input}</p>
                          </div>
                        </div>
                        
                        {/* Expected Output */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" />
                            SALIDA ESPERADA:
                          </p>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-sm text-slate-700">{test.expectedOutput}</p>
                          </div>
                        </div>
                        
                        {/* Actual Output */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            RESPUESTA DEL AGENTE:
                          </p>
                          <div className={`border rounded-lg p-3 ${
                            test.passed 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap">
                              {test.actualOutput}
                            </p>
                          </div>
                        </div>
                        
                        {/* Criteria Breakdown */}
                        {test.criteriaScores && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                              <BarChart3 className="w-3.5 h-3.5" />
                              EVALUACIÓN POR CRITERIO:
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(test.criteriaScores).map(([criterion, score]: [string, any]) => (
                                <div key={criterion} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-slate-700">
                                      {criterion === 'precision' ? 'Precisión' :
                                       criterion === 'clarity' ? 'Claridad' :
                                       criterion === 'completeness' ? 'Completitud' :
                                       criterion === 'relevance' ? 'Relevancia' : criterion}
                                    </span>
                                    <span className={`text-lg font-bold ${
                                      score >= 85 ? 'text-blue-600' : 'text-slate-600'
                                    }`}>
                                      {score}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
                        )}
                        
                        {/* Feedback */}
                        {test.feedback && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                              💬 RETROALIMENTACIÓN:
                            </p>
                            <div className={`border rounded-lg p-3 ${
                              test.passed 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-orange-50 border-orange-200'
                            }`}>
                              <p className={`text-sm font-medium ${
                                test.passed ? 'text-blue-800' : 'text-orange-800'
                              }`}>
                                {test.feedback}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                          <div className="text-xs">
                            <p className="text-slate-500">Ejecutado:</p>
                            <p className="font-semibold text-slate-700">
                              {test.timestamp?.toLocaleString('es-ES')}
                            </p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-500">Evaluado por:</p>
                            <p className="font-semibold text-slate-700">{test.evaluatedBy}</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-500">Tiempo:</p>
                            <p className="font-semibold text-slate-700">{test.executionTime}ms</p>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSelectedAgent(null);
                    setTestResults([]);
                  }}
                  className="px-6 py-3 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ← Volver a Lista
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const completedTests = testResults.filter(t => t.status === 'completed');
                      const data = JSON.stringify({
                        agent: {
                          id: selectedAgent?.id,
                          name: selectedAgent?.title || selectedAgent?.name
                        },
                        evaluationDate: new Date().toISOString(),
                        overallResults,
                        detailedTests: completedTests
                      }, null, 2);
                      
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `evaluacion-${selectedAgent?.title || selectedAgent?.name || 'agente'}-${new Date().toISOString()}.json`;
                      a.click();
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Exportar Resultados
                  </button>
                  
                  {overallResults.recommendation === 'approve' && (
                    <button
                      onClick={async () => {
                        const agentName = selectedAgent?.title || selectedAgent?.name || 'este agente';
                        if (confirm(`¿Certificar "${agentName}" como ACTIVO?`)) {
                          console.log('✅ Agente certificado:', agentName);
                          alert(`Agente "${agentName}" certificado como ACTIVO ✅`);
                          setViewMode('list');
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Award className="w-5 h-5" />
                      Certificar como ACTIVO
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
