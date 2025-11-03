/**
 * MCP Server Management Component
 * 
 * Purpose: UI for SuperAdmin to create and manage MCP servers
 * Access: SuperAdmin only
 */

import { useState, useEffect } from 'react';
import { Server, Key, Plus, Trash2, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import type { MCPServer } from '../types/mcp';

interface MCPServerManagementProps {
  userEmail: string;
  userId: string;
}

export default function MCPServerManagement({ userEmail, userId }: MCPServerManagementProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdServer, setCreatedServer] = useState<{ server: MCPServer; apiKey: string } | null>(null);

  // Only show for SuperAdmin
  const isSuperAdmin = userEmail === 'alec@getaifactory.com';

  useEffect(() => {
    if (isSuperAdmin) {
      loadServers();
    }
  }, [isSuperAdmin]);

  async function loadServers() {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/servers');
      
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isSuperAdmin) {
    return null; // Don't show to non-superadmins
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">MCP Servers</h2>
            <p className="text-sm text-slate-600">
              Model Context Protocol servers for AI assistant access
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Server
        </button>
      </div>

      {/* Server List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">
          Loading servers...
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No MCP Servers Yet
          </h3>
          <p className="text-slate-500 mb-4">
            Create your first MCP server to enable AI assistant access
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create First Server
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              onDelete={() => loadServers()}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(result) => {
            setCreatedServer(result);
            setShowCreateModal(false);
            loadServers();
          }}
          userId={userId}
        />
      )}

      {/* API Key Display Modal */}
      {createdServer && (
        <APIKeyModal
          server={createdServer.server}
          apiKey={createdServer.apiKey}
          onClose={() => setCreatedServer(null)}
        />
      )}
    </div>
  );
}

// Server Card Component
function ServerCard({ 
  server, 
  onDelete 
}: { 
  server: MCPServer; 
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}${server.endpoint}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-800">{server.name}</h3>
            {server.isActive ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                Active
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{server.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Type: <span className="font-mono text-slate-700">{server.type}</span></span>
            <span>•</span>
            <span>Domains: {server.assignedDomains.join(', ')}</span>
            <span>•</span>
            <span>Used: {server.usageCount} times</span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-600 mb-2">Available Resources:</p>
        <div className="flex flex-wrap gap-2">
          {server.resources.map(resource => (
            <span
              key={resource}
              className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-mono"
            >
              {resource}
            </span>
          ))}
        </div>
      </div>

      {/* Endpoint */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <code className="flex-1 text-xs text-slate-700 font-mono">
          {window.location.origin}{server.endpoint}
        </code>
        <button
          onClick={copyEndpoint}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
          title="Copy endpoint"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>
    </div>
  );
}

// Create Server Modal
function CreateServerModal({
  onClose,
  onSuccess,
  userId,
}: {
  onClose: () => void;
  onSuccess: (result: { server: MCPServer; apiKey: string }) => void;
  userId: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'usage-stats'>('usage-stats');
  const [domains, setDomains] = useState('getaifactory.com');
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    
    try {
      const response = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          assignedDomains: domains.split(',').map(d => d.trim()),
          resources: ['summary', 'agents', 'users', 'costs'],
          expiresInDays,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create server:', error);
      alert('Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Create MCP Server</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Usage Stats Server"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provides read-only access to usage statistics"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'usage-stats')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="usage-stats">Usage Stats (Read-Only)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Assigned Domains (comma-separated)
            </label>
            <input
              type="text"
              value={domains}
              onChange={e => setDomains(e.target.value)}
              placeholder="getaifactory.com, example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Admins from these domains can access this server
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Expires In (days)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={e => setExpiresInDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || creating}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 flex items-center gap-2"
          >
            {creating ? 'Creating...' : 'Create Server'}
          </button>
        </div>
      </div>
    </div>
  );
}

// API Key Display Modal (shown only once)
function APIKeyModal({
  server,
  apiKey,
  onClose,
}: {
  server: MCPServer;
  apiKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAPIKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyConfig = () => {
    const config = {
      mcpServers: {
        [server.name.toLowerCase().replace(/\s+/g, '-')]: {
          url: `${window.location.origin}${server.endpoint}`,
          apiKey: apiKey,
          domain: server.assignedDomains[0],
        },
      },
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-800">Server Created!</h2>
          </div>
          <p className="text-slate-600">
            Your MCP server has been created. <strong>Save the API key below - it will not be shown again.</strong>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                API Key
              </label>
              <button
                onClick={copyAPIKey}
                className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <code className="text-sm text-purple-900 font-mono break-all">
                {apiKey}
              </code>
            </div>
          </div>

          {/* Cursor Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Cursor Configuration
              </label>
              <button
                onClick={copyConfig}
                className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                <Copy className="w-4 h-4" />
                Copy Config
              </button>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <pre className="text-xs text-slate-700 overflow-x-auto">
{`{
  "mcpServers": {
    "${server.name.toLowerCase().replace(/\s+/g, '-')}": {
      "url": "${window.location.origin}${server.endpoint}",
      "apiKey": "${apiKey}",
      "domain": "${server.assignedDomains[0]}"
    }
  }
}`}
              </pre>
            </div>
            <p className="text-xs text-slate-500">
              Add this to your <code className="px-1 py-0.5 bg-slate-100 rounded">.cursor/mcp.json</code> file
            </p>
          </div>

          {/* Server Details */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Server Details
            </label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Type:</span>
                <span className="ml-2 font-mono text-slate-800">{server.type}</span>
              </div>
              <div>
                <span className="text-slate-500">Domains:</span>
                <span className="ml-2 text-slate-800">{server.assignedDomains.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-500">Resources:</span>
                <span className="ml-2 text-slate-800">{server.resources.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Expires:</span>
                <span className="ml-2 text-slate-800">
                  {server.expiresAt ? new Date(server.expiresAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                Important: Store this API key securely
              </p>
              <p className="text-xs text-yellow-800">
                This key will not be shown again. Store it in a secure location like a password manager
                or environment variable. Anyone with this key can access your MCP server data.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}








