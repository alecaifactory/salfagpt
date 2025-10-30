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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wand2, 
  X, 
  Send, 
  Share2, 
  Copy,
  Sparkles,
  Check,
  Loader2,
  Camera,
  Square,
  Circle,
  ArrowRight,
  Eraser,
  Eye,
  Paintbrush,
  Video,
  Bug,
  Lightbulb,
  TrendingUp
} from 'lucide-react';

type StellaMode = 'point' | 'area' | 'fullscreen' | 'magic-brush' | 'clip';
type FeedbackCategory = 'bug' | 'feature' | 'improvement';

interface ClipFrame {
  timestamp: number;
  dataUrl: string;           // Base64 screenshot
  cursor?: { x: number; y: number };
}

interface StellaSelection {
  mode: StellaMode;
  point?: { x: number; y: number };
  area?: { x: number; y: number; width: number; height: number };
  brushPath?: Array<{ x: number; y: number; timestamp: number }>; // Free-form path
  clip?: {
    frames: ClipFrame[];
    duration: number;         // milliseconds
    fps: number;              // 24
  };
}

type AnnotationTool = 'none' | 'circle' | 'rectangle' | 'arrow';

interface Annotation {
  id: string;
  type: 'circle' | 'rectangle' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  color: string;
}

interface StellaMarker {
  id: string;
  selection: StellaSelection;
  state: 'selecting' | 'active' | 'submitting' | 'submitted';
  feedbackText?: string;
  feedbackCategory?: FeedbackCategory; // User-selected category
  ticketId?: string;
  screenshot?: string;              // Full page screenshot
  selectedAreaScreenshot?: string;  // Cropped area screenshot
  annotations?: Annotation[];       // User annotations on screenshot
  aiInference?: {                   // AI-generated context
    pageContext: string;            // What page/feature
    identifiedIssue: string;        // What problem
    suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
    suggestedCategory: string;      // Feature area
  };
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
  
  // Area selection state - Use refs for immediate updates in event handlers
  const isDrawingAreaRef = useRef(false);
  const areaStartRef = useRef<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawingAreaDisplay, setIsDrawingAreaDisplay] = useState(false); // For render only
  
  // Magic brush state - Use refs for immediate updates
  const isDrawingBrushRef = useRef(false);
  const brushPathRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  const [brushPathDisplay, setBrushPathDisplay] = useState<Array<{ x: number; y: number; timestamp: number }>>([]);
  
  // Clip recording state
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [clipFrames, setClipFrames] = useState<ClipFrame[]>([]);
  const [clipStartTime, setClipStartTime] = useState<number>(0);
  const clipIntervalRef = useRef<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('bug');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Annotation state
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<AnnotationTool>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState(false);
  const [annotationStart, setAnnotationStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // AI Inference state
  const [isGeneratingInference, setIsGeneratingInference] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  
  // Deactivate tool
  function deactivateTool() {
    setIsActive(false);
    setCurrentMarker(null);
    setCurrentArea(null);
    areaStartRef.current = null;
    isDrawingAreaRef.current = false;
    setIsDrawingAreaDisplay(false);
    brushPathRef.current = [];
    setBrushPathDisplay([]);
    isDrawingBrushRef.current = false;
    setFeedbackText('');
    setAnnotations([]);
    setSelectedAnnotationTool('none');
  }
  
  // Use refs to avoid stale closures in event handlers
  const isActiveRef = useRef(isActive);
  const currentMarkerRef = useRef(currentMarker);
  const selectedModeRef = useRef(selectedMode);
  const isRecordingClipRef = useRef(isRecordingClip);
  const currentAreaRef = useRef(currentArea);
  
  useEffect(() => {
    isActiveRef.current = isActive;
    currentMarkerRef.current = currentMarker;
    selectedModeRef.current = selectedMode;
    isRecordingClipRef.current = isRecordingClip;
    currentAreaRef.current = currentArea;
  }, [isActive, currentMarker, selectedMode, isRecordingClip, currentArea]);
  
  const handleMouseDown = useCallback((event: MouseEvent) => {
    console.log('🖱️ Mouse down detected - isActive:', isActiveRef.current, 'currentMarker:', !!currentMarkerRef.current, 'mode:', selectedModeRef.current);
    
    if (!isActiveRef.current || currentMarkerRef.current) {
      console.log('⚠️ Ignoring mouse down - isActive:', isActiveRef.current, 'currentMarker exists:', !!currentMarkerRef.current);
      return; // Only one marker at a time
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const { clientX, clientY } = event;
    console.log('📍 Mouse position:', clientX, clientY);
    
    if (selectedModeRef.current === 'point') {
      console.log('👉 Creating point marker');
      createPointMarker(clientX, clientY);
    } else if (selectedModeRef.current === 'area') {
      console.log('📦 Starting area selection');
      isDrawingAreaRef.current = true;
      setIsDrawingAreaDisplay(true);
      areaStartRef.current = { x: clientX, y: clientY };
      setCurrentArea({ x: clientX, y: clientY, width: 0, height: 0 });
    } else if (selectedModeRef.current === 'magic-brush') {
      console.log('🖌️ Starting magic brush');
      isDrawingBrushRef.current = true;
      brushPathRef.current = [{ x: clientX, y: clientY, timestamp: Date.now() }];
      setBrushPathDisplay([{ x: clientX, y: clientY, timestamp: Date.now() }]);
    } else if (selectedModeRef.current === 'clip') {
      console.log('🎬 Starting/stopping clip recording');
      if (!isRecordingClipRef.current) {
        startClipRecording();
      } else {
        stopClipRecording();
      }
    } else if (selectedModeRef.current === 'fullscreen') {
      console.log('📸 Creating fullscreen marker');
      createFullscreenMarker();
    }
  }, []);
  
  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const { clientX, clientY } = event;
    
    // Handle area drawing
    if (isDrawingAreaRef.current && areaStartRef.current) {
      const width = clientX - areaStartRef.current.x;
      const height = clientY - areaStartRef.current.y;
      
      setCurrentArea({
        x: width < 0 ? clientX : areaStartRef.current.x,
        y: height < 0 ? clientY : areaStartRef.current.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    }
    
    // Handle magic brush drawing
    if (isDrawingBrushRef.current) {
      const newPoint = { x: clientX, y: clientY, timestamp: Date.now() };
      brushPathRef.current = [...brushPathRef.current, newPoint];
      setBrushPathDisplay(prev => [...prev, newPoint]);
    }
  }, []);
  
  // Handle mouse up
  const handleMouseUp = useCallback((event: MouseEvent) => {
    console.log('🖱️ Mouse up detected - isDrawingArea:', isDrawingAreaRef.current, 'isDrawingBrush:', isDrawingBrushRef.current);
    
    event.preventDefault();
    event.stopPropagation();
    
    // Handle area mode
    if (isDrawingAreaRef.current && currentAreaRef.current) {
      isDrawingAreaRef.current = false;
      setIsDrawingAreaDisplay(false);
      
      const area = currentAreaRef.current;
      
      // Allow any selection (even small ones - user intention matters)
      if (area.width < 1 || area.height < 1) {
        console.log('⚠️ Selección inválida, ignorando');
        areaStartRef.current = null;
        setCurrentArea(null);
        return;
      }
      
      console.log('✅ Área seleccionada:', area.width, 'x', area.height, 'px');
      createAreaMarker(area);
      areaStartRef.current = null;
      return;
    }
    
    // Handle magic brush mode
    if (isDrawingBrushRef.current && brushPathRef.current.length > 0) {
      isDrawingBrushRef.current = false;
      
      const path = brushPathRef.current;
      
      // Require at least 5 points for a meaningful shape
      if (path.length < 5) {
        console.log('⚠️ Path muy corto, ignorando (mínimo 5 puntos)');
        brushPathRef.current = [];
        setBrushPathDisplay([]);
        return;
      }
      
      console.log('✅ Magic brush path:', path.length, 'puntos - cerrando loop');
      
      // Close the loop - add first point to end to create closed shape
      const closedPath = [...path, path[0]];
      
      createBrushMarker(closedPath);
      brushPathRef.current = [];
      setBrushPathDisplay([]);
    }
  }, []);
  
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
    console.log('📍 Creando area marker:', area);
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { mode: 'area', area },
      state: 'selecting',
    };
    
    console.log('🔧 Marker creado:', marker);
    setCurrentMarker(marker);
    setCurrentArea(null);
    console.log('📸 Capturando screenshots para área...');
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
  
  async function createBrushMarker(path: Array<{ x: number; y: number; timestamp: number }>) {
    console.log('🎨 Creando magic brush marker con', path.length, 'puntos');
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { mode: 'magic-brush', brushPath: path },
      state: 'selecting',
    };
    
    setCurrentMarker(marker);
    await captureScreenshots(marker);
  }
  
  // Start clip recording
  async function startClipRecording() {
    console.log('🎬 Iniciando grabación de clip a 24fps');
    setIsRecordingClip(true);
    setClipFrames([]);
    setClipStartTime(Date.now());
    setRecordingDuration(0);
    
    const FPS = 24;
    const frameInterval = 1000 / FPS; // ~41.67ms per frame
    
    // Start recording frames
    clipIntervalRef.current = window.setInterval(async () => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        
        // Hide Stella UI temporarily
        const stellaElements = document.querySelectorAll('[data-stella-ui]');
        stellaElements.forEach(el => (el as HTMLElement).style.visibility = 'hidden');
        
        // Capture frame
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 0.5, // Lower quality for performance (can adjust)
        });
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // JPEG for smaller size
        
        // Restore Stella UI
        stellaElements.forEach(el => (el as HTMLElement).style.visibility = 'visible');
        
        // Get cursor position if available
        const cursorPos = { x: 0, y: 0 }; // TODO: Track cursor position
        
        const frame: ClipFrame = {
          timestamp: Date.now(),
          dataUrl,
          cursor: cursorPos,
        };
        
        setClipFrames(prev => [...prev, frame]);
        setRecordingDuration(Date.now() - clipStartTime);
        
        console.log('📸 Frame captured:', clipFrames.length + 1);
        
      } catch (error) {
        console.error('Frame capture failed:', error);
      }
    }, frameInterval);
  }
  
  // Stop clip recording
  function stopClipRecording() {
    console.log('🎬 Deteniendo grabación - Total frames:', clipFrames.length);
    
    if (clipIntervalRef.current) {
      clearInterval(clipIntervalRef.current);
      clipIntervalRef.current = null;
    }
    
    setIsRecordingClip(false);
    
    if (clipFrames.length < 5) {
      console.log('⚠️ Clip muy corto, ignorando');
      setClipFrames([]);
      return;
    }
    
    // Create clip marker
    const duration = Date.now() - clipStartTime;
    createClipMarker(clipFrames, duration);
  }
  
  async function createClipMarker(frames: ClipFrame[], duration: number) {
    console.log('🎥 Creando clip marker:', frames.length, 'frames en', duration, 'ms');
    
    const marker: StellaMarker = {
      id: `stella-${Date.now()}`,
      selection: { 
        mode: 'clip', 
        clip: { 
          frames, 
          duration, 
          fps: 24 
        } 
      },
      state: 'selecting',
    };
    
    setCurrentMarker(marker);
    setClipFrames([]);
    
    // Generate AI inference from clip sequence
    await generateClipInference(marker);
  }
  
  // Generate AI inference from clip sequence
  async function generateClipInference(marker: StellaMarker) {
    if (!marker.selection.clip) return;
    
    setIsGeneratingInference(true);
    
    try {
      const clip = marker.selection.clip;
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      // Send first, middle, and last frames for analysis
      const keyFrames = [
        clip.frames[0],
        clip.frames[Math.floor(clip.frames.length / 2)],
        clip.frames[clip.frames.length - 1]
      ];
      
      const response = await fetch('/api/stella/analyze-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl,
          pageTitle,
          keyFrames,
          totalFrames: clip.frames.length,
          duration: clip.duration,
          fps: clip.fps,
        }),
      });
      
      if (!response.ok) throw new Error('Clip analysis failed');
      
      const inference = await response.json();
      
      setCurrentMarker(prev => prev ? {
        ...prev,
        aiInference: inference,
        state: 'active', // Activate feedback box
      } : null);
      
      console.log('🤖 Clip AI Inference generada:', inference);
      
    } catch (error) {
      console.error('Clip AI Inference failed (non-critical):', error);
      // Still show feedback box even if AI fails
      setCurrentMarker(prev => prev ? { ...prev, state: 'active' } : null);
    } finally {
      setIsGeneratingInference(false);
    }
  }
  
  // Capture screenshots
  async function captureScreenshots(marker: StellaMarker) {
    console.log('📸 captureScreenshots called for mode:', marker.selection.mode);
    
    // Show feedback box immediately (don't wait for screenshots)
    setCurrentMarker({
      ...marker,
      state: 'active',
    });
    
    console.log('✅ Feedback box activado (state: active)');
    
    // Capture screenshots in background
    setTimeout(async () => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        
        console.log('📸 Capturando screenshots en background...');
        
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
        
        console.log('📸 Full screenshot captured:', fullScreenshot.substring(0, 50) + '...');
        
        // Crop if area mode
        if (marker.selection.mode === 'area' && marker.selection.area) {
          const area = marker.selection.area;
          console.log('✂️ Cropping area:', area);
          
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = area.width;
          cropCanvas.height = area.height;
          const ctx = cropCanvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(fullCanvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
            selectedAreaScreenshot = cropCanvas.toDataURL('image/png');
            console.log('✅ Area screenshot cropped:', selectedAreaScreenshot.substring(0, 50) + '...');
          }
        }
        
        // Restore Stella UI
        stellaElements.forEach(el => (el as HTMLElement).style.visibility = 'visible');
        
        // Update marker with screenshots
        setCurrentMarker(prev => {
          const updated = prev ? {
            ...prev,
            screenshot: fullScreenshot,
            selectedAreaScreenshot,
          } : null;
          console.log('📌 Marker updated with screenshots:', updated?.screenshot ? 'YES' : 'NO', updated?.selectedAreaScreenshot ? 'YES' : 'NO');
          return updated;
        });
        
        console.log('✅ Screenshots capturados y marker actualizado');
        
        // Generate AI inference automatically
        generateAIInference(marker);
        
      } catch (error) {
        console.error('Screenshot failed (non-critical):', error);
      }
    }, 100);
  }
  
  // Generate AI Inference of context
  async function generateAIInference(marker: StellaMarker) {
    setIsGeneratingInference(true);
    
    try {
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      const pageText = document.body.innerText.slice(0, 2000); // First 2000 chars
      
      const response = await fetch('/api/stella/generate-inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl,
          pageTitle,
          pageContext: pageText,
          selectionMode: marker.selection.mode,
          selectionArea: marker.selection.area,
        }),
      });
      
      if (!response.ok) throw new Error('Inference failed');
      
      const inference = await response.json();
      
      setCurrentMarker(prev => prev ? {
        ...prev,
        aiInference: inference,
      } : null);
      
      console.log('🤖 AI Inference generada:', inference);
      
    } catch (error) {
      console.error('AI Inference failed (non-critical):', error);
    } finally {
      setIsGeneratingInference(false);
    }
  }
  
  // Handle annotation drawing on canvas
  function handleAnnotationMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (selectedAnnotationTool === 'none' || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawingAnnotation(true);
    setAnnotationStart({ x, y });
  }
  
  function handleAnnotationMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingAnnotation || !annotationStart || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Redraw canvas with current annotation preview
    redrawCanvas(currentX, currentY);
  }
  
  function handleAnnotationMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingAnnotation || !annotationStart || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    // Create annotation
    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: selectedAnnotationTool as 'circle' | 'rectangle' | 'arrow',
      x: annotationStart.x,
      y: annotationStart.y,
      width: selectedAnnotationTool === 'rectangle' ? Math.abs(endX - annotationStart.x) : undefined,
      height: selectedAnnotationTool === 'rectangle' ? Math.abs(endY - annotationStart.y) : undefined,
      endX: selectedAnnotationTool === 'arrow' ? endX : undefined,
      endY: selectedAnnotationTool === 'arrow' ? endY : undefined,
      color: '#ef4444', // Red
    };
    
    setAnnotations(prev => [...prev, annotation]);
    setIsDrawingAnnotation(false);
    setAnnotationStart(null);
    
    // Update marker
    setCurrentMarker(prev => prev ? {
      ...prev,
      annotations: [...(prev.annotations || []), annotation],
    } : null);
  }
  
  function redrawCanvas(currentX?: number, currentY?: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing annotations
    annotations.forEach(ann => {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = 3;
      
      if (ann.type === 'circle') {
        const radius = 30;
        ctx.beginPath();
        ctx.arc(ann.x, ann.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'rectangle' && ann.width && ann.height) {
        ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
      } else if (ann.type === 'arrow' && ann.endX && ann.endY) {
        drawArrow(ctx, ann.x, ann.y, ann.endX, ann.endY);
      }
    });
    
    // Draw current annotation preview
    if (isDrawingAnnotation && annotationStart && currentX && currentY) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      if (selectedAnnotationTool === 'circle') {
        const radius = 30;
        ctx.beginPath();
        ctx.arc(annotationStart.x, annotationStart.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (selectedAnnotationTool === 'rectangle') {
        const width = currentX - annotationStart.x;
        const height = currentY - annotationStart.y;
        ctx.strokeRect(annotationStart.x, annotationStart.y, width, height);
      } else if (selectedAnnotationTool === 'arrow') {
        drawArrow(ctx, annotationStart.x, annotationStart.y, currentX, currentY);
      }
      
      ctx.setLineDash([]);
    }
  }
  
  function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
  
  // Redraw canvas when annotations change
  useEffect(() => {
    if (currentMarker?.screenshot) {
      redrawCanvas();
    }
  }, [annotations, currentMarker?.screenshot]);
  
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
          annotations: currentMarker.annotations || [],
          aiInference: currentMarker.aiInference,
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
    console.log('🔧 useEffect triggered - isActive:', isActive, 'currentMarker:', !!currentMarker);
    
    if (isActive && !currentMarker) {
      console.log('✅ Adding event listeners for selection mode:', selectedMode);
      
      // Add event listeners to capture clicks ANYWHERE on page
      document.addEventListener('mousedown', handleMouseDown as any, true);
      document.addEventListener('mousemove', handleMouseMove as any, true);
      document.addEventListener('mouseup', handleMouseUp as any, true);
      console.log('👆 Mouse event listeners added (capturing phase)');
      
      return () => {
        console.log('🧹 Cleaning up event listeners');
        document.removeEventListener('mousedown', handleMouseDown as any, true);
        document.removeEventListener('mousemove', handleMouseMove as any, true);
        document.removeEventListener('mouseup', handleMouseUp as any, true);
      };
    }
  }, [isActive, currentMarker]); // Remove selectedMode to avoid re-adding listeners
  
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
        className={`fixed top-20 right-6 z-40 p-3 rounded-lg transition-all group ${
          isActive
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50'
            : 'bg-white text-slate-700 hover:bg-violet-50 border border-slate-200 shadow-md hover:shadow-lg hover:shadow-violet-200'
        }`}
        title="Stella your personal Product Agent"
      >
        <Wand2 className={`w-5 h-5 ${isActive ? 'stella-magic-wand' : 'group-hover:stella-magic-wand-hover'}`} />
      </button>
      
      {/* Mode Selector removed from here - now integrated in top banner */}
      
      {/* Overlay when active */}
      {isActive && (
        <div data-stella-ui className="fixed inset-0 z-30 bg-violet-500/5 pointer-events-none">
          {/* Compact Mode Selector - Right side */}
          <div className="absolute top-4 right-6 bg-violet-600 text-white px-3 py-1.5 rounded-full shadow-lg pointer-events-auto">
            <div className="flex items-center gap-2">
              {/* Mode Selector - Compact */}
              {!currentMarker && (
                <>
                  <span className="text-[10px] font-semibold opacity-80">Modo:</span>
                  
                  <button
                    onClick={() => setSelectedMode('point')}
                    data-stella-ui
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedMode === 'point'
                        ? 'bg-white text-violet-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Modo Punto"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Punto</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMode('area')}
                    data-stella-ui
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedMode === 'area'
                        ? 'bg-white text-violet-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Modo Área"
                  >
                    <Square className="w-2 h-2" />
                    <span>Área</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMode('magic-brush')}
                    data-stella-ui
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedMode === 'magic-brush'
                        ? 'bg-white text-violet-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Lápiz Mágico"
                  >
                    <Paintbrush className="w-2 h-2" />
                    <span>Lápiz</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMode('clip')}
                    data-stella-ui
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedMode === 'clip'
                        ? 'bg-white text-violet-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Grabar Clip (24fps)"
                  >
                    <Video className="w-2 h-2" />
                    <span>Clip</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMode('fullscreen')}
                    data-stella-ui
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedMode === 'fullscreen'
                        ? 'bg-white text-violet-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Pantalla Completa"
                  >
                    <Camera className="w-2 h-2" />
                    <span>Pantalla</span>
                  </button>
                  
                  <div className="w-px h-4 bg-white/30 mx-1" />
                </>
              )}
              
              {/* Instructions - Compact */}
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-medium">
                  {!currentMarker && selectedMode === 'point' && 'Click donde quieras'}
                  {!currentMarker && selectedMode === 'area' && 'Arrastra área'}
                  {!currentMarker && selectedMode === 'magic-brush' && 'Dibuja libremente'}
                  {!currentMarker && selectedMode === 'clip' && !isRecordingClip && 'Click para iniciar grabación'}
                  {!currentMarker && selectedMode === 'clip' && isRecordingClip && `Grabando... ${Math.floor(recordingDuration / 1000)}s (Click para detener)`}
                  {!currentMarker && selectedMode === 'fullscreen' && 'Click para capturar'}
                  {currentMarker && 'Escribe feedback'}
                </span>
              </div>
              
              {/* Close button */}
              <button
                onClick={deactivateTool}
                data-stella-ui
                className="hover:bg-white/20 p-0.5 rounded transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* Drawing Area Rectangle */}
          {isDrawingAreaDisplay && currentArea && currentArea.width > 0 && currentArea.height > 0 && (
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
      
      {/* Magic Brush - Drawing Path (while drawing) */}
      {isDrawingBrushRef.current && brushPathDisplay.length > 0 && (
        <svg
          className="fixed inset-0 z-35 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.9 }} />
              <stop offset="50%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
            </linearGradient>
          </defs>
          
          {/* Draw the path with glow - show live preview of closed shape */}
          <path
            d={`M ${brushPathDisplay.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
            stroke="url(#magicGradient)"
            strokeWidth="6"
            fill="rgba(251, 191, 36, 0.1)"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="magic-brush-path"
          />
          
          {/* Stars along the path - animated */}
          {brushPathDisplay.filter((_, idx) => idx % 8 === 0).map((point, idx) => (
            <g key={`star-${idx}`} transform={`translate(${point.x}, ${point.y})`}>
              <polygon
                points="0,-8 2.5,-2.5 8,0 2.5,2.5 0,8 -2.5,2.5 -8,0 -2.5,-2.5"
                fill="#fbbf24"
                className="magic-brush-star"
                style={{ animationDelay: `${idx * 0.05}s` }}
              />
            </g>
          ))}
        </svg>
      )}
      
      {/* Magic Brush Marker - Completed closed shape with stars */}
      {currentMarker && currentMarker.selection.mode === 'magic-brush' && currentMarker.selection.brushPath && (
        <svg
          className="fixed inset-0 z-35 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="magicGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.6 }} />
              <stop offset="50%" style={{ stopColor: '#fbbf24', stopOpacity: 0.7 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          
          {/* Draw the closed shape with fill */}
          <path
            d={`M ${currentMarker.selection.brushPath.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
            stroke="url(#magicGradientStatic)"
            strokeWidth="3"
            fill="rgba(168, 85, 247, 0.15)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          
          {/* Subtle stars remain at key points */}
          {currentMarker.selection.brushPath.filter((_, idx) => idx % 12 === 0).map((point, idx) => (
            <g key={`star-complete-${idx}`} transform={`translate(${point.x}, ${point.y})`}>
              <polygon
                points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5"
                fill="#fbbf24"
                opacity="0.4"
              />
            </g>
          ))}
        </svg>
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
      
      {/* Magic Brush Inline Feedback Box - Translucent box near selection */}
      {currentMarker && currentMarker.state === 'active' && currentMarker.selection.mode === 'magic-brush' && currentMarker.selection.brushPath && currentMarker.selection.brushPath.length > 0 && (
        <div
          data-stella-ui
          className="fixed z-50"
          style={{
            left: `${currentMarker.selection.brushPath[Math.floor(currentMarker.selection.brushPath.length / 2)].x}px`,
            top: `${currentMarker.selection.brushPath[Math.floor(currentMarker.selection.brushPath.length / 2)].y + 60}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-violet-400 overflow-hidden">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Feedback Rápido</span>
              </div>
              <button
                onClick={deactivateTool}
                data-stella-ui
                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Annotation Tools - Inline */}
            <div className="px-3 py-2 bg-slate-50/80 border-b border-violet-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Anotar:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedAnnotationTool('circle')}
                  data-stella-ui
                  className={`p-1.5 rounded transition-all ${
                    selectedAnnotationTool === 'circle'
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Circular"
                >
                  <Circle className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSelectedAnnotationTool('rectangle')}
                  data-stella-ui
                  className={`p-1.5 rounded transition-all ${
                    selectedAnnotationTool === 'rectangle'
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Recuadrar"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSelectedAnnotationTool('arrow')}
                  data-stella-ui
                  className={`p-1.5 rounded transition-all ${
                    selectedAnnotationTool === 'arrow'
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Flecha"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setAnnotations([]);
                    setSelectedAnnotationTool('none');
                    setCurrentMarker(prev => prev ? { ...prev, annotations: [] } : null);
                  }}
                  data-stella-ui
                  className="p-1.5 rounded bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
                  title="Limpiar"
                >
                  <Eraser className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Categorías de Feedback */}
            <div className="px-3 pt-3 pb-2">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Tipo de Feedback:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedbackCategory('bug')}
                  data-stella-ui
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    feedbackCategory === 'bug'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bug className="w-3 h-3" />
                  <span>Reportar Bug</span>
                </button>
                <button
                  onClick={() => setFeedbackCategory('feature')}
                  data-stella-ui
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    feedbackCategory === 'feature'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>Solicitar Feature</span>
                </button>
                <button
                  onClick={() => setFeedbackCategory('improvement')}
                  data-stella-ui
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    feedbackCategory === 'improvement'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Sugerir Mejora</span>
                </button>
              </div>
            </div>
            
            {/* Compact Feedback Input */}
            <div className="px-3 pb-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe tu sugerencia aquí..."
                rows={3}
                maxLength={500}
                data-stella-ui
                className="w-full px-3 py-2 border-2 border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm bg-white/90"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">{feedbackText.length}/500</span>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackText.trim() || isSubmitting}
                  data-stella-ui
                  className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Standard Feedback Box - For other modes (point, area, fullscreen) */}
      {currentMarker && currentMarker.state === 'active' && currentMarker.selection.mode !== 'magic-brush' && (
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
            
            {/* Screenshot Preview with Annotation Tools */}
            <div className="p-4 border-b border-violet-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-violet-900 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  Vista Previa
                </p>
                <div className="flex items-center gap-1">
                  {/* Annotation Tools */}
                  <button
                    onClick={() => setSelectedAnnotationTool('circle')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'circle'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Circular elemento"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnotationTool('rectangle')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'rectangle'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Recuadrar elemento"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnotationTool('arrow')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'arrow'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Señalar con flecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setAnnotations([]);
                      setSelectedAnnotationTool('none');
                      setCurrentMarker(prev => prev ? { ...prev, annotations: [] } : null);
                    }}
                    data-stella-ui
                    className="p-1.5 rounded bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Borrar anotaciones"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Screenshot with Annotation Canvas */}
              <div className="relative rounded-lg overflow-hidden border-2 border-violet-300 bg-white">
                {currentMarker.selectedAreaScreenshot ? (
                  <>
                    <img 
                      src={currentMarker.selectedAreaScreenshot} 
                      alt="Captura" 
                      className="w-full"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (canvasRef.current) {
                          canvasRef.current.width = img.width;
                          canvasRef.current.height = img.height;
                        }
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 cursor-crosshair"
                      onMouseDown={handleAnnotationMouseDown}
                      onMouseMove={handleAnnotationMouseMove}
                      onMouseUp={handleAnnotationMouseUp}
                      style={{ 
                        pointerEvents: selectedAnnotationTool !== 'none' ? 'auto' : 'none',
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              
              {selectedAnnotationTool !== 'none' && (
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                  <span className="text-red-500">●</span>
                  {selectedAnnotationTool === 'circle' && 'Click para circular elemento'}
                  {selectedAnnotationTool === 'rectangle' && 'Arrastra para recuadrar elemento'}
                  {selectedAnnotationTool === 'arrow' && 'Arrastra para crear flecha'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Standard Feedback Box is hidden for magic-brush mode - using inline box instead */}
      {currentMarker && currentMarker.state === 'active' && currentMarker.selection.mode !== 'magic-brush' && (
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
            
            {/* Screenshot Preview with Annotation Tools */}
            <div className="p-4 border-b border-violet-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-violet-900 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  Vista Previa
                </p>
                <div className="flex items-center gap-1">
                  {/* Annotation Tools */}
                  <button
                    onClick={() => setSelectedAnnotationTool('circle')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'circle'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Circular elemento"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnotationTool('rectangle')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'rectangle'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Recuadrar elemento"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnotationTool('arrow')}
                    data-stella-ui
                    className={`p-1.5 rounded transition-colors ${
                      selectedAnnotationTool === 'arrow'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title="Señalar con flecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setAnnotations([]);
                      setSelectedAnnotationTool('none');
                      setCurrentMarker(prev => prev ? { ...prev, annotations: [] } : null);
                    }}
                    data-stella-ui
                    className="p-1.5 rounded bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Borrar anotaciones"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Screenshot with Annotation Canvas */}
              <div className="relative rounded-lg overflow-hidden border-2 border-violet-300 bg-white">
                {currentMarker.selectedAreaScreenshot ? (
                  <>
                    <img 
                      src={currentMarker.selectedAreaScreenshot} 
                      alt="Captura seleccionada" 
                      className="w-full"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                      onLoad={(e) => {
                        // Initialize canvas with same dimensions
                        const img = e.target as HTMLImageElement;
                        if (canvasRef.current) {
                          canvasRef.current.width = img.width;
                          canvasRef.current.height = img.height;
                        }
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 cursor-crosshair"
                      onMouseDown={handleAnnotationMouseDown}
                      onMouseMove={handleAnnotationMouseMove}
                      onMouseUp={handleAnnotationMouseUp}
                      style={{ 
                        pointerEvents: selectedAnnotationTool !== 'none' ? 'auto' : 'none',
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              
              {selectedAnnotationTool !== 'none' && (
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                  <span className="text-red-500">●</span>
                  {selectedAnnotationTool === 'circle' && 'Click para circular elemento'}
                  {selectedAnnotationTool === 'rectangle' && 'Arrastra para recuadrar elemento'}
                  {selectedAnnotationTool === 'arrow' && 'Arrastra para crear flecha'}
                </p>
              )}
            </div>
            
            {/* AI Inference Section */}
            {isGeneratingInference && (
              <div className="px-4 py-3 border-b border-violet-200 bg-blue-50">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-medium">Stella está analizando el contexto...</span>
                </div>
              </div>
            )}
            
            {currentMarker.aiInference && !isGeneratingInference && (
              <div className="px-4 py-3 border-b border-violet-200 bg-gradient-to-r from-blue-50 to-violet-50">
                <p className="text-xs font-bold text-violet-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Análisis AI de Contexto
                </p>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Página:</span>
                    <span className="ml-2 text-slate-600">{currentMarker.aiInference.pageContext}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Problema Identificado:</span>
                    <span className="ml-2 text-slate-600">{currentMarker.aiInference.identifiedIssue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Prioridad Sugerida:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentMarker.aiInference.suggestedPriority === 'critical' ? 'bg-red-100 text-red-700' :
                      currentMarker.aiInference.suggestedPriority === 'high' ? 'bg-orange-100 text-orange-700' :
                      currentMarker.aiInference.suggestedPriority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {currentMarker.aiInference.suggestedPriority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Categoría:</span>
                    <span className="ml-2 text-slate-600">{currentMarker.aiInference.suggestedCategory}</span>
                  </div>
                </div>
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
                rows={4}
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

