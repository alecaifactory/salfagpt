/**
 * Organization Management Dashboard
 * 
 * SuperAdmin interface for managing all organizations
 * Features:
 * - List all organizations
 * - Create new organization
 * - Edit organization (7-tab modal)
 * - View organization statistics
 * - Manage domains
 * - Manage admins
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  BarChart3,
  Globe,
  Shield,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import type { Organization, OrganizationStats, UpdateOrganizationInput } from '../types/organizations';
import OrganizationConfigModal from './OrganizationConfigModal';

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export default function OrganizationManagementDashboard({ 
  currentUserId, 
  currentUserRole 
}: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [orgStats, setOrgStats] = useState<Record<string, OrganizationStats>>({});
  
  // Load organizations
  useEffect(() => {
    loadOrganizations();
  }, []);
  
  async function loadOrganizations() {
    try {
      setLoading(true);
      
      console.log('📊 OrganizationManagementDashboard - Loading organizations...');
      
      const response = await fetch('/api/organizations', {
        credentials: 'include' // ✅ Include cookies for authentication
      });
      
      console.log('📊 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Organizations loaded:', {
        count: data.count,
        userRole: data.userRole,
        organizations: data.organizations?.map((o: any) => ({ id: o.id, name: o.name }))
      });
      
      setOrganizations(data.organizations || []);
      
      // ✅ OPTIMIZATION: Don't load stats on initial render
      // Stats will load on-demand when user hovers over org card
      console.log('✅ Organizations loaded. Stats will load on-demand.');
      
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      alert(`Failed to load organizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadOrgStats(orgId: string) {
    try {
      console.log(`📊 Loading stats for ${orgId}...`);
      const startTime = Date.now();
      
      // ✅ OPTIMIZATION: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/organizations/${orgId}/stats`, {
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Stats loaded for ${orgId} in ${duration}ms`);
        setOrgStats(prev => ({ ...prev, [orgId]: data.stats }));
      } else {
        console.warn(`⚠️ Stats not available for org ${orgId} (${response.status}) after ${duration}ms`);
        setOrgStats(prev => ({ ...prev, [orgId]: null }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`❌ Stats request timeout for org ${orgId} (>10s)`);
      } else {
        console.error(`❌ Error loading org stats for ${orgId}:`, error);
      }
      setOrgStats(prev => ({ ...prev, [orgId]: null }));
    }
  }
  
  // Helper to create new empty organization object
  function createEmptyOrg(): Organization {
    return {
      id: `org-${Date.now()}`,
      name: 'New Organization',
      domains: [],
      primaryDomain: '',
      admins: [currentUserId],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUserId,
      tenant: {
        type: 'saas',
      },
      branding: {
        brandName: 'New Organization',
        primaryColor: '#0066CC',
      },
      evaluationConfig: {
        enabled: false,
        domainConfigs: {},
      },
      privacy: {
        encryptionEnabled: false,
      },
      limits: {
        maxUsers: 1000,
        maxAgents: 100,
        maxStorageGB: 100,
      },
      profile: {},
      version: 1,
    };
  }
  
  async function handleSaveOrganization(updates: UpdateOrganizationInput) {
    if (!selectedOrg) return;
    
    try {
      console.log('💾 Saving organization:', selectedOrg.id, updates);
      
      // Detect if this is a new organization (starts with org-)
      const isNew = selectedOrg.id.startsWith('org-');
      
      const response = await fetch(
        isNew ? '/api/organizations' : `/api/organizations/${selectedOrg.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save organization');
      }
      
      const data = await response.json();
      
      console.log('✅ Organization saved:', data);
      
      // Update local state
      if (isNew) {
        setOrganizations(prev => [data.organization, ...prev]);
      } else {
        setOrganizations(prev => 
          prev.map(org => org.id === selectedOrg.id ? data.organization : org)
        );
      }
      
      // ✅ Update selectedOrg so modal shows fresh data on reopen
      setSelectedOrg(data.organization);
      
      // Reload stats
      await loadOrgStats(data.organization.id);
      
    } catch (error) {
      console.error('❌ Error saving organization:', error);
      throw error; // Re-throw to let modal handle it
    }
  }
  
  // Filter organizations by search
  const filteredOrgs = organizations.filter(org => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.domains?.some(d => d.toLowerCase().includes(query)) ||
      org.id.toLowerCase().includes(query)
    );
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading organizations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Organizations</h2>
            <p className="text-xs text-slate-600">
              Manage multi-tenant organizations and their configurations
            </p>
          </div>
        </div>
        
        {currentUserRole === 'superadmin' && (
          <button
            onClick={() => {
              setSelectedOrg(createEmptyOrg());
              setShowConfigModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Organization
          </button>
        )}
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search organizations, domains..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Organizations Grid */}
      {filteredOrgs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            {searchQuery ? 'No organizations found' : 'No organizations yet'}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Create your first organization to get started'}
          </p>
          {currentUserRole === 'superadmin' && !searchQuery && (
            <button
              onClick={() => {
                setSelectedOrg(createEmptyOrg());
                setShowConfigModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Organization
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map(org => {
            const stats = orgStats[org.id];
            
            return (
              <div
                key={org.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Org Header */}
                <div 
                  className="p-4 border-b border-slate-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${org.branding?.primaryColor || '#0066CC'}15, ${org.branding?.primaryColor || '#0066CC'}05)` 
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-800">
                        {org.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {org.id}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {org.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-600" title="Active" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" title="Inactive" />
                      )}
                      
                      {org.privacy?.encryptionEnabled && (
                        <Shield className="w-5 h-5 text-blue-600" title="Encryption Enabled" />
                      )}
                    </div>
                  </div>
                  
                  {/* Domains */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(org.domains || []).map(domain => (
                      <span
                        key={domain}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          domain === org.primaryDomain
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {domain}
                        {domain === org.primaryDomain && ' ⭐'}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* ✅ OPTIMIZATION: Skip stats for now - too slow */}
                <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-200">
                  <span className="text-slate-400">Click "View" for detailed analytics</span>
                </div>
                
                {/* Actions */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowConfigModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowStatsModal(true);
                      // Load stats when opening modal
                      if (!orgStats[org.id]) {
                        loadOrgStats(org.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Summary Stats */}
      {organizations.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-blue-900 mb-2">
            Platform Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-blue-700 mb-0.5">Total Organizations</p>
              <p className="text-lg font-bold text-blue-900">{organizations.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-700 mb-0.5">Active Organizations</p>
              <p className="text-lg font-bold text-blue-900">
                {organizations.filter(o => o.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-blue-700 mb-0.5">Total Domains</p>
              <p className="text-lg font-bold text-blue-900">
                {organizations.reduce((sum, o) => sum + (o.domains?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-blue-700 mb-0.5">Encrypted Orgs</p>
              <p className="text-lg font-bold text-blue-900">
                {organizations.filter(o => o.privacy?.encryptionEnabled).length}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Organization Config Modal */}
      {showConfigModal && selectedOrg && (
        <OrganizationConfigModal
          organization={selectedOrg}
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedOrg(null);
          }}
          onSave={handleSaveOrganization}
        />
      )}
      
      {/* Organization Stats Modal */}
      {showStatsModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Organization Analytics</h2>
                  <p className="text-sm text-slate-600">{selectedOrg.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedOrg(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Stats Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {orgStats[selectedOrg.id] ? (
                <div className="space-y-6">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Users</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {orgStats[selectedOrg.id].totalUsers}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {orgStats[selectedOrg.id].activeUsers} active
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Agents</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {orgStats[selectedOrg.id].totalAgents}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {orgStats[selectedOrg.id].activeAgents} active
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Sources</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {orgStats[selectedOrg.id].totalContextSources}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        {orgStats[selectedOrg.id].validatedSources} validated
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💰</span>
                        <span className="text-sm font-medium text-amber-900">Est. Cost</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-600">
                        ${orgStats[selectedOrg.id].estimatedMonthlyCost?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">per month</p>
                    </div>
                  </div>
                  
                  {/* Organization Details */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Organization Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 mb-1">Organization ID</p>
                        <p className="font-mono text-xs text-slate-800">{selectedOrg.id}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 mb-1">Primary Domain</p>
                        <p className="font-medium text-slate-800">{selectedOrg.primaryDomain}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 mb-1">Total Domains</p>
                        <p className="font-medium text-slate-800">{selectedOrg.domains?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 mb-1">Tenant Type</p>
                        <p className="font-medium text-slate-800">{selectedOrg.tenant?.type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Domains List */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Domains ({selectedOrg.domains?.length || 0})</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedOrg.domains || []).map(domain => (
                        <span
                          key={domain}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            domain === selectedOrg.primaryDomain
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {domain}
                          {domain === selectedOrg.primaryDomain && ' ⭐'}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 italic">
                    Stats updated: {orgStats[selectedOrg.id]?.computedAt 
                      ? new Date(orgStats[selectedOrg.id].computedAt).toLocaleString() 
                      : 'Just now'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading organization statistics...</p>
                    <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedOrg(null);
                }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
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

