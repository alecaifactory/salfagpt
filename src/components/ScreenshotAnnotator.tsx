import { useState, useRef, useEffect } from 'react';
import { Circle, Square, ArrowRight, Type, Eraser, Check, X as XIcon, Camera } from 'lucide-react';
import type { ScreenshotAnnotation, AnnotatedScreenshot } from '../types/feedback';

interface ScreenshotAnnotatorProps {
  onComplete: (screenshot: AnnotatedScreenshot) => void;
  onCancel: () => void;
}

type DrawingTool = 'circle' | 'rectangle' | 'arrow' | 'text' | 'eraser';

export default function ScreenshotAnnotator({ onComplete, onCancel }: ScreenshotAnnotatorProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<ScreenshotAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool>('circle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<ScreenshotAnnotation> | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#9333ea'); // Purple default

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Capture screenshot on mount
  useEffect(() => {
    captureScreen();
  }, []);

  const captureScreen = async () => {
    try {
      // Capture current viewport
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      setDimensions({ width, height });

      // Use html2canvas library or native screenshot API
      // For now, we'll use a simple approach
      const dataUrl = await captureViewport();
      setScreenshot(dataUrl);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Error al capturar pantalla');
      onCancel();
    }
  };

  const captureViewport = async (): Promise<string> => {
    // This is a placeholder - in production you'd use html2canvas or similar
    // For MVP, we'll create a white canvas placeholder
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Captura de Pantalla', canvas.width / 2, canvas.height / 2);
    }
    return canvas.toDataURL('image/png');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      setShowTextInput(true);
      setTextPosition({ x, y });
      setCurrentAnnotation({ type: 'text', x, y, color });
      return;
    }

    setIsDrawing(true);
    setCurrentAnnotation({
      type: activeTool,
      x,
      y,
      color,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(currentX - currentAnnotation.x!, 2) + 
        Math.pow(currentY - currentAnnotation.y!, 2)
      );
      setCurrentAnnotation({ ...currentAnnotation, radius });
    } else if (activeTool === 'rectangle') {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: currentX - currentAnnotation.x!,
        height: currentY - currentAnnotation.y!,
      });
    } else if (activeTool === 'arrow') {
      setCurrentAnnotation({
        ...currentAnnotation,
        endX: currentX,
        endY: currentY,
      });
    }

    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation) {
      // Save annotation
      setAnnotations([...annotations, currentAnnotation as ScreenshotAnnotation]);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  const handleTextSubmit = () => {
    if (currentAnnotation && textInput.trim()) {
      setAnnotations([
        ...annotations,
        { ...currentAnnotation, text: textInput } as ScreenshotAnnotation,
      ]);
      setTextInput('');
      setShowTextInput(false);
      setCurrentAnnotation(null);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !screenshot) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw screenshot
    const img = new Image();
    img.src = screenshot;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw all annotations
      [...annotations, currentAnnotation].forEach((ann) => {
        if (!ann) return;
        drawAnnotation(ctx, ann);
      });
    };
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Partial<ScreenshotAnnotation>) => {
    ctx.strokeStyle = ann.color || '#9333ea';
    ctx.fillStyle = ann.color || '#9333ea';
    ctx.lineWidth = 3;

    if (ann.type === 'circle' && ann.radius) {
      ctx.beginPath();
      ctx.arc(ann.x!, ann.y!, ann.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (ann.type === 'rectangle' && ann.width && ann.height) {
      ctx.strokeRect(ann.x!, ann.y!, ann.width, ann.height);
    } else if (ann.type === 'arrow' && ann.endX && ann.endY) {
      // Draw arrow line
      ctx.beginPath();
      ctx.moveTo(ann.x!, ann.y!);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(ann.endY - ann.y!, ann.endX - ann.x!);
      const headLength = 15;
      ctx.beginPath();
      ctx.moveTo(ann.endX, ann.endY);
      ctx.lineTo(
        ann.endX - headLength * Math.cos(angle - Math.PI / 6),
        ann.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(ann.endX, ann.endY);
      ctx.lineTo(
        ann.endX - headLength * Math.cos(angle + Math.PI / 6),
        ann.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    } else if (ann.type === 'text' && ann.text) {
      ctx.font = '16px sans-serif';
      ctx.fillStyle = ann.color || '#9333ea';
      
      // Draw text background
      const metrics = ctx.measureText(ann.text);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(ann.x! - 4, ann.y! - 20, metrics.width + 8, 28);
      
      // Draw text
      ctx.fillStyle = ann.color || '#9333ea';
      ctx.fillText(ann.text, ann.x!, ann.y!);
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [annotations, currentAnnotation, screenshot]);

  const handleComplete = () => {
    if (!screenshot) return;

    const annotatedScreenshot: AnnotatedScreenshot = {
      id: `screenshot-${Date.now()}`,
      imageDataUrl: canvasRef.current?.toDataURL('image/png') || screenshot,
      annotations,
      createdAt: new Date(),
      width: dimensions.width,
      height: dimensions.height,
    };

    onComplete(annotatedScreenshot);
  };

  const clearAll = () => {
    setAnnotations([]);
    redrawCanvas();
  };

  const undoLast = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  if (!screenshot) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-violet-700 font-medium">Capturando pantalla...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-800 mr-4">Anotar Captura</h3>
          
          {/* Drawing Tools */}
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'circle'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Círculo"
          >
            <Circle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'rectangle'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Rectángulo"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTool('arrow')}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'arrow'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Flecha"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTool('text')}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === 'text'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Texto"
          >
            <Type className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-slate-300 mx-2" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Color:</span>
            {['#9333ea', '#eab308', '#ef4444', '#3b82f6', '#10b981'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-slate-300 mx-2" />

          {/* Undo/Clear */}
          <button
            onClick={undoLast}
            disabled={annotations.length === 0}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Deshacer
          </button>

          <button
            onClick={clearAll}
            disabled={annotations.length === 0}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Limpiar Todo
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            {annotations.length} anotación{annotations.length !== 1 ? 'es' : ''}
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="border-2 border-violet-400 rounded-lg shadow-2xl cursor-crosshair"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />

          {/* Text Input Overlay */}
          {showTextInput && (
            <div
              className="absolute bg-white rounded-lg shadow-lg p-3 border-2 border-violet-400"
              style={{
                left: textPosition.x,
                top: textPosition.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSubmit();
                  if (e.key === 'Escape') {
                    setShowTextInput(false);
                    setTextInput('');
                    setCurrentAnnotation(null);
                  }
                }}
                placeholder="Escribe texto..."
                autoFocus
                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm w-64"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleTextSubmit}
                  className="flex-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                    setCurrentAnnotation(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-white border-t border-slate-200 p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4" />
              <span>Círculo: Click y arrastra</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span>Rectángulo: Click y arrastra</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              <span>Flecha: Inicio → Fin</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span>Texto: Click para posicionar</span>
            </div>
          </div>
          <div className="text-violet-600 font-medium">
            Selecciona herramienta y dibuja sobre la imagen
          </div>
        </div>
      </div>
    </div>
  );
}

