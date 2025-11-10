import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Target, 
  TrendingUp, 
  Search, 
  Loader2, 
  ExternalLink, 
  Sparkles,
  Plus,
  Trash2,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { Domain, DomainCompanyInfo } from '../lib/domains';

interface DomainCompanyInfoEditorProps {
  domain: Domain;
  onClose: () => void;
  onSave: () => void;
}

export default function DomainCompanyInfoEditor({
  domain,
  onClose,
  onSave,
}: DomainCompanyInfoEditorProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'objectives' | 'web'>('strategy');
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strategy fields
  const [mission, setMission] = useState(domain.companyInfo?.mission || '');
  const [vision, setVision] = useState(domain.companyInfo?.vision || '');
  const [purpose, setPurpose] = useState(domain.companyInfo?.purpose || '');

  // OKRs
  const [okrs, setOkrs] = useState(domain.companyInfo?.okrs || []);

  // KPIs
  const [kpis, setKpis] = useState(domain.companyInfo?.kpis || []);

  // Web data
  const [websiteUrl, setWebsiteUrl] = useState(
    domain.companyInfo?.webData?.websiteUrl || `https://${domain.id}`
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const companyInfo: DomainCompanyInfo = {
        mission,
        vision,
        purpose,
        okrs,
        kpis,
        webData: domain.companyInfo?.webData, // Preserve existing web data
      };

      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyInfo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      await onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrichFromWeb = async () => {
    try {
      setScraping(true);
      setError(null);

      const response = await fetch('/api/domains/enrich-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domain.id,
          websiteUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al scrape web');
      }

      await onSave(); // Reload domain data
      
      // Show success message
      alert('✅ Información web extraída exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setScraping(false);
    }
  };

  const addOKR = () => {
    setOkrs([...okrs, { objective: '', keyResults: [''], quarter: 'Q1 2025' }]);
  };

  const removeOKR = (index: number) => {
    setOkrs(okrs.filter((_, i) => i !== index));
  };

  const updateOKR = (index: number, field: string, value: any) => {
    const updated = [...okrs];
    updated[index] = { ...updated[index], [field]: value };
    setOkrs(updated);
  };

  const addKeyResult = (okrIndex: number) => {
    const updated = [...okrs];
    updated[okrIndex].keyResults.push('');
    setOkrs(updated);
  };

  const removeKeyResult = (okrIndex: number, krIndex: number) => {
    const updated = [...okrs];
    updated[okrIndex].keyResults = updated[okrIndex].keyResults.filter((_, i) => i !== krIndex);
    setOkrs(updated);
  };

  const updateKeyResult = (okrIndex: number, krIndex: number, value: string) => {
    const updated = [...okrs];
    updated[okrIndex].keyResults[krIndex] = value;
    setOkrs(updated);
  };

  const addKPI = () => {
    setKpis([...kpis, { name: '', target: '', current: '', unit: '' }]);
  };

  const removeKPI = (index: number) => {
    setKpis(kpis.filter((_, i) => i !== index));
  };

  const updateKPI = (index: number, field: string, value: string) => {
    const updated = [...kpis];
    updated[index] = { ...updated[index], [field]: value };
    setKpis(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Company Information</h3>
              <p className="text-sm text-slate-500">{domain.name} ({domain.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'strategy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Mission & Vision
            </button>
            <button
              onClick={() => setActiveTab('objectives')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'objectives'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              OKRs & KPIs
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'web'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Web Intelligence
              {domain.companyInfo?.webData?.status === 'completed' && (
                <CheckCircle className="w-4 h-4 inline ml-1 text-green-600" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mission Statement
                </label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="What is the company's core purpose? Why does it exist?"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Example: "To empower businesses with AI-driven automation that increases productivity and reduces costs."
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vision Statement
                </label>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="What does the company aspire to become? Where is it heading?"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Example: "To be the leading provider of enterprise AI solutions in Latin America by 2030."
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Core Purpose
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="What value does the company create? For whom?"
                />
              </div>
            </div>
          )}

          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <div className="space-y-6">
              {/* OKRs Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800">OKRs (Objectives & Key Results)</h4>
                  <button
                    onClick={addOKR}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add OKR
                  </button>
                </div>

                {okrs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Target className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No OKRs defined yet</p>
                    <p className="text-xs mt-1">Click "Add OKR" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {okrs.map((okr, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={okr.objective}
                              onChange={(e) => updateOKR(index, 'objective', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                              placeholder="Objective (e.g., Increase market share in mining sector)"
                            />
                            <input
                              type="text"
                              value={okr.quarter}
                              onChange={(e) => updateOKR(index, 'quarter', e.target.value)}
                              className="mt-2 px-3 py-1.5 border border-slate-300 rounded text-sm"
                              placeholder="Q1 2025"
                            />
                          </div>
                          <button
                            onClick={() => removeOKR(index)}
                            className="ml-2 p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="pl-4 border-l-2 border-blue-200 space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Key Results:</label>
                            <button
                              onClick={() => addKeyResult(index)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add KR
                            </button>
                          </div>

                          {okr.keyResults.map((kr, krIndex) => (
                            <div key={krIndex} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono">KR{krIndex + 1}:</span>
                              <input
                                type="text"
                                value={kr}
                                onChange={(e) => updateKeyResult(index, krIndex, e.target.value)}
                                className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
                                placeholder="Measurable result (e.g., Increase revenue by 25%)"
                              />
                              <button
                                onClick={() => removeKeyResult(index, krIndex)}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* KPIs Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800">KPIs (Key Performance Indicators)</h4>
                  <button
                    onClick={addKPI}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add KPI
                  </button>
                </div>

                {kpis.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No KPIs defined yet</p>
                    <p className="text-xs mt-1">Click "Add KPI" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kpis.map((kpi, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-3">
                        <div className="grid grid-cols-12 gap-3 items-start">
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={kpi.name}
                              onChange={(e) => updateKPI(index, 'name', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              placeholder="KPI Name"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={kpi.target}
                              onChange={(e) => updateKPI(index, 'target', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              placeholder="Target"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={kpi.current || ''}
                              onChange={(e) => updateKPI(index, 'current', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              placeholder="Current"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={kpi.unit || ''}
                              onChange={(e) => updateKPI(index, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              placeholder="Unit (%, $, etc.)"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => removeKPI(index)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Web Intelligence Tab */}
          {activeTab === 'web' && (
            <div className="space-y-6">
              {/* Scrape URL Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                  <button
                    onClick={handleEnrichFromWeb}
                    disabled={scraping || !websiteUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 font-medium flex items-center gap-2"
                  >
                    {scraping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Enrich from Web
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  We'll extract company information from the website and analyze it with AI
                </p>
              </div>

              {/* Scraping Status */}
              {scraping && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <h5 className="font-semibold text-blue-800">Extracting Web Data...</h5>
                      <p className="text-sm text-blue-600">This may take 10-30 seconds</p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* Web Data Display */}
              {domain.companyInfo?.webData?.status === 'completed' && (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                  <div className="p-4 bg-green-50 border-b border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h5 className="font-semibold text-green-800">Web Data Collected</h5>
                        <p className="text-xs text-green-600">
                          Scraped {new Date(domain.companyInfo.webData.scrapedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* About Text */}
                  {domain.companyInfo.webData.aboutText && (
                    <div className="p-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">About</h5>
                      <p className="text-sm text-slate-600">{domain.companyInfo.webData.aboutText}</p>
                    </div>
                  )}

                  {/* Social Links */}
                  {domain.companyInfo.webData.socialLinks && Object.keys(domain.companyInfo.webData.socialLinks).length > 0 && (
                    <div className="p-4">
                      <h5 className="text-sm font-semibold text-slate-700 mb-2">Social Media</h5>
                      <div className="flex flex-wrap gap-2">
                        {domain.companyInfo.webData.socialLinks.linkedin && (
                          <a
                            href={domain.companyInfo.webData.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-blue-200"
                          >
                            LinkedIn
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {domain.companyInfo.webData.socialLinks.twitter && (
                          <a
                            href={domain.companyInfo.webData.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-sky-200"
                          >
                            Twitter
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {domain.companyInfo.webData.socialLinks.facebook && (
                          <a
                            href={domain.companyInfo.webData.socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-indigo-200"
                          >
                            Facebook
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {domain.companyInfo.aiAnalysis && (
                    <div className="p-4 bg-purple-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h5 className="font-semibold text-purple-800">AI-Generated Insights</h5>
                      </div>

                      {domain.companyInfo.aiAnalysis.summary && (
                        <div className="mb-4">
                          <h6 className="text-xs font-semibold text-slate-700 mb-1">Summary</h6>
                          <p className="text-sm text-slate-600">{domain.companyInfo.aiAnalysis.summary}</p>
                        </div>
                      )}

                      {domain.companyInfo.aiAnalysis.strengths && domain.companyInfo.aiAnalysis.strengths.length > 0 && (
                        <div className="mb-4">
                          <h6 className="text-xs font-semibold text-slate-700 mb-2">Strengths</h6>
                          <div className="flex flex-wrap gap-2">
                            {domain.companyInfo.aiAnalysis.strengths.map((strength, i) => (
                              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {domain.companyInfo.aiAnalysis.focusAreas && domain.companyInfo.aiAnalysis.focusAreas.length > 0 && (
                        <div className="mb-4">
                          <h6 className="text-xs font-semibold text-slate-700 mb-2">Focus Areas</h6>
                          <div className="flex flex-wrap gap-2">
                            {domain.companyInfo.aiAnalysis.focusAreas.map((area, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {domain.companyInfo.aiAnalysis.relevanceScore !== undefined && (
                        <div>
                          <h6 className="text-xs font-semibold text-slate-700 mb-2">Platform Relevance Score</h6>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  domain.companyInfo.aiAnalysis.relevanceScore >= 75 ? 'bg-green-600' :
                                  domain.companyInfo.aiAnalysis.relevanceScore >= 50 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${domain.companyInfo.aiAnalysis.relevanceScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-right">
                              {domain.companyInfo.aiAnalysis.relevanceScore}/100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error State */}
                  {domain.companyInfo?.webData?.status === 'error' && (
                    <div className="p-4 bg-red-50">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <h5 className="font-semibold text-red-800">Scraping Failed</h5>
                          <p className="text-xs text-red-600 mt-1">
                            {domain.companyInfo.webData.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


