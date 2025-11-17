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
                <>
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
                        {result.extractedText?.length.toLocaleString() || 0}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cost</p>
                      <p className="font-bold text-green-600">
                        ${result.metadata?.totalCost?.toFixed(4) || '0.0000'}
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
                  
                  {/* ✅ NEW: "What's Next?" Section */}
                  <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      ✅ Success! What's Next?
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Step 1: Get API Access */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                            1
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">
                              Get Your API Key
                            </p>
                            <div className="space-y-2 text-sm">
                              <p className="text-slate-600 dark:text-slate-400">
                                <strong>Option A:</strong> Request invitation from admin
                              </p>
                              <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                  📧 Email: alec@getaifactory.com
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                  Subject: "Flow API Access Request"
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  ✓ You'll receive: FLOW-CODE-202511-XXXXX
                                </p>
                              </div>
                              
                              <p className="text-slate-600 dark:text-slate-400 mt-3">
                                <strong>Option B:</strong> Use this playground (internal testing)
                              </p>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 border border-yellow-200 dark:border-yellow-700">
                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                  💡 For testing: You can use the internal endpoint without API key (SuperAdmin only)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Step 2: Test from Your Environment */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                            2
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">
                              Test from Your Local Environment
                            </p>
                            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">Quick Test (No Auth Needed - Internal Only)</p>
                                <button
                                  onClick={() => {
                                    const cmd = `curl -X POST http://localhost:3000/api/extract-document \\
  -F "file=@your-document.pdf" \\
  -F "model=gemini-2.5-flash"`;
                                    navigator.clipboard.writeText(cmd);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                >
                                  {copied ? '✓' : 'Copy'}
                                </button>
                              </div>
                              <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/extract-document \\
  -F "file=@your-document.pdf" \\
  -F "model=gemini-2.5-flash"`}
                              </pre>
                            </div>
                            
                            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-700">
                              <p className="text-xs text-blue-800 dark:text-blue-300">
                                <strong>💡 Pro Tip:</strong> Run this in your terminal right now to verify it works from command line!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Step 3: Setup Webhooks */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                            3
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">
                              Setup Webhooks (For Large Files &gt; 50MB)
                            </p>
                            
                            <div className="space-y-3 text-sm">
                              <p className="text-slate-600 dark:text-slate-400">
                                Configure webhook URL in your organization settings:
                              </p>
                              
                              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-slate-400">PATCH /api/v1/organization</p>
                                  <button
                                    onClick={() => {
                                      const cmd = `curl -X PATCH https://api.flow.ai/v1/organization \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"webhookUrl": "https://your-app.com/webhooks/flow"}'`;
                                      navigator.clipboard.writeText(cmd);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                  >
                                    {copied ? '✓' : 'Copy'}
                                  </button>
                                </div>
                                <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`curl -X PATCH https://api.flow.ai/v1/organization \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"webhookUrl": "https://your-app.com/webhooks/flow"}'`}
                                </pre>
                              </div>
                              
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3 border border-purple-200 dark:border-purple-700">
                                <p className="text-xs text-purple-800 dark:text-purple-300 mb-2">
                                  <strong>When job completes, you'll receive:</strong>
                                </p>
                                <pre className="text-xs text-purple-700 dark:text-purple-400 font-mono">
{`POST https://your-app.com/webhooks/flow
Headers:
  X-Flow-Signature: sha256=xxxxx

Body:
{
  "jobId": "job_xyz",
  "extractedText": "...",
  "metadata": {...}
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Step 4: Integrate in Your App */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                            4
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white mb-2">
                              Integrate in Your Application
                            </p>
                            
                            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-slate-400">Complete Integration Example</p>
                                <button
                                  onClick={() => {
                                    const code = `// Install SDK
npm install @flow/sdk

// In your code
const FlowAPI = require('@flow/sdk');
const client = new FlowAPI(process.env.FLOW_API_KEY);

// When user uploads document in YOUR app
app.post('/api/process-document', async (req, res) => {
  try {
    // Extract with Flow
    const result = await client.extractDocument(req.file.path);
    
    // Use the extracted text
    const data = parseYourData(result.extractedText);
    
    // Save to YOUR database
    await yourDB.save(data);
    
    // Return to YOUR user
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;
                                    navigator.clipboard.writeText(code);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                                >
                                  {copied ? '✓ Copied' : 'Copy Full Example'}
                                </button>
                              </div>
                              <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`// Install SDK
npm install @flow/sdk

// In your code
const FlowAPI = require('@flow/sdk');
const client = new FlowAPI(process.env.FLOW_API_KEY);

// When user uploads document in YOUR app
app.post('/api/process-document', async (req, res) => {
  try {
    // Extract with Flow
    const result = await client.extractDocument(
      req.file.path
    );
    
    // Use the extracted text
    const data = parseYourData(result.extractedText);
    
    // Save to YOUR database
    await yourDB.save(data);
    
    // Return to YOUR user
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Developer Documentation Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            How Developers Use This API
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Endpoint Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">API Endpoint</h4>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 mb-3">
                <code className="text-green-400 text-sm font-mono">
                  POST /api/v1/extract-document
                </code>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">Authentication:</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    Bearer fv_live_xxxxx (API Key)
                  </code>
                </div>
                
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">Request:</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded block">
                    multipart/form-data
                  </code>
                </div>
                
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">Response:</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded block">
                    JSON with extractedText
                  </code>
                </div>
              </div>
            </div>
            
            {/* Right: Code Example */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">cURL Example</h4>
                <button
                  onClick={() => {
                    const curl = `curl -X POST https://api.flow.ai/v1/extract-document \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "model=flash"`;
                    navigator.clipboard.writeText(curl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-600"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              
              <pre className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
{`curl -X POST https://api.flow.ai/v1/extract-document \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "model=flash"`}
              </pre>
              
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>📚 Get API Key:</strong> Contact admin for invitation code
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded">flow-cli login INVITATION-CODE</code>
                </p>
              </div>
            </div>
          </div>
          
          {/* JavaScript Example */}
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 dark:text-white">JavaScript Example</h4>
              <button
                onClick={() => {
                  const jsCode = `const FlowAPI = require('@flow/sdk');
const client = new FlowAPI(process.env.FLOW_API_KEY);

const result = await client.extractDocument('document.pdf');
console.log(result.extractedText);`;
                  navigator.clipboard.writeText(jsCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-xs px-2 py-1 bg-slate-700 text-white rounded hover:bg-slate-600"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            
            <pre className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 text-sm text-green-400 font-mono overflow-x-auto">
{`const FlowAPI = require('@flow/sdk');
const client = new FlowAPI(process.env.FLOW_API_KEY);

const result = await client.extractDocument('document.pdf');
console.log(result.extractedText); // Full extracted content`}
            </pre>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.open('/api/portal', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Full Documentation
              </button>
              
              <a
                href="https://github.com/flow/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                📚 API Reference
                <ExternalLink className="w-3 h-3" />
              </a>
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


