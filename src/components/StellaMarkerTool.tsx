/**
 * 🔒 CONFIDENTIAL - Stella Marker Tool
 * 
 * Proprietary UI annotation tool with viral sharing mechanics.
 * 
 * Features:
 * - Beautiful color-cycling marker (purple → yellow → green)
 * - Click-to-annotate UI elements
 * - Feedback box with submit animation
 * - Ticket generation with shareable cards
 * - Privacy-first social sharing
 * - Viral network effect tracking
 * 
 * DO NOT SHARE - Proprietary competitive advantage
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  X, 
  Send, 
  Share2, 
  ThumbsUp, 
  Sparkles,
  Check,
  Loader2,
  Copy,
  MessageSquare
} from 'lucide-react';

interface StellaMarker {
  id: string;
  position: { x: number; y: number };
  state: 'idle' | 'placed' | 'active' | 'submitting' | 'submitted';
  feedbackText?: string;
  ticketId?: string;
  animationPhase: number;           // 0-1 for color cycling
}

interface StellaMarkerToolProps {
  userId: string;
  companyId: string;
  onTicketCreated?: (ticketId: string, shareUrl: string) => void;
}

export default function StellaMarkerTool({
  userId,
  companyId,
  onTicketCreated
}: StellaMarkerToolProps) {
  // Tool state
  const [isActive, setIsActive] = useState(false);
  const [markers, setMarkers] = useState<StellaMarker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  
  // Animation refs
  const animationFrameRef = useRef<number>();
  
  // Color cycling animation
  useEffect(() => {
    if (markers.some(m => m.state === 'placed' || m.state === 'active')) {
      animateColors();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [markers]);
  
  function animateColors() {
    const animate = () => {
      setMarkers(prev => prev.map(marker => {
        if (marker.state === 'placed' || marker.state === 'active') {
          return {
            ...marker,
            animationPhase: (marker.animationPhase + 0.01) % 1,
          };
        }
        return marker;
      }));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }
  
  // Get current color based on animation phase
  function getCurrentColor(phase: number): string {
    if (phase < 0.33) {
      // Purple
      return '#a855f7';
    } else if (phase < 0.66) {
      // Yellow
      return '#fbbf24';
    } else {
      // Green
      return '#10b981';
    }
  }
  
  // Activate/deactivate tool
  function toggleStellaTool() {
    setIsActive(!isActive);
    if (isActive) {
      // Deactivating - clear markers
      setMarkers([]);
      setActiveMarkerId(null);
    }
  }
  
  // Handle click on page
  function handlePageClick(event: MouseEvent) {
    if (!isActive) return;
    
    const { clientX, clientY } = event;
    
    // Create new marker
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      position: { x: clientX, y: clientY },
      state: 'placed',
      animationPhase: 0,
    };
    
    setMarkers(prev => [...prev, marker]);
    
    // Activate feedback box after brief animation
    setTimeout(() => {
      setActiveMarkerId(marker.id);
      updateMarkerState(marker.id, 'active');
    }, 300);
  }
  
  // Update marker state
  function updateMarkerState(markerId: string, state: StellaMarker['state']) {
    setMarkers(prev => prev.map(m => 
      m.id === markerId ? { ...m, state } : m
    ));
  }
  
  // Submit feedback
  async function handleSubmitFeedback(markerId: string) {
    if (!feedbackText.trim()) return;
    
    updateMarkerState(markerId, 'submitting');
    setIsSubmitting(true);
    
    try {
      // Capture context (element path, screenshot if needed)
      const marker = markers.find(m => m.id === markerId);
      if (!marker) return;
      
      const elementPath = getElementPath(marker.position);
      
      // Submit to API
      const response = await fetch('/api/feedback/stella-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyId,
          position: marker.position,
          elementPath,
          feedback: feedbackText,
          pageUrl: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      const result = await response.json();
      
      // Update marker with ticket ID
      updateMarkerState(markerId, 'submitted');
      setMarkers(prev => prev.map(m => 
        m.id === markerId ? { ...m, ticketId: result.ticketId } : m
      ));
      
      // Play success animation
      await playSuccessAnimation(markerId);
      
      // Show ticket preview with share options
      setCurrentTicket(result);
      setShowShareModal(true);
      
      // Notify parent
      onTicketCreated?.(result.ticketId, result.shareUrl);
      
      // Clear feedback
      setFeedbackText('');
      setActiveMarkerId(null);
      
    } catch (error) {
      console.error('Failed to submit stella feedback:', error);
      alert('Error al enviar feedback');
      updateMarkerState(markerId, 'active'); // Reset
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Success animation sequence
  async function playSuccessAnimation(markerId: string) {
    return new Promise<void>((resolve) => {
      // Total duration: 1.4s
      // 1. Blue spin (500ms)
      // 2. Scale down (300ms)
      // 3. Star explosion (200ms)
      // 4. Fade out (400ms)
      
      setTimeout(() => {
        // Remove marker after animation
        setMarkers(prev => prev.filter(m => m.id !== markerId));
        resolve();
      }, 1400);
    });
  }
  
  // Get element path for context
  function getElementPath(position: { x: number; y: number }): string {
    const element = document.elementFromPoint(position.x, position.y);
    if (!element) return '';
    
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const classes = current.className ? `.${current.className.toString().split(' ').join('.')}` : '';
      
      path.unshift(`${tagName}${id}${classes}`);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  // Setup/cleanup click listener
  useEffect(() => {
    if (isActive) {
      document.addEventListener('click', handlePageClick as any);
    }
    
    return () => {
      document.removeEventListener('click', handlePageClick as any);
    };
  }, [isActive]);
  
  const activeMarker = markers.find(m => m.id === activeMarkerId);
  
  return (
    <>
      {/* Toolbar Button */}
      <button
        onClick={toggleStellaTool}
        className={`fixed top-20 right-6 z-40 p-3 rounded-lg transition-all ${
          isActive
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50 scale-110'
            : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200 shadow-md'
        }`}
        title="Stella Marker - Anotar UI"
      >
        <Pencil className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
      </button>
      
      {/* Active indicator overlay */}
      {isActive && (
        <div className="fixed inset-0 z-30 bg-purple-500/5 pointer-events-none">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-yellow-500 text-white px-6 py-3 rounded-full shadow-lg pointer-events-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">Modo Stella Activo - Click en cualquier elemento para anotar</span>
              <button
                onClick={toggleStellaTool}
                className="ml-4 hover:bg-white/20 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stella Markers */}
      {markers.map((marker) => (
        <div
          key={marker.id}
          className="fixed z-40"
          style={{
            left: `${marker.position.x}px`,
            top: `${marker.position.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Marker Circle */}
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32"
            className={marker.state === 'submitting' ? 'animate-spin' : ''}
          >
            <defs>
              <filter id={`glow-${marker.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Main circle */}
            <circle
              cx="16"
              cy="16"
              r="12"
              fill={marker.state === 'submitting' ? '#3b82f6' : getCurrentColor(marker.animationPhase)}
              filter={`url(#glow-${marker.id})`}
              className={marker.state === 'placed' || marker.state === 'active' ? 'animate-pulse' : ''}
            />
            
            {/* Tail (Stella characteristic) */}
            {marker.state !== 'submitted' && (
              <path
                d="M 16 4 L 18 8 L 16 10 L 14 8 Z"
                fill="#fbbf24"
                opacity="0.8"
              />
            )}
            
            {/* Checkmark when submitted */}
            {marker.state === 'submitted' && (
              <path
                d="M 12 16 L 15 19 L 20 13"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          
          {/* Ticket badge when submitted */}
          {marker.state === 'submitted' && marker.ticketId && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
              {marker.ticketId}
            </div>
          )}
        </div>
      ))}
      
      {/* Feedback Box */}
      {activeMarker && (activeMarker.state === 'active') && (
        <div
          className="fixed z-50 animate-slideUp"
          style={{
            left: `${activeMarker.position.x}px`,
            top: `${activeMarker.position.y - 220}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div 
            className="w-80 bg-white rounded-xl shadow-2xl border-2"
            style={{
              borderImage: 'linear-gradient(135deg, #a855f7, #fbbf24) 1',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-yellow-500 to-green-500 p-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Stella Feedback
                </h3>
                <button
                  onClick={() => {
                    setActiveMarkerId(null);
                    setFeedbackText('');
                  }}
                  className="text-white hover:bg-white/20 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="¿Qué sugieres mejorar aquí?"
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                autoFocus
              />
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {feedbackText.length} / 500
                </span>
                <span className="text-xs text-purple-600 font-medium">
                  💡 Sé específico para mejores resultados
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={() => {
                  setActiveMarkerId(null);
                  setFeedbackText('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSubmitFeedback(activeMarkerId!)}
                disabled={!feedbackText.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal (after submission) */}
      {showShareModal && currentTicket && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">¡Feedback Enviado!</h2>
                  <p className="text-blue-100 text-sm">Ticket: {currentTicket.ticketId}</p>
                </div>
              </div>
            </div>
            
            {/* Ticket Preview */}
            <div className="p-6">
              {/* Status Timeline */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Estado del Ticket</h3>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mb-1">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-green-700">Enviado</span>
                  </div>
                  <div className="flex-1 h-1 bg-slate-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mb-1">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-blue-700">En Revisión</span>
                  </div>
                  <div className="flex-1 h-1 bg-slate-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-slate-300 text-white rounded-full flex items-center justify-center mb-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500">En Backlog</span>
                  </div>
                  <div className="flex-1 h-1 bg-slate-200 mx-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-slate-300 text-white rounded-full flex items-center justify-center mb-1">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500">Implementado</span>
                  </div>
                </div>
              </div>
              
              {/* Share Section */}
              <div className="bg-gradient-to-r from-purple-50 to-yellow-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                  🚀 Acelera esta Feature
                </h3>
                <p className="text-sm text-purple-800 mb-4">
                  Comparte con tu equipo para ganar upvotes y subir prioridad. 
                  ¡Más votos = Implementación más rápida!
                </p>
                
                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShareToSlack(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-semibold text-purple-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Slack
                  </button>
                  
                  <button
                    onClick={() => handleShareToTeams(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-semibold text-purple-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Teams
                  </button>
                  
                  <button
                    onClick={() => handleShareToWhatsApp(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-semibold text-purple-700"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={() => handleCopyLink(currentTicket.shareUrl)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-semibold text-purple-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                </div>
                
                {/* Viral Preview */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-xs font-medium text-purple-800 mb-2">Vista Previa del Compartir:</p>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                    <p className="font-semibold mb-1">🚀 Feature Request from Your Team</p>
                    <p className="mb-2">Requested by: User from Engineering</p>
                    <p className="text-purple-700 font-medium">🔒 Login required to view details</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Recibirás notificaciones sobre el progreso
              </p>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCurrentTicket(null);
                  setIsActive(false); // Deactivate tool
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
  
  // Share handlers
  async function handleShareToSlack(ticketId: string) {
    try {
      const response = await fetch('/api/feedback/share/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, userId }),
      });
      
      const data = await response.json();
      
      // Open Slack with pre-filled message
      window.open(data.slackShareUrl, '_blank');
      
      console.log('✅ Shared to Slack');
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }
  
  async function handleShareToTeams(ticketId: string) {
    // Similar to Slack
    console.log('Sharing to Teams:', ticketId);
  }
  
  async function handleShareToWhatsApp(ticketId: string) {
    // Fetch card data from API
    const response = await fetch(`/api/feedback/tickets/${ticketId}/share-card`);
    const card = await response.json();
    
    const text = `${card.preview.emoji} ${card.preview.type}\n\nRequested by: ${card.preview.createdBy}\n${card.preview.upvotes} upvotes\n\n🔒 Login to view: ${card.shareUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  async function handleCopyLink(shareUrl: string) {
    await navigator.clipboard.writeText(shareUrl);
    alert('¡Link copiado! Compártelo con tu equipo.');
  }
}

