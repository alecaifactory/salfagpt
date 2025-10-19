/**
 * CSAT Rating Widget
 * 
 * Allows users to rate agent responses with 1-5 stars
 * Includes detailed categories and comments
 */

import React, { useState } from 'react';
import { Star, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface CSATRatingWidgetProps {
  interactionId: string;
  onRate?: (score: number) => void;
  compact?: boolean;
}

export default function CSATRatingWidget({
  interactionId,
  onRate,
  compact = false
}: CSATRatingWidgetProps) {
  const [score, setScore] = useState<number | null>(null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [categories, setCategories] = useState({
    accuracy: 0,
    relevance: 0,
    speed: 0,
    completeness: 0
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleStarClick = (value: number) => {
    setScore(value);
    if (compact && !showDetails) {
      // Compact mode: submit immediately
      submitRating(value, {}, '');
    }
  };

  const submitRating = async (
    ratingScore: number,
    ratingCategories: any,
    ratingComment: string
  ) => {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/agent-interactions/${interactionId}/csat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: ratingScore,
          categories: Object.keys(ratingCategories).length > 0 ? ratingCategories : null,
          comment: ratingComment || null
        })
      });

      if (response.ok) {
        setSubmitted(true);
        if (onRate) onRate(ratingScore);
      } else {
        console.error('Failed to submit CSAT');
      }
    } catch (error) {
      console.error('Error submitting CSAT:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDetailed = () => {
    if (score) {
      submitRating(score, categories, comment);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Star className="w-4 h-4 fill-current" />
        <span>¡Gracias por tu feedback! ({score}/5)</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          ¿Cómo estuvo esta respuesta?
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => setHoverScore(value)}
              onMouseLeave={() => setHoverScore(null)}
              className="transition-transform hover:scale-110"
              disabled={submitting}
            >
              <Star
                className={`w-5 h-5 ${
                  (hoverScore !== null ? value <= hoverScore : value <= (score || 0))
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
        
        {!compact && score && !showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ChevronDown className="w-3 h-3" />
            Detallar
          </button>
        )}
      </div>

      {/* Detailed Rating */}
      {showDetails && score && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Calificación Detallada
            </p>
            <button
              onClick={() => setShowDetails(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Category Ratings */}
          <div className="space-y-2">
            {(['accuracy', 'relevance', 'speed', 'completeness'] as const).map((category) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                  {category === 'accuracy' && '🎯 Precisión'}
                  {category === 'relevance' && '📍 Relevancia'}
                  {category === 'speed' && '⚡ Velocidad'}
                  {category === 'completeness' && '✓ Completitud'}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setCategories({ ...categories, [category]: value })}
                      className="w-6 h-6"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          value <= categories[category]
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" />
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué podría mejorarse?"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm resize-none dark:bg-slate-700 dark:text-white"
              rows={2}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitDetailed}
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Calificación
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

