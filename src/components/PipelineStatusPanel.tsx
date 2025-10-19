import React from 'react';
import { 
  Upload, 
  FileText, 
  Grid, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock,
  DollarSign
} from 'lucide-react';
import type { PipelineLog } from '../types/context';

interface PipelineStatusPanelProps {
  logs: PipelineLog[];
  sourceName: string;
}

export default function PipelineStatusPanel({ logs, sourceName }: PipelineStatusPanelProps) {
  
  // Pipeline step configuration
  const pipelineSteps = [
    { key: 'upload', label: 'Upload', icon: Upload, color: 'blue' },
    { key: 'extract', label: 'Extract Text', icon: FileText, color: 'purple' },
    { key: 'chunk', label: 'Chunk Document', icon: Grid, color: 'indigo' },
    { key: 'embed', label: 'Generate Embeddings', icon: Zap, color: 'yellow' },
    { key: 'complete', label: 'Complete', icon: CheckCircle, color: 'green' },
  ];

  const getStepLog = (stepKey: string): PipelineLog | undefined => {
    return logs.find(log => log.step === stepKey);
  };

  const getStepStatus = (stepKey: string): 'pending' | 'in_progress' | 'success' | 'error' => {
    const log = getStepLog(stepKey);
    return log?.status || 'pending';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'in_progress':
        return 'border-blue-500 bg-blue-50 animate-pulse';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Pipeline de Procesamiento</h4>
          <p className="text-xs text-gray-600">{sourceName}</p>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        {pipelineSteps.map((step, index) => {
          const log = getStepLog(step.key);
          const status = getStepStatus(step.key);
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative">
              {/* Connecting line */}
              {index < pipelineSteps.length - 1 && (
                <div className={`absolute left-[26px] top-12 w-0.5 h-8 ${
                  status === 'success' ? 'bg-green-500' :
                  status === 'in_progress' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`} />
              )}

              {/* Step card */}
              <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(status)}`}>
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(status)}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StepIcon className={`w-4 h-4 text-${step.color}-600`} />
                        <h5 className="text-sm font-semibold text-gray-900">{step.label}</h5>
                      </div>
                      {log?.duration && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(log.duration)}
                        </div>
                      )}
                    </div>

                    {/* Status message */}
                    {log && (
                      <p className="text-xs text-gray-700 mb-2">{log.message}</p>
                    )}

                    {/* Details */}
                    {log?.details && status === 'success' && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {/* Upload details */}
                        {step.key === 'upload' && log.details.fileSize && (
                          <>
                            <div className="text-xs">
                              <span className="text-gray-500">Tamaño:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {(log.details.fileSize / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            {log.details.storagePath && (
                              <div className="text-xs col-span-2">
                                <span className="text-gray-500">Cloud Storage:</span>
                                <span className="ml-1 font-mono text-gray-700 text-[10px]">
                                  {log.details.storagePath.split('/').pop()}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Extract details */}
                        {step.key === 'extract' && (
                          <>
                            {log.details.model && (
                              <div className="text-xs">
                                <span className="text-gray-500">Modelo:</span>
                                <span className={`ml-1 font-semibold ${
                                  log.details.model === 'gemini-2.5-pro' ? 'text-purple-700' : 'text-green-700'
                                }`}>
                                  {log.details.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                                </span>
                              </div>
                            )}
                            {log.details.charactersExtracted && (
                              <div className="text-xs">
                                <span className="text-gray-500">Caracteres:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {log.details.charactersExtracted.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {log.details.inputTokens && (
                              <div className="text-xs">
                                <span className="text-gray-500">Input:</span>
                                <span className="ml-1 font-mono text-gray-700">
                                  {log.details.inputTokens.toLocaleString()} tokens
                                </span>
                              </div>
                            )}
                            {log.details.outputTokens && (
                              <div className="text-xs">
                                <span className="text-gray-500">Output:</span>
                                <span className="ml-1 font-mono text-gray-700">
                                  {log.details.outputTokens.toLocaleString()} tokens
                                </span>
                              </div>
                            )}
                            {log.details.cost && (
                              <div className="text-xs col-span-2 flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-500">Costo:</span>
                                <span className="ml-1 font-semibold text-gray-900">
                                  ${log.details.cost.toFixed(6)}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Chunk details */}
                        {step.key === 'chunk' && log.details.chunkCount && (
                          <>
                            <div className="text-xs">
                              <span className="text-gray-500">Chunks:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {log.details.chunkCount}
                              </span>
                            </div>
                            {log.details.avgChunkSize && (
                              <div className="text-xs">
                                <span className="text-gray-500">Promedio:</span>
                                <span className="ml-1 font-mono text-gray-700">
                                  {log.details.avgChunkSize} tokens
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Embed details */}
                        {step.key === 'embed' && (
                          <>
                            {log.details.embeddingCount && (
                              <div className="text-xs">
                                <span className="text-gray-500">Embeddings:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {log.details.embeddingCount}
                                </span>
                              </div>
                            )}
                            {log.details.embeddingModel && (
                              <div className="text-xs">
                                <span className="text-gray-500">Modelo:</span>
                                <span className="ml-1 font-mono text-gray-700 text-[10px]">
                                  {log.details.embeddingModel}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Error details */}
                    {status === 'error' && log?.details?.error && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                        <p className="text-xs text-red-800 font-medium">{log.details.error}</p>
                        {log.details.suggestions && log.details.suggestions.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {log.details.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-xs text-red-700">
                                • {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      {logs.length > 0 && logs[logs.length - 1]?.status === 'success' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h5 className="text-sm font-bold text-green-900">Pipeline Completo</h5>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            {logs.reduce((acc, log) => acc + (log.duration || 0), 0) > 0 && (
              <div className="text-xs">
                <span className="text-green-700">Tiempo total:</span>
                <span className="ml-1 font-semibold text-green-900">
                  {formatDuration(logs.reduce((acc, log) => acc + (log.duration || 0), 0))}
                </span>
              </div>
            )}
            {logs.some(log => log.details?.cost) && (
              <div className="text-xs">
                <span className="text-green-700">Costo total:</span>
                <span className="ml-1 font-semibold text-green-900">
                  ${logs.reduce((acc, log) => acc + (log.details?.cost || 0), 0).toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

