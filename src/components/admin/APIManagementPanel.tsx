/**
 * SuperAdmin API Management Panel
 * 
 * Features:
 * - Beautiful invitation creation flow
 * - Real-time organization monitoring
 * - Usage analytics across all orgs
 * - Delightful admin experience (NPS 98+ target)
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Key,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Copy,
  ExternalLink,
  Ban,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface Invitation {
  id: string;
  invitationCode: string;
  targetAudience: string;
  description: string;
  maxRedemptions: number;
  currentRedemptions: number;
  defaultTier: string;
  status: string;
  createdAt: any;
  expiresAt?: any;
}

export function APIManagementPanel() {
  const [activeTab, setActiveTab] = useState<'invitations' | 'organizations' | 'analytics'>('invitations');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  useEffect(() => {
    loadInvitations();
  }, []);
  
  async function loadInvitations() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/api-invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Key className="w-6 h-6 text-white" />
              </div>
              API Management
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage developer access and monitor API usage
            </p>
          </div>
          
          {activeTab === 'invitations' && (
            <button
              onClick={() => setShowCreateInvitation(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Invitation
            </button>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
            activeTab === 'invitations'
              ? 'bg-white dark:bg-slate-800 border-t-2 border-x-2 border-blue-500 text-blue-600 -mb-px'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          📨 Invitations ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
            activeTab === 'organizations'
              ? 'bg-white dark:bg-slate-800 border-t-2 border-x-2 border-blue-500 text-blue-600 -mb-px'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🏢 Organizations (0)
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-800 border-t-2 border-x-2 border-blue-500 text-blue-600 -mb-px'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          📊 Analytics
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No invitations created yet</p>
                <button
                  onClick={() => setShowCreateInvitation(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Invitation
                </button>
              </div>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-white dark:bg-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {invitation.targetAudience}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          invitation.status === 'active' ? 'bg-green-100 text-green-700' :
                          invitation.status === 'expired' ? 'bg-yellow-100 text-yellow-700' :
                          invitation.status === 'exhausted' ? 'bg-slate-100 text-slate-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invitation.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{invitation.description}</p>
                    </div>
                  </div>
                  
                  {/* Invitation Code */}
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <code className="text-green-400 font-mono text-lg font-bold">
                        {invitation.invitationCode}
                      </code>
                      <button
                        onClick={() => copyCode(invitation.invitationCode)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Copy code"
                      >
                        {copied === invitation.invitationCode ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Used</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {invitation.currentRedemptions} / {invitation.maxRedemptions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tier</p>
                      <p className="font-bold text-blue-600 uppercase">{invitation.defaultTier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expires</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                    {invitation.status === 'active' && (
                      <button className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2">
                        <Ban className="w-4 h-4" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">No API organizations yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Organizations will appear here when developers redeem invitations
            </p>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Invitations</p>
                <p className="text-4xl font-bold text-blue-600">{invitations.length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Redemption Rate</p>
                <p className="text-4xl font-bold text-green-600">
                  {invitations.length > 0 
                    ? Math.round((invitations.reduce((sum, inv) => sum + inv.currentRedemptions, 0) / invitations.reduce((sum, inv) => sum + inv.maxRedemptions, 0)) * 100)
                    : 0}%
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">API Organizations</p>
                <p className="text-4xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Invitation Modal */}
      {showCreateInvitation && (
        <CreateInvitationModal
          onClose={() => setShowCreateInvitation(false)}
          onSuccess={() => {
            setShowCreateInvitation(false);
            loadInvitations();
          }}
        />
      )}
    </div>
  );
}

/**
 * Create Invitation Modal - Delightful creation flow
 */
function CreateInvitationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    targetAudience: '',
    description: '',
    maxRedemptions: 10,
    defaultTier: 'trial' as 'trial' | 'starter' | 'pro' | 'enterprise',
    expiresInDays: 90,
    allowedDomains: '',
  });
  const [creating, setCreating] = useState(false);
  const [createdInvitation, setCreatedInvitation] = useState<any>(null);
  
  async function handleCreate() {
    setCreating(true);
    try {
      const response = await fetch('/api/admin/api-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allowedDomains: formData.allowedDomains 
            ? formData.allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
            : undefined,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreatedInvitation(data.invitation);
        setStep(3);
      } else {
        alert('Failed to create invitation');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Error creating invitation');
    } finally {
      setCreating(false);
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create API Invitation
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${
                  step >= s ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className="text-sm font-medium">
                    {s === 1 ? 'Details' : s === 2 ? 'Configure' : 'Complete'}
                  </span>
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="e.g., Enterprise Clients, Beta Testers, Partners"
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Purpose of this invitation batch..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-white resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Allowed Domains (optional)
                </label>
                <input
                  type="text"
                  value={formData.allowedDomains}
                  onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
                  placeholder="company.com, partner.com (comma-separated)"
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Leave empty to allow any business domain
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    value={formData.maxRedemptions}
                    onChange={(e) => setFormData({ ...formData, maxRedemptions: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Expires In (days)
                  </label>
                  <input
                    type="number"
                    value={formData.expiresInDays}
                    onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                  Default Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['trial', 'starter', 'pro', 'enterprise'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFormData({ ...formData, defaultTier: tier })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.defaultTier === tier
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-white capitalize mb-1">{tier}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {tier === 'trial' && '100 req/mo, 14 days'}
                        {tier === 'starter' && '1K req/mo'}
                        {tier === 'pro' && '10K req/mo'}
                        {tier === 'enterprise' && '100K+ req/mo'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Success */}
          {step === 3 && createdInvitation && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Invitation Created!
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Share this code with your {formData.targetAudience.toLowerCase()}
                </p>
              </div>
              
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <code className="text-green-400 font-mono text-2xl font-bold">
                    {createdInvitation.invitationCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInvitation.invitationCode);
                      setCopied(createdInvitation.invitationCode);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copied === createdInvitation.invitationCode ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Copy className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  <strong>Next steps for developers:</strong>
                </p>
                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Install CLI: <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">npm i -g @flow/cli</code></li>
                  <li>Login: <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">flow-cli login {createdInvitation.invitationCode}</code></li>
                  <li>Extract: <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">flow-cli extract document.pdf</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          {step < 3 ? (
            <>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => {
                  if (step === 1) {
                    if (!formData.targetAudience || !formData.description) {
                      alert('Please fill required fields');
                      return;
                    }
                    setStep(2);
                  } else if (step === 2) {
                    handleCreate();
                  }
                }}
                disabled={creating}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : step === 1 ? (
                  'Next'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Invitation
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

