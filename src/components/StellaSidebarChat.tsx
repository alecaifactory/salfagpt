/**
 * 🪄 Stella Sidebar Chat - AI Feedback Assistant
 * 
 * Right sidebar chatbot for collecting product feedback with:
 * - Conversational interface
 * - Embedded selection tools
 * - Screenshot attachments
 * - AI inference of UI state
 * - Ticket generation with Kanban integration
 * - Violet innovation theme
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  X,
  Send,
  Sparkles,
  Circle,
  Square,
  Paintbrush,
  Video,
  Camera,
  Bug,
  Lightbulb,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  ExternalLink,
  ArrowRight,
  Eraser,
  Check,
  Maximize2,
  Eye
} from 'lucide-react';
import type { AnnotatedScreenshot, ScreenshotAnnotation } from '../types/feedback';

type FeedbackCategory = 'bug' | 'feature' | 'improvement';

export interface StellaAttachment {
  id: string;
  type: 'screenshot';
  screenshot: AnnotatedScreenshot;
  aiAnalysis?: string; // AI inference of the screenshot
  uiContext?: {
    currentAgent?: string;
    currentChat?: string;
    consoleErrors?: string[];
    pageUrl?: string;
  };
}

export interface StellaMessage {
  id: string;
  role: 'user' | 'stella';
  content: string;
  timestamp: Date;
  attachments?: StellaAttachment[];
}

export interface StellaFeedbackSession {
  id: string;
  category: FeedbackCategory;
  ticketId?: string;
  messages: StellaMessage[];
  status: 'active' | 'submitted';
  createdAt: Date;
  kanbanCardUrl?: string;
}

interface StellaSidebarChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  currentPageContext?: {
    pageUrl: string;
    agentId?: string;
    conversationId?: string;
    selectedText?: string;
  };
  onRequestScreenshot: () => void; // Request parent to open screenshot tool
  onRequestEditScreenshot: (attachment: StellaAttachment, index: number) => void; // Request edit
  onAddAttachment?: (attachment: StellaAttachment) => void; // Called when parent completes screenshot
}

export default function StellaSidebarChat({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  currentPageContext,
  onRequestScreenshot,
  onRequestEditScreenshot,
  onAddAttachment
}: StellaSidebarChatProps) {
  
  // Session management
  const [sessions, setSessions] = useState<StellaFeedbackSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  
  // Chat state
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Screenshot tools - managed by parent
  const [pendingAttachments, setPendingAttachments] = useState<StellaAttachment[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<StellaAttachment | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ✅ FIXED: Declare currentSession BEFORE using it in useEffect
  const currentSession = sessions.find(s => s.id === currentSessionId);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);
  
  // Create new feedback session
  function startNewFeedback(category: FeedbackCategory) {
    const newSession: FeedbackSession = {
      id: `feedback-${Date.now()}`,
      category,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'stella',
          content: getWelcomeMessage(category),
          timestamp: new Date(),
        }
      ],
      status: 'active',
      createdAt: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedCategory(category);
    setShowCategorySelector(false);
  }
  
  function getWelcomeMessage(category: FeedbackCategory): string {
    const messages = {
      bug: "¡Hola! 🐛 Soy Stella. Cuéntame sobre el problema que encontraste. Puedo ayudarte a documentarlo con capturas de pantalla y crear un reporte detallado.",
      feature: "¡Hola! 💡 Soy Stella. Comparte tu idea de feature. Puedo ayudarte a capturar ejemplos visuales y crear una solicitud detallada.",
      improvement: "¡Hola! 📈 Soy Stella. ¿Qué te gustaría mejorar? Puedo ayudarte a documentar sugerencias con contexto visual."
    };
    return messages[category];
  }
  
  // Capture UI context (agent, chat, console errors)
  function captureUIContext() {
    // Get console errors from browser
    const consoleErrors: string[] = [];
    
    // Try to get errors from console (if available)
    try {
      // This would need browser extension or console logging system
      // For now, we'll capture what's available in currentPageContext
    } catch (e) {
      // Silent fail
    }
    
    return {
      currentAgent: currentPageContext?.agentId,
      currentChat: currentPageContext?.conversationId,
      consoleErrors,
      pageUrl: currentPageContext?.pageUrl || window.location.href,
    };
  }
  
  // Add attachment from parent (after screenshot completion)
  useEffect(() => {
    if (onAddAttachment) {
      // Expose function to parent to add attachments
      (window as any).stellaAddAttachment = (attachment: StellaAttachment) => {
        setPendingAttachments(prev => [...prev, attachment]);
      };
      
      (window as any).stellaUpdateAttachment = (attachment: StellaAttachment, index: number) => {
        setPendingAttachments(prev =>
          prev.map((att, idx) => (idx === index ? attachment : att))
        );
      };
    }
    
    return () => {
      delete (window as any).stellaAddAttachment;
      delete (window as any).stellaUpdateAttachment;
    };
  }, [onAddAttachment]);
  
  // Send message
  async function sendMessage() {
    // Need at least text OR attachments
    if ((!inputText.trim() && pendingAttachments.length === 0) || !currentSession) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputText.trim() || '📸 Captura de pantalla adjunta',
        timestamp: new Date(),
        attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      };
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, userMessage] }
          : s
      ));
      
      setInputText('');
      setPendingAttachments([]);
      
      // Generate AI response
      const aiResponse = await generateStellaResponse(userMessage, currentSession);
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, aiResponse] }
          : s
      ));
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function generateStellaResponse(userMessage: Message, session: FeedbackSession): Promise<Message> {
    // Call Stella AI
    const response = await fetch('/api/stella/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionId: session.id,
        category: session.category,
        message: userMessage.content,
        attachments: userMessage.attachments,
        conversationHistory: session.messages,
        pageContext: currentPageContext,
      }),
    });
    
    const data = await response.json();
    
    return {
      id: `msg-${Date.now()}`,
      role: 'stella',
      content: data.response,
      timestamp: new Date(),
    };
  }
  
  // Submit feedback (creates ticket in Roadmap)
  async function submitFeedback() {
    if (!currentSession) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/stella/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          session: currentSession,
          pageContext: currentPageContext,
        }),
      });
      
      const data = await response.json();
      
      // Update session with ticket info
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              status: 'submitted',
              ticketId: data.ticketId,
              kanbanCardUrl: data.kanbanCardUrl,
            }
          : s
      ));
      
      // Add confirmation message with clickable link
      const confirmMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'stella',
        content: `✅ Feedback enviado exitosamente!\n\n**Ticket:** ${data.ticketId}\n\nHe creado un ticket en el backlog del Roadmap con toda la información de nuestra conversación, incluyendo las capturas de pantalla con anotaciones y el análisis AI del contexto.`,
        timestamp: new Date(),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, confirmMessage] }
          : s
      ));
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Error al enviar feedback. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div 
      className={`fixed right-0 top-0 bottom-0 w-96 bg-gradient-to-b from-violet-50 to-white dark:from-slate-800 dark:to-slate-900 border-l border-violet-200 dark:border-violet-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 z-[9999]' : 'translate-x-full z-[9999]'
      }`}
    >
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-white stella-magic-wand" />
          <div>
            <h2 className="text-white font-bold text-lg">Stella</h2>
            <p className="text-violet-100 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Powered by Gemini 2.5 Flash
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Category Selector - Shows when no category selected */}
      {showCategorySelector && !selectedCategory && (
        <div className="p-6 border-b border-violet-200 dark:border-violet-800">
          <h3 className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            ¿Qué tipo de feedback quieres dar?
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => startNewFeedback('bug')}
              className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Reportar Bug</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Algo no funciona correctamente</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => startNewFeedback('feature')}
              className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Solicitar Feature</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Tengo una idea para mejorar</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => startNewFeedback('improvement')}
              className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Sugerir Mejora</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Puede funcionar mejor</p>
                </div>
              </div>
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-xs text-violet-800 dark:text-violet-200">
              💡 <strong>Tip:</strong> Puedo ayudarte a capturar pantallas y analizar el contexto automáticamente.
            </p>
          </div>
        </div>
      )}
      
      {/* Active Session - Chat Interface */}
      {currentSession && !showCategorySelector && (
        <>
          {/* Session Header with Category Badge */}
          <div className="p-4 border-b border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {currentSession.category === 'bug' && (
                  <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-bold text-red-700 dark:text-red-300">Bug Report</span>
                  </div>
                )}
                {currentSession.category === 'feature' && (
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Feature Request</span>
                  </div>
                )}
                {currentSession.category === 'improvement' && (
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-300">Mejora</span>
                  </div>
                )}
                
                {/* Allow changing category */}
                <button
                  onClick={() => setShowCategorySelector(true)}
                  className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>
              
              {currentSession.ticketId && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                    {currentSession.ticketId}
                  </span>
                  {currentSession.kanbanCardUrl && (
                    <a
                      href={currentSession.kanbanCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* New Feedback Button */}
            <button
              onClick={() => setShowCategorySelector(true)}
              className="w-full px-3 py-1.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/30 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Feedback
            </button>
          </div>
          
          {/* Screenshot Tool */}
          <div className="p-3 border-b border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-slate-800/50">
            <button
              onClick={onRequestScreenshot}
              className="w-full px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-sm"
            >
              <Camera className="w-4 h-4" />
              Capturar Pantalla
            </button>
            
            {pendingAttachments.length > 0 && (
              <div className="mt-2 text-xs text-violet-700 dark:text-violet-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {pendingAttachments.length} captura{pendingAttachments.length !== 1 ? 's' : ''} adjunta{pendingAttachments.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-violet-200 dark:border-violet-700'
                  }`}
                >
                  {/* Message content */}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="rounded-lg overflow-hidden border border-violet-300 dark:border-violet-600">
                          {/* Screenshot preview */}
                          <div 
                            className="relative cursor-pointer group"
                            onClick={() => setViewingAttachment(att)}
                          >
                            <img
                              src={att.screenshot.imageDataUrl}
                              alt="Captura anotada"
                              className="w-full max-h-40 object-contain bg-slate-100 dark:bg-slate-700"
                            />
                            {/* View fullscreen overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                                <Maximize2 className="w-4 h-4 text-violet-600" />
                              </div>
                            </div>
                          </div>
                          
                          {/* AI Analysis summary */}
                          {att.aiAnalysis && (
                            <div className="px-2 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-[10px] text-violet-700 dark:text-violet-300">
                              <p className="font-semibold flex items-center gap-1 mb-0.5">
                                <Sparkles className="w-3 h-3" />
                                Análisis AI:
                              </p>
                              <p className="line-clamp-2">{att.aiAnalysis}</p>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-[9px] text-violet-600 dark:text-violet-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {att.screenshot.annotations.length} anotaciones
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingAttachment(att);
                              }}
                              className="flex items-center gap-1 hover:text-violet-800 dark:hover:text-violet-200"
                            >
                              <Eye className="w-3 h-3" />
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <p className={`text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Pending Attachments Preview */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 pb-3 border-t border-violet-200 dark:border-violet-800 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {pendingAttachments.map((att, idx) => (
                  <div key={att.id} className="bg-violet-100 dark:bg-violet-900/30 rounded-lg p-2 flex items-start gap-2">
                    {/* Thumbnail */}
                    <div 
                      className="w-16 h-16 flex-shrink-0 rounded border border-violet-300 dark:border-violet-600 overflow-hidden cursor-pointer group relative"
                      onClick={() => setViewingAttachment(att)}
                    >
                      <img
                        src={att.screenshot.imageDataUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                        Captura {idx + 1}
                      </p>
                      <p className="text-[10px] text-violet-700 dark:text-violet-300">
                        {att.screenshot.annotations.length} anotaciones
                      </p>
                      {att.aiAnalysis && (
                        <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5 line-clamp-1">
                          <Sparkles className="w-2.5 h-2.5 inline" /> {att.aiAnalysis}
                        </p>
                      )}
                    </div>
                    
                    {/* Edit and Remove buttons */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => onRequestEditScreenshot(att, idx)}
                        className="p-1 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                        title="Editar anotaciones"
                      >
                        <Paintbrush className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))}
                        className="p-1 text-violet-600 dark:text-violet-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800">
            <div className="flex flex-col gap-2">
              {/* Attachments info above textarea */}
              {pendingAttachments.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 rounded-lg px-3 py-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-semibold">
                    {pendingAttachments.length} captura{pendingAttachments.length !== 1 ? 's' : ''} lista{pendingAttachments.length !== 1 ? 's' : ''} para enviar
                  </span>
                  <span className="text-violet-500 dark:text-violet-400">•</span>
                  <button
                    onClick={() => setPendingAttachments([])}
                    className="text-violet-600 dark:text-violet-400 hover:text-red-600 dark:hover:text-red-400 underline"
                  >
                    Limpiar todas
                  </button>
                </div>
              )}
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  pendingAttachments.length > 0
                    ? "Agrega un mensaje para acompañar tus capturas..."
                    : "Escribe tu mensaje a Stella..."
                }
                rows={3}
                className="w-full px-3 py-2 border-2 border-violet-200 dark:border-violet-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {inputText.length}/500
                </span>
                
                <div className="flex gap-2">
                  {currentSession.status === 'active' && currentSession.messages.length > 2 && (
                    <button
                      onClick={submitFeedback}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Enviar Feedback
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={sendMessage}
                    disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Enviar {pendingAttachments.length > 0 && `(${pendingAttachments.length})`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Sessions History (when category selector hidden) */}
      {!showCategorySelector && sessions.length > 1 && (
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-violet-200 dark:border-violet-700 p-2 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-semibold text-violet-900 dark:text-violet-100 mb-2 px-2">
              Feedback Anteriores:
            </p>
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setShowCategorySelector(false);
                }}
                className={`w-full px-2 py-1.5 rounded text-left text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors ${
                  session.id === currentSessionId ? 'bg-violet-100 dark:bg-violet-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {session.category === 'bug' && <Bug className="w-3 h-3 text-red-600" />}
                  {session.category === 'feature' && <Lightbulb className="w-3 h-3 text-blue-600" />}
                  {session.category === 'improvement' && <TrendingUp className="w-3 h-3 text-green-600" />}
                  <span className="truncate flex-1">{session.ticketId || 'En progreso'}</span>
                  <span className="text-[9px] text-slate-500">
                    {session.messages.length} msgs
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-violet-600" />
                  Captura de Pantalla
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Image */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900">
              <img
                src={viewingAttachment.screenshot.imageDataUrl}
                alt="Captura completa"
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
              />
            </div>
            
            {/* Details */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              {/* AI Analysis */}
              {viewingAttachment.aiAnalysis && (
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Análisis AI:
                  </p>
                  <p className="text-sm text-violet-700 dark:text-violet-300 whitespace-pre-wrap">
                    {viewingAttachment.aiAnalysis}
                  </p>
                </div>
              )}
              
              {/* UI Context */}
              {viewingAttachment.uiContext && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Contexto UI:
                  </p>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {viewingAttachment.uiContext.currentAgent && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">Agente:</span>
                        <span>{viewingAttachment.uiContext.currentAgent}</span>
                      </div>
                    )}
                    {viewingAttachment.uiContext.currentChat && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">Chat:</span>
                        <span className="font-mono text-[10px]">{viewingAttachment.uiContext.currentChat}</span>
                      </div>
                    )}
                    {viewingAttachment.uiContext.pageUrl && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-medium">URL:</span>
                        <span className="truncate">{viewingAttachment.uiContext.pageUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Annotations count */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{viewingAttachment.screenshot.annotations.length} anotaciones en la captura</span>
                <span>{new Date(viewingAttachment.screenshot.createdAt).toLocaleString('es')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

