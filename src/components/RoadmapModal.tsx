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
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  userEmail: string;
  userId: string;
  userRole: string;
  selectedTicketId?: string; // Optional ticket ID to auto-select
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

export default function RoadmapModal({ isOpen, onClose, companyId, userEmail, userId, userRole, selectedTicketId }: RoadmapModalProps) {
  const [cards, setCards] = useState<FeedbackCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<FeedbackCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  
  // Pagination
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter for recent tickets
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  
  // Rudy chatbot state
  const [showRudy, setShowRudy] = useState(false);
  const [rudyMessages, setRudyMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [rudyInput, setRudyInput] = useState('');
  const [rudyLoading, setRudyLoading] = useState(false);
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Spec generation state
  const [generatingSpec, setGeneratingSpec] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState<string | null>(null);
  const [specCopied, setSpecCopied] = useState(false);
  const [showSpecLog, setShowSpecLog] = useState(false);
  const [specGenerations, setSpecGenerations] = useState<Array<{
    specId: string;
    title: string;
    generatedAt: Date;
    generatedBy: string;
    markdown: string;
  }>>([]);
  
  // Load feedback cards with real-time updates
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 [ROADMAP] useEffect triggered - loading cards');
      loadFeedbackCards(true); // Reset on open
      
      // Set up polling for real-time updates (every 30 seconds)
      console.log('⏱️ [ROADMAP] Setting up 30s polling interval');
      const interval = setInterval(() => {
        console.log('🔄 [ROADMAP] Polling - refreshing cards');
        loadFeedbackCards(true); // ✅ FIXED: Reset to avoid duplicates from polling
      }, 30000);
      
      return () => {
        console.log('🧹 [ROADMAP] Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [isOpen, companyId, userId]);
  
  // Auto-select ticket when selectedTicketId is provided
  useEffect(() => {
    if (selectedTicketId && cards.length > 0) {
      const ticket = cards.find(c => c.id === selectedTicketId);
      if (ticket) {
        console.log('🎯 [ROADMAP] Auto-selecting ticket:', selectedTicketId);
        setSelectedCard(ticket);
      }
    }
  }, [selectedTicketId, cards]);
  
  async function loadFeedbackCards(reset: boolean = false) {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }
      
      const currentOffset = reset ? 0 : offset;
      
      // Privacy-aware loading based on user role
      console.log('📥 [ROADMAP] Loading tickets:', {
        companyId,
        userId: userId.substring(0, 10) + '...',
        limit,
        offset: currentOffset,
      });
      
      const ticketsResponse = await fetch(
        `/api/feedback/tickets?companyId=${companyId}&userId=${userId}&limit=${limit}&offset=${currentOffset}`
      );
      
      console.log('📡 [ROADMAP] Response status:', ticketsResponse.status);
      
      if (!ticketsResponse.ok) {
        console.error('❌ [ROADMAP] Failed to load tickets:', ticketsResponse.status);
        const errorData = await ticketsResponse.json().catch(() => ({}));
        console.error('Error details:', errorData);
        if (reset) setCards([]);
        return;
      }
      
      const tickets = await ticketsResponse.json();
      console.log('✅ [ROADMAP] Received tickets:', tickets.length);
      
      // Transform to cards
      const feedbackCards: FeedbackCard[] = tickets.map((ticket: any) => ({
        id: ticket.id,
        ticketId: ticket.ticketId,
        createdBy: ticket.createdByName || 'Usuario',
        createdByEmail: ticket.createdByEmail || ticket.reportedByEmail || '',
        userRole: (ticket.createdByRole || ticket.reportedByRole || 'user') as UserRole,
        userDomain: ticket.companyDomain || ticket.userDomain || companyId,
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
      
      if (reset) {
        setCards(feedbackCards);
      } else {
        // Append new cards (for pagination)
        setCards(prev => [...prev, ...feedbackCards]);
      }
      
      setHasMore(feedbackCards.length === limit);
      
    } catch (error) {
      console.error('Failed to load feedback cards:', error);
      if (reset) setCards([]);
    } finally {
      if (reset) setLoading(false);
    }
  }
  
  // Load more cards (pagination) - Manual action
  async function loadMore() {
    if (loading || !hasMore) return;
    
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    
    try {
      console.log('📥 [ROADMAP] Loading more tickets...', { offset: nextOffset, limit });
      
      const ticketsResponse = await fetch(
        `/api/feedback/tickets?companyId=${companyId}&userId=${userId}&limit=${limit}&offset=${nextOffset}`
      );
      
      if (!ticketsResponse.ok) {
        console.error('❌ [ROADMAP] Failed to load more tickets');
        return;
      }
      
      const tickets = await ticketsResponse.json();
      console.log('✅ [ROADMAP] Loaded', tickets.length, 'more tickets');
      
      // Transform and append
      const feedbackCards: FeedbackCard[] = tickets.map((ticket: any) => ({
        id: ticket.id,
        ticketId: ticket.ticketId,
        createdBy: ticket.createdByName || 'Usuario',
        createdByEmail: ticket.createdByEmail || ticket.reportedByEmail || '',
        userRole: (ticket.createdByRole || ticket.reportedByRole || 'user') as UserRole,
        userDomain: ticket.companyDomain || ticket.userDomain || companyId,
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
      
      // Append without duplicates
      setCards(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCards = feedbackCards.filter(c => !existingIds.has(c.id));
        return [...prev, ...newCards];
      });
      
      setHasMore(feedbackCards.length === limit);
      
    } catch (error) {
      console.error('❌ Failed to load more cards:', error);
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
  function handleDragStart(cardId: string, e: React.DragEvent) {
    e.stopPropagation(); // Prevent event bubbling
    setDraggedCard(cardId);
    console.log('🎯 [DRAG] Started dragging card:', cardId);
  }
  
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  async function handleDrop(targetLane: Lane, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedCard) {
      console.log('⚠️ [DROP] No card being dragged');
      return;
    }
    
    const card = cards.find(c => c.id === draggedCard);
    if (!card) {
      console.log('⚠️ [DROP] Card not found:', draggedCard);
      setDraggedCard(null);
      return;
    }
    
    if (card.lane === targetLane) {
      console.log('ℹ️ [DROP] Card already in target lane');
      setDraggedCard(null);
      return;
    }
    
    console.log('📦 [DROP] Dropping card:', {
      cardId: draggedCard,
      fromLane: card.lane,
      toLane: targetLane,
      cardTitle: card.title,
    });
    
    try {
      // Optimistic update - ONLY update the specific dragged card
      setCards(prev => prev.map(c => {
        if (c.id === draggedCard) {
          console.log('  ✓ Updating card:', c.id, 'to lane:', targetLane);
          return { ...c, lane: targetLane };
        }
        return c;
      }));
      
      // Update in backend (use feedback tickets endpoint)
      const response = await fetch(`/api/feedback/tickets/${draggedCard}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane: targetLane }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log('✅ [DROP] Card moved to', targetLane, 'in backend');
      
    } catch (error) {
      console.error('❌ [DROP] Failed to move card:', error);
      loadFeedbackCards(true); // Reload on error
    } finally {
      setDraggedCard(null);
    }
  }
  
  // Get cards for lane with optional recent filter
  function getCardsForLane(lane: Lane): FeedbackCard[] {
    let filteredCards = cards.filter(c => c.lane === lane);
    
    // Apply recent filter if enabled (show last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredCards = filteredCards.filter(c => new Date(c.createdAt) >= sevenDaysAgo);
    }
    
    // Sort by most recent first when filter is active
    if (showRecentOnly) {
      filteredCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filteredCards;
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
  
  // Generate developer specification
  async function generateSpec(card: FeedbackCard) {
    setGeneratingSpec(true);
    setSpecCopied(false);
    
    try {
      const response = await fetch('/api/roadmap/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          ticketId: card.ticketId,
          title: card.title,
          description: card.description,
          category: 'feature-request',
          priority: card.priority,
          csatImpact: card.kpiImpact.csat,
          npsImpact: card.kpiImpact.nps,
          roiImpact: card.kpiImpact.roi,
          okrAlignment: card.okrAlignment,
          createdBy: card.createdBy,
          createdByEmail: card.createdByEmail,
          userRole: card.userRole,
          userDomain: card.userDomain,
          agentName: card.agentName,
          screenshot: card.screenshot,
          annotations: card.annotations,
          aiSummary: card.aiSummary,
          upvotes: card.upvotes,
          companyId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedSpec(data.markdown);
        
        // Add to local log
        setSpecGenerations(prev => [{
          specId: data.specId,
          title: card.title,
          generatedAt: new Date(data.generatedAt),
          generatedBy: userEmail,
          markdown: data.markdown,
        }, ...prev]);
        
        // Auto-copy to clipboard
        copySpecToClipboard(data.markdown);
      } else {
        alert('Error generando especificación: ' + data.error);
      }
      
    } catch (error) {
      console.error('Error generating spec:', error);
      alert('Error al generar especificación');
    } finally {
      setGeneratingSpec(false);
    }
  }
  
  // Copy spec to clipboard
  function copySpecToClipboard(markdown: string) {
    navigator.clipboard.writeText(markdown).then(() => {
      setSpecCopied(true);
      setTimeout(() => setSpecCopied(false), 2000);
    });
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-[92vh] max-w-[98vw] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Roadmap Flow</h2>
              <p className="text-xs text-slate-600">
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
        
        {/* Analytics Summary */}
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center gap-6 text-sm">
            {/* Total Feedback */}
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700">Total:</span>
              <span className="font-bold text-blue-600">{cards.length}</span>
            </div>
            
            {/* By User Type */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs text-slate-600">Usuarios:</span>
                <span className="font-bold text-blue-600">{cards.filter(c => c.userRole === 'user').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-xs text-slate-600">Expertos:</span>
                <span className="font-bold text-purple-600">{cards.filter(c => c.userRole === 'expert').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <span className="text-xs text-slate-600">Admins:</span>
                <span className="font-bold text-yellow-600">{cards.filter(c => c.userRole === 'admin').length}</span>
              </div>
            </div>
            
            {/* By Priority */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">P0:</span>
                <span className="font-bold text-red-600">{cards.filter(c => c.priority === 'critical').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">P1:</span>
                <span className="font-bold text-orange-600">{cards.filter(c => c.priority === 'high').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">P2:</span>
                <span className="font-bold text-yellow-600">{cards.filter(c => c.priority === 'medium').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600">P3:</span>
                <span className="font-bold text-slate-600">{cards.filter(c => c.priority === 'low').length}</span>
              </div>
            </div>
            
            {/* Recent Filter Toggle */}
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                showRecentOnly
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600'
                  : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Recientes (7d)</span>
              {showRecentOnly && (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
            
            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Analytics</span>
              {showAnalytics ? (
                <ChevronUp className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
        
        {/* Roadmap Analytics (Expandable) */}
        {showAnalytics && (
          <div className="px-4 py-2 bg-white border-b border-slate-200 overflow-y-auto max-h-[200px]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Timeline Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800">Timeline Breakdown</h3>
                </div>
                
                {(() => {
                  // Calculate timeline stats
                  const productionCards = cards.filter(c => c.lane === 'production');
                  const now = new Date();
                  const thisMonth = productionCards.filter(c => {
                    const d = new Date(c.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length;
                  
                  const lastMonth = productionCards.filter(c => {
                    const d = new Date(c.createdAt);
                    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
                  }).length;
                  
                  const thisYear = productionCards.filter(c => {
                    const d = new Date(c.createdAt);
                    return d.getFullYear() === now.getFullYear();
                  }).length;
                  
                  const velocity = lastMonth > 0 ? (thisMonth / lastMonth) : 1;
                  
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-xs text-slate-600">Este mes:</span>
                        <span className="text-sm font-bold text-slate-900">{thisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-xs text-slate-600">Mes anterior:</span>
                        <span className="text-sm font-bold text-slate-900">{lastMonth}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-xs text-slate-600">Este año:</span>
                        <span className="text-sm font-bold text-slate-900">{thisYear}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded border border-purple-200">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-900">Velocidad:</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600">{velocity.toFixed(1)}x</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Lane Distribution */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800">Por Etapa</h3>
                </div>
                
                {LANES.map(lane => {
                  const count = cards.filter(c => c.lane === lane.id).length;
                  const percentage = cards.length > 0 ? (count / cards.length) * 100 : 0;
                  
                  return (
                    <div key={lane.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{lane.title}</span>
                        <span className="font-bold text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`bg-${lane.color}-600 h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Impact Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800">Impacto Agregado</h3>
                </div>
                
                {(() => {
                  const totalCSAT = cards.reduce((sum, c) => sum + (c.kpiImpact.csat || 0), 0);
                  const totalNPS = cards.reduce((sum, c) => sum + (c.kpiImpact.nps || 0), 0);
                  const totalROI = cards.reduce((sum, c) => sum + (c.kpiImpact.roi || 0), 0);
                  const avgCSAT = cards.length > 0 ? totalCSAT / cards.length : 0;
                  
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded border border-green-200">
                        <div className="text-[10px] text-green-700 font-medium">CSAT Total</div>
                        <div className="text-sm font-bold text-green-900">+{totalCSAT.toFixed(1)}</div>
                        <div className="text-[9px] text-green-600">Avg: +{avgCSAT.toFixed(2)}</div>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded border border-blue-200">
                        <div className="text-[10px] text-blue-700 font-medium">NPS Total</div>
                        <div className="text-sm font-bold text-blue-900">+{totalNPS}</div>
                        <div className="text-[9px] text-blue-600">{cards.length} features</div>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded border border-purple-200">
                        <div className="text-[10px] text-purple-700 font-medium">ROI Total</div>
                        <div className="text-sm font-bold text-purple-900">{totalROI.toFixed(0)}x</div>
                        <div className="text-[9px] text-purple-600">Multiplier</div>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-orange-50 to-yellow-50 rounded border border-orange-200">
                        <div className="text-[10px] text-orange-700 font-medium">High Impact</div>
                        <div className="text-sm font-bold text-orange-900">{cards.filter(c => c.kpiImpact.csat >= 4.0).length}</div>
                        <div className="text-[9px] text-orange-600">CSAT ≥4.0</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* OKR Alignment */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800">Alineación OKRs</h3>
                </div>
                
                {(() => {
                  // Aggregate OKR counts
                  const okrCounts: Record<string, number> = {};
                  cards.forEach(card => {
                    card.okrAlignment.forEach(okr => {
                      okrCounts[okr] = (okrCounts[okr] || 0) + 1;
                    });
                  });
                  
                  const topOKRs = Object.entries(okrCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6);
                  
                  return (
                    <div className="space-y-1.5">
                      {topOKRs.length > 0 ? topOKRs.map(([okr, count]) => {
                        const percentage = cards.length > 0 ? (count / cards.length) * 100 : 0;
                        return (
                          <div key={okr} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-medium text-slate-700 truncate mr-2">{okr}</span>
                              <span className="font-bold text-slate-900 whitespace-nowrap">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center text-slate-500 text-xs py-2">
                          Sin OKRs asignados
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Kanban Board */}
          <div className={`${showRudy ? 'flex-[2]' : 'flex-1'} overflow-x-auto p-3 transition-all`}>
            <div className="flex gap-2.5 h-full">
              {LANES.map((lane) => {
                const laneCards = getCardsForLane(lane.id);
                const LaneIcon = lane.icon;
                
                return (
                  <div
                    key={lane.id}
                    className="flex-1 min-w-[220px] max-w-[260px] flex flex-col"
                  >
                    {/* Lane Header */}
                    <div className={`bg-${lane.color}-50 border-2 border-${lane.color}-300 rounded-t-xl p-2`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <LaneIcon className={`w-4 h-4 text-${lane.color}-600`} />
                        <h3 className={`text-xs font-bold text-${lane.color}-800`}>
                          {lane.title}
                        </h3>
                        <span className={`ml-auto px-1.5 py-0.5 bg-${lane.color}-200 text-${lane.color}-800 rounded-full text-xs font-bold`}>
                          {laneCards.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">{lane.description}</p>
                    </div>
                    
                    {/* Lane Content */}
                    <div
                      className="flex-1 bg-slate-50 border-l-2 border-r-2 border-b-2 border-slate-200 rounded-b-xl p-2 space-y-2 overflow-y-auto"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(lane.id, e)}
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
                              onDragStart={(e) => handleDragStart(card.id, e)}
                              onClick={() => setSelectedCard(card)}
                              className={`${roleColors.bg} border-2 ${roleColors.border} rounded-lg p-2.5 cursor-move hover:shadow-lg transition-all ${
                                draggedCard === card.id ? 'opacity-50 scale-95' : ''
                              }`}
                            >
                              {/* Header: User info */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <div className={`w-6 h-6 rounded-full ${roleColors.badge} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                                    {card.createdBy.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[10px] font-semibold ${roleColors.text} truncate`}>
                                      {card.createdBy}
                                    </p>
                                    <p className="text-[9px] text-slate-500 truncate flex items-center gap-0.5">
                                      <Building2 className="w-2.5 h-2.5" />
                                      {card.userDomain}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Role badge */}
                                <span className={`${roleColors.badge} px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0`}>
                                  {card.userRole.toUpperCase()}
                                </span>
                              </div>
                              
                              {/* Ticket ID & Badges */}
                              <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-slate-700">
                                  {card.ticketId}
                                </span>
                                
                                {/* Priority badge */}
                                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                  card.priority === 'critical' ? 'bg-red-600 text-white' :
                                  card.priority === 'high' ? 'bg-orange-600 text-white' :
                                  card.priority === 'medium' ? 'bg-yellow-600 text-white' :
                                  'bg-slate-400 text-white'
                                }`}>
                                  P{card.priority === 'critical' ? '0' : card.priority === 'high' ? '1' : card.priority === 'medium' ? '2' : '3'}
                                </span>
                              </div>
                              
                              {/* Title */}
                              <h4 className="font-semibold text-xs text-slate-800 mb-1.5 line-clamp-2">
                                {card.title}
                              </h4>
                              
                              {/* Agent context */}
                              <div className="flex items-center gap-1 mb-2 text-[10px] text-slate-600">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span className="truncate">Agente: {card.agentName}</span>
                              </div>
                              
                              {/* Screenshot indicator */}
                              {card.screenshot && (
                                <div className="flex items-center gap-1 mb-2 text-[10px] text-blue-600">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>Con captura</span>
                                </div>
                              )}
                              
                              {/* Feedback Rating Display */}
                              <div className="space-y-1.5 mb-2">
                                {/* Original Feedback Rating */}
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-600 font-medium">Calificación:</span>
                                  {card.userRole === 'expert' ? (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                      card.kpiImpact.csat >= 4 ? 'bg-green-100 text-green-700' :
                                      card.kpiImpact.csat >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {card.kpiImpact.csat >= 4 ? '⭐ Sobresaliente' :
                                       card.kpiImpact.csat >= 2.5 ? '✓ Aceptable' :
                                       '✗ Inaceptable'}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={`text-xs ${
                                          star <= Math.round(card.kpiImpact.csat) ? 'text-yellow-500' : 'text-slate-300'
                                        }`}>★</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* KPI Impact */}
                                {card.kpiImpact.nps > 0 && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-600">NPS:</span>
                                    <span className={`font-bold ${card.kpiImpact.nps >= 9 ? 'text-green-700' : 'text-slate-700'}`}>
                                      {card.kpiImpact.nps}/10
                                    </span>
                                  </div>
                                )}
                                {card.kpiImpact.csat > 0 && card.userRole === 'expert' && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-600">CSAT:</span>
                                    <span className={`font-bold ${card.kpiImpact.csat >= 4 ? 'text-green-700' : 'text-slate-700'}`}>
                                      {card.kpiImpact.csat}/5
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Social metrics */}
                              <div className="flex items-center gap-2 text-[10px] border-t border-slate-200 pt-1.5">
                                <div className="flex items-center gap-0.5 text-slate-600">
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                  <span className="font-medium">{card.upvotes}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-slate-600">
                                  <Share2 className="w-2.5 h-2.5" />
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
            
            {/* Load More Button */}
            {!loading && hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  Cargar más feedback ({cards.length} de muchos)
                </button>
              </div>
            )}
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
                    <h3 className="text-sm font-bold text-white">Rudy</h3>
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
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {selectedCard.ticketId}
                    </span>
                    
                    <span className={`${getRoleColor(selectedCard.userRole).badge} px-3 py-1 rounded-full text-xs font-bold`}>
                      {selectedCard.userRole.toUpperCase()}
                    </span>
                  </div>
                  
                  <h2 className="text-lg font-bold text-slate-800 mb-2">
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
                
                <div className="flex items-center gap-2">
                  {/* Generate Spec Button - Admin/SuperAdmin only */}
                  <button
                    onClick={() => generateSpec(selectedCard)}
                    disabled={generatingSpec}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 transition-all text-sm font-medium"
                    title="Generar especificación para desarrollador"
                  >
                    {generatingSpec ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : specCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Generate Spec</span>
                      </>
                    )}
                  </button>
                  
                  {/* Show spec log */}
                  {specGenerations.length > 0 && (
                    <button
                      onClick={() => setShowSpecLog(!showSpecLog)}
                      className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
                      title="Ver historial de especificaciones"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{specGenerations.length}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-slate-400 hover:text-slate-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
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
                      <p className="text-xl font-bold text-green-800">
                        {selectedCard.kpiImpact.csat.toFixed(1)}+
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Target: 4+</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-blue-700 mb-1">NPS</p>
                      <p className="text-xl font-bold text-blue-800">
                        {selectedCard.kpiImpact.nps}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Target: &gt;98</p>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <p className="text-xs text-purple-700 mb-1">ROI</p>
                      <p className="text-xl font-bold text-purple-800">
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
                
                {/* Generated Spec Display */}
                {generatedSpec && (
                  <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <h3 className="font-bold text-purple-900">Developer Specification</h3>
                        </div>
                        <button
                          onClick={() => copySpecToClipboard(generatedSpec)}
                          className="flex items-center gap-2 px-3 py-1 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-medium text-purple-700"
                        >
                          {specCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 max-h-[300px] overflow-y-auto">
                      <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">{generatedSpec}</pre>
                    </div>
                  </div>
                )}
                
                {/* Spec Generation Log */}
                {showSpecLog && specGenerations.length > 0 && (
                  <div className="border-2 border-slate-200 rounded-lg">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-600" />
                          <h3 className="font-bold text-slate-800 text-sm">Historial de Especificaciones</h3>
                        </div>
                        <button
                          onClick={() => setShowSpecLog(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-200">
                      {specGenerations.map((spec, idx) => (
                        <div key={idx} className="p-3 hover:bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-800">{spec.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                                <span>ID: {spec.specId}</span>
                                <span>•</span>
                                <span>{spec.generatedBy}</span>
                                <span>•</span>
                                <span>{spec.generatedAt.toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => copySpecToClipboard(spec.markdown)}
                              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 text-[10px] font-medium flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Social Metrics */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{selectedCard.upvotes}</p>
                      <p className="text-xs text-slate-600">Upvotes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{selectedCard.shares}</p>
                      <p className="text-xs text-slate-600">Shares</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{selectedCard.upvotedBy.length}</p>
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

