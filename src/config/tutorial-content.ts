// Tutorial Content - Feature walkthroughs
// Created: 2025-11-08
// Safe HTML demos with no sensitive user data

import type { TutorialStep } from '../components/FeatureTutorial';

export const TUTORIAL_CONTENT: Record<string, TutorialStep[]> = {
  'agent-management': [
    {
      title: 'Crea tu Primer Agente IA',
      description: 'Los agentes son asistentes inteligentes configurables con su propia personalidad, modelo, y fuentes de conocimiento.',
      highlights: [
        'Haz clic en "+ Nuevo Agente" en la barra lateral',
        'Cada agente mantiene su propio contexto y configuración',
        'Puedes crear agentes ilimitados para diferentes propósitos'
      ],
      htmlDemo: `
        <div class="space-y-4">
          <button class="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="font-medium">Nuevo Agente</span>
          </button>
          <div class="text-center text-sm text-slate-500">
            ← Haz clic aquí para crear un agente
          </div>
        </div>
      `,
      duration: 30
    },
    {
      title: 'Configura el Modelo IA',
      description: 'Elige entre Gemini 2.5 Flash (rápido y económico) o Pro (máxima calidad) según tus necesidades.',
      highlights: [
        'Flash: 94% más económico, ideal para tareas rutinarias',
        'Pro: Mayor precisión, perfecto para análisis complejos',
        'Cambia de modelo en cualquier momento'
      ],
      htmlDemo: `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="border-2 border-green-600 bg-green-50 rounded-lg p-4 cursor-pointer">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span class="font-bold text-green-900">Flash</span>
              </div>
              <p class="text-xs text-green-800">Rápido • Económico</p>
              <p class="text-xs text-green-700 mt-2">94% ahorro en costos</p>
            </div>
            <div class="border border-purple-300 bg-purple-50 rounded-lg p-4 cursor-pointer opacity-60">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <span class="font-bold text-purple-900">Pro</span>
              </div>
              <p class="text-xs text-purple-800">Preciso • Complejo</p>
            </div>
          </div>
        </div>
      `,
      duration: 45
    },
    {
      title: 'Agrega Fuentes de Contexto',
      description: 'Sube PDFs, documentos, o conecta APIs para darle conocimiento especializado a tu agente.',
      highlights: [
        'Soporta PDF, Word, Excel, CSV, URLs, y APIs',
        'Extracción automática con IA',
        'Contexto privado por agente'
      ],
      htmlDemo: `
        <div class="space-y-4">
          <div class="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8 text-center">
            <svg class="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="font-semibold text-blue-900 mb-1">Arrastra archivos aquí</p>
            <p class="text-sm text-blue-700">o haz clic para seleccionar</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-sm font-medium text-green-900">Manual.pdf</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">✓ Activo</span>
            </div>
          </div>
        </div>
      `,
      duration: 60
    }
  ],

  'context-management': [
    {
      title: 'Gestión Centralizada de Contexto',
      description: 'Administra todas tus fuentes de conocimiento desde un solo lugar.',
      highlights: [
        'Vista unificada de todos tus documentos',
        'Asigna fuentes a múltiples agentes',
        'Control granular por agente'
      ],
      duration: 40
    }
  ],

  'mcp-servers': [
    {
      title: 'Model Context Protocol (MCP)',
      description: 'Conecta AI Factory con herramientas como Cursor para análisis directo desde tu IDE.',
      highlights: [
        'Consulta métricas sin salir de tu editor',
        'Análisis de datos en lenguaje natural',
        'Seguridad multi-capa con aislamiento por dominio'
      ],
      htmlDemo: `
        <div class="space-y-4">
          <div class="bg-slate-900 rounded-lg p-4 text-green-400 font-mono text-sm">
            <div class="mb-2 text-slate-400"># Pregunta en Cursor:</div>
            <div>> "Muéstrame las estadísticas de uso"</div>
            <div class="mt-4 text-slate-400"># Respuesta:</div>
            <div class="mt-2 text-white">
              📊 Estadísticas de getaifactory.com<br/>
              • Agentes totales: 45<br/>
              • Mensajes hoy: 234<br/>
              • Usuarios activos: 12
            </div>
          </div>
        </div>
      `,
      duration: 50
    }
  ],

  'cli-tools': [
    {
      title: 'Herramientas CLI para Desarrolladores',
      description: 'Automatiza la carga de documentos y gestión de agentes desde la línea de comandos.',
      highlights: [
        'Carga masiva de PDFs a carpetas de agentes',
        'Scripts automatizados para CI/CD',
        'Integración con pipelines de desarrollo'
      ],
      htmlDemo: `
        <div class="bg-slate-900 rounded-lg p-4 text-slate-100 font-mono text-xs">
          <div class="text-green-400">$ npx salfagpt upload contextos/pdf/agentes/M001</div>
          <div class="mt-2">
            📤 Cargando 3 archivos...<br/>
            ✅ Manual.pdf (2.3 MB) → Extraído<br/>
            ✅ Guía.pdf (1.8 MB) → Extraído<br/>
            ✅ FAQ.pdf (0.5 MB) → Extraído<br/>
            <br/>
            <span class="text-green-400">✓ Completo en 45s</span>
          </div>
        </div>
      `,
      duration: 45
    }
  ]
};

// Industry-specific use case showcases
export function getIndustryShowcase(industry: string): string {
  const showcases: Record<string, string> = {
    construction: `
      <div class="space-y-4">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 class="font-semibold text-orange-900 mb-2">🏗️ Caso: Gestión de Seguridad</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-red-100 border border-red-300 rounded p-2">
              <div class="font-semibold text-red-900 text-xs mb-1">❌ Antes</div>
              <p class="text-red-800 text-xs">
                Revisar 50+ PDFs manualmente para encontrar normativas de seguridad.
                Tiempo: 3-4 horas.
              </p>
            </div>
            <div class="bg-green-100 border border-green-300 rounded p-2">
              <div class="font-semibold text-green-900 text-xs mb-1">✅ Ahora</div>
              <p class="text-green-800 text-xs">
                Pregunta al agente: "¿Cuáles son los protocolos de seguridad para excavaciones?"
                Respuesta instantánea con referencias.
              </p>
            </div>
          </div>
          <div class="mt-3 flex gap-3 text-xs font-semibold">
            <span class="text-blue-600">⏱️ 95% más rápido</span>
            <span class="text-green-600">💰 $2,500/mes ahorrados</span>
          </div>
        </div>
      </div>
    `,
    banking: `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 class="font-semibold text-emerald-900 mb-2">🏦 Caso: Cumplimiento Normativo</h4>
          <p class="text-sm text-emerald-800 mb-3">
            Agente especializado en regulaciones bancarias con acceso a manuales AML/KYC actualizados.
          </p>
          <div class="bg-white rounded border border-emerald-300 p-3 text-xs">
            <div class="font-mono text-emerald-900">
              > "¿Cuáles son los requisitos KYC para personas expuestas políticamente?"
            </div>
            <div class="mt-2 text-emerald-800">
              ✓ Respuesta con referencias a secciones específicas del manual<br/>
              ✓ Checklist de documentación requerida<br/>
              ✓ Alertas de cambios regulatorios recientes
            </div>
          </div>
        </div>
      </div>
    `,
    health: `
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="font-semibold text-red-900 mb-2">🏥 Caso: Gestión de Protocolos Clínicos</h4>
          <p class="text-sm text-red-800 mb-3">
            Cumplimiento HIPAA garantizado con aislamiento completo de datos por usuario.
          </p>
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2 text-green-700">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              <span>Datos encriptados en reposo y en tránsito</span>
            </div>
            <div class="flex items-center gap-2 text-green-700">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              <span>Aislamiento total entre pacientes/usuarios</span>
            </div>
            <div class="flex items-center gap-2 text-green-700">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              <span>Audit logs completos de acceso</span>
            </div>
          </div>
        </div>
      </div>
    `
  };

  return showcases[industry] || '';
}






