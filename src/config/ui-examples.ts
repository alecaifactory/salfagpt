// UI Examples - Interactive HTML/CSS showcases for changelog
// Created: 2025-11-08
// Pure HTML/CSS (no frameworks) to show new UI additions

export const UI_EXAMPLES: Record<string, string> = {
  'changelog-notifications': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
      <!-- Notification Bell -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Notification Bell</h4>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
          <div style="position: relative; display: inline-block;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 10px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">3</span>
          </div>
        </div>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">Badge roja muestra notificaciones no leídas</p>
      </div>

      <!-- Notification Dropdown -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #0f172a;">Notificaciones</h4>
          <button style="font-size: 11px; color: #3b82f6; background: none; border: none; cursor: pointer; font-weight: 500;">Marcar todas</button>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; background: #eff6ff; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">
            <div style="display: flex; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background: #3b82f6; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🎉</div>
              <div style="flex: 1; min-width: 0;">
                <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Nueva versión 0.3.0</h5>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Sistema de Changelog disponible</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: #94a3b8;">Nov 8, 14:30</span>
                  <span style="font-size: 11px; color: #3b82f6; font-weight: 500;">Ver Novedades →</span>
                </div>
              </div>
            </div>
          </div>
          <div style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            <div style="display: flex; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background: #8b5cf6; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🤖</div>
              <div style="flex: 1;">
                <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #0f172a;">MCP Servers disponible</h5>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Consulta métricas desde Cursor</p>
                <span style="font-size: 11px; color: #94a3b8;">Oct 30, 10:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  'mcp-servers': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Cursor Integration</h4>
      
      <!-- Cursor IDE Mockup -->
      <div style="background: #1e1e1e; border-radius: 8px; overflow: hidden; border: 1px solid #374151;">
        <!-- Tab Bar -->
        <div style="background: #252526; padding: 8px 12px; border-bottom: 1px solid #374151; display: flex; gap: 8px;">
          <div style="background: #1e1e1e; padding: 6px 12px; border-radius: 4px; font-size: 12px; color: #d4d4d4;">chat.tsx</div>
          <div style="background: #2d2d2d; padding: 6px 12px; border-radius: 4px; font-size: 12px; color: #858585;">mcp.json</div>
        </div>
        
        <!-- Chat Area -->
        <div style="padding: 16px; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px;">
          <div style="color: #9cdcfe; margin-bottom: 12px;">
            <span style="color: #6a9955;"># Pregunta en Cursor AI</span>
          </div>
          <div style="background: #2d2d2d; padding: 12px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid #3b82f6;">
            <span style="color: #ce9178;">"Muéstrame las estadísticas de uso de getaifactory.com"</span>
          </div>
          
          <div style="color: #9cdcfe; margin: 16px 0 8px 0;">
            <span style="color: #6a9955;"># Respuesta del MCP Server</span>
          </div>
          <div style="background: #1a1a1a; padding: 14px; border-radius: 4px; border-left: 3px solid #10b981;">
            <div style="color: #4ade80; margin-bottom: 8px; font-weight: 600;">📊 Estadísticas de getaifactory.com</div>
            <div style="color: #d4d4d4; line-height: 1.6;">
              <div>• Agentes totales: <span style="color: #4ade80; font-weight: 600;">45</span></div>
              <div>• Mensajes hoy: <span style="color: #4ade80; font-weight: 600;">234</span></div>
              <div>• Usuarios activos: <span style="color: #4ade80; font-weight: 600;">12</span></div>
              <div>• Costo promedio: <span style="color: #fbbf24; font-weight: 600;">$0.03/mensaje</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Desarrolladores obtienen insights sin salir del IDE. 
        Toma de decisiones en segundos vs minutos cambiando de herramienta.
      </p>
    </div>
  `,

  'cli-tools': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Terminal CLI</h4>
      
      <!-- Terminal Mockup -->
      <div style="background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b;">
        <!-- Terminal Header -->
        <div style="background: #1e293b; padding: 8px 12px; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></div>
          <span style="margin-left: 12px; font-size: 11px; color: #64748b; font-family: monospace;">zsh - salfagpt</span>
        </div>
        
        <!-- Terminal Content -->
        <div style="padding: 16px; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; line-height: 1.6;">
          <div style="margin-bottom: 12px;">
            <span style="color: #22c55e;">$</span>
            <span style="color: #e2e8f0;"> npx salfagpt upload contextos/pdf/agentes/M001</span>
          </div>
          
          <div style="color: #94a3b8; margin-bottom: 12px;">
            <div>📤 Cargando 3 archivos...</div>
          </div>
          
          <div style="color: #cbd5e1; margin-bottom: 8px;">
            <div><span style="color: #22c55e;">✓</span> Manual_Seguridad.pdf (2.3 MB) → <span style="color: #94a3b8;">Extraído en 8.2s</span></div>
            <div><span style="color: #22c55e;">✓</span> Guia_Operaciones.pdf (1.8 MB) → <span style="color: #94a3b8;">Extraído en 6.1s</span></div>
            <div><span style="color: #22c55e;">✓</span> FAQ_Tecnico.pdf (0.5 MB) → <span style="color: #94a3b8;">Extraído en 2.3s</span></div>
          </div>
          
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #1e293b;">
            <div style="color: #22c55e; font-weight: 600;">✓ Completo en 16.6s</div>
            <div style="color: #94a3b8; font-size: 12px;">💾 3 fuentes guardadas en agente M001</div>
            <div style="color: #94a3b8; font-size: 12px;">🔗 ID: cli-session-1234567890</div>
          </div>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Procesa 100+ documentos en minutos vs horas manualmente. 
        Ideal para CI/CD y automatización.
      </p>
    </div>
  `,

  'agent-sharing': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Agent Gallery</h4>
      
      <!-- Agent Card -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <!-- Agent Header -->
        <div style="padding: 16px; border-bottom: 1px solid #f1f5f9;">
          <div style="display: flex; align-items: start; justify-between; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">Asistente AML/KYC</h4>
                <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">PÚBLICO</span>
              </div>
              <p style="margin: 0; font-size: 13px; color: #64748b;">Análisis de compliance bancario</p>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 4px 8px;">
              <div style="font-size: 11px; color: #1e40af; font-weight: 600;">8 clones</div>
            </div>
          </div>
        </div>
        
        <!-- Agent Details -->
        <div style="padding: 16px; background: #f8fafc;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px;">
            <div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Modelo</div>
              <div style="color: #0f172a; font-weight: 500;">Gemini 2.5 Pro</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Fuentes</div>
              <div style="color: #0f172a; font-weight: 500;">5 documentos</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Precisión</div>
              <div style="color: #10b981; font-weight: 600;">95%</div>
            </div>
            <div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Validado</div>
              <div style="color: #10b981; font-weight: 500;">✓ Legal team</div>
            </div>
          </div>
        </div>
        
        <!-- Action Button -->
        <div style="padding: 12px 16px; border-top: 1px solid #e2e8f0;">
          <button style="width: 100%; background: #0f172a; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">
            Clonar Agente
          </button>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Setup en 5 minutos vs 3 horas. 
        Consistencia del 100% en análisis de compliance.
      </p>
    </div>
  `,

  'workflows': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Document Upload & Processing</h4>
      
      <!-- Upload Area -->
      <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 32px; text-align: center; background: #f8fafc; margin-bottom: 16px;">
        <svg style="margin: 0 auto 12px; display: block;" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">Arrastra PDFs aquí</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">o haz clic para seleccionar</p>
      </div>
      
      <!-- Processing Queue -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
        <h5 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Cola de Procesamiento</h5>
        
        <!-- File 1 - Processing -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span style="font-size: 13px; font-weight: 500; color: #1e40af; flex: 1;">Manual_Seguridad.pdf</span>
            <span style="font-size: 11px; color: #3b82f6;">2.3 MB</span>
          </div>
          <div style="background: #dbeafe; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: #3b82f6; width: 60%; height: 100%; transition: width 0.3s;"></div>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #3b82f6;">Extrayendo... 60%</p>
        </div>
        
        <!-- File 2 - Complete -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span style="font-size: 13px; font-weight: 500; color: #0f172a; flex: 1;">Guia_Operaciones.pdf</span>
            <span style="font-size: 11px; color: #10b981; font-weight: 600;">✓ Completo</span>
          </div>
        </div>
        
        <!-- File 3 - Pending -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span style="font-size: 13px; font-weight: 500; color: #64748b; flex: 1;">FAQ_Tecnico.pdf</span>
            <span style="font-size: 11px; color: #94a3b8;">En cola</span>
          </div>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Procesamiento batch de múltiples archivos con tracking visual. 
        98% más rápido que manual.
      </p>
    </div>
  `,

  'multi-user-security': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Data Isolation</h4>
      
      <!-- Security Layers Diagram -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h5 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">3 Capas de Seguridad</h5>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Aislamiento completo de datos por usuario</p>
        </div>
        
        <!-- Layer 1 -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">1</div>
            <span style="font-size: 13px; font-weight: 600; color: #1e40af;">Firestore Queries</span>
          </div>
          <pre style="margin: 0; font-size: 11px; color: #1e40af; font-family: monospace; background: #dbeafe; padding: 8px; border-radius: 4px; overflow-x: auto;">.where('userId', '==', userId)</pre>
        </div>
        
        <!-- Layer 2 -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">2</div>
            <span style="font-size: 13px; font-weight: 600; color: #065f46;">API Endpoints</span>
          </div>
          <pre style="margin: 0; font-size: 11px; color: #065f46; font-family: monospace; background: #dcfce7; padding: 8px; border-radius: 4px; overflow-x: auto;">if (session.id !== userId) return 403;</pre>
        </div>
        
        <!-- Layer 3 -->
        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">3</div>
            <span style="font-size: 13px; font-weight: 600; color: #92400e;">Firestore Rules</span>
          </div>
          <pre style="margin: 0; font-size: 11px; color: #92400e; font-family: monospace; background: #fef9c3; padding: 8px; border-radius: 4px; overflow-x: auto;">resource.data.userId == request.auth.uid</pre>
        </div>
        
        <!-- Compliance Badges -->
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; justify-content: center;">
          <span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">✓ GDPR</span>
          <span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">✓ HIPAA</span>
          <span style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">✓ SOC 2</span>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Cero violaciones de privacidad. 
        Confianza para clientes enterprise en sectores regulados.
      </p>
    </div>
  `,

  'agent-architecture': `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px;">
      <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Agent Configuration</h4>
      
      <!-- Agent Config Panel -->
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <!-- Tabs -->
        <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
          <div style="flex: 1; padding: 10px 16px; text-align: center; background: white; border-bottom: 2px solid #0f172a; font-size: 12px; font-weight: 600; color: #0f172a;">General</div>
          <div style="flex: 1; padding: 10px 16px; text-align: center; font-size: 12px; font-weight: 500; color: #94a3b8; cursor: pointer;">Contexto</div>
          <div style="flex: 1; padding: 10px 16px; text-align: center; font-size: 12px; font-weight: 500; color: #94a3b8; cursor: pointer;">Avanzado</div>
        </div>
        
        <!-- Config Form -->
        <div style="padding: 20px;">
          <!-- Agent Name -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Nombre del Agente</label>
            <input type="text" value="Asistente Legal Territorial" readonly style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; color: #0f172a; background: #f8fafc;" />
          </div>
          
          <!-- Model Selection -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Modelo IA</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; cursor: pointer; background: #f8fafc;">
                <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Flash</div>
                <div style="font-size: 11px; color: #94a3b8;">Rápido • $0.02/req</div>
              </div>
              <div style="border: 2px solid #0f172a; border-radius: 6px; padding: 12px; cursor: pointer; background: white;">
                <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Pro ✓</div>
                <div style="font-size: 11px; color: #64748b;">Preciso • $0.30/req</div>
              </div>
            </div>
          </div>
          
          <!-- System Prompt Preview -->
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">System Prompt</label>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; color: #475569; line-height: 1.6; font-family: monospace;">
              Eres un experto en normativa urbana chilena...<br/>
              <span style="color: #94a3b8;">[156 líneas más]</span>
            </div>
          </div>
        </div>
        
        <!-- Stats Footer -->
        <div style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-around; font-size: 11px;">
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #0f172a;">10</div>
            <div style="color: #64748b;">Fuentes</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #0f172a;">45</div>
            <div style="color: #64748b;">Conversaciones</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 600; color: #10b981;">95%</div>
            <div style="color: #64748b;">Precisión</div>
          </div>
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #0f172a;">Valor:</strong> Agentes especializados con 40% mayor precisión vs modelo genérico. 
        ROI positivo en 2 semanas.
      </p>
    </div>
  `
};

// Get example by feature category
export function getUIExample(category: string, title: string): string | null {
  const key = title.toLowerCase();
  
  if (key.includes('changelog') || key.includes('notif')) {
    return UI_EXAMPLES['changelog-notifications'];
  }
  if (key.includes('mcp')) {
    return UI_EXAMPLES['mcp-servers'];
  }
  if (key.includes('cli')) {
    return UI_EXAMPLES['cli-tools'];
  }
  if (key.includes('compart') || key.includes('shar')) {
    return UI_EXAMPLES['agent-sharing'];
  }
  if (key.includes('workflow')) {
    return UI_EXAMPLES['workflows'];
  }
  if (key.includes('multi-usuario') || key.includes('segur')) {
    return UI_EXAMPLES['multi-user-security'];
  }
  if (key.includes('agente') || key.includes('arquitectura')) {
    return UI_EXAMPLES['agent-architecture'];
  }
  
  return null;
}







