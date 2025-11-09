// Specialist Expert Panel - Assignment-only view
// Created: 2025-11-09

import React, { useState, useEffect } from 'react';
import { Target, X, Loader2, Award, CheckCircle, RotateCcw } from 'lucide-react';

interface SpecialistExpertPanelProps {
  userId: string;
  userEmail: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SpecialistExpertPanel({
  userId, userEmail, userName, isOpen, onClose
}: SpecialistExpertPanelProps) {
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userDomain = userEmail.split('@')[1];
  
  useEffect(() => {
    if (isOpen) {
      loadAssignments();
    }
  }, [isOpen]);
  
  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expert-review/interactions?domain=${userDomain}&assignedTo=${userId}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  const pending = assignments.filter(a => a.reviewStatus === 'asignada-especialista');
  const completed = assignments.filter(a => a.reviewStatus === 'revision-especialista');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Mis Asignaciones</h2>
                <p className="text-sm text-slate-600">{userName} • Especialista</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Workload Stats */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-700">Pendientes</p>
              <p className="text-2xl font-bold text-purple-900">{pending.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-700">Completadas Este Mes</p>
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-700">Tasa Aprobación</p>
              <p className="text-2xl font-bold text-blue-600">94%</p>
            </div>
          </div>
        </div>
        
        {/* Assignments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No tienes asignaciones pendientes
              </h3>
              <p className="text-sm text-slate-500">
                Cuando un supervisor te asigne interacciones, aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        ASIGNADO A TI
                      </span>
                      {assignment.expertAssignment?.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                          ALTA PRIORIDAD
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">{assignment.title}</h4>
                  {assignment.expertAssignment?.assignmentNotes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        📝 Notas del Supervisor:
                      </p>
                      <p className="text-sm text-slate-700">{assignment.expertAssignment.assignmentNotes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => alert('Open evaluation modal')}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      Evaluar Ahora
                    </button>
                    <button
                      onClick={() => alert('Return to supervisor')}
                      className="px-4 py-2 border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50"
                    >
                      Devolver
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

