import { useState, useEffect } from 'react';
import { ListTodo, ExternalLink, Clock, CheckCircle, Loader2, TrendingUp, Award, Star } from 'lucide-react';
import type { FeedbackTicket, MessageFeedback } from '../types/feedback';

interface MyFeedbackViewProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
  highlightTicketId?: string; // For showing "just created" ticket
}

export default function MyFeedbackView({ 
  userId, 
  userEmail, 
  isOpen, 
  onClose,
  highlightTicketId 
}: MyFeedbackViewProps) {
  const [myFeedback, setMyFeedback] = useState<MessageFeedback[]>([]);
  const [myTickets, setMyTickets] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(highlightTicketId || null);

  useEffect(() => {
    if (isOpen) {
      loadMyFeedback();
    }
  }, [isOpen, userId]);

  const loadMyFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 Loading my feedback for userId:', userId);

      // Load user's feedback
      const feedbackResponse = await fetch(`/api/feedback/my-feedback?userId=${userId}`);
      console.log('📡 My feedback response:', feedbackResponse.status);
      
      if (!feedbackResponse.ok) {
        const errorData = await feedbackResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ My feedback error:', errorData);
        throw new Error(errorData.error || `HTTP ${feedbackResponse.status}`);
      }

      const feedbackData = await feedbackResponse.json();
      console.log('✅ Feedback data received:', feedbackData.feedback?.length || 0, 'items');
      setMyFeedback(feedbackData.feedback || []);

      // Load associated tickets
      const ticketIds = (feedbackData.feedback || [])
        .map((f: MessageFeedback) => f.ticketId)
        .filter(Boolean);

      console.log('🎫 Loading tickets for', ticketIds.length, 'feedbacks');

      if (ticketIds.length > 0) {
        const ticketsResponse = await fetch(`/api/feedback/my-tickets?userId=${userId}`);
        console.log('📡 My tickets response:', ticketsResponse.status);
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          console.log('✅ Tickets data received:', ticketsData.tickets?.length || 0, 'tickets');
          
          // Ensure tickets have proper Date objects
          const processedTickets = (ticketsData.tickets || []).map((t: any) => ({
            ...t,
            createdAt: t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt),
            updatedAt: t.updatedAt instanceof Date ? t.updatedAt : new Date(t.updatedAt),
            resolvedAt: t.resolvedAt ? (t.resolvedAt instanceof Date ? t.resolvedAt : new Date(t.resolvedAt)) : undefined,
            assignedAt: t.assignedAt ? (t.assignedAt instanceof Date ? t.assignedAt : new Date(t.assignedAt)) : undefined,
          }));
          
          setMyTickets(processedTickets);
        } else {
          console.warn('⚠️ Tickets endpoint returned', ticketsResponse.status);
        }
      } else {
        console.log('ℹ️ No tickets to load (no feedback with ticketId yet)');
        setMyTickets([]);
      }
    } catch (err) {
      console.error('❌ Error loading my feedback:', err);
      setError(err instanceof Error ? err.message : 'Error loading feedback');
      setMyFeedback([]);
      setMyTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      new: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🆕 Nuevo', icon: Clock },
      triaged: { bg: 'bg-purple-100', text: 'text-purple-700', label: '👁️ Revisado', icon: Clock },
      prioritized: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '📊 Priorizado', icon: TrendingUp },
      'in-progress': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🔨 En Progreso', icon: Loader2 },
      'in-review': { bg: 'bg-orange-100', text: 'text-orange-700', label: '👀 En Revisión', icon: Clock },
      testing: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: '🧪 Testing', icon: Loader2 },
      done: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Completado', icon: CheckCircle },
      'wont-fix': { bg: 'bg-slate-100', text: 'text-slate-700', label: '🚫 No se hará', icon: Clock },
      duplicate: { bg: 'bg-slate-100', text: 'text-slate-700', label: '📋 Duplicado', icon: Clock },
    };
    return configs[status] || configs.new;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; position: string }> = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'P0: Crítico', position: '1ro' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'P1: Alto', position: 'Top 10%' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'P2: Medio', position: 'Top 50%' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'P3: Bajo', position: 'Backlog' },
    };
    return configs[priority] || configs.medium;
  };

  // Helper: Safe date formatting
  const formatDate = (date: any, format: 'date' | 'datetime' = 'datetime'): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Fecha no disponible';
      }
      return format === 'date' 
        ? dateObj.toLocaleDateString('es-ES')
        : dateObj.toLocaleString('es-ES');
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const getQueuePosition = (ticket: FeedbackTicket): { position: number; total: number } => {
    // Calculate position in queue based on priority and creation date
    const samePriority = myTickets.filter(t => 
      t.priority === ticket.priority && 
      ['new', 'triaged', 'prioritized'].includes(t.status)
    );
    
    // Sort by creation date (handle both Date objects and timestamps)
    const sorted = [...samePriority].sort((a, b) => {
      const timeA = a.createdAt instanceof Date 
        ? a.createdAt.getTime() 
        : new Date(a.createdAt).getTime();
      const timeB = b.createdAt instanceof Date 
        ? b.createdAt.getTime() 
        : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
    
    const position = sorted.findIndex(t => t.id === ticket.id) + 1;
    return { position, total: samePriority.length };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-yellow-600 flex items-center justify-center">
              <ListTodo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent">
                Mi Feedback
              </h2>
              <p className="text-sm text-violet-600">
                Seguimiento de tus sugerencias y reportes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <ExternalLink className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-violet-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Cargando tu feedback...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <p className="text-red-800 font-semibold">Error: {error}</p>
              <button
                onClick={loadMyFeedback}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : myFeedback.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aún no has dado feedback</p>
              <p className="text-sm text-slate-400 mt-2">
                Tus evaluaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-violet-50 to-yellow-50 border-2 border-violet-200 rounded-xl p-4">
                  <div className="text-sm text-violet-600 mb-1">Total Feedback</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent">
                    {myFeedback.length}
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="text-sm text-blue-600 mb-1">En Cola</div>
                  <div className="text-3xl font-bold text-blue-700">
                    {myTickets.filter(t => ['new', 'triaged', 'prioritized'].includes(t.status)).length}
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="text-sm text-yellow-600 mb-1">En Desarrollo</div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {myTickets.filter(t => ['in-progress', 'in-review', 'testing'].includes(t.status)).length}
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="text-sm text-green-600 mb-1">Implementados</div>
                  <div className="text-3xl font-bold text-green-700">
                    {myTickets.filter(t => t.status === 'done').length}
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-violet-600" />
                  Tus Tickets ({myTickets.length})
                </h3>

                {myTickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  const isExpanded = expandedTicket === ticket.id;
                  const isHighlighted = ticket.id === highlightTicketId;
                  const queue = getQueuePosition(ticket);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={ticket.id}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        isHighlighted 
                          ? 'border-violet-400 ring-4 ring-violet-200 shadow-lg' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Collapsed View */}
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <h4 className="font-bold text-slate-800 text-base mb-2 line-clamp-2">
                              {ticket.title}
                            </h4>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {/* Status */}
                              <span className={`px-2 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-full font-semibold flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>

                              {/* Priority + Queue Position */}
                              <span className={`px-2 py-1 ${priorityConfig.bg} ${priorityConfig.text} rounded-full font-semibold`}>
                                {priorityConfig.label}
                              </span>

                              {/* Queue Position - Only for pending tickets */}
                              {['new', 'triaged', 'prioritized'].includes(ticket.status) && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Posición: {queue.position}/{queue.total} en {priorityConfig.position}
                                </span>
                              )}

                              {/* Feedback Type */}
                              {ticket.originalFeedback && (
                                <span className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
                                  ticket.originalFeedback.type === 'expert'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gradient-to-r from-violet-100 to-yellow-100 text-violet-700'
                                }`}>
                                  {ticket.originalFeedback.type === 'expert' ? (
                                    <><Award className="w-3 h-3" /> Experto</>
                                  ) : (
                                    <><Star className="w-3 h-3" /> Usuario</>
                                  )}
                                </span>
                              )}

                              {/* Created date */}
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                {formatDate(ticket.createdAt, 'date')}
                              </span>
                            </div>

                            {/* New ticket highlight message */}
                            {isHighlighted && (
                              <div className="mt-3 p-3 bg-violet-50 border-2 border-violet-300 rounded-lg">
                                <p className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  ✨ Tu feedback fue recibido y convertido en este ticket
                                </p>
                                <p className="text-xs text-violet-600 mt-1">
                                  Haz click para ver detalles y seguir su progreso
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Expand indicator */}
                          <div className="flex-shrink-0">
                            <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="border-t-2 border-slate-200 p-6 bg-slate-50 space-y-4">
                          {/* Description */}
                          <div>
                            <h5 className="font-semibold text-slate-800 mb-2">Descripción</h5>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                              {ticket.description}
                            </p>
                          </div>

                          {/* Queue Position Details - Only for pending */}
                          {['new', 'triaged', 'prioritized'].includes(ticket.status) && (
                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                              <h5 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Posición en Cola
                              </h5>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-indigo-700">Tu posición:</span>
                                  <span className="text-2xl font-bold text-indigo-900">
                                    #{queue.position}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-indigo-600">En tu prioridad ({priorityConfig.label}):</span>
                                  <span className="font-semibold text-indigo-800">
                                    {queue.total} tickets
                                  </span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-indigo-200">
                                  <div className="flex items-center justify-between text-xs text-indigo-600">
                                    <span>Ubicación relativa:</span>
                                    <span className="font-bold">{priorityConfig.position}</span>
                                  </div>
                                  {/* Progress bar showing position */}
                                  <div className="mt-2 w-full bg-indigo-100 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all"
                                      style={{ width: `${(queue.position / queue.total) * 100}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-indigo-500 mt-1">
                                    <span>Primero</span>
                                    <span>Último</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Progress Timeline */}
                          <div>
                            <h5 className="font-semibold text-slate-800 mb-3">Timeline</h5>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-slate-800">Feedback recibido</div>
                                  <div className="text-xs text-slate-500">
                                    {formatDate(ticket.createdAt)}
                                  </div>
                                </div>
                              </div>

                              {ticket.status !== 'new' && (
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">Revisado por equipo</div>
                                    <div className="text-xs text-slate-500">
                                      {formatDate(ticket.updatedAt)}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {['in-progress', 'in-review', 'testing', 'done'].includes(ticket.status) && (
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">En desarrollo</div>
                                    <div className="text-xs text-slate-500">
                                      {ticket.assignedAt ? formatDate(ticket.assignedAt) : 'Pronto'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {ticket.status === 'done' && (
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">✅ Implementado</div>
                                    <div className="text-xs text-slate-500">
                                      {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : 'Recientemente'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Next steps for pending tickets */}
                              {!['done', 'wont-fix', 'duplicate'].includes(ticket.status) && (
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-600">
                                      {ticket.status === 'new' && 'Esperando revisión del equipo'}
                                      {ticket.status === 'triaged' && 'Esperando priorización'}
                                      {ticket.status === 'prioritized' && 'En cola para desarrollo'}
                                      {ticket.status === 'in-progress' && 'En desarrollo activo'}
                                      {ticket.status === 'in-review' && 'En code review'}
                                      {ticket.status === 'testing' && 'En QA testing'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Estimado: {ticket.estimatedEffort === 'xs' && '< 1 hora'}
                                      {ticket.estimatedEffort === 's' && '1-4 horas'}
                                      {ticket.estimatedEffort === 'm' && '1-2 días'}
                                      {ticket.estimatedEffort === 'l' && '3-5 días'}
                                      {ticket.estimatedEffort === 'xl' && '> 1 semana'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Original Feedback */}
                          {ticket.originalFeedback && (
                            <div>
                              <h5 className="font-semibold text-slate-800 mb-2">Tu Feedback Original</h5>
                              <div className={`p-4 rounded-lg ${
                                ticket.originalFeedback.type === 'expert'
                                  ? 'bg-purple-50 border-2 border-purple-200'
                                  : 'bg-gradient-to-r from-violet-50 to-yellow-50 border-2 border-violet-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold">
                                    {ticket.originalFeedback.type === 'expert' ? '👑 Experto' : '⭐ Usuario'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    ticket.originalFeedback.type === 'expert'
                                      ? ticket.originalFeedback.rating === 'inaceptable'
                                        ? 'bg-red-600 text-white'
                                        : ticket.originalFeedback.rating === 'aceptable'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-purple-600 text-white'
                                      : ticket.originalFeedback.rating <= 2
                                      ? 'bg-red-600 text-white'
                                      : ticket.originalFeedback.rating === 3
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-violet-600 text-white'
                                  }`}>
                                    {typeof ticket.originalFeedback.rating === 'string' 
                                      ? ticket.originalFeedback.rating 
                                      : `${ticket.originalFeedback.rating}/5 ⭐`}
                                  </span>
                                </div>
                                {ticket.originalFeedback.comment && (
                                  <p className="text-sm text-slate-700 italic">
                                    "{ticket.originalFeedback.comment}"
                                  </p>
                                )}
                                {ticket.originalFeedback.screenshots && ticket.originalFeedback.screenshots.length > 0 && (
                                  <div className="mt-2 text-xs text-slate-600">
                                    📸 {ticket.originalFeedback.screenshots.length} captura(s) incluida(s)
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* What's Next */}
                          {ticket.status !== 'done' && ticket.status !== 'wont-fix' && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                              <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Próximos Pasos
                              </h5>
                              <p className="text-sm text-blue-700">
                                {ticket.status === 'new' && 'Tu feedback está siendo revisado por el equipo. Pronto será priorizado en el roadmap.'}
                                {ticket.status === 'triaged' && 'El equipo revisó tu feedback y lo clasificó. Ahora será agregado al roadmap según prioridad.'}
                                {ticket.status === 'prioritized' && `Tu ticket está en cola de desarrollo (posición ${queue.position}). Será tomado pronto según capacidad del equipo.`}
                                {ticket.status === 'in-progress' && 'Un desarrollador está trabajando en tu feedback. Pronto estará en revisión.'}
                                {ticket.status === 'in-review' && 'El código está siendo revisado. Si pasa QA, será implementado.'}
                                {ticket.status === 'testing' && '¡Casi listo! Tu mejora está en testing. Pronto estará en producción.'}
                              </p>
                              
                              {ticket.sprintAssigned && (
                                <div className="mt-2 text-xs text-blue-600">
                                  📅 Asignado a: {ticket.sprintAssigned}
                                </div>
                              )}
                              {ticket.roadmapQuarter && (
                                <div className="mt-1 text-xs text-blue-600">
                                  🗓️ Roadmap: {ticket.roadmapQuarter}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completed message */}
                          {ticket.status === 'done' && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                              <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                ¡Implementado!
                              </h5>
                              <p className="text-sm text-green-700">
                                ✅ Tu feedback fue implementado y está disponible en la plataforma.
                                ¡Gracias por ayudarnos a mejorar!
                              </p>
                              {ticket.resolvedAt && (
                                <div className="mt-2 text-xs text-green-600">
                                  Implementado el: {formatDate(ticket.resolvedAt)}
                                </div>
                              )}
                              {ticket.releaseVersion && (
                                <div className="mt-1 text-xs text-green-600">
                                  Versión: {ticket.releaseVersion}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Seguimiento en tiempo real de tu feedback
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadMyFeedback}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
            >
              Actualizar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

