/**
 * Missing File Bug Report Modal
 * 
 * Allows users to report missing original files directly to the backlog
 * with automatic screenshot capture and diagnostic information
 */

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Bug, FileQuestion, Camera, AlertTriangle } from 'lucide-react';

interface MissingFileBugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  sourceName: string;
  agentName?: string;
  userId: string;
  userEmail: string;
  userName: string;
  diagnostic?: {
    hasExtractedData?: boolean;
    hasStoragePath?: boolean;
    extractedDataSize?: number;
    sourceUserId?: string;
    storagePath?: string;
  };
}

export default function MissingFileBugReportModal({
  isOpen,
  onClose,
  sourceId,
  sourceName,
  agentName,
  userId,
  userEmail,
  userName,
  diagnostic,
}: MissingFileBugReportModalProps) {
  
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  
  // Auto-capture screenshot when modal opens
  useEffect(() => {
    if (isOpen) {
      captureScreenshot();
    }
  }, [isOpen]);
  
  const captureScreenshot = async () => {
    try {
      // Try to capture the document viewer iframe
      const iframe = document.querySelector('iframe[src*="/api/context-sources"]');
      
      if (iframe) {
        console.log('📸 Capturing screenshot of document viewer...');
        
        // Use html2canvas if available, otherwise skip
        if (typeof (window as any).html2canvas === 'function') {
          const canvas = await (window as any).html2canvas(iframe);
          const dataUrl = canvas.toDataURL('image/png');
          setScreenshot(dataUrl);
          console.log('✅ Screenshot captured');
        } else {
          console.warn('⚠️ html2canvas not available, skipping screenshot');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not capture screenshot:', error);
      // Continue without screenshot - not critical
    }
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Create feedback ticket with all diagnostic info
      const ticketData = {
        title: `Archivo faltante: ${sourceName}`,
        description: description || 'Archivo PDF original no disponible en el visor de documentos.',
        category: 'missing_document',
        priority: 'medium',
        status: 'open',
        
        // Context
        sourceId,
        sourceName,
        agentName: agentName || 'N/A',
        
        // Storage diagnostic info
        storagePath: diagnostic?.storagePath || 'N/A',
        hasStoragePath: diagnostic?.hasStoragePath || false,
        
        // Data diagnostic
        hasExtractedData: diagnostic?.hasExtractedData || false,
        extractedDataSize: diagnostic?.extractedDataSize || 0,
        
        // User ID diagnostic (helps identify format issues)
        sourceUserId: diagnostic?.sourceUserId || 'N/A',
        currentUserId: userId,
        
        // User info
        reportedBy: userId,
        reportedByEmail: userEmail,
        reportedByName: userName,
        
        // Screenshot (if captured)
        screenshot: screenshot || null,
        
        // Timestamp
        timestamp: new Date().toISOString(),
      };
      
      console.log('📤 Submitting bug report:', ticketData);
      
      const response = await fetch('/api/stella/missing-file-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ticketData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bug report submitted:', data.ticketId);
        
        alert('✅ Reporte enviado al Backlog exitosamente.\n\nEl equipo revisará el problema y te notificará cuando esté resuelto.');
        
        // Reset and close
        setDescription('');
        setScreenshot(null);
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }
      
    } catch (error) {
      console.error('❌ Error submitting bug report:', error);
      alert('❌ Error enviando reporte. Por favor intenta de nuevo o contacta al administrador.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Reportar Archivo Faltante
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Se enviará al Backlog para revisión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Screenshot Preview */}
          {screenshot && (
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                Captura automática:
              </p>
              <img
                src={screenshot}
                alt="Screenshot del problema"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg"
              />
            </div>
          )}
          
          {/* Pre-filled Information */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <FileQuestion className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Documento:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {sourceName}
                </div>
              </div>
            </div>
            
            {agentName && (
              <div className="flex items-start gap-2">
                <div className="w-4 h-4"></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Agente:
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {agentName}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Problema:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Archivo PDF original no disponible en Cloud Storage
                </div>
              </div>
            </div>
            
            {/* Diagnostic info (collapsed) */}
            <details className="text-xs">
              <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600">
                Información diagnóstica (para el equipo técnico)
              </summary>
              <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] space-y-1">
                <div>Storage Path: {diagnostic?.storagePath || 'N/A'}</div>
                <div>Source ID: {sourceId}</div>
                <div>Source userId: {diagnostic?.sourceUserId || 'N/A'}</div>
                <div>Texto extraído: {diagnostic?.extractedDataSize || 0} caracteres</div>
                <div>storagePath existe: {diagnostic?.hasStoragePath ? 'Sí' : 'No'}</div>
              </div>
            </details>
          </div>
          
          {/* User Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Descripción adicional (opcional):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Cuándo subiste este documento? ¿Qué esperabas ver? ¿Es urgente recuperarlo?"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Opcional: Agrega cualquier información que ayude al equipo a resolver el problema.
            </p>
          </div>
          
          {/* Info box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>📋 Qué pasará:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-4">
              <li>• Se creará un ticket en el Backlog con toda la información</li>
              <li>• El equipo técnico revisará el problema</li>
              <li>• Recibirás notificación cuando esté resuelto</li>
              <li>• Mientras tanto, puedes usar el texto extraído disponible</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar a Backlog
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

