import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, MessageSquare, Download, Database } from 'lucide-react';

interface MetricsSummary {
  total_users: number;
  daily_active_users: number;
  monthly_active_users: number;
  total_sessions_today: number;
  total_conversations_today: number;
  avg_session_duration_minutes: number;
}

interface DailyMetrics {
  date: string;
  total_users: number;
  new_users: number;
  total_sessions: number;
  total_conversations: number;
  avg_conversations_per_session: number;
  avg_messages_per_conversation: number;
}

interface TableInfo {
  name: string;
  description: string;
  row_count: number;
  size_mb: number;
  last_modified: string;
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSample, setTableSample] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableSample(selectedTable);
    }
  }, [selectedTable]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [summaryRes, dailyRes] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch(`/api/analytics/daily?days=${timeRange}`),
      ]);

      if (summaryRes.ok && dailyRes.ok) {
        setSummary(await summaryRes.json());
        setDailyMetrics(await dailyRes.json());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/analytics/tables');
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchTableSample = async (tableName: string) => {
    try {
      const res = await fetch(`/api/analytics/table-sample?table=${tableName}&limit=10`);
      if (res.ok) {
        setTableSample(await res.json());
      }
    } catch (error) {
      console.error('Error fetching table sample:', error);
    }
  };

  const downloadData = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      days: timeRange,
      format,
    });
    window.location.href = `/api/analytics/daily?${params}&download=true`;
  };

  const downloadTableSample = (format: 'csv' | 'json') => {
    if (!selectedTable) return;
    
    const formatParam = format === 'json' ? 'json-download' : 'csv';
    const params = new URLSearchParams({
      table: selectedTable,
      limit: '1000',
      format: formatParam,
    });
    window.location.href = `/api/analytics/table-sample?${params}`;
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor your platform's performance and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Total Users"
            value={summary.total_users.toLocaleString()}
            subtitle={`${summary.daily_active_users} active today`}
            color="blue"
          />
          <MetricCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Monthly Active Users"
            value={summary.monthly_active_users.toLocaleString()}
            subtitle={`${((summary.monthly_active_users / summary.total_users) * 100).toFixed(1)}% of total`}
            color="green"
          />
          <MetricCard
            icon={<Calendar className="w-6 h-6" />}
            title="Sessions Today"
            value={summary.total_sessions_today.toLocaleString()}
            subtitle={`Avg ${summary.avg_session_duration_minutes.toFixed(1)} min duration`}
            color="purple"
          />
          <MetricCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Conversations Today"
            value={summary.total_conversations_today.toLocaleString()}
            subtitle={`${(summary.total_conversations_today / Math.max(summary.total_sessions_today, 1)).toFixed(1)} per session`}
            color="yellow"
          />
        </div>
      )}

      {/* Daily Metrics Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Daily Metrics</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => downloadData('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => downloadData('json')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-700 font-semibold">Date</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">Total Users</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">New Users</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">Sessions</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">Conversations</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">Conv/Session</th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">Msg/Conv</th>
              </tr>
            </thead>
            <tbody>
              {dailyMetrics.map((metric, index) => (
                <tr key={metric.date} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-slate-900">{metric.date}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{metric.total_users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">+{metric.new_users}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{metric.total_sessions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{metric.total_conversations.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{metric.avg_conversations_per_session}</td>
                  <td className="py-3 px-4 text-right text-slate-900">{metric.avg_messages_per_conversation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Tables Browser */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-900">Database Tables</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1 space-y-2">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedTable === table.name
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold text-slate-900">{table.name}</div>
                <div className="text-sm text-slate-600 mt-1">{table.description}</div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{table.row_count.toLocaleString()} rows</span>
                  <span>{table.size_mb.toFixed(2)} MB</span>
                </div>
              </button>
            ))}
          </div>

          {/* Table Sample */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Sample Data: {selectedTable}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadTableSample('csv')}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => downloadTableSample('json')}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  {tableSample.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          {Object.keys(tableSample[0]).map((key) => (
                            <th key={key} className="text-left py-2 px-3 text-slate-700 font-semibold">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableSample.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            {Object.values(row).map((value: any, i) => (
                              <td key={i} className="py-2 px-3 text-slate-900">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Select a table to view sample data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function MetricCard({ icon, title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-600 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

