/**
 * API Playground Modal - Test Flow Vision API
 * 
 * Purpose: Interactive testing of document extraction API
 * Features:
 * - Upload document
 * - Select model (Flash/Pro)
 * - Extract and view JSON response
 * - Copy cURL command
 * - Beautiful, delightful UX
 */

import React, { useState } from 'react';
import {
  X,
  Upload,
  Zap,
  Sparkles,
  Copy,
  CheckCircle,
  Code,
  FileText,
  Loader2,
} from 'lucide-react';

interface APIPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function APIPlaygroundModal({
  isOpen,
  onClose,
  userId,
}: APIPlaygroundModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<'flash' | 'pro'>('flash');
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  async function handleExtract() {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }
    
    setExtracting(true);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', `gemini-2.5-${model}`);
      formData.append('extractionMethod', 'vision-api');
      
      const startTime = Date.now();
      
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          ...data,
          _meta: {
            duration: duration,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        setError(data.error || 'Error al extraer documento');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setExtracting(false);
    }
  }
  
  function copyCurlCommand() {
    if (!file) return;
    
    const curlCommand = `curl -X POST http://localhost:3000/api/extract-document \\
  -F "file=@${file.name}" \\
  -F "model=gemini-2.5-${model}" \\
  -F "extractionMethod=vision-api"`;
    
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  function copyJSON() {
    if (!result) return;
    
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                API Playground - Vision API
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Test document extraction and view JSON response
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Upload & Configure */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                  1. Upload Document
                </h3>
                
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={extracting}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    file
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}>
                    {file ? (
                      <>
                        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-slate-900 dark:text-white mb-1">
                          {file.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Drop file or click to upload
                        </p>
                        <p className="text-sm text-slate-500">
                          PDF, Word, Excel, CSV (max 500MB)
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                  2. Select Model
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setModel('flash')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      model === 'flash'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-green-300'
                    }`}
                  >
                    <Zap className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-bold text-slate-900 dark:text-white">Flash</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Fast & Economical
                    </p>
                    <p className="text-xs text-green-600 font-semibold mt-2">
                      94% cheaper
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setModel('pro')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      model === 'pro'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-purple-300'
                    }`}
                  >
                    <Sparkles className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="font-bold text-slate-900 dark:text-white">Pro</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      High Accuracy
                    </p>
                    <p className="text-xs text-purple-600 font-semibold mt-2">
                      Best quality
                    </p>
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleExtract}
                disabled={!file || extracting}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Extract Document
                  </>
                )}
              </button>
              
              {file && !extracting && !result && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      cURL Command:
                    </p>
                    <button
                      onClick={copyCurlCommand}
                      className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-xs flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/extract-document \\
  -F "file=@${file.name}" \\
  -F "model=gemini-2.5-${model}" \\
  -F "extractionMethod=vision-api"`}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Right: Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  3. JSON Response
                </h3>
                {result && (
                  <button
                    onClick={copyJSON}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6 h-[600px] overflow-y-auto">
                {error ? (
                  <div className="text-red-400 text-sm">
                    <p className="font-bold mb-2">❌ Error:</p>
                    <p>{error}</p>
                  </div>
                ) : result ? (
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-500">
                      <Code className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Upload a document and extract to see results</p>
                    </div>
                  </div>
                )}
              </div>
              
              {result && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Duration</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {((result._meta?.duration || 0) / 1000).toFixed(1)}s
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Characters</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {result.extractedData?.length.toLocaleString() || 0}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Model</p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {model === 'flash' ? 'Flash' : 'Pro'}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                    <p className="font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Success
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>
                💡 <strong>Tip:</strong> This uses the same API that external developers will use
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


