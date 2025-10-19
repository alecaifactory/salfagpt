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
  // RAG Settings
  ragEnabled?: boolean;              // Enable RAG search (default: true)
  ragTopK?: number;                  // Number of chunks to retrieve (default: 5)
  ragChunkSize?: number;             // Tokens per chunk (default: 500)
  ragMinSimilarity?: number;         // Minimum similarity threshold (default: 0.5)
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración de Usuario</h2>
            {userName && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{userName}</p>
            )}
            {userEmail && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="flex-1 p-6 grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Preferred Model */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
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

              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                <p className="text-[11px] text-blue-800">
                  💡 <strong>Recomendación:</strong> Usa Flash para la mayoría. Pro para análisis profundos.
                </p>
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Instrucciones del Sistema
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                rows={5}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-slate-700 dark:text-white resize-none"
                placeholder="Eres un asistente útil y profesional..."
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Define tono, estilo y formato de respuestas.
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Idioma Preferido
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            {/* RAG Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    🔍 Búsqueda Vectorial (RAG)
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Busca solo las partes relevantes de los documentos
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ragEnabled !== false} // Default: true
                    onChange={(e) => setSettings({ ...settings, ragEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {/* RAG Benefits */}
              {settings.ragEnabled !== false && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-2">
                    <p className="text-green-600 dark:text-green-400 font-semibold">Eficiencia</p>
                    <p className="text-slate-700 dark:text-slate-300">95% menos tokens</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">Precisión</p>
                    <p className="text-slate-700 dark:text-slate-300">Solo lo relevante</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded p-2">
                    <p className="text-purple-600 dark:text-purple-400 font-semibold">Velocidad</p>
                    <p className="text-slate-700 dark:text-slate-300">2x más rápido</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Theme Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                El tema se guarda automáticamente y persiste entre sesiones.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                💾 Guardado Automático
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tus preferencias se guardan localmente en tu navegador. 
                Puedes cambiar el modelo en cualquier momento durante una conversación.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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

