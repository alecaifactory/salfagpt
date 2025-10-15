import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Moon, Sun } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
  currentSettings: UserSettings;
  userName?: string;
  userEmail?: string;
}

export interface UserSettings {
  preferredModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  language: string;
  theme?: 'light' | 'dark';
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings,
  userName,
  userEmail,
}: UserSettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // 🔑 Hook para cerrar con ESC
  useModalClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
      // Load theme from localStorage
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      setCurrentTheme(savedTheme || 'light');
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleThemeToggle = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Configuración de Usuario</h2>
            {userName && (
              <p className="text-sm text-slate-600 mt-1">{userName}</p>
            )}
            {userEmail && (
              <p className="text-xs text-slate-500">{userEmail}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preferred Model */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Modelo Preferido para Chat
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({ ...settings, preferredModel: 'gemini-2.5-flash' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  settings.preferredModel === 'gemini-2.5-flash'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className={`w-5 h-5 ${settings.preferredModel === 'gemini-2.5-flash' ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-slate-800">Flash</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Rápido
                  </span>
                </div>
                <p className="text-xs text-slate-600">Respuestas rápidas y económicas</p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  94% más barato 💰
                </p>
              </button>

              <button
                onClick={() => setSettings({ ...settings, preferredModel: 'gemini-2.5-pro' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  settings.preferredModel === 'gemini-2.5-pro'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className={`w-5 h-5 ${settings.preferredModel === 'gemini-2.5-pro' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-slate-800">Pro</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Avanzado
                  </span>
                </div>
                <p className="text-xs text-slate-600">Mayor precisión y análisis profundo</p>
                <p className="text-xs text-purple-600 font-medium mt-1">
                  Tareas complejas
                </p>
              </button>
            </div>

            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 <strong>Recomendación:</strong> Usa Flash para la mayoría de tus conversaciones. 
                Cambia a Pro cuando necesites análisis más profundos o respuestas más precisas.
              </p>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instrucciones del Sistema (System Prompt)
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Eres un asistente útil y profesional..."
            />
            <p className="text-xs text-slate-500 mt-2">
              Define cómo quieres que el AI se comporte en todas tus conversaciones. 
              Puedes especificar el tono, estilo, formato de respuestas, etc.
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Idioma Preferido
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Tema de Interfaz
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeToggle('light')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  currentTheme === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">Claro</span>
              </button>
              <button
                onClick={() => handleThemeToggle('dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  currentTheme === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">Oscuro</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              El tema se guarda automáticamente y persiste entre sesiones.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">
              💾 Guardado Automático
            </h4>
            <p className="text-xs text-slate-600">
              Tus preferencias se guardan localmente en tu navegador. 
              Puedes cambiar el modelo en cualquier momento durante una conversación.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

