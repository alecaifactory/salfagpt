/**
 * Upload Progress Detail View
 * 
 * Shows real-time streaming progress for a selected upload
 * - Live log streaming
 * - Stage-by-stage breakdown
 * - Retry failed stages
 * - Complete visibility
 */

import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Grid, 
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface UploadProgressDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  uploadItem: {
    id: string;
    file: File;
    status: 'queued' | 'uploading' | 'processing' | 'complete' | 'failed';
    progress: number;
    error?: string;
    sourceId?: string;
    model?: string;
    startTime?: number;
    elapsedTime?: number;
    embeddingDetails?: {
      stage: string;
      chunksToEmbed?: number;
      currentChunk?: number;
      totalChunks?: number;
      totalTokens?: number;
      estimatedTimeSeconds?: number;
      message?: string;
    };
  };
  pipelineLogs?: Array<{
    step: string;
    status: string;
    message: string;
    timestamp: Date;
    details?: any;
  }>;
  onRetryStage?: (stage: string) => void;
}

export default function UploadProgressDetailView({
  isOpen,
  onClose,
  uploadItem,
  pipelineLogs = [],
  onRetryStage
}: UploadProgressDetailViewProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [pipelineLogs.length, uploadItem.progress]);
  
  if (!isOpen) return null;
  
  const stages = [
    { key: 'upload', label: 'Upload', icon: Upload, range: [0, 25] },
    { key: 'extract', label: 'Extract', icon: FileText, range: [25, 50] },
    { key: 'chunk', label: 'Chunk', icon: Grid, range: [50, 75] },
    { key: 'embed', label: 'Embed', icon: Zap, range: [75, 100] },
  ];
  
  const getCurrentStage = () => {
    for (const stage of stages) {
      if (uploadItem.progress >= stage.range[0] && uploadItem.progress < stage.range[1]) {
        return stage;
      }
    }
    return stages[stages.length - 1];
  };
  
  const currentStage = getCurrentStage();
  
  const formatTime = (ms?: number) => {
    if (!ms) return '0s';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Volver a la lista"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Procesamiento en Vivo</h3>
              <p className="text-xs text-gray-600">Pipeline automático en ejecución</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact File Info with Overall Progress */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h2 className="text-sm font-bold text-gray-900 truncate">
              {uploadItem.file.name}
            </h2>
          </div>
          <span className="text-lg font-bold text-blue-600 ml-2 flex-shrink-0">
            {uploadItem.progress.toFixed(1)}%
          </span>
        </div>
        
        {/* Compact metadata in single line */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          <span>{(uploadItem.file.size / (1024 * 1024)).toFixed(1)} MB</span>
          {uploadItem.model && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              uploadItem.model === 'gemini-2.5-pro'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {uploadItem.model === 'gemini-2.5-pro' ? '✨ Pro' : '⚡ Flash'}
            </span>
          )}
          {uploadItem.elapsedTime && (
            <span className="font-mono text-blue-600">
              {formatTime(uploadItem.elapsedTime)}
            </span>
          )}
          {/* Current Stage Inline */}
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            {React.createElement(currentStage.icon, { className: "w-3.5 h-3.5 text-blue-600" })}
            <span className="font-semibold text-blue-700">{currentStage.label}</span>
            {uploadItem.status === 'processing' && (
              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            )}
          </div>
        </div>
        
        {/* Compact Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              uploadItem.status === 'failed' ? 'bg-red-600' :
              uploadItem.status === 'complete' ? 'bg-green-600' :
              'bg-blue-600'
            }`}
            style={{ width: `${uploadItem.progress}%` }}
          />
        </div>
      </div>
        
        {/* Compact Stage Breakdown - Horizontal */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            {stages.map((stage, idx) => {
              const stageLog = pipelineLogs.find(log => log.step === stage.key);
              const isComplete = uploadItem.progress > stage.range[1];
              const isCurrent = uploadItem.progress >= stage.range[0] && uploadItem.progress < stage.range[1];
              const isPending = uploadItem.progress < stage.range[0];
              const StageIcon = stage.icon;
              
              return (
                <div key={stage.key} className="flex-1">
                  <div className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                    isComplete ? 'bg-green-50' :
                    isCurrent ? 'bg-blue-50' :
                    'bg-gray-50'
                  }`}>
                    {/* Icon */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-blue-600 text-white' :
                      'bg-gray-300 text-gray-500'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : stageLog?.status === 'error' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <StageIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className={`text-[10px] font-semibold ${
                      isComplete ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                  
                  {/* Embedding Details (compact inline for Embed stage only) */}
                  {isCurrent && stage.key === 'embed' && uploadItem.embeddingDetails?.currentChunk && (
                    <div className="mt-1 text-center">
                      <span className="text-[9px] font-mono text-blue-600">
                        {uploadItem.embeddingDetails.currentChunk}/{uploadItem.embeddingDetails.totalChunks}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Live Log Stream - Expanded to take most of the space */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="text-xs font-bold text-gray-900">Live Processing Log</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-green-600 font-medium">Streaming</span>
            </div>
          </div>
          
          <div 
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-3 bg-gray-950 font-mono text-xs space-y-0.5"
          >
            {pipelineLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-sans">Waiting for processing to start...</p>
                <p className="text-xs text-gray-600 mt-1 font-sans">Logs will stream here in real-time</p>
              </div>
            ) : (
              <>
                {pipelineLogs.map((log, idx) => {
                  // Determine colors based on status
                  const getStatusColor = () => {
                    switch (log.status) {
                      case 'success': return 'text-green-400';
                      case 'error': return 'text-red-400';
                      case 'in_progress': return 'text-cyan-400';
                      case 'warning': return 'text-yellow-400';
                      default: return 'text-gray-400';
                    }
                  };
                  
                  const getIconForStatus = () => {
                    switch (log.status) {
                      case 'success': return '✅';
                      case 'error': return '❌';
                      case 'in_progress': return '🔄';
                      case 'warning': return '⚠️';
                      default: return '📋';
                    }
                  };
                  
                  const getCategoryIcon = () => {
                    const icons = {
                      upload: '📤',
                      extract: '📄',
                      chunk: '🔪',
                      embed: '🧮',
                      'vision-api': '👁️',
                      gemini: '🤖',
                      rag: '🔍',
                    };
                    return icons[log.step as keyof typeof icons] || '📋';
                  };
                  
                  return (
                    <div key={idx} className="group">
                      {/* Main log line */}
                      <div 
                        className={`flex items-start gap-2 px-2 py-1 rounded hover:bg-gray-900/50 ${getStatusColor()}`}
                >
                        {/* Timestamp */}
                        <span className="text-gray-600 text-[9px] flex-shrink-0 font-normal w-16">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                            hour12: false, 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </span>
                        
                        {/* Icon */}
                        <span className="flex-shrink-0 w-4 text-center">
                          {getCategoryIcon()}
                        </span>
                        
                        {/* Step */}
                        <span className="font-bold text-[10px] flex-shrink-0 min-w-[50px] uppercase">
                          {log.step}
                        </span>
                        
                        {/* Status icon */}
                        <span className="flex-shrink-0 w-4 text-center">
                          {getIconForStatus()}
                  </span>
                        
                        {/* Message */}
                        <span className="flex-1 text-[10px] leading-relaxed">{log.message}</span>
                        
                        {/* Duration if available */}
                        {log.duration && (
                          <span className="flex-shrink-0 text-[9px] text-gray-500 font-normal">
                            {log.duration < 1000 ? `${log.duration}ms` : `${(log.duration / 1000).toFixed(1)}s`}
                  </span>
                        )}
                      </div>
                      
                      {/* Details (expandable on hover) */}
                      {log.details && (
                        <div className="ml-24 px-2 py-1 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-600">{key}:</span>
                              <span className="text-gray-400">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                </div>
                  );
                })}
              </>
            )}
            
            {/* Real-time status for current stage */}
            {uploadItem.status === 'processing' && (
              <div className="bg-blue-900 border-l-4 border-blue-400 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="font-bold text-blue-300">
                    {currentStage.label} in progress...
                  </span>
                </div>
                
                {/* Embedding specific details */}
                {currentStage.key === 'embed' && uploadItem.embeddingDetails && (
                  <div className="space-y-1 text-xs text-blue-300">
                    {uploadItem.embeddingDetails.currentChunk && (
                      <div>
                        📦 Processing chunk {uploadItem.embeddingDetails.currentChunk} of {uploadItem.embeddingDetails.totalChunks}
                      </div>
                    )}
                    {uploadItem.embeddingDetails.totalTokens && (
                      <div>
                        📊 Total tokens: {uploadItem.embeddingDetails.totalTokens.toLocaleString()}
                      </div>
                    )}
                    {uploadItem.embeddingDetails.estimatedTimeSeconds && uploadItem.embeddingDetails.currentChunk && (
                      <div>
                        ⏱️ Est. {Math.ceil((uploadItem.embeddingDetails.totalChunks! - uploadItem.embeddingDetails.currentChunk) * 2)}s remaining
                      </div>
                    )}
                    {uploadItem.embeddingDetails.message && (
                      <div className="italic mt-1">
                        {uploadItem.embeddingDetails.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Status Footer */}
        {uploadItem.status === 'complete' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Upload Complete!</span>
            </div>
          </div>
        )}
        {uploadItem.status === 'failed' && uploadItem.error && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-red-50">
            <div className="flex items-start gap-2 text-red-600">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Upload Failed</p>
                <p className="text-xs mt-1">{uploadItem.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

