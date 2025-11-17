/**
 * Ally Configuration Modal
 * 
 * Allows SuperAdmin to configure:
 * - SuperPrompt (platform-wide)
 * - Organization Prompts
 * - Domain Prompts
 * - Ally behavior settings
 */

import { useState, useEffect } from 'react';
import { X, Bot, Building2, Globe, Save, RefreshCw, Info } from 'lucide-react';

interface AllyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userRole: string;
}

export default function AllyConfigModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  userRole
}: AllyConfigModalProps) {
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'superprompt' | 'organization' | 'domain'>('superprompt');
  
  const [superPrompt, setSuperPrompt] = useState('');
  const [organizationPrompt, setOrganizationPrompt] = useState('');
  const [domainPrompt, setDomainPrompt] = useState('');
  
  // Load current configuration
  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
    }
  }, [isOpen]);
  
  const loadConfiguration = async () => {
    setLoading(true);
    
    try {
      // Load SuperPrompt
      const superResponse = await fetch('/api/ally/superprompt');
      if (superResponse.ok) {
        const data = await superResponse.json();
        setSuperPrompt(data.systemPrompt || '');
      }
      
      // Load Organization Prompt
      const orgResponse = await fetch('/api/organizations/salfa-corp');
      if (orgResponse.ok) {
        const org = await orgResponse.json();
        setOrganizationPrompt(org.allyConfig?.organizationPrompt || '');
      }
      
      // Load Domain Prompt
      const domainResponse = await fetch('/api/domains/salfagestion.cl/prompt');
      if (domainResponse.ok) {
        const domain = await domainResponse.json();
        setDomainPrompt(domain.domainPrompt || '');
      }
      
    } catch (error) {
      console.error('Error loading Ally configuration:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save SuperPrompt
      if (activeTab === 'superprompt') {
        await fetch('/api/ally/superprompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemPrompt: superPrompt, userId })
        });
      }
      
      // Save Organization Prompt
      if (activeTab === 'organization') {
        await fetch('/api/organizations/salfa-corp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            'allyConfig.organizationPrompt': organizationPrompt 
          })
        });
      }
      
      // Save Domain Prompt
      if (activeTab === 'domain') {
        await fetch('/api/domains/salfagestion.cl/prompt', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainPrompt })
        });
      }
      
      alert('✅ Configuración guardada exitosamente');
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('❌ Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Configuración de Ally
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gestiona prompts jerárquicos y comportamiento de Ally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('superprompt')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'superprompt'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              SuperPrompt
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'organization'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organization
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('domain')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'domain'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Domain
            </div>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* SuperPrompt Tab */}
              {activeTab === 'superprompt' && (
                <div className="max-w-4xl">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-semibold mb-1">SuperPrompt (Nivel Plataforma)</p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Este prompt se aplica a TODOS los usuarios en TODAS las organizaciones.
                          Define el comportamiento base de Ally, su personalidad, y conocimiento sobre Flow.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      System Prompt
                    </label>
                    <textarea
                      value={superPrompt}
                      onChange={(e) => setSuperPrompt(e.target.value)}
                      rows={24}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="Eres **Ally**, el asistente personal de IA..."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {superPrompt.length} caracteres
                    </p>
                  </div>
                </div>
              )}
              
              {/* Organization Prompt Tab */}
              {activeTab === 'organization' && (
                <div className="max-w-4xl">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-900 dark:text-purple-100">
                        <p className="font-semibold mb-1">Organization Prompt (Salfa Corp)</p>
                        <p className="text-purple-700 dark:text-purple-300">
                          Contexto específico de Salfa Corp: infraestructura, valores, áreas de negocio.
                          Todos los usuarios de Salfa Corp ven este contexto.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Organization Prompt
                    </label>
                    <textarea
                      value={organizationPrompt}
                      onChange={(e) => setOrganizationPrompt(e.target.value)}
                      rows={24}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="# SALFA CORP - CONTEXTO ORGANIZACIONAL&#10;&#10;## Infraestructura..."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {organizationPrompt.length} caracteres
                    </p>
                  </div>
                </div>
              )}
              
              {/* Domain Prompt Tab */}
              {activeTab === 'domain' && (
                <div className="max-w-4xl">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-900 dark:text-green-100">
                        <p className="font-semibold mb-1">Domain Prompt (salfagestion.cl)</p>
                        <p className="text-green-700 dark:text-green-300">
                          Contexto específico de Gestión Territorial.
                          Solo usuarios @salfagestion.cl ven este contexto.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Domain Prompt
                    </label>
                    <textarea
                      value={domainPrompt}
                      onChange={(e) => setDomainPrompt(e.target.value)}
                      rows={24}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="# DOMINIO: GESTIÓN TERRITORIAL&#10;&#10;## Área de Negocio..."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {domainPrompt.length} caracteres
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">Jerarquía de Prompts:</p>
            <p className="text-xs">SuperPrompt → Organization → Domain → User History (últimas 3 convs)</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

