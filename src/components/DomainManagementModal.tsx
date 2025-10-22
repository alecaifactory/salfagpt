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
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

export interface Domain {
  id: string;
  name: string;
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  allowedAgents: string[];
  allowedContextSources: string[];
  userCount?: number;
  description?: string;
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

  const handleImpersonateDomain = (domain: Domain) => {
    // Find a user from this domain to impersonate
    alert(`Domain impersonation for ${domain.id}\n\nThis would allow you to act as a user from this domain.`);
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

        {/* Action buttons */}
        <div className="p-6 border-b border-slate-200 flex gap-3">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowBatchForm(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Domain
          </button>
          <button
            onClick={() => {
              setShowBatchForm(true);
              setShowCreateForm(false);
            }}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Batch Create
          </button>
          <button
            onClick={loadDomains}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Domain</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Domain ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newDomainId}
                  onChange={(e) => setNewDomainId(e.target.value)}
                  placeholder="getaifactory.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="GetAI Factory"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDomainDescription}
                  onChange={(e) => setNewDomainDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newDomainEnabled"
                  checked={newDomainEnabled}
                  onChange={(e) => setNewDomainEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="newDomainEnabled" className="text-sm text-slate-700">
                  Enable domain immediately
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateDomain}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Batch create form */}
        {showBatchForm && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Create Domains</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comma-separated domain list <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={batchDomainList}
                  onChange={(e) => setBatchDomainList(e.target.value)}
                  placeholder="getaifactory.com, salfagestion.cl, example.com"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Separate domains with commas. Spaces will be trimmed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchEnabled"
                  checked={batchEnabled}
                  onChange={(e) => setBatchEnabled(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                />
                <label htmlFor="batchEnabled" className="text-sm text-slate-700">
                  Enable all domains immediately
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleBatchCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Create All
              </button>
              <button
                onClick={() => setShowBatchForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Domains table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No domains configured yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Create your first domain
              </button>
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
                      key={domain.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedDomain(domain)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${domain.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium text-slate-800">{domain.name}</p>
                            <p className="text-xs text-slate-500">{domain.id}</p>
                            {domain.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{domain.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{domain.createdBy}</td>
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
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-slate-600">
                          <Users className="w-4 h-4" />
                          {domain.userCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-slate-600">
                          <MessageSquare className="w-4 h-4" />
                          {domain.allowedAgents.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-slate-600">
                          <FileText className="w-4 h-4" />
                          {domain.allowedContextSources.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleEnabled(domain.id, domain.enabled)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              domain.enabled
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={domain.enabled ? 'Disable domain' : 'Enable domain'}
                          >
                            {domain.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleImpersonateDomain(domain)}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-medium flex items-center gap-1"
                            title="Impersonate domain"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            Impersonate
                          </button>
                          <button
                            onClick={() => setSelectedDomain(domain)}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="View details"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete domain"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  <h3 className="text-xl font-bold text-slate-800">{selectedDomain.name}</h3>
                  <p className="text-sm text-slate-500">{selectedDomain.id}</p>
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

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
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
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">User Count</h4>
                  <p className="text-sm text-slate-600">{selectedDomain.userCount || 0} users</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Last Updated</h4>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedDomain.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Allowed Agents */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Allowed Agents ({selectedDomain.allowedAgents.length})
                </h4>
                {selectedDomain.allowedAgents.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    No agents assigned. Users in this domain can access all agents.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDomain.allowedAgents.map((agentId) => (
                      <div key={agentId} className="p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                        <span className="text-sm text-slate-700">{agentId}</span>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/domains/${selectedDomain.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'removeAgent', agentId }),
                              });
                              loadDomains();
                              setSelectedDomain(null);
                            } catch (err) {
                              setError('Failed to remove agent');
                            }
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allowed Context Sources */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Allowed Context Sources ({selectedDomain.allowedContextSources.length})
                </h4>
                {selectedDomain.allowedContextSources.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    No context sources assigned. Users in this domain can access all context sources.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDomain.allowedContextSources.map((sourceId) => (
                      <div key={sourceId} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                        <span className="text-sm text-slate-700">{sourceId}</span>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/domains/${selectedDomain.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'removeContext', contextSourceId: sourceId }),
                              });
                              loadDomains();
                              setSelectedDomain(null);
                            } catch (err) {
                              setError('Failed to remove context source');
                            }
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => handleImpersonateDomain(selectedDomain)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
              >
                <UserCog className="w-4 h-4" />
                Impersonate Domain
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
    </div>
  );
}

