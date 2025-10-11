import React, { useState } from 'react';
import { X, Copy, Check, Mail, Users, User as UserIcon, Sparkles } from 'lucide-react';
import type { ContextSource } from '../types/context';
import type { JobRole, EmailTemplate } from '../types/sharing';
import { DEFAULT_JOB_ROLES } from '../types/sharing';

interface ShareSourceModalProps {
  source: ContextSource;
  isOpen: boolean;
  onClose: () => void;
  onGenerateEmail: (sourceId: string, role: JobRole, userComments: string, request: string) => Promise<EmailTemplate>;
}

export default function ShareSourceModal({
  source,
  isOpen,
  onClose,
  onGenerateEmail,
}: ShareSourceModalProps) {
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [userComments, setUserComments] = useState('');
  const [personalizedRequest, setPersonalizedRequest] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<EmailTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<'subject' | 'body' | null>(null);
  const [shareTarget, setShareTarget] = useState<'user' | 'group'>('user');

  if (!isOpen) return null;

  const handleGenerateEmail = async () => {
    if (!selectedRole) return;
    
    setIsGenerating(true);
    try {
      const template = await onGenerateEmail(
        source.id,
        selectedRole,
        userComments,
        personalizedRequest
      );
      setGeneratedEmail(template);
    } catch (error) {
      console.error('Error generating email:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (field: 'subject' | 'body', text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setSelectedRole(null);
    setUserComments('');
    setPersonalizedRequest('');
    setGeneratedEmail(null);
    setCopiedField(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600">
          <div>
            <h2 className="text-2xl font-bold text-white">Compartir Documento</h2>
            <p className="text-sm text-green-100 mt-1">{source.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Share Target Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Compartir con
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShareTarget('user')}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  shareTarget === 'user'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <UserIcon className={`w-6 h-6 ${shareTarget === 'user' ? 'text-green-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-slate-800">Usuario</div>
                  <div className="text-xs text-slate-600">Compartir con una persona</div>
                </div>
              </button>

              <button
                onClick={() => setShareTarget('group')}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  shareTarget === 'group'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <Users className={`w-6 h-6 ${shareTarget === 'group' ? 'text-green-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-slate-800">Grupo</div>
                  <div className="text-xs text-slate-600">Compartir con un equipo</div>
                </div>
              </button>
            </div>
          </div>

          {/* Job Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rol del Destinatario
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_JOB_ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-800">{role.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* User Comments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tus Comentarios sobre el Documento
            </label>
            <textarea
              value={userComments}
              onChange={(e) => setUserComments(e.target.value)}
              placeholder="Ej: Este documento contiene información clave sobre nuestra estrategia Q4..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Personalized Request */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Solicitud Personalizada (Opcional)
            </label>
            <textarea
              value={personalizedRequest}
              onChange={(e) => setPersonalizedRequest(e.target.value)}
              placeholder="Ej: ¿Podrías revisar las secciones de análisis financiero y darme tu opinión?"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Generate Button */}
          {!generatedEmail && (
            <button
              onClick={handleGenerateEmail}
              disabled={!selectedRole || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Generando Email con AI...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Generar Email Personalizado
                </>
              )}
            </button>
          )}

          {/* Generated Email */}
          {generatedEmail && (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Email Generado con Éxito</span>
              </div>

              {/* Email Subject */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Asunto del Email
                  </label>
                  <button
                    onClick={() => handleCopy('subject', generatedEmail.subject)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    {copiedField === 'subject' ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-800 font-medium">
                    {generatedEmail.subject}
                  </p>
                </div>
              </div>

              {/* Email Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Contenido del Email
                  </label>
                  <button
                    onClick={() => handleCopy('body', generatedEmail.body)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    {copiedField === 'body' ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">
                    {generatedEmail.body}
                  </pre>
                </div>
              </div>

              {/* Summary */}
              {generatedEmail.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-700 mb-2">
                    Resumen del Documento:
                  </p>
                  <p className="text-sm text-blue-900">{generatedEmail.summary}</p>
                </div>
              )}

              {/* New Email Button */}
              <button
                onClick={() => setGeneratedEmail(null)}
                className="w-full px-4 py-2 text-green-600 font-medium hover:bg-green-50 rounded-lg transition-colors"
              >
                Generar Nuevo Email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <Mail className="w-4 h-4" />
            <span>
              Integración de envío de emails próximamente. Por ahora, copia el contenido.
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

