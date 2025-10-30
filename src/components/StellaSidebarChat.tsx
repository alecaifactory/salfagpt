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
  Check
} from 'lucide-react';

type FeedbackCategory = 'bug' | 'feature' | 'improvement';
type SelectionMode = 'point' | 'area' | 'brush' | 'clip' | 'screen' | 'none';

interface Attachment {
  id: string;
  type: 'screenshot' | 'selection' | 'clip';
  mode: SelectionMode;
  dataUrl?: string;
  timestamp: number;
  annotations?: any[];
}

interface Message {
  id: string;
  role: 'user' | 'stella';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

interface FeedbackSession {
  id: string;
  category: FeedbackCategory;
  ticketId?: string;
  messages: Message[];
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
}

export default function StellaSidebarChat({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  currentPageContext
}: StellaSidebarChatProps) {
  
  // Session management
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  
  // Chat state
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection tools
  const [activeSelectionTool, setActiveSelectionTool] = useState<SelectionMode>('none');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  
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
  
  // Send message
  async function sendMessage() {
    if (!inputText.trim() || !currentSession) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputText,
        timestamp: new Date(),
        attachments: pendingAttachment ? [pendingAttachment] : undefined,
      };
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, userMessage] }
          : s
      ));
      
      setInputText('');
      setPendingAttachment(null);
      
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
  
  // Submit feedback (creates ticket)
  async function submitFeedback() {
    if (!currentSession) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/stella/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
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
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'stella',
        content: `✅ Feedback enviado exitosamente!\n\n**Ticket:** ${data.ticketId}\n\nHe creado un ticket en el backlog con toda la información de nuestra conversación.`,
        timestamp: new Date(),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, confirmMessage] }
          : s
      ));
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-gradient-to-b from-violet-50 to-white dark:from-slate-800 dark:to-slate-900 border-l border-violet-200 dark:border-violet-900 shadow-2xl z-50 flex flex-col">
      
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
          
          {/* Selection Tools */}
          <div className="p-3 border-b border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-slate-800/50">
            <p className="text-[10px] font-semibold text-violet-900 dark:text-violet-100 mb-2">
              Herramientas de Selección:
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveSelectionTool('point')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeSelectionTool === 'point'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                }`}
                title="Punto"
              >
                <Circle className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => setActiveSelectionTool('area')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeSelectionTool === 'area'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                }`}
                title="Área"
              >
                <Square className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => setActiveSelectionTool('brush')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeSelectionTool === 'brush'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                }`}
                title="Lápiz"
              >
                <Paintbrush className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => setActiveSelectionTool('clip')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeSelectionTool === 'clip'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                }`}
                title="Clip"
              >
                <Video className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => setActiveSelectionTool('screen')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                  activeSelectionTool === 'screen'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                }`}
                title="Pantalla"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            
            {activeSelectionTool !== 'none' && (
              <p className="text-[10px] text-violet-700 dark:text-violet-300 mt-2 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                {activeSelectionTool === 'point' && 'Click en la pantalla donde quieras marcar'}
                {activeSelectionTool === 'area' && 'Arrastra para seleccionar un área'}
                {activeSelectionTool === 'brush' && 'Dibuja libremente sobre la pantalla'}
                {activeSelectionTool === 'clip' && 'Click para iniciar/detener grabación'}
                {activeSelectionTool === 'screen' && 'Click para capturar pantalla completa'}
              </p>
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
                          {att.dataUrl && (
                            <img
                              src={att.dataUrl}
                              alt="Adjunto"
                              className="w-full max-h-40 object-contain bg-slate-100 dark:bg-slate-700"
                            />
                          )}
                          <div className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-[10px] text-violet-700 dark:text-violet-300 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {att.type === 'screenshot' && 'Screenshot'}
                            {att.type === 'selection' && 'Selección'}
                            {att.type === 'clip' && 'Clip grabado'}
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
          
          {/* Pending Attachment Preview */}
          {pendingAttachment && (
            <div className="px-4 pb-3 border-t border-violet-200 dark:border-violet-800">
              <div className="bg-violet-100 dark:bg-violet-900/30 rounded-lg p-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                    Adjunto listo
                  </p>
                  <p className="text-[10px] text-violet-700 dark:text-violet-300">
                    {pendingAttachment.type === 'screenshot' && 'Screenshot capturado'}
                    {pendingAttachment.type === 'selection' && 'Selección capturada'}
                    {pendingAttachment.type === 'clip' && 'Clip grabado'}
                  </p>
                </div>
                <button
                  onClick={() => setPendingAttachment(null)}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800">
            <div className="flex flex-col gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe tu mensaje a Stella..."
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
                    disabled={!inputText.trim() || isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
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
    </div>
  );
}

