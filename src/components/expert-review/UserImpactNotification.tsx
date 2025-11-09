// User Impact Notification
// Created: 2025-11-09
// Purpose: Show users when their feedback improved a response (close the loop)

import React from 'react';
import { Sparkles, ExternalLink, TrendingUp } from 'lucide-react';

interface UserImpactNotificationProps {
  originalFeedback: {
    id: string;
    userComment: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high';
  };
  improvement: {
    type: 'prompt_enhancement' | 'context_addition' | 'response_refinement' | 'step_clarification';
    description: string;
    expertName?: string;
    approvedBy?: string;
  };
  onViewContribution?: () => void;
}

export default function UserImpactNotification({
  originalFeedback,
  improvement,
  onViewContribution
}: UserImpactNotificationProps) {
  
  const improvementLabels = {
    'prompt_enhancement': 'Mejora en el prompt',
    'context_addition': 'Contexto adicional agregado',
    'response_refinement': 'Refinamiento de respuesta',
    'step_clarification': 'Pasos más específicos'
  };

  const improvementLabel = improvementLabels[improvement.type] || 'Mejora aplicada';

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="my-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-sm animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-green-900 mb-1 flex items-center gap-2">
            ✨ Esta respuesta mejoró gracias a TU feedback
            <span className="text-xs font-normal bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
              Nuevo
            </span>
          </h4>
          
          <p className="text-xs text-green-800">
            Tu comentario del <strong>{formatDate(originalFeedback.timestamp)}</strong> ayudó a identificar que necesitábamos: 
            <strong> {improvementLabel.toLowerCase()}</strong>
          </p>
        </div>
      </div>

      {/* Original Feedback */}
      <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-2">
          <div className="text-xs text-green-700 font-semibold mt-0.5">
            Tu feedback:
          </div>
          <p className="text-xs text-slate-700 italic flex-1">
            "{originalFeedback.userComment.length > 100 
              ? originalFeedback.userComment.substring(0, 100) + '...'
              : originalFeedback.userComment}"
          </p>
        </div>
      </div>

      {/* Improvement Details */}
      <div className="bg-green-100 bg-opacity-50 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-700 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-semibold text-green-900 mb-1">
              Mejora Implementada:
            </div>
            <p className="text-xs text-green-800">
              {improvement.description}
            </p>
          </div>
        </div>

        {improvement.expertName && (
          <p className="text-[10px] text-green-700 ml-6">
            Evaluado por: {improvement.expertName}
            {improvement.approvedBy && ` · Aprobado por: ${improvement.approvedBy}`}
          </p>
        )}
      </div>

      {/* Call to Action */}
      <div className="flex items-center justify-between pt-2 border-t border-green-200">
        <p className="text-xs text-green-700">
          <strong>+10 puntos</strong> de contribución
        </p>
        
        {onViewContribution && (
          <button
            onClick={onViewContribution}
            className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 transition-colors"
          >
            Ver mi dashboard
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

