import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  api: {
    status: string;
    uptime: number;
    requestsPerMinute: number;
  };
  database: {
    status: string;
    connections: number;
    queryLatency: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
}

interface ApiMetrics {
  endpoint: string;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  requestCount: number;
}

interface ModelMetrics {
  model: string;
  avgLatency: number;
  totalRequests: number;
  successRate: number;
  avgCost: number;
  avgQuality: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

interface InfrastructureMetrics {
  cloudRun: {
    instances: number;
    activeRequests: number;
    cpu: number;
    memory: number;
  };
  firestore: {
    reads: number;
    writes: number;
    deletes: number;
  };
  bigQuery: {
    queriesPerHour: number;
    avgQueryTime: number;
    costPerDay: number;
  };
}

export default function SuperAdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/superadmin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  // Fetch API metrics
  const fetchApiMetrics = async () => {
    try {
      const response = await fetch('/api/superadmin/api-performance');
      if (response.ok) {
        const data = await response.json();
        setApiMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching API metrics:', error);
    }
  };

  // Fetch model metrics
  const fetchModelMetrics = async () => {
    try {
      const response = await fetch('/api/superadmin/model-metrics');
      if (response.ok) {
        const data = await response.json();
        setModelMetrics(data.models);
      }
    } catch (error) {
      console.error('Error fetching model metrics:', error);
    }
  };

  // Fetch infrastructure metrics
  const fetchInfrastructure = async () => {
    try {
      const response = await fetch('/api/superadmin/infrastructure');
      if (response.ok) {
        const data = await response.json();
        setInfrastructure(data);
      }
    } catch (error) {
      console.error('Error fetching infrastructure:', error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSystemHealth(),
      fetchApiMetrics(),
      fetchModelMetrics(),
      fetchInfrastructure()
    ]);
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'good':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (isLoading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔧 SuperAdmin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System monitoring and technical insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last refresh time */}
      <p className="text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>

      {/* System Health Cards */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">API Status</span>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full inline-flex ${getStatusColor(systemHealth.api.status)}`}>
              {getStatusIcon(systemHealth.api.status)}
              <span className="text-sm font-semibold capitalize">
                {systemHealth.api.status}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <div>Uptime: {systemHealth.api.uptime}h</div>
              <div>Req/min: {systemHealth.api.requestsPerMinute}</div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Database</span>
              <Database className="w-5 h-5 text-green-500" />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full inline-flex ${getStatusColor(systemHealth.database.status)}`}>
              {getStatusIcon(systemHealth.database.status)}
              <span className="text-sm font-semibold capitalize">
                {systemHealth.database.status}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <div>Connections: {systemHealth.database.connections}</div>
              <div>Latency: {systemHealth.database.queryLatency}ms</div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Memory</span>
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {systemHealth.memory.percentage}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemHealth.memory.percentage > 80
                    ? 'bg-red-500'
                    : systemHealth.memory.percentage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth.memory.percentage}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {(systemHealth.memory.used / 1024).toFixed(2)} / {(systemHealth.memory.total / 1024).toFixed(2)} GB
            </div>
          </div>

          {/* CPU Usage */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">CPU</span>
              <Cpu className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {systemHealth.cpu.usage}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemHealth.cpu.usage > 80
                    ? 'bg-red-500'
                    : systemHealth.cpu.usage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth.cpu.usage}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {systemHealth.cpu.cores} cores available
            </div>
          </div>
        </div>
      )}

      {/* API Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          API Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Endpoint</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">p50</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">p95</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">p99</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Error Rate</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Requests</th>
              </tr>
            </thead>
            <tbody>
              {apiMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono text-gray-900">{metric.endpoint}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{metric.p50}ms</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{metric.p95}ms</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{metric.p99}ms</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`${metric.errorRate > 5 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                      {metric.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">
                    {metric.requestCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          Model Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Model</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Latency</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Success Rate</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg Cost</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quality</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Tokens</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Requests</th>
              </tr>
            </thead>
            <tbody>
              {modelMetrics.map((model, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{model.model}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{model.avgLatency}ms</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`${model.successRate >= 99 ? 'text-green-600' : 'text-yellow-600'} font-medium`}>
                      {model.successRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">
                    ${model.avgCost.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className="text-blue-600 font-medium">
                      {model.avgQuality.toFixed(1)}/5
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">
                    {(model.tokenUsage.total / 1000).toFixed(1)}K
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">
                    {model.totalRequests.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure Metrics */}
      {infrastructure && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cloud Run */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cloud Run</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Instances</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.cloudRun.instances}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Requests</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.cloudRun.activeRequests}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPU</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.cloudRun.cpu}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Memory</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.cloudRun.memory}%
                </span>
              </div>
            </div>
          </div>

          {/* Firestore */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Firestore</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reads</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.firestore.reads.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Writes</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.firestore.writes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deletes</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.firestore.deletes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* BigQuery */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">BigQuery</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Queries/Hour</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.bigQuery.queriesPerHour}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Query Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {infrastructure.bigQuery.avgQueryTime}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cost/Day</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${infrastructure.bigQuery.costPerDay.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

