import React, { useState, useEffect } from 'react';
import { 
  TestTube, Plus, Play, FileText, CheckCircle, XCircle, 
  AlertCircle, TrendingUp, Filter, Search, Download, 
  Eye, Edit2, Trash2, Copy, X 
} from 'lucide-react';
import type { 
  Evaluation, 
  EvaluationQuestion, 
  QuestionCategory,
  SuccessCriteria,
  EvaluationStatus 
} from '../types/evaluations';

interface EvaluationPanelProps {
  currentUserId: string;
  currentUserEmail: string;
  currentUserRole: string;
  onClose: () => void;
}

export default function EvaluationPanel({ 
  currentUserId, 
  currentUserEmail, 
  currentUserRole,
  onClose 
}: EvaluationPanelProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [filterStatus, setFilterStatus] = useState<EvaluationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/evaluations?userId=${currentUserId}`);
      if (!response.ok) {
        throw new Error('Failed to load evaluations');
      }
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    // Filter by status
    if (filterStatus !== 'all' && evaluation.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !evaluation.agentName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusBadge = (status: EvaluationStatus) => {
    const configs = {
      draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Borrador' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En Progreso' },
      completed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Completado' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' },
    };
    
    const config = configs[status] || configs.draft;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getQualityBadge = (quality: number | undefined) => {
    if (!quality) return null;
    
    let bg, text;
    if (quality >= 9) {
      bg = 'bg-green-100';
      text = 'text-green-700';
    } else if (quality >= 7) {
      bg = 'bg-yellow-100';
      text = 'text-yellow-700';
    } else {
      bg = 'bg-red-100';
      text = 'text-red-700';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        {quality.toFixed(1)}/10
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Evaluaciones de Agentes</h1>
              <p className="text-sm text-slate-600">
                {evaluations.length} evaluaciones • {filteredEvaluations.length} mostradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar evaluaciones por agente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EvaluationStatus | 'all')}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Cargando evaluaciones...</p>
              </div>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No se encontraron evaluaciones' 
                  : 'No hay evaluaciones creadas'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta cambiar los filtros'
                  : 'Crea tu primera evaluación para comenzar a probar agentes'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Primera Evaluación
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onClick={() => setSelectedEvaluation(evaluation)}
                  getStatusBadge={getStatusBadge}
                  getQualityBadge={getQualityBadge}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEvaluationModal
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadEvaluations();
          }}
        />
      )}

      {/* Detail View Modal */}
      {selectedEvaluation && (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          onClose={() => setSelectedEvaluation(null)}
          onUpdated={loadEvaluations}
        />
      )}
    </div>
  );
}

/**
 * Individual evaluation card component
 */
interface EvaluationCardProps {
  evaluation: Evaluation;
  onClick: () => void;
  getStatusBadge: (status: EvaluationStatus) => JSX.Element;
  getQualityBadge: (quality: number | undefined) => JSX.Element | null;
}

function EvaluationCard({ 
  evaluation, 
  onClick, 
  getStatusBadge, 
  getQualityBadge 
}: EvaluationCardProps) {
  const progress = evaluation.totalQuestions > 0 
    ? (evaluation.questionsTested / evaluation.totalQuestions) * 100 
    : 0;

  const hasPhantomRefs = (evaluation.phantomRefsDetected || 0) > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-800">{evaluation.agentName}</h3>
            {getStatusBadge(evaluation.status)}
            {evaluation.averageQuality && getQualityBadge(evaluation.averageQuality)}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Versión {evaluation.version}</span>
            <span>•</span>
            <span>{evaluation.totalQuestions} preguntas</span>
            <span>•</span>
            <span>Por {evaluation.createdByEmail}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-700">
            {evaluation.questionsTested}/{evaluation.totalQuestions} probadas
          </div>
          <div className="text-xs text-slate-500">
            {progress.toFixed(0)}% completo
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-600 mb-1">Calidad Promedio</div>
          <div className="font-bold text-slate-800">
            {evaluation.averageQuality ? `${evaluation.averageQuality.toFixed(1)}/10` : 'N/A'}
          </div>
        </div>
        
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-600 mb-1">Phantom Refs</div>
          <div className={`font-bold ${hasPhantomRefs ? 'text-red-600' : 'text-green-600'}`}>
            {evaluation.phantomRefsDetected || 0}
          </div>
        </div>
        
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-600 mb-1">Referencias</div>
          <div className="font-bold text-slate-800">
            {evaluation.avgSimilarity ? `${(evaluation.avgSimilarity * 100).toFixed(0)}%` : 'N/A'}
          </div>
        </div>
        
        <div className="p-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-600 mb-1">Aprobadas</div>
          <div className="font-bold text-green-600">
            {evaluation.questionsPassedQuality || 0}
          </div>
        </div>
      </div>

      {/* Phantom Refs Warning */}
      {hasPhantomRefs && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-800">
            {evaluation.phantomRefsDetected} phantom reference{evaluation.phantomRefsDetected !== 1 ? 's' : ''} detectada{evaluation.phantomRefsDetected !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * Create new evaluation modal
 */
interface CreateEvaluationModalProps {
  currentUserId: string;
  currentUserEmail: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateEvaluationModal({ 
  currentUserId, 
  currentUserEmail, 
  onClose, 
  onCreated 
}: CreateEvaluationModalProps) {
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriteria>({
    minimumQuality: 5.0,
    allowPhantomRefs: false,
    minCriticalCoverage: 3,
    minReferenceRelevance: 0.7,
    additionalRequirements: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${currentUserId}`);
      if (!response.ok) throw new Error('Failed to load agents');
      const data = await response.json();
      
      // Extract agents from groups
      const allAgents = data.groups?.flatMap((g: any) => g.conversations || []) || [];
      setAgents(allAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      
      const selectedAgentData = agents.find(a => a.id === selectedAgent);
      if (!selectedAgentData) {
        throw new Error('Selected agent not found');
      }

      const evaluation: Partial<Evaluation> = {
        agentId: selectedAgent!,
        agentName: selectedAgentData.title,
        version: 'v1',
        createdBy: currentUserId,
        createdByEmail: currentUserEmail,
        totalQuestions: questions.length,
        questions,
        categories: extractCategories(questions),
        successCriteria,
        status: 'draft',
        questionsTested: 0,
        questionsPassedQuality: 0,
      };

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          evaluation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create evaluation');
      }

      onCreated();
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Error al crear la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const extractCategories = (questions: EvaluationQuestion[]): QuestionCategory[] => {
    const categoryMap = new Map<string, QuestionCategory>();
    
    questions.forEach(q => {
      if (!categoryMap.has(q.category)) {
        categoryMap.set(q.category, {
          id: q.category,
          name: q.category,
          count: 0,
          priority: 'medium',
        });
      }
      const category = categoryMap.get(q.category)!;
      category.count++;
    });
    
    return Array.from(categoryMap.values());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Crear Nueva Evaluación</h2>
            <p className="text-sm text-slate-600 mt-1">
              Paso {step} de 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step > s ? 'bg-green-600' : step === s ? 'bg-blue-600' : 'bg-slate-200'
                } text-white font-semibold text-sm`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 ${step > s ? 'bg-green-600' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>Seleccionar Agente</span>
            <span>Agregar Preguntas</span>
            <span>Criterios de Éxito</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <SelectAgentStep
              agents={agents}
              selectedAgent={selectedAgent}
              onSelect={setSelectedAgent}
            />
          )}
          
          {step === 2 && (
            <AddQuestionsStep
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          )}
          
          {step === 3 && (
            <SuccessCriteriaStep
              criteria={successCriteria}
              onCriteriaChange={setSuccessCriteria}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedAgent) ||
                  (step === 2 && questions.length === 0)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Crear Evaluación
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 1: Select Agent
 */
interface SelectAgentStepProps {
  agents: any[];
  selectedAgent: string | null;
  onSelect: (agentId: string) => void;
}

function SelectAgentStep({ agents, selectedAgent, onSelect }: SelectAgentStepProps) {
  const [search, setSearch] = useState('');
  
  const filteredAgents = agents.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4">Selecciona el Agente a Evaluar</h3>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar agente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={`p-4 border rounded-lg text-left transition-all ${
              selectedAgent === agent.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-slate-800 mb-1 truncate">{agent.title}</div>
            <div className="text-xs text-slate-600">
              {agent.messageCount || 0} mensajes
            </div>
            {selectedAgent === agent.id && (
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                <CheckCircle className="w-3 h-3" />
                Seleccionado
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No se encontraron agentes
        </div>
      )}
    </div>
  );
}

/**
 * Step 2: Add Questions
 */
interface AddQuestionsStepProps {
  questions: EvaluationQuestion[];
  onQuestionsChange: (questions: EvaluationQuestion[]) => void;
}

function AddQuestionsStep({ questions, onQuestionsChange }: AddQuestionsStepProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [newCategory, setNewCategory] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | null>(null);

  const handleAddQuestion = () => {
    if (!newQuestion.trim() || !newCategory.trim()) return;

    const question: EvaluationQuestion = {
      id: `Q${(questions.length + 1).toString().padStart(3, '0')}`,
      number: questions.length + 1,
      category: newCategory,
      priority: newPriority,
      question: newQuestion,
      tested: false,
    };

    onQuestionsChange([...questions, question]);
    setNewQuestion('');
    setNewCategory('');
  };

  const handleRemoveQuestion = (id: string) => {
    onQuestionsChange(questions.filter(q => q.id !== id));
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.questions && Array.isArray(json.questions)) {
          onQuestionsChange(json.questions);
        } else {
          alert('Formato JSON inválido');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Agregar Preguntas de Evaluación</h3>
        <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
          <Download className="w-4 h-4" />
          Importar JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>
      </div>

      {/* Add Question Form */}
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mb-4">
        <div className="grid grid-cols-4 gap-3 mb-3">
          <input
            type="text"
            placeholder="Categoría"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
          
          <div className="col-span-2"></div>
        </div>
        
        <textarea
          placeholder="Escribe la pregunta de evaluación..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
        />
        
        <button
          onClick={handleAddQuestion}
          disabled={!newQuestion.trim() || !newCategory.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Pregunta
        </button>
      </div>

      {/* Questions List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No hay preguntas agregadas</p>
            <p className="text-xs mt-1">Agrega preguntas manualmente o importa un archivo JSON</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="p-3 border border-slate-200 rounded-lg bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-500">{q.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      q.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      q.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      q.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {q.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-600">{q.category}</span>
                  </div>
                  <p className="text-sm text-slate-800">{q.question}</p>
                </div>
                
                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>{questions.length}</strong> pregunta{questions.length !== 1 ? 's' : ''} agregada{questions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

/**
 * Step 3: Success Criteria
 */
interface SuccessCriteriaStepProps {
  criteria: SuccessCriteria;
  onCriteriaChange: (criteria: SuccessCriteria) => void;
}

function SuccessCriteriaStep({ criteria, onCriteriaChange }: SuccessCriteriaStepProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4">Definir Criterios de Éxito</h3>
      <p className="text-sm text-slate-600 mb-6">
        Estos criterios determinan cuándo un agente está listo para compartir con usuarios
      </p>

      <div className="space-y-5">
        {/* Minimum Quality */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Calidad Mínima Promedio
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={criteria.minimumQuality}
              onChange={(e) => onCriteriaChange({ 
                ...criteria, 
                minimumQuality: parseFloat(e.target.value) 
              })}
              className="flex-1"
            />
            <span className="text-lg font-bold text-blue-600 w-16 text-right">
              {criteria.minimumQuality.toFixed(1)}/10
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Promedio mínimo de calidad en todas las preguntas evaluadas
          </p>
        </div>

        {/* Phantom Refs */}
        <div>
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={!criteria.allowPhantomRefs}
              onChange={(e) => onCriteriaChange({ 
                ...criteria, 
                allowPhantomRefs: !e.target.checked 
              })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-700">Cero Phantom References</div>
              <div className="text-xs text-slate-600">
                No permitir referencias a documentos inexistentes
              </div>
            </div>
          </label>
        </div>

        {/* Critical Coverage */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Cobertura Mínima de Preguntas CRITICAL
          </label>
          <input
            type="number"
            min="0"
            value={criteria.minCriticalCoverage}
            onChange={(e) => onCriteriaChange({ 
              ...criteria, 
              minCriticalCoverage: parseInt(e.target.value) || 0 
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Cantidad mínima de preguntas CRITICAL que deben ser probadas
          </p>
        </div>

        {/* Reference Relevance */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Similitud Mínima de Referencias
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={criteria.minReferenceRelevance}
              onChange={(e) => onCriteriaChange({ 
                ...criteria, 
                minReferenceRelevance: parseFloat(e.target.value) 
              })}
              className="flex-1"
            />
            <span className="text-lg font-bold text-blue-600 w-16 text-right">
              {(criteria.minReferenceRelevance * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Similitud promedio mínima de las referencias recuperadas
          </p>
        </div>

        {/* Additional Requirements */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Requisitos Adicionales (Opcional)
          </label>
          <textarea
            placeholder="Ej: Debe mencionar códigos SAP específicos, debe incluir paso a paso, etc."
            value={criteria.additionalRequirements}
            onChange={(e) => onCriteriaChange({ 
              ...criteria, 
              additionalRequirements: e.target.value 
            })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Example Criteria (S001 as reference) */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-blue-800 mb-1">Ejemplo: S001 - GESTION BODEGAS GPT</div>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• Calidad mínima: 5.0/10 (alcanzado: 9.25/10)</li>
              <li>• Phantom refs: NO (alcanzado: 0)</li>
              <li>• Cobertura CRITICAL: 3+ preguntas (alcanzado: 4)</li>
              <li>• Similitud: 70%+ (alcanzado: 77%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Evaluation Detail Modal
 * Shows full results and allows running tests
 */
interface EvaluationDetailModalProps {
  evaluation: Evaluation;
  currentUserId: string;
  currentUserEmail: string;
  onClose: () => void;
  onUpdated: () => void;
}

function EvaluationDetailModal({ 
  evaluation, 
  currentUserId,
  currentUserEmail,
  onClose, 
  onUpdated 
}: EvaluationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'results'>('overview');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (activeTab === 'results') {
      loadTestResults();
    }
  }, [activeTab]);

  const loadTestResults = async () => {
    try {
      setLoadingResults(true);
      const response = await fetch(`/api/evaluations/${evaluation.id}/results`);
      if (!response.ok) throw new Error('Failed to load results');
      const data = await response.json();
      setTestResults(data.results || []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{evaluation.agentName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {evaluation.id} • Versión {evaluation.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Resumen', icon: TrendingUp },
            { id: 'questions', label: 'Preguntas', icon: FileText },
            { id: 'results', label: 'Resultados', icon: CheckCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === id
                  ? 'bg-white border-t-2 border-x border-blue-600 text-blue-600 -mb-px'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab evaluation={evaluation} />
          )}
          
          {activeTab === 'questions' && (
            <QuestionsTab 
              evaluation={evaluation}
              currentUserId={currentUserId}
              currentUserEmail={currentUserEmail}
              onTestStarted={onUpdated}
            />
          )}
          
          {activeTab === 'results' && (
            <ResultsTab 
              evaluation={evaluation}
              results={testResults}
              loading={loadingResults}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Overview Tab - Summary and metrics
 */
function OverviewTab({ evaluation }: { evaluation: Evaluation }) {
  const progress = evaluation.totalQuestions > 0
    ? (evaluation.questionsTested / evaluation.totalQuestions) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Preguntas Totales"
          value={evaluation.totalQuestions.toString()}
          icon={FileText}
          color="blue"
        />
        <MetricCard
          label="Probadas"
          value={`${evaluation.questionsTested}/${evaluation.totalQuestions}`}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          label="Calidad Promedio"
          value={evaluation.averageQuality ? `${evaluation.averageQuality.toFixed(1)}/10` : 'N/A'}
          icon={TrendingUp}
          color={evaluation.averageQuality && evaluation.averageQuality >= 7 ? 'green' : 'yellow'}
        />
        <MetricCard
          label="Phantom Refs"
          value={(evaluation.phantomRefsDetected || 0).toString()}
          icon={evaluation.phantomRefsDetected ? AlertCircle : CheckCircle}
          color={evaluation.phantomRefsDetected ? 'red' : 'green'}
        />
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Progreso</span>
          <span className="text-sm text-slate-600">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Success Criteria */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3">Criterios de Éxito</h3>
        <div className="space-y-3">
          <CriteriaCheck
            label="Calidad Mínima"
            required={`≥ ${evaluation.successCriteria.minimumQuality.toFixed(1)}/10`}
            achieved={evaluation.averageQuality ? `${evaluation.averageQuality.toFixed(1)}/10` : 'N/A'}
            passed={evaluation.averageQuality ? evaluation.averageQuality >= evaluation.successCriteria.minimumQuality : undefined}
          />
          
          <CriteriaCheck
            label="Phantom References"
            required={evaluation.successCriteria.allowPhantomRefs ? 'Permitido' : 'Cero'}
            achieved={(evaluation.phantomRefsDetected || 0).toString()}
            passed={evaluation.successCriteria.allowPhantomRefs || (evaluation.phantomRefsDetected || 0) === 0}
          />
          
          <CriteriaCheck
            label="Cobertura CRITICAL"
            required={`≥ ${evaluation.successCriteria.minCriticalCoverage} preguntas`}
            achieved={`${evaluation.questions.filter(q => q.priority === 'critical' && q.tested).length} probadas`}
            passed={evaluation.questions.filter(q => q.priority === 'critical' && q.tested).length >= evaluation.successCriteria.minCriticalCoverage}
          />
          
          <CriteriaCheck
            label="Similitud de Referencias"
            required={`≥ ${(evaluation.successCriteria.minReferenceRelevance * 100).toFixed(0)}%`}
            achieved={evaluation.avgSimilarity ? `${(evaluation.avgSimilarity * 100).toFixed(0)}%` : 'N/A'}
            passed={evaluation.avgSimilarity ? evaluation.avgSimilarity >= evaluation.successCriteria.minReferenceRelevance : undefined}
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3">Categorías</h3>
        <div className="grid grid-cols-2 gap-3">
          {evaluation.categories.map(cat => (
            <div key={cat.id} className="p-3 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">{cat.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  cat.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  cat.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {cat.priority.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-slate-600">{cat.count} preguntas</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Metric card component
 */
interface MetricCardProps {
  label: string;
  value: string;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="p-4 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

/**
 * Criteria check component
 */
interface CriteriaCheckProps {
  label: string;
  required: string;
  achieved: string;
  passed: boolean | undefined;
}

function CriteriaCheck({ label, required, achieved, passed }: CriteriaCheckProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        passed === undefined ? 'bg-slate-200' :
        passed ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {passed === undefined ? (
          <span className="text-white text-xs">?</span>
        ) : passed ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : (
          <XCircle className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-600">
          Requerido: {required} • Alcanzado: {achieved}
        </div>
      </div>
    </div>
  );
}

/**
 * Questions Tab - List and test questions
 */
interface QuestionsTabProps {
  evaluation: Evaluation;
  currentUserId: string;
  currentUserEmail: string;
  onTestStarted: () => void;
}

function QuestionsTab({ 
  evaluation, 
  currentUserId,
  currentUserEmail,
  onTestStarted 
}: QuestionsTabProps) {
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showTested, setShowTested] = useState(true);
  const [showUntested, setShowUntested] = useState(true);

  const filteredQuestions = evaluation.questions.filter(q => {
    if (filterPriority !== 'all' && q.priority !== filterPriority) return false;
    if (!showTested && q.tested) return false;
    if (!showUntested && !q.tested) return false;
    return true;
  });

  const groupedByCategory = filteredQuestions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, EvaluationQuestion[]>);

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="all">Todas las prioridades</option>
          <option value="critical">CRITICAL</option>
          <option value="high">HIGH</option>
          <option value="medium">MEDIUM</option>
          <option value="low">LOW</option>
        </select>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showTested}
            onChange={(e) => setShowTested(e.target.checked)}
            className="rounded text-blue-600"
          />
          Probadas
        </label>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUntested}
            onChange={(e) => setShowUntested(e.target.checked)}
            className="rounded text-blue-600"
          />
          Sin probar
        </label>
        
        <div className="flex-1"></div>
        
        <span className="text-sm text-slate-600">
          {filteredQuestions.length} preguntas
        </span>
      </div>

      {/* Questions by Category */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([category, questions]) => (
          <div key={category}>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              {category}
              <span className="text-xs font-normal text-slate-500">
                ({questions.length} pregunta{questions.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div className="space-y-2">
              {questions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  evaluationId={evaluation.id}
                  agentId={evaluation.agentId}
                  currentUserId={currentUserId}
                  currentUserEmail={currentUserEmail}
                  onTestCompleted={onTestStarted}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Filter className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No hay preguntas con los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual question card
 */
interface QuestionCardProps {
  question: EvaluationQuestion;
  evaluationId: string;
  agentId: string;
  currentUserId: string;
  currentUserEmail: string;
  onTestCompleted: () => void;
}

function QuestionCard({ 
  question, 
  evaluationId, 
  agentId, 
  currentUserId,
  currentUserEmail,
  onTestCompleted 
}: QuestionCardProps) {
  const [showTestModal, setShowTestModal] = useState(false);

  return (
    <>
      <div className={`p-4 border rounded-lg ${
        question.tested 
          ? 'border-green-200 bg-green-50' 
          : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-slate-500">{question.id}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                question.priority === 'critical' ? 'bg-red-100 text-red-700' :
                question.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                question.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {question.priority.toUpperCase()}
              </span>
              
              {question.tested && question.testResult && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  question.testResult.quality >= 9 ? 'bg-green-100 text-green-700' :
                  question.testResult.quality >= 7 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {question.testResult.quality}/10
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-800 mb-2">{question.question}</p>
            
            {question.expectedTopics && question.expectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.expectedTopics.map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {question.tested ? (
              <>
                <button
                  onClick={() => setShowTestModal(true)}
                  className="p-2 hover:bg-slate-100 rounded text-slate-600"
                  title="Ver resultado"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowTestModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                Probar
              </button>
            )}
          </div>
        </div>
      </div>

      {showTestModal && (
        <TestQuestionModal
          question={question}
          evaluationId={evaluationId}
          agentId={agentId}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          onClose={() => setShowTestModal(false)}
          onTestCompleted={() => {
            setShowTestModal(false);
            onTestCompleted();
          }}
        />
      )}
    </>
  );
}

/**
 * Test Question Modal
 * Interface to test a specific question
 */
interface TestQuestionModalProps {
  question: EvaluationQuestion;
  evaluationId: string;
  agentId: string;
  currentUserId: string;
  currentUserEmail: string;
  onClose: () => void;
  onTestCompleted: () => void;
}

function TestQuestionModal({ 
  question, 
  evaluationId, 
  agentId, 
  currentUserId,
  currentUserEmail,
  onClose, 
  onTestCompleted 
}: TestQuestionModalProps) {
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState('');
  const [references, setReferences] = useState<any[]>([]);
  const [quality, setQuality] = useState(5);
  const [notes, setNotes] = useState('');
  const [phantomRefs, setPhantomRefs] = useState(false);

  const runTest = async () => {
    try {
      setTesting(true);
      
      // Call agent with question
      const testResponse = await fetch(`/api/evaluations/${evaluationId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          questionId: question.id,
          agentId,
          prompt: question.question,
        }),
      });

      if (!testResponse.ok) {
        throw new Error('Test failed');
      }

      const result = await testResponse.json();
      setResponse(result.response);
      setReferences(result.references || []);
      
      // Auto-detect phantom refs
      const detectedPhantom = detectPhantomReferences(result.response, result.references);
      setPhantomRefs(detectedPhantom);
      
    } catch (error) {
      console.error('Error running test:', error);
      alert('Error al ejecutar la prueba');
    } finally {
      setTesting(false);
    }
  };

  const detectPhantomReferences = (text: string, refs: any[]): boolean => {
    const numberRegex = /\[(\d+)\]/g;
    const matches = text.matchAll(numberRegex);
    const maxRefNumber = refs.length;
    
    for (const match of matches) {
      const num = parseInt(match[1]);
      if (num > maxRefNumber) {
        return true;
      }
    }
    
    return false;
  };

  const handleSaveResult = async () => {
    try {
      const result = {
        evaluationId,
        questionId: question.id,
        agentId,
        testedBy: currentUserId,
        testedByEmail: currentUserEmail,
        prompt: question.question,
        response,
        references,
        quality,
        phantomRefs,
        notes,
        passedCriteria: quality >= 5 && !phantomRefs, // Simplified criteria
      };

      const saveResponse = await fetch(`/api/evaluations/${evaluationId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          result,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save result');
      }

      onTestCompleted();
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Error al guardar el resultado');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Probar Pregunta</h2>
            <p className="text-sm text-slate-600 mt-1">{question.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pregunta</label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-800">{question.question}</p>
            </div>
          </div>

          {/* Test Button */}
          {!response && (
            <button
              onClick={runTest}
              disabled={testing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Probando agente...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Ejecutar Prueba
                </>
              )}
            </button>
          )}

          {/* Response */}
          {response && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Respuesta del Agente</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{response}</p>
                </div>
              </div>

              {/* References */}
              {references.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Referencias ({references.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {references.map((ref, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-800">[{i + 1}] {ref.name}</span>
                          <span className="text-slate-600">{(ref.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{ref.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Calificación de Calidad
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-blue-600 w-16 text-right">
                    {quality}/10
                  </span>
                </div>
              </div>

              {/* Phantom Refs Check */}
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={phantomRefs}
                  onChange={(e) => setPhantomRefs(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-700">Phantom References Detectadas</div>
                  <div className="text-xs text-slate-600">
                    Marca si la respuesta menciona referencias que no existen
                  </div>
                </div>
              </label>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  placeholder="Observaciones sobre la respuesta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {response && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSaveResult}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Guardar Resultado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Results Tab - View all test results
 */
interface ResultsTabProps {
  evaluation: Evaluation;
  results: any[];
  loading: boolean;
}

function ResultsTab({ evaluation, results, loading }: ResultsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <TestTube className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium mb-2">No hay resultados aún</p>
        <p className="text-sm">Prueba algunas preguntas para ver resultados aquí</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Resultados de Pruebas ({results.length})
      </h3>

      <div className="space-y-3">
        {results.map((result) => (
          <div key={result.id} className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-500">{result.questionId}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    result.quality >= 9 ? 'bg-green-100 text-green-700' :
                    result.quality >= 7 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.quality}/10
                  </span>
                  
                  {result.phantomRefs && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      ⚠ Phantom Refs
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">Por {result.testedByEmail}</p>
              </div>
              
              <span className="text-xs text-slate-500">
                {new Date(result.testedAt).toLocaleDateString()}
              </span>
            </div>

            {result.notes && (
              <div className="p-2 bg-slate-50 rounded text-xs text-slate-700">
                {result.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

