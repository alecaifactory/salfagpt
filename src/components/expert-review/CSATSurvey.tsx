// CSAT Survey Component
// Created: 2025-11-09
// Purpose: Quick satisfaction survey after key experiences (target: CSAT >4.0)

import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';

interface CSATSurveyProps {
  userId: string;
  domainId: string;
  interactionId: string;
  experienceType: 'feedback_flow' | 'expert_review' | 'admin_approval' | 'correction_impact';
  onSubmit: (rating: number, comment?: string) => void;
  onDismiss: () => void;
}

export default function CSATSurvey({
  userId,
  domainId,
  interactionId,
  experienceType,
  onSubmit,
  onDismiss
}: CSATSurveyProps) {
  
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const experienceLabels = {
    'feedback_flow': '¿Qué tan fácil fue dar feedback?',
    'expert_review': '¿Qué tan satisfecho estás con la evaluación?',
    'admin_approval': '¿Qué tan transparente fue el proceso de aprobación?',
    'correction_impact': '¿Qué tan útil fue la corrección aplicada?'
  };

  const handleSubmit = async () => {
    if (rating === null) return;

    setSubmitted(true);

    try {
      // Call API to track CSAT
      await fetch('/api/expert-review/csat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          domainId,
          interactionId,
          experienceType,
          rating,
          comment: comment || undefined,
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
      });

      onSubmit(rating, comment);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onDismiss();
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to submit CSAT:', error);
      setSubmitted(false);
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;

  const ratingLabels = {
    1: '😞 Muy insatisfecho',
    2: '😕 Insatisfecho',
    3: '😐 Neutral',
    4: '😊 Satisfecho',
    5: '🤩 Muy satisfecho'
  };

  if (submitted) {
    return (
      <div className="bg-white border border-green-300 rounded-lg p-6 shadow-lg animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            ¡Gracias por tu feedback!
          </h3>
          <p className="text-sm text-slate-600">
            Tu opinión nos ayuda a mejorar continuamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-xl animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            ⭐ ¿Cómo fue tu experiencia?
          </h3>
          <p className="text-sm text-slate-600">
            {experienceLabels[experienceType]}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Star Rating */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                displayRating && star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Label */}
      {displayRating !== null && (
        <div className="text-center mb-4">
          <span className="text-lg font-semibold text-slate-700">
            {ratingLabels[displayRating as keyof typeof ratingLabels]}
          </span>
        </div>
      )}

      {/* Comment (optional) */}
      {rating !== null && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ¿Algo que quieras compartir? (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre tu experiencia..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === null}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
          font-semibold text-sm transition-all
          ${rating !== null
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <Send className="w-4 h-4" />
        Enviar Feedback
      </button>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

