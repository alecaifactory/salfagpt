import { useState, useEffect } from 'react';
import { 
  ListTodo, Filter, Search, ArrowUpDown, CheckCircle, Clock, 
  AlertTriangle, Zap, User as UserIcon, Award, X as XIcon,
  ChevronDown, ChevronRight, Calendar, Tag, Users
} from 'lucide-react';
import type { FeedbackTicket, TicketStatus, TicketPriority, TicketCategory } from '../types/feedback';

interface FeedbackBacklogDashboardProps {
  userId: string;
  userRole: string;
}

export default function FeedbackBacklogDashboard({
  userId,
  userRole,
}: FeedbackBacklogDashboardProps) {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // View options
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'impact'>('priority');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/feedback/tickets?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'date') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return impactOrder[a.userImpact] - impactOrder[b.userImpact];
    }
  });

  // Stats
  const stats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress').length,
    done: tickets.filter((t) => t.status === 'done').length,
    critical: tickets.filter((t) => t.priority === 'critical').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-violet-600">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando backlog...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-semibold">Error: {error}</p>
        <button
          onClick={loadTickets}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-yellow-600 flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Backlog de Feedback</h2>
            <p className="text-sm text-slate-600">
              Gestiona y prioriza mejoras del sistema
            </p>
          </div>
        </div>

        <button
          onClick={loadTickets}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
        >
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-600 mb-1">Total Tickets</div>
          <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 mb-1">Nuevos</div>
          <div className="text-3xl font-bold text-blue-700">{stats.new}</div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="text-sm text-yellow-600 mb-1">En Progreso</div>
          <div className="text-3xl font-bold text-yellow-700">{stats.inProgress}</div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600 mb-1">Completados</div>
          <div className="text-3xl font-bold text-green-700">{stats.done}</div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="text-sm text-red-600 mb-1">Críticos</div>
          <div className="text-3xl font-bold text-red-700">{stats.critical}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tickets..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevos</option>
              <option value="triaged">Triaged</option>
              <option value="prioritized">Priorizados</option>
              <option value="in-progress">En Progreso</option>
              <option value="in-review">En Revisión</option>
              <option value="testing">Testing</option>
              <option value="done">Completados</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">P0: Crítico</option>
              <option value="high">P1: Alto</option>
              <option value="medium">P2: Medio</option>
              <option value="low">P3: Bajo</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="bug">🐛 Bug</option>
              <option value="feature-request">✨ Feature Request</option>
              <option value="ui-improvement">🎨 UI Improvement</option>
              <option value="performance">⚡ Performance</option>
              <option value="security">🔒 Security</option>
              <option value="content-quality">📝 Content Quality</option>
              <option value="agent-behavior">🤖 Agent Behavior</option>
              <option value="context-accuracy">🎯 Context Accuracy</option>
              <option value="other">📌 Other</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-slate-600">Ordenar por:</span>
          <div className="flex gap-2">
            {(['priority', 'date', 'impact'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === sort
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sort === 'priority' && 'Prioridad'}
                {sort === 'date' && 'Fecha'}
                {sort === 'impact' && 'Impacto'}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-500 ml-auto">
            {filteredTickets.length} de {tickets.length} tickets
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {sortedTickets.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-12 text-center">
            <ListTodo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No hay tickets que coincidan con los filtros</p>
          </div>
        ) : (
          sortedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              expanded={expandedTicket === ticket.id}
              onToggleExpand={() => 
                setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
              }
              onUpdate={loadTickets}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Ticket Card Component
interface TicketCardProps {
  ticket: FeedbackTicket;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: () => void;
}

function TicketCard({ ticket, expanded, onToggleExpand, onUpdate }: TicketCardProps) {
  const priorityConfig = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'P0: Crítico', icon: Zap },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'P1: Alto', icon: AlertTriangle },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'P2: Medio', icon: Clock },
    low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'P3: Bajo', icon: CheckCircle },
  };

  const statusConfig = {
    new: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🆕 Nuevo' },
    triaged: { bg: 'bg-purple-100', text: 'text-purple-700', label: '👁️ Triaged' },
    prioritized: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '📊 Priorizado' },
    'in-progress': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🔨 En Progreso' },
    'in-review': { bg: 'bg-orange-100', text: 'text-orange-700', label: '👀 En Revisión' },
    testing: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: '🧪 Testing' },
    done: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Completado' },
    'wont-fix': { bg: 'bg-slate-100', text: 'text-slate-700', label: '🚫 No se hará' },
    duplicate: { bg: 'bg-slate-100', text: 'text-slate-700', label: '📋 Duplicado' },
  };

  const config = priorityConfig[ticket.priority];
  const PriorityIcon = config.icon;

  const feedbackTypeConfig = ticket.originalFeedback.type === 'expert'
    ? { bg: 'bg-purple-100', text: 'text-purple-700', icon: Award, label: 'Experto' }
    : { bg: 'bg-gradient-to-r from-violet-100 to-yellow-100', text: 'bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent', icon: UserIcon, label: 'Usuario' };

  const FeedbackIcon = feedbackTypeConfig.icon;

  return (
    <div className={`bg-white border-2 ${config.border} rounded-xl overflow-hidden transition-all`}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-bold text-slate-800 text-lg flex-1 line-clamp-2">
              {ticket.title}
            </h3>
            <div className={`flex-shrink-0 p-2 ${config.bg} rounded-lg`}>
              <PriorityIcon className={`w-5 h-5 ${config.text}`} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <span className={`px-2 py-1 ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].text} rounded-full font-semibold`}>
              {statusConfig[ticket.status].label}
            </span>

            {/* Priority */}
            <span className={`px-2 py-1 ${config.bg} ${config.text} rounded-full font-semibold`}>
              {config.label}
            </span>

            {/* Category */}
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
              {getCategoryEmoji(ticket.category)} {ticket.category}
            </span>

            {/* Feedback Type */}
            <span className={`px-2 py-1 ${feedbackTypeConfig.bg} rounded-full font-semibold flex items-center gap-1`}>
              <FeedbackIcon className="w-3 h-3" />
              <span className={typeof feedbackTypeConfig.text === 'string' && feedbackTypeConfig.text.includes('gradient') ? feedbackTypeConfig.text : `${feedbackTypeConfig.text}`}>
                {feedbackTypeConfig.label}
              </span>
            </span>

            {/* User Impact */}
            <span className={`px-2 py-1 rounded-full font-medium ${
              ticket.userImpact === 'critical' ? 'bg-red-100 text-red-700' :
              ticket.userImpact === 'high' ? 'bg-orange-100 text-orange-700' :
              ticket.userImpact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              Impacto: {ticket.userImpact}
            </span>

            {/* Effort */}
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
              Esfuerzo: {ticket.estimatedEffort.toUpperCase()}
            </span>

            {/* Date */}
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
            </span>

            {/* Reporter */}
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" />
              {ticket.reportedByEmail.split('@')[0]}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t-2 border-slate-200 p-6 bg-slate-50 space-y-4">
          {/* Description */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Descripción</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Original Feedback */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Feedback Original</h4>
            <div className={`p-4 rounded-lg ${
              ticket.originalFeedback.type === 'expert' 
                ? 'bg-purple-50 border-2 border-purple-200' 
                : 'bg-gradient-to-r from-violet-50 to-yellow-50 border-2 border-violet-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {ticket.originalFeedback.type === 'expert' ? '👑 Experto' : '⭐ Usuario'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  ticket.originalFeedback.type === 'expert'
                    ? ticket.originalFeedback.rating === 'inaceptable'
                      ? 'bg-red-600 text-white'
                      : ticket.originalFeedback.rating === 'aceptable'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-purple-600 text-white'
                    : 'bg-violet-600 text-white'
                }`}>
                  {ticket.originalFeedback.rating}
                </span>
              </div>
              {ticket.originalFeedback.comment && (
                <p className="text-sm text-slate-700 italic">
                  "{ticket.originalFeedback.comment}"
                </p>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          {ticket.aiAnalysis && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Análisis AI</h4>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-slate-700">{ticket.aiAnalysis.summary}</p>
                
                {ticket.aiAnalysis.actionableItems.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm text-blue-900 mb-1">
                      Acciones Recomendadas:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {ticket.aiAnalysis.actionableItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {ticket.originalFeedback.screenshots && ticket.originalFeedback.screenshots.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Capturas ({ticket.originalFeedback.screenshots.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {ticket.originalFeedback.screenshots.map((screenshot, idx) => (
                  <div key={screenshot.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">
                    <img
                      src={screenshot.imageDataUrl}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-auto"
                    />
                    <div className="p-2 bg-slate-100 text-xs text-slate-600">
                      {screenshot.annotations.length} anotaciones
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <select
              value={ticket.status}
              onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus, onUpdate)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-violet-500"
            >
              {Object.keys(statusConfig).map((status) => (
                <option key={status} value={status}>
                  {statusConfig[status as TicketStatus].label}
                </option>
              ))}
            </select>

            <select
              value={ticket.priority}
              onChange={(e) => updateTicketPriority(ticket.id, e.target.value as TicketPriority, onUpdate)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-violet-500"
            >
              {Object.keys(priorityConfig).map((priority) => (
                <option key={priority} value={priority}>
                  {priorityConfig[priority as TicketPriority].label}
                </option>
              ))}
            </select>

            <button
              onClick={() => viewFeedbackDetails(ticket.feedbackId)}
              className="ml-auto px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
            >
              Ver Feedback Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getCategoryEmoji(category: TicketCategory): string {
  const emojis: Record<TicketCategory, string> = {
    bug: '🐛',
    'feature-request': '✨',
    'ui-improvement': '🎨',
    performance: '⚡',
    security: '🔒',
    'content-quality': '📝',
    'agent-behavior': '🤖',
    'context-accuracy': '🎯',
    other: '📌',
  };
  return emojis[category] || '📌';
}

async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  onUpdate: () => void
) {
  try {
    const response = await fetch(`/api/feedback/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      onUpdate();
    }
  } catch (error) {
    console.error('Error updating ticket status:', error);
  }
}

async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority,
  onUpdate: () => void
) {
  try {
    const response = await fetch(`/api/feedback/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });

    if (response.ok) {
      onUpdate();
    }
  } catch (error) {
    console.error('Error updating ticket priority:', error);
  }
}

function viewFeedbackDetails(feedbackId: string) {
  // Open feedback details modal
  console.log('View feedback:', feedbackId);
  // TODO: Implement feedback detail view
}

