import { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users as UsersIcon,
  Clock,
  Activity,
  Download,
  Mail,
  Calendar,
  Filter,
  Globe
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

// Types
interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  assistantFilter: 'all' | string;
  effectivenessFilter: 'all' | 'satisfactory' | 'incomplete';
  domainFilter: 'all' | string;
}

interface KPI {
  label: string;
  value: number;
  change: number; // Percentage change vs previous period
  icon: any;
}

interface ChartData {
  labels: string[];
  values: number[];
}

interface UserActivity {
  email: string;
  messages: number;
  conversations: number;
  lastActive: Date;
}

interface UserDetail {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  company: string;
  department?: string;
  createdAt: Date;
  createdBy?: string;
  lastLoginAt?: Date;
  isActive: boolean;
  // Engagement metrics
  totalMessages: number;
  totalConversations: number;
  assignedAgents: Array<{
    id: string;
    title: string;
    messageCount: number;
    lastUsed: Date;
  }>;
  // Login activity
  loginCount: number;
  lastLogin: Date | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userRole: string;
}

export default function SalfaAnalyticsDashboard({ isOpen, onClose, userId, userEmail, userRole }: Props) {
  // 🔑 Hook para cerrar con ESC (dashboard de pantalla completa)
  const modalRef = useModalClose(isOpen, onClose, false, true, false);

  // Filters state
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days (faster initial load)
      end: new Date()
    },
    assistantFilter: 'all',
    effectivenessFilter: 'all',
    domainFilter: 'all'
  });

  // Data state
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [conversationsOverTime, setConversationsOverTime] = useState<ChartData>({ labels: [], values: [] });
  const [messagesByAssistant, setMessagesByAssistant] = useState<ChartData>({ labels: [], values: [] });
  const [messagesByHour, setMessagesByHour] = useState<ChartData>({ labels: [], values: [] });
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [usersByDomain, setUsersByDomain] = useState<ChartData>({ labels: [], values: [] });
  const [effectivenessStats, setEffectivenessStats] = useState<any>(null);
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; title: string }>>([]);
  
  // User analytics state
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  
  // Progressive loading states
  const [loadingKPIs, setLoadingKPIs] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiInput, setAIInput] = useState('');
  const [aiMessages, setAIMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Load analytics data
  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
      loadUsers();
    }
  }, [isOpen, filters]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/analytics/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            startDate: filters.dateRange.start.toISOString(),
            endDate: filters.dateRange.end.toISOString(),
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserClick = async (user: UserDetail) => {
    setSelectedUser(user);
    setLoadingUserDetails(true);
    
    try {
      const response = await fetch('/api/analytics/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          filters: {
            startDate: filters.dateRange.start.toISOString(),
            endDate: filters.dateRange.end.toISOString(),
          }
        })
      });

      if (response.ok) {
        const detailsData = await response.json();
        // Update selected user with detailed info
        setSelectedUser(prev => prev ? { ...prev, ...detailsData } : null);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const loadAnalyticsData = async () => {
    // Reset all loading states
    setLoadingKPIs(true);
    setLoadingCharts(true);
    setLoadingTables(true);
    
    try {
      const response = await fetch('/api/analytics/salfagpt-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userRole === 'admin' ? undefined : userId,
          filters: {
            startDate: filters.dateRange.start.toISOString(),
            endDate: filters.dateRange.end.toISOString(),
            assistant: filters.assistantFilter !== 'all' ? filters.assistantFilter : undefined,
            effectiveness: filters.effectivenessFilter,
            domain: filters.domainFilter !== 'all' ? filters.domainFilter : undefined,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // ✅ Progressive loading: Update KPIs first (fastest)
        setKpis(data.kpis || []);
        setAvailableAgents(data.availableAgents || []);
        setLoadingKPIs(false);
        
        // ✅ Then update chart data
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for UI update
        setConversationsOverTime(data.conversationsOverTime || { labels: [], values: [] });
        setMessagesByAssistant(data.messagesByAssistant || { labels: [], values: [] });
        setMessagesByHour(data.messagesByHour || { labels: [], values: [] });
        setUsersByDomain(data.usersByDomain || { labels: [], values: [] });
        setLoadingCharts(false);
        
        // ✅ Finally update tables and heavy stats
        await new Promise(resolve => setTimeout(resolve, 50));
        setTopUsers(data.topUsers || []);
        setEffectivenessStats(data.effectivenessStats || null);
        setLoadingTables(false);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoadingKPIs(false);
      setLoadingCharts(false);
      setLoadingTables(false);
    }
  };

  const setQuickDateRange = (days: number | 'all') => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: days === 'all' 
          ? new Date('2020-01-01') // All time (from project start)
          : new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    }));
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters: {
            startDate: filters.dateRange.start.toISOString(),
            endDate: filters.dateRange.end.toISOString(),
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleAIQuery = async () => {
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAIMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAIInput('');

    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      setAIMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Basándome en los datos filtrados actualmente, puedo ayudarte a responder esa pregunta...' 
      }]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-gray-50 rounded-xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analíticas SalfaGPT</h2>
            <p className="text-sm text-gray-500 mt-1">Análisis y métricas de rendimiento de asistentes IA</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('xlsx')}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* RF-02: Filtros Globales */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={filters.dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={filters.dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuickDateRange(7)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Últimos 7 días
                  </button>
                  <button
                    onClick={() => setQuickDateRange(30)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Últimos 30 días
                  </button>
                  <button
                    onClick={() => setQuickDateRange('all')}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Todo el tiempo
                  </button>
                </div>

                {/* Filters */}
                <select
                  value={filters.assistantFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, assistantFilter: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los Agentes</option>
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.title}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.effectivenessFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, effectivenessFilter: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toda la efectividad</option>
                  <option value="satisfactory">Satisfactoria</option>
                  <option value="incomplete">Incompleta</option>
                </select>

                <select
                  value={filters.domainFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, domainFilter: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los Dominios</option>
                  <option value="@salfacorp.cl">@salfacorp.cl</option>
                  <option value="@getaifactory.com">@getaifactory.com</option>
                </select>
              </div>
            </div>

            {/* Always show UI, use skeleton loaders for each section */}
            <>
              {/* RF-03: KPIs */}
              {loadingKPIs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {kpis.map((kpi, idx) => {
                    const IconComponent = 
                      kpi.icon === 'MessageSquare' ? MessageSquare :
                      kpi.icon === 'Activity' ? Activity :
                      kpi.icon === 'Users' ? UsersIcon :
                      kpi.icon === 'Globe' ? Globe :
                      kpi.icon === 'Clock' ? Clock :
                      MessageSquare;
                    
                    return (
                      <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
                          <IconComponent className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {kpi.formatValue ? kpi.formatValue(kpi.value) : kpi.value.toLocaleString()}
                        </p>
                        <p className={`text-xs flex items-center mt-1 ${
                          kpi.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(kpi.change)}% vs período anterior
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Charts Section */}
              {loadingCharts ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                      <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                {/* ✅ Effectiveness Stats Card (if data available) */}
                {effectivenessStats && effectivenessStats.totalRatings > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Estadísticas de Efectividad</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Evaluaciones</p>
                        <p className="text-2xl font-bold text-gray-900">{effectivenessStats.totalRatings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Respuestas Completas</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(effectivenessStats.completeRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fueron Útiles</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(effectivenessStats.helpfulRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Positivas</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {(effectivenessStats.positiveRate * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RF-06: AI Assistant */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <details open={showAIAssistant} onToggle={(e: any) => setShowAIAssistant(e.target.open)}>
                    <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Asistente de IA para Estadísticas
                    </summary>
                    {showAIAssistant && (
                      <div className="mt-6 flex flex-col md:flex-row gap-8">
                        {/* Suggested Questions */}
                        <div className="md:w-1/3">
                          <h4 className="font-semibold mb-3 text-gray-700 text-sm">Sugerencias de Preguntas</h4>
                          <div className="space-y-2">
                            {[
                              '¿Cuál fue el usuario más activo la semana pasada?',
                              '¿Cuál es el horario pico de uso?',
                              '¿Qué asistente tiene mejor tasa de respuesta?'
                            ].map((question, idx) => (
                              <button
                                key={idx}
                                onClick={() => setAIInput(question)}
                                className="w-full text-left text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Interface */}
                        <div className="md:w-2/3 border border-gray-200 rounded-lg flex flex-col h-72">
                          <div className="flex-1 overflow-y-auto p-4">
                            {aiMessages.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center mt-12">
                                Haz una pregunta sobre los datos del panel...
                              </p>
                            ) : (
                              aiMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[80%] p-3 rounded-lg ${
                                    msg.role === 'user'
                                      ? 'bg-blue-100 text-gray-900'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <p className="text-sm">{msg.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="border-t border-gray-200 p-4 flex items-center gap-2">
                            <input
                              type="text"
                              value={aiInput}
                              onChange={(e) => setAIInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAIQuery()}
                              placeholder="Pregunta sobre los datos del panel..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={handleAIQuery}
                              disabled={!aiInput.trim()}
                              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Enviar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </details>
                </div>

                {/* RF-04: Visualizations - First Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* RF-4.1: Activity Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Actividad de Conversaciones</h3>
                    <p className="text-sm text-gray-500 mb-4">Número de conversaciones por día</p>
                    <div className="w-full h-64">
                      <canvas id="activityChart"></canvas>
                    </div>
                  </div>

                  {/* RF-4.2: Conversations by Active Agent */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Conversaciones por Agente Activo</h3>
                    <p className="text-sm text-gray-500 mb-4">Top 10 agentes más utilizados (por número de conversaciones)</p>
                    <div className="w-full h-64">
                      <canvas id="assistantChart"></canvas>
                    </div>
                  </div>
                </div>

                {/* RF-04: Visualizations - Second Row */}
                <div className="grid grid-cols-1 gap-6">
                  {/* RF-4.3: Distribution by Hour */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Distribución de Mensajes por Hora</h3>
                    <p className="text-sm text-gray-500 mb-4">Volumen de mensajes por hora del día</p>
                    <div className="w-full h-64">
                      <canvas id="hourlyChart"></canvas>
                    </div>
                  </div>
                </div>

                {/* RF-04 & RF-05: Third Row - Users Table and Domain Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* RF-4.5: Users by Domain */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Usuarios por Dominio</h3>
                    <p className="text-sm text-gray-500 mb-4">Distribución de usuarios activos por dominio de correo</p>
                    <div className="w-full h-64">
                      <canvas id="domainChart"></canvas>
                    </div>
                  </div>

                  {/* RF-4.4: Top Users Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Mensajes por Usuario (Top 10)</h3>
                    <p className="text-sm text-gray-500 mb-4">Usuarios más activos por cantidad de mensajes enviados</p>
                    <div className="w-full h-64">
                      <canvas id="userMessagesChart"></canvas>
                    </div>
                  </div>
                </div>
                </>
              )}

              {/* User Analytics Section - Master-Detail Layout */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-1">Analíticas por Usuario</h3>
                  <p className="text-sm text-gray-500">Selecciona un usuario para ver métricas detalladas</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ height: '600px' }}>
                  {/* User List - Left Pane */}
                  <div className="border-r border-gray-200 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                          <div className="p-12 text-center text-gray-500">
                            <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No hay usuarios en el período seleccionado</p>
                          </div>
                        ) : (
                          users.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleUserClick(user)}
                              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-sm font-semibold">
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                
                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                                    {!user.isActive && (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                        Inactivo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {user.totalMessages} msgs
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Activity className="w-3 h-3" />
                                      {user.totalConversations} convs
                                    </span>
                                    {user.lastLoginAt && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(user.lastLoginAt).toLocaleDateString('es-ES', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Details - Right Pane */}
                  <div className="bg-gray-50 overflow-y-auto">
                    {!selectedUser ? (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">Selecciona un usuario para ver detalles</p>
                        </div>
                      </div>
                    ) : loadingUserDetails ? (
                      <div className="p-6 space-y-4">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                          <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 space-y-6">
                        {/* User Header */}
                        <div>
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xl font-bold">
                                {selectedUser.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                              <p className="text-sm text-gray-600">{selectedUser.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                  {selectedUser.role}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {selectedUser.company}
                                </span>
                                {selectedUser.department && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {selectedUser.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* User Creation Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Información de Creación
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Método:</span>
                              <span className="font-medium text-gray-900">
                                {selectedUser.createdBy === 'oauth-system' ? 'OAuth (Google)' : 'Admin Manual'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fecha de Creación:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {selectedUser.createdBy && selectedUser.createdBy !== 'oauth-system' && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Creado por:</span>
                                <span className="font-medium text-gray-900">{selectedUser.createdBy}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Assigned Agents */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Agentes Asignados ({selectedUser.assignedAgents?.length || 0})
                          </h4>
                          {!selectedUser.assignedAgents || selectedUser.assignedAgents.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No hay agentes asignados
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {selectedUser.assignedAgents.map((agent) => (
                                <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{agent.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {agent.messageCount} mensajes
                                    </p>
                                  </div>
                                  <div className="text-right ml-3">
                                    <p className="text-xs text-gray-500">Último uso</p>
                                    <p className="text-xs font-medium text-gray-700">
                                      {new Date(agent.lastUsed).toLocaleDateString('es-ES', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* User Engagement */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Actividad del Usuario
                          </h4>
                          <div className="space-y-3">
                            {/* Last Login */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">Último Login</span>
                              </div>
                              <span className="text-sm font-semibold text-blue-700">
                                {selectedUser.lastLoginAt 
                                  ? new Date(selectedUser.lastLoginAt).toLocaleString('es-ES', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Nunca'
                                }
                              </span>
                            </div>

                            {/* Login Count */}
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-900">Total de Logins</span>
                              </div>
                              <span className="text-sm font-semibold text-green-700">
                                {selectedUser.loginCount || 0}
                              </span>
                            </div>

                            {/* Interactions */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-purple-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Mensajes Enviados</p>
                                <p className="text-2xl font-bold text-purple-700">{selectedUser.totalMessages}</p>
                              </div>
                              <div className="p-3 bg-indigo-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Conversaciones</p>
                                <p className="text-2xl font-bold text-indigo-700">{selectedUser.totalConversations}</p>
                              </div>
                            </div>

                            {/* Engagement Rate */}
                            {selectedUser.loginCount > 0 && (
                              <div className="p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Mensajes por Login</span>
                                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                                </div>
                                <p className="text-lg font-bold text-yellow-700">
                                  {(selectedUser.totalMessages / selectedUser.loginCount).toFixed(1)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>

      {/* Initialize Charts */}
      {!loadingCharts && (
        <ChartInitializer
          conversationsOverTime={conversationsOverTime}
          messagesByAssistant={messagesByAssistant}
          messagesByHour={messagesByHour}
          topUsers={topUsers}
          usersByDomain={usersByDomain}
        />
      )}
    </div>
  );
}

// Chart Initializer Component (renders charts after data loads)
function ChartInitializer({ conversationsOverTime, messagesByAssistant, messagesByHour, topUsers, usersByDomain }: any) {
  const [chartJsLoaded, setChartJsLoaded] = useState(false);

  // Load Chart.js library once
  useEffect(() => {
    if ((window as any).Chart) {
      setChartJsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      setChartJsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script - keep it for reuse
    };
  }, []);

  // Initialize charts when data changes (but only if Chart.js is loaded)
  useEffect(() => {
    if (!chartJsLoaded) return;
    
    // Destroy existing charts before creating new ones
    destroyExistingCharts();
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initCharts();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [chartJsLoaded, conversationsOverTime, messagesByAssistant, messagesByHour, topUsers, usersByDomain]);

  const destroyExistingCharts = () => {
    const chartIds = ['activityChart', 'assistantChart', 'hourlyChart', 'userMessagesChart', 'domainChart'];
    chartIds.forEach(id => {
      const canvas = document.getElementById(id) as HTMLCanvasElement;
      if (canvas && (canvas as any).chart) {
        (canvas as any).chart.destroy();
      }
    });
  };

  const initCharts = () => {
    const Chart = (window as any).Chart;
    if (!Chart) return;

    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    };

    // RF-4.1: Conversations Over Time
    const activityCanvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (activityCanvas) {
      (activityCanvas as any).chart = new Chart(activityCanvas, {
        type: 'line',
        data: {
          labels: conversationsOverTime.labels,
          datasets: [{
            label: 'Conversaciones',
            data: conversationsOverTime.values,
            borderColor: '#1f2937',
            backgroundColor: 'rgba(31, 41, 55, 0.1)',
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          ...chartDefaults,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // RF-4.2: Messages by Assistant
    const assistantCanvas = document.getElementById('assistantChart') as HTMLCanvasElement;
    if (assistantCanvas) {
      (assistantCanvas as any).chart = new Chart(assistantCanvas, {
        type: 'bar',
        data: {
          labels: messagesByAssistant.labels,
          datasets: [{
            label: 'Mensajes',
            data: messagesByAssistant.values,
            backgroundColor: ['#3b82f6', '#8b5cf6'],
            maxBarThickness: 50
          }]
        },
        options: {
          ...chartDefaults,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // RF-4.3: Messages by Hour
    const hourlyCanvas = document.getElementById('hourlyChart') as HTMLCanvasElement;
    if (hourlyCanvas) {
      (hourlyCanvas as any).chart = new Chart(hourlyCanvas, {
        type: 'line',
        data: {
          labels: messagesByHour.labels,
          datasets: [{
            label: 'Mensajes',
            data: messagesByHour.values,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          ...chartDefaults,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // RF-4.4: Messages by User (Horizontal Bar)
    const userMessagesCanvas = document.getElementById('userMessagesChart') as HTMLCanvasElement;
    if (userMessagesCanvas) {
      (userMessagesCanvas as any).chart = new Chart(userMessagesCanvas, {
        type: 'bar',
        data: {
          labels: topUsers.slice(0, 10).map((u: any) => {
            // Show full email if short, or truncate if too long
            const email = u.email || u.userId || 'Unknown';
            return email.length > 30 ? email.substring(0, 27) + '...' : email;
          }),
          datasets: [{
            label: 'Mensajes',
            data: topUsers.slice(0, 10).map((u: any) => u.messages),
            backgroundColor: '#8b5cf6',
            maxBarThickness: 25
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: (context: any) => {
                  // Show full email in tooltip
                  const idx = context[0].dataIndex;
                  return topUsers[idx]?.email || topUsers[idx]?.userId || 'Unknown';
                }
              }
            }
          },
          scales: {
            x: { beginAtZero: true }
          }
        }
      });
    }

    // RF-4.5: Users by Domain
    const domainCanvas = document.getElementById('domainChart') as HTMLCanvasElement;
    if (domainCanvas) {
      (domainCanvas as any).chart = new Chart(domainCanvas, {
        type: 'pie',
        data: {
          labels: usersByDomain.labels,
          datasets: [{
            data: usersByDomain.values,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  };

  return null;
}
