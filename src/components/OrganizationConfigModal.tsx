/**
 * Organization Configuration Modal
 * 
 * 7-tab modal for complete organization configuration:
 * 1. General (name, domains)
 * 2. Admins (manage org admins)
 * 3. Branding (logo, colors)
 * 4. Evaluation (domain configs)
 * 5. Privacy (encryption, data residency)
 * 6. Limits (quotas)
 * 7. Advanced (tenant config)
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import React, { useState } from 'react';
import { X, Building2, Users, Palette, ClipboardCheck, Shield, Gauge, Settings } from 'lucide-react';
import type { Organization, UpdateOrganizationInput } from '../types/organizations';

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: UpdateOrganizationInput) => Promise<void>;
}

type TabId = 'general' | 'admins' | 'branding' | 'evaluation' | 'privacy' | 'limits' | 'advanced';

export default function OrganizationConfigModal({ organization, isOpen, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateOrganizationInput>({
    name: organization.name,
    primaryDomain: organization.primaryDomain,
    branding: organization.branding,
    evaluationConfig: organization.evaluationConfig,
    privacy: organization.privacy,
    limits: organization.limits,
  });
  
  if (!isOpen) return null;
  
  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'admins', label: 'Admins', icon: Users },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'limits', label: 'Limits', icon: Gauge },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ] as const;
  
  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('❌ Error saving organization:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Configure Organization</h2>
              <p className="text-sm text-slate-600">{organization.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Salfa Corp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Domain
                </label>
                <select
                  value={formData.primaryDomain || organization.primaryDomain}
                  onChange={e => setFormData({ ...formData, primaryDomain: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {organization.domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  The main domain for this organization
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  All Domains
                </label>
                <div className="space-y-2">
                  {organization.domains.map(domain => (
                    <div key={domain} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded">
                      <span className="flex-1 text-sm">{domain}</span>
                      {domain === organization.primaryDomain && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Domain management via API (add/remove endpoints available)
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.branding?.brandName || ''}
                  onChange={e => setFormData({
                    ...formData,
                    branding: { ...formData.branding!, brandName: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Salfa Corp or SalfaGPT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.branding?.primaryColor || '#0066CC'}
                    onChange={e => setFormData({
                      ...formData,
                      branding: { ...formData.branding!, primaryColor: e.target.value }
                    })}
                    className="w-16 h-12 rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.branding?.primaryColor || '#0066CC'}
                    onChange={e => setFormData({
                      ...formData,
                      branding: { ...formData.branding!, primaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="#0066CC"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secondary Color (Optional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.branding?.secondaryColor || '#6B7280'}
                    onChange={e => setFormData({
                      ...formData,
                      branding: { ...formData.branding!, secondaryColor: e.target.value }
                    })}
                    className="w-16 h-12 rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.branding?.secondaryColor || ''}
                    onChange={e => setFormData({
                      ...formData,
                      branding: { ...formData.branding!, secondaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="#6B7280"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'privacy' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Encryption</h4>
                  <p className="text-sm text-blue-800">
                    Enable KMS encryption for sensitive data (extractedData, content, prompts)
                  </p>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.privacy?.encryptionEnabled || false}
                    onChange={e => setFormData({
                      ...formData,
                      privacy: { ...formData.privacy!, encryptionEnabled: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-700">Enable KMS Encryption</span>
                </label>
                <p className="text-xs text-slate-500 ml-8 mt-1">
                  Requires KMS setup. Run: <code className="bg-slate-100 px-1 py-0.5 rounded">./scripts/setup-org-encryption.sh --org={organization.id}</code>
                </p>
              </div>
              
              {organization.privacy.encryptionKeyId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Encryption Key ID
                  </label>
                  <input
                    type="text"
                    value={organization.privacy.encryptionKeyId}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'limits' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Users
                </label>
                <input
                  type="number"
                  value={formData.limits?.maxUsers || 1000}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits!, maxUsers: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Agents (per user)
                </label>
                <input
                  type="number"
                  value={formData.limits?.maxAgents || 100}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits!, maxAgents: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Storage (GB)
                </label>
                <input
                  type="number"
                  value={formData.limits?.maxStorageGB || 100}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits!, maxStorageGB: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}
          
          {/* Other tabs would be similar structures */}
          {activeTab === 'admins' && (
            <div className="text-center py-12 text-slate-500">
              Admin management UI (list admins, add/remove)
            </div>
          )}
          
          {activeTab === 'evaluation' && (
            <div className="text-center py-12 text-slate-500">
              Evaluation configuration per domain
            </div>
          )}
          
          {activeTab === 'advanced' && (
            <div className="text-center py-12 text-slate-500">
              Advanced tenant configuration (GCP project, region, service account)
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

