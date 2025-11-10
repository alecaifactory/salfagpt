// SuperAdmin Domain Assignment Panel
// SuperAdmin assigns domains to Admins
// STEP 1 before admins can configure experts

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Plus,
  X, 
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Building2
} from 'lucide-react';

interface DomainAdminAssignment {
  id: string;
  adminUserId: string;
  adminEmail: string;
  adminName: string;
  assignedDomains: string[];
  assignedAt: Date;
  isActive: boolean;
}

interface SuperAdminDomainAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SuperAdminDomainAssignment({
  isOpen,
  onClose,
  userId
}: SuperAdminDomainAssignmentProps) {
  
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<DomainAdminAssignment[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  
  // Add assignment state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      loadAssignments();
      loadAvailableAdmins();
      loadAvailableDomains();
    }
  }, [isOpen]);
  
  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/expert-review/domain-assignments');
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
        console.log('✅ Loaded domain assignments:', data.length);
      }
      
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAvailableAdmins = async () => {
    try {
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const users = await response.json();
        const admins = users.filter((u: any) => u.role === 'admin' && u.isActive);
        setAvailableAdmins(admins);
      }
    } catch (error) {
      console.error('❌ Error loading admins:', error);
    }
  };
  
  const loadAvailableDomains = async () => {
    try {
      const response = await fetch('/api/domains?activeOnly=true');
      
      if (response.ok) {
        const data = await response.json();
        const domains = data.domains || [];
        setAvailableDomains(domains.map((d: any) => d.id || d.name || d));
      }
    } catch (error) {
      console.error('❌ Error loading domains:', error);
    }
  };
  
  const assignDomains = async () => {
    if (!selectedAdminId || selectedDomains.length === 0) {
      alert('Selecciona un admin y al menos un dominio');
      return;
    }
    
    const admin = availableAdmins.find(a => a.id === selectedAdminId);
    if (!admin) return;
    
    try {
      const response = await fetch('/api/expert-review/assign-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: admin.id,
          adminEmail: admin.email,
          adminName: admin.name,
          domains: selectedDomains,
          assignedBy: userId
        })
      });
      
      if (response.ok) {
        await loadAssignments();
        setShowAddForm(false);
        setSelectedAdminId('');
        setSelectedDomains([]);
        console.log('✅ Domains assigned');
      }
    } catch (error) {
      console.error('❌ Error assigning domains:', error);
      alert('Error al asignar dominios');
    }
  };
  
  const removeDomain = async (adminId: string, domain: string) => {
    if (!confirm(`¿Remover acceso de ${domain}?`)) return;
    
    try {
      const response = await fetch('/api/expert-review/remove-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: adminId,
          domain
        })
      });
      
      if (response.ok) {
        await loadAssignments();
        console.log('✅ Domain removed');
      }
    } catch (error) {
      console.error('❌ Error removing domain:', error);
    }
  };
  
  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Asignación de Dominios a Admins
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                SuperAdmin - Configuración Multi-Dominio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        {/* Info Box */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Paso 1:</strong> Asigna dominios a cada Admin. Luego, cada Admin podrá configurar 
            supervisores y especialistas solo para sus dominios asignados.
          </p>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Add Assignment Form */}
            {showAddForm && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Asignar Dominios a Admin
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedAdminId('');
                      setSelectedDomains([]);
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Select Admin */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Seleccionar Admin
                    </label>
                    <select
                      value={selectedAdminId}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">Selecciona un admin...</option>
                      {availableAdmins.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} ({admin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Select Domains */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Seleccionar Dominios
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                      {availableDomains.map(domain => (
                        <label
                          key={domain}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                            selectedDomains.includes(domain)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDomains.includes(domain)}
                            onChange={() => toggleDomain(domain)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {domain}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Selecciona los dominios que este admin podrá gestionar
                    </p>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedAdminId('');
                        setSelectedDomains([]);
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={assignDomains}
                      disabled={!selectedAdminId || selectedDomains.length === 0}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Asignar Dominios
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Asignar Dominios a Admin
              </button>
            )}
            
            {/* Assignments List */}
            {assignments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">
                  No hay asignaciones de dominio
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Asigna dominios a admins para que puedan configurar expertos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Admins y Sus Dominios Asignados ({assignments.length})
                </h3>
                
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {/* Admin Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {assignment.adminName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {assignment.adminName}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {assignment.adminEmail}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                        {assignment.assignedDomains.length} dominios
                      </span>
                    </div>
                    
                    {/* Assigned Domains */}
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Dominios Asignados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.assignedDomains.map(domain => (
                          <div
                            key={domain}
                            className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                          >
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {domain}
                            </span>
                            <button
                              onClick={() => removeDomain(assignment.adminUserId, domain)}
                              className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Remover dominio"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Meta Info */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Asignado: {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Una vez asignados, los admins podrán configurar expertos para sus dominios
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

