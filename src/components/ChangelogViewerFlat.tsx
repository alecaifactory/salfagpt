// Changelog Viewer - Flat, Minimal Design
// Created: 2025-11-08
// Focus: Readability, markdown, UI/CLI examples

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Terminal,
  Layout,
  Code,
  Play
} from 'lucide-react';
import type { ChangelogEntry, ChangelogGroup, IndustryVertical } from '../types/changelog';
import { INDUSTRY_SHOWCASES, FEATURE_CATEGORIES } from '../config/industry-showcases';
import { getUIExample } from '../config/ui-examples';
import { getTutorialForFeature } from '../config/interactive-tutorials';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ChangelogViewerProps {
  initialEntries?: ChangelogEntry[];
}

export default function ChangelogViewerFlat({ initialEntries }: ChangelogViewerProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-sm text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Changelog
          </h1>
          <p className="text-base text-slate-600">
            Novedades de la plataforma, con ejemplos de uso y casos reales.
          </p>
          
          {/* Minimal Stats */}
          <div className="mt-6 flex items-center gap-6 text-xs text-slate-500">
            <span>
              <span className="font-mono font-semibold text-slate-900">{groups.length}</span> versiones
            </span>
            <span>
              <span className="font-mono font-semibold text-slate-900">
                {groups.reduce((sum, g) => sum + g.entries.length, 0)}
              </span> features
            </span>
            <span>
              <span className="font-mono font-semibold text-slate-900">13</span> industrias
            </span>
          </div>
        </div>
      </div>

      {/* Minimal Filters */}
      <div className="max-w-4xl mx-auto px-6 py-4 border-b border-slate-100">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs text-slate-500 hover:text-slate-900 uppercase tracking-wide font-medium"
        >
          {showFilters ? '− Ocultar filtros' : '+ Filtros'}
        </button>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">
                Industria
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedIndustry('all')}
                  className={`px-2.5 py-1 text-xs font-medium border ${
                    selectedIndustry === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(INDUSTRY_SHOWCASES).map(([key, industry]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedIndustry(key as IndustryVertical)}
                    className={`px-2.5 py-1 text-xs font-medium border ${
                      selectedIndustry === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {industry.displayName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-2">
                Categoría
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 text-xs font-medium border ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(FEATURE_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2.5 py-1 text-xs font-medium border ${
                      selectedCategory === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
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

      {/* Changelog Entries */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {groups.length === 0 ? (
          <div className="text-center py-20 text-sm text-slate-400">
            No hay actualizaciones para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-20">
            {groups.map(group => (
              <div key={group.version}>
                {/* Version Header - Minimal */}
                <div className="mb-10">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      v{group.version}
                    </h2>
                    <span className="text-xs text-slate-400">
                      {new Date(group.releaseDate).toLocaleDateString('es', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 mt-3" />
                </div>

                {/* Entries */}
                <div className="space-y-16">
                  {group.entries.map(entry => {
                    const isExpanded = expandedEntry === entry.id;
                    const categoryInfo = getCategoryInfo(entry.category);

                    return (
                      <article key={entry.id} className="relative">
                        {/* Entry */}
                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                              {entry.title}
                            </h3>
                            {entry.subtitle && (
                              <p className="text-base text-slate-600 leading-relaxed">
                                {entry.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="font-mono">{categoryInfo.name}</span>
                            {entry.userRequestCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {entry.userRequestCount} solicitudes
                              </span>
                            )}
                            <span>
                              {entry.industries.slice(0, 2).map(ind => INDUSTRY_SHOWCASES[ind]?.displayName).join(', ')}
                              {entry.industries.length > 2 && ` +${entry.industries.length - 2}`}
                            </span>
                          </div>

                          {/* Description - Enhanced Markdown */}
                          <div className="prose prose-slate prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const code = String(children).replace(/\n$/, '');
                                  
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vs}
                                      language={match[1]}
                                      PreTag="div"
                                      className="text-sm"
                                      customStyle={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '4px',
                                        padding: '16px',
                                        margin: 0
                                      }}
                                      {...props}
                                    >
                                      {code}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono border border-slate-200" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                h4: ({node, ...props}) => (
                                  <h4 className="text-sm font-semibold text-slate-900 mt-6 mb-2" {...props} />
                                ),
                                ul: ({node, ...props}) => (
                                  <ul className="space-y-1 my-3" {...props} />
                                ),
                                li: ({node, ...props}) => (
                                  <li className="text-sm text-slate-700" {...props} />
                                ),
                                p: ({node, ...props}) => (
                                  <p className="text-sm text-slate-700 leading-relaxed my-2" {...props} />
                                )
                              }}
                            >
                              {entry.description}
                            </ReactMarkdown>
                          </div>

                          {/* UI/CLI Example - Interactive Showcase */}
                          {(() => {
                            const uiExample = getUIExample(entry.category, entry.title);
                            if (uiExample) {
                              return (
                                <div className="my-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Layout className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                      UI Preview
                                    </span>
                                  </div>
                                  <div 
                                    className="bg-slate-50 border border-slate-200 rounded-lg p-6"
                                    dangerouslySetInnerHTML={{ __html: uiExample }}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Interactive Tutorial Section */}
                          {(() => {
                            const tutorial = getTutorialForFeature(entry.title, entry.category);
                            if (!tutorial) return null;

                            return (
                              <div className="my-8 space-y-6">
                                {/* Tutorial Header */}
                                <div className="border-t border-b border-slate-200 py-4">
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                    📚 Cómo Usar Esta Feature
                                  </h4>
                                  <p className="text-xs text-slate-600">
                                    Tutorial interactivo con ejemplos reales y casos de uso
                                  </p>
                                </div>

                                {/* Interactive Demo */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Code className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                      Demo Interactivo
                                    </span>
                                  </div>
                                  <div 
                                    className="bg-slate-50 rounded-lg p-4"
                                    dangerouslySetInnerHTML={{ __html: tutorial.usage.interactiveDemo }}
                                  />
                                </div>

                                {/* Where to Find */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h5 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">
                                    📍 Dónde Encontrarlo
                                  </h5>
                                  <p className="text-sm text-blue-800 mb-2">{tutorial.location.description}</p>
                                  <ol className="space-y-1 text-xs text-blue-700 pl-4">
                                    {tutorial.location.steps.map((step, idx) => (
                                      <li key={idx} style={{ listStyleType: step.trim() === '' ? 'none' : 'decimal' }}>
                                        {step}
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {/* User Feedback Context */}
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                  <h5 className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-3">
                                    💬 Por Qué Lo Construimos
                                  </h5>
                                  <div className="space-y-3 text-sm text-purple-800">
                                    <div>
                                      <strong className="font-semibold">Solicitado por:</strong> {tutorial.userFeedback.requestedBy.join(', ')} 
                                      <span className="ml-2 text-xs">({tutorial.userFeedback.requestCount} solicitudes)</span>
                                    </div>
                                    <div>
                                      <strong className="font-semibold">Problema:</strong> {tutorial.userFeedback.commonPainPoint}
                                    </div>
                                    <div className="pl-3 border-l-2 border-purple-400">
                                      <strong className="font-semibold">Solución:</strong> {tutorial.userFeedback.howItHelps}
                                    </div>
                                  </div>
                                </div>

                                {/* Use Cases from Real Users */}
                                {tutorial.useCases.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                      🎯 Casos de Uso Reales
                                    </h5>
                                    <div className="space-y-4">
                                      {tutorial.useCases.map((useCase, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                                          <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                              <div className="text-sm font-semibold text-slate-900 mb-1">
                                                {useCase.persona}
                                              </div>
                                              <div className="text-xs text-slate-600">
                                                {useCase.scenario}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                            <div className="bg-red-50 border border-red-200 rounded p-3">
                                              <div className="font-semibold text-red-900 mb-2">❌ Antes</div>
                                              <p className="text-red-800 leading-relaxed">{useCase.beforeAfter.before}</p>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded p-3">
                                              <div className="font-semibold text-green-900 mb-2">✅ Ahora</div>
                                              <p className="text-green-800 leading-relaxed">{useCase.beforeAfter.after}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="bg-slate-50 rounded px-3 py-2 text-xs font-mono text-slate-700">
                                            💰 Ahorro: {useCase.beforeAfter.timeSaved}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Value Prop - Minimal */}
                          {entry.valueProposition && (
                            <div className="pl-4 border-l-2 border-slate-900">
                              <p className="text-sm text-slate-700">
                                {entry.valueProposition}
                              </p>
                            </div>
                          )}

                          {/* Try It Now CTA */}
                          {(() => {
                            const tutorial = getTutorialForFeature(entry.title, entry.category);
                            if (!tutorial) return null;

                            return (
                              <div className="mt-6">
                                <a
                                  href={tutorial.entryPointUrl || `/chat?tutorial=${entry.id}`}
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                                  onClick={async (e) => {
                                    // Track tutorial start
                                    try {
                                      await fetch('/api/feature-onboarding/start', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ featureId: entry.id })
                                      });
                                    } catch (error) {
                                      console.error('Failed to track:', error);
                                    }
                                  }}
                                >
                                  <Play className="w-4 h-4" />
                                  Try It Now
                                  <ChevronRight className="w-4 h-4" />
                                </a>
                                <p className="mt-2 text-xs text-slate-500">
                                  Tutorial guiado de {Math.ceil((tutorial.estimatedDuration || 120) / 60)} minutos • 
                                  Te llevaremos paso a paso
                                </p>
                              </div>
                            );
                          })()}

                          {/* Expand/Collapse */}
                          {entry.useCases && entry.useCases.length > 0 && (
                            <button
                              onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  Ocultar casos de uso
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  Ver casos de uso ({entry.useCases.length})
                                </>
                              )}
                            </button>
                          )}

                          {/* Expanded: Use Cases */}
                          {isExpanded && entry.useCases && (
                            <div className="mt-6 space-y-4 pl-4 border-l border-slate-200">
                              {entry.useCases.map((useCase, idx) => (
                                <div key={idx} className="space-y-3">
                                  <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                      {INDUSTRY_SHOWCASES[useCase.industry]?.displayName}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                      {useCase.title}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                      {useCase.description}
                                    </p>
                                  </div>

                                  {useCase.beforeAfter && (
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="bg-slate-50 border border-slate-200 p-3">
                                        <div className="font-medium text-slate-500 mb-1">Antes</div>
                                        <p className="text-slate-700">{useCase.beforeAfter.before}</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-200 p-3">
                                        <div className="font-medium text-slate-900 mb-1">Ahora</div>
                                        <p className="text-slate-800">{useCase.beforeAfter.after}</p>
                                      </div>
                                    </div>
                                  )}

                                  {useCase.metrics && (
                                    <div className="flex gap-4 text-xs font-mono text-slate-600">
                                      {useCase.metrics.timeSaved && <span>{useCase.metrics.timeSaved}</span>}
                                      {useCase.metrics.costReduction && <span>{useCase.metrics.costReduction}</span>}
                                      {useCase.metrics.qualityImprovement && <span>{useCase.metrics.qualityImprovement}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Alignment */}
                              {entry.alignmentReason && (
                                <div className="pt-3 border-t border-slate-100">
                                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                    Alineación
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {entry.alignmentReason}
                                  </p>
                                </div>
                              )}

                              {/* Technical */}
                              {entry.technicalDetails && (
                                <div className="pt-3 border-t border-slate-100">
                                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                    Detalles Técnicos
                                  </div>
                                  <div className="flex gap-4 text-xs font-mono text-slate-500">
                                    <span>{entry.technicalDetails.filesChanged} archivos</span>
                                    <span className="text-emerald-600">+{entry.technicalDetails.linesAdded}</span>
                                    {entry.technicalDetails.linesRemoved > 0 && (
                                      <span className="text-red-600">-{entry.technicalDetails.linesRemoved}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="mt-12 h-px bg-slate-100" />
                      </article>
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

function getCategoryInfo(category: string) {
  return FEATURE_CATEGORIES[category as keyof typeof FEATURE_CATEGORIES] || {
    name: category,
    icon: 'Tag',
    color: 'slate'
  };
}

