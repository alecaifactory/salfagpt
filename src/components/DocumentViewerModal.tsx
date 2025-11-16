/**
 * DocumentViewerModal - Enhanced PDF viewer with collaboration tools
 * 
 * Features:
 * - 80% screen size with split view (PDF left, tools right)
 * - PDF rendering with annotations
 * - Text selection for questions
 * - Drawing tools for markup
 * - Revision requests with email integration
 * - Progress indicators for file loading
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, FileText, MessageCircle, Edit3, Mail, Highlighter, 
  Loader2, Download, ZoomIn, ZoomOut, Check, Send,
  Users, Link2, CheckCircle
} from 'lucide-react';
import type { DocumentAnnotation, CollaborationInvitation } from '../types/collaboration';
import type { ContextSource } from '../types/context';

interface DocumentViewerModalProps {
  source: ContextSource;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
}

type AnnotationTool = 'none' | 'question' | 'highlight' | 'draw' | 'revision';

export default function DocumentViewerModal({
  source,
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
}: DocumentViewerModalProps) {
  // Document loading state
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Annotation state
  const [activeTool, setActiveTool] = useState<AnnotationTool>('none');
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  
  // Collaboration state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationDraft, setInvitationDraft] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
  });
  const [gmailConnected, setGmailConnected] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  
  // Question modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  
  // PDF viewer state
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 🆕 Bug report state (for missing files)
  const [showBugReportDialog, setShowBugReportDialog] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [submittingBugReport, setSubmittingBugReport] = useState(false);
  const [bugReportData, setBugReportData] = useState<any>(null);
  
  // Load document on mount
  useEffect(() => {
    if (isOpen && source) {
      loadDocument();
      loadAnnotations();
      checkGmailConnection();
    }
  }, [isOpen, source]);
  
  // 🆕 Listen for messages from iframe (bug report trigger)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'reportMissingFile') {
        console.log('📨 Received bug report request from iframe:', event.data);
        setBugReportData(event.data);
        setShowBugReportDialog(true);
      } else if (event.data.action === 'close') {
        // User clicked "Entendido" - just dismiss notice, keep viewing text
        console.log('👍 User acknowledged missing file notice');
      }
    };
    
    if (isOpen) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isOpen]);
  
  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showQuestionModal && !showInviteModal) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, showQuestionModal, showInviteModal, onClose]);
  
  const loadDocument = async () => {
    setIsLoading(true);
    setLoadProgress(0);
    setLoadError(null);
    
    try {
      console.log('📄 Loading document:', source.name);
      
      // Simulate progress (visual feedback)
      const progressInterval = setInterval(() => {
        setLoadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Fetch file from API
      const response = await fetch(`/api/context-sources/${source.id}/file`);
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setLoadProgress(100);
      setDocumentUrl(url);
      setIsLoading(false);
      
      console.log('✅ Document loaded successfully:', {
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        type: contentType
      });
      
    } catch (error) {
      console.error('❌ Error loading document:', error);
      setLoadError(error instanceof Error ? error.message : 'Error desconocido');
      setIsLoading(false);
    }
  };
  
  const loadAnnotations = async () => {
    try {
      const response = await fetch(`/api/annotations?sourceId=${source.id}&userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };
  
  const checkGmailConnection = async () => {
    try {
      const response = await fetch(`/api/gmail/status?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setGmailConnected(data.connected || false);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };
  
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      
      // Get character positions (simplified - would need actual PDF positions)
      const range = selection?.getRangeAt(0);
      if (range) {
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset,
        });
      }
      
      console.log('✏️ Text selected:', {
        length: text.length,
        preview: text.substring(0, 50) + '...'
      });
    }
  };
  
  const handleAskQuestion = () => {
    if (!selectedText) {
      alert('Por favor selecciona texto primero');
      return;
    }
    
    setActiveTool('question');
    setShowQuestionModal(true);
    setQuestionText('');
  };
  
  const submitQuestion = async () => {
    if (!questionText.trim() || !selectedText) return;
    
    setIsSubmittingQuestion(true);
    
    try {
      const annotation: Omit<DocumentAnnotation, 'id'> = {
        sourceId: source.id,
        userId,
        userEmail,
        userName,
        selectionText: selectedText,
        startChar: selectionRange?.start || 0,
        endChar: selectionRange?.end || 0,
        annotationType: 'question',
        content: questionText,
        position: { x: 50, y: 50 }, // Simplified positioning
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: [],
      };
      
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotation, userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnotations(prev => [...prev, data.annotation]);
        setShowQuestionModal(false);
        setSelectedText('');
        setQuestionText('');
        
        alert('✅ Pregunta anotada correctamente');
      } else {
        throw new Error('Failed to save annotation');
      }
      
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Error al guardar la anotación');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };
  
  const handleRequestRevision = () => {
    if (!selectedText) {
      alert('Por favor selecciona texto primero');
      return;
    }
    
    setActiveTool('revision');
    setShowInviteModal(true);
  };
  
  const sendInvitation = async () => {
    const { recipientName, recipientEmail, message } = invitationDraft;
    
    if (!recipientEmail || !message) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    setIsSendingInvite(true);
    
    try {
      const invitation: Omit<CollaborationInvitation, 'id'> = {
        sourceId: source.id,
        sourceName: source.name,
        senderId: userId,
        senderEmail: userEmail,
        senderName: userName,
        recipientEmail,
        recipientName,
        message,
        accessLevel: 'comment', // Default to comment access
        status: 'pending',
        emailSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          invitation, 
          userId,
          selectedText: selectedText || undefined,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setShowInviteModal(false);
        setInvitationDraft({ recipientName: '', recipientEmail: '', message: '' });
        
        if (gmailConnected) {
          alert('✅ Invitación enviada desde tu cuenta de Gmail');
        } else {
          alert(`✅ Invitación creada. Enlace: ${data.invitationLink}\n\nCopia este enlace para compartir.`);
        }
      } else {
        throw new Error('Failed to send invitation');
      }
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error al enviar la invitación');
    } finally {
      setIsSendingInvite(false);
    }
  };
  
  const connectGmail = () => {
    // Redirect to Gmail OAuth flow
    window.location.href = `/api/gmail/connect?userId=${userId}&returnTo=${encodeURIComponent(window.location.pathname)}`;
  };
  
  const downloadDocument = async () => {
    if (!documentUrl) return;
    
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = source.name;
    link.click();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Main container - 80% of screen */}
      <div className="bg-white rounded-xl shadow-2xl flex flex-col" style={{ width: '80vw', height: '80vh' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-800 truncate">{source.name}</h2>
              <p className="text-xs text-slate-500">
                {source.metadata?.pageCount ? `${source.metadata.pageCount} páginas` : ''} 
                {source.metadata?.originalFileSize ? ` • ${(source.metadata.originalFileSize / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={downloadDocument}
              disabled={!documentUrl}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Descargar documento"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Loading Progress */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="w-full max-w-md space-y-2">
              <p className="text-sm font-medium text-slate-700 text-center">
                Cargando documento...
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {loadProgress}% completado
              </p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {loadError && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Error al cargar documento</h3>
              <p className="text-sm text-slate-600 max-w-md">{loadError}</p>
              <button
                onClick={loadDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
        
        {/* Main Content - Split View */}
        {!isLoading && !loadError && documentUrl && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left: PDF Viewer (60%) */}
            <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50 relative">
              {/* PDF Controls */}
              <div className="flex items-center justify-between p-2 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="Alejar"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-700 px-2 min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="Acercar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-slate-500">
                  {annotations.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {annotations.length} anotacion{annotations.length !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </div>
              
              {/* PDF Display */}
              <div className="flex-1 overflow-auto p-4" onMouseUp={handleTextSelection}>
                <iframe
                  ref={iframeRef}
                  src={documentUrl}
                  className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  title={source.name}
                />
                
                {/* Annotation Markers Overlay */}
                {annotations.map(annotation => (
                  <div
                    key={annotation.id}
                    className="absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-600 cursor-pointer hover:scale-125 transition-transform"
                    style={{
                      left: `${annotation.position.x}%`,
                      top: `${annotation.position.y}%`,
                    }}
                    title={annotation.content}
                  />
                ))}
              </div>
            </div>
            
            {/* Right: Tools Panel (40%) */}
            <div className="w-2/5 flex flex-col bg-white">
              
              {/* Tool Selection */}
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Herramientas de Colaboración</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAskQuestion}
                    disabled={!selectedText}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeTool === 'question'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Preguntar</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool(prev => prev === 'highlight' ? 'none' : 'highlight')}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeTool === 'highlight'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-slate-200 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <Highlighter className="w-4 h-4" />
                    <span className="text-sm font-medium">Resaltar</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool(prev => prev === 'draw' ? 'none' : 'draw')}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeTool === 'draw'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm font-medium">Dibujar</span>
                  </button>
                  
                  <button
                    onClick={handleRequestRevision}
                    disabled={!selectedText}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      activeTool === 'revision'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Solicitar Revisión</span>
                  </button>
                </div>
                
                {selectedText && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Texto seleccionado:</p>
                    <p className="text-xs text-slate-700 line-clamp-3">
                      "{selectedText}"
                    </p>
                  </div>
                )}
              </div>
              
              {/* Annotations List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Anotaciones ({annotations.length})
                </h4>
                
                {annotations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay anotaciones aún</p>
                    <p className="text-xs mt-1">Selecciona texto y usa las herramientas</p>
                  </div>
                ) : (
                  annotations.map(annotation => (
                    <div
                      key={annotation.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          annotation.annotationType === 'question' ? 'bg-blue-100' :
                          annotation.annotationType === 'highlight' ? 'bg-yellow-100' :
                          annotation.annotationType === 'revision-request' ? 'bg-orange-100' :
                          'bg-slate-100'
                        }`}>
                          {annotation.annotationType === 'question' && <MessageCircle className="w-3 h-3 text-blue-600" />}
                          {annotation.annotationType === 'highlight' && <Highlighter className="w-3 h-3 text-yellow-600" />}
                          {annotation.annotationType === 'revision-request' && <Mail className="w-3 h-3 text-orange-600" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 line-clamp-2 mb-1">
                            "{annotation.selectionText}"
                          </p>
                          <p className="text-xs text-slate-600 mb-1">
                            {annotation.content}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {annotation.userName} • {new Date(annotation.createdAt).toLocaleString('es', { 
                              day: '2-digit', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        
                        {annotation.status === 'resolved' && (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      {annotation.responses && annotation.responses.length > 0 && (
                        <div className="ml-8 mt-2 space-y-2">
                          {annotation.responses.map(response => (
                            <div key={response.id} className="p-2 bg-white border border-slate-200 rounded text-xs">
                              <p className="text-slate-700 mb-1">{response.content}</p>
                              <p className="text-[10px] text-slate-400">
                                {response.userName} • {new Date(response.createdAt).toLocaleString('es', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Gmail Connection Status */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                {gmailConnected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Gmail conectado</span>
                  </div>
                ) : (
                  <button
                    onClick={connectGmail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Conectar Gmail para enviar invitaciones</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        
        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Hacer una pregunta</h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Texto seleccionado:
                  </label>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-slate-800">
                    "{selectedText}"
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu pregunta:
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="¿Qué quieres preguntar sobre este texto?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitQuestion}
                    disabled={!questionText.trim() || isSubmittingQuestion}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingQuestion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Guardar Pregunta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invitation Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Solicitar Revisión</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedText && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Texto para revisión:
                    </label>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-slate-800 max-h-24 overflow-y-auto">
                      "{selectedText}"
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre del colaborador:
                    </label>
                    <input
                      type="text"
                      value={invitationDraft.recipientName}
                      onChange={(e) => setInvitationDraft(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Juan Pérez"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email del colaborador: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={invitationDraft.recipientEmail}
                      onChange={(e) => setInvitationDraft(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="juan@empresa.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mensaje personalizado: <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={invitationDraft.message}
                    onChange={(e) => setInvitationDraft(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={`Hola ${invitationDraft.recipientName || '[Nombre]'},\n\nNecesito tu ayuda revisando este documento. ¿Podrías darme tu opinión sobre el texto seleccionado?\n\nGracias,\n${userName}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                </div>
                
                {!gmailConnected && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Conecta tu Gmail para enviar invitaciones</p>
                        <p className="text-blue-600">
                          La invitación se creará y recibirás un enlace para compartir manualmente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendInvitation}
                    disabled={!invitationDraft.recipientEmail || !invitationDraft.message || isSendingInvite}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingInvite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {gmailConnected ? 'Enviar con Gmail' : 'Crear Invitación'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

