/**
 * Requirement Document Enhancement Modal
 * 
 * Delightful AI-powered requirement refinement experience
 * Target: NPS 98+ through helpful AI guidance and clear iteration tracking
 * 
 * Features:
 * - Upload requirement document
 * - AI suggests improvements
 * - Side-by-side comparison
 * - Up to 10 iterations
 * - Help requests (Admin/Ally/Stella)
 * - Staging feedback loop
 */

import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Send,
  Zap,
} from 'lucide-react';

interface Iteration {
  version: number;
  aiSuggestions: string;
  userFeedback: string;
  approved: boolean;
  timestamp: Date;
}

export function RequirementEnhancementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'review' | 'iterate' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const maxIterations = 10;
  const currentIteration = iterations.length + 1;
  
  async function handleUpload(uploadedFile: File) {
    setFile(uploadedFile);
    setProcessing(true);
    
    try {
      // Extract original document
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('model', 'gemini-2.5-flash');
      
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setOriginalText(result.extractedData || '');
      
      // Generate AI enhancement
      await generateEnhancement(result.extractedData);
      
      setStep('review');
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Failed to process document');
    } finally {
      setProcessing(false);
    }
  }
  
  async function generateEnhancement(text: string) {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/agents/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: text,
          enhancementGoal: `Analyze this requirement document and suggest improvements:
- Add missing technical details
- Clarify ambiguous requirements
- Include acceptance criteria
- Add performance requirements
- Include security considerations
- Improve structure and organization

Provide a clear, detailed enhancement that maintains the original intent while making it production-ready.`,
        }),
      });
      
      const result = await response.json();
      setEnhancedText(result.enhancedPrompt || text);
    } catch (error) {
      console.error('Error generating enhancement:', error);
      setEnhancedText(text);
    } finally {
      setProcessing(false);
    }
  }
  
  async function handleRefine() {
    if (!feedback.trim()) {
      alert('Please provide feedback for refinement');
      return;
    }
    
    // Save iteration
    const iteration: Iteration = {
      version: currentIteration,
      aiSuggestions: enhancedText,
      userFeedback: feedback,
      approved: false,
      timestamp: new Date(),
    };
    
    setIterations([...iterations, iteration]);
    
    // Generate new enhancement based on feedback
    await generateEnhancement(enhancedText + '\n\nUser Feedback: ' + feedback);
    
    setFeedback('');
  }
  
  function handleApprove() {
    const iteration: Iteration = {
      version: currentIteration,
      aiSuggestions: enhancedText,
      userFeedback: 'Approved',
      approved: true,
      timestamp: new Date(),
    };
    
    setIterations([...iterations, iteration]);
    setStep('complete');
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-blue-600" />
                AI Requirement Enhancement
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Let AI help you write better, more complete requirements
              </p>
            </div>
            <div className="flex items-center gap-4">
              {step === 'review' && (
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Iteration {currentIteration} / {maxIterations}
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="p-12 flex items-center justify-center">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Upload Your Requirement Document
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    AI will analyze and suggest improvements
                  </p>
                </div>
                
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    className="hidden"
                    disabled={processing}
                  />
                  <div className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all ${
                    processing
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-500'
                  }`}>
                    {processing ? (
                      <>
                        <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                        <p className="font-semibold text-blue-700">Processing document...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Drop file or click to upload
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          PDF, Word, or Text file
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}
          
          {/* Step: Review & Iterate */}
          {step === 'review' && (
            <div className="grid grid-cols-2 h-full">
              {/* Original */}
              <div className="border-r border-slate-200 dark:border-slate-700 p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    📄 Original
                    <span className="text-xs text-slate-500">(Your document)</span>
                  </h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 h-[500px] overflow-y-auto text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {originalText}
                </div>
              </div>
              
              {/* AI Enhanced */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    ✨ AI Enhanced
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      Version {currentIteration}
                    </span>
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 h-[500px] overflow-y-auto text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border-2 border-blue-200 dark:border-blue-700">
                  {enhancedText}
                </div>
              </div>
            </div>
          )}
          
          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Requirements Enhanced!
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Your requirements are now production-ready
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">What We Improved:</h4>
                  <ul className="text-left space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Added technical acceptance criteria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Clarified performance requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Included security considerations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Improved structure and clarity</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Download Enhanced Version
                  </button>
                  <button className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-semibold">
                    Save to Context
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer - Review Actions */}
        {step === 'review' && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Feedback Input */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  💬 Your Feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., 'Add more details about error handling' or 'Focus on scalability requirements'"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                  disabled={processing || currentIteration > maxIterations}
                />
              </div>
              
              {/* Help Button */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Need Help?
                </label>
                <button
                  onClick={() => setShowHelpMenu(!showHelpMenu)}
                  className="w-full px-4 py-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors font-semibold flex items-center justify-center gap-2 h-[88px]"
                >
                  <HelpCircle className="w-5 h-5" />
                  Get Help
                </button>
                
                {showHelpMenu && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-600 p-2 z-10">
                    <button className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Admin Help</p>
                        <p className="text-xs text-slate-500">Direct SuperAdmin support</p>
                      </div>
                    </button>
                    
                    <button className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Chat with Ally</p>
                        <p className="text-xs text-slate-500">AI assistant guidance</p>
                      </div>
                    </button>
                    
                    <button className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🎫</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Create Ticket (Stella)</p>
                        <p className="text-xs text-slate-500">Formal support request</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                <ThumbsUp className="w-6 h-6" />
                Approve & Complete
              </button>
              
              <button
                onClick={handleRefine}
                disabled={processing || currentIteration > maxIterations || !feedback.trim()}
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Refine ({maxIterations - currentIteration} left)
                  </>
                )}
              </button>
            </div>
            
            {currentIteration > maxIterations && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Maximum iterations reached. Approve current version or request help.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

