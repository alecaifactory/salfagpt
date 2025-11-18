import { CheckCircle, X, ExternalLink, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FeedbackSuccessToastProps {
  ticketId: string;
  feedbackType: 'expert' | 'user';
  onClose: () => void;
  onViewTicket: () => void;
}

export default function FeedbackSuccessToast({
  ticketId,
  feedbackType,
  onClose,
  onViewTicket,
}: FeedbackSuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleViewTicket = () => {
    handleClose();
    setTimeout(() => {
      onViewTicket();
    }, 200);
  };

  const themeColors = feedbackType === 'expert'
    ? {
        gradient: 'from-purple-500 to-violet-600',
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        text: 'text-purple-900',
        icon: 'text-purple-600',
      }
    : {
        gradient: 'from-violet-500 to-yellow-500',
        bg: 'bg-gradient-to-r from-violet-50 to-yellow-50',
        border: 'border-violet-300',
        text: 'bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent',
        icon: 'text-violet-600',
      };

  return (
    <div className="fixed top-6 right-6 z-[60] pointer-events-none">
      <div
        className={`pointer-events-auto transform transition-all duration-300 ${
          isVisible && !isLeaving
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
      >
        <div className={`
          w-96 rounded-xl shadow-2xl border-2 ${themeColors.border}
          ${themeColors.bg} backdrop-blur-sm
          overflow-hidden
        `}>
          {/* Header gradient bar */}
          <div className={`h-1.5 bg-gradient-to-r ${themeColors.gradient}`} />

          {/* Content */}
          <div className="p-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full 
                bg-gradient-to-br ${themeColors.gradient}
                flex items-center justify-center
                shadow-lg
              `}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  ¡Feedback Enviado!
                </h3>
                <p className="text-sm text-slate-600">
                  {feedbackType === 'expert' 
                    ? 'Tu evaluación experta fue recibida'
                    : 'Tu opinión fue recibida exitosamente'}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Info */}
            <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className={`w-5 h-5 ${themeColors.icon}`} />
                <span className="font-semibold text-slate-800 text-sm">
                  Ticket Generado
                </span>
              </div>
              <div className="pl-8">
                <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {ticketId.substring(0, 20)}...
                </code>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleViewTicket}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3
                bg-gradient-to-r ${themeColors.gradient}
                text-white font-semibold rounded-lg
                hover:shadow-lg transform hover:scale-[1.02]
                transition-all duration-200
              `}
            >
              <ExternalLink className="w-4 h-4" />
              Ver Seguimiento de Mi Ticket
            </button>

            {/* Footer message */}
            <p className="text-xs text-center text-slate-500 mt-3">
              Puedes ver el progreso en cualquier momento desde el menú de usuario
            </p>
          </div>

          {/* Progress bar (auto-close timer) */}
          <div className="h-1 bg-slate-200 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${themeColors.gradient} animate-progress`}
              style={{
                animation: 'progress 8s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress 8s linear forwards;
        }
      `}</style>
    </div>
  );
}















