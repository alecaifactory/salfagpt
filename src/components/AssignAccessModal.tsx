import React, { useState } from 'react';
import { X, Shield, Users, User, Calendar, Clock, Save } from 'lucide-react';
import type { ContextOverview, Group } from '../types/contextAccess';
import { useModalClose } from '../hooks/useModalClose';

interface AssignAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  contexts: ContextOverview[];
  groups: Group[];
  onAssignAccess: (
    contextId: string,
    targetType: 'user' | 'group',
    targetId: string,
    permissions: string[],
    expiresAt?: Date,
    duration?: number
  ) => void;
}

export default function AssignAccessModal({
  isOpen,
  onClose,
  contexts,
  groups,
  onAssignAccess,
}: AssignAccessModalProps) {
  const [selectedContext, setSelectedContext] = useState('');
  const [targetType, setTargetType] = useState<'user' | 'group'>('group');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [duration, setDuration] = useState(30); // days

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetId = targetType === 'user' ? userEmail : selectedTarget;
    
    if (selectedContext && targetId && permissions.length > 0) {
      const expiresAt = hasExpiration && expirationDate 
        ? new Date(expirationDate) 
        : undefined;
      
      onAssignAccess(
        selectedContext,
        targetType,
        targetId,
        permissions,
        expiresAt,
        duration
      );
      
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedContext('');
    setTargetType('group');
    setSelectedTarget('');
    setUserEmail('');
    setPermissions(['read']);
    setHasExpiration(false);
    setExpirationDate('');
    setDuration(30);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const togglePermission = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Asignar Acceso a Contexto</h2>
              <p className="text-sm text-green-100 mt-0.5">Controla quién puede ver y usar este contexto</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Select Context */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seleccionar Contexto *
            </label>
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un contexto --</option>
              {contexts.map((context) => (
                <option key={context.id} value={context.id}>
                  {context.name} ({context.type})
                </option>
              ))}
            </select>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Asignar a *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('group')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  targetType === 'group'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Users className={`w-5 h-5 mb-2 ${targetType === 'group' ? 'text-green-600' : 'text-slate-400'}`} />
                <p className="font-semibold text-slate-800">Grupo</p>
                <p className="text-xs text-slate-600 mt-1">Asignar a un equipo</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('user')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  targetType === 'user'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <User className={`w-5 h-5 mb-2 ${targetType === 'user' ? 'text-green-600' : 'text-slate-400'}`} />
                <p className="font-semibold text-slate-800">Usuario</p>
                <p className="text-xs text-slate-600 mt-1">Asignar a una persona</p>
              </button>
            </div>
          </div>

          {/* Target Selection */}
          {targetType === 'group' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seleccionar Grupo *
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Selecciona un grupo --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.memberIds.length} miembros)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email del Usuario *
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Permisos *
            </label>
            <div className="space-y-2">
              {[
                { id: 'read', label: 'Ver Contexto', desc: 'Puede ver y usar este contexto en sus conversaciones' },
                { id: 'write', label: 'Editar Contexto', desc: 'Puede modificar el contenido del contexto' },
                { id: 'share', label: 'Compartir', desc: 'Puede compartir este contexto con otros' },
                { id: 'delete', label: 'Eliminar', desc: 'Puede eliminar este contexto (peligroso)' },
              ].map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{perm.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{perm.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-slate-700">Establecer fecha de expiración</span>
            </label>

            {hasExpiration && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de Expiración
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              🔒 <strong>Seguridad:</strong> Los permisos se pueden revocar en cualquier momento desde el panel de gestión.
              {hasExpiration && ' El acceso expirará automáticamente en la fecha seleccionada.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedContext || (!selectedTarget && !userEmail) || permissions.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              Asignar Acceso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

