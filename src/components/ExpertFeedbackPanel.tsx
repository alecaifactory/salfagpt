import { useState } from 'react';
import { Award, X as XIcon, Send, Camera } from 'lucide-react';
import type { ExpertRating, MessageFeedback, AnnotatedScreenshot } from '../types/feedback';
import ScreenshotAnnotator from './ScreenshotAnnotator';

interface ExpertFeedbackPanelProps {
  messageId: string;
  conversationId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  onClose: () => void;
  onSubmit: (feedback: Omit<MessageFeedback, 'id' | 'timestamp' | 'source'>) => Promise<void>;
}

export default function ExpertFeedbackPanel({
  messageId,
  conversationId,
  userId,
  userEmail,
  userRole,
  onClose,
  onSubmit,
}: ExpertFeedbackPanelProps) {
  const [expertRating, setExpertRating] = useState<ExpertRating | null>(null);
  const [expertNotes, setExpertNotes] = useState('');
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [csatScore, setCSATScore] = useState<number | null>(null);
  const [screenshots, setScreenshots] = useState<AnnotatedScreenshot[]>([]);
  const [showScreenshotTool, setShowScreenshotTool] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!expertRating) {
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
        feedbackType: 'expert',
        expertRating,
        expertNotes: expertNotes.trim() || undefined,
        npsScore: npsScore ?? undefined,
        csatScore: csatScore ?? undefined,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting expert feedback:', error);
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header - Purple theme (Stella-inspired) */}
        <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-900">Feedback Experto</h2>
              <p className="text-sm text-purple-600">Evaluación de calidad profesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Expert Rating - Primary Selection */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-3">
              Calificación General *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExpertRating('inaceptable')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  expertRating === 'inaceptable'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                    : 'border-slate-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className="text-3xl mb-2">❌</div>
                <div className="font-bold text-red-700">Inaceptable</div>
                <div className="text-xs text-red-600 mt-1">Requiere corrección inmediata</div>
              </button>

              <button
                onClick={() => setExpertRating('aceptable')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  expertRating === 'aceptable'
                    ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                    : 'border-slate-200 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              >
                <div className="text-3xl mb-2">✔️</div>
                <div className="font-bold text-yellow-700">Aceptable</div>
                <div className="text-xs text-yellow-600 mt-1">Cumple con estándares básicos</div>
              </button>

              <button
                onClick={() => setExpertRating('sobresaliente')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  expertRating === 'sobresaliente'
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <div className="text-3xl mb-2">⭐</div>
                <div className="font-bold text-purple-700">Sobresaliente</div>
                <div className="text-xs text-purple-600 mt-1">NPS &gt; 98, CSAT 4+</div>
              </button>
            </div>
          </div>

          {/* NPS Score (0-10) */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              NPS Score (0-10)
              <span className="text-xs font-normal text-purple-600 ml-2">
                ¿Qué tan probable es que recomiendes esta respuesta?
              </span>
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setNpsScore(score)}
                  className={`flex-1 py-2 rounded-lg border-2 font-semibold transition-all ${
                    npsScore === score
                      ? score <= 6
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : score <= 8
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-purple-600 mt-1">
              <span>Nada probable</span>
              <span>Muy probable</span>
            </div>
          </div>

          {/* CSAT Score (1-5) */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              CSAT Score (1-5)
              <span className="text-xs font-normal text-purple-600 ml-2">
                ¿Qué tan satisfecho estás con esta respuesta?
              </span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setCSATScore(score)}
                  className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all ${
                    csatScore === score
                      ? score <= 2
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : score === 3
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-purple-600 mt-1">
              <span>Muy insatisfecho</span>
              <span>Muy satisfecho</span>
            </div>
          </div>

          {/* Expert Notes */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              Notas de Evaluación
              <span className="text-xs font-normal text-purple-600 ml-2">
                Análisis detallado y recomendaciones
              </span>
            </label>
            <textarea
              value={expertNotes}
              onChange={(e) => setExpertNotes(e.target.value)}
              placeholder="Detalla tu evaluación: qué funciona bien, qué debe mejorar, recomendaciones específicas..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-purple-900">
                Capturas de Pantalla con Anotaciones
                <span className="text-xs font-normal text-purple-600 ml-2">
                  Señala problemas o elementos específicos
                </span>
              </label>
              <button
                onClick={() => setShowScreenshotTool(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Camera className="w-4 h-4" />
                Capturar Pantalla
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="space-y-3">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.id}
                    className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-purple-900">
                        Captura {index + 1} ({screenshot.annotations.length} anotaciones)
                      </div>
                      <button
                        onClick={() => removeScreenshot(index)}
                        className="text-purple-400 hover:text-red-600"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={screenshot.imageDataUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-auto rounded-lg border border-purple-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {screenshots.length === 0 && (
              <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-purple-600">
                  Opcional: Captura pantallas para señalar elementos específicos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-200 bg-purple-50 flex items-center justify-between">
          <div className="text-sm text-purple-700">
            <span className="font-semibold">Tu feedback</span> ayuda a mejorar la calidad del agente
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!expertRating || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Feedback
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

