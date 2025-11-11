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
  AlertCircle
} from 'lucide-react';
import type { Organization, OrganizationStats } from '../types/organizations';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
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
      
      // Load stats for each org
      for (const org of data.organizations || []) {
        loadOrgStats(org.id);
      }
      
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      alert(`Failed to load organizations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadOrgStats(orgId: string) {
    try {
      const response = await fetch(`/api/organizations/${orgId}/stats`, {
        credentials: 'include' // ✅ Include cookies for authentication
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrgStats(prev => ({ ...prev, [orgId]: data.stats }));
      } else {
        console.warn(`⚠️ Stats not available for org ${orgId} (${response.status})`);
        // Set empty stats so UI doesn't wait indefinitely
        setOrgStats(prev => ({ ...prev, [orgId]: null }));
      }
    } catch (error) {
      console.error('❌ Error loading org stats:', error);
      // Set empty stats on error
      setOrgStats(prev => ({ ...prev, [orgId]: null }));
    }
  }
  
  // Filter organizations by search
  const filteredOrgs = organizations.filter(org => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.domains.some(d => d.toLowerCase().includes(query)) ||
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Organizations</h2>
            <p className="text-sm text-slate-600">
              Manage multi-tenant organizations and their configurations
            </p>
          </div>
        </div>
        
        {(currentUserRole === 'superadmin' || currentUserRole === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
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
              onClick={() => setShowCreateModal(true)}
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
                      <h3 className="text-lg font-bold text-slate-800">
                        {org.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
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
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                
                {/* Org Stats */}
                {stats ? (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        Users
                      </div>
                      <p className="text-lg font-bold text-slate-800">
                        {stats.totalUsers || 0}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Agents
                      </div>
                      <p className="text-lg font-bold text-slate-800">
                        {stats.totalAgents || 0}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        <Globe className="w-3.5 h-3.5" />
                        Sources
                      </div>
                      <p className="text-lg font-bold text-slate-800">
                        {stats.totalContextSources || 0}
                      </p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-slate-600 mb-1">
                        Est. Cost
                      </div>
                      <p className="text-lg font-bold text-slate-800">
                        ${stats.estimatedMonthlyCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ) : stats === null ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Stats unavailable
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mx-auto mb-1"></div>
                    Loading...
                  </div>
                )}
                
                {/* Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowConfigModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      // Would open stats modal
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm"
                  >
                    <Eye className="w-4 h-4" />
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
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            Platform Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-700 mb-1">Total Organizations</p>
              <p className="text-2xl font-bold text-blue-900">{organizations.length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Active Organizations</p>
              <p className="text-2xl font-bold text-blue-900">
                {organizations.filter(o => o.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Total Domains</p>
              <p className="text-2xl font-bold text-blue-900">
                {organizations.reduce((sum, o) => sum + (o.domains?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Encrypted Orgs</p>
              <p className="text-2xl font-bold text-blue-900">
                {organizations.filter(o => o.privacy?.encryptionEnabled).length}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Create Organization</h3>
            <p className="text-slate-600 mb-4">
              This will be the OrganizationConfigModal component
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {showConfigModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Configure: {selectedOrg.name}
            </h3>
            <p className="text-slate-600 mb-4">
              This will be the 7-tab OrganizationConfigModal
            </p>
            <button
              onClick={() => {
                setShowConfigModal(false);
                setSelectedOrg(null);
              }}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

