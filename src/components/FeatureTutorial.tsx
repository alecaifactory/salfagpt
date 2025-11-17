// Interactive Feature Tutorial Component
// Created: 2025-11-08
// Lightweight HTML/CSS showcase with no sensitive data

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  X,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export interface TutorialStep {
  title: string;
  description: string;
  htmlDemo?: string; // Safe HTML demo (no user data)
  imageUrl?: string;
  videoUrl?: string;
  highlights: string[]; // Key points
  duration?: number; // Estimated seconds
}

interface FeatureTutorialProps {
  featureTitle: string;
  steps: TutorialStep[];
  onComplete?: () => void;
  onClose?: () => void;
}

export default function FeatureTutorial({
  featureTitle,
  steps,
  onComplete,
  onClose
}: FeatureTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSteps = steps.length;
  const progress = ((completed.size + (completed.has(currentStep) ? 0 : 0.5)) / totalSteps) * 100;

  function handleNext() {
    // Mark current as completed
    setCompleted(prev => new Set([...prev, currentStep]));
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial complete
      handleComplete();
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkipTo(index: number) {
    setCurrentStep(index);
  }

  function handleComplete() {
    setCompleted(new Set(steps.map((_, i) => i)));
    onComplete?.();
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{featureTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-100">
                Paso {currentStep + 1} de {totalSteps}
              </span>
              <span className="text-blue-100 font-semibold">
                {Math.round(progress)}% completado
              </span>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Navigator */}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => handleSkipTo(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  idx === currentStep
                    ? 'bg-white text-blue-600'
                    : completed.has(idx)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
              >
                {completed.has(idx) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Step Title */}
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {currentStepData.title}
            </h3>

            {/* Description */}
            <p className="text-slate-600 mb-6 text-lg leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Highlights */}
            {currentStepData.highlights.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">
                  ✨ Puntos Clave
                </h4>
                <ul className="space-y-2">
                  {currentStepData.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* HTML Demo */}
            {currentStepData.htmlDemo && (
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    Demo Interactivo
                  </span>
                </div>
                <div
                  className="p-6 bg-white"
                  dangerouslySetInnerHTML={{ __html: currentStepData.htmlDemo }}
                />
              </div>
            )}

            {/* Image */}
            {currentStepData.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 mb-6">
                <img
                  src={currentStepData.imageUrl}
                  alt={currentStepData.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Video */}
            {currentStepData.videoUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 mb-6">
                <video
                  src={currentStepData.videoUrl}
                  controls
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Duration Indicator */}
            {currentStepData.duration && (
              <div className="text-sm text-slate-500 mb-4">
                ⏱️ Duración estimada: {currentStepData.duration} segundos
              </div>
            )}
          </div>
        </div>

        {/* Footer - Navigation */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm"
            >
              ← Anterior
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium"
              >
                Salir
              </button>
              
              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium flex items-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  Completar Tutorial
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center gap-2 text-sm"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



