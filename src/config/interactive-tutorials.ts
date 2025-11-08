// Interactive Feature Tutorials - Complete UI/CLI/SDK Examples
// Created: 2025-11-08
// Each tutorial shows: What, How, Where, Why (user feedback), Use Cases

export interface FeatureTutorial {
  featureId: string;
  title: string;
  type: 'ui' | 'cli' | 'sdk' | 'integration';
  estimatedDuration?: number; // seconds
  entryPointUrl?: string; // Where to start tutorial
  
  // What is it?
  overview: string;
  
  // Where to find it?
  location: {
    description: string;
    steps: string[];
    screenshot?: string; // Path to visual guide
  };
  
  // How to use it?
  usage: {
    description: string;
    interactiveDemo: string; // HTML/CSS demo
    codeExample?: string; // Code snippet
  };
  
  // Why? (User feedback)
  userFeedback: {
    requestCount: number;
    requestedBy: string[];
    commonPainPoint: string;
    howItHelps: string;
  };
  
  // Use cases
  useCases: {
    persona: string;
    scenario: string;
    beforeAfter: {
      before: string;
      after: string;
      timeSaved: string;
    };
  }[];
}

export const INTERACTIVE_TUTORIALS: Record<string, FeatureTutorial> = {
  'changelog-notifications': {
    featureId: 'changelog-notifications',
    title: 'Changelog y Notificaciones',
    type: 'ui',
    estimatedDuration: 90,
    entryPointUrl: '/changelog',
    overview: 'Sistema de changelog con notificaciones en tiempo real que te mantiene informado de nuevas features, mejoras, y actualizaciones.',
    
    location: {
      description: 'Accede al changelog desde dos lugares en la plataforma:',
      steps: [
        '1. Haz clic en tu avatar (esquina inferior izquierda)',
        '2. En el menú, ve a la columna "Producto"',
        '3. Haz clic en "Novedades" (tiene badge NUEVO)',
        '',
        'O también:',
        '1. Observa el ícono de campana 🔔 en el header del sidebar',
        '2. Si hay notificaciones, verás un badge rojo con el número',
        '3. Haz clic para ver las notificaciones recientes',
        '4. Haz clic en cualquier notificación para ir al changelog'
      ]
    },
    
    usage: {
      description: 'El changelog te permite filtrar por industria y categoría, expandir detalles, y ver ejemplos interactivos de cada feature.',
      interactiveDemo: `
        <div style="max-width: 800px; font-family: -apple-system, sans-serif;">
          <!-- Step 1: Notification Bell -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Paso 1: Notificaciones</div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="flex-shrink: 0; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">
                <div style="position: relative; display: inline-block;">
                  <svg width="24" height="24" fill="none" stroke="#374151" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <span style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; border-radius: 10px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">3</span>
                </div>
              </div>
              <div style="flex: 1;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #111827;">Haz clic en la campana</p>
                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">El badge rojo muestra cuántas notificaciones no has leído. Se actualiza automáticamente cada 30 segundos.</p>
              </div>
            </div>
          </div>

          <!-- Step 2: Dropdown -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Paso 2: Ver Actualizaciones</div>
            <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; max-width: 320px;">
              <div style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 600; color: #111827;">Notificaciones</span>
                <button style="font-size: 11px; color: #3b82f6; background: none; border: none; font-weight: 500;">Todas ✓</button>
              </div>
              <div style="padding: 12px 14px; background: #eff6ff; cursor: pointer;">
                <div style="display: flex; gap: 10px;">
                  <div style="flex-shrink: 0; width: 28px; height: 28px; background: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center;">🎉</div>
                  <div style="flex: 1;">
                    <p style="margin: 0 0 3px 0; font-size: 12px; font-weight: 600; color: #1e3a8a;">Nueva versión 0.3.0</p>
                    <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">7 nuevas features disponibles</p>
                    <span style="font-size: 10px; color: #3b82f6; font-weight: 500;">Ver Changelog →</span>
                  </div>
                </div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">Haz clic en cualquier notificación para ver los detalles completos.</p>
          </div>

          <!-- Step 3: Changelog Page -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Paso 3: Explorar Features</div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">
              <div style="border-left: 2px solid #d1d5db; padding-left: 16px;">
                <h4 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600; color: #111827;">MCP Servers</h4>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">Consulta métricas desde Cursor</p>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                  <span style="background: #f3f4f6; padding: 3px 8px; font-size: 10px; font-weight: 500; color: #374151;">developer-tools</span>
                  <span style="font-size: 11px; color: #9ca3af;">3 solicitudes</span>
                </div>
                <div style="background: #1e293b; border-radius: 4px; padding: 12px; font-family: monospace; font-size: 11px; color: #cbd5e1; line-height: 1.6;">
                  <div style="color: #22c55e;">$ cursor</div>
                  <div style="color: #94a3b8; margin-top: 6px;">> "Stats de getaifactory.com"</div>
                  <div style="color: #e2e8f0; margin-top: 6px;">📊 Agentes: <span style="color: #22c55e; font-weight: 600;">45</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      codeExample: `// Acceso programático
const response = await fetch('/api/changelog');
const { entries } = await response.json();`
    },
    
    userFeedback: {
      requestCount: 5,
      requestedBy: ['Product team', 'Multiple users in interviews'],
      commonPainPoint: 'Los usuarios descubrían features por accidente o por emails genéricos. No sabían qué era nuevo o por qué se había agregado.',
      howItHelps: 'Notificaciones instantáneas + changelog filtrable por industria + transparencia en priorización = 95% descubrimiento en 48 horas vs 2 semanas antes.'
    },
    
    useCases: [
      {
        persona: 'Construction Manager',
        scenario: 'Necesita saber si hay nuevas features de compliance o seguridad',
        beforeAfter: {
          before: 'Revisar emails, preguntar al equipo, o descubrir por accidente',
          after: 'Notificación instantánea → Filtrar por "Construcción" → Ver casos de uso → Tutorial de 30s → Usar feature',
          timeSaved: '2 horas/semana'
        }
      },
      {
        persona: 'Banking Compliance Officer',
        scenario: 'Evaluar si nuevas features cumplen requisitos regulatorios',
        beforeAfter: {
          before: 'Solicitar demo, leer documentación técnica extensa, hacer pruebas',
          after: 'Ver changelog → Leer caso de uso de Banking → Ver compliance badges → Aprobar en 10 minutos',
          timeSaved: '4 horas/feature'
        }
      }
    ]
  },

  'mcp-servers': {
    featureId: 'mcp-servers',
    title: 'MCP Servers - Cursor Integration',
    type: 'integration',
    estimatedDuration: 180,
    entryPointUrl: '/chat?openMenu=true&section=mcp',
    overview: 'Model Context Protocol permite consultar métricas de la plataforma directamente desde Cursor AI sin salir de tu IDE.',
    
    location: {
      description: 'Para configurar MCP con Cursor:',
      steps: [
        '1. Abre tu menu de usuario (esquina inferior izquierda)',
        '2. Ve a "Gestión de Dominios" → "MCP Servers"',
        '3. Haz clic en "Crear Servidor MCP"',
        '4. Copia el API key generado',
        '5. Agrega a ~/.cursor/mcp.json',
        '6. Reinicia Cursor',
        '7. Ya puedes hacer consultas en lenguaje natural'
      ],
      screenshot: '/images/tutorials/mcp-setup.png'
    },
    
    usage: {
      description: 'Una vez configurado, simplemente pregunta a Cursor en lenguaje natural sobre tus métricas.',
      interactiveDemo: `
        <div style="max-width: 800px; font-family: -apple-system, sans-serif;">
          <!-- Setup -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Setup (Solo una vez)</div>
            
            <div style="background: #1e293b; border-radius: 6px; padding: 16px; font-family: 'Monaco', monospace; font-size: 12px;">
              <div style="color: #94a3b8; margin-bottom: 8px;">// ~/.cursor/mcp.json</div>
              <div style="color: #cbd5e1;">{</div>
              <div style="color: #cbd5e1; padding-left: 16px;">"mcpServers": {</div>
              <div style="color: #cbd5e1; padding-left: 32px;">"ai-factory": {</div>
              <div style="color: #cbd5e1; padding-left: 48px;">"url": <span style="color: #86efac;">"http://localhost:3000/api/mcp/usage-stats"</span>,</div>
              <div style="color: #cbd5e1; padding-left: 48px;">"apiKey": <span style="color: #fbbf24;">"mcp_localhost_..."</span></div>
              <div style="color: #cbd5e1; padding-left: 32px;">}</div>
              <div style="color: #cbd5e1; padding-left: 16px;">}</div>
              <div style="color: #cbd5e1;">}</div>
            </div>
          </div>

          <!-- Usage Example -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Uso en Cursor</div>
            
            <!-- Cursor IDE Mockup -->
            <div style="background: #1e1e1e; border-radius: 8px; overflow: hidden; border: 1px solid #374151;">
              <!-- Tabs -->
              <div style="background: #252526; padding: 8px 12px; border-bottom: 1px solid #1e1e1e; display: flex; gap: 8px;">
                <div style="background: #1e1e1e; padding: 6px 12px; border-radius: 4px; font-size: 11px; color: #cccccc; font-family: monospace;">analytics.ts</div>
                <div style="background: #2d2d2d; padding: 6px 12px; border-radius: 4px; font-size: 11px; color: #858585; font-family: monospace;">package.json</div>
              </div>
              
              <!-- Chat Area -->
              <div style="padding: 20px; font-family: monospace; font-size: 13px;">
                <div style="background: #2d3748; padding: 14px; border-radius: 6px; border-left: 3px solid #3b82f6; margin-bottom: 16px;">
                  <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">Tu pregunta:</div>
                  <div style="color: #e2e8f0;">Muéstrame las estadísticas de uso de getaifactory.com</div>
                </div>
                
                <div style="background: #1a2332; padding: 14px; border-radius: 6px; border-left: 3px solid #10b981;">
                  <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px;">Cursor AI con MCP:</div>
                  <div style="color: #22c55e; font-weight: 600; margin-bottom: 10px;">📊 Estadísticas de getaifactory.com</div>
                  <div style="color: #cbd5e1; line-height: 1.8;">
                    <div>Agentes totales: <span style="color: #22c55e; font-weight: 600;">45</span></div>
                    <div>Mensajes hoy: <span style="color: #22c55e; font-weight: 600;">234</span></div>
                    <div>Usuarios activos (7d): <span style="color: #22c55e; font-weight: 600;">12</span></div>
                    <div>Costo promedio/mensaje: <span style="color: #fbbf24; font-weight: 600;">$0.03</span></div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;">
                      <div style="font-size: 12px; color: #94a3b8;">Modelo más usado:</div>
                      <div>Flash: <span style="color: #22c55e;">88%</span> | Pro: <span style="color: #60a5fa;">12%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 12px; padding: 12px; background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px;">
              <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.5;">
                <strong>💡 Pro Tip:</strong> No necesitas cambiar de herramienta. Analiza métricas mientras programas.
              </p>
            </div>
          </div>

          <!-- Where to find API Key -->
          <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #115e59; text-transform: uppercase; margin-bottom: 8px;">Dónde Encontrar tu API Key</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #0f766e; line-height: 1.8;">
              <li>Menú usuario → "Gestión de Dominios"</li>
              <li>Click en "MCP Servers"</li>
              <li>Click "Crear Servidor"</li>
              <li>Copia el key (solo se muestra una vez)</li>
            </ol>
          </div>
        </div>
      `,
      codeExample: `// mcp.json configuration
{
  "mcpServers": {
    "ai-factory": {
      "url": "https://your-domain.com/api/mcp/usage-stats",
      "apiKey": "mcp_production_..."
    }
  }
}`
    },
    
    userFeedback: {
      requestCount: 3,
      requestedBy: ['Developer team', 'CTOs'],
      commonPainPoint: 'Desarrolladores perdían tiempo cambiando entre IDE y dashboard para ver métricas. Cada cambio de contexto rompe el flow.',
      howItHelps: 'Consultas en lenguaje natural desde Cursor. Sin salir del editor. Decisiones data-driven en segundos.'
    },
    
    useCases: [
      {
        persona: 'CTO de Fintech',
        scenario: 'Revisando código y necesita verificar costos de API antes de merge',
        beforeAfter: {
          before: 'Abrir browser → Login al dashboard → Buscar métricas → Volver a IDE (5 minutos, contexto perdido)',
          after: 'Pregunta en Cursor "¿Cuánto costó ayer?" → Respuesta instantánea → Continúa programando',
          timeSaved: '5 horas/semana para equipo de 5 devs'
        }
      },
      {
        persona: 'Developer Lead en SMB',
        scenario: 'Optimizando uso de modelos para reducir costos',
        beforeAfter: {
          before: 'Excel con exports, cálculos manuales, gráficos en Sheets',
          after: 'Cursor: "Breakdown de costos por agente" → Análisis instantáneo → Optimización inmediata',
          timeSaved: '$1,500/mes ahorrados en optimización'
        }
      }
    ]
  },

  'cli-tools': {
    featureId: 'cli-tools',
    title: 'CLI para Desarrolladores',
    type: 'cli',
    estimatedDuration: 120,
    entryPointUrl: '/changelog#cli-tools',
    overview: 'Herramienta de línea de comandos para automatizar uploads, gestionar agentes, y ejecutar operaciones batch.',
    
    location: {
      description: 'El CLI se instala globalmente o se usa con npx:',
      steps: [
        '# Opción 1: Instalación global',
        'npm install -g salfagpt',
        '',
        '# Opción 2: Uso directo (sin instalación)',
        'npx salfagpt <comando>',
        '',
        '# Verificar instalación:',
        'salfagpt --version'
      ]
    },
    
    usage: {
      description: 'Comandos principales para automatización:',
      interactiveDemo: `
        <div style="max-width: 800px; font-family: -apple-system, sans-serif;">
          <!-- Command 1: Upload -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Comando: Upload Masivo</div>
            
            <div style="background: #0f172a; border-radius: 6px; overflow: hidden; border: 1px solid #1e293b;">
              <!-- Terminal Header -->
              <div style="background: #1e293b; padding: 8px 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #334155;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></div>
                <span style="margin-left: 8px; font-size: 11px; color: #64748b; font-family: monospace;">zsh</span>
              </div>
              
              <!-- Terminal Content -->
              <div style="padding: 16px; font-family: 'Monaco', monospace; font-size: 13px; line-height: 1.7;">
                <div style="margin-bottom: 12px;">
                  <span style="color: #22c55e;">$</span>
                  <span style="color: #e2e8f0;"> npx salfagpt upload contextos/pdf/agentes/M001</span>
                </div>
                
                <div style="color: #94a3b8; margin: 12px 0;">📤 Cargando 3 archivos...</div>
                
                <div style="color: #cbd5e1; line-height: 1.8;">
                  <div><span style="color: #22c55e;">✓</span> Manual_Seguridad.pdf <span style="color: #94a3b8;">(2.3 MB)</span> → Extraído en <span style="color: #fbbf24;">8.2s</span></div>
                  <div><span style="color: #22c55e;">✓</span> Guia_Operaciones.pdf <span style="color: #94a3b8;">(1.8 MB)</span> → Extraído en <span style="color: #fbbf24;">6.1s</span></div>
                  <div><span style="color: #22c55e;">✓</span> FAQ_Tecnico.pdf <span style="color: #94a3b8;">(0.5 MB)</span> → Extraído en <span style="color: #fbbf24;">2.3s</span></div>
                </div>
                
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #1e293b;">
                  <div style="color: #22c55e; font-weight: 600;">✓ Completo en 16.6s</div>
                  <div style="color: #94a3b8; font-size: 12px;">💾 3 fuentes guardadas en agente M001</div>
                  <div style="color: #64748b; font-size: 11px;">🔗 cli-session-abc123xyz</div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 12px; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px;">
              <p style="margin: 0; font-size: 12px; color: #1e3a8a; line-height: 1.5;">
                <strong>📍 Tracking:</strong> Todas las operaciones CLI se registran en Firestore (colección <code style="background: #dbeafe; padding: 2px 6px; border-radius: 3px; font-family: monospace;">cli_events</code>) para auditoría completa.
              </p>
            </div>
          </div>

          <!-- Command 2: List Agents -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Comando: Listar Agentes</div>
            
            <div style="background: #0f172a; border-radius: 6px; padding: 16px; font-family: monospace; font-size: 12px;">
              <div style="color: #22c55e;">$ salfagpt list-agents</div>
              <div style="color: #cbd5e1; margin-top: 12px; line-height: 1.8;">
                <div style="margin-bottom: 8px;">📋 Agentes disponibles:</div>
                <div style="padding-left: 12px;">
                  <div>• <span style="color: #60a5fa;">M001</span> - Asistente Legal Territorial</div>
                  <div style="padding-left: 16px; color: #94a3b8; font-size: 11px;">10 fuentes • 45 conversaciones • Pro</div>
                  
                  <div style="margin-top: 6px;">• <span style="color: #22c55e;">S001</span> - Gestión de Bodegas</div>
                  <div style="padding-left: 16px; color: #94a3b8; font-size: 11px;">5 fuentes • 23 conversaciones • Flash</div>
                  
                  <div style="margin-top: 6px;">• <span style="color: #a78bfa;">S002</span> - Mantenimiento MAQSA</div>
                  <div style="padding-left: 16px; color: #94a3b8; font-size: 11px;">8 fuentes • 12 conversaciones • Flash</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Use in CI/CD -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Integración CI/CD</div>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; font-family: monospace; font-size: 11px; color: #374151;">
              <div style="color: #6b7280;"># .github/workflows/update-context.yml</div>
              <div style="margin-top: 8px;">
                <div>- name: Update Agent Context</div>
                <div style="padding-left: 12px;">run: |</div>
                <div style="padding-left: 24px;">npx salfagpt upload ./docs/latest</div>
                <div style="padding-left: 24px;">--agent M001</div>
                <div style="padding-left: 24px;">--api-key \${{ secrets.SALFAGPT_KEY }}</div>
              </div>
            </div>
            
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
              <strong style="color: #111827;">Valor:</strong> Contextos se actualizan automáticamente cuando documentación cambia. Cero intervención manual.
            </p>
          </div>
        </div>
      `,
      codeExample: `// Uso programático
import { exec } from 'child_process';

exec('npx salfagpt upload ./docs --agent M001', (error, stdout) => {
  if (error) {
    console.error('Upload failed:', error);
    return;
  }
  console.log('✓ Upload complete:', stdout);
});`
    },
    
    userFeedback: {
      requestCount: 4,
      requestedBy: ['DevOps teams', 'SMB owners'],
      commonPainPoint: 'Subir 50+ PDFs manualmente cada vez que documentación se actualiza. Proceso tedioso, propenso a errores, imposible de automatizar.',
      howItHelps: 'Una línea de comando procesa carpeta completa. Integrable en GitHub Actions, cron jobs, o cualquier automation.'
    },
    
    useCases: [
      {
        persona: 'DevOps Engineer en Fintech',
        scenario: 'Actualizar compliance docs cuando regulaciones cambian',
        beforeAfter: {
          before: 'Subir 50 PDFs uno por uno via UI (4 horas), riesgo de olvidar archivos',
          after: 'Script: npx salfagpt upload ./compliance --agent M001 (20 minutos, todo incluido)',
          timeSaved: '48 horas/año ahorradas'
        }
      },
      {
        persona: 'Founder de SMB',
        scenario: 'Actualizar catálogo de productos semanalmente',
        beforeAfter: {
          before: 'Upload manual de Excel cada semana (30 minutos)',
          after: 'Cron job automático cada lunes (0 minutos)',
          timeSaved: '26 horas/año'
        }
      }
    ]
  },

  'agent-sharing': {
    featureId: 'agent-sharing',
    title: 'Compartir Agentes',
    type: 'ui',
    estimatedDuration: 150,
    entryPointUrl: '/chat?openMenu=true&section=agents',
    overview: 'Marca agentes como públicos para que tu equipo pueda clonarlos y reutilizar configuraciones validadas.',
    
    location: {
      description: 'Para compartir un agente:',
      steps: [
        '1. Abre el agente que quieres compartir',
        '2. Haz clic en el ícono de configuración (⚙️) del agente',
        '3. En el modal, busca la sección "Compartir"',
        '4. Activa el toggle "Agente Público"',
        '5. Guarda cambios',
        '6. Tu equipo ahora lo ve en la galería de agentes'
      ]
    },
    
    usage: {
      description: 'Una vez público, otros usuarios pueden clonarlo y personalizarlo:',
      interactiveDemo: `
        <div style="max-width: 800px; font-family: -apple-system, sans-serif;">
          <!-- Agent Card in Gallery -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Galería de Agentes Públicos</div>
            
            <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
              <!-- Agent Header -->
              <div style="padding: 16px; border-bottom: 1px solid #f3f4f6;">
                <div style="display: flex; align-items: start; justify-between; margin-bottom: 10px;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                      <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">Asistente AML/KYC</h4>
                      <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700;">PÚBLICO</span>
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">Análisis de compliance bancario con regulaciones actualizadas</p>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: 700; color: #111827;">8</div>
                    <div style="font-size: 11px; color: #6b7280;">clones</div>
                  </div>
                </div>
                
                <!-- Creator Info -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">JD</div>
                  <div>
                    <div style="font-size: 12px; font-weight: 500; color: #374151;">Juan Díaz</div>
                    <div style="font-size: 10px; color: #9ca3af;">Depto. Legal • Validado ✓</div>
                  </div>
                </div>
              </div>
              
              <!-- Agent Stats -->
              <div style="padding: 16px; background: #f9fafb;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                  <div>
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">Modelo</div>
                    <div style="font-size: 13px; font-weight: 600; color: #374151;">Pro</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">Fuentes</div>
                    <div style="font-size: 13px; font-weight: 600; color: #374151;">5</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">Conversaciones</div>
                    <div style="font-size: 13px; font-weight: 600; color: #374151;">67</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px;">Precisión</div>
                    <div style="font-size: 13px; font-weight: 600; color: #10b981;">95%</div>
                  </div>
                </div>
              </div>
              
              <!-- Action Button -->
              <div style="padding: 14px 16px; border-top: 1px solid #e5e7eb;">
                <button style="width: 100%; background: #111827; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1f2937'" onmouseout="this.style.background='#111827'">
                  Clonar Agente →
                </button>
              </div>
            </div>
          </div>

          <!-- How Cloning Works -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase; margin-bottom: 10px;">Qué Sucede al Clonar</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #047857; line-height: 1.8;">
              <li>Se crea una copia del agente con el mismo modelo y system prompt</li>
              <li>Se copian las referencias a fuentes de contexto (no duplica PDFs)</li>
              <li>Empieza con 0 conversaciones (memoria nueva)</li>
              <li>Puedes personalizarlo sin afectar el original</li>
              <li>Actualizaciones del original son opcionales</li>
            </ol>
          </div>

          <!-- Where to Find -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 10px;">Dónde Encontrar Agentes Públicos</div>
            <div style="font-size: 12px; color: #374151; line-height: 1.7;">
              <div style="margin-bottom: 8px;"><strong>Opción 1:</strong> Sidebar → Sección "Agentes" → Tab "Públicos"</div>
              <div style="margin-bottom: 8px;"><strong>Opción 2:</strong> Menú → "Gestión de Agentes" → Tab "Galería Pública"</div>
              <div style="padding: 12px; background: #f9fafb; border-radius: 4px; margin-top: 12px; font-size: 11px; color: #6b7280;">
                💡 Solo verás agentes públicos de tu dominio (ej: todos los usuarios @getaifactory.com)
              </div>
            </div>
          </div>
        </div>
      `,
      codeExample: `// Marcar agente como público via API
await fetch('/api/agents/:id/share', {
  method: 'PUT',
  body: JSON.stringify({ isPublic: true })
});`
    },
    
    userFeedback: {
      requestCount: 8,
      requestedBy: ['Banking team', 'Health compliance team', 'Legal department'],
      commonPainPoint: 'Cada nuevo analista configuraba su agente desde cero (3 horas). Inconsistencias en prompts y contexto generaban resultados diferentes. Experts no podían compartir su conocimiento fácilmente.',
      howItHelps: 'Expert configura una vez, 20 personas lo clonan. Todos usan la misma configuración validada. Calidad consistente + onboarding instantáneo.'
    },
    
    useCases: [
      {
        persona: 'Banking Compliance Manager',
        scenario: 'Onboarding de 5 nuevos analistas de AML/KYC',
        beforeAfter: {
          before: 'Cada analista: 3 horas de configuración + 2 días de pruebas = 5 días total para el equipo',
          after: 'Cada analista: Clonar agente del experto (5 minutos) + 1 hora de pruebas = 5 horas total',
          timeSaved: '97% reducción en tiempo de setup (120 horas → 5 horas)'
        }
      },
      {
        persona: 'Health Department Head',
        scenario: 'Compartir protocolos clínicos validados con 15 médicos',
        beforeAfter: {
          before: '15 médicos x 2 horas configurando = 30 horas + inconsistencias en protocolos',
          after: 'Agente certificado compartido = 15 minutos total + 100% consistencia',
          timeSaved: '30 horas + cero errores de protocolo'
        }
      }
    ]
  },

  'workflows-processing': {
    featureId: 'workflows-processing',
    title: 'Workflows de Procesamiento',
    type: 'ui',
    estimatedDuration: 180,
    entryPointUrl: '/chat?openContextPanel=true',
    overview: '7 workflows especializados para procesar diferentes tipos de documentos automáticamente con IA.',
    
    location: {
      description: 'Accede a workflows desde:',
      steps: [
        '1. Abre cualquier agente',
        '2. En el panel de "Fuentes de Contexto", haz clic en "+ Agregar"',
        '3. Selecciona el tipo de documento: PDF, Excel, Word, CSV, URL, API',
        '4. Configura parámetros del workflow (modelo, idioma, límites)',
        '5. Sube archivo o proporciona URL',
        '6. El workflow procesa automáticamente',
        '7. Resultado se guarda como fuente de contexto'
      ]
    },
    
    usage: {
      description: 'Ejemplo de workflow de PDF con configuración y resultado:',
      interactiveDemo: `
        <div style="max-width: 800px; font-family: -apple-system, sans-serif;">
          <!-- Upload Interface -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Upload de Documentos</div>
            
            <!-- Drag & Drop Area -->
            <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 40px; text-align: center; background: #f9fafb; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#eff6ff'" onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#f9fafb'">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="margin: 0 auto 12px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #111827;">Arrastra PDFs aquí</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">o haz clic para seleccionar archivos</p>
            </div>
            
            <!-- Model Selector -->
            <div style="margin-top: 16px; padding: 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
              <div style="font-size: 11px; font-weight: 600; color: #78350f; margin-bottom: 10px;">⚙️ Configuración de Extracción</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="border: 2px solid #111827; background: white; border-radius: 6px; padding: 12px; cursor: pointer;">
                  <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">✨ Flash</div>
                  <div style="font-size: 11px; color: #6b7280;">$0.02/doc • Rápido</div>
                </div>
                <div style="border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 6px; padding: 12px; cursor: pointer; opacity: 0.6;">
                  <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">Pro</div>
                  <div style="font-size: 11px; color: #9ca3af;">$0.30/doc • Preciso</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Processing Queue -->
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Cola de Procesamiento</div>
            
            <!-- File 1: Processing -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <svg width="18" height="18" fill="#3b82f6" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="2"/>
                </svg>
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 500; color: #1e3a8a;">Manual_Seguridad.pdf</div>
                  <div style="font-size: 11px; color: #3b82f6;">2.3 MB • Página 12/20</div>
                </div>
                <div style="font-size: 11px; font-weight: 600; color: #3b82f6;">60%</div>
              </div>
              <div style="background: #dbeafe; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #3b82f6; width: 60%; height: 100%; transition: width 0.3s;"></div>
              </div>
            </div>
            
            <!-- File 2: Complete -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <svg width="18" height="18" fill="#10b981" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="2"/>
                </svg>
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 500; color: #065f46;">Guia_Operaciones.pdf</div>
                  <div style="font-size: 11px; color: #059669;">1.8 MB • 3,240 caracteres extraídos</div>
                </div>
                <span style="color: #10b981; font-size: 16px; font-weight: 600;">✓</span>
              </div>
            </div>
            
            <!-- File 3: Pending -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <svg width="18" height="18" fill="#9ca3af" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="2"/>
                </svg>
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 500; color: #6b7280;">FAQ_Tecnico.pdf</div>
                  <div style="font-size: 11px; color: #9ca3af;">0.5 MB • En cola...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    
    userFeedback: {
      requestCount: 15,
      requestedBy: ['Construction team', 'Banking compliance', 'Legal department'],
      commonPainPoint: 'Transcripción manual de PDFs es costosa (3-4 horas por manual de 100 páginas), propensa a errores, y no escala. Equipos con 50+ manuales técnicos necesitaban solución automatizada.',
      howItHelps: 'Gemini Vision extrae texto, tablas e imágenes automáticamente. 98% más rápido que manual, 95% de precisión, escalable a cientos de documentos.'
    },
    
    useCases: [
      {
        persona: 'Safety Manager en Construcción',
        scenario: 'Digitalizar 50 manuales de seguridad para agentes de obra',
        beforeAfter: {
          before: '50 manuales x 3 horas de transcripción = 150 horas de trabajo manual',
          after: 'Upload batch de 50 PDFs → Extracción automática en 45 minutos',
          timeSaved: '98% más rápido + $4,000 ahorrados en transcripción'
        }
      },
      {
        persona: 'Compliance Officer en Banking',
        scenario: 'Actualizar regulaciones AML cada mes (12 documentos nuevos)',
        beforeAfter: {
          before: '12 docs x 2 horas = 24 horas/mes de actualización manual',
          after: 'Workflow automatizado: 20 minutos totales',
          timeSaved: '288 horas/año ahorradas'
        }
      }
    ]
  }
};

// Get tutorial by feature title or category
export function getTutorialForFeature(title: string, category: string): FeatureTutorial | null {
  const key = title.toLowerCase();
  
  if (key.includes('changelog') || key.includes('notif')) {
    return INTERACTIVE_TUTORIALS['changelog-notifications'];
  }
  if (key.includes('mcp')) {
    return INTERACTIVE_TUTORIALS['mcp-servers'];
  }
  if (key.includes('cli')) {
    return INTERACTIVE_TUTORIALS['cli-tools'];
  }
  if (key.includes('compart') || key.includes('shar')) {
    return INTERACTIVE_TUTORIALS['agent-sharing'];
  }
  if (key.includes('workflow')) {
    return INTERACTIVE_TUTORIALS['workflows-processing'];
  }
  
  return null;
}

