import { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Star,
  Users as UsersIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  GitBranch,
  Activity,
  Globe
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface AgentAnalytics {
  agentId: string;
  agentName: string;
  currentVersion: string;
  
  // Conversations
  totalConversations: number;
  activeUsers: number;
  queriesPerDay: number;
  
  // User Feedback
  csatByVersion: {
    version: string;
    averageCSAT: number;
    totalFeedback: number;
    date: Date;
    feedbackItems: UserFeedbackItem[];
  }[];
  
  // Version History
  versions: AgentVersionInfo[];
  
  // Trends
  csatTrend: {
    date: string;
    csat: number;
    version: string;
  }[];
}

interface UserFeedbackItem {
  id: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  messageId: string;
  userQuestion: string;
  aiResponse: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'implemented';
  priority: 'high' | 'medium' | 'low';
  implementedInVersion?: string;
}

interface AgentVersionInfo {
  version: string;
  releaseDate: Date;
  status: 'active' | 'deprecated' | 'draft';
  changes: string[];
  evaluationScore?: number;
  csatAtRelease?: number;
  totalQueries?: number;
  improvements: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversations: any[];
}

export default function AnalyticsDashboard({ isOpen, onClose, conversations }: Props) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentAnalytics, setAgentAnalytics] = useState<AgentAnalytics | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'pending' | 'high-priority'>('all');
  const [activeTab, setActiveTab] = useState<'agents' | 'domains'>('agents');
  
  // 🆕 Domain Reports State
  const [domainReports, setDomainReports] = useState<{
    activeDomains: Array<{ id: string; name: string; userCount: number; createdDate: string; createdBy: string }>;
    userDomainAssignments: Array<{ email: string; name: string; role: string; domain: string; domainStatus: string }>;
    domainStats: Array<{ domain: string; name: string; userCount: number; status: string }>;
  } | null>(null);
  const [loadingDomainReports, setLoadingDomainReports] = useState(false);
  
  useEffect(() => {
    if (isOpen && selectedAgentId) {
      loadAgentAnalytics(selectedAgentId);
    }
  }, [isOpen, selectedAgentId]);
  
  useEffect(() => {
    if (isOpen && activeTab === 'domains') {
      loadDomainReports();
    }
  }, [isOpen, activeTab]);
  
  const loadDomainReports = async () => {
    try {
      setLoadingDomainReports(true);
      const response = await fetch('/api/analytics/domain-reports');
      if (response.ok) {
        const data = await response.json();
        setDomainReports(data);
      } else {
        console.error('Failed to load domain reports');
      }
    } catch (error) {
      console.error('Error loading domain reports:', error);
    } finally {
      setLoadingDomainReports(false);
    }
  };
  
  const loadAgentAnalytics = async (agentId: string) => {
    // Mock data - replace with real API
    const agent = conversations.find(c => c.id === agentId);
    if (!agent) return;
    
    setAgentAnalytics({
      agentId: agent.id,
      agentName: agent.title,
      currentVersion: '1.2.0',
      totalConversations: 523,
      activeUsers: 38,
      queriesPerDay: 52,
      csatByVersion: [
        {
          version: '1.0.0',
          averageCSAT: 3.8,
          totalFeedback: 145,
          date: new Date('2024-09-01'),
          feedbackItems: []
        },
        {
          version: '1.1.0',
          averageCSAT: 4.3,
          totalFeedback: 234,
          date: new Date('2024-09-15'),
          feedbackItems: []
        },
        {
          version: '1.2.0',
          averageCSAT: 4.6,
          totalFeedback: 287,
          date: new Date('2024-10-01'),
          feedbackItems: [
            {
              id: '1',
              userId: 'user1',
              userName: 'Juan Pérez',
              rating: 5,
              comment: 'Excelente, muy preciso y rápido',
              messageId: 'msg1',
              userQuestion: '¿Precio del producto X?',
              aiResponse: 'El producto X cuesta $50 USD...',
              createdAt: new Date('2024-10-14'),
              status: 'reviewed',
              priority: 'low',
            },
            {
              id: '2',
              userId: 'user2',
              userName: 'María González',
              rating: 2,
              comment: 'Respuesta muy larga y lenta',
              messageId: 'msg2',
              userQuestion: 'Disponibilidad modelo Y?',
              aiResponse: 'El modelo Y está disponible en...',
              createdAt: new Date('2024-10-13'),
              status: 'pending',
              priority: 'high',
              implementedInVersion: undefined
            }
          ]
        }
      ],
      versions: [
        {
          version: '1.2.0',
          releaseDate: new Date('2024-10-01'),
          status: 'active',
          changes: ['Optimizado tiempo respuesta', 'Mejorada citación de fuentes'],
          evaluationScore: 92,
          csatAtRelease: 4.6,
          totalQueries: 523,
          improvements: ['30% más rápido', 'Citas en 100% de respuestas']
        },
        {
          version: '1.1.0',
          releaseDate: new Date('2024-09-15'),
          status: 'deprecated',
          changes: ['Ajustado tono', 'Reducida verbosidad'],
          evaluationScore: 85,
          csatAtRelease: 4.3,
          totalQueries: 234,
          improvements: ['Respuestas más concisas']
        },
        {
          version: '1.0.0',
          releaseDate: new Date('2024-09-01'),
          status: 'deprecated',
          changes: ['Versión inicial'],
          evaluationScore: 78,
          csatAtRelease: 3.8,
          totalQueries: 145,
          improvements: []
        }
      ],
      csatTrend: [
        { date: '2024-09-01', csat: 3.8, version: '1.0.0' },
        { date: '2024-09-08', csat: 3.9, version: '1.0.0' },
        { date: '2024-09-15', csat: 4.3, version: '1.1.0' },
        { date: '2024-09-22', csat: 4.4, version: '1.1.0' },
        { date: '2024-09-29', csat: 4.4, version: '1.1.0' },
        { date: '2024-10-01', csat: 4.6, version: '1.2.0' },
        { date: '2024-10-08', csat: 4.7, version: '1.2.0' },
        { date: '2024-10-15', csat: 4.6, version: '1.2.0' },
      ]
    });
  };
  
  if (!isOpen) return null;
  
  const currentVersionData = agentAnalytics?.csatByVersion[agentAnalytics.csatByVersion.length - 1];
  const pendingFeedback = currentVersionData?.feedbackItems.filter(f => f.status === 'pending') || [];
  const highPriorityFeedback = currentVersionData?.feedbackItems.filter(f => f.priority === 'high') || [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-blue-600" />
                Advanced Analytics
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Métricas, feedback, dominios y usuarios
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveTab('agents'); setSelectedAgentId(null); }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'agents'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Analíticas por Agente
            </button>
            <button
              onClick={() => { setActiveTab('domains'); setSelectedAgentId(null); }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'domains'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Domain Reports
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'domains' ? (
            /* Domain Reports Tab */
            <DomainReportsSection 
              reports={domainReports}
              loading={loadingDomainReports}
            />
          ) : !selectedAgentId ? (
            /* Agent Selection */
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Selecciona un Agente para Ver Analíticas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {conversations.filter(c => c.status !== 'archived').map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{agent.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Ver analíticas →</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : agentAnalytics && (
            /* Analytics View */
            <div className="space-y-6">
              {/* Header with Agent Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {agentAnalytics.agentName}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Versión Actual: <strong className="text-blue-600">v{agentAnalytics.currentVersion}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {agentAnalytics.activeUsers} usuarios activos
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgentId(null)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ← Volver a Lista
                </button>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {agentAnalytics.totalConversations}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Conversaciones</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-400">
                      {currentVersionData?.averageCSAT.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">CSAT v{agentAnalytics.currentVersion}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {agentAnalytics.queriesPerDay}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Queries/Día</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <UsersIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {agentAnalytics.activeUsers}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Usuarios Activos</p>
                </div>
              </div>
              
              {/* CSAT Trend Chart */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Evolución de CSAT por Versión
                </h4>
                
                <div className="space-y-2">
                  {agentAnalytics.csatTrend.map((point, idx) => {
                    const maxCSAT = 5;
                    const barWidth = (point.csat / maxCSAT) * 100;
                    const isVersionChange = idx > 0 && point.version !== agentAnalytics.csatTrend[idx - 1].version;
                    
                    return (
                      <div key={idx}>
                        {isVersionChange && (
                          <div className="flex items-center gap-2 my-3 py-2 border-t border-blue-200 dark:border-blue-700">
                            <GitBranch className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-blue-600">
                              Nueva Versión: v{point.version}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 dark:text-slate-400 w-20 text-right font-mono">
                            {new Date(point.date).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-8 overflow-hidden relative">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {point.csat.toFixed(1)} ★
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 w-12 font-mono">
                            v{point.version}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {currentVersionData && currentVersionData.averageCSAT < 4 && (
                  <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900 dark:text-amber-400 mb-1">
                          ⚠️ CSAT Bajo - Solicitar Feedback Activo
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          Este agente tiene CSAT inferior a 4.0. Se recomienda solicitar feedback explícito a los usuarios 
                          para identificar áreas de mejora y planear próxima iteración.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Version Roadmap */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  Roadmap de Versiones
                </h4>
                
                <div className="space-y-4">
                  {agentAnalytics.versions.map((version, idx) => (
                    <div 
                      key={version.version}
                      className={`border-l-4 pl-4 ${
                        version.status === 'active' 
                          ? 'border-blue-600' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              v{version.version}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              version.status === 'active' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {version.status === 'active' ? '✅ ACTIVA' : '📦 Deprecated'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {version.releaseDate.toLocaleDateString('es', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          {version.evaluationScore && (
                            <p className="text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Eval:</span>
                              <span className={`ml-1 font-bold ${
                                version.evaluationScore >= 85 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {version.evaluationScore}%
                              </span>
                            </p>
                          )}
                          {version.csatAtRelease && (
                            <p className="text-sm">
                              <span className="text-slate-600 dark:text-slate-400">CSAT:</span>
                              <span className="ml-1 font-bold text-slate-900 dark:text-white">
                                {version.csatAtRelease.toFixed(1)} ★
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <p className="font-semibold mb-1">Cambios:</p>
                        <ul className="ml-4 space-y-0.5">
                          {version.changes.map((change, cidx) => (
                            <li key={cidx} className="flex items-start gap-1.5">
                              <span className="text-blue-600">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {version.improvements.length > 0 && (
                          <>
                            <p className="font-semibold mt-2 mb-1">Mejoras:</p>
                            <ul className="ml-4 space-y-0.5">
                              {version.improvements.map((improvement, iidx) => (
                                <li key={iidx} className="flex items-start gap-1.5">
                                  <span className="text-blue-600">✓</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        
                        {version.totalQueries && (
                          <p className="mt-2 text-slate-500 dark:text-slate-400">
                            {version.totalQueries} queries durante esta versión
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* User Feedback Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    Feedback de Usuarios (v{agentAnalytics.currentVersion})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFeedbackFilter('all')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        feedbackFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Todos ({currentVersionData?.feedbackItems.length || 0})
                    </button>
                    <button
                      onClick={() => setFeedbackFilter('pending')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        feedbackFilter === 'pending'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Pendientes ({pendingFeedback.length})
                    </button>
                    <button
                      onClick={() => setFeedbackFilter('high-priority')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        feedbackFilter === 'high-priority'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Alta Prioridad ({highPriorityFeedback.length})
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(currentVersionData?.feedbackItems || [])
                    .filter(f => {
                      if (feedbackFilter === 'pending') return f.status === 'pending';
                      if (feedbackFilter === 'high-priority') return f.priority === 'high';
                      return true;
                    })
                    .map(feedback => (
                      <div 
                        key={feedback.id}
                        className={`border-2 rounded-lg p-4 ${
                          feedback.priority === 'high'
                            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                            : 'border-slate-200 bg-slate-50 dark:bg-slate-700 dark:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= feedback.rating
                                      ? 'fill-blue-600 text-blue-600'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {feedback.userName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              feedback.priority === 'high'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                            }`}>
                              {feedback.priority === 'high' ? 'ALTA' : feedback.priority.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {feedback.createdAt.toLocaleDateString('es')}
                          </span>
                        </div>
                        
                        {feedback.comment && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 italic">
                            "{feedback.comment}"
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-800 rounded p-2">
                          <div>
                            <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Pregunta:</p>
                            <p className="text-slate-800 dark:text-slate-200">{feedback.userQuestion}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Respuesta:</p>
                            <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                              {feedback.aiResponse}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              feedback.status === 'pending' 
                                ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300' 
                                : feedback.status === 'reviewed'
                                ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                            }`}>
                              {feedback.status === 'pending' ? '📋 Pendiente' :
                               feedback.status === 'reviewed' ? '👁️ Revisado' :
                               '✅ Implementado'}
                            </span>
                            {feedback.implementedInVersion && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                → v{feedback.implementedInVersion}
                              </span>
                            )}
                          </div>
                          
                          {feedback.status === 'pending' && (
                            <button
                              onClick={() => {
                                alert('Marcar como considerado para v1.3.0');
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Considerar para Próxima Versión
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Continuous Improvement Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-6">
                <h4 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2">
                  🔄 Proceso de Mejora Continua
                </h4>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2">1. Feedback de Usuarios</p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <li>• CSAT ratings (1-5 ★)</li>
                      <li>• Comentarios</li>
                      <li>• Issues identificados</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2">2. Evaluación Experta</p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <li>• Tests automáticos</li>
                      <li>• Priorización de feedback</li>
                      <li>• Sugerencias de mejora</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2">3. Nueva Versión</p>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <li>• Implementar cambios</li>
                      <li>• Re-evaluar (≥85%)</li>
                      <li>• Certificar como activa</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold mb-2">Ciclo Actual:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${(currentVersionData?.averageCSAT || 0) / 5 * 100}%` }}
                      />
                    </div>
                    <span className="font-mono font-semibold">
                      {currentVersionData?.averageCSAT.toFixed(1)}/5.0
                    </span>
                  </div>
                  <p className="mt-2 text-[11px]">
                    Target: 4.5 ★ sostenido • 
                    {pendingFeedback.length} feedback pendiente de revisar •
                    Próxima iteración planificada: {pendingFeedback.length >= 10 ? 'Pronto' : 'Cuando se acumule más feedback'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🆕 Domain Reports Section Component
function DomainReportsSection({ 
  reports, 
  loading 
}: { 
  reports: {
    activeDomains: Array<{ id: string; name: string; userCount: number; createdDate: string; createdBy: string }>;
    userDomainAssignments: Array<{ email: string; name: string; role: string; domain: string; domainStatus: string }>;
    domainStats: Array<{ domain: string; name: string; userCount: number; status: string }>;
  } | null;
  loading: boolean;
}) {
  const [selectedReport, setSelectedReport] = useState<'domains' | 'users' | 'stats'>('domains');
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando reportes...</span>
        </div>
      </div>
    );
  }
  
  if (!reports) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-slate-600">No se pudieron cargar los reportes</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
        <button
          onClick={() => setSelectedReport('domains')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            selectedReport === 'domains'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Active Domains ({reports.activeDomains.length})
        </button>
        <button
          onClick={() => setSelectedReport('users')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            selectedReport === 'users'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          User Assignments ({reports.userDomainAssignments.length})
        </button>
        <button
          onClick={() => setSelectedReport('stats')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            selectedReport === 'stats'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Domain Statistics
        </button>
      </div>
      
      {/* Report Content */}
      {selectedReport === 'domains' && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Active Domains
          </h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Domain</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Created By</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Created Date</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {reports.activeDomains.map((domain, idx) => (
                  <tr key={domain.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm text-blue-600">{domain.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{domain.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{domain.createdBy}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{domain.createdDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        domain.userCount > 0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {domain.userCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedReport === 'users' && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            User-Domain Assignments
          </h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Domain</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {reports.userDomainAssignments.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">{user.domain}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">
                        ✅ {user.domainStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedReport === 'stats' && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Domain Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reports.domainStats.slice(0, 3).map(stat => (
              <div key={stat.domain} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-400">
                    {stat.userCount}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{stat.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{stat.domain}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Domain</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">User Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {reports.domainStats.map(stat => (
                  <tr key={stat.domain} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono text-sm text-blue-600">{stat.domain}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{stat.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">
                        {stat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        stat.userCount > 5
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : stat.userCount > 0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {stat.userCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
