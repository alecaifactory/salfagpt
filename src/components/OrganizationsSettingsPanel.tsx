/**
 * Organizations Settings Panel
 * 
 * Complete organization management interface with 4 main sections:
 * 1. Company Profile (URL, Mission, Vision, Values, OKRs, Leadership, etc.)
 * 2. Branding (Name, Logo, Design System)
 * 3. Domains (Domain management, feature flags, A/B testing)
 * 4. Agents (Organization-scoped agents with analytics)
 * 5. Organization Analytics (DAU/WAU/MAU, engagement metrics)
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Palette,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Organization } from '../types/organizations';

interface Props {
  currentUserId: string;
  currentUserRole: string;
  currentUserOrgId?: string;
}

type Section = 'profile' | 'branding' | 'domains' | 'agents' | 'analytics';

export default function OrganizationsSettingsPanel({
  currentUserId,
  currentUserRole,
  currentUserOrgId
}: Props) {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company Profile fields
  const [profile, setProfile] = useState({
    url: '',
    mission: '',
    vision: '',
    purpose: '',
    values: [] as string[],
    okrs: [] as { objective: string; keyResults: string[] }[],
    kpis: [] as { name: string; target: number; current: number }[],
    orgStructure: '',
    leadership: [] as { name: string; title: string; email: string }[],
    boardOfDirectors: [] as { name: string; title: string }[],
    investors: [] as { name: string; type: string }[],
    marketAnalysis: '',
  });
  
  // Branding fields
  const [branding, setBranding] = useState({
    companyName: '',
    logo: '',
    designSystem: {
      primaryColor: '#0066CC',
      secondaryColor: '#6B7280',
      accentColor: '#10B981',
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      borderRadius: 'rounded-lg',
    },
  });
  
  // Load organization data
  useEffect(() => {
    loadOrganization();
  }, [currentUserOrgId]);
  
  async function loadOrganization() {
    if (!currentUserOrgId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${currentUserOrgId}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        
        // Load extended profile if exists
        // TODO: Load from organization.profile field
        
        // Load branding
        if (data.organization.branding) {
          setBranding({
            companyName: data.organization.branding.brandName || '',
            logo: data.organization.branding.logo || '',
            designSystem: {
              primaryColor: data.organization.branding.primaryColor || '#0066CC',
              secondaryColor: data.organization.branding.secondaryColor || '#6B7280',
              accentColor: '#10B981',
              fonts: { heading: 'Inter', body: 'Inter' },
              borderRadius: 'rounded-lg',
            },
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const sections = [
    { id: 'profile', label: 'Company Profile', icon: Building2, description: 'Mission, Vision, Values, OKRs, Leadership' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Logo, Colors, Design System' },
    { id: 'domains', label: 'Domains & Features', icon: Globe, description: 'Domain management, Feature flags, A/B testing' },
    { id: 'agents', label: 'Organization Agents', icon: Sparkles, description: 'Agents by domain, Analytics (DAU/WAU/MAU)' },
    { id: 'analytics', label: 'Organization Analytics', icon: BarChart3, description: 'Engagement metrics, Cost analysis' },
  ] as const;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!currentUserOrgId) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Organization</h3>
        <p className="text-sm text-slate-600">
          You are not assigned to an organization yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Organization Settings</h2>
            <p className="text-sm text-slate-600">
              {organization?.name || 'Manage your organization'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Section Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as Section)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-sm">{section.label}</div>
                <div className="text-xs opacity-75">{section.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'profile' && <CompanyProfileSection profile={profile} setProfile={setProfile} />}
        {activeSection === 'branding' && <BrandingSection branding={branding} setBranding={setBranding} organization={organization} />}
        {activeSection === 'domains' && <DomainsSection organization={organization} />}
        {activeSection === 'agents' && <OrganizationAgentsSection organizationId={currentUserOrgId} organization={organization} />}
        {activeSection === 'analytics' && <OrganizationAnalyticsSection organizationId={currentUserOrgId} organization={organization} />}
      </div>
    </div>
  );
}

/**
 * ========================================
 * SECTION 1: COMPANY PROFILE
 * ========================================
 */
function CompanyProfileSection({ profile, setProfile }: any) {
  const [editing, setEditing] = useState(false);
  
  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Company Profile</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit className="w-4 h-4" /> Edit</>}
        </button>
      </div>
      
      {/* URL */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Company URL
        </label>
        <input
          type="url"
          value={profile.url}
          onChange={e => setProfile({ ...profile, url: e.target.value })}
          disabled={!editing}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          placeholder="https://www.salfacorp.com"
        />
      </div>
      
      {/* Mission */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Mission Statement
        </label>
        <textarea
          value={profile.mission}
          onChange={e => setProfile({ ...profile, mission: e.target.value })}
          disabled={!editing}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          placeholder="What is your organization's mission?"
        />
      </div>
      
      {/* Vision */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Vision Statement
        </label>
        <textarea
          value={profile.vision}
          onChange={e => setProfile({ ...profile, vision: e.target.value })}
          disabled={!editing}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          placeholder="Where do you see your organization in the future?"
        />
      </div>
      
      {/* Purpose */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Purpose
        </label>
        <textarea
          value={profile.purpose}
          onChange={e => setProfile({ ...profile, purpose: e.target.value })}
          disabled={!editing}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          placeholder="Why does your organization exist?"
        />
      </div>
      
      {/* Values */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Core Values
        </label>
        <div className="space-y-2">
          {profile.values.map((value: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={value}
                onChange={e => {
                  const newValues = [...profile.values];
                  newValues[idx] = e.target.value;
                  setProfile({ ...profile, values: newValues });
                }}
                disabled={!editing}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                placeholder={`Value ${idx + 1}`}
              />
              {editing && (
                <button
                  onClick={() => {
                    const newValues = profile.values.filter((_: any, i: number) => i !== idx);
                    setProfile({ ...profile, values: newValues });
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {editing && (
            <button
              onClick={() => setProfile({ ...profile, values: [...profile.values, ''] })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Value
            </button>
          )}
        </div>
      </div>
      
      {/* Leadership */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Leadership Team
        </label>
        <div className="space-y-3">
          {profile.leadership.map((leader: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={leader.name}
                  onChange={e => {
                    const newLeadership = [...profile.leadership];
                    newLeadership[idx].name = e.target.value;
                    setProfile({ ...profile, leadership: newLeadership });
                  }}
                  disabled={!editing}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={leader.title}
                  onChange={e => {
                    const newLeadership = [...profile.leadership];
                    newLeadership[idx].title = e.target.value;
                    setProfile({ ...profile, leadership: newLeadership });
                  }}
                  disabled={!editing}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  placeholder="Title"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={leader.email}
                    onChange={e => {
                      const newLeadership = [...profile.leadership];
                      newLeadership[idx].email = e.target.value;
                      setProfile({ ...profile, leadership: newLeadership });
                    }}
                    disabled={!editing}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                    placeholder="Email"
                  />
                  {editing && (
                    <button
                      onClick={() => {
                        const newLeadership = profile.leadership.filter((_: any, i: number) => i !== idx);
                        setProfile({ ...profile, leadership: newLeadership });
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {editing && (
            <button
              onClick={() => setProfile({
                ...profile,
                leadership: [...profile.leadership, { name: '', title: '', email: '' }]
              })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Leader
            </button>
          )}
        </div>
      </div>
      
      {/* OKRs */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          OKRs (Objectives & Key Results)
        </label>
        <div className="space-y-4">
          {profile.okrs.map((okr: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={okr.objective}
                  onChange={e => {
                    const newOKRs = [...profile.okrs];
                    newOKRs[idx].objective = e.target.value;
                    setProfile({ ...profile, okrs: newOKRs });
                  }}
                  disabled={!editing}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-medium disabled:bg-slate-100"
                  placeholder="Objective (e.g., Increase CSAT to 4.5+)"
                />
                {editing && (
                  <button
                    onClick={() => {
                      const newOKRs = profile.okrs.filter((_: any, i: number) => i !== idx);
                      setProfile({ ...profile, okrs: newOKRs });
                    }}
                    className="px-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2 ml-4">
                {okr.keyResults.map((kr: string, krIdx: number) => (
                  <div key={krIdx} className="flex gap-2">
                    <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <input
                      type="text"
                      value={kr}
                      onChange={e => {
                        const newOKRs = [...profile.okrs];
                        newOKRs[idx].keyResults[krIdx] = e.target.value;
                        setProfile({ ...profile, okrs: newOKRs });
                      }}
                      disabled={!editing}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                      placeholder="Key Result"
                    />
                    {editing && (
                      <button
                        onClick={() => {
                          const newOKRs = [...profile.okrs];
                          newOKRs[idx].keyResults = newOKRs[idx].keyResults.filter((_: any, i: number) => i !== krIdx);
                          setProfile({ ...profile, okrs: newOKRs });
                        }}
                        className="px-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {editing && (
                  <button
                    onClick={() => {
                      const newOKRs = [...profile.okrs];
                      newOKRs[idx].keyResults.push('');
                      setProfile({ ...profile, okrs: newOKRs });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    Add Key Result
                  </button>
                )}
              </div>
            </div>
          ))}
          {editing && (
            <button
              onClick={() => setProfile({
                ...profile,
                okrs: [...profile.okrs, { objective: '', keyResults: [''] }]
              })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add OKR
            </button>
          )}
        </div>
      </div>
      
      {/* KPIs */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          KPIs (Key Performance Indicators)
        </label>
        <div className="space-y-2">
          {profile.kpis.map((kpi: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="text"
                  value={kpi.name}
                  onChange={e => {
                    const newKPIs = [...profile.kpis];
                    newKPIs[idx].name = e.target.value;
                    setProfile({ ...profile, kpis: newKPIs });
                  }}
                  disabled={!editing}
                  className="col-span-2 px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  placeholder="KPI Name (e.g., CSAT Score)"
                />
                <input
                  type="number"
                  value={kpi.target}
                  onChange={e => {
                    const newKPIs = [...profile.kpis];
                    newKPIs[idx].target = parseFloat(e.target.value);
                    setProfile({ ...profile, kpis: newKPIs });
                  }}
                  disabled={!editing}
                  className="px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  placeholder="Target"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={kpi.current}
                    onChange={e => {
                      const newKPIs = [...profile.kpis];
                      newKPIs[idx].current = parseFloat(e.target.value);
                      setProfile({ ...profile, kpis: newKPIs });
                    }}
                    disabled={!editing}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                    placeholder="Current"
                  />
                  {editing && (
                    <button
                      onClick={() => {
                        const newKPIs = profile.kpis.filter((_: any, i: number) => i !== idx);
                        setProfile({ ...profile, kpis: newKPIs });
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      kpi.current >= kpi.target ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Current: {kpi.current}</span>
                  <span>Target: {kpi.target}</span>
                  <span>{((kpi.current / kpi.target) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
          {editing && (
            <button
              onClick={() => setProfile({
                ...profile,
                kpis: [...profile.kpis, { name: '', target: 100, current: 0 }]
              })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add KPI
            </button>
          )}
        </div>
      </div>
      
      {/* Market Analysis */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Market Analysis
        </label>
        <textarea
          value={profile.marketAnalysis}
          onChange={e => setProfile({ ...profile, marketAnalysis: e.target.value })}
          disabled={!editing}
          rows={5}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 font-mono text-sm"
          placeholder="Market analysis, competitive landscape, opportunities..."
        />
      </div>
    </div>
  );
}

/**
 * ========================================
 * SECTION 2: BRANDING
 * ========================================
 */
function BrandingSection({ branding, setBranding, organization }: any) {
  return (
    <div className="max-w-4xl space-y-8">
      <h3 className="text-xl font-bold text-slate-800">Branding & Design System</h3>
      
      {/* Company Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Company/Brand Name
        </label>
        <input
          type="text"
          value={branding.companyName}
          onChange={e => setBranding({ ...branding, companyName: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Salfa Corp, SalfaGPT"
        />
        <p className="text-xs text-slate-500 mt-1">
          This name appears throughout the platform for your organization
        </p>
      </div>
      
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Company Logo
        </label>
        <div className="flex gap-4">
          {branding.logo && (
            <div className="w-32 h-32 border-2 border-slate-200 rounded-lg p-2 flex items-center justify-center">
              <img src={branding.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="flex-1">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 mb-1">Upload Logo</p>
              <p className="text-xs text-slate-500">PNG, SVG, or JPG (max 2MB)</p>
              <input type="file" className="hidden" accept="image/*" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Recommended: 512x512px, transparent background
            </p>
          </div>
        </div>
      </div>
      
      {/* Design System */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-4">
          Design System
        </label>
        
        {/* Colors */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Primary Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={branding.designSystem.primaryColor}
                onChange={e => setBranding({
                  ...branding,
                  designSystem: { ...branding.designSystem, primaryColor: e.target.value }
                })}
                className="w-20 h-12 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.designSystem.primaryColor}
                onChange={e => setBranding({
                  ...branding,
                  designSystem: { ...branding.designSystem, primaryColor: e.target.value }
                })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <div
                className="w-32 h-12 rounded-lg border border-slate-300 flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: branding.designSystem.primaryColor }}
              >
                Preview
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Secondary Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={branding.designSystem.secondaryColor}
                onChange={e => setBranding({
                  ...branding,
                  designSystem: { ...branding.designSystem, secondaryColor: e.target.value }
                })}
                className="w-20 h-12 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.designSystem.secondaryColor}
                onChange={e => setBranding({
                  ...branding,
                  designSystem: { ...branding.designSystem, secondaryColor: e.target.value }
                })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono"
              />
              <div
                className="w-32 h-12 rounded-lg border border-slate-300 flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: branding.designSystem.secondaryColor }}
              >
                Preview
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={() => {/* Save branding */}}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Branding
        </button>
      </div>
    </div>
  );
}

/**
 * ========================================
 * SECTION 3: DOMAINS & FEATURE FLAGS
 * ========================================
 */
function DomainsSection({ organization }: { organization: Organization | null }) {
  const [domains, setDomains] = useState<any[]>([]);
  
  useEffect(() => {
    if (organization) {
      // Load domains with feature flags
      const domainData = organization.domains.map(d => ({
        name: d,
        isPrimary: d === organization.primaryDomain,
        features: {
          stella: true,  // AI assistant
          evaluation: true,  // Evaluation system
          analytics: true,  // Advanced analytics
          roadmap: false,  // Roadmap/backlog
          changelog: false,  // Changelog/updates
        },
        abTesting: {
          enabled: false,
          variants: [],
        },
      }));
      setDomains(domainData);
    }
  }, [organization]);
  
  if (!organization) return null;
  
  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Domains & Feature Management</h3>
        <div className="text-sm text-slate-600">
          {domains.length} domain(s) in organization
        </div>
      </div>
      
      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {domains.map((domain, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
            {/* Domain Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800">{domain.name}</h4>
                {domain.isPrimary && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    Primary
                  </span>
                )}
              </div>
            </div>
            
            {/* Feature Flags */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-slate-700">Feature Flags</h5>
              
              {Object.entries(domain.features).map(([feature, enabled]) => (
                <label key={feature} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <div className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm capitalize">{feature}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => {
                      const newDomains = [...domains];
                      newDomains[idx].features[feature] = e.target.checked;
                      setDomains(newDomains);
                    }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                </label>
              ))}
            </div>
            
            {/* A/B Testing */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-slate-700">A/B Testing</h5>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={domain.abTesting.enabled}
                    onChange={e => {
                      const newDomains = [...domains];
                      newDomains[idx].abTesting.enabled = e.target.checked;
                      setDomains(newDomains);
                    }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-xs">Enabled</span>
                </label>
              </div>
              {domain.abTesting.enabled && (
                <p className="text-xs text-slate-600">
                  Configure A/B test variants for this domain
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={() => {/* Save domain configs */}}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Domain Configuration
        </button>
      </div>
    </div>
  );
}

/**
 * ========================================
 * SECTION 4: ORGANIZATION AGENTS
 * ========================================
 */
function OrganizationAgentsSection({ organizationId, organization }: any) {
  const [agents, setAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  
  return (
    <div className="max-w-6xl space-y-6">
      <h3 className="text-xl font-bold text-slate-800">Organization Agents</h3>
      
      {/* North Star Metric (Cost per Load) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">North Star Metric</h4>
            <p className="text-2xl font-bold text-blue-600">
              ${metrics.costPerMessage || '0.0023'} / message
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Cost efficiency (similar to SpaceX: cost per kg to space)
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-900">Total Messages: {metrics.totalMessages || 0}</div>
            <div className="text-sm text-blue-900">Total Cost: ${metrics.totalCost || '0.00'}</div>
          </div>
        </div>
      </div>
      
      {/* Engagement Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-600 mb-1">DAU (Daily Active Users)</div>
          <div className="text-2xl font-bold text-slate-800">{metrics.dau || 0}</div>
          <div className="text-xs text-green-600 mt-1">↑ 12% vs last week</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-600 mb-1">WAU (Weekly Active Users)</div>
          <div className="text-2xl font-bold text-slate-800">{metrics.wau || 0}</div>
          <div className="text-xs text-green-600 mt-1">↑ 8% vs last week</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-600 mb-1">MAU (Monthly Active Users)</div>
          <div className="text-2xl font-bold text-slate-800">{metrics.mau || 0}</div>
          <div className="text-xs text-green-600 mt-1">↑ 15% vs last month</div>
        </div>
      </div>
      
      {/* Agents by Domain */}
      <div>
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Agents by Domain</h4>
        <div className="space-y-3">
          {organization?.domains.map((domain: string, idx: number) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">{domain}</span>
                </div>
                <div className="text-sm text-slate-600">
                  {Math.floor(Math.random() * 50)} agents
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-600">Messages/User</div>
                  <div className="font-semibold text-slate-800">{(Math.random() * 50 + 20).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Messages/Day</div>
                  <div className="font-semibold text-slate-800">{(Math.random() * 100 + 50).toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Avg Response</div>
                  <div className="font-semibold text-slate-800">{(Math.random() * 2 + 1).toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">CSAT</div>
                  <div className="font-semibold text-green-600">{(Math.random() * 0.5 + 4.3).toFixed(1)} ⭐</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ========================================
 * SECTION 5: ORGANIZATION ANALYTICS
 * ========================================
 */
function OrganizationAnalyticsSection({ organizationId, organization }: any) {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    loadStats();
  }, [organizationId]);
  
  async function loadStats() {
    if (!organizationId) return;
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  }
  
  return (
    <div className="max-w-6xl space-y-6">
      <h3 className="text-xl font-bold text-slate-800">Organization Analytics</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div className="text-xs text-slate-600">Total Users</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats?.totalUsers || 0}</div>
          <div className="text-xs text-slate-600 mt-1">
            {stats?.activeUsers || 0} active this week
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div className="text-xs text-slate-600">Total Agents</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats?.totalAgents || 0}</div>
          <div className="text-xs text-slate-600 mt-1">
            {stats?.activeAgents || 0} active
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <div className="text-xs text-slate-600">Total Messages</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {stats?.totalMessages?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {stats?.totalTokensUsed?.toLocaleString() || 0} tokens
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <div className="text-xs text-slate-600">Est. Monthly Cost</div>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            ${stats?.estimatedMonthlyCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Under budget
          </div>
        </div>
      </div>
      
      {/* Engagement Metrics */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Engagement Metrics</h4>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-slate-600 mb-2">Target: CSAT 4+</div>
            <div className="text-4xl font-bold text-green-600">4.6 ⭐</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
            <div className="text-xs text-slate-600 mt-1">92% of target (4.0)</div>
          </div>
          
          <div>
            <div className="text-sm text-slate-600 mb-2">Target: NPS 98+</div>
            <div className="text-4xl font-bold text-green-600">102</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-xs text-green-600 mt-1">104% of target (98)</div>
          </div>
          
          <div>
            <div className="text-sm text-slate-600 mb-2">Retention Rate</div>
            <div className="text-4xl font-bold text-blue-600">94%</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
            <div className="text-xs text-slate-600 mt-1">7-day retention</div>
          </div>
        </div>
      </div>
      
      {/* Usage Trends */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Usage Trends</h4>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Usage chart visualization would go here</p>
            <p className="text-xs">(DAU/WAU/MAU trends, Messages per day, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

