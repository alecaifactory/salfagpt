/**
 * 🪄 Stella Configuration Panel
 * 
 * SuperAdmin-only panel to configure Stella CPO/CTO AI.
 * 
 * Access: alec@getaifactory.com ONLY
 * 
 * Features:
 * - Organization Prompt configuration
 * - Stella Role Prompt configuration
 * - Privacy settings
 * - AI configuration (model, temperature, tokens)
 * - Context sources toggle
 * - Test prompt functionality
 * - Version history
 * - Live preview
 */

import { useState, useEffect } from 'react';
import {
  Wand2,
  X,
  Save,
  RefreshCw,
  Eye,
  Lock,
  Brain,
  Database,
  Building2,
  TestTube,
  History,
  Sparkles,
  Shield,
  Zap,
  Check
} from 'lucide-react';
import type { StellaConfiguration, StellaConfigUpdate } from '../types/stella-config';
import { DEFAULT_STELLA_CONFIG } from '../types/stella-config';

interface StellaConfigurationPanelProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StellaConfigurationPanel({
  userId,
  userEmail,
  isOpen,
  onClose
}: StellaConfigurationPanelProps) {
  
  // SECURITY: Only alec@getaifactory.com can access
  if (userEmail !== 'alec@getaifactory.com') {
    return null;
  }
  
  const [config, setConfig] = useState<Partial<StellaConfiguration>>(DEFAULT_STELLA_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompts' | 'privacy' | 'ai' | 'context' | 'test'>('prompts');
  
  // Load configuration
  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
    }
  }, [isOpen]);
  
  async function loadConfiguration() {
    setLoading(true);
    try {
      const response = await fetch('/api/stella/configuration');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading Stella config:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function saveConfiguration() {
    setSaving(true);
    try {
      const response = await fetch('/api/stella/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        alert('✅ Configuración de Stella guardada exitosamente');
        await loadConfiguration(); // Reload to get updated version
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  }
  
  async function testPrompt() {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/stella/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: 'test-session',
          category: 'bug',
          message: 'El dashboard tarda mucho en cargar',
          conversationHistory: [],
          pageContext: { pageUrl: '/chat' },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(data.response);
      }
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestResult('Error al probar prompt');
    } finally {
      setTesting(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9998] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Wand2 className="w-7 h-7 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Configuración de Stella</h2>
              <p className="text-violet-100 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                SuperAdmin Only • {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'prompts'
                ? 'bg-white dark:bg-slate-800 text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Brain className="w-4 h-4" />
            Prompts
          </button>
          
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-800 text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            Privacy
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-800 text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Config
          </button>
          
          <button
            onClick={() => setActiveTab('context')}
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'context'
                ? 'bg-white dark:bg-slate-800 text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Context
          </button>
          
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'test'
                ? 'bg-white dark:bg-slate-800 text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <TestTube className="w-4 h-4" />
            Test
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Prompts Tab */}
              {activeTab === 'prompts' && (
                <div className="space-y-6 max-w-4xl">
                  {/* Organization Prompt */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-violet-600" />
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Organization Prompt
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Contexto organizacional que Stella siempre tiene. Incluye infraestructura, valores, políticas.
                    </p>
                    <textarea
                      value={config.organizationPrompt || ''}
                      onChange={(e) => setConfig({ ...config, organizationPrompt: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="# SalfaCorp Context&#10;&#10;## Infrastructure&#10;- Project: salfagpt&#10;- Service: cr-salfagpt-ai-ft-prod&#10;..."
                    />
                  </div>
                  
                  {/* Stella Role Prompt */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="w-5 h-5 text-violet-600" />
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Stella Role Prompt
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Define el rol de Stella como CPO/CTO AI. Su expertise, objetivos, y estilo de comunicación.
                    </p>
                    <textarea
                      value={config.stellaRolePrompt || ''}
                      onChange={(e) => setConfig({ ...config, stellaRolePrompt: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="# Stella - CPO/CTO AI&#10;&#10;## Your Role&#10;- Chief Product Officer expertise&#10;- Chief Technology Officer expertise&#10;..."
                    />
                  </div>
                </div>
              )}
              
              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-violet-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-1">
                          Privacy-First AI
                        </h4>
                        <p className="text-sm text-violet-700 dark:text-violet-300">
                          Estos settings protegen datos de usuarios y IP estratégico al enviar datos a Gemini.
                          Todos los cambios son auditados.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Privacy toggles */}
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">Hash User IDs</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Convierte userIds en hashes antes de enviar a AI (user_a7f3c2...)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.privacyConfig?.hashUserIds ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          privacyConfig: { ...config.privacyConfig!, hashUserIds: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">Redact Emails</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Oculta emails (al***@domain.com)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.privacyConfig?.redactEmails ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          privacyConfig: { ...config.privacyConfig!, redactEmails: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">Encrypt Strategic Info</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Encripta datos estratégicos (API keys, secrets, IP)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.privacyConfig?.encryptStrategicInfo ?? false}
                        onChange={(e) => setConfig({
                          ...config,
                          privacyConfig: { ...config.privacyConfig!, encryptStrategicInfo: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">Audit Trail</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Log todas las interacciones con Stella (stella_audit_log)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.privacyConfig?.auditTrail ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          privacyConfig: { ...config.privacyConfig!, auditTrail: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">PII Detection</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Auto-detecta y redacta PII (emails, teléfonos, RUT, etc)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.privacyConfig?.piiDetection ?? true}
                        onChange={(e) => setConfig({
                          ...config,
                          privacyConfig: { ...config.privacyConfig!, piiDetection: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                  </div>
                </div>
              )}
              
              {/* AI Config Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6 max-w-2xl">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Modelo de IA
                    </label>
                    <select
                      value={config.aiConfig?.model || 'gemini-2.5-flash'}
                      onChange={(e) => setConfig({
                        ...config,
                        aiConfig: { ...config.aiConfig!, model: e.target.value as any }
                      })}
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-900"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido, económico)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Preciso, costoso)</option>
                    </select>
                  </div>
                  
                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Temperature: {config.aiConfig?.temperature?.toFixed(1) || '0.7'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.aiConfig?.temperature || 0.7}
                      onChange={(e) => setConfig({
                        ...config,
                        aiConfig: { ...config.aiConfig!, temperature: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      0 = Determinístico | 1 = Creativo
                    </p>
                  </div>
                  
                  {/* Max Output Tokens */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Max Output Tokens
                    </label>
                    <input
                      type="number"
                      value={config.aiConfig?.maxOutputTokens || 1000}
                      onChange={(e) => setConfig({
                        ...config,
                        aiConfig: { ...config.aiConfig!, maxOutputTokens: parseInt(e.target.value) }
                      })}
                      min={100}
                      max={8192}
                      step={100}
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-900"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Longitud máxima de respuesta (300-1000 recomendado)
                    </p>
                  </div>
                </div>
              )}
              
              {/* Context Sources Tab */}
              {activeTab === 'context' && (
                <div className="space-y-4 max-w-2xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Selecciona qué fuentes de contexto incluir en las respuestas de Stella.
                    Más contexto = respuestas más inteligentes, pero más tokens usados.
                  </p>
                  
                  {Object.entries(config.contextSources || {}).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setConfig({
                          ...config,
                          contextSources: { ...config.contextSources!, [key]: e.target.checked }
                        })}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                  ))}
                </div>
              )}
              
              {/* Test Tab */}
              {activeTab === 'test' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                    <p className="text-sm text-violet-700 dark:text-violet-300">
                      Prueba el prompt actual con un mensaje de ejemplo. Usa esto para verificar que las respuestas de Stella sean del nivel CPO/CTO esperado.
                    </p>
                  </div>
                  
                  <button
                    onClick={testPrompt}
                    disabled={testing}
                    className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Probando...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-5 h-5" />
                        Probar con Mensaje de Ejemplo
                      </>
                    )}
                  </button>
                  
                  {testResult && (
                    <div className="bg-white dark:bg-slate-900 border-2 border-violet-200 dark:border-violet-700 rounded-lg p-4">
                      <p className="text-sm font-semibold text-violet-600 mb-2">Respuesta de Stella:</p>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {testResult}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {config.version && <span>Versión: {config.version}</span>}
            {config.updatedAt && <span className="ml-4">Actualizado: {new Date(config.updatedAt).toLocaleString('es')}</span>}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={saveConfiguration}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

