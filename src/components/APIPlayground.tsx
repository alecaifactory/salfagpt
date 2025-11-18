/**
 * API Playground - Document Processing Testing UI
 * 
 * Purpose: Allow enterprises to test document extraction methods visually
 * Features:
 * - Upload PDF and test extraction
 * - Choose method (auto, vision, file-api, chunked)
 * - Real-time progress and logs
 * - Performance metrics
 * - Code export for integration
 * - API key management
 * 
 * Created: 2025-11-17
 */

import { useState } from 'react';
import { 
  Upload, FileText, Eye, Sparkles, Layers, 
  Play, Copy, Download, Key, Webhook, 
  CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp 
} from 'lucide-react';

interface ExtractionMethod {
  id: 'auto' | 'vision-api' | 'file-api' | 'chunked';
  name: string;
  description: string;
  icon: any;
  maxSize: string;
  avgTime: string;
  cost: string;
}

interface ProgressLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

interface ExtractionResult {
  text: string;
  metadata: {
    method: string;
    model: string;
    extractionTime: number;
    characters: number;
    tokens: { input: number; output: number; total: number };
    cost: { total: number; currency: string };
  };
}

export default function APIPlayground() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<'auto' | 'vision-api' | 'file-api' | 'chunked'>('auto');
  const [model, setModel] = useState<'flash' | 'pro'>('flash');
  const [webhook, setWebhook] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showLogs, setShowLogs] = useState(true);
  const [showAPIKey, setShowAPIKey] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);

  // Available methods
  const methods: ExtractionMethod[] = [
    {
      id: 'auto',
      name: 'Auto (Recommended)',
      description: 'Automatically selects best method based on file',
      icon: Sparkles,
      maxSize: '20MB',
      avgTime: '5-25s',
      cost: '$0.01-0.02',
    },
    {
      id: 'vision-api',
      name: 'Vision API',
      description: 'Google Cloud Vision - Best for scanned PDFs',
      icon: Eye,
      maxSize: '20MB',
      avgTime: '5-10s',
      cost: '$0.024',
    },
    {
      id: 'file-api',
      name: 'Gemini File API',
      description: 'Direct file processing - Handles corrupt PDFs',
      icon: FileText,
      maxSize: '20MB',
      avgTime: '15-25s',
      cost: '$0.018 (flash)',
    },
    {
      id: 'chunked',
      name: 'Chunked Extraction',
      description: 'Parallel sections - For very large PDFs',
      icon: Layers,
      maxSize: '100MB+',
      avgTime: '30-60s',
      cost: '$0.024',
    },
  ];

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setLogs([]);
    }
  };

  const addLog = (level: ProgressLog['level'], message: string, details?: Record<string, any>) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      level,
      message,
      details,
    }]);
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);
    setLogs([]);

    try {
      addLog('info', `Starting extraction with ${method}...`);
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      formData.append('extractionMethod', method);
      if (webhook) formData.append('webhook', webhook);

      addLog('info', 'Uploading file...');
      setProgress(20);

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setProgress(90);
      addLog('info', 'Processing response...');

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      addLog('success', 'Extraction complete!', {
        characters: data.extractedData?.length,
        method: data.metadata?.method,
        time: `${(data.metadata?.extractionTime / 1000).toFixed(1)}s`,
      });

      setResult({
        text: data.extractedData || '',
        metadata: {
          method: data.metadata?.method || method,
          model: data.metadata?.model || model,
          extractionTime: data.metadata?.extractionTime || 0,
          characters: data.extractedData?.length || 0,
          tokens: {
            input: data.metadata?.inputTokens || 0,
            output: data.metadata?.outputTokens || 0,
            total: data.metadata?.totalTokens || 0,
          },
          cost: {
            total: data.metadata?.cost || 0,
            currency: 'USD',
          },
        },
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      addLog('error', `Extraction failed: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAPIKey = async () => {
    try {
      const response = await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'API Playground Test',
          scopes: ['extract:read', 'extract:write'],
        }),
      });

      const data = await response.json();
      setApiKey(data.apiKey);
      addLog('success', 'API key generated successfully');
    } catch (err) {
      addLog('error', 'Failed to generate API key');
    }
  };

  const handleCopyCode = () => {
    const code = generateIntegrationCode();
    navigator.clipboard.writeText(code);
    addLog('success', 'Integration code copied to clipboard!');
  };

  const generateIntegrationCode = (): string => {
    return `// ✅ Generated by Flow API Playground
// Ready to use in your application

import fetch from 'node-fetch';

async function extractDocument(pdfBuffer: Buffer) {
  const formData = new FormData();
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }));
  formData.append('model', '${model}');
  formData.append('method', '${method}');
  
  const response = await fetch('https://flow.getaifactory.com/api/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}',
    },
    body: formData,
  });
  
  const result = await response.json();
  
  console.log('✅ Extracted:', result.result.text.length, 'characters');
  console.log('💰 Cost: $' + result.result.metadata.cost.total);
  
  return result;
}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-800">
            📄 Document Processing API Playground
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Test extraction methods, get API key, export integration code
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            
            {/* Step 1: Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Step 1: Upload Document
              </h2>
              
              <label className="block">
                <div className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors
                  ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                `}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-blue-600' : 'text-slate-400'}`} />
                  {file ? (
                    <>
                      <p className="font-medium text-slate-800">{file.name}</p>
                      <p className="text-sm text-slate-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-slate-700">Drop PDF here or click to browse</p>
                      <p className="text-sm text-slate-500 mt-1">Max 20 MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Step 2: Method */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Step 2: Choose Method
              </h2>
              
              <div className="space-y-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${method === m.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <m.icon className={`w-5 h-5 mt-0.5 ${method === m.id ? 'text-blue-600' : 'text-slate-500'}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{m.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{m.description}</div>
                        <div className="flex gap-4 text-xs text-slate-500 mt-2">
                          <span>Max: {m.maxSize}</span>
                          <span>Time: {m.avgTime}</span>
                          <span>Cost: {m.cost}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Model */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Step 3: Select Model
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModel('flash')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${model === 'flash' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-200 hover:border-green-300'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={`w-5 h-5 ${model === 'flash' ? 'text-green-600' : 'text-slate-500'}`} />
                    <span className="font-semibold text-slate-800">Flash</span>
                  </div>
                  <div className="text-xs text-slate-600">Fast & Economical</div>
                  <div className="text-xs font-semibold text-green-600 mt-1">~$0.018/13MB</div>
                </button>

                <button
                  onClick={() => setModel('pro')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${model === 'pro' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-purple-300'}
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={`w-5 h-5 ${model === 'pro' ? 'text-purple-600' : 'text-slate-500'}`} />
                    <span className="font-semibold text-slate-800">Pro</span>
                  </div>
                  <div className="text-xs text-slate-600">High Quality</div>
                  <div className="text-xs font-semibold text-purple-600 mt-1">~$0.12/13MB</div>
                </button>
              </div>
            </div>

            {/* Step 4: Webhook (Optional) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Step 4: Webhook (Optional)
              </h2>
              
              <div className="space-y-3">
                <input
                  type="url"
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  placeholder="https://your-app.com/webhook"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-600">
                  We'll POST extraction results to this URL when complete
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleExtract}
              disabled={!file || isProcessing}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Process Document
                </>
              )}
            </button>

          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            
            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Processing</span>
                  <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                >
                  <h3 className="font-bold text-slate-800">📝 Logs ({logs.length})</h3>
                  {showLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showLogs && (
                  <div className="border-t border-slate-200 p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2 font-mono text-xs">
                      {logs.map((log, i) => (
                        <div key={i} className={`
                          p-2 rounded
                          ${log.level === 'success' ? 'bg-green-50 text-green-800' :
                            log.level === 'error' ? 'bg-red-50 text-red-800' :
                            log.level === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                            'bg-slate-50 text-slate-700'}
                        `}>
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span className="flex-1">{log.message}</span>
                          </div>
                          {log.details && (
                            <pre className="mt-1 text-[10px] text-slate-600">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Extraction Complete
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {result.metadata.method}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600">Characters</div>
                    <div className="text-lg font-bold text-slate-800">
                      {result.metadata.characters.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600">Time</div>
                    <div className="text-lg font-bold text-slate-800">
                      {(result.metadata.extractionTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600">Tokens</div>
                    <div className="text-lg font-bold text-slate-800">
                      {result.metadata.tokens.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600">Cost</div>
                    <div className="text-lg font-bold text-green-600">
                      ${result.metadata.cost.total.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Text Preview */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Text Preview:</div>
                  <div className="p-3 bg-slate-50 rounded-lg max-h-40 overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {result.text.substring(0, 500)}...
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([result.text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'extracted.txt';
                      a.click();
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Text
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy API Call
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">Extraction Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Get API Key */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Get API Key for Integration
              </h3>
              
              {apiKey ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700 mb-1">Your API Key:</div>
                    <div className="font-mono text-sm text-blue-900 break-all">{apiKey}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      addLog('success', 'API key copied!');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy API Key
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateAPIKey}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Generate API Key
                </button>
              )}
            </div>

            {/* Code Export */}
            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <button
                  onClick={() => setShowCodeExport(!showCodeExport)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="font-bold text-slate-800">💻 Integration Code</h3>
                  {showCodeExport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showCodeExport && (
                  <div className="space-y-3">
                    <pre className="p-4 bg-slate-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                      {generateIntegrationCode()}
                    </pre>
                    <button
                      onClick={handleCopyCode}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Bottom Section - Documentation Links */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">📚 Ready to Integrate?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/docs/api" className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="font-semibold text-blue-600 mb-1">API Documentation</div>
              <div className="text-xs text-slate-600">Complete REST API reference</div>
            </a>
            <a href="/docs/sdk" className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="font-semibold text-blue-600 mb-1">SDK & CLI</div>
              <div className="text-xs text-slate-600">NPM package & command-line tools</div>
            </a>
            <a href="/docs/templates" className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
              <div className="font-semibold text-blue-600 mb-1">Cloud Templates</div>
              <div className="text-xs text-slate-600">GCP, AWS, Azure, Docker ready</div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

