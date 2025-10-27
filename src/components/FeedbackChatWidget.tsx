/**
 * FeedbackChatWidget - Floating feedback chat interface
 * 
 * Allows users to submit feedback, request features, report bugs with
 * AI-powered conversation, screenshot capture, and annotation tools.
 * 
 * Features:
 * - Real-time chat with AI agent
 * - Screenshot capture with html2canvas
 * - Annotation tools (arrows, boxes, text, highlights)
 * - Session persistence
 * - Unread message badge
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Camera, 
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import type { 
  FeedbackSession,
  FeedbackMessage,
  FeedbackSessionType,
  Screenshot 
} from '../types/feedback';

interface FeedbackChatWidgetProps {
  userId: string;
  companyId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, summary: string) => void;
  onFeedbackSubmitted?: (feedbackId: string) => void;
}

export default function FeedbackChatWidget({
  userId,
  companyId,
  position = 'bottom-right',
  onSessionStart,
  onSessionEnd,
  onFeedbackSubmitted
}: FeedbackChatWidgetProps) {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Session State
  const [currentSession, setCurrentSession] = useState<FeedbackSession | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Screenshot State
  const [showScreenshotTools, setShowScreenshotTools] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };
  
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);
  
  // Load or create session
  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeSession();
    }
  }, [isOpen]);
  
  // Initialize new feedback session
  async function initializeSession() {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/feedback/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyId,
          sessionType: 'general_feedback' as FeedbackSessionType,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      
      const session = await response.json();
      setCurrentSession(session);
      setMessages(session.messages || []);
      
      onSessionStart?.(session.id);
      
      // Add welcome message if no messages yet
      if (session.messages.length === 0) {
        addWelcomeMessage();
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Add welcome message from AI
  function addWelcomeMessage() {
    const welcomeMsg: FeedbackMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '¡Hola! 👋 Estoy aquí para ayudarte a compartir feedback, reportar problemas, o solicitar nuevas funcionalidades. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMsg]);
  }
  
  // Send message to AI agent
  async function handleSendMessage() {
    if (!inputValue.trim() || !currentSession) return;
    
    const userMessage: FeedbackMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/feedback/sessions/${currentSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: inputValue.trim(),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage: FeedbackMessage = {
        id: data.messageId,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session
      setCurrentSession(prev => prev ? { ...prev, messages: [...prev.messages, userMessage, aiMessage] } : null);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Show error message
      const errorMsg: FeedbackMessage = {
        id: `msg-error-${Date.now()}`,
        role: 'system',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Capture screenshot
  async function handleCaptureScreenshot() {
    setIsCapturing(true);
    
    try {
      // Dynamic import html2canvas
      const { default: html2canvas } = await import('html2canvas');
      
      // Capture the entire page (excluding the feedback widget)
      const widgetElement = document.getElementById('feedback-widget');
      if (widgetElement) {
        widgetElement.style.display = 'none';
      }
      
      const canvas = await html2canvas(document.body);
      
      if (widgetElement) {
        widgetElement.style.display = 'block';
      }
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b: Blob | null) => resolve(b!), 'image/png');
      });
      
      // Upload to GCS
      const formData = new FormData();
      formData.append('file', blob, `screenshot-${Date.now()}.png`);
      formData.append('sessionId', currentSession!.id);
      formData.append('userId', userId);
      
      const response = await fetch('/api/feedback/screenshots', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload screenshot');
      
      const screenshot = await response.json();
      setScreenshots(prev => [...prev, screenshot]);
      
      // Notify in chat
      const screenshotMsg: FeedbackMessage = {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: '📸 Captura de pantalla agregada. ¿Quieres agregar anotaciones?',
        timestamp: new Date(),
        metadata: { screenshotId: screenshot.id },
      };
      setMessages(prev => [...prev, screenshotMsg]);
      
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      alert('Error al capturar pantalla');
    } finally {
      setIsCapturing(false);
    }
  }
  
  // Submit feedback
  async function handleSubmitFeedback() {
    if (!currentSession) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/feedback/sessions/${currentSession.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: feedbackTitle,
          description: messages.filter(m => m.role === 'user').map(m => m.content).join('\n'),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit');
      
      const result = await response.json();
      
      onFeedbackSubmitted?.(result.sessionId);
      
      // Show success message
      const successMsg: FeedbackMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '✅ ¡Gracias por tu feedback! Tu solicitud ha sido enviada a nuestro equipo. Te notificaremos cuando haya actualizaciones.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMsg]);
      
      setShowSubmitForm(false);
      
      // Close widget after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setCurrentSession(null);
        setMessages([]);
        setScreenshots([]);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Error al enviar feedback');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle Enter key
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }
  
  // Render floating button
  if (!isOpen) {
    return (
      <button
        id="feedback-widget"
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110`}
        aria-label="Abrir feedback"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }
  
  // Render chat widget
  return (
    <div
      id="feedback-widget"
      className={`fixed ${positionClasses[position]} z-50 transition-all`}
    >
      {isMinimized ? (
        // Minimized header only
        <div className="w-80 bg-white rounded-t-lg shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Feedback</span>
              {unreadCount > 0 && (
                <span className="ml-2 w-5 h-5 bg-red-500 text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Full chat interface
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Feedback & Sugerencias</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (currentSession && messages.length > 1) {
                    onSessionEnd?.(currentSession.id, 'User closed widget');
                  }
                }}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.role === 'assistant'
                        ? 'bg-white text-slate-800 border border-slate-200'
                        : 'bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm'
                    }`}
                  >
                    {msg.content}
                    {msg.metadata?.screenshotId && (
                      <div className="mt-2">
                        <button
                          onClick={() => {/* View screenshot */}}
                          className="text-xs underline opacity-80 hover:opacity-100"
                        >
                          Ver captura →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Screenshots Preview */}
          {screenshots.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2 overflow-x-auto">
                <ImageIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="relative w-16 h-16 border border-slate-200 rounded overflow-hidden flex-shrink-0"
                  >
                    <img 
                      src={screenshot.url} 
                      alt="Screenshot" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-600 text-white p-0.5 rounded-tl">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
            {showSubmitForm ? (
              // Submit form
              <div className="space-y-3">
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="Título de tu feedback..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackTitle.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Enviar Feedback
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Chat input
              <div className="space-y-2">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCaptureScreenshot}
                    disabled={isCapturing}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    Capturar Pantalla
                  </button>
                  
                  {messages.filter(m => m.role === 'user').length > 0 && (
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded font-medium"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Enviar Feedback
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

