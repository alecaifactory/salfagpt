/**
 * 🗺️ Roadmap Modal - Complete Roadmap & Backlog System
 * 
 * Features:
 * - 5-column Kanban: Backlog, Roadmap, In Development, Expert Review, Production
 * - Color-coded cards by user role: User (blue), Expert (violet), Admin (yellow)
 * - Rudy chatbot for AI-powered prioritization
 * - ROI estimation per card
 * - Full feedback context (conversation, images, annotations)
 * - OKR/KPI alignment analysis
 * 
 * 🔒 SuperAdmin Only: alec@getaifactory.com
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Bot,
  ThumbsUp,
  Share2,
  Sparkles,
  ChevronRight,
  Building2,
  User as UserIcon,
  Award,
  DollarSign,
  BarChart3,
  Send,
  Loader2,
} from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  userEmail: string;
}

type Lane = 'backlog' | 'roadmap' | 'in_development' | 'expert_review' | 'production';

type UserRole = 'user' | 'expert' | 'admin';

interface FeedbackCard {
  id: string;
  ticketId: string;
  
  // User info
  createdBy: string; // User name
  createdByEmail: string;
  userRole: UserRole;
  userDomain: string; // Company domain
  
  // Content
  title: string;
  description: string;
  agentName: string; // Agent where feedback was given
  conversationId: string;
  
  // Visual context
  screenshot?: string;
  annotations?: any[];
  
  // AI Analysis
  aiSummary: string;
  okrAlignment: string[];
  kpiImpact: {
    csat: number; // Expected: 4+
    nps: number; // Expected: >98
    roi: number; // Estimated ROI
    customKPIs: Array<{ name: string; value: string }>;
  };
  
  // Social
  upvotes: number;
  upvotedBy: string[];
  shares: number;
  
  // Roadmap state
  lane: Lane;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: 'xs' | 's' | 'm' | 'l' | 'xl';
  
  createdAt: Date;
}

const LANES: Array<{ 
  id: Lane; 
  title: string; 
  color: string; 
  description: string;
  icon: React.ComponentType<any>;
}> = [
  { id: 'backlog', title: 'Backlog', color: 'slate', description: 'Feedback pendiente', icon: MessageSquare },
  { id: 'roadmap', title: 'Roadmap', color: 'blue', description: 'Planificado', icon: Target },
  { id: 'in_development', title: 'In Development', color: 'indigo', description: 'En desarrollo', icon: Sparkles },
  { id: 'expert_review', title: 'Expert Review', color: 'purple', description: 'Revisión técnica', icon: Award },
  { id: 'production', title: 'Production', color: 'green', description: 'Desplegado', icon: BarChart3 },
];

export default function RoadmapModal({ isOpen, onClose, companyId, userEmail }: RoadmapModalProps) {
  const [cards, setCards] = useState<FeedbackCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<FeedbackCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  
  // Rudy chatbot state
  const [showRudy, setShowRudy] = useState(false);
  const [rudyMessages, setRudyMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [rudyInput, setRudyInput] = useState('');
  const [rudyLoading, setRudyLoading] = useState(false);
  
  // Load feedback cards
  useEffect(() => {
    if (isOpen) {
      loadFeedbackCards();
    }
  }, [isOpen, companyId]);
  
  async function loadFeedbackCards() {
    try {
      setLoading(true);
      
      // Load both feedback tickets and backlog items
      const [ticketsResponse, backlogResponse] = await Promise.all([
        fetch(`/api/feedback/tickets?companyId=${companyId}`),
        fetch(`/api/backlog/items?companyId=${companyId}`)
      ]);
      
      const tickets = ticketsResponse.ok ? await ticketsResponse.json() : [];
      const backlogItems = backlogResponse.ok ? await backlogResponse.json() : [];
      
      // Transform to cards (combine tickets + backlog items)
      const feedbackCards: FeedbackCard[] = tickets.map((ticket: any) => ({
        id: ticket.id,
        ticketId: ticket.ticketId,
        createdBy: ticket.createdByName || 'Usuario',
        createdByEmail: ticket.createdByEmail || '',
        userRole: ticket.createdByRole || 'user',
        userDomain: ticket.companyDomain || companyId,
        title: ticket.title,
        description: ticket.description || '',
        agentName: ticket.agentName || 'General',
        conversationId: ticket.conversationId || '',
        screenshot: ticket.screenshot,
        annotations: ticket.annotations || [],
        aiSummary: ticket.aiSummary || 'Pendiente análisis',
        okrAlignment: ticket.okrAlignment || [],
        kpiImpact: {
          csat: ticket.estimatedCSAT || 0,
          nps: ticket.estimatedNPS || 0,
          roi: ticket.estimatedROI || 0,
          customKPIs: ticket.customKPIs || []
        },
        upvotes: ticket.upvotes || 0,
        upvotedBy: ticket.upvotedBy || [],
        shares: ticket.shares || 0,
        lane: ticket.lane || 'backlog',
        priority: ticket.priority || 'medium',
        estimatedEffort: ticket.estimatedEffort || 'm',
        createdAt: new Date(ticket.createdAt),
      }));
      
      setCards(feedbackCards);
      
    } catch (error) {
      console.error('Failed to load feedback cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }
  
  // Get role color
  function getRoleColor(role: UserRole): { bg: string; border: string; text: string; badge: string } {
    const colors = {
      user: { 
        bg: 'bg-blue-50', 
        border: 'border-blue-300', 
        text: 'text-blue-800',
        badge: 'bg-blue-600 text-white'
      },
      expert: { 
        bg: 'bg-purple-50', 
        border: 'border-purple-300', 
        text: 'text-purple-800',
        badge: 'bg-purple-600 text-white'
      },
      admin: { 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-300', 
        text: 'text-yellow-800',
        badge: 'bg-yellow-600 text-white'
      },
    };
    return colors[role] || colors.user;
  }
  
  // Drag & drop handlers
  function handleDragStart(cardId: string) {
    setDraggedCard(cardId);
  }
  
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  
  async function handleDrop(targetLane: Lane) {
    if (!draggedCard) return;
    
    const card = cards.find(c => c.id === draggedCard);
    if (!card || card.lane === targetLane) {
      setDraggedCard(null);
      return;
    }
    
    try {
      // Optimistic update
      setCards(prev => prev.map(c => 
        c.id === draggedCard ? { ...c, lane: targetLane } : c
      ));
      
      // Update in backend
      await fetch(`/api/backlog/items/${draggedCard}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane: targetLane }),
      });
      
      console.log('✅ Card moved to', targetLane);
      
    } catch (error) {
      console.error('Failed to move card:', error);
      loadFeedbackCards(); // Reload on error
    } finally {
      setDraggedCard(null);
    }
  }
  
  // Get cards for lane
  function getCardsForLane(lane: Lane): FeedbackCard[] {
    return cards.filter(c => c.lane === lane);
  }
  
  // Talk to Rudy
  async function handleRudyMessage() {
    if (!rudyInput.trim()) return;
    
    const userMessage = rudyInput;
    setRudyInput('');
    setRudyMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setRudyLoading(true);
    
    try {
      // Call Rudy API with full context
      const response = await fetch('/api/roadmap/rudy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cards: cards, // Full roadmap context
          conversationHistory: rudyMessages,
        }),
      });
      
      const data = await response.json();
      
      setRudyMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
      
    } catch (error) {
      console.error('Rudy error:', error);
      setRudyMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, tuve un problema. Intenta de nuevo.' 
      }]);
    } finally {
      setRudyLoading(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-[90vh] max-w-[95vw] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Roadmap Flow</h2>
              <p className="text-sm text-slate-600">
                {cards.length} items • Backlog → Roadmap → Development → Review → Production
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Rudy chatbot toggle */}
            <button
              onClick={() => setShowRudy(!showRudy)}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                showRudy 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <Bot className="w-5 h-5" />
              {showRudy ? 'Ocultar' : 'Hablar con'} Rudy
            </button>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Kanban Board */}
          <div className={`${showRudy ? 'flex-[2]' : 'flex-1'} overflow-x-auto p-6 transition-all`}>
            <div className="flex gap-4 h-full">
              {LANES.map((lane) => {
                const laneCards = getCardsForLane(lane.id);
                const LaneIcon = lane.icon;
                
                return (
                  <div
                    key={lane.id}
                    className="flex-1 min-w-[280px] max-w-[320px] flex flex-col"
                  >
                    {/* Lane Header */}
                    <div className={`bg-${lane.color}-50 border-2 border-${lane.color}-300 rounded-t-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <LaneIcon className={`w-5 h-5 text-${lane.color}-600`} />
                        <h3 className={`text-lg font-bold text-${lane.color}-800`}>
                          {lane.title}
                        </h3>
                        <span className={`ml-auto px-2 py-1 bg-${lane.color}-200 text-${lane.color}-800 rounded-full text-sm font-bold`}>
                          {laneCards.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{lane.description}</p>
                    </div>
                    
                    {/* Lane Content */}
                    <div
                      className="flex-1 bg-slate-50 border-l-2 border-r-2 border-b-2 border-slate-200 rounded-b-xl p-3 space-y-3 overflow-y-auto"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(lane.id)}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      ) : laneCards.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <LaneIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Sin items</p>
                        </div>
                      ) : (
                        laneCards.map((card) => {
                          const roleColors = getRoleColor(card.userRole);
                          
                          return (
                            <div
                              key={card.id}
                              draggable
                              onDragStart={() => handleDragStart(card.id)}
                              onClick={() => setSelectedCard(card)}
                              className={`${roleColors.bg} border-2 ${roleColors.border} rounded-lg p-4 cursor-move hover:shadow-lg transition-all ${
                                draggedCard === card.id ? 'opacity-50 scale-95' : ''
                              }`}
                            >
                              {/* Header: User info */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded-full ${roleColors.badge} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                    {card.createdBy.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-semibold ${roleColors.text} truncate`}>
                                      {card.createdBy}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {card.userDomain}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Role badge */}
                                <span className={`${roleColors.badge} px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0`}>
                                  {card.userRole.toUpperCase()}
                                </span>
                              </div>
                              
                              {/* Ticket ID */}
                              <div className="mb-2">
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  {card.ticketId}
                                </span>
                              </div>
                              
                              {/* Title */}
                              <h4 className="font-semibold text-sm text-slate-800 mb-2 line-clamp-2">
                                {card.title}
                              </h4>
                              
                              {/* Agent context */}
                              <div className="flex items-center gap-1 mb-3 text-xs text-slate-600">
                                <MessageSquare className="w-3 h-3" />
                                <span className="truncate">Agente: {card.agentName}</span>
                              </div>
                              
                              {/* Screenshot indicator */}
                              {card.screenshot && (
                                <div className="flex items-center gap-1 mb-3 text-xs text-blue-600">
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Con captura</span>
                                </div>
                              )}
                              
                              {/* KPI Impact */}
                              <div className="space-y-1 mb-3 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">CSAT:</span>
                                  <span className={`font-bold ${card.kpiImpact.csat >= 4 ? 'text-green-700' : 'text-slate-700'}`}>
                                    {card.kpiImpact.csat.toFixed(1)}+
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">NPS:</span>
                                  <span className={`font-bold ${card.kpiImpact.nps >= 98 ? 'text-green-700' : 'text-slate-700'}`}>
                                    {card.kpiImpact.nps}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">ROI:</span>
                                  <span className="font-bold text-purple-700">
                                    {card.kpiImpact.roi}x
                                  </span>
                                </div>
                              </div>
                              
                              {/* Social metrics */}
                              <div className="flex items-center gap-3 text-xs border-t border-slate-200 pt-2">
                                <div className="flex items-center gap-1 text-slate-600">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span className="font-medium">{card.upvotes}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Share2 className="w-3 h-3" />
                                  <span className="font-medium">{card.shares}</span>
                                </div>
                                <div className="ml-auto">
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Rudy Chatbot Panel */}
          {showRudy && (
            <div className="w-[400px] border-l-2 border-slate-200 flex flex-col bg-gradient-to-b from-purple-50 to-white">
              {/* Rudy Header */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <Bot className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Rudy</h3>
                    <p className="text-xs text-purple-100">AI Roadmap Assistant</p>
                  </div>
                </div>
              </div>
              
              {/* Rudy Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {rudyMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p className="text-sm text-slate-600 mb-2">
                      ¡Hola! Soy Rudy 👋
                    </p>
                    <p className="text-xs text-slate-500 px-4">
                      Puedo ayudarte a priorizar el roadmap, analizar ROI, y alinear con tus OKRs.
                    </p>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setRudyInput('¿Cuáles son las 3 tarjetas con mayor ROI?')}
                        className="text-xs text-purple-600 hover:text-purple-800 block mx-auto"
                      >
                        💡 ¿Cuáles son las 3 tarjetas con mayor ROI?
                      </button>
                      <button
                        onClick={() => setRudyInput('¿Qué features están mejor alineados con OKRs?')}
                        className="text-xs text-purple-600 hover:text-purple-800 block mx-auto"
                      >
                        💡 ¿Qué está mejor alineado con OKRs?
                      </button>
                      <button
                        onClick={() => setRudyInput('¿Qué debería mover a In Development?')}
                        className="text-xs text-purple-600 hover:text-purple-800 block mx-auto"
                      >
                        💡 ¿Qué debería mover a Development?
                      </button>
                    </div>
                  </div>
                ) : (
                  rudyMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`${
                        msg.role === 'user' 
                          ? 'ml-auto bg-blue-600 text-white' 
                          : 'mr-auto bg-white border-2 border-purple-200 text-slate-800'
                      } max-w-[85%] p-3 rounded-lg`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                )}
                
                {rudyLoading && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Rudy está pensando...</span>
                  </div>
                )}
              </div>
              
              {/* Rudy Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rudyInput}
                    onChange={(e) => setRudyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRudyMessage()}
                    placeholder="Pregunta a Rudy sobre priorización..."
                    className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleRudyMessage}
                    disabled={!rudyInput.trim() || rudyLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Detail Modal (overlay on top of main modal) */}
      {selectedCard && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-70 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
              {/* Card Detail Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-mono font-bold text-slate-700">
                      {selectedCard.ticketId}
                    </span>
                    
                    <span className={`${getRoleColor(selectedCard.userRole).badge} px-3 py-1 rounded-full text-xs font-bold`}>
                      {selectedCard.userRole.toUpperCase()}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {selectedCard.title}
                  </h2>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {selectedCard.createdBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {selectedCard.userDomain}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {selectedCard.agentName}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Card Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Descripción</h3>
                  <p className="text-sm text-slate-700">{selectedCard.description}</p>
                </div>
                
                {/* AI Summary */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-800">Análisis de Rudy</h3>
                  </div>
                  <p className="text-sm text-slate-700">{selectedCard.aiSummary}</p>
                </div>
                
                {/* KPI Impact */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Impacto Esperado</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-green-700 mb-1">CSAT</p>
                      <p className="text-3xl font-bold text-green-800">
                        {selectedCard.kpiImpact.csat.toFixed(1)}+
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Target: 4+</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-blue-700 mb-1">NPS</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {selectedCard.kpiImpact.nps}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Target: &gt;98</p>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-purple-700 mb-1">ROI</p>
                      <p className="text-3xl font-bold text-purple-800">
                        {selectedCard.kpiImpact.roi}x
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Estimado</p>
                    </div>
                  </div>
                  
                  {/* Custom KPIs */}
                  {selectedCard.kpiImpact.customKPIs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedCard.kpiImpact.customKPIs.map((kpi, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-xs text-slate-600">{kpi.name}:</span>
                          <span className="text-xs font-semibold text-slate-800">{kpi.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* OKR Alignment */}
                {selectedCard.okrAlignment.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">OKR Alignment</h3>
                    <div className="space-y-2">
                      {selectedCard.okrAlignment.map((okr, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <Target className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">{okr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Screenshot with annotations */}
                {selectedCard.screenshot && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Captura con Anotaciones</h3>
                    <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                      <img 
                        src={selectedCard.screenshot} 
                        alt="Feedback screenshot"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                
                {/* Conversation Link */}
                <div>
                  <button
                    onClick={() => {
                      // Open conversation in new tab or navigate
                      window.open(`/chat?conversationId=${selectedCard.conversationId}`, '_blank');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-blue-800">Ver Conversación Completa</p>
                        <p className="text-xs text-slate-600">Contexto original del feedback</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
                
                {/* Social Metrics */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{selectedCard.upvotes}</p>
                      <p className="text-xs text-slate-600">Upvotes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{selectedCard.shares}</p>
                      <p className="text-xs text-slate-600">Shares</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{selectedCard.upvotedBy.length}</p>
                      <p className="text-xs text-slate-600">Supporters</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-6 border-t border-slate-200 space-y-3">
                <button
                  onClick={() => {
                    // Ask Rudy about this card
                    setRudyInput(`Analiza el ROI y prioridad de ${selectedCard.ticketId}`);
                    setSelectedCard(null);
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Bot className="w-5 h-5" />
                  Preguntar a Rudy
                </button>
                
                <button
                  onClick={() => setSelectedCard(null)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

