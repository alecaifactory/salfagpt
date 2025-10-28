/**
 * 🔒 CONFIDENTIAL - Stella Marker Tool v2
 * 
 * Improved UX with:
 * - Non-interactive UI when active (prevents accidental clicks)
 * - 3 selection modes: Point, Area, Fullscreen
 * - Area selection with visual rectangle (violet)
 * - Captures both full page + selected area
 * - Only one selection at a time (focus)
 * - Smart positioning (always in viewport)
 * 
 * DO NOT SHARE - Proprietary competitive advantage
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  X, 
  Send, 
  Share2, 
  Copy,
  Sparkles,
  Check,
  Loader2,
  Camera,
  Square
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
  state: 'selecting' | 'active' | 'submitting' | 'submitted';
  feedbackText?: string;
  ticketId?: string;
  screenshot?: string;              // Full page screenshot
  selectedAreaScreenshot?: string;  // Cropped area screenshot
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
  const [selectedMode, setSelectedMode] = useState<StellaMode>('area'); // Default to area
  const [currentMarker, setCurrentMarker] = useState<StellaMarker | null>(null);
  
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
  
  // Deactivate tool
  function deactivateTool() {
    setIsActive(false);
    setCurrentMarker(null);
    setCurrentArea(null);
    setAreaStart(null);
    setIsDrawingArea(false);
    setFeedbackText('');
  }
  
  // Handle mouse down
  function handleMouseDown(event: MouseEvent) {
    if (!isActive || currentMarker) return; // Only one marker at a time
    
    event.preventDefault();
    event.stopPropagation();
    
    const { clientX, clientY } = event;
    
    if (selectedMode === 'point') {
      createPointMarker(clientX, clientY);
    } else if (selectedMode === 'area') {
      setIsDrawingArea(true);
      setAreaStart({ x: clientX, y: clientY });
      setCurrentArea({ x: clientX, y: clientY, width: 0, height: 0 });
    } else if (selectedMode === 'fullscreen') {
      createFullscreenMarker();
    }
  }
  
  // Handle mouse move
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
  
  // Handle mouse up
  function handleMouseUp(event: MouseEvent) {
    if (!isDrawingArea || !currentArea) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    setIsDrawingArea(false);
    
    if (currentArea.width < 20 || currentArea.height < 20) {
      // Too small
      setAreaStart(null);
      setCurrentArea(null);
      return;
    }
    
    createAreaMarker(currentArea);
    setAreaStart(null);
  }
  
  // Create markers
  async function createPointMarker(x: number, y: number) {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { mode: 'point', point: { x, y } },
      state: 'selecting',
    };
    
    setCurrentMarker(marker);
    await captureScreenshots(marker);
  }
  
  async function createAreaMarker(area: { x: number; y: number; width: number; height: number }) {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { mode: 'area', area },
      state: 'selecting',
    };
    
    setCurrentMarker(marker);
    setCurrentArea(null);
    await captureScreenshots(marker);
  }
  
  async function createFullscreenMarker() {
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { mode: 'fullscreen' },
      state: 'selecting',
    };
    
    setCurrentMarker(marker);
    await captureScreenshots(marker);
  }
  
  // Capture screenshots
  async function captureScreenshots(marker: StellaMarker) {
    try {
      const { default: html2canvas } = await import('html2canvas');
      
      // Hide Stella UI temporarily
      const stellaElements = document.querySelectorAll('[data-stella-ui]');
      stellaElements.forEach(el => (el as HTMLElement).style.visibility = 'hidden');
      
      // Capture full page
      const fullCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
      });
      
      const fullScreenshot = fullCanvas.toDataURL('image/png');
      let selectedAreaScreenshot = fullScreenshot;
      
      // Crop if area mode
      if (marker.selection.mode === 'area' && marker.selection.area) {
        const area = marker.selection.area;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = area.width;
        cropCanvas.height = area.height;
        const ctx = cropCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(fullCanvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
          selectedAreaScreenshot = cropCanvas.toDataURL('image/png');
        }
      }
      
      // Restore Stella UI
      stellaElements.forEach(el => (el as HTMLElement).style.visibility = 'visible');
      
      // Update marker with screenshots but DON'T activate feedback box yet
      // Keep in 'selecting' state to show the selection
      setCurrentMarker({
        ...marker,
        screenshot: fullScreenshot,
        selectedAreaScreenshot,
        state: 'selecting', // Changed from 'active' - don't show feedback box yet
      });
      
      // After a brief delay, activate feedback box (keep selection visible)
      setTimeout(() => {
        setCurrentMarker(prev => prev ? { ...prev, state: 'active' } : null);
      }, 300);
      
    } catch (error) {
      console.error('Screenshot failed:', error);
      setCurrentMarker({ ...marker, state: 'active' });
    }
  }
  
  // Submit feedback
  async function handleSubmitFeedback() {
    if (!feedbackText.trim() || !currentMarker) return;
    
    setIsSubmitting(true);
    setCurrentMarker({ ...currentMarker, state: 'submitting' });
    
    try {
      const response = await fetch('/api/feedback/stella-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          companyId,
          selection: currentMarker.selection,
          feedback: feedbackText,
          pageUrl: window.location.href,
          screenshot: currentMarker.screenshot,
          selectedAreaScreenshot: currentMarker.selectedAreaScreenshot,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      const result = await response.json();
      
      setCurrentMarker({
        ...currentMarker,
        ticketId: result.ticketId,
        state: 'submitted',
      });
      
      // Show share modal
      setCurrentTicket(result);
      setShowShareModal(true);
      
      onTicketCreated?.(result.ticketId, result.shareUrl);
      
      // Reset after delay
      setTimeout(() => {
        deactivateTool();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Error al enviar feedback');
      setCurrentMarker({ ...currentMarker, state: 'active' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Event listeners
  useEffect(() => {
    if (isActive && !currentMarker) {
      // Disable all page interactivity
      const style = document.createElement('style');
      style.id = 'stella-non-interactive';
      style.textContent = `
        body * :not([data-stella-ui]) {
          pointer-events: none !important;
          user-select: none !important;
        }
        [data-stella-ui] {
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
      
      document.addEventListener('mousedown', handleMouseDown as any, true);
      document.addEventListener('mousemove', handleMouseMove as any, true);
      document.addEventListener('mouseup', handleMouseUp as any, true);
      
      return () => {
        document.getElementById('stella-non-interactive')?.remove();
        document.removeEventListener('mousedown', handleMouseDown as any, true);
        document.removeEventListener('mousemove', handleMouseMove as any, true);
        document.removeEventListener('mouseup', handleMouseUp as any, true);
      };
    }
  }, [isActive, currentMarker, isDrawingArea, areaStart]);
  
  // Calculate feedback box position
  const getFeedbackBoxPosition = () => {
    if (!currentMarker) return { left: 0, top: 0 };
    
    const boxWidth = 380;
    const boxHeight = 400;
    const margin = 20;
    
    let left = window.innerWidth / 2;
    let top = window.innerHeight / 2 - boxHeight / 2;
    
    // Center it, ensuring it stays in bounds
    if (top < margin) top = margin;
    if (top + boxHeight > window.innerHeight - margin) {
      top = window.innerHeight - boxHeight - margin;
    }
    
    return { left, top };
  };
  
  const boxPos = getFeedbackBoxPosition();
  
  return (
    <>
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsActive(!isActive)}
        data-stella-ui
        className={`fixed top-20 right-6 z-40 p-3 rounded-lg transition-all ${
          isActive
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50'
            : 'bg-white text-slate-700 hover:bg-violet-50 border border-slate-200 shadow-md hover:shadow-lg'
        }`}
        title="Stella - Feedback Tool"
      >
        <Pencil className="w-5 h-5" />
      </button>
      
      {/* Mode Selector */}
      {isActive && !currentMarker && (
        <div 
          data-stella-ui
          className="fixed top-36 right-6 z-40 bg-white rounded-lg shadow-xl border-2 border-violet-200 p-3 space-y-2 w-52"
        >
          <p className="text-xs font-bold text-violet-900 mb-2">Modo de Selección:</p>
          
          <button
            onClick={() => setSelectedMode('point')}
            data-stella-ui
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMode === 'point'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-current flex-shrink-0" />
            <span>Punto</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('area')}
            data-stella-ui
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMode === 'area'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            <Square className="w-4 h-4 flex-shrink-0" />
            <span>Área (Drag)</span>
          </button>
          
          <button
            onClick={() => setSelectedMode('fullscreen')}
            data-stella-ui
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMode === 'fullscreen'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 flex-shrink-0" />
            <span>Pantalla Completa</span>
          </button>
        </div>
      )}
      
      {/* Overlay when active */}
      {isActive && (
        <div data-stella-ui className="fixed inset-0 z-30 bg-violet-500/5 pointer-events-none">
          {/* Instructions Banner */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white px-6 py-3 rounded-full shadow-lg pointer-events-auto">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium text-sm">
                {!currentMarker && selectedMode === 'point' && 'Click donde quieras dar feedback'}
                {!currentMarker && selectedMode === 'area' && 'Arrastra para seleccionar área'}
                {!currentMarker && selectedMode === 'fullscreen' && 'Click para capturar toda la pantalla'}
                {currentMarker && 'Escribe tu feedback'}
              </span>
              <button
                onClick={deactivateTool}
                data-stella-ui
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Drawing Area Rectangle */}
          {isDrawingArea && currentArea && currentArea.width > 0 && currentArea.height > 0 && (
            <div
              className="absolute border-4 border-violet-600 bg-violet-600/10"
              style={{
                left: `${currentArea.x}px`,
                top: `${currentArea.y}px`,
                width: `${currentArea.width}px`,
                height: `${currentArea.height}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="absolute -top-7 left-0 bg-violet-600 text-white px-3 py-1 rounded-md text-xs font-bold shadow-lg">
                {Math.round(currentArea.width)} × {Math.round(currentArea.height)} px
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Point Marker - Always visible */}
      {currentMarker && currentMarker.selection.mode === 'point' && currentMarker.selection.point && (
        <div
          className="fixed z-35"
          style={{
            left: `${currentMarker.selection.point.x}px`,
            top: `${currentMarker.selection.point.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className={`w-8 h-8 rounded-full bg-violet-600 border-4 border-white shadow-lg ${
            currentMarker.state === 'active' ? 'animate-pulse' : ''
          }`} />
        </div>
      )}
      
      {/* Area Marker - Always visible, even when feedback box is open */}
      {currentMarker && currentMarker.selection.mode === 'area' && currentMarker.selection.area && (
        <div
          className="fixed z-35 border-4 border-violet-600 bg-violet-600/10 pointer-events-none"
          style={{
            left: `${currentMarker.selection.area.x}px`,
            top: `${currentMarker.selection.area.y}px`,
            width: `${currentMarker.selection.area.width}px`,
            height: `${currentMarker.selection.area.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Always show dark overlay
          }}
        >
          {/* Area label - always visible */}
          <div className="absolute -top-8 left-0 bg-violet-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
            Área Seleccionada: {Math.round(currentMarker.selection.area.width)} × {Math.round(currentMarker.selection.area.height)} px
          </div>
          
          {currentMarker.state === 'submitted' && currentMarker.ticketId && (
            <div className="absolute bottom-2 right-2 bg-violet-600 text-white px-3 py-1 rounded-lg text-sm font-mono shadow-lg">
              {currentMarker.ticketId}
            </div>
          )}
        </div>
      )}
      
      {/* Fullscreen Marker Indicator */}
      {currentMarker && currentMarker.selection.mode === 'fullscreen' && (
        <div className="fixed z-35 top-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-violet-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Pantalla Completa Capturada
          </div>
        </div>
      )}
      
      {/* Feedback Box - High z-index but selection remains visible behind */}
      {currentMarker && currentMarker.state === 'active' && (
        <div
          data-stella-ui
          className="fixed z-50"
          style={{
            left: `${boxPos.left}px`,
            top: `${boxPos.top}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-96 bg-white rounded-xl shadow-2xl border-2 border-violet-400"
            style={{
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header */}
            <div className="bg-violet-600 p-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Stella Feedback
                </h3>
                <button
                  onClick={deactivateTool}
                  data-stella-ui
                  className="text-white hover:bg-white/20 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Selected Area Preview */}
            {currentMarker.selectedAreaScreenshot && currentMarker.selection.mode === 'area' && (
              <div className="p-4 border-b border-violet-200 bg-violet-50">
                <p className="text-xs font-semibold text-violet-900 mb-2">Área Seleccionada:</p>
                <img 
                  src={currentMarker.selectedAreaScreenshot} 
                  alt="Selected area" 
                  className="w-full rounded border-2 border-violet-300"
                  style={{ maxHeight: '150px', objectFit: 'contain' }}
                />
              </div>
            )}
            
            {/* Feedback Input */}
            <div className="p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ¿Qué sugieres para esta parte de la UI?
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe tu sugerencia, problema o mejora..."
                rows={5}
                maxLength={500}
                data-stella-ui
                className="w-full px-3 py-2 border-2 border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {feedbackText.length} / 500
                </span>
                <span className="text-xs text-violet-600 font-medium">
                  💡 Sé específico y claro
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={deactivateTool}
                data-stella-ui
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackText.trim() || isSubmitting}
                data-stella-ui
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
                    Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && currentTicket && (
        <div data-stella-ui className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full">
            <div className="bg-violet-600 p-6 rounded-t-xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">¡Feedback Enviado!</h2>
                  <p className="text-violet-100 text-sm">Ticket: {currentTicket.ticketId}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                Tu feedback ha sido recibido y será revisado por el equipo.
              </p>
              
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-violet-900 mb-2">
                  🚀 Comparte para acelerar
                </h3>
                <p className="text-xs text-violet-800 mb-3">
                  Más upvotes = Mayor prioridad = Implementación más rápida
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {/* Share to Slack */}}
                    data-stella-ui
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-medium text-violet-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Slack
                  </button>
                  
                  <button
                    onClick={() => navigator.clipboard.writeText(currentTicket.shareUrl)}
                    data-stella-ui
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-violet-300 rounded-lg hover:bg-violet-50 text-sm font-medium text-violet-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-0 flex justify-end">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCurrentTicket(null);
                  deactivateTool();
                }}
                data-stella-ui
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

