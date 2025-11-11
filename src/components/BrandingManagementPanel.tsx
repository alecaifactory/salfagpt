/**
 * Branding Management Panel
 * 
 * SuperAdmin interface for managing branding across all organizations
 * Features:
 * - View branding for all organizations
 * - Edit brand identity (logo, colors, typography)
 * - Preview branding changes
 * - Apply branding templates
 * 
 * Created: 2025-11-11
 */

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  X, 
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Sparkles
} from 'lucide-react';
import type { Organization } from '../types/organizations';

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

export default function BrandingManagementPanel({ currentUserId, currentUserRole }: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [brandingForm, setBrandingForm] = useState({
    brandName: '',
    logo: '',
    primaryColor: '#0066CC',
    secondaryColor: '#6B7280',
    accentColor: '#10B981',
    fontFamily: 'Inter',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations', {
        credentials: 'include' // ✅ Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedOrg) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding: {
            brandName: brandingForm.brandName,
            logo: brandingForm.logo,
            primaryColor: brandingForm.primaryColor,
            secondaryColor: brandingForm.secondaryColor,
          }
        })
      });

      if (response.ok) {
        alert('✅ Branding saved successfully!');
        loadOrganizations();
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Failed to save branding');
    } finally {
      setSaving(false);
    }
  }

  const brandingTemplates = [
    { name: 'Corporate Blue', primary: '#0066CC', secondary: '#6B7280', accent: '#10B981' },
    { name: 'Modern Purple', primary: '#8B5CF6', secondary: '#64748B', accent: '#F59E0B' },
    { name: 'Fresh Green', primary: '#10B981', secondary: '#64748B', accent: '#3B82F6' },
    { name: 'Bold Red', primary: '#EF4444', secondary: '#6B7280', accent: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Organization List */}
      <div className="w-80 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Organizations
        </h3>
        <div className="space-y-2">
          {organizations.map(org => (
            <button
              key={org.id}
              onClick={() => {
                setSelectedOrg(org);
                setBrandingForm({
                  brandName: org.branding?.brandName || org.name,
                  logo: org.branding?.logo || '',
                  primaryColor: org.branding?.primaryColor || '#0066CC',
                  secondaryColor: org.branding?.secondaryColor || '#6B7280',
                  accentColor: '#10B981',
                  fontFamily: 'Inter',
                });
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedOrg?.id === org.id
                  ? 'bg-blue-100 border-2 border-blue-600'
                  : 'bg-white hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: org.branding?.primaryColor || '#0066CC' }}
                />
                <p className="font-semibold text-slate-800">{org.name}</p>
              </div>
              <p className="text-xs text-slate-600">{org.domains[0]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Branding Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedOrg ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Select an organization to manage branding</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Branding</h2>
                <p className="text-sm text-slate-600">{selectedOrg.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandingForm.brandName}
                onChange={e => setBrandingForm({ ...brandingForm, brandName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., SalfaGPT"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={brandingForm.logo}
                  onChange={e => setBrandingForm({ ...brandingForm, logo: e.target.value })}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://company.com/logo.png or /images/logo.png"
                />
                <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
              {brandingForm.logo && (
                <img src={brandingForm.logo} alt="Logo preview" className="mt-2 h-16 object-contain" />
              )}
            </div>

            {/* Color System */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Color System</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={e => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="w-20 h-12 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={brandingForm.primaryColor}
                      onChange={e => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={brandingForm.secondaryColor}
                      onChange={e => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="w-20 h-12 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={brandingForm.secondaryColor}
                      onChange={e => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Branding Templates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {brandingTemplates.map(template => (
                    <button
                      key={template.name}
                      onClick={() => setBrandingForm({
                        ...brandingForm,
                        primaryColor: template.primary,
                        secondaryColor: template.secondary,
                        accentColor: template.accent,
                      })}
                      className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <div className="flex gap-1 mb-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: template.primary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: template.secondary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: template.accent }} />
                      </div>
                      <p className="text-xs font-medium text-slate-700">{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                <h3 className="font-semibold text-slate-800 mb-4">Preview</h3>
                <div className="bg-white rounded-lg p-6 space-y-4">
                  {/* Header Preview */}
                  <div
                    className="px-4 py-3 rounded-lg text-white font-bold"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                  >
                    {brandingForm.brandName || 'Brand Name'}
                  </div>
                  
                  {/* Button Preview */}
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                  >
                    Primary Button
                  </button>
                  
                  {/* Secondary Button */}
                  <button
                    className="px-4 py-2 rounded-lg border-2 font-medium"
                    style={{ 
                      borderColor: brandingForm.primaryColor,
                      color: brandingForm.primaryColor
                    }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

