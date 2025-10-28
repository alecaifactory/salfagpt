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

type StellaMode = 'point' | 'area' | 'fullscreen';

interface StellaSelection {
  mode: StellaMode;
  point?: { x: number; y: number };
  area?: { x: number; y: number; width: number; height: number };
}

interface StellaMarker {
  id: string;
  selection: StellaSelection;
  state: 'idle' | 'selecting' | 'active' | 'submitting' | 'submitted';
  feedbackText?: string;
  ticketId?: string;
  screenshot?: string;              // Full page screenshot URL
  selectedAreaScreenshot?: string;  // Selected area screenshot URL
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
  const [selectedMode, setSelectedMode] = useState<StellaMode>('point');
  const [markers, setMarkers] = useState<StellaMarker[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  
  // Area selection state
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [areaStart, setAreaStart] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  
  // Simple violet color - no cycling
  function getCurrentColor(): string {
    return '#8b5cf6'; // Violet
  }
  
  // Activate/deactivate tool
  function toggleStellaTool() {
    setIsActive(!isActive);
    if (isActive) {
      // Deactivating - clear everything
      setMarkers([]);
      setActiveMarkerId(null);
      setCurrentArea(null);
      setAreaStart(null);
      setIsDrawingArea(false);
    }
  }
  
  // Handle mouse down - start selection
  function handleMouseDown(event: MouseEvent) {
    if (!isActive) return;
    
    // Prevent default to avoid triggering UI actions
    event.preventDefault();
    event.stopPropagation();
    
    const { clientX, clientY } = event;
    
    if (selectedMode === 'point') {
      // Point mode - simple click
      createPointMarker(clientX, clientY);
    } else if (selectedMode === 'area') {
      // Area mode - start drawing rectangle
      setIsDrawingArea(true);
      setAreaStart({ x: clientX, y: clientY });
      setCurrentArea({ x: clientX, y: clientY, width: 0, height: 0 });
    } else if (selectedMode === 'fullscreen') {
      // Fullscreen mode - capture entire page
      createFullscreenMarker();
    }
  }
  
  // Handle mouse move - update area selection
  function handleMouseMove(event: MouseEvent) {
    if (!isDrawingArea || !areaStart) return;
    
    const { clientX, clientY } = event;
    
    const width = clientX - areaStart.x;
    const height = clientY - areaStart.y;
    
    setCurrentArea({
      x: width < 0 ? clientX : areaStart.x,
      y: height < 0 ? clientY : areaStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }
  
  // Handle mouse up - finalize area selection
  function handleMouseUp(event: MouseEvent) {
    if (!isDrawingArea || !currentArea) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    setIsDrawingArea(false);
    
    // Minimum area size (20x20px)
    if (currentArea.width < 20 || currentArea.height < 20) {
      // Too small - treat as point
      createPointMarker(areaStart!.x, areaStart!.y);
      setAreaStart(null);
      setCurrentArea(null);
      return;
    }
    
    // Create area marker
    createAreaMarker(currentArea);
    setAreaStart(null);
  }
  
  // Create point marker
  function createPointMarker(x: number, y: number) {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: {
        mode: 'point',
        point: { x, y },
      },
      state: 'selecting',
    };
    
    setMarkers([marker]); // Only one marker at a time
    
    // Capture screenshots and show feedback box
    captureScreenshots(marker);
  }
  
  // Create area marker
  function createAreaMarker(area: { x: number; y: number; width: number; height: number }) {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: {
        mode: 'area',
        area,
      },
      state: 'selecting',
    };
    
    setMarkers([marker]); // Only one marker at a time
    setCurrentArea(null);
    
    // Capture screenshots and show feedback box
    captureScreenshots(marker);
  }
  
  // Create fullscreen marker
  function createFullscreenMarker() {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: {
        mode: 'fullscreen',
      },
      state: 'selecting',
    };
    
    setMarkers([marker]); // Only one marker at a time
    
    // Capture screenshots and show feedback box
    captureScreenshots(marker);
  }
  
  // Capture screenshots based on selection
  async function captureScreenshots(marker: StellaMarker) {
    try {
      // Dynamic import html2canvas
      const { default: html2canvas } = await import('html2canvas');
      
      // Hide Stella UI before capture
      const stellaElements = document.querySelectorAll('[data-stella-ui]');
      stellaElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      // Capture full page for context
      const fullCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
      });
      
      const fullScreenshot = fullCanvas.toDataURL('image/png');
      
      let selectedAreaScreenshot = fullScreenshot;
      
      // If area mode, crop to selected area
      if (marker.selection.mode === 'area' && marker.selection.area) {
        const area = marker.selection.area;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = area.width;
        cropCanvas.height = area.height;
        const ctx = cropCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            fullCanvas,
            area.x, area.y, area.width, area.height,
            0, 0, area.width, area.height
          );
          selectedAreaScreenshot = cropCanvas.toDataURL('image/png');
        }
      }
      
      // Restore Stella UI
      stellaElements.forEach(el => (el as HTMLElement).style.display = '');
      
      // Update marker with screenshots
      setMarkers(prev => prev.map(m =>
        m.id === marker.id
          ? {
              ...m,
              screenshot: fullScreenshot,
              selectedAreaScreenshot,
              state: 'active',
            }
          : m
      ));
      
      setActiveMarkerId(marker.id);
      
    } catch (error) {
      console.error('Failed to capture screenshots:', error);
      // Show feedback box anyway
      setActiveMarkerId(marker.id);
      updateMarkerState(marker.id, 'active');
    }
  }
  
  // Calculate feedback box position (keep within viewport)
  function calculateFeedbackBoxPosition(markerPos: { x: number; y: number }) {
    const boxWidth = 320; // 80 * 4 = 320px (w-80)
    const boxHeight = 250; // Approximate height
    const margin = 16; // Minimum margin from edges
    
    let left = markerPos.x;
    let top = markerPos.y - boxHeight - 20; // Default: above marker
    
    // Keep within horizontal bounds
    if (left - boxWidth / 2 < margin) {
      left = boxWidth / 2 + margin;
    } else if (left + boxWidth / 2 > window.innerWidth - margin) {
      left = window.innerWidth - boxWidth / 2 - margin;
    }
    
    // If too close to top, show below marker instead
    if (top < margin) {
      top = markerPos.y + 40; // Below marker
    }
    
    // If too close to bottom, adjust upward
    if (top + boxHeight > window.innerHeight - margin) {
      top = window.innerHeight - boxHeight - margin;
    }
    
    return { left, top };
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
  
  // Setup/cleanup event listeners
  useEffect(() => {
    if (isActive) {
      // Add pointer-events-none to all interactive elements except Stella UI
      const interactiveElements = document.querySelectorAll('button:not([data-stella-ui]), a:not([data-stella-ui]), input:not([data-stella-ui]), select:not([data-stella-ui]), textarea:not([data-stella-ui])');
      interactiveElements.forEach(el => {
        (el as HTMLElement).style.pointerEvents = 'none';
      });
      
      document.addEventListener('mousedown', handleMouseDown as any, true);
      document.addEventListener('mousemove', handleMouseMove as any, true);
      document.addEventListener('mouseup', handleMouseUp as any, true);
    }
    
    return () => {
      // Restore pointer events
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
      interactiveElements.forEach(el => {
        (el as HTMLElement).style.pointerEvents = '';
      });
      
      document.removeEventListener('mousedown', handleMouseDown as any, true);
      document.removeEventListener('mousemove', handleMouseMove as any, true);
      document.removeEventListener('mouseup', handleMouseUp as any, true);
    };
  }, [isActive, isDrawingArea, areaStart]);
  
  const activeMarker = markers.find(m => m.id === activeMarkerId);
  
  return (
    <>
      {/* Toolbar - Main Button */}
      <button
        onClick={toggleStellaTool}
        data-stella-ui
        className={`fixed top-20 right-6 z-40 p-3 rounded-lg transition-all ${
          isActive
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50 scale-110'
            : 'bg-white text-slate-700 hover:bg-violet-50 border border-slate-200 shadow-md'
        }`}
        title="Stella Marker - Anotar UI"
      >
        <Pencil className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
      </button>
      
      {/* Mode Selector - Appears when Stella is active */}
      {isActive && (
        <div 
          data-stella-ui
          className="fixed top-36 right-6 z-40 bg-white rounded-lg shadow-xl border-2 border-violet-200 p-2 space-y-1"
        >
          <p className="text-xs font-semibold text-violet-900 px-2 py-1">Modo de Selección:</p>
          
          <button
            onClick={() => setSelectedMode('point')}
            data-stella-ui
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedMode === 'point'
                ? 'bg-violet-600 text-white'
                : 'text-slate-700 hover:bg-violet-50'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-current" />
            Punto
          </button>
          
          <button
            onClick={() => setSelectedMode('area')}
            data-stella-ui
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedMode === 'area'
                ? 'bg-violet-600 text-white'
                : 'text-slate-700 hover:bg-violet-50'
            }`}
          >
            <div className="w-3 h-3 border-2 border-current" />
            Área
          </button>
          
          <button
            onClick={() => setSelectedMode('fullscreen')}
            data-stella-ui
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedMode === 'fullscreen'
                ? 'bg-violet-600 text-white'
                : 'text-slate-700 hover:bg-violet-50'
            }`}
          >
            <Camera className="w-3 h-3" />
            Pantalla Completa
          </button>
        </div>
      )}
      
      {/* Active indicator overlay - Non-interactive */}
      {isActive && (
        <div className="fixed inset-0 z-30 bg-violet-500/5 pointer-events-none">
          {/* Top Banner */}
          <div 
            data-stella-ui
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white px-6 py-3 rounded-full shadow-lg pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">
                {selectedMode === 'point' && 'Click para anotar punto específico'}
                {selectedMode === 'area' && 'Arrastra para seleccionar área'}
                {selectedMode === 'fullscreen' && 'Click para capturar pantalla completa'}
              </span>
              <button
                onClick={toggleStellaTool}
                data-stella-ui
                className="ml-4 hover:bg-white/20 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Area Selection Rectangle */}
          {isDrawingArea && currentArea && (
            <div
              className="absolute border-4 border-violet-600 bg-violet-600/20 pointer-events-none"
              style={{
                left: `${currentArea.x}px`,
                top: `${currentArea.y}px`,
                width: `${currentArea.width}px`,
                height: `${currentArea.height}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="absolute -top-6 left-0 bg-violet-600 text-white px-2 py-1 rounded text-xs font-semibold">
                {Math.round(currentArea.width)} × {Math.round(currentArea.height)} px
              </div>
            </div>
          )}
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
              fill={marker.state === 'submitting' ? '#3b82f6' : '#8b5cf6'}
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
      {activeMarker && (activeMarker.state === 'active') && (() => {
        const boxPos = calculateFeedbackBoxPosition(activeMarker.position);
        return (
          <div
            className="fixed z-50 animate-slideUp"
            style={{
              left: `${boxPos.left}px`,
              top: `${boxPos.top}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div 
              className="w-80 bg-white rounded-xl shadow-2xl border-2 border-violet-400"
              style={{
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
              }}
            >
              {/* Header */}
              <div className="bg-violet-600 p-3 rounded-t-xl">
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
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2"
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
        );
      })()}
      
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
              <div className="bg-violet-50 border-2 border-violet-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-violet-900 mb-2 flex items-center gap-2">
                  🚀 Acelera esta Feature
                </h3>
                <p className="text-sm text-violet-800 mb-4">
                  Comparte con tu equipo para ganar upvotes y subir prioridad. 
                  ¡Más votos = Implementación más rápida!
                </p>
                
                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShareToSlack(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-semibold text-violet-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Slack
                  </button>
                  
                  <button
                    onClick={() => handleShareToTeams(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-semibold text-violet-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Teams
                  </button>
                  
                  <button
                    onClick={() => handleShareToWhatsApp(currentTicket.ticketId)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-semibold text-violet-700"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={() => handleCopyLink(currentTicket.shareUrl)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-semibold text-violet-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                </div>
                
                {/* Viral Preview */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-violet-200">
                  <p className="text-xs font-medium text-violet-800 mb-2">Vista Previa del Compartir:</p>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                    <p className="font-semibold mb-1">🚀 Feature Request from Your Team</p>
                    <p className="mb-2">Requested by: User from Engineering</p>
                    <p className="text-violet-700 font-medium">🔒 Login required to view details</p>
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

