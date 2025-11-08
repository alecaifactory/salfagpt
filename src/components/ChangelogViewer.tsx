// Changelog Viewer Component - Minimal, Flat Design
// Created: 2025-11-08
// Redesigned: 2025-11-08 - Cleaner, more readable, with UI/CLI examples

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Tag,
  Users,
  ChevronDown,
  ChevronRight,
  Terminal,
  Layout,
  HardHat,
  Building2,
  Car,
  Landmark,
  Coins,
  Heart,
  TrendingUp,
  Sprout,
  ShoppingBag,
  ShoppingCart,
  GraduationCap,
  Store,
  Code,
  Image
} from 'lucide-react';
import type { ChangelogEntry, ChangelogGroup, IndustryVertical } from '../types/changelog';
import { INDUSTRY_SHOWCASES, FEATURE_CATEGORIES } from '../config/industry-showcases';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChangelogViewerProps {
  initialEntries?: ChangelogEntry[];
}

const INDUSTRY_ICONS: Record<IndustryVertical, any> = {
  'construction': HardHat,
  'real-estate': Building2,
  'mobility-as-service': Car,
  'banking': Landmark,
  'fintech': Coins,
  'health': Heart,
  'corporate-venture-capital': TrendingUp,
  'agriculture': Sprout,
  'multi-family-office': Users,
  'retail': ShoppingBag,
  'ecommerce': ShoppingCart,
  'higher-education': GraduationCap,
  'smbs': Store
};

export default function ChangelogViewer({ initialEntries }: ChangelogViewerProps) {
  const [groups, setGroups] = useState<ChangelogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryVertical | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    loadChangelog();
  }, [selectedIndustry, selectedCategory]);

  async function loadChangelog() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        grouped: 'true',
        status: 'stable'
      });

      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      if (selectedIndustry !== 'all') {
        params.set('industry', selectedIndustry);
      }

      const response = await fetch(`/api/changelog?${params}`);
      const data = await response.json();
      
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Failed to load changelog:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(entryId: string, helpful: boolean) {
    try {
      await fetch('/api/changelog/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changelogEntryId: entryId,
          helpful
        })
      });
      
      console.log('✅ Feedback submitted');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'slate';
      default: return 'slate';
    }
  }

  function getCategoryInfo(category: string) {
    return FEATURE_CATEGORIES[category as keyof typeof FEATURE_CATEGORIES] || {
      name: category,
      icon: 'Tag',
      color: 'slate'
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Cargando changelog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Changelog
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Nuevas funcionalidades y mejoras de la plataforma.
          </p>

          {/* Minimalist Stats */}
          <div className="mt-8 flex items-center gap-8 text-sm text-slate-500">
            <div>
              <span className="font-mono font-semibold text-slate-900">{groups.length}</span> versiones
            </div>
            <div>
              <span className="font-mono font-semibold text-slate-900">
                {groups.reduce((sum, g) => sum + g.entries.length, 0)}
              </span> features
            </div>
            <div>
              <span className="font-mono font-semibold text-slate-900">13</span> industrias
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Filters */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Filtrar por industria o categoría
        </button>

        {showFilters && (
          <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
            {/* Industry Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Industria
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedIndustry('all')}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedIndustry === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(INDUSTRY_SHOWCASES).map(([key, industry]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedIndustry(key as IndustryVertical)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedIndustry === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                    }`}
                  >
                    {industry.displayName}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Categoría
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(FEATURE_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedCategory === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Changelog Entries - Minimal Design */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        {groups.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-400">
              No hay actualizaciones para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {groups.map(group => (
              <div key={group.version} className="space-y-8">
                {/* Minimal Version Header */}
                <div className="flex items-baseline gap-4 border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {group.version}
                  </h2>
                  <span className="text-sm text-slate-400">
                    {new Date(group.releaseDate).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Entries - Flat, Minimal Cards */}
                <div className="space-y-12">
                  {group.entries.map(entry => {
                    const isExpanded = expandedEntry === entry.id;
                    const hasUIExample = entry.showcase?.imageUrls?.length || entry.showcase?.videoUrl;
                    const hasCLIExample = entry.category === 'developer-tools' || entry.title.includes('CLI');

                    return (
                      <div
                        key={entry.id}
                        className="border-l-2 border-slate-200 pl-6 hover:border-slate-400 transition-colors"
                      >
                        {/* Minimal Header */}
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-2xl font-semibold text-slate-900 mb-2 leading-tight">
                                {entry.title}
                              </h3>
                              {entry.subtitle && (
                                <p className="text-base text-slate-600 leading-relaxed">
                                  {entry.subtitle}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(entry.releaseDate).toLocaleDateString('es', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>

                          {/* Minimal Tags */}
                          <div className="flex items-center gap-3 text-xs">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 font-medium">
                              {getCategoryInfo(entry.category).name}
                            </span>
                            {entry.userRequestCount > 0 && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Users className="w-3 h-3" />
                                {entry.userRequestCount} solicitudes
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description with Better Markdown */}
                        <div className="prose prose-slate prose-sm max-w-none mb-6">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({node, inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={tomorrow}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded border border-slate-200 text-sm"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {entry.description}
                          </ReactMarkdown>
                        </div>

                        {/* Value Proposition - Minimal */}
                        {entry.valueProposition && (
                          <div className="mb-6 pl-4 border-l-2 border-slate-300">
                            <p className="text-sm text-slate-700 leading-relaxed">
                              <span className="font-semibold text-slate-900">Valor:</span> {entry.valueProposition}
                            </p>
                          </div>
                        )}

                        {/* UI/CLI Example Section */}
                        {(hasCLIExample || hasUIExample) && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              {hasCLIExample ? (
                                <>
                                  <Terminal className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Ejemplo CLI
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Layout className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Ejemplo UI
                                  </span>
                                </>
                              )}
                            </div>
                            {hasCLIExample ? (
                              <div className="bg-slate-900 rounded border border-slate-700 p-4 font-mono text-sm overflow-x-auto">
                                <div className="text-emerald-400">$ npx salfagpt upload contextos/pdf/agentes/M001</div>
                                <div className="text-slate-300 mt-2">
                                  📤 Cargando 3 archivos...<br/>
                                  <span className="text-emerald-400">✓</span> Manual.pdf (2.3 MB) → Extraído<br/>
                                  <span className="text-emerald-400">✓</span> Guía.pdf (1.8 MB) → Extraído<br/>
                                  <span className="text-emerald-400">✓</span> FAQ.pdf (0.5 MB) → Extraído<br/>
                                  <br/>
                                  <span className="text-emerald-400">✓ Completo en 45s</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                                {entry.showcase?.imageUrls?.[0] && (
                                  <img 
                                    src={entry.showcase.imageUrls[0]} 
                                    alt={entry.title}
                                    className="w-full rounded border border-slate-200"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Expandable Details */}
                        <button
                          onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                          className="text-sm text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 mb-4"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              Ver detalles
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="space-y-6">
                            {/* Use Cases - Minimal */}
                            {entry.useCases && entry.useCases.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-4">
                                  Casos de Uso
                                </h4>
                                <div className="space-y-4">
                                  {entry.useCases.map((useCase, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded p-4">
                                      <div className="text-sm font-semibold text-slate-900 mb-2">
                                        {INDUSTRY_SHOWCASES[useCase.industry]?.displayName}: {useCase.title}
                                      </div>
                                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                                        {useCase.description}
                                      </p>

                                      {useCase.beforeAfter && (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                          <div className="bg-slate-50 border border-slate-200 rounded p-3">
                                            <div className="font-semibold text-slate-700 mb-1">
                                              Antes
                                            </div>
                                            <p className="text-slate-600">
                                              {useCase.beforeAfter.before}
                                            </p>
                                          </div>
                                          <div className="bg-slate-50 border border-slate-200 rounded p-3">
                                            <div className="font-semibold text-slate-900 mb-1">
                                              Ahora
                                            </div>
                                            <p className="text-slate-700">
                                              {useCase.beforeAfter.after}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {useCase.metrics && (
                                        <div className="mt-3 flex gap-4 text-xs font-mono text-slate-600">
                                          {useCase.metrics.timeSaved && (
                                            <span>{useCase.metrics.timeSaved}</span>
                                          )}
                                          {useCase.metrics.costReduction && (
                                            <span>{useCase.metrics.costReduction}</span>
                                          )}
                                          {useCase.metrics.qualityImprovement && (
                                            <span>{useCase.metrics.qualityImprovement}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Alignment & Feedback */}
                            {(entry.alignmentReason || entry.userFeedbackSource) && (
                              <div className="space-y-3">
                                {entry.alignmentReason && (
                                  <div className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-300">
                                    <span className="font-semibold text-slate-900">Alineación:</span> {entry.alignmentReason}
                                  </div>
                                )}
                                {entry.requestedBy && entry.requestedBy.length > 0 && (
                                  <div className="text-xs text-slate-500">
                                    Solicitado por: {entry.requestedBy.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Technical Details - Minimal */}
                            {entry.technicalDetails && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                  Detalles Técnicos
                                </h4>
                                <div className="flex gap-6 text-xs font-mono text-slate-600">
                                  <div>
                                    {entry.technicalDetails.filesChanged} archivos
                                  </div>
                                  <div className="text-emerald-600">
                                    +{entry.technicalDetails.linesAdded}
                                  </div>
                                  <div className="text-red-600">
                                    -{entry.technicalDetails.linesRemoved}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Minimal Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {entry.industries.slice(0, 3).map(ind => (
                              <span key={ind}>
                                {INDUSTRY_SHOWCASES[ind]?.displayName}
                              </span>
                            ))}
                            {entry.industries.length > 3 && (
                              <span>+{entry.industries.length - 3} más</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

