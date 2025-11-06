import { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3,
  Globe,
  UsersIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversations: any[];
}

export default function AnalyticsDashboard({ isOpen, onClose, conversations }: Props) {
  
  // 🆕 Domain Reports State
  const [domainReports, setDomainReports] = useState<{
    activeDomains: Array<{ id: string; name: string; userCount: number; createdDate: string; createdBy: string }>;
    userDomainAssignments: Array<{ email: string; name: string; role: string; domain: string; domainStatus: string }>;
    domainStats: Array<{ domain: string; name: string; userCount: number; status: string }>;
  } | null>(null);
  const [loadingDomainReports, setLoadingDomainReports] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      loadDomainReports();
    }
  }, [isOpen]);
  
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
  
  if (!isOpen) return null;
  
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
                Analíticas avanzadas de dominios, usuarios, agentes y conversaciones
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DomainReportsSection 
            reports={domainReports}
            loading={loadingDomainReports}
          />
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
  const [selectedReport, setSelectedReport] = useState<'domains' | 'users' | 'stats' | 'agents'>('domains');
  
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
        <button
          onClick={() => setSelectedReport('agents')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            selectedReport === 'agents'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Agents & Conversations
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
      
      {selectedReport === 'agents' && (
        <AgentsConversationsView />
      )}
    </div>
  );
}

// 🆕 Agents & Conversations View Component
function AgentsConversationsView() {
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'agents' | 'users'>('agents');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/agents-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAgentStats(data.agentStats || []);
        setUserStats(data.userStats || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading agents & conversations data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Cargando analíticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Agentes</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{summary.totalAgents}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Agentes Activos</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.activeAgents}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Usuarios Activos</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{summary.activeUsers}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Mensajes</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{summary.totalMessages}</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Preguntas</p>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{summary.totalQuestions}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Msgs/Agente</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {summary.activeAgents > 0 ? (summary.totalMessages / summary.activeAgents).toFixed(1) : 0}
            </p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg inline-flex">
        <button
          onClick={() => setSelectedView('agents')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            selectedView === 'agents'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Por Agente ({agentStats.length})
        </button>
        <button
          onClick={() => setSelectedView('users')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            selectedView === 'users'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Por Usuario ({userStats.length})
        </button>
      </div>

      {/* Content */}
      {selectedView === 'agents' ? (
        <div className="space-y-3">
          {agentStats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay agentes con actividad</p>
            </div>
          ) : (
            agentStats.map((agent, idx) => (
              <div key={agent.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                        <h5 className="font-bold text-slate-900 dark:text-white">{agent.title}</h5>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Owner: {agent.ownerName} ({agent.ownerEmail})
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Usuarios</p>
                        <p className="text-lg font-bold text-blue-600">{agent.uniqueUsers}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Conversaciones</p>
                        <p className="text-lg font-bold text-green-600">{agent.childConversations}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Mensajes</p>
                        <p className="text-lg font-bold text-purple-600">{agent.totalMessages}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Preguntas</p>
                        <p className="text-lg font-bold text-indigo-600">{agent.totalQuestions}</p>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedId === agent.id && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                    {agent.directMessages > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          📨 Mensajes Directos en el Agente
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {agent.directQuestions} preguntas, {agent.directMessages - agent.directQuestions} respuestas
                        </p>
                      </div>
                    )}

                    {agent.conversations && agent.conversations.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                          💬 Conversaciones ({agent.conversations.length})
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {agent.conversations.map((conv: any, i: number) => (
                            <div key={conv.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 dark:text-white truncate">
                                    {i + 1}. {conv.title}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    👤 {conv.userName} ({conv.userEmail})
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs ml-4">
                                  <div className="text-center">
                                    <p className="text-slate-500">Preguntas</p>
                                    <p className="font-bold text-blue-600">{conv.questionCount}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-slate-500">Total</p>
                                    <p className="font-bold text-purple-600">{conv.messageCount}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {userStats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay usuarios con actividad</p>
            </div>
          ) : (
            userStats.map((user, idx) => (
              <div key={user.userId} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === user.userId ? null : user.userId)}
                  className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white">{user.userName}</h5>
                          <p className="text-xs text-slate-500">{user.userEmail}</p>
                          <p className="text-xs text-slate-500">{user.company}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Agentes</p>
                        <p className="text-lg font-bold text-blue-600">{user.agentsUsed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Conversaciones</p>
                        <p className="text-lg font-bold text-green-600">{user.conversationsCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Preguntas</p>
                        <p className="text-lg font-bold text-indigo-600">{user.totalQuestions}</p>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedId === user.userId && user.topAgents && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      🤖 Agentes Utilizados (Top 10)
                    </p>
                    <div className="space-y-2">
                      {user.topAgents.map((agent: any, i: number) => (
                        <div key={agent.agentId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-400 w-6">{i + 1}.</span>
                            <p className="font-medium text-slate-900 dark:text-white truncate">{agent.agentTitle}</p>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {agent.questionCount} preguntas
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
