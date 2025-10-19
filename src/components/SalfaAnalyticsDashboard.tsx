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
  Filter
} from 'lucide-react';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userRole: string;
}

export default function SalfaAnalyticsDashboard({ isOpen, onClose, userId, userEmail, userRole }: Props) {
  // Filters state
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
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
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiInput, setAIInput] = useState('');
  const [aiMessages, setAIMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Load analytics data
  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, filters]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/salfagpt-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userRole === 'admin' ? undefined : userId, // Admins see all, users see own
          filters: {
            startDate: filters.dateRange.start.toISOString(),
            endDate: filters.dateRange.end.toISOString(),
            assistant: filters.assistantFilter !== 'all' ? filters.assistantFilter : undefined,
            domain: filters.domainFilter !== 'all' ? filters.domainFilter : undefined,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setKpis(data.kpis || []);
        setConversationsOverTime(data.conversationsOverTime || { labels: [], values: [] });
        setMessagesByAssistant(data.messagesByAssistant || { labels: [], values: [] });
        setMessagesByHour(data.messagesByHour || { labels: [], values: [] });
        setTopUsers(data.topUsers || []);
        setUsersByDomain(data.usersByDomain || { labels: [], values: [] });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDateRange = (days: number) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
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
      <div className="bg-gray-50 rounded-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-2xl">
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
                    className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Últimos 7 días
                  </button>
                  <button
                    onClick={() => setQuickDateRange(30)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Últimos 30 días
                  </button>
                </div>

                {/* Filters */}
                <select
                  value={filters.assistantFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, assistantFilter: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los Asistentes</option>
                  <option value="flash">Flash</option>
                  <option value="pro">Pro</option>
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

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando analíticas...</p>
                </div>
              </div>
            ) : (
              <>
                {/* RF-03: KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
                        <kpi.icon className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{kpi.value.toLocaleString()}</p>
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
                  ))}
                </div>

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
                    <canvas id="activityChart" className="w-full h-64"></canvas>
                  </div>

                  {/* RF-4.2: Messages by Assistant */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Mensajes por Asistente</h3>
                    <p className="text-sm text-gray-500 mb-4">Distribución de mensajes entre asistentes</p>
                    <canvas id="assistantChart" className="w-full h-64"></canvas>
                  </div>
                </div>

                {/* RF-04: Visualizations - Second Row */}
                <div className="grid grid-cols-1 gap-6">
                  {/* RF-4.3: Distribution by Hour */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Distribución de Mensajes por Hora</h3>
                    <p className="text-sm text-gray-500 mb-4">Volumen de mensajes por hora del día</p>
                    <canvas id="hourlyChart" className="w-full h-64"></canvas>
                  </div>
                </div>

                {/* RF-04 & RF-05: Third Row - Users Table and Domain Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* RF-5.1: Top Users Table */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Usuarios Más Activos (Top 10)</h3>
                    <p className="text-sm text-gray-500 mb-4">Usuarios con mayor cantidad de mensajes</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left">Correo</th>
                            <th className="px-6 py-3 text-right">Mensajes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topUsers.slice(0, 10).map((user, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-800">{user.email}</td>
                              <td className="px-6 py-4 text-right font-mono text-gray-900">{user.messages}</td>
                            </tr>
                          ))}
                          {topUsers.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                No hay datos disponibles
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RF-4.5: Users by Domain */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-1">Usuarios por Dominio</h3>
                    <p className="text-sm text-gray-500 mb-4">Distribución de usuarios activos por dominio de correo</p>
                    <canvas id="domainChart" className="w-full h-64"></canvas>
                  </div>
                </div>

                {/* RF-4.4: Top Users Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-1">Mensajes por Usuario (Top 10)</h3>
                  <p className="text-sm text-gray-500 mb-4">Cantidad de mensajes de los usuarios más activos</p>
                  <canvas id="userMessagesChart" className="w-full h-64"></canvas>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Initialize Charts */}
      {!loading && (
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
  useEffect(() => {
    // Dynamically load Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      initCharts();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

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
      new Chart(activityCanvas, {
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
      new Chart(assistantCanvas, {
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
      new Chart(hourlyCanvas, {
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
      new Chart(userMessagesCanvas, {
        type: 'bar',
        data: {
          labels: topUsers.slice(0, 10).map((u: any) => u.email),
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
      new Chart(domainCanvas, {
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

