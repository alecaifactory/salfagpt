/**
 * AIRoadmapAnalyzer - AI-powered roadmap planning
 * 
 * Features:
 * - Analyze feedback batch for patterns
 * - Calculate OKR alignment scores
 * - Suggest roadmap priorities
 * - Generate rationale for recommendations
 * - Estimate CSAT/NPS impact
 * - Admin review and approval workflow
 */

import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import type { RoadmapAnalysisResponse } from '../types/feedback';

interface AIRoadmapAnalyzerProps {
  companyId: string;
  quarter: string;
}

export default function AIRoadmapAnalyzer({
  companyId,
  quarter
}: AIRoadmapAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoadmapAnalysisResponse | null>(null);
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([]);
  
  // Run AI analysis
  async function handleAnalyze() {
    try {
      setIsAnalyzing(true);
      
      const response = await fetch('/api/roadmap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          quarter,
          feedbackSessionIds: selectedFeedbackIds.length > 0 ? selectedFeedbackIds : undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      setAnalysis(result);
      
      console.log('✅ AI analysis complete');
      
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert('Error en el análisis AI');
    } finally {
      setIsAnalyzing(false);
    }
  }
  
  // Approve AI recommendations
  async function handleApprove() {
    if (!analysis) return;
    
    try {
      const response = await fetch('/api/roadmap/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          quarter,
          analysis,
        }),
      });
      
      if (!response.ok) throw new Error('Approval failed');
      
      console.log('✅ Roadmap updated');
      alert('✅ Roadmap actualizado con las sugerencias AI');
      
      // Refresh
      setAnalysis(null);
      
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Error al aprobar');
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Roadmap Analyzer</h1>
              <p className="text-sm text-slate-600">
                Analyze feedback and generate data-driven roadmap recommendations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={quarter}
              onChange={(e) => {/* Update quarter */}}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="Q1 2025">Q1 2025</option>
              <option value="Q2 2025">Q2 2025</option>
              <option value="Q3 2025">Q3 2025</option>
              <option value="Q4 2025">Q4 2025</option>
            </select>
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 font-semibold flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!analysis ? (
          <div className="max-w-4xl mx-auto">
            {/* Instructions */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">How It Works</h2>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
                  <span>AI collects all approved feedback for the selected quarter</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
                  <span>AI clusters similar requests and identifies patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
                  <span>AI calculates impact scores (CSAT, NPS, OKR alignment)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">4</span>
                  <span>AI suggests new backlog items and priority changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">5</span>
                  <span>AI generates detailed rationale for each recommendation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs">6</span>
                  <span>You review, modify, and approve the AI suggestions</span>
                </li>
              </ol>
            </div>
            
            {/* Placeholder */}
            <div className="text-center py-12">
              <Brain className="w-20 h-20 text-purple-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Ready to analyze feedback for {quarter}</p>
              <p className="text-sm text-slate-500">Click "Analyze with AI" to start</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-purple-900 mb-2">AI Rationale</h2>
                  <p className="text-purple-800 leading-relaxed">
                    {analysis.rationale}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Expected Outcomes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">CSAT Improvement</span>
                </div>
                <p className="text-3xl font-bold text-purple-800">
                  +{analysis.expectedOutcomes.csatImprovement}
                </p>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-slate-700">NPS Improvement</span>
                </div>
                <p className="text-3xl font-bold text-indigo-800">
                  +{analysis.expectedOutcomes.npsImprovement}
                </p>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">OKRs Impacted</span>
                </div>
                <p className="text-3xl font-bold text-green-800">
                  {Object.keys(analysis.expectedOutcomes.okrProgress).length}
                </p>
              </div>
            </div>
            
            {/* Feedback Clusters */}
            {analysis.clusters.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Feedback Clusters</h3>
                <div className="space-y-3">
                  {analysis.clusters.map((cluster, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">{cluster.theme}</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {cluster.feedbackIds.length} related feedback items
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-800">
                          {cluster.impactScore}
                        </div>
                        <div className="text-xs text-blue-600">Impact Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Backlog Items */}
            {analysis.newBacklogItems.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Suggested New Items ({analysis.newBacklogItems.length})
                </h3>
                <div className="space-y-3">
                  {analysis.newBacklogItems.map((item, idx) => (
                    <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-green-900 flex-1">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-green-800 mb-3">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        {item.estimatedCSATImpact && (
                          <div className="flex items-center gap-1 text-purple-700">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>CSAT: +{item.estimatedCSATImpact}</span>
                          </div>
                        )}
                        {item.estimatedNPSImpact && (
                          <div className="flex items-center gap-1 text-indigo-700">
                            <Users className="w-3.5 h-3.5" />
                            <span>NPS: +{item.estimatedNPSImpact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Priority Changes */}
            {analysis.priorityChanges.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Suggested Priority Changes ({analysis.priorityChanges.length})
                </h3>
                <div className="space-y-3">
                  {analysis.priorityChanges.map((change, idx) => (
                    <div key={idx} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-yellow-900">Item: {change.itemId}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold">
                            {change.currentPriority}
                          </span>
                          <ArrowRight className="w-4 h-4 text-yellow-700" />
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            change.suggestedPriority === 'critical' ? 'bg-red-100 text-red-700' :
                            change.suggestedPriority === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {change.suggestedPriority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-yellow-800">{change.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Roadmap Recommendations */}
            {analysis.roadmapRecommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Roadmap Items for {quarter} ({analysis.roadmapRecommendations.length})
                </h3>
                <div className="space-y-4">
                  {analysis.roadmapRecommendations.map((item, idx) => (
                    <div key={idx} className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-5">
                      <h4 className="text-lg font-bold text-indigo-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-indigo-800 mb-4">{item.description}</p>
                      
                      {/* Objectives */}
                      {item.objectives && item.objectives.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-semibold text-indigo-700 mb-2">Objectives:</h5>
                          <ul className="space-y-1">
                            {item.objectives.map((obj, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Target className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <span className="text-indigo-800">{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Impact Metrics */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white rounded p-2 border border-purple-200">
                          <div className="text-xs text-purple-600 mb-1">CSAT</div>
                          <div className="text-lg font-bold text-purple-800">
                            +{item.estimatedCSATImpact}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-indigo-200">
                          <div className="text-xs text-indigo-600 mb-1">NPS</div>
                          <div className="text-lg font-bold text-indigo-800">
                            +{item.estimatedNPSImpact}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-blue-200">
                          <div className="text-xs text-blue-600 mb-1">Users</div>
                          <div className="text-lg font-bold text-blue-800">
                            {item.affectedUsers}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-green-200">
                          <div className="text-xs text-green-600 mb-1">OKR</div>
                          <div className="text-lg font-bold text-green-800">
                            {item.okrImpactScore}/10
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Rationale */}
                      {item.aiRationale && (
                        <div className="mt-4 p-3 bg-white rounded border border-indigo-200">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-800">{item.aiRationale}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Approval Actions */}
            <div className="sticky bottom-0 bg-white border-t-2 border-slate-200 p-6 shadow-lg rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-slate-700">
                    Review AI suggestions carefully before approving
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAnalysis(null)}
                    className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold"
                  >
                    Reject All
                  </button>
                  
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve & Update Roadmap
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

