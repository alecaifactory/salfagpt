/**
 * API Key Management Component
 * 
 * SuperAdmin-only interface for creating and managing Flow API keys
 */

import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  keyPreview: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  assignedTo: string;
  domain: string;
  permissions: {
    canReadUsageStats: boolean;
  };
  requestCount: number;
  lastUsedAt?: string;
  description?: string;
}

export default function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<{
    name: string;
    assignedTo: string;
    domain: string;
    expiresInDays: number | null;
    description: string;
  }>({
    name: '',
    assignedTo: '',
    domain: '',
    expiresInDays: 90,
    description: '',
  });
  const [createdKeyData, setCreatedKeyData] = useState<{
    key: string;
    name: string;
  } | null>(null);
  
  // Load API keys
  useEffect(() => {
    loadAPIKeys();
  }, []);
  
  async function loadAPIKeys() {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/api-keys');
      
      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }
      
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      alert('Error loading API keys');
    } finally {
      setLoading(false);
    }
  }
  
  async function createAPIKey() {
    if (!newKey.name || !newKey.assignedTo || !newKey.domain) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const response = await fetch('/api/superadmin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create API key');
      }
      
      const data = await response.json();
      
      // Show the generated key (only time it's visible)
      setCreatedKeyData({
        key: data.apiKey.key,
        name: data.apiKey.name,
      });
      
      // Reload keys list
      await loadAPIKeys();
      
      // Reset form
      setNewKey({
        name: '',
        assignedTo: '',
        domain: '',
        expiresInDays: 90,
        description: '',
      });
      
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Error creating API key');
    }
  }
  
  async function revokeAPIKey(apiKeyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/superadmin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }
      
      await loadAPIKeys();
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Error revoking API key');
    }
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" />
            API Key Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage API keys for Flow CLI access
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>
      
      {/* API Keys List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Assigned To</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Domain</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Key Preview</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Expires</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Usage</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No API keys created yet
                  </td>
                </tr>
              ) : (
                apiKeys.map(key => (
                  <tr key={key.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{key.name}</p>
                        {key.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{key.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{key.assignedTo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {key.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                        ••••{key.keyPreview}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {key.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {key.expiresAt ? (
                        <span className={
                          new Date(key.expiresAt) < new Date()
                            ? 'text-red-600 font-semibold'
                            : 'text-slate-600'
                        }>
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">{key.requestCount}</p>
                        {key.lastUsedAt && (
                          <p className="text-slate-500">
                            {new Date(key.lastUsedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {key.isActive && (
                          <button
                            onClick={() => revokeAPIKey(key.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Revoke key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Create New API Key</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Key Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="e.g., Production CLI Key"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assigned To (Admin Email) <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={newKey.assignedTo}
                  onChange={(e) => setNewKey({ ...newKey, assignedTo: e.target.value })}
                  placeholder="admin@mydomain.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Domain */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Domain <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newKey.domain}
                  onChange={(e) => setNewKey({ ...newKey, domain: e.target.value })}
                  placeholder="@mydomain.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This key will only have access to this domain's data
                </p>
              </div>
              
              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  value={newKey.expiresInDays || ''}
                  onChange={(e) => setNewKey({ 
                    ...newKey, 
                    expiresInDays: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="90 (recommended)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty for keys that never expire (not recommended)
                </p>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  placeholder="Purpose of this key..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedKeyData(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAPIKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Created Key Display Modal */}
      {createdKeyData && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">API Key Created!</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800">Save this key securely!</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is the only time you'll see the full API key. Store it in a password manager or secure location.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key for: {createdKeyData.name}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-slate-100 rounded-lg text-sm font-mono border border-slate-300 overflow-x-auto">
                    {createdKeyData.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKeyData.key)}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Quick Start:</p>
                <code className="block px-3 py-2 bg-white rounded border border-blue-200 text-xs font-mono">
                  flow login {createdKeyData.key}
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  Or with npx (no install):
                </p>
                <code className="block px-3 py-2 bg-white rounded border border-blue-200 text-xs font-mono mt-1">
                  npx @flow-ai/cli login {createdKeyData.key}
                </code>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setCreatedKeyData(null);
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">API Key Security</p>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>API keys are hashed (SHA-256) before storage</li>
              <li>Full key is shown only once after creation</li>
              <li>Set expiration dates for enhanced security (90 days recommended)</li>
              <li>Revoke keys immediately if compromised</li>
              <li>Monitor usage in the table above</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}





