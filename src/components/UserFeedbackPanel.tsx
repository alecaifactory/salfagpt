import { useState } from 'react';
import { Star, X as XIcon, Send, Camera } from 'lucide-react';
import type { UserRating, MessageFeedback, AnnotatedScreenshot } from '../types/feedback';
import ScreenshotAnnotator from './ScreenshotAnnotator';

interface UserFeedbackPanelProps {
  messageId: string;
  conversationId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  onClose: () => void;
  onSubmit: (feedback: Omit<MessageFeedback, 'id' | 'timestamp' | 'source'>) => Promise<void>;
}

export default function UserFeedbackPanel({
  messageId,
  conversationId,
  userId,
  userEmail,
  userRole,
  onClose,
  onSubmit,
}: UserFeedbackPanelProps) {
  const [starRating, setStarRating] = useState<UserRating | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [userComment, setUserComment] = useState('');
  const [screenshots, setScreenshots] = useState<AnnotatedScreenshot[]>([]);
  const [showScreenshotTool, setShowScreenshotTool] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (starRating === null) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        messageId,
        conversationId,
        userId,
        userEmail,
        userRole,
        feedbackType: 'user',
        userStars: starRating,
        userComment: userComment.trim() || undefined,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting user feedback:', error);
      alert('Error al enviar feedback. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshotComplete = (screenshot: AnnotatedScreenshot) => {
    setScreenshots([...screenshots, screenshot]);
    setShowScreenshotTool(false);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const displayRating = hoveredStar !== null ? hoveredStar : starRating;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Violet-Yellow gradient theme */}
        <div className="flex items-center justify-between p-6 border-b border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-yellow-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent">
                Tu Opinión Importa
              </h2>
              <p className="text-sm text-violet-600">Ayúdanos a mejorar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-violet-400 hover:text-violet-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent mb-3">
              ¿Qué te pareció esta respuesta? *
            </label>
            <div className="flex items-center justify-center gap-3 py-4">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setStarRating(rating as UserRating)}
                  onMouseEnter={() => setHoveredStar(rating)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="group relative transition-transform hover:scale-110"
                  aria-label={`${rating} estrellas`}
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      displayRating !== null && rating <= displayRating
                        ? rating <= 2
                          ? 'fill-red-500 text-red-500'
                          : rating === 3
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'fill-violet-500 text-violet-500'
                        : 'text-slate-300 hover:text-violet-400'
                    }`}
                  />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {rating === 0 && 'Sin calificar'}
                    {rating === 1 && 'Muy mala'}
                    {rating === 2 && 'Mala'}
                    {rating === 3 && 'Regular'}
                    {rating === 4 && 'Buena'}
                    {rating === 5 && 'Excelente'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Comment */}
          <div>
            <label className="block text-sm font-semibold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent mb-2">
              Comentario (Opcional)
            </label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-violet-200 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent">
                Capturas de Pantalla (Opcional)
              </label>
              <button
                onClick={() => setShowScreenshotTool(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-yellow-600 text-white rounded-lg hover:from-violet-700 hover:to-yellow-700 text-sm"
              >
                <Camera className="w-4 h-4" />
                Capturar
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="space-y-3">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.id}
                    className="border-2 border-violet-200 rounded-lg p-3 bg-gradient-to-r from-violet-50 to-yellow-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium bg-gradient-to-r from-violet-700 to-yellow-700 bg-clip-text text-transparent">
                        Captura {index + 1} ({screenshot.annotations.length} anotaciones)
                      </div>
                      <button
                        onClick={() => removeScreenshot(index)}
                        className="text-violet-400 hover:text-red-600"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={screenshot.imageDataUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-auto rounded-lg border border-violet-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-violet-200 bg-gradient-to-r from-violet-50 to-yellow-50 flex items-center justify-between">
          <div className="text-sm text-violet-700">
            <span className="font-semibold">Gracias</span> por ayudarnos a mejorar
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-violet-300 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={starRating === null || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-600 to-yellow-600 text-white rounded-lg hover:from-violet-700 hover:to-yellow-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot Annotator Modal */}
      {showScreenshotTool && (
        <ScreenshotAnnotator
          onComplete={handleScreenshotComplete}
          onCancel={() => setShowScreenshotTool(false)}
        />
      )}
    </div>
  );
}

