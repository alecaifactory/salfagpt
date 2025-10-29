/**
 * Agent Sharing Approval Modal
 * 
 * Purpose: Request approval to share agent with users
 * Requires: 3 sample Q&A pairs (bad, reasonable, outstanding)
 * Access: When agent has no approved evaluation
 */

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, ThumbsDown, ThumbsUp, Star, Send } from 'lucide-react';
import type { SampleAnswer, AgentSharingApproval } from '../types/evaluations';

interface AgentSharingApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  currentUserId: string;
  currentUserEmail: string;
  onSubmitted: () => void;
}

export default function AgentSharingApprovalModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  currentUserId,
  currentUserEmail,
  onSubmitted,
}: AgentSharingApprovalModalProps) {
  const [samples, setSamples] = useState<SampleAnswer[]>([
    {
      type: 'bad',
      question: '',
      answer: '',
      explanation: '',
    },
    {
      type: 'reasonable',
      question: '',
      answer: '',
      explanation: '',
      csatScore: 3,
      npsScore: 75,
    },
    {
      type: 'outstanding',
      question: '',
      answer: '',
      explanation: '',
      csatScore: 5,
      npsScore: 100,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const updateSample = (index: number, field: keyof SampleAnswer, value: any) => {
    const newSamples = [...samples];
    (newSamples[index] as any)[field] = value;
    setSamples(newSamples);
  };

  const isValid = samples.every(s => 
    s.question.trim().length > 0 && 
    s.answer.trim().length > 0 && 
    s.explanation.trim().length > 0
  );

  const handleSubmit = async () => {
    if (!isValid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const approval: Partial<AgentSharingApproval> = {
        agentId,
        agentName,
        requestedBy: currentUserId,
        requestedByEmail: currentUserEmail,
        requestedAt: new Date(),
        sampleQuestions: samples,
        status: 'pending',
      };

      const response = await fetch('/api/agent-sharing-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          approval,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit approval request');
      }

      alert('✅ Solicitud de aprobación enviada. Un experto la revisará pronto.');
      onSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting approval:', error);
      alert('Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Solicitud de Aprobación para Compartir</h2>
            <p className="text-sm text-slate-600 mt-1">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-semibold mb-2">Este agente no tiene una evaluación aprobada</p>
              <p className="mb-2">
                Para compartirlo con usuarios, necesitas proporcionar <strong>3 ejemplos de preguntas y respuestas esperadas</strong>:
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><strong>Mala:</strong> Ejemplo de respuesta inaceptable</li>
                <li><strong>Razonable:</strong> Respuesta aceptable (CSAT 3-, NPS &lt;98)</li>
                <li><strong>Sobresaliente:</strong> Respuesta excelente (CSAT 4+, NPS &gt;98)</li>
              </ul>
              <p className="mt-2 text-xs">
                Un experto revisará estos ejemplos y decidirá si aprobar o si requiere una evaluación completa.
              </p>
            </div>
          </div>
        </div>

        {/* Sample Forms */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bad Example */}
          <SampleForm
            title="1. Ejemplo de Respuesta MALA"
            icon={<ThumbsDown className="w-5 h-5 text-red-600" />}
            color="red"
            sample={samples[0]}
            onChange={(field, value) => updateSample(0, field, value)}
            showScores={false}
          />

          {/* Reasonable Example */}
          <SampleForm
            title="2. Ejemplo de Respuesta RAZONABLE"
            icon={<ThumbsUp className="w-5 h-5 text-yellow-600" />}
            color="yellow"
            sample={samples[1]}
            onChange={(field, value) => updateSample(1, field, value)}
            showScores={true}
            scoreLabel="CSAT 3-, NPS <98"
          />

          {/* Outstanding Example */}
          <SampleForm
            title="3. Ejemplo de Respuesta SOBRESALIENTE"
            icon={<Star className="w-5 h-5 text-green-600" />}
            color="green"
            sample={samples[2]}
            onChange={(field, value) => updateSample(2, field, value)}
            showScores={true}
            scoreLabel="CSAT 4+, NPS >98"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg border border-slate-300"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar Solicitud de Aprobación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sample Form Component
 * Reusable form for each sample type
 */
interface SampleFormProps {
  title: string;
  icon: React.ReactNode;
  color: 'red' | 'yellow' | 'green';
  sample: SampleAnswer;
  onChange: (field: keyof SampleAnswer, value: any) => void;
  showScores: boolean;
  scoreLabel?: string;
}

function SampleForm({ 
  title, 
  icon, 
  color, 
  sample, 
  onChange, 
  showScores,
  scoreLabel 
}: SampleFormProps) {
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      label: 'text-red-700',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      label: 'text-yellow-700',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      label: 'text-green-700',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} ${classes.border} border-2 rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className={`text-lg font-bold ${classes.text}`}>{title}</h3>
        {scoreLabel && (
          <span className="text-xs text-slate-600 ml-auto">{scoreLabel}</span>
        )}
      </div>

      <div className="space-y-4">
        {/* Question */}
        <div>
          <label className={`block text-sm font-semibold ${classes.label} mb-2`}>
            Pregunta de Prueba *
          </label>
          <textarea
            value={sample.question}
            onChange={(e) => onChange('question', e.target.value)}
            placeholder="Ej: ¿Cómo genero una guía de despacho?"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
          />
        </div>

        {/* Answer */}
        <div>
          <label className={`block text-sm font-semibold ${classes.label} mb-2`}>
            Respuesta Esperada *
          </label>
          <textarea
            value={sample.answer}
            onChange={(e) => onChange('answer', e.target.value)}
            placeholder={
              color === 'red' ? 'Ej: No sé' :
              color === 'yellow' ? 'Ej: Usa transacción ME21N' :
              'Ej: Tres métodos disponibles: 1) VA01 (desde pedido), 2) MIGO + ZMM_MB90...'
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={4}
          />
        </div>

        {/* Explanation */}
        <div>
          <label className={`block text-sm font-semibold ${classes.label} mb-2`}>
            Por qué este ejemplo es {color === 'red' ? 'malo' : color === 'yellow' ? 'razonable' : 'sobresaliente'} *
          </label>
          <textarea
            value={sample.explanation}
            onChange={(e) => onChange('explanation', e.target.value)}
            placeholder={
              color === 'red' ? 'Ej: Respuesta vacía, sin información útil, sin referencias' :
              color === 'yellow' ? 'Ej: Correcto pero muy breve, falta detalle de campos SAP' :
              'Ej: Comprehensivo, múltiples métodos, ejemplos específicos, campos SAP detallados'
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
          />
        </div>

        {/* Scores (for reasonable and outstanding) */}
        {showScores && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${classes.label} mb-2`}>
                CSAT Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sample.csatScore || 3}
                  onChange={(e) => onChange('csatScore', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xl font-bold text-slate-800 w-12 text-right">
                  {sample.csatScore}/5
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {color === 'yellow' ? '1-3 = Razonable' : '4-5 = Sobresaliente'}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${classes.label} mb-2`}>
                NPS Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sample.npsScore || (color === 'yellow' ? 75 : 100)}
                  onChange={(e) => onChange('npsScore', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xl font-bold text-slate-800 w-12 text-right">
                  {sample.npsScore}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {color === 'yellow' ? '0-97 = Razonable' : '98-100 = Sobresaliente'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

