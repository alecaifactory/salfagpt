/**
 * Promotion Approval Dashboard
 * 
 * Interface for reviewing and approving promotion requests
 * Shows pending promotions, changes, conflicts
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import type { PromotionRequest } from '../types/organizations';

interface Props {
  organizationId: string;
  currentUserId: string;
  currentUserRole: string;
}

export default function PromotionApprovalDashboard({ organizationId, currentUserId, currentUserRole }: Props) {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  useEffect(() => {
    loadRequests();
  }, [organizationId, filter]);
  
  async function loadRequests() {
    try {
      setLoading(true);
      
      const status = filter === 'all' ? undefined : filter;
      const response = await fetch(`/api/promotions?organizationId=${organizationId}${status ? `&status=${status}` : ''}`);
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('❌ Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleApprove(requestId: string, notes?: string) {
    try {
      const response = await fetch(`/api/promotions/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        alert('Promotion approved successfully');
        loadRequests();
      } else {
        const error = await response.json();
        alert(`Failed to approve: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('❌ Error approving:', error);
      alert('Failed to approve promotion');
    }
  }
  
  async function handleReject(requestId: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    try {
      const response = await fetch(`/api/promotions/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('Promotion rejected');
        loadRequests();
      } else {
        const error = await response.json();
        alert(`Failed to reject: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('❌ Error rejecting:', error);
      alert('Failed to reject promotion');
    }
  }
  
  async function handleExecute(requestId: string) {
    if (!confirm('Execute this promotion to production? This cannot be easily undone.')) return;
    
    try {
      const response = await fetch(`/api/promotions/${requestId}/execute`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Promotion executed successfully!');
        loadRequests();
      } else {
        const error = await response.json();
        alert(`Failed to execute: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('❌ Error executing:', error);
      alert('Failed to execute promotion');
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Promotion Requests</h2>
            <p className="text-sm text-slate-600">Review and approve staging → production promotions</p>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <GitBranch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">No promotion requests</p>
          <p className="text-sm text-slate-600">
            {filter === 'pending' ? 'No pending requests at this time' : 'No requests match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => {
            const hasOrgApproval = request.approvals?.some(a => a.role === 'admin');
            const hasSuperApproval = request.approvals?.some(a => a.role === 'superadmin');
            const fullyApproved = request.status === 'approved-super';
            const isRejected = request.status === 'rejected';
            const isCompleted = request.status === 'completed';
            
            return (
              <div key={request.id} className="bg-white border border-slate-200 rounded-lg p-6">
                {/* Request Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">
                        {request.resourceType}: {request.resourceName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isCompleted ? 'bg-green-100 text-green-700' :
                        isRejected ? 'bg-red-100 text-red-700' :
                        fullyApproved ? 'bg-blue-100 text-blue-700' :
                        hasOrgApproval ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Requested by {request.requestedBy} on {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Status Icons */}
                  <div className="flex gap-2">
                    {hasOrgApproval && <CheckCircle className="w-5 h-5 text-green-600" title="Org Admin Approved" />}
                    {hasSuperApproval && <CheckCircle className="w-5 h-5 text-blue-600" title="SuperAdmin Approved" />}
                    {request.conflicts && request.conflicts.length > 0 && (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" title={`${request.conflicts.length} conflicts`} />
                    )}
                  </div>
                </div>
                
                {/* Changes */}
                {request.changes && request.changes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Changes ({request.changes.length}):</h4>
                    <div className="space-y-1">
                      {request.changes.slice(0, 3).map((change, idx) => (
                        <div key={idx} className="text-xs bg-slate-50 p-2 rounded">
                          <span className="font-mono text-slate-600">{change.field}</span>
                          <span className="text-slate-400 mx-2">→</span>
                          <span className="text-slate-800">{JSON.stringify(change.newValue).slice(0, 50)}...</span>
                        </div>
                      ))}
                      {request.changes.length > 3 && (
                        <p className="text-xs text-slate-500 italic">
                          + {request.changes.length - 3} more changes
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Approvals */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Approvals:</h4>
                  <div className="flex gap-4">
                    <div className={`flex items-center gap-2 ${hasOrgApproval ? 'text-green-600' : 'text-slate-400'}`}>
                      {hasOrgApproval ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span className="text-sm">Org Admin</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasSuperApproval ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasSuperApproval ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span className="text-sm">SuperAdmin</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {!isCompleted && !isRejected && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                    {fullyApproved && currentUserRole === 'superadmin' && (
                      <button
                        onClick={() => handleExecute(request.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ml-auto"
                      >
                        Execute Promotion
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

