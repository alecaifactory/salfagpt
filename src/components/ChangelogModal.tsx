// Changelog Modal - In-App Version
// Created: 2025-11-08
// Appears as modal within chat interface, no navigation away

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Code,
  Play,
  Sparkles
} from 'lucide-react';
import type { ChangelogEntry, ChangelogGroup } from '../types/changelog';
import { INDUSTRY_SHOWCASES, FEATURE_CATEGORIES } from '../config/industry-showcases';
import { getTutorialForFeature } from '../config/interactive-tutorials';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightFeatureId?: string; // Auto-scroll to this feature
}

export default function ChangelogModal({ isOpen, onClose, highlightFeatureId }: ChangelogModalProps) {
  const [groups, setGroups] = useState<ChangelogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(highlightFeatureId || null);

  useEffect(() => {
    if (isOpen) {
      loadChangelog();
    }
  }, [isOpen, selectedIndustry, selectedCategory]);

  useEffect(() => {
    if (highlightFeatureId && isOpen) {
      // Auto-scroll to highlighted feature
      setTimeout(() => {
        const element = document.getElementById(`feature-${highlightFeatureId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setExpandedEntry(highlightFeatureId);
        }
      }, 300);
    }
  }, [highlightFeatureId, isOpen]);

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

  async function startTutorial(featureId: string, entryPointUrl: string) {
    try {
      // Track tutorial start
      await fetch('/api/feature-onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId })
      });

      // Close modal
      onClose();

      // Navigate to entry point
      if (entryPointUrl.startsWith('/')) {
        window.location.href = entryPointUrl;
      } else {
        // Handle special entry points (menu actions, etc.)
        // For now, just close modal - the entry point will trigger via URL
        console.log('Tutorial started for:', featureId);
      }
    } catch (error) {
      console.error('Failed to start tutorial:', error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal */}
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col m-4">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Changelog</h2>
              <p className="text-sm text-slate-600 mt-1">
                Novedades de la plataforma con tutoriales paso a paso
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
            <span>
              <span className="font-mono font-semibold text-slate-900">{groups.length}</span> versiones
            </span>
            <span>
              <span className="font-mono font-semibold text-slate-900">
                {groups.reduce((sum, g) => sum + g.entries.length, 0)}
              </span> features
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 border-b border-slate-100 px-8 py-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-slate-500 hover:text-slate-900 uppercase tracking-wide font-medium"
          >
            {showFilters ? '− Filtros' : '+ Filtros'}
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-8">
              <div className="flex-1">
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
                      onClick={() => setSelectedIndustry(key)}
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

              <div className="flex-1">
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-400">Cargando...</div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 text-sm text-slate-400">
              No hay actualizaciones para los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-16">
              {groups.map(group => (
                <div key={group.version}>
                  {/* Version Header */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        v{group.version}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {new Date(group.releaseDate).toLocaleDateString('es', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 mt-2" />
                  </div>

                  {/* Entries */}
                  <div className="space-y-12">
                    {group.entries.map(entry => {
                      const isExpanded = expandedEntry === entry.id;
                      const isHighlighted = highlightFeatureId === entry.id;
                      const tutorial = getTutorialForFeature(entry.title, entry.category);

                      return (
                        <article 
                          key={entry.id} 
                          id={`feature-${entry.id}`}
                          className={`scroll-mt-4 ${isHighlighted ? 'ring-2 ring-blue-500 rounded-lg p-4' : ''}`}
                        >
                          {/* Title */}
                          <div className="mb-3">
                            <h4 className="text-xl font-semibold text-slate-900 mb-1">
                              {entry.title}
                            </h4>
                            {entry.subtitle && (
                              <p className="text-sm text-slate-600">
                                {entry.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                            <span className="font-mono">
                              {FEATURE_CATEGORIES[entry.category as keyof typeof FEATURE_CATEGORIES]?.name || entry.category}
                            </span>
                            {entry.userRequestCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {entry.userRequestCount} solicitudes
                              </span>
                            )}
                          </div>

                          {/* Description - Compact */}
                          <div className="prose prose-slate prose-sm max-w-none mb-4">
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
                                      className="text-xs"
                                      customStyle={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        margin: '8px 0'
                                      }}
                                      {...props}
                                    >
                                      {code}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {entry.description}
                            </ReactMarkdown>
                          </div>

                          {/* Try It Now CTA - Prominent */}
                          {tutorial && (
                            <div className="my-4">
                              <button
                                onClick={() => startTutorial(entry.id, tutorial.entryPointUrl || '/chat')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                Try It Now
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <p className="mt-2 text-xs text-slate-500">
                                Tutorial de {Math.ceil((tutorial.estimatedDuration || 120) / 60)} min • 
                                Paso a paso con ejemplos
                              </p>
                            </div>
                          )}

                          {/* Expand for Details */}
                          <button
                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                            className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 mt-2"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                Ver menos
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-3.5 h-3.5" />
                                Ver tutorial completo
                              </>
                            )}
                          </button>

                          {/* Expanded: Full Tutorial */}
                          {isExpanded && tutorial && (
                            <div className="mt-6 pl-4 border-l-2 border-slate-200 space-y-6">
                              {/* Interactive Demo */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Code className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-500 uppercase">
                                    Demo Interactivo
                                  </span>
                                </div>
                                <div 
                                  className="bg-slate-50 rounded-lg p-4 text-sm"
                                  dangerouslySetInnerHTML={{ __html: tutorial.usage.interactiveDemo }}
                                />
                              </div>

                              {/* Where to Find */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="text-xs font-semibold text-blue-900 uppercase mb-2">
                                  📍 Dónde Encontrarlo
                                </h5>
                                <ol className="space-y-1 text-xs text-blue-800 pl-4">
                                  {tutorial.location.steps.map((step, idx) => (
                                    <li key={idx}>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              {/* User Feedback */}
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h5 className="text-xs font-semibold text-purple-900 uppercase mb-2">
                                  💬 Feedback de Usuarios
                                </h5>
                                <div className="space-y-2 text-xs text-purple-800">
                                  <div>
                                    <strong>Solicitado por:</strong> {tutorial.userFeedback.requestedBy.join(', ')}
                                  </div>
                                  <div>
                                    <strong>Problema:</strong> {tutorial.userFeedback.commonPainPoint}
                                  </div>
                                </div>
                              </div>

                              {/* Use Cases */}
                              {tutorial.useCases.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                                    Casos de Uso
                                  </h5>
                                  <div className="space-y-3">
                                    {tutorial.useCases.map((useCase, idx) => (
                                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                        <div className="text-sm font-semibold text-slate-900 mb-2">
                                          {useCase.persona}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div className="bg-red-50 border border-red-200 rounded p-2">
                                            <div className="font-semibold text-red-900 mb-1">Antes</div>
                                            <p className="text-red-800">{useCase.beforeAfter.before}</p>
                                          </div>
                                          <div className="bg-green-50 border border-green-200 rounded p-2">
                                            <div className="font-semibold text-green-900 mb-1">Ahora</div>
                                            <p className="text-green-800">{useCase.beforeAfter.after}</p>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-xs font-mono text-slate-600">
                                          💰 {useCase.beforeAfter.timeSaved}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Divider */}
                          <div className="mt-8 h-px bg-slate-100" />
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
    </div>
  );
}

