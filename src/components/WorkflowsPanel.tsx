import React, { useState } from 'react';
import { Play, Settings, CheckCircle, Loader, AlertCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import type { Workflow } from '../types/context';

interface WorkflowsPanelProps {
  workflows: Workflow[];
  onRunWorkflow: (workflowId: string) => void;
  onConfigureWorkflow: (workflowId: string) => void;
  onSaveTemplate: (workflowId: string) => void;
}

export default function WorkflowsPanel({
  workflows,
  onRunWorkflow,
  onConfigureWorkflow,
  onSaveTemplate,
}: WorkflowsPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    available: true,
    running: true,
    outputs: true,
  });

  const availableWorkflows = workflows.filter(w => w.status === 'available');
  const runningWorkflows = workflows.filter(w => w.status === 'running');
  const completedWorkflows = workflows.filter(w => w.status === 'completed' || w.status === 'failed');

  const toggleSection = (section: 'available' | 'running' | 'outputs') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Available Workflows */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => toggleSection('available')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h3 className="text-sm font-semibold text-slate-700">Workflows Disponibles</h3>
          {expandedSections.available ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        
        {expandedSections.available && (
          <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
            {availableWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{workflow.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800">{workflow.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{workflow.description}</p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onRunWorkflow(workflow.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Ejecutar
                      </button>
                      <button
                        onClick={() => onConfigureWorkflow(workflow.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Running Workflows */}
      {runningWorkflows.length > 0 && (
        <div className="border-b border-slate-200">
          <button
            onClick={() => toggleSection('running')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700">En Ejecución</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {runningWorkflows.length}
              </span>
            </div>
            {expandedSections.running ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          
          {expandedSections.running && (
            <div className="px-4 pb-4 space-y-2">
              {runningWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-3 border border-blue-200 rounded-lg bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{workflow.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Procesando...</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outputs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => toggleSection('outputs')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Resultados</h3>
            {completedWorkflows.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
                {completedWorkflows.length}
              </span>
            )}
          </div>
          {expandedSections.outputs ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        
        {expandedSections.outputs && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {completedWorkflows.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p>No hay resultados aún</p>
                <p className="text-xs mt-1">Ejecuta un workflow para ver resultados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-3 border rounded-lg ${
                      workflow.status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getStatusIcon(workflow.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">{workflow.name}</p>
                          {workflow.status === 'completed' && workflow.output && (
                            <button
                              onClick={() => navigator.clipboard.writeText(workflow.output || '')}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        
                        {workflow.completedAt && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            {new Date(workflow.completedAt).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                        
                        {workflow.status === 'completed' && workflow.output && (
                          <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                            <p className="text-xs text-slate-700 line-clamp-3">
                              {workflow.output}
                            </p>
                          </div>
                        )}
                        
                        {workflow.status === 'completed' && (
                          <button
                            onClick={() => onSaveTemplate(workflow.id)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Guardar como Plantilla
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

