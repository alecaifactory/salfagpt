/**
 * AdminFeedbackPanel - Admin interface for reviewing user feedback
 * 
 * Features:
 * - View all feedback sessions
 * - Filter by status, priority, type
 * - Review AI analysis
 * - Approve/reject feedback
 * - Convert to backlog items
 * - Track CSAT/NPS impact
 */

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Loader2,
  ChevronRight
} from 'lucide-react';
import type { FeedbackSession } from '../types/feedback';

interface AdminFeedbackPanelProps {
  companyId: string;
  adminUserId: string;
}

export default function AdminFeedbackPanel({
  companyId,
  adminUserId
}: AdminFeedbackPanelProps) {
  // State
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<FeedbackSession | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Load sessions
  useEffect(() => {
    loadSessions();
  }, [companyId, statusFilter, priorityFilter, typeFilter]);
  
  async function loadSessions() {
    try {
      setLoading(true);
      
      let url = `/api/feedback/admin/sessions?companyId=${companyId}`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (priorityFilter !== 'all') {
        url += `&priority=${priorityFilter}`;
      }
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data = await response.json();
      setSessions(data);
      
    } catch (error) {
      console.error('Failed to load feedback:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleApprove(sessionId: string) {
    try {
      const response = await fetch(`/api/feedback/admin/sessions/${sessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          adminUserId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to approve');
      
      console.log('✅ Feedback approved');
      loadSessions();
      
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Error al aprobar feedback');
    }
  }
  
  async function handleConvertToBacklog(sessionId: string) {
    try {
      const response = await fetch(`/api/feedback/admin/sessions/${sessionId}/to-backlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to convert');
      
      const result = await response.json();
      
      console.log('✅ Converted to backlog:', result.backlogItemId);
      loadSessions();
      
    } catch (error) {
      console.error('Failed to convert:', error);
      alert('Error al convertir a backlog');
    }
  }
  
  // Stats
  const stats = {
    pending: sessions.filter(s => s.status === 'submitted').length,
    underReview: sessions.filter(s => s.status === 'under_review').length,
    accepted: sessions.filter(s => s.status === 'accepted').length,
    avgCSATImpact: sessions.reduce((sum, s) => sum + (s.expectedCSATImpact || 0), 0) / (sessions.length || 1),
    avgNPSImpact: sessions.reduce((sum, s) => sum + (s.expectedNPSImpact || 0), 0) / (sessions.length || 1),
  };
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">User Feedback</h1>
              <p className="text-sm text-slate-600">Review and manage feedback submissions</p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-yellow-700">Pending</span>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">Under Review</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats.underReview}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-green-700">Accepted</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.accepted}</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">Avg CSAT</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-800">{stats.avgCSATImpact.toFixed(1)}</p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-indigo-700">Avg NPS</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-800">
              {stats.avgNPSImpact > 0 ? '+' : ''}{stats.avgNPSImpact.toFixed(0)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-500" />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
            <option value="ui_improvement">UI Improvement</option>
            <option value="general_feedback">General Feedback</option>
          </select>
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay feedback para mostrar</p>
            <p className="text-sm text-slate-500 mt-2">Ajusta los filtros o espera nuevas solicitudes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {session.title || 'Sin título'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{session.messages?.length || 0} mensajes</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Priority Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        session.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        session.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {session.priority}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                        session.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                        session.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        session.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        session.status === 'implemented' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* AI Summary */}
                  {session.aiSummary && (
                    <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                      {session.aiSummary}
                    </p>
                  )}
                  
                  {/* Impact Metrics */}
                  <div className="flex items-center gap-4 text-xs">
                    {session.expectedCSATImpact && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-slate-600">CSAT:</span>
                        <span className="font-semibold text-purple-700">
                          +{session.expectedCSATImpact}/5
                        </span>
                      </div>
                    )}
                    
                    {session.expectedNPSImpact && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-slate-600">NPS:</span>
                        <span className="font-semibold text-indigo-700">
                          {session.expectedNPSImpact > 0 ? '+' : ''}{session.expectedNPSImpact}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  {session.status === 'submitted' && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(session.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToBacklog(session.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        → Backlog
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                        className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {selectedSession.title || 'Sin título'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedSession.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Conversation */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Conversación</h3>
                <div className="space-y-3">
                  {selectedSession.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI Analysis */}
              {selectedSession.aiSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Resumen AI</h3>
                  <p className="text-sm text-blue-900">{selectedSession.aiSummary}</p>
                </div>
              )}
              
              {/* Requirements */}
              {selectedSession.extractedRequirements && selectedSession.extractedRequirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Requisitos Extraídos</h3>
                  <ul className="space-y-1">
                    {selectedSession.extractedRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Impact */}
              <div className="grid grid-cols-2 gap-4">
                {selectedSession.expectedCSATImpact && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-purple-700 mb-1">Expected CSAT Impact</div>
                    <div className="text-2xl font-bold text-purple-800">
                      +{selectedSession.expectedCSATImpact}/5
                    </div>
                  </div>
                )}
                
                {selectedSession.expectedNPSImpact && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-indigo-700 mb-1">Expected NPS Impact</div>
                    <div className="text-2xl font-bold text-indigo-800">
                      {selectedSession.expectedNPSImpact > 0 ? '+' : ''}{selectedSession.expectedNPSImpact}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
              >
                Cerrar
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(selectedSession.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                
                <button
                  onClick={() => handleConvertToBacklog(selectedSession.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  → Backlog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

