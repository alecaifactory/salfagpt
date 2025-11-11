/**
 * Organization Configuration Modal
 * 
 * 8-tab modal for complete organization configuration:
 * 1. Company Profile (URL scraping, Mission, Vision, Purpose, North Star, OKRs, KPIs)
 * 2. General (name, domains)
 * 3. Admins (manage org admins)
 * 4. Branding (logo, colors)
 * 5. Evaluation (domain configs)
 * 6. Privacy (encryption, data residency)
 * 7. Limits (quotas)
 * 8. Advanced (tenant config)
 * 
 * SuperAdmin Features:
 * - Web scraping to extract company data from URL
 * - AI-powered generation of mission, vision, purpose
 * - AI-suggested North Star Metrics
 * - AI-generated OKRs and KPIs
 * - Full access to all organizations
 * 
 * Created: 2025-11-10
 * Enhanced: 2025-11-11 - Added Company Profile tab with AI assistance
 * Part of: feat/multi-org-system-2025-11-10
 */

import React, { useState } from 'react';
import { X, Building2, Users, Palette, ClipboardCheck, Shield, Gauge, Settings, FileText, Globe, Sparkles, Loader2 } from 'lucide-react';
import type { Organization, UpdateOrganizationInput } from '../types/organizations';

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: UpdateOrganizationInput) => Promise<void>;
}

type TabId = 'profile' | 'general' | 'admins' | 'branding' | 'evaluation' | 'privacy' | 'limits' | 'advanced';

export default function OrganizationConfigModal({ organization, isOpen, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saving, setSaving] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [formData, setFormData] = useState<UpdateOrganizationInput>({
    name: organization.name,
    primaryDomain: organization.primaryDomain,
    profile: organization.profile || {},
    branding: organization.branding,
    evaluationConfig: organization.evaluationConfig,
    privacy: organization.privacy,
    limits: organization.limits,
  });
  
  if (!isOpen) return null;
  
  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: FileText },
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
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-3xl">
              {/* Company Website URL with Scrape Button */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.profile?.url || ''}
                    onChange={e => setFormData({
                      ...formData,
                      profile: { ...formData.profile, url: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://company.com"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.profile?.url) {
                        alert('Please enter a URL first');
                        return;
                      }
                      setScrapingUrl(true);
                      try {
                        const response = await fetch('/api/scrape-company-data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: formData.profile.url })
                        });
                        const data = await response.json();
                        if (data.companyData) {
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile,
                              companyName: data.companyData.companyName || formData.profile?.companyName,
                              mission: data.companyData.mission || formData.profile?.mission,
                              vision: data.companyData.vision || formData.profile?.vision,
                              purpose: data.companyData.purpose || formData.profile?.purpose,
                            }
                          });
                          alert('✅ Company data scraped successfully!');
                        }
                      } catch (error) {
                        console.error('Error scraping URL:', error);
                        alert('Failed to scrape URL');
                      } finally {
                        setScrapingUrl(false);
                      }
                    }}
                    disabled={scrapingUrl || !formData.profile?.url}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {scrapingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Scrape Data
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the company website to automatically extract mission, vision, and other data
                </p>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.profile?.companyName || ''}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, companyName: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Salfa Corporación S.A."
                />
              </div>

              {/* Mission */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Mission Statement
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            url: formData.profile?.url,
                            field: 'mission'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, mission: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating mission:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
                <textarea
                  value={formData.profile?.mission || ''}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, mission: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="What we aim to achieve..."
                />
              </div>

              {/* Vision */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Vision Statement
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            url: formData.profile?.url,
                            field: 'vision'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, vision: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating vision:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
                <textarea
                  value={formData.profile?.vision || ''}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, vision: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Where we're headed in the future..."
                />
              </div>

              {/* Purpose */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Purpose (Why We Exist)
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            url: formData.profile?.url,
                            field: 'purpose'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, purpose: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating purpose:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
                <textarea
                  value={formData.profile?.purpose || ''}
                  onChange={e => setFormData({
                    ...formData,
                    profile: { ...formData.profile, purpose: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Our reason for being..."
                />
              </div>

              {/* North Star Metric */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-slate-800">
                    North Star Metric ⭐
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            url: formData.profile?.url,
                            mission: formData.profile?.mission,
                            vision: formData.profile?.vision,
                            field: 'northStarMetric'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, northStarMetric: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating North Star:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white hover:bg-violet-700 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Suggest Metric
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  The one metric that matters most to your business success
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Metric Name
                    </label>
                    <input
                      type="text"
                      value={formData.profile?.northStarMetric?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          northStarMetric: {
                            ...formData.profile?.northStarMetric,
                            name: e.target.value,
                            current: formData.profile?.northStarMetric?.current || 0,
                            target: formData.profile?.northStarMetric?.target || 0,
                            unit: formData.profile?.northStarMetric?.unit || ''
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="e.g., Daily Active Users"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.profile?.northStarMetric?.unit || ''}
                      onChange={e => setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          northStarMetric: {
                            ...formData.profile?.northStarMetric!,
                            unit: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="users, $, %"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current Value
                    </label>
                    <input
                      type="number"
                      value={formData.profile?.northStarMetric?.current || ''}
                      onChange={e => setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          northStarMetric: {
                            ...formData.profile?.northStarMetric!,
                            current: parseFloat(e.target.value) || 0
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={formData.profile?.northStarMetric?.target || ''}
                      onChange={e => setFormData({
                        ...formData,
                        profile: {
                          ...formData.profile,
                          northStarMetric: {
                            ...formData.profile?.northStarMetric!,
                            target: parseFloat(e.target.value) || 0
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="1000"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Why This Metric?
                  </label>
                  <textarea
                    value={formData.profile?.northStarMetric?.description || ''}
                    onChange={e => setFormData({
                      ...formData,
                      profile: {
                        ...formData.profile,
                        northStarMetric: {
                          ...formData.profile?.northStarMetric!,
                          description: e.target.value
                        }
                      }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Explain why this metric drives your business..."
                  />
                </div>
                
                {/* Example Metrics */}
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                    💡 See North Star Metric Examples
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-slate-600 ml-4">
                    <p>• <strong>Daily Active Users (DAU)</strong> - SaaS platforms</p>
                    <p>• <strong>Revenue Per Customer</strong> - E-commerce</p>
                    <p>• <strong>Time to Value</strong> - Onboarding optimization</p>
                    <p>• <strong>Net Promoter Score (NPS)</strong> - Customer satisfaction</p>
                    <p>• <strong>Weekly Active Projects</strong> - Project management tools</p>
                  </div>
                </details>
              </div>

              {/* OKRs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    OKRs (Objectives & Key Results)
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            mission: formData.profile?.mission,
                            vision: formData.profile?.vision,
                            field: 'okrs'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, okrs: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating OKRs:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
                {formData.profile?.okrs && formData.profile.okrs.length > 0 ? (
                  <div className="space-y-3">
                    {formData.profile.okrs.map((okr, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <input
                          type="text"
                          value={okr.objective}
                          onChange={e => {
                            const newOkrs = [...(formData.profile?.okrs || [])];
                            newOkrs[idx] = { ...okr, objective: e.target.value };
                            setFormData({
                              ...formData,
                              profile: { ...formData.profile, okrs: newOkrs }
                            });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-medium text-sm mb-2"
                          placeholder="Objective"
                        />
                        <div className="space-y-1">
                          {okr.keyResults.map((kr, krIdx) => (
                            <input
                              key={krIdx}
                              type="text"
                              value={kr}
                              onChange={e => {
                                const newOkrs = [...(formData.profile?.okrs || [])];
                                const newKrs = [...okr.keyResults];
                                newKrs[krIdx] = e.target.value;
                                newOkrs[idx] = { ...okr, keyResults: newKrs };
                                setFormData({
                                  ...formData,
                                  profile: { ...formData.profile, okrs: newOkrs }
                                });
                              }}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm"
                              placeholder={`Key Result ${krIdx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No OKRs defined yet. Click "AI Generate" to create suggestions.</p>
                )}
              </div>

              {/* KPIs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    KPIs (Key Performance Indicators)
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setGeneratingContent(true);
                      try {
                        const response = await fetch('/api/generate-company-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            companyName: formData.profile?.companyName || organization.name,
                            mission: formData.profile?.mission,
                            northStarMetric: formData.profile?.northStarMetric,
                            field: 'kpis'
                          })
                        });
                        const data = await response.json();
                        if (data.content) {
                          setFormData({
                            ...formData,
                            profile: { ...formData.profile, kpis: data.content }
                          });
                        }
                      } catch (error) {
                        console.error('Error generating KPIs:', error);
                      } finally {
                        setGeneratingContent(false);
                      }
                    }}
                    disabled={generatingContent}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Generate
                  </button>
                </div>
                {formData.profile?.kpis && formData.profile.kpis.length > 0 ? (
                  <div className="space-y-2">
                    {formData.profile.kpis.map((kpi, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 p-2 border border-slate-200 rounded bg-white">
                        <input
                          type="text"
                          value={kpi.name}
                          onChange={e => {
                            const newKpis = [...(formData.profile?.kpis || [])];
                            newKpis[idx] = { ...kpi, name: e.target.value };
                            setFormData({
                              ...formData,
                              profile: { ...formData.profile, kpis: newKpis }
                            });
                          }}
                          className="px-2 py-1 border border-slate-300 rounded text-xs"
                          placeholder="KPI Name"
                        />
                        <input
                          type="number"
                          value={kpi.current}
                          onChange={e => {
                            const newKpis = [...(formData.profile?.kpis || [])];
                            newKpis[idx] = { ...kpi, current: parseFloat(e.target.value) || 0 };
                            setFormData({
                              ...formData,
                              profile: { ...formData.profile, kpis: newKpis }
                            });
                          }}
                          className="px-2 py-1 border border-slate-300 rounded text-xs"
                          placeholder="Current"
                        />
                        <input
                          type="number"
                          value={kpi.target}
                          onChange={e => {
                            const newKpis = [...(formData.profile?.kpis || [])];
                            newKpis[idx] = { ...kpi, target: parseFloat(e.target.value) || 0 };
                            setFormData({
                              ...formData,
                              profile: { ...formData.profile, kpis: newKpis }
                            });
                          }}
                          className="px-2 py-1 border border-slate-300 rounded text-xs"
                          placeholder="Target"
                        />
                        <input
                          type="text"
                          value={kpi.unit}
                          onChange={e => {
                            const newKpis = [...(formData.profile?.kpis || [])];
                            newKpis[idx] = { ...kpi, unit: e.target.value };
                            setFormData({
                              ...formData,
                              profile: { ...formData.profile, kpis: newKpis }
                            });
                          }}
                          className="px-2 py-1 border border-slate-300 rounded text-xs"
                          placeholder="Unit"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No KPIs defined. Click "AI Generate" for suggestions.</p>
                )}
              </div>

              {/* Example KPIs */}
              <details className="text-xs">
                <summary className="text-blue-600 cursor-pointer hover:text-blue-700">
                  💡 See KPI Examples
                </summary>
                <div className="mt-2 space-y-1 text-slate-600 ml-4">
                  <p>• <strong>Customer Acquisition Cost (CAC)</strong> - Marketing efficiency</p>
                  <p>• <strong>Lifetime Value (LTV)</strong> - Customer value</p>
                  <p>• <strong>Monthly Recurring Revenue (MRR)</strong> - Revenue growth</p>
                  <p>• <strong>Churn Rate</strong> - Customer retention</p>
                  <p>• <strong>Net Promoter Score (NPS)</strong> - Customer satisfaction</p>
                </div>
              </details>
            </div>
          )}
          
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

