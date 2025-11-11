import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Globe, 
  Users, 
  CheckCircle, 
  XCircle, 
  Settings,
  Trash2,
  Shield,
  UserCog,
  FileText,
  MessageSquare,
  Share2,
  Sparkles,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

// Domain row interface (flattened from organizations)
export interface DomainRow {
  // Domain identity
  domainId: string;                     // e.g., 'getaifactory.com'
  domainName?: string;                  // Display name (optional)
  
  // Organization relationship
  organizationId: string;               // e.g., 'getai-factory'
  organizationName: string;             // e.g., 'GetAI Factory'
  isPrimaryDomain: boolean;             // Is this the primary domain for the org?
  
  // Domain Prompt (organization-level AI instructions)
  domainPrompt?: string;                // Optional prompt inherited by all agents
  
  // Status
  enabled: boolean;                     // Organization enabled status
  isActive: boolean;                    // Organization active status
  
  // Counts
  userCount: number;
  createdAgentCount: number;
  sharedAgentCount: number;
  contextCount: number;
  
  // Metadata
  createdBy: string;                    // Who created the organization
  createdAt: Date;
  updatedAt: Date;
}

interface DomainManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export default function DomainManagementModal({
  isOpen,
  onClose,
  currentUserEmail,
}: DomainManagementModalProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  
  // Create form state
  const [newDomainId, setNewDomainId] = useState('');
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainEnabled, setNewDomainEnabled] = useState(true);
  const [newDomainDescription, setNewDomainDescription] = useState('');
  
  // Batch form state
  const [batchDomainList, setBatchDomainList] = useState('');
  const [batchEnabled, setBatchEnabled] = useState(true);
  
  // Selected domain for details
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  // Load domains
  useEffect(() => {
    if (isOpen) {
      loadDomains();
    }
  }, [isOpen]);

  const loadDomains = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/domains');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load domains');
      }
      
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (err) {
      console.error('Error loading domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async () => {
    if (!newDomainId.trim()) {
      setError('Domain ID is required');
      return;
    }
    
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: newDomainId.toLowerCase().trim(),
          name: newDomainName.trim() || newDomainId.trim(),
          enabled: newDomainEnabled,
          description: newDomainDescription.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create domain');
      }
      
      // Reset form
      setNewDomainId('');
      setNewDomainName('');
      setNewDomainEnabled(true);
      setNewDomainDescription('');
      setShowCreateForm(false);
      
      // Reload domains
      await loadDomains();
    } catch (err) {
      console.error('Error creating domain:', err);
      setError(err instanceof Error ? err.message : 'Failed to create domain');
    }
  };

  const handleBatchCreate = async () => {
    if (!batchDomainList.trim()) {
      setError('Domain list is required');
      return;
    }
    
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBatch: true,
          domainList: batchDomainList,
          enabled: batchEnabled,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create domains');
      }
      
      const result = await response.json();
      
      // Reset form
      setBatchDomainList('');
      setBatchEnabled(true);
      setShowBatchForm(false);
      
      // Show result
      alert(`Created: ${result.created.length}\nFailed: ${result.failed.length}`);
      
      // Reload domains
      await loadDomains();
    } catch (err) {
      console.error('Error batch creating domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to create domains');
    }
  };

  const handleToggleEnabled = async (domainId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentStatus ? 'disable' : 'enable',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update domain');
      }
      
      // Reload domains
      await loadDomains();
    } catch (err) {
      console.error('Error toggling domain:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle domain');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm(`Are you sure you want to delete domain "${domainId}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete domain');
      }
      
      // Reload domains
      await loadDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete domain');
    }
  };

  const handleImpersonateDomain = (domain: DomainRow) => {
    // Find a user from this domain to impersonate
    alert(`Domain impersonation for ${domain.domainId}\n\nThis would allow you to act as a user from this domain.`);
    // TODO: Implement full impersonation flow
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Domain Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info banner */}
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-slate-700">
            {isSuperAdmin ? (
              <>
                <span className="font-semibold">SuperAdmin view:</span> Showing all domains from all organizations. 
                Manage domains through Organization settings.
              </>
            ) : (
              <>
                <span className="font-semibold">Admin view:</span> Showing domains from your organization(s). 
                Contact SuperAdmin to add new domains.
              </>
            )}
          </p>
        </div>

        {/* Domains table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No domains found</p>
              <p className="text-sm text-slate-400 mt-2">
                {isSuperAdmin 
                  ? 'Create organizations with domains in Organization Management' 
                  : 'Contact your SuperAdmin to configure domains'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Domain</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Created By</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Users</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Agents</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Context</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Created</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map(domain => (
                    <tr 
                      key={`${domain.organizationId}-${domain.domainId}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      {/* Dominio */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${domain.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                              {domain.domainId}
                            </span>
                            {domain.isPrimaryDomain && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Organización */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{domain.organizationName}</p>
                        <p className="text-xs text-slate-500">{domain.organizationId}</p>
                      </td>
                      
                      {/* Domain Prompt */}
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDomainPrompt(domain);
                          }}
                          className="text-left hover:bg-blue-50 rounded p-2 transition-colors w-full"
                        >
                          {domain.domainPrompt ? (
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-700 line-clamp-2">
                                  {domain.domainPrompt}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {domain.domainPrompt.length} caracteres
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-xs italic">No configurado</span>
                            </div>
                          )}
                        </button>
                      </td>
                      
                      {/* Type */}
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                          {domain.isPrimaryDomain ? 'Primary' : 'Secondary'}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          domain.enabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {domain.enabled ? (
                            <>
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 inline mr-1" />
                              Disabled
                            </>
                          )}
                        </span>
                      </td>
                      
                      {/* Users */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          domain.userCount > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Users className="w-3.5 h-3.5" />
                          {domain.userCount || 0}
                        </span>
                      </td>
                      
                      {/* Created Agents */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          domain.createdAgentCount > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          {domain.createdAgentCount || 0}
                        </span>
                      </td>
                      
                      {/* Shared Agents */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          domain.sharedAgentCount > 0
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Share2 className="w-3.5 h-3.5" />
                          {domain.sharedAgentCount || 0}
                        </span>
                      </td>
                      
                      {/* Created Date */}
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingDomainPrompt(domain)}
                            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 text-xs font-medium flex items-center gap-1"
                            title="Edit Domain Prompt"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Prompt
                          </button>
                          <button
                            onClick={() => setSelectedDomain(domain)}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="View details"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Total domains: <span className="font-semibold">{domains.length}</span>
            {' • '}
            Enabled: <span className="font-semibold text-green-600">{domains.filter(d => d.enabled).length}</span>
            {' • '}
            Disabled: <span className="font-semibold text-red-600">{domains.filter(d => !d.enabled).length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Domain details modal */}
      {selectedDomain && (
        <div 
          className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setSelectedDomain(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedDomain.organizationName}</h3>
                  <p className="text-sm text-slate-500 font-mono">{selectedDomain.domainId}</p>
                  {selectedDomain.isPrimaryDomain && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                      Primary Domain
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDomain(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Domain Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Domain Prompt
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedDomain(null);
                      setEditingDomainPrompt(selectedDomain);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                {selectedDomain.domainPrompt ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                      {selectedDomain.domainPrompt}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {selectedDomain.domainPrompt.length} caracteres
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg italic">
                    No domain prompt configured
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Status</h4>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  selectedDomain.enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedDomain.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-medium text-slate-600">Users</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{selectedDomain.userCount || 0}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-medium text-slate-600">Created Agents</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{selectedDomain.createdAgentCount || 0}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Share2 className="w-4 h-4 text-purple-600" />
                      <p className="text-xs font-medium text-slate-600">Shared Agents</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{selectedDomain.sharedAgentCount || 0}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-medium text-slate-600">Context Sources</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{selectedDomain.contextCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Organization</h4>
                  <p className="text-sm text-slate-600">{selectedDomain.organizationName}</p>
                  <p className="text-xs text-slate-500 font-mono">{selectedDomain.organizationId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Created By</h4>
                  <p className="text-sm text-slate-600">{selectedDomain.createdBy}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Created At</h4>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedDomain.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Last Updated</h4>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedDomain.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedDomain(null);
                  setEditingDomainPrompt(selectedDomain);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Edit Domain Prompt
              </button>
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Domain Prompt Editor Modal */}
      {editingDomainPrompt && (
        <DomainPromptEditorModal
          domain={editingDomainPrompt}
          onClose={() => setEditingDomainPrompt(null)}
          onSave={async (newPrompt) => {
            try {
              const response = await fetch(`/api/organizations/${editingDomainPrompt.organizationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domainPrompt: newPrompt }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save domain prompt');
              }
              
              // Reload domains to show updated prompt
              await loadDomains();
              setEditingDomainPrompt(null);
            } catch (err) {
              console.error('Error saving domain prompt:', err);
              setError(err instanceof Error ? err.message : 'Failed to save domain prompt');
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Domain Prompt Editor Modal
 * Allows editing the organization-level prompt for a domain
 */
function DomainPromptEditorModal({
  domain,
  onClose,
  onSave,
}: {
  domain: DomainRow;
  onClose: () => void;
  onSave: (prompt: string) => Promise<void>;
}) {
  const [domainPrompt, setDomainPrompt] = useState(domain.domainPrompt || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useModalClose(true, onClose, true, true, true);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(domainPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Configuración de Dominio
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {domain.organizationName}
            </p>
            <p className="text-xs text-slate-500">
              ID: {domain.organizationId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  ¿Qué es el Prompt de Dominio?
                </p>
                <p className="text-sm text-blue-700">
                  El prompt de dominio define el contexto, políticas y comportamiento compartido por{' '}
                  <strong>todos los agentes de tu organización</strong>. Se combina automáticamente con 
                  los prompts específicos de cada agente.
                </p>
              </div>
            </div>
          </div>

          {/* Hierarchy Visualization */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 mb-3">
              Jerarquía de Prompts:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1 bg-white border border-blue-200 rounded p-2">
                  <span className="font-medium text-blue-700">Prompt de Dominio</span>
                  <span className="text-xs text-slate-500 ml-2">(Nivel Organización)</span>
                </div>
              </div>
              <div className="ml-4 w-0.5 h-4 bg-slate-300" />
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <div className="flex-1 bg-white border border-green-200 rounded p-2">
                  <span className="font-medium text-green-700">Prompt del Agente</span>
                  <span className="text-xs text-slate-500 ml-2">(Específico de cada agente)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Prompt Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prompt de Dominio
            </label>
            <textarea
              value={domainPrompt}
              onChange={(e) => setDomainPrompt(e.target.value)}
              placeholder="Ejemplo:&#10;&#10;Somos [Nombre de Organización], una empresa de [sector].&#10;&#10;Valores corporativos:&#10;- Excelencia en el servicio&#10;- Transparencia&#10;- Innovación&#10;&#10;Políticas importantes:&#10;- Siempre confirmar disponibilidad antes de comprometer fechas&#10;- Escalar a supervisor si el monto > $10,000&#10;- Usar lenguaje profesional pero cercano"
              className="w-full h-80 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              {domainPrompt.length} caracteres • Este prompt se aplicará a todos los agentes de la organización
            </p>
          </div>

          {/* Examples */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              💡 Sugerencias para el Prompt de Dominio:
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Define quién es la organización y qué hace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Especifica valores corporativos y tono de comunicación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Incluye políticas importantes que TODOS los agentes deben seguir</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Menciona limitaciones o restricciones generales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Define el formato de respuesta preferido (opcional)</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Prompt de Dominio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

