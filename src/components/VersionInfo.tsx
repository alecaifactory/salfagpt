import React, { useState } from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { getDeploymentInfo } from '../lib/version';

/**
 * Version Info Component
 * 
 * Floating button (bottom-right) that shows deployment metadata
 * Useful for debugging and verifying which version is running
 * 
 * Shows:
 * - Environment (localhost/qa/production)
 * - Version number
 * - Git branch and commit
 * - Deploy timestamp
 * - GCP project
 * 
 * Can copy all info to clipboard for bug reports
 */
export function VersionInfo() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const info = getDeploymentInfo();
  
  const handleCopy = async () => {
    const text = JSON.stringify(info, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'text-red-600';
      case 'qa': return 'text-yellow-600';
      case 'localhost': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setShow(!show)}
        className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center shadow-lg transition-colors"
        title="Version Info"
      >
        <Info className="w-5 h-5 text-slate-600" />
      </button>
      
      {/* Info Panel */}
      {show && (
        <div className="absolute bottom-14 right-0 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Deployment Info</h3>
            <button
              onClick={() => setShow(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            {/* Environment */}
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Environment:</span>
              <span className={`font-semibold ${getEnvironmentColor(info.environment)}`}>
                {info.environment.toUpperCase()}
              </span>
            </div>
            
            {/* Version */}
            <div className="flex justify-between">
              <span className="text-slate-600">Version:</span>
              <span className="font-mono text-slate-800">v{info.version}</span>
            </div>
            
            {/* Branch */}
            <div className="flex justify-between">
              <span className="text-slate-600">Branch:</span>
              <span className="font-mono text-slate-800 text-xs">{info.branch}</span>
            </div>
            
            {/* Commit */}
            <div className="flex justify-between">
              <span className="text-slate-600">Commit:</span>
              <span className="font-mono text-slate-800 text-xs">{info.commit}</span>
            </div>
            
            {/* Deployed */}
            <div className="flex justify-between">
              <span className="text-slate-600">Deployed:</span>
              <span className="text-xs text-slate-600">
                {new Date(info.deployedAt).toLocaleString()}
              </span>
            </div>
            
            {/* Project */}
            <div className="flex justify-between">
              <span className="text-slate-600">Project:</span>
              <span className="text-xs font-mono text-slate-600">{info.projectId}</span>
            </div>
            
            {/* Service (if available) */}
            {info.serviceName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Service:</span>
                <span className="text-xs font-mono text-slate-600">{info.serviceName}</span>
              </div>
            )}
          </div>
          
          {/* Copy Button */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Info
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

