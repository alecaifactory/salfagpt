/**
 * Optimization Suggestions Panel
 * 
 * Auto-generated suggestions based on CSAT analysis
 * Allows testing via A/B or direct application
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Zap, X, CheckCircle, XCircle, TestTube2 } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface OptimizationSuggestion {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'rag_config' | 'system_prompt' | 'model' | 'context_sources';
  
  problem: string;
  current: any;
  proposed: any;
  reasoning: string;
  
  expectedImpact: {
    csatImprovement: number;
    costChange: number;
    speedChange: number;
  };
  
  confidence: number;
  basedOnData: {
    interactionsAnalyzed: number;
    similarCases: number;
    successRate: number;
  };
  
  status: 'pending' | 'testing' | 'approved' | 'rejected';
}

interface OptimizationSuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export default function OptimizationSuggestionsPanel({
  isOpen,
  onClose,
  conversationId
}: OptimizationSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useModalClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, conversationId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await fetch(`/api/agents/${conversationId}/optimization-suggestions`);
      // const data = await response.json();
      
      // Mock suggestions
      setSuggestions([
        {
          id: 'sug_1',
          priority: 'critical',
          type: 'rag_config',
          problem: '35% de interacciones usan fallback a full-text porque min_similarity=0.5 es muy estricto',
          current: { min_similarity: 0.5 },
          proposed: { min_similarity: 0.4 },
          reasoning: 'Análisis de 234 interacciones muestra que chunks con 40-50% similaridad siguen siendo relevantes. Bajar threshold reduce fallbacks de 35% a 5%, mejorando velocidad y CSAT.',
          expectedImpact: {
            csatImprovement: 0.6,
            costChange: 0.001,
            speedChange: -0.9
          },
          confidence: 0.94,
          basedOnData: {
            interactionsAnalyzed: 234,
            similarCases: 18,
            successRate: 0.83
          },
          status: 'pending'
        },
        {
          id: 'sug_2',
          priority: 'high',
          type: 'rag_config',
          problem: 'Queries sobre tendencias tienen CSAT 3.5/5 (bajo) por falta de contexto',
          current: { topK: 5 },
          proposed: { topK: 7 },
          reasoning: 'Análisis de queries complejas muestra que 5 chunks son insuficientes para análisis de tendencias. Aumentar a 7 mejora completitud.',
          expectedImpact: {
            csatImprovement: 0.3,
            costChange: 0.002,
            speedChange: 0.3
          },
          confidence: 0.78,
          basedOnData: {
            interactionsAnalyzed: 234,
            similarCases: 23,
            successRate: 0.74
          },
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (suggestionId: string) => {
    // TODO: Implement apply logic
    console.log('Applying suggestion:', suggestionId);
  };

  const handleTest = async (suggestionId: string) => {
    // TODO: Implement A/B test logic
    console.log('Starting A/B test for:', suggestionId);
  };

  const handleReject = async (suggestionId: string) => {
    // TODO: Implement reject logic
    console.log('Rejecting suggestion:', suggestionId);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Sugerencias de Optimización
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Basadas en análisis de CSAT y patrones de uso
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Cargando sugerencias...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                ¡Todo Óptimo!
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No hay sugerencias de mejora en este momento
              </p>
            </div>
          ) : (
            suggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApply={() => handleApply(suggestion.id)}
                onTest={() => handleTest(suggestion.id)}
                onReject={() => handleReject(suggestion.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onApply, onTest, onReject }: any) {
  const priorityColors = {
    critical: 'from-red-500 to-orange-500',
    high: 'from-orange-500 to-yellow-500',
    medium: 'from-yellow-500 to-green-500',
    low: 'from-green-500 to-blue-500'
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${
      suggestion.priority === 'critical' ? 'border-red-300' :
      suggestion.priority === 'high' ? 'border-orange-300' :
      suggestion.priority === 'medium' ? 'border-yellow-300' :
      'border-green-300'
    }`}>
      {/* Priority Header */}
      <div className={`bg-gradient-to-r ${priorityColors[suggestion.priority]} p-3`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase">{suggestion.priority}</span>
            <span className="text-xs opacity-90">•</span>
            <span className="text-xs">Confianza: {(suggestion.confidence * 100).toFixed(0)}%</span>
          </div>
          <span className="text-xs">
            Impacto: +{suggestion.expectedImpact.csatImprovement.toFixed(1)} CSAT
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Problem */}
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Problema Detectado:
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {suggestion.problem}
          </p>
        </div>

        {/* Suggestion */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
            💡 Sugerencia:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs mb-2">
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Actual:</p>
              <pre className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600">
                {JSON.stringify(suggestion.current, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Propuesto:</p>
              <pre className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
                {JSON.stringify(suggestion.proposed, null, 2)}
              </pre>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {suggestion.reasoning}
          </p>
        </div>

        {/* Expected Impact */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">CSAT</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              +{suggestion.expectedImpact.csatImprovement.toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">Costo</p>
            <p className={`text-lg font-bold ${
              suggestion.expectedImpact.costChange > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {suggestion.expectedImpact.costChange > 0 ? '+' : ''}${Math.abs(suggestion.expectedImpact.costChange).toFixed(3)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">Velocidad</p>
            <p className={`text-lg font-bold ${
              suggestion.expectedImpact.speedChange > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {suggestion.expectedImpact.speedChange > 0 ? '+' : ''}{suggestion.expectedImpact.speedChange.toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Data Basis */}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Basado en análisis de {suggestion.basedOnData.interactionsAnalyzed} interacciones · 
          {suggestion.basedOnData.similarCases} casos similares · 
          {(suggestion.basedOnData.successRate * 100).toFixed(0)}% tasa de éxito
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onApply}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Aplicar Ahora
          </button>
          <button
            onClick={onTest}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <TestTube2 className="w-4 h-4" />
            Probar (A/B Test)
          </button>
          <button
            onClick={onReject}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

