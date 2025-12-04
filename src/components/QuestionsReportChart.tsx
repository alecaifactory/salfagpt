import React, { useState, useEffect } from 'react';
import { BarChart3, Table2, Download, Calendar, Users, MessageSquare } from 'lucide-react';

interface QuestionStats {
  date: string;
  count: number;
}

interface UserAgentStats {
  userId: string;
  userEmail: string;
  userName: string;
  totalQuestions: number;
  dailyBreakdown: QuestionStats[];
}

interface AgentStats {
  agentId: string;
  agentTitle: string;
  agentOwner: string;
  totalQuestions: number;
  userBreakdown: UserAgentStats[];
}

interface ReportData {
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalQuestions: number;
  totalAgents: number;
  totalUsers: number;
  agents: AgentStats[];
}

interface QuestionsReportChartProps {
  userId: string;
}

export function QuestionsReportChart({ userId }: QuestionsReportChartProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  useEffect(() => {
    loadReportData();
  }, [userId]);
  
  async function loadReportData() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/questions-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
      
      // Auto-select first agent
      if (data.agents && data.agents.length > 0) {
        setSelectedAgent(data.agents[0].agentId);
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }
  
  function downloadCSV() {
    if (!reportData) return;
    
    const lines: string[] = [];
    lines.push('Agente,Usuario,Email,Fecha,Preguntas');
    
    for (const agent of reportData.agents) {
      for (const user of agent.userBreakdown) {
        for (const day of user.dailyBreakdown) {
          lines.push([
            agent.agentTitle,
            user.userName,
            user.userEmail,
            day.date,
            day.count,
          ].join(','));
        }
      }
    }
    
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-preguntas-${reportData.period.startDate}-${reportData.period.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Generando reporte...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold mb-2">Error al cargar reporte</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={loadReportData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  if (!reportData || reportData.agents.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">No hay preguntas en los últimos 7 días</p>
      </div>
    );
  }
  
  const selectedAgentData = reportData.agents.find(a => a.agentId === selectedAgent);
  
  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              📊 Reporte de Preguntas
            </h2>
            <p className="text-sm text-slate-600">
              Últimos 7 días: {reportData.period.startDate} → {reportData.period.endDate}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Table2 className="w-4 h-4" />
              Tabla
            </button>
            
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gráfico
            </button>
            
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600">Total Preguntas</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {reportData.totalQuestions.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ~{(reportData.totalQuestions / 7).toFixed(1)} por día
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-slate-600">Agentes Activos</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {reportData.totalAgents}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-slate-600">Usuarios Activos</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {reportData.totalUsers}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      {viewMode === 'table' ? (
        <TableView data={reportData} />
      ) : (
        <ChartView 
          data={reportData} 
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
      )}
    </div>
  );
}

function TableView({ data }: { data: ReportData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Agente</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Usuario</th>
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return (
                  <th key={i} className="px-2 py-3 text-center font-semibold text-slate-700 text-xs">
                    {date.toLocaleDateString('es', { weekday: 'short' }).toUpperCase()}<br />
                    {date.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.agents.flatMap((agent, agentIdx) =>
              agent.userBreakdown.map((user, userIdx) => (
                <tr
                  key={`${agent.agentId}-${user.userId}`}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  {userIdx === 0 && (
                    <td
                      rowSpan={agent.userBreakdown.length}
                      className="px-4 py-3 font-medium text-slate-800 border-r border-slate-200"
                    >
                      <div>
                        <p className="font-semibold">{agent.agentTitle}</p>
                        <p className="text-xs text-slate-500">{agent.totalQuestions} preguntas</p>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-700">
                    <div>
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-xs text-slate-500">{user.userEmail}</p>
                    </div>
                  </td>
                  {user.dailyBreakdown.map((day, dayIdx) => (
                    <td key={dayIdx} className="px-2 py-3 text-center">
                      {day.count > 0 ? (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          day.count >= 10 ? 'bg-green-100 text-green-700' :
                          day.count >= 5 ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {day.count}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-slate-800">
                      {user.totalQuestions}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartView({ 
  data, 
  selectedAgent,
  onSelectAgent 
}: { 
  data: ReportData;
  selectedAgent: string | null;
  onSelectAgent: (agentId: string) => void;
}) {
  const selectedAgentData = data.agents.find(a => a.agentId === selectedAgent);
  
  if (!selectedAgentData) {
    return <div>Seleccione un agente</div>;
  }
  
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...selectedAgentData.userBreakdown.flatMap(u => 
      u.dailyBreakdown.map(d => d.count)
    ),
    1
  );
  
  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Seleccionar Agente:
        </label>
        <select
          value={selectedAgent || ''}
          onChange={(e) => onSelectAgent(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {data.agents.map(agent => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentTitle} ({agent.totalQuestions} preguntas)
            </option>
          ))}
        </select>
      </div>
      
      {/* Chart Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {selectedAgentData.agentTitle}
          </h3>
          <p className="text-sm text-slate-600">
            {selectedAgentData.totalQuestions} preguntas totales • {selectedAgentData.userBreakdown.length} usuarios
          </p>
        </div>
        
        {/* Bar Chart */}
        <div className="space-y-6">
          {selectedAgentData.userBreakdown.map((user) => (
            <div key={user.userId} className="space-y-2">
              {/* User Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{user.userName}</p>
                  <p className="text-xs text-slate-500">{user.userEmail}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {user.totalQuestions} preguntas
                </span>
              </div>
              
              {/* Bar Chart for User */}
              <div className="grid grid-cols-7 gap-2">
                {user.dailyBreakdown.map((day, idx) => {
                  const height = maxValue > 0 ? (day.count / maxValue) * 120 : 0;
                  const date = new Date(day.date);
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      {/* Bar */}
                      <div className="relative w-full" style={{ height: '120px' }}>
                        <div className="absolute bottom-0 w-full flex flex-col items-center justify-end">
                          {day.count > 0 && (
                            <>
                              <div
                                className={`w-full rounded-t transition-all ${
                                  day.count >= 10 ? 'bg-green-500' :
                                  day.count >= 5 ? 'bg-blue-500' :
                                  'bg-slate-400'
                                }`}
                                style={{ height: `${height}px` }}
                              />
                              <span className="text-xs font-bold text-slate-700 mt-1">
                                {day.count}
                              </span>
                            </>
                          )}
                          {day.count === 0 && (
                            <span className="text-xs text-slate-300">0</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Date Label */}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">
                          {date.toLocaleDateString('es', { weekday: 'short' }).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {date.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <p className="text-sm font-semibold text-slate-700 mb-2">Leyenda:</p>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-slate-600">≥10 preguntas/día</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-slate-600">5-9 preguntas/día</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-400 rounded" />
            <span className="text-slate-600">1-4 preguntas/día</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionsReportChart;

