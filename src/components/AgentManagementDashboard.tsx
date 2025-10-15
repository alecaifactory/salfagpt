import { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Upload,
  Download,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AgentSetupDoc {
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  extractedData: string;
  agentPurpose: string;
  setupInstructions: string;
  inputExamples: Array<{
    question: string;
    category: string;
  }>;
  correctOutputs: Array<{
    example: string;
    criteria: string;
  }>;
  incorrectOutputs: Array<{
    example: string;
    reason: string;
  }>;
  domainExpert: {
    name: string;
    email: string;
    department: string;
  };
}

interface AgentQualityMetrics {
  overallScore: number; // 0-100
  lastEvaluatedAt: Date;
  evaluationCount: number;
  accuracyScore: number; // % of correct outputs
  responseTimeAvg: number; // ms
  userSatisfaction: number; // 0-5 rating
  evaluationHistory: Array<{
    date: Date;
    score: number;
    evaluator: string;
    notes: string;
  }>;
}

interface TransactionDetail {
  date: Date;
  messageId: string;
  userMessage: string;
  aiResponse: string;
  inputTokens: number;
  outputTokens: number;
  contextTokens: number;
  contextSources: string[];
  cost: number;
  breakdown: {
    model: string;
    provider: string;
    inputRate: string;
    outputRate: string;
    inputTokens: number;
    outputTokens: number;
    contextTokens: number;
    inputCost: number;
    outputCost: number;
  };
}

interface AgentMetrics {
  agentId: string;
  agentTitle: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  conversationCount: number;
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalContextTokens: number;
  totalCost: number;
  contextSourcesCount: number;
  usersWithAccess: string[];
  createdAt: Date;
  lastActivityAt: Date;
  setupDoc?: AgentSetupDoc;
  qualityMetrics?: AgentQualityMetrics;
  usageHistory: Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    contextTokens: number;
    cost: number;
    transactionCount: number;
  }>;
  transactionDetails: TransactionDetail[];
  pricingModel: any;
}

interface Props {
  userId: string;
  onClose: () => void;
}

// Note: Pricing is now managed in /api/agent-metrics API endpoint
// This ensures consistency across the platform and uses official Gemini pricing

export default function AgentManagementDashboard({ userId, onClose }: Props) {
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentMetrics | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [userId]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Loading agent metrics from API...');
      
      // Load agent metrics from API with full transparency
      const response = await fetch(`/api/agent-metrics?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load agent metrics');
      }
      
      const data = await response.json();
      
      // Transform data to ensure dates are Date objects
      const transformedAgents = data.agents.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
        lastActivityAt: new Date(agent.lastActivityAt),
        setupDoc: agent.setupDoc ? {
          ...agent.setupDoc,
          uploadedAt: new Date(agent.setupDoc.uploadedAt),
        } : undefined,
        qualityMetrics: agent.qualityMetrics ? {
          ...agent.qualityMetrics,
          lastEvaluatedAt: new Date(agent.qualityMetrics.lastEvaluatedAt),
        } : undefined,
        transactionDetails: agent.transactionDetails.map((tx: any) => ({
          ...tx,
          date: new Date(tx.date),
        })),
      }));
      
      setAgents(transformedAgents);
      console.log('✅ Loaded', transformedAgents.length, 'agents with full metrics');
    } catch (error) {
      console.error('❌ Error loading agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const handleUploadSetupDoc = async (agentId: string, file: File) => {
    try {
      setUploading(true);
      
      // Step 1: Upload file to extract text
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('type', file.type.includes('pdf') ? 'pdf' : 'document');
      formData.append('agentId', agentId);
      
      const uploadResponse = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to extract document');
      }
      
      const extractedData = await uploadResponse.json();
      
      // Step 2: Use Gemini to parse and structure the setup document
      const parseResponse = await fetch('/api/agent-setup/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          extractedText: extractedData.extractedText,
          fileName: file.name,
          uploadedBy: userId,
        }),
      });
      
      if (!parseResponse.ok) {
        throw new Error('Failed to parse setup document');
      }
      
      const parsedSetup = await parseResponse.json();
      
      // Step 3: Reload agents to show the new setup doc
      await loadAgents();
      
      alert('✅ Setup document uploaded and parsed successfully!');
    } catch (error) {
      console.error('Error uploading setup doc:', error);
      alert('❌ Failed to upload setup doc: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getModelBadge = (model: string) => {
    if (model === 'gemini-2.5-pro') {
      return (
        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-purple-200">
          <Sparkles className="w-4 h-4" />
          <span>Gemini 2.5 Pro</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-green-200">
        <Sparkles className="w-4 h-4" />
        <span>Gemini 2.5 Flash</span>
      </span>
    );
  };

  // Calculate total metrics across all agents
  const totalMetrics = agents.reduce(
    (acc, agent) => ({
      conversations: acc.conversations + agent.conversationCount,
      messages: acc.messages + agent.totalMessages,
      inputTokens: acc.inputTokens + agent.totalInputTokens,
      outputTokens: acc.outputTokens + agent.totalOutputTokens,
      contextTokens: acc.contextTokens + (agent.totalContextTokens || 0),
      cost: acc.cost + agent.totalCost,
    }),
    { conversations: 0, messages: 0, inputTokens: 0, outputTokens: 0, contextTokens: 0, cost: 0 }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Gestión de Agentes</h2>
              <p className="text-sm text-slate-600">
                {agents.length} agentes • {formatNumber(totalMetrics.messages)} mensajes • {formatCurrency(totalMetrics.cost)} total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">Agentes</span>
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{agents.length}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">Mensajes</span>
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(totalMetrics.messages)}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">Tokens In</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(totalMetrics.inputTokens)}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">Tokens Out</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(totalMetrics.outputTokens)}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">Costo Total</span>
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalMetrics.cost)}</p>
          </div>
        </div>

        {/* Agents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Cargando agentes...</p>
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No hay agentes</p>
              <p className="text-sm mt-2">Crea tu primer agente para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => {
                const isExpanded = expandedAgents.has(agent.agentId);
                
                return (
                  <div
                    key={agent.agentId}
                    className="border border-slate-200 rounded-lg bg-white hover:shadow-md transition-all"
                  >
                    {/* Agent Summary Row */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => toggleExpand(agent.agentId)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            <h3 className="text-lg font-semibold text-slate-800 truncate">
                              {agent.agentTitle}
                            </h3>
                            {getModelBadge(agent.model)}
                            
                            {/* Quality Badge */}
                            {agent.qualityMetrics && (
                              <div className="flex items-center gap-1">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                  agent.qualityMetrics.overallScore >= 90 ? 'bg-green-100 text-green-700' :
                                  agent.qualityMetrics.overallScore >= 75 ? 'bg-blue-100 text-blue-700' :
                                  agent.qualityMetrics.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  <CheckCircle className="w-3 h-3" />
                                  Calidad: {agent.qualityMetrics.overallScore}%
                                </div>
                              </div>
                            )}
                            
                            {/* Setup Doc Badge */}
                            {agent.setupDoc && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Configurado
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 ml-8">
                            <div className="flex items-center gap-2 text-sm">
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{agent.totalMessages} mensajes</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{agent.contextSourcesCount} fuentes</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{formatDate(agent.lastActivityAt)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-800">{formatCurrency(agent.totalCost)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Configurar
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column: Metrics */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">Métricas de Uso</h4>
                              <div className="space-y-2 bg-white rounded-lg p-3 border border-slate-200">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Tokens de Entrada:</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {formatNumber(agent.totalInputTokens)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Tokens de Salida:</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {formatNumber(agent.totalOutputTokens)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                  <span className="text-slate-700 font-semibold">Total Tokens:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {formatNumber(agent.totalInputTokens + agent.totalOutputTokens)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                  <span className="text-slate-700 font-semibold">Costo Total:</span>
                                  <span className="font-mono font-bold text-green-600">
                                    {formatCurrency(agent.totalCost)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Pricing Info */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-slate-700">Tarifas del Modelo</h4>
                                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                  v2024-10 • Oct 2024
                                </span>
                              </div>
                              <div className="space-y-2 bg-white rounded-lg p-3 border border-slate-200">
                                <div className="mb-2 pb-2 border-b border-slate-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700">Modelo:</span>
                                    <span className="text-xs font-mono text-slate-900">{agent.model}</span>
                                  </div>
                                </div>
                                {agent.model === 'gemini-2.5-flash' ? (
                                  <>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Input:</span>
                                      <span className="font-mono text-slate-800">$0.30 / 1M tokens</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Output:</span>
                                      <span className="font-mono text-slate-800">$2.50 / 1M tokens</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Input (≤200k):</span>
                                      <span className="font-mono text-slate-800">$1.25 / 1M tokens</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Input ({'>'}200k):</span>
                                      <span className="font-mono text-slate-800">$2.50 / 1M tokens</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Output (≤200k):</span>
                                      <span className="font-mono text-slate-800">$10.00 / 1M tokens</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600">Output ({'>'}200k):</span>
                                      <span className="font-mono text-slate-800">$15.00 / 1M tokens</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: History */}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Historial de Uso</h4>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <div className="max-h-64 overflow-y-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Fecha</th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Input</th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Output</th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Costo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {agent.usageHistory.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                                          No hay historial de uso
                                        </td>
                                      </tr>
                                    ) : (
                                      agent.usageHistory.map((entry, idx) => (
                                        <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                          <td className="px-3 py-2 text-slate-700">{new Date(entry.date).toLocaleDateString('es')}</td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-800">
                                            {formatNumber(entry.inputTokens)}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-800">
                                            {formatNumber(entry.outputTokens)}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-green-600 font-semibold">
                                            {formatCurrency(entry.cost)}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <p className="font-medium">💡 Consejo: Haz clic en un agente para ver más detalles</p>
              <p className="text-xs mt-1">Los costos se calculan en base a las tarifas oficiales de Gemini API</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Agent Details Modal (when agent selected) */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">{selectedAgent.agentTitle}</h2>
                  {getModelBadge(selectedAgent.model)}
                </div>
                <p className="text-sm text-slate-600">
                  Creado {formatDate(selectedAgent.createdAt)} • Última actividad {formatDate(selectedAgent.lastActivityAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Configuration Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Configuración del Agente
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Modelo AI</label>
                      <div className="flex items-center gap-2">
                        {getModelBadge(selectedAgent.model)}
                        <span className="text-sm text-slate-700">
                          {selectedAgent.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Fuentes de Contexto</label>
                      <p className="text-lg font-bold text-slate-800">{selectedAgent.contextSourcesCount} activas</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Usuarios con Acceso</label>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{selectedAgent.usersWithAccess.length} usuario(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Document Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documento de Configuración
                </h3>
                {selectedAgent.setupDoc ? (
                  <div className="space-y-4">
                    {/* File Info Header */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-indigo-800">{selectedAgent.setupDoc.fileName}</p>
                          <p className="text-xs text-indigo-600">
                            Subido {formatDate(selectedAgent.setupDoc.uploadedAt)} por {selectedAgent.setupDoc.uploadedBy}
                          </p>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-700">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Domain Expert */}
                      {selectedAgent.setupDoc.domainExpert && (
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                          <p className="text-xs font-semibold text-indigo-800 mb-1">Experto del Dominio:</p>
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Users className="w-4 h-4" />
                            <span>{selectedAgent.setupDoc.domainExpert.name}</span>
                            <span className="text-indigo-400">•</span>
                            <span>{selectedAgent.setupDoc.domainExpert.email}</span>
                            <span className="text-indigo-400">•</span>
                            <span>{selectedAgent.setupDoc.domainExpert.department}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Agent Purpose */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Propósito del Agente
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedAgent.setupDoc.agentPurpose}
                      </p>
                    </div>

                    {/* Setup Instructions */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">Instrucciones de Configuración</h4>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedAgent.setupDoc.setupInstructions}
                      </p>
                    </div>

                    {/* Input Examples */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Ejemplos de Preguntas de Entrada</h4>
                      <div className="space-y-2">
                        {selectedAgent.setupDoc.inputExamples.map((input, idx) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                            <div className="flex items-start gap-2">
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-semibold">
                                {input.category}
                              </span>
                              <p className="text-sm text-blue-800 flex-1">{input.question}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correct Outputs */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Ejemplos de Salidas Correctas
                      </h4>
                      <div className="space-y-2">
                        {selectedAgent.setupDoc.correctOutputs.map((output, idx) => (
                          <div key={idx} className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-800 mb-2">{output.example}</p>
                            <p className="text-xs text-green-600">
                              <span className="font-semibold">Criterio:</span> {output.criteria}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Incorrect Outputs */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Ejemplos de Salidas Incorrectas
                      </h4>
                      <div className="space-y-2">
                        {selectedAgent.setupDoc.incorrectOutputs.map((output, idx) => (
                          <div key={idx} className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-800 mb-2">{output.example}</p>
                            <p className="text-xs text-red-600">
                              <span className="font-semibold">Razón:</span> {output.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-3">No hay documento de configuración</p>
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Subir Setup Doc
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSetupDoc(selectedAgent.agentId, file);
                        }}
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      Sube un documento con especificaciones, inputs/outputs esperados, y casos de uso
                    </p>
                  </div>
                )}
              </div>

              {/* Usage Chart - Simple visual representation */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Tendencia de Costos
                </h3>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  {selectedAgent.usageHistory.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No hay datos suficientes</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgent.usageHistory.slice(-7).map((entry, idx) => {
                        const maxCost = Math.max(...selectedAgent.usageHistory.map(e => e.cost));
                        const barWidth = maxCost > 0 ? (entry.cost / maxCost) * 100 : 0;
                        
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 w-24 text-right">
                              {new Date(entry.date).toLocaleDateString('es')}
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
                                {formatCurrency(entry.cost)} ({entry.transactionCount} tx)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown by Model */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Desglose de Costos por Modelo
                </h3>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Modelo</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Versión Pricing</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Tokens Input</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Tokens Output</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Tarifa Input</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Tarifa Output</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Costo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {selectedAgent.model === 'gemini-2.5-pro' ? (
                              <>
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="font-semibold text-purple-700">Gemini 2.5 Pro</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-700">Gemini 2.5 Flash</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-800 text-[11px] block">v2024-10-15</span>
                            <span className="text-slate-500 text-[10px]">Effective Oct 15, 2024</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">
                          {selectedAgent.totalInputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">
                          {selectedAgent.totalOutputTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {selectedAgent.model === 'gemini-2.5-flash' ? '$0.30/1M' : '$1.25/1M'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {selectedAgent.model === 'gemini-2.5-flash' ? '$2.50/1M' : '$10.00/1M'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                          {formatCurrency(selectedAgent.totalCost)}
                        </td>
                      </tr>
                      {/* Calculation Details Row */}
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center justify-between text-[10px] text-slate-600">
                            <span className="font-semibold">Cálculo:</span>
                            <span className="font-mono">
                              Input: ({selectedAgent.totalInputTokens.toLocaleString()} ÷ 1M × {selectedAgent.model === 'gemini-2.5-flash' ? '$0.30' : '$1.25'}) + 
                              Output: ({selectedAgent.totalOutputTokens.toLocaleString()} ÷ 1M × {selectedAgent.model === 'gemini-2.5-flash' ? '$2.50' : '$10.00'}) = 
                              <span className="font-bold text-green-600 ml-1">{formatCurrency(selectedAgent.totalCost)}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-800">
                  <p className="font-semibold mb-1">ℹ️ Sobre las tarifas</p>
                  <p>Las tarifas mostradas son las oficiales de Google Gemini vigentes a la fecha indicada. Los precios pueden variar si Google actualiza su modelo de pricing. Siempre usamos la versión más reciente para cálculos.</p>
                </div>
              </div>

              {/* Transaction Transparency - Full Trace */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Trazabilidad de Transacciones
                </h3>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Fecha</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Pregunta</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Contexto Usado</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Tokens In</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Context</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Tokens Out</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Costo</th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-700">Detalles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAgent.transactionDetails && selectedAgent.transactionDetails.length > 0 ? (
                          selectedAgent.transactionDetails.slice(-20).reverse().map((tx, idx) => (
                            <tr key={tx.messageId || idx} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                {tx.date.toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-3 py-2 text-slate-800 max-w-xs truncate">
                                {tx.userMessage}
                              </td>
                              <td className="px-3 py-2">
                                {tx.contextSources.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {tx.contextSources.map((source, sIdx) => (
                                      <span key={sIdx} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                                        {source}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Sin contexto</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-800">
                                {formatNumber(tx.inputTokens)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-indigo-600">
                                {formatNumber(tx.contextTokens)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-800">
                                {formatNumber(tx.outputTokens)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-green-600 font-semibold">
                                {formatCurrency(tx.cost)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    alert(`Detalles de Transacción\n\n` +
                                      `Modelo: ${tx.breakdown.model}\n` +
                                      `Proveedor: ${tx.breakdown.provider}\n\n` +
                                      `Tarifa Input: ${tx.breakdown.inputRate}\n` +
                                      `Tarifa Output: ${tx.breakdown.outputRate}\n\n` +
                                      `Tokens Input: ${formatNumber(tx.breakdown.inputTokens)}\n` +
                                      `Tokens Contexto: ${formatNumber(tx.breakdown.contextTokens)}\n` +
                                      `Tokens Output: ${formatNumber(tx.breakdown.outputTokens)}\n\n` +
                                      `Costo Input: ${formatCurrency(tx.breakdown.inputCost)}\n` +
                                      `Costo Output: ${formatCurrency(tx.breakdown.outputCost)}\n` +
                                      `Costo Total: ${formatCurrency(tx.cost)}\n\n` +
                                      `Fuentes de Contexto:\n${tx.contextSources.join('\n') || 'Ninguna'}`
                                    );
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                              No hay transacciones registradas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {selectedAgent.transactionDetails && selectedAgent.transactionDetails.length > 20 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
                      <p className="text-xs text-slate-600">
                        Mostrando las últimas 20 transacciones de {selectedAgent.transactionDetails.length} totales
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Metrics Section */}
              {selectedAgent.qualityMetrics && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Métricas de Calidad
                  </h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-600 mb-1">Puntuación General</p>
                        <p className={`text-3xl font-bold ${
                          selectedAgent.qualityMetrics.overallScore >= 90 ? 'text-green-600' :
                          selectedAgent.qualityMetrics.overallScore >= 75 ? 'text-blue-600' :
                          selectedAgent.qualityMetrics.overallScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedAgent.qualityMetrics.overallScore}%
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-600 mb-1">Precisión</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {selectedAgent.qualityMetrics.accuracyScore}%
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-600 mb-1">Satisfacción</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {selectedAgent.qualityMetrics.userSatisfaction.toFixed(1)}/5
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Evaluaciones Realizadas</p>
                        <p className="text-lg font-bold text-slate-800">
                          {selectedAgent.qualityMetrics.evaluationCount}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-slate-600 mb-1">Tiempo de Respuesta Promedio</p>
                        <p className="text-lg font-bold text-slate-800">
                          {selectedAgent.qualityMetrics.responseTimeAvg}ms
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-green-700 text-center">
                      Última evaluación: {formatDate(selectedAgent.qualityMetrics.lastEvaluatedAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // TODO: Navigate to agent configuration
                  alert('Navegación a configuración del agente próximamente');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuración Avanzada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

