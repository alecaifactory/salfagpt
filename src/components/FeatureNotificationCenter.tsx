// Feature Notification Center - Top Bar Component
// Created: 2025-11-08
// Shows new features with tutorial progress dots

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronRight, Check, Play } from 'lucide-react';
import type { FeatureOnboarding } from '../types/feature-onboarding';

interface FeatureItem {
  id: string;
  title: string;
  category: string;
  releaseDate: Date;
  tutorialCompleted: boolean;
  tutorialProgress: number;
  dismissed: boolean;
  changelogUrl: string;
}

interface FeatureNotificationCenterProps {
  onOpenChangelog?: (featureId: string) => void;
}

export default function FeatureNotificationCenter({ onOpenChangelog }: FeatureNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }

  async function loadFeatures() {
    try {
      setLoading(true);
      const response = await fetch('/api/feature-onboarding');
      const data = await response.json();
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Failed to load features:', error);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }

  async function startTutorial(featureId: string, changelogUrl: string) {
    try {
      // Track tutorial start
      await fetch('/api/feature-onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId })
      });

      // Close dropdown
      setIsOpen(false);

      // Open in-app changelog with this feature highlighted
      if (onOpenChangelog) {
        onOpenChangelog(featureId);
      } else {
        // Fallback: navigate to URL
        window.location.href = `${changelogUrl}?tutorial=true&featureId=${featureId}`;
      }
    } catch (error) {
      console.error('Failed to start tutorial:', error);
    }
  }

  async function dismissFeature(featureId: string) {
    try {
      await fetch('/api/feature-onboarding/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId })
      });

      setFeatures(prev => prev.filter(f => f.id !== featureId));
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  }

  const pendingCount = features.filter(f => !f.tutorialCompleted && !f.dismissed).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Novedades</span>
        {pendingCount > 0 && (
          <span className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900">Nuevas Features</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {pendingCount > 0 ? `${pendingCount} pendientes de explorar` : 'Todo al día!'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Features List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cargando...</p>
              </div>
            ) : features.length === 0 ? (
              <div className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay features nuevas</p>
              </div>
            ) : (
              <div className="p-2">
                {features.map(feature => {
                  const isPending = !feature.tutorialCompleted && !feature.dismissed;
                  const inProgress = feature.tutorialProgress > 0 && !feature.tutorialCompleted;

                  return (
                    <div
                      key={feature.id}
                      className={`relative p-4 rounded-lg mb-2 border transition-colors ${
                        isPending 
                          ? 'bg-orange-50 border-orange-200' 
                          : feature.tutorialCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Status Dot */}
                      {isPending && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      )}
                      {feature.tutorialCompleted && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="mb-3">
                        <h4 className="font-semibold text-slate-900 text-sm mb-1">
                          {feature.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                            {feature.category}
                          </span>
                          <span>
                            {new Date(feature.releaseDate).toLocaleDateString('es', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      {inProgress && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>Tutorial en progreso</span>
                            <span className="font-semibold">{feature.tutorialProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${feature.tutorialProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!feature.tutorialCompleted ? (
                          <button
                            onClick={() => startTutorial(feature.id, feature.changelogUrl)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            {inProgress ? 'Continuar Tutorial' : 'Try It Now'}
                          </button>
                        ) : (
                          <button
                            onClick={() => window.location.href = feature.changelogUrl}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Completado
                          </button>
                        )}
                        
                        {!feature.tutorialCompleted && (
                          <button
                            onClick={() => dismissFeature(feature.id)}
                            className="px-3 py-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <a
              href="/changelog"
              className="block text-center text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Ver todas las actualizaciones →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

