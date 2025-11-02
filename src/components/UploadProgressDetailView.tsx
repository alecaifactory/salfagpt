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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {uploadItem.file.name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                <span>{(uploadItem.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                {uploadItem.model && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Overall Progress */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Overall Progress
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {uploadItem.progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                uploadItem.status === 'failed' ? 'bg-red-600' :
                uploadItem.status === 'complete' ? 'bg-green-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${uploadItem.progress}%` }}
            />
          </div>
          
          {/* Current Stage Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-600">Current Stage:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              {React.createElement(currentStage.icon, { className: "w-4 h-4 text-blue-600" })}
              <span className="text-sm font-semibold text-blue-700">{currentStage.label}</span>
              {uploadItem.status === 'processing' && (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              )}
            </div>
          </div>
        </div>
        
        {/* Stage Breakdown */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Pipeline Stages</h3>
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const stageLog = pipelineLogs.find(log => log.step === stage.key);
              const isComplete = uploadItem.progress > stage.range[1];
              const isCurrent = uploadItem.progress >= stage.range[0] && uploadItem.progress < stage.range[1];
              const isPending = uploadItem.progress < stage.range[0];
              const StageIcon = stage.icon;
              
              return (
                <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isComplete ? 'bg-green-50 border-green-200' :
                  isCurrent ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isComplete ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-blue-600 text-white' :
                    'bg-gray-300 text-gray-500'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : stageLog?.status === 'error' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <StageIcon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{stage.label}</span>
                      {stageLog && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          stageLog.status === 'success' ? 'bg-green-100 text-green-700' :
                          stageLog.status === 'error' ? 'bg-red-100 text-red-700' :
                          stageLog.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {stageLog.status}
                        </span>
                      )}
                    </div>
                    {stageLog?.message && (
                      <p className="text-xs text-gray-600 mt-1">{stageLog.message}</p>
                    )}
                    
                    {/* Embedding Details (for Embed stage) */}
                    {isCurrent && stage.key === 'embed' && uploadItem.embeddingDetails && (
                      <div className="mt-2 p-2 bg-white rounded border border-blue-200 text-xs space-y-1">
                        {uploadItem.embeddingDetails.currentChunk && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-mono text-blue-600">
                              Chunk {uploadItem.embeddingDetails.currentChunk}/{uploadItem.embeddingDetails.totalChunks}
                            </span>
                          </div>
                        )}
                        {uploadItem.embeddingDetails.totalTokens && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Tokens:</span>
                            <span className="font-mono text-gray-900">
                              {uploadItem.embeddingDetails.totalTokens.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {uploadItem.embeddingDetails.message && (
                          <div className="text-blue-600 italic mt-1">
                            {uploadItem.embeddingDetails.message}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Stage Details */}
                    {stageLog?.details && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-700">
                        {Object.entries(stageLog.details).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-gray-500">{key}:</span>
                            <span className="flex-1">{JSON.stringify(value, null, 2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Retry Button (for failed stages) */}
                  {stageLog?.status === 'error' && onRetryStage && (
                    <button
                      onClick={() => onRetryStage(stage.key)}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Live Log Stream */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Live Processing Log</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Streaming</span>
            </div>
          </div>
          
          <div 
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 font-mono text-xs space-y-1"
          >
            {pipelineLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for processing to start...</p>
              </div>
            ) : (
              pipelineLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 p-2 rounded ${
                    log.status === 'success' ? 'bg-green-50 text-green-800' :
                    log.status === 'error' ? 'bg-red-50 text-red-800' :
                    log.status === 'in_progress' ? 'bg-blue-50 text-blue-800' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {log.status === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {log.status === 'error' && <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {log.status === 'in_progress' && <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />}
                  {log.status === 'warning' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[10px] text-gray-500">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className="font-semibold">{log.step.toUpperCase()}</span>
                    </div>
                    <p className="text-xs">{log.message}</p>
                    
                    {log.details && (
                      <pre className="mt-1 text-[10px] text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Real-time status for current stage */}
            {uploadItem.status === 'processing' && (
              <div className="bg-blue-100 border-l-4 border-blue-600 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="font-bold text-blue-900">
                    {currentStage.label} in progress...
                  </span>
                </div>
                
                {/* Embedding specific details */}
                {currentStage.key === 'embed' && uploadItem.embeddingDetails && (
                  <div className="space-y-1 text-xs text-blue-800">
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
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            {uploadItem.status === 'complete' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Upload Complete!</span>
              </div>
            )}
            {uploadItem.status === 'failed' && uploadItem.error && (
              <div className="flex items-start gap-2 text-red-600">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Upload Failed</p>
                  <p className="text-xs mt-1">{uploadItem.error}</p>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

