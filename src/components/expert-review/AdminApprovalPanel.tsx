// Admin Approval Panel - Review and approve expert corrections
// Created: 2025-11-09

import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Loader2, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface AdminApprovalPanelProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminApprovalPanel({
  userId, userEmail, isOpen, onClose
}: AdminApprovalPanelProps) {
  
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userDomain = userEmail.split('@')[1];
  
  useEffect(() => {
    if (isOpen) {
      loadPendingApprovals();
    }
  }, [isOpen]);
  
  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expert-review/interactions?domain=${userDomain}&status=corregida-propuesta`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (ticketId: string) => {
    if (!confirm('¿Aprobar esta corrección para aplicar a los agentes?')) return;
    
    try {
      // TODO: Call approve API
      alert(`Corrección ${ticketId} aprobada - Se aplicará a los agentes del domain`);
      loadPendingApprovals();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Aprobar Correcciones</h2>
                <p className="text-sm text-slate-600">Domain: {userDomain}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Pending Count */}
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm font-semibold text-yellow-900">
            ⏳ {pendingApprovals.length} correcciones pendientes de aprobación
          </p>
        </div>
        
        {/* Approvals List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No hay correcciones pendientes de aprobación
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((correction) => (
                <div key={correction.id} className="bg-white border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-slate-900 mb-2">{correction.title}</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Propuesto por: {correction.correctionProposal?.proposedByEmail}
                      </p>
                      
                      {/* Impact Preview */}
                      {correction.impactAnalysis && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <p className="text-xs font-semibold text-blue-900 mb-2">📊 IMPACTO PROYECTADO</p>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-blue-700">Preguntas</p>
                              <p className="text-lg font-bold text-blue-900">
                                {correction.impactAnalysis.similarQuestionsCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700">Mejora</p>
                              <p className="text-lg font-bold text-green-600">
                                +{correction.impactAnalysis.projectedRatingImprovement}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700">Ahorro/mes</p>
                              <p className="text-lg font-bold text-purple-600">
                                {correction.impactAnalysis.estimatedTimeSavings}h
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-700">Riesgo</p>
                              <p className={`text-lg font-bold ${
                                correction.impactAnalysis.riskLevel === 'high' ? 'text-red-600' :
                                correction.impactAnalysis.riskLevel === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {correction.impactAnalysis.riskLevel?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Proposed Correction */}
                      {correction.correctionProposal?.correctedText && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-slate-700 mb-1">Corrección Propuesta:</p>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">
                            {correction.correctionProposal.correctedText.substring(0, 300)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(correction.id)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Aprobar y Aplicar
                    </button>
                    <button
                      onClick={() => alert('Reject modal')}
                      className="px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => alert('Request changes modal')}
                      className="px-6 py-3 border-2 border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 font-semibold"
                    >
                      Solicitar Cambios
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

