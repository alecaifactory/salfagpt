/**
 * Cost Breakdown Dashboard
 * 
 * Shows ROI and cost analysis per source, agent, and interaction type
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, FileText, Bot, X, RefreshCw } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface CostBreakdownDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface SourceCost {
  sourceId: string;
  sourceName: string;
  extractionCost: number;
  embeddingCost: number;
  queryCost: number;
  totalCost: number;
  queryCount: number;
  tokensSaved: number;
  costSaved: number;
  roi: number;
}

export default function CostBreakdownDashboard({
  isOpen,
  onClose,
  userId
}: CostBreakdownDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceCost[]>([]);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  useModalClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      loadCostData();
    }
  }, [isOpen, timeframe]);

  const loadCostData = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await fetch(`/api/analytics/cost-breakdown?timeframe=${timeframe}`);
      // const data = await response.json();
      
      // Mock data for now
      setSources([
        {
          sourceId: 'src_1',
          sourceName: 'Sales_Report_Q4.pdf',
          extractionCost: 0.036,
          embeddingCost: 0.005,
          queryCost: 0.42,
          totalCost: 0.461,
          queryCount: 47,
          tokensSaved: 2234567,
          costSaved: 58.23,
          roi: 126.3
        },
        {
          sourceId: 'src_2',
          sourceName: 'Budget_2025.pdf',
          extractionCost: 0.028,
          embeddingCost: 0.004,
          queryCost: 0.31,
          totalCost: 0.342,
          queryCount: 34,
          tokensSaved: 1567890,
          costSaved: 42.18,
          roi: 123.3
        }
      ]);
    } catch (error) {
      console.error('Error loading cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalCost = sources.reduce((sum, s) => sum + s.totalCost, 0);
  const totalSaved = sources.reduce((sum, s) => sum + s.costSaved, 0);
  const avgROI = sources.length > 0 
    ? sources.reduce((sum, s) => sum + s.roi, 0) / sources.length 
    : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Análisis de Costos
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ROI y breakdown por documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Timeframe Selection */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-600 dark:text-slate-400">Período:</span>
          {(['7d', '30d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              {tf === '7d' && 'Últimos 7 días'}
              {tf === '30d' && 'Últimos 30 días'}
              {tf === 'all' && 'Todo el tiempo'}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={loadCostData}
            disabled={loading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Costo Total</span>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                ${totalCost.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {sources.reduce((sum, s) => sum + s.queryCount, 0)} queries
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Ahorrado (RAG)</span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${totalSaved.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {((totalSaved / (totalSaved + totalCost)) * 100).toFixed(1)}% de reducción
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">ROI Promedio</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {avgROI.toFixed(1)}x
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Retorno sobre inversión
              </p>
            </div>
          </div>
        </div>

        {/* Source Breakdown Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Breakdown por Documento
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Queries
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Costo Total
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Ahorrado
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, idx) => (
                  <tr key={source.sourceId} className={`border-b border-slate-100 dark:border-slate-700 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-750'
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {source.sourceName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Extracción: ${source.extractionCost.toFixed(3)} · 
                        Embeddings: ${source.embeddingCost.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {source.queryCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400">
                      ${source.totalCost.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                      ${source.costSaved.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                        {source.roi.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Total ahorrado:</span> ${totalSaved.toFixed(2)} 
              <span className="mx-2">·</span>
              <span className="font-semibold">Gastado:</span> ${totalCost.toFixed(2)}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

