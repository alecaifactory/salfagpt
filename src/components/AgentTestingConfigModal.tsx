/**
 * Agent Testing Configuration Modal
 * 
 * Manage test questions, quality examples, and evaluation criteria for an agent
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  FileText,
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react';
import type {
  TestQuestion,
  ResponseExample,
  ResponseQuality,
  AgentTestingConfig,
  TestExecution
} from '../types/agent-testing';

interface AgentTestingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  userId: string;
}

export default function AgentTestingConfigModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  userId
}: AgentTestingConfigModalProps) {
  
  const [activeTab, setActiveTab] = useState<'questions' | 'examples' | 'history'>('questions');
  const [testingEnabled, setTestingEnabled] = useState(false);
  
  // Questions
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('procedure');
  
  // Examples
  const [examples, setExamples] = useState<ResponseExample[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  // History
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Load config
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, agentId]);
  
  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/testing-config`);
      if (response.ok) {
        const data = await response.json();
        setTestingEnabled(data.testingEnabled || false);
        setQuestions(data.questions || []);
        setExamples(data.examples || []);
        setExecutions(data.executions || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading testing config:', error);
    }
  };
  
  const toggleTesting = async () => {
    try {
      const newState = !testingEnabled;
      
      const response = await fetch(`/api/agents/${agentId}/testing-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testingEnabled: newState
        })
      });
      
      if (response.ok) {
        setTestingEnabled(newState);
      }
    } catch (error) {
      console.error('Error toggling testing:', error);
    }
  };
  
  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      const response = await fetch(`/api/agents/${agentId}/test-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          category: newCategory,
          difficulty: 'medium',
          enabled: true,
          createdBy: userId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestions([...questions, data.question]);
        setNewQuestion('');
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };
  
  const deleteQuestion = async (questionId: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    
    try {
      const response = await fetch(`/api/agents/${agentId}/test-questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };
  
  const runSingleTest = async (questionId: string) => {
    // TODO: Implement single question test
    console.log('Running test for question:', questionId);
  };
  
  const runAllTests = async () => {
    // TODO: Implement bulk test execution
    console.log('Running all tests...');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Testing & Evaluación
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {agentName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Testing:</span>
              <button
                onClick={toggleTesting}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  testingEnabled
                    ? 'bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    testingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${
                testingEnabled
                  ? 'text-blue-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {testingEnabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preguntas Tipo ({questions.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'examples'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Ejemplos ({examples.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Historial ({executions.length})
              </div>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {!testingEnabled ? (
            /* Disabled State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Testing Deshabilitado
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                El sistema de testing para este agente está deshabilitado.
                Actívalo arriba para gestionar preguntas tipo y ejemplos de calidad.
              </p>
              <button
                onClick={toggleTesting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Habilitar Testing
              </button>
            </div>
          ) : (
            /* Enabled State - Show selected tab */
            <>
              {activeTab === 'questions' && (
                <div className="space-y-6">
                  
                  {/* Add New Question */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      Agregar Pregunta Tipo
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Categoría
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                        >
                          <option value="procedure">Procedimiento</option>
                          <option value="code">Código/Transacción</option>
                          <option value="concept">Concepto</option>
                          <option value="regulation">Regulación/Normativa</option>
                          <option value="troubleshooting">Solución de Problemas</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Pregunta
                        </label>
                        <textarea
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="Ej: ¿Cómo se hace una Solped?"
                          className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg text-sm resize-none bg-white dark:bg-slate-800"
                          rows={2}
                        />
                      </div>
                      
                      <button
                        onClick={addQuestion}
                        disabled={!newQuestion.trim()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Pregunta
                      </button>
                    </div>
                  </div>
                  
                  {/* Questions List */}
                  {questions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay preguntas tipo configuradas</p>
                      <p className="text-sm mt-1">Agrega la primera pregunta arriba</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Preguntas Configuradas ({questions.length})
                        </h3>
                        <button
                          onClick={runAllTests}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Probar Todas
                        </button>
                      </div>
                      
                      {questions.map((q, index) => (
                        <div
                          key={q.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  #{index + 1}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                                  {q.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {q.difficulty}
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                                {q.question}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => runSingleTest(q.id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Probar pregunta"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedQuestion(q.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Ver ejemplos"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteQuestion(q.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {q.expectedKeywords && q.expectedKeywords.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Palabras clave:</span>
                              {q.expectedKeywords.map(kw => (
                                <span key={kw} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'examples' && (
                <div className="space-y-6">
                  
                  {selectedQuestion ? (
                    /* Examples for specific question */
                    <div>
                      <button
                        onClick={() => setSelectedQuestion(null)}
                        className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
                      >
                        ← Volver a lista de preguntas
                      </button>
                      
                      {/* Question details */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {questions.find(q => q.id === selectedQuestion)?.question}
                        </p>
                      </div>
                      
                      {/* Examples by quality */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Ejemplos de Respuestas
                        </h3>
                        
                        {/* Excellent Examples */}
                        <div>
                          <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Sobresalientes (Excellent)
                          </h4>
                          {examples.filter(e => e.questionId === selectedQuestion && e.quality === 'excellent').length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                              No hay ejemplos sobresalientes aún
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {examples
                                .filter(e => e.questionId === selectedQuestion && e.quality === 'excellent')
                                .map(example => (
                                  <div key={example.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                    <p className="text-sm text-slate-800 dark:text-slate-200 mb-2">
                                      {example.responseText}
                                    </p>
                                    {example.whatsGood && (
                                      <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                                        ✅ {example.whatsGood}
                                      </p>
                                    )}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        
                        {/* Good Examples */}
                        <div>
                          <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                            Buenas (Good)
                          </h4>
                          <div className="space-y-2">
                            {examples.filter(e => e.questionId === selectedQuestion && e.quality === 'good').map(example => (
                              <div key={example.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                  {example.responseText}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Poor Examples */}
                        <div>
                          <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Malas (Poor)
                          </h4>
                          <div className="space-y-2">
                            {examples.filter(e => e.questionId === selectedQuestion && e.quality === 'poor').map(example => (
                              <div key={example.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-slate-800 dark:text-slate-200 mb-2">
                                  {example.responseText}
                                </p>
                                {example.whatsMissing && (
                                  <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                                    ❌ {example.whatsMissing}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Select question first */
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Selecciona una pregunta en la tab "Preguntas" para ver sus ejemplos
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'history' && (
                <div className="space-y-6">
                  
                  {/* Stats Summary */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tests Ejecutados</div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                          {stats.totalExecutions || 0}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="text-xs text-green-700 dark:text-green-400 mb-1">Tasa de Aprobación</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {((stats.passRate || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Calidad Promedio</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          {(stats.avgQualityScore || 0).toFixed(0)}/100
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="text-xs text-purple-700 dark:text-purple-400 mb-1">Último Test</div>
                        <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                          {stats.lastExecutionAt ? new Date(stats.lastExecutionAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Executions List */}
                  {executions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay pruebas ejecutadas aún</p>
                      <p className="text-sm mt-1">Ejecuta pruebas en la tab "Preguntas"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {executions.map(exec => (
                        <div
                          key={exec.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {exec.question}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {new Date(exec.executedAt).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                exec.evaluatedQuality === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                exec.evaluatedQuality === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                exec.evaluatedQuality === 'fair' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {exec.evaluatedQuality}
                              </span>
                              
                              {exec.passedQuality ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 text-xs">
                            <p className="text-slate-700 dark:text-slate-300 line-clamp-3">
                              {exec.response}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Referencias:</span>
                              <span className="ml-1 font-medium text-slate-800 dark:text-slate-200">
                                {exec.references?.length || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Tiempo:</span>
                              <span className="ml-1 font-medium text-slate-800 dark:text-slate-200">
                                {exec.responseTime}ms
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Tokens:</span>
                              <span className="ml-1 font-medium text-slate-800 dark:text-slate-200">
                                {exec.tokensInput + exec.tokensOutput}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {testingEnabled ? (
              <span>
                {questions.length} preguntas • {examples.length} ejemplos • {executions.length} pruebas
              </span>
            ) : (
              <span>Sistema de testing deshabilitado</span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

