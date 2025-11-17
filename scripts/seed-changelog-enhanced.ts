// Enhanced Changelog Seed - With UI/CLI Examples
// Created: 2025-11-08
// Run with: npx tsx scripts/seed-changelog-enhanced.ts

import { firestore } from '../src/lib/firestore.js';

// Clear existing entries first
async function clearChangelog() {
  const snapshot = await firestore.collection('changelog_entries').get();
  const batch = firestore.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  if (snapshot.size > 0) {
    await batch.commit();
    console.log(`🗑️  Cleared ${snapshot.size} existing entries\n`);
  }
}

const ENHANCED_CHANGELOG = [
  {
    version: '0.3.0',
    releaseDate: new Date('2025-11-08'),
    title: 'Changelog y Sistema de Notificaciones',
    subtitle: 'Transparencia total en el desarrollo de la plataforma',
    description: `
Sistema de changelog inspirado en Cursor, diseñado para transparencia y descubrimiento de features.

**Características principales:**

- Filtrado por industria (13 verticales) y categoría (11 tipos)
- Notificaciones en tiempo real con badge de no leídas  
- Casos de uso específicos por industria con métricas
- Tutoriales interactivos para features complejas
- Transparencia en priorización (muestra solicitudes de usuarios)

**Ejemplo de notificación:**

Cuando se publica una nueva versión, todos los usuarios reciben una notificación instantánea. El icono de campana en el sidebar muestra el conteo de no leídas.

**Métricas esperadas:**
- 95% descubrimiento de features en 48 horas (vs 2 semanas antes)
- 60% completación de tutoriales (vs 20% con docs tradicionales)
- 80% feedback positivo en transparencia
    `.trim(),
    category: 'productivity',
    status: 'stable',
    industries: ['construction', 'banking', 'health', 'smbs'],
    priority: 'high',
    impactScore: 8,
    userRequestCount: 5,
    requestedBy: ['Product team', 'User interviews'],
    alignmentReason: 'Principio de transparencia: usuarios deben saber qué cambia y por qué. Aumenta confianza y adopción de features.',
    valueProposition: 'Reduce tiempo de descubrimiento en 95%. Features se adoptan 50% más rápido con contexto claro.',
    userFeedbackSource: 'Entrevistas Oct 2025',
    useCases: [
      {
        industry: 'construction',
        title: 'Descubrimiento de features de seguridad',
        description: 'Equipos de obra reciben notificaciones de nuevos features de compliance y pueden completar tutorial en 2 minutos.',
        beforeAfter: {
          before: 'Descubrir features por email genérico o por accidente',
          after: 'Notificación contextual con tutorial interactivo de 30 segundos'
        },
        metrics: {
          timeSaved: '2 horas/semana',
          qualityImprovement: '100% adopción de nuevas features'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 18,
      linesAdded: 2460,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['ux', 'transparency', 'engagement'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-30'),
    title: 'MCP Servers',
    subtitle: 'Consulta métricas desde Cursor sin salir del IDE',
    description: `
Model Context Protocol (MCP) permite integración nativa con Cursor AI.

**Configuración en \`~/.cursor/mcp.json\`:**

\`\`\`json
{
  "mcpServers": {
    "ai-factory": {
      "url": "http://localhost:3000/api/mcp/usage-stats",
      "apiKey": "mcp_localhost_abc123..."
    }
  }
}
\`\`\`

**Uso en Cursor:**

Simplemente pregunta en lenguaje natural:

\`\`\`
> "Muéstrame estadísticas de getaifactory.com"

📊 Estadísticas de getaifactory.com
────────────────────────────────────
Agentes totales:      45
Mensajes hoy:        234
Usuarios activos:     12
Costo promedio:   $0.03/mensaje
Modelo más usado:     Flash (88%)
\`\`\`

**Recursos disponibles:**
- \`usage-stats://{domain}/summary\` - Resumen general
- \`usage-stats://{domain}/agents\` - Detalle por agente
- \`usage-stats://{domain}/costs\` - Desglose de costos
    `.trim(),
    category: 'developer-tools',
    status: 'stable',
    industries: ['smbs', 'fintech', 'corporate-venture-capital'],
    priority: 'high',
    impactScore: 9,
    userRequestCount: 3,
    requestedBy: ['Developer team'],
    alignmentReason: 'Habilita análisis sin cambiar de contexto. Productividad 10x para equipos técnicos.',
    valueProposition: 'Insights instantáneos desde el IDE. Toma de decisiones data-driven en segundos vs minutos.',
    useCases: [
      {
        industry: 'fintech',
        title: 'Monitoreo de costos durante desarrollo',
        description: 'CTOs consultan costos de API mientras revisan código en Cursor.',
        metrics: {
          timeSaved: '5 horas/semana',
          costReduction: '$1,500/mes en optimización'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 13,
      linesAdded: 1500,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['integration', 'cursor', 'mcp'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-22'),
    title: 'Compartir Agentes',
    subtitle: 'Reutiliza configuraciones validadas en tu equipo',
    description: `
Marca agentes como públicos para compartir con tu organización.

**Cómo funciona:**

1. Configura y prueba tu agente
2. Haz clic en el botón "Compartir"
3. Marca como "Público"
4. Tu equipo lo ve en la galería de agentes
5. Pueden clonarlo y personalizarlo

**Ejemplo de configuración compartida:**

\`\`\`typescript
Agente: "Análisis AML/KYC"
Modelo: Gemini 2.5 Pro
System Prompt: "Eres un experto en compliance bancario..."
Contexto: [Manual_AML.pdf, Regulaciones_2025.pdf]
Estado: ✓ Público (visible para tu dominio)
Clones: 8 usuarios lo están usando
\`\`\`

**Beneficios:**
- Configuraciones expertas se comparten, no se reinventan
- Onboarding de nuevos usuarios en minutos vs días
- Calidad consistente en toda la organización
    `.trim(),
    category: 'collaboration',
    status: 'stable',
    industries: ['banking', 'health', 'corporate-venture-capital', 'higher-education'],
    priority: 'high',
    impactScore: 8,
    userRequestCount: 8,
    requestedBy: ['Banking team', 'Health compliance team'],
    alignmentReason: 'Maximiza ROI de configuraciones expertas. Conocimiento se comparte.',
    valueProposition: 'Nuevos usuarios productivos en 30 minutos vs 3 días. Consistencia del 100%.',
    useCases: [
      {
        industry: 'banking',
        title: 'Estandarización de agentes de compliance',
        description: 'Departamento legal comparte agente validado para análisis AML/KYC con todo el equipo.',
        beforeAfter: {
          before: 'Cada analista configura manualmente (3 horas por persona)',
          after: 'Clonar agente certificado del experto (5 minutos)'
        },
        metrics: {
          timeSaved: '97% reducción en setup',
          qualityImprovement: '100% consistencia en análisis'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 8,
      linesAdded: 450,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['collaboration', 'sharing'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-19'),
    title: 'Herramientas CLI',
    subtitle: 'Automatización desde la terminal para desarrolladores',
    description: `
CLI para automatizar operaciones batch, ideal para CI/CD pipelines.

**Instalación:**

\`\`\`bash
npm install -g salfagpt
# o usar directamente
npx salfagpt <comando>
\`\`\`

**Comandos principales:**

\`\`\`bash
# Upload masivo de documentos
$ npx salfagpt upload contextos/pdf/agentes/M001

📤 Cargando 3 archivos...
✓ Manual_Seguridad.pdf (2.3 MB) → Extraído en 8.2s
✓ Guia_Operaciones.pdf (1.8 MB) → Extraído en 6.1s
✓ FAQ_Tecnico.pdf (0.5 MB) → Extraído en 2.3s

✓ Completo en 16.6s
💾 3 fuentes guardadas en agente M001
🔗 Sesión: cli-session-1234567890
\`\`\`

\`\`\`bash
# Listar agentes
$ npx salfagpt list-agents

Agentes disponibles:
• M001 - Asistente Legal (10 fuentes, 45 conversaciones)
• S001 - Gestión Bodegas (5 fuentes, 23 conversaciones)
• S002 - Mantenimiento (8 fuentes, 12 conversaciones)
\`\`\`

**Casos de uso:**
- Scripts de CI/CD para actualizar contextos automáticamente
- Procesamiento batch de 100+ documentos
- Integración con pipelines de desarrollo
    `.trim(),
    category: 'developer-tools',
    status: 'stable',
    industries: ['smbs', 'fintech', 'ecommerce'],
    priority: 'medium',
    impactScore: 7,
    userRequestCount: 4,
    requestedBy: ['DevOps teams'],
    alignmentReason: 'Habilita automatización y CI/CD. Desarrolladores integran AI Factory en pipelines existentes.',
    valueProposition: 'Automatiza tareas repetitivas. 100+ documentos en minutos vs horas manual.',
    useCases: [
      {
        industry: 'fintech',
        title: 'Pipeline de documentación regulatoria',
        description: 'Script automatizado que actualiza contextos cuando regulaciones cambian.',
        beforeAfter: {
          before: 'Subir 50 PDFs manualmente cada mes (4 horas)',
          after: 'Script automatizado en cron job nocturno (0 horas)'
        },
        metrics: {
          timeSaved: '48 horas/año',
          costReduction: '$4,800/año en tiempo de equipo'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 20,
      linesAdded: 800,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['cli', 'automation', 'devops'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-13'),
    title: 'Multi-Usuario con Privacidad Total',
    subtitle: 'Aislamiento completo de datos por usuario y agente',
    description: `
Sistema de seguridad de 3 capas que garantiza privacidad absoluta.

**Capas de seguridad:**

1. **Firestore Queries** - Todos filtran por \`userId\`
2. **API Endpoints** - Verifican autenticación y ownership
3. **Security Rules** - Protección a nivel de base de datos

**Ejemplo de protección:**

\`\`\`typescript
// Todas las queries incluyen filtro
const conversations = await firestore
  .collection('conversations')
  .where('userId', '==', userId)  // ← Aislamiento
  .get();

// APIs verifican ownership
if (session.id !== userId) {
  return 403; // Forbidden
}
\`\`\`

**Compliance:**
- ✓ GDPR (derecho a borrado, exportación)
- ✓ HIPAA ready (encriptación, audit trail)
- ✓ SOC 2 controls

**Garantías:**
- Usuario A nunca ve datos de Usuario B
- Agente 1 no ve contexto de Agente 2
- Audit logs completos de acceso
    `.trim(),
    category: 'security',
    status: 'stable',
    industries: ['banking', 'health', 'real-estate', 'multi-family-office'],
    priority: 'critical',
    impactScore: 10,
    userRequestCount: 12,
    requestedBy: ['All enterprise customers'],
    alignmentReason: 'Requisito fundamental para empresas. Sin esto, no hay adopción enterprise.',
    valueProposition: 'Habilita uso en organizaciones reguladas. $0 en violaciones de privacidad.',
    useCases: [
      {
        industry: 'health',
        title: 'Gestión de datos de pacientes',
        description: 'Hospital con 50+ doctores, cada uno con acceso solo a sus pacientes.',
        beforeAfter: {
          before: 'No viable usar plataforma por riesgo HIPAA',
          after: 'Implementación certificada con aislamiento total'
        },
        metrics: {
          qualityImprovement: '100% compliance HIPAA',
          costReduction: '$0 en multas regulatorias'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 25,
      linesAdded: 2000,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['security', 'privacy', 'gdpr', 'hipaa'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-11'),
    title: 'Workflows de Procesamiento',
    subtitle: 'Extracción automática de PDFs, Excel, URLs',
    description: `
7 workflows especializados para procesar diferentes tipos de documentos con IA.

**Workflows disponibles:**

1. **PDF** - Extracción con Gemini Vision (texto, tablas, imágenes)
2. **Excel** - Múltiples hojas, fórmulas preservadas
3. **Word** - Formato y estructura mantenidos
4. **CSV** - Parsing automático de datos tabulares
5. **URL** - Scraping de contenido web actualizado
6. **API** - Conexión a endpoints REST
7. **Carpeta** - Procesamiento batch de archivos

**Ejemplo de extracción de PDF:**

El workflow de PDF usa Gemini 2.5 Flash por defecto (94% más económico que Pro) y extrae:
- Texto completo
- Tablas convertidas a markdown
- Imágenes descritas con contexto
- Metadata (páginas, autor, fecha)

**Configuración por workflow:**
- Modelo IA (Flash/Pro)
- Tamaño máximo de archivo
- Idioma de procesamiento
- Longitud máxima de output

**Progress tracking en tiempo real:**
\`\`\`
📄 Procesando documento.pdf...
[████████████░░░░░░░░] 60% - Extrayendo página 12/20
\`\`\`
    `.trim(),
    category: 'context-management',
    status: 'stable',
    industries: ['construction', 'banking', 'agriculture', 'retail', 'real-estate'],
    priority: 'high',
    impactScore: 9,
    userRequestCount: 15,
    requestedBy: ['Construction', 'Banking', 'Legal teams'],
    alignmentReason: 'Core value prop: Convertir documentos en conocimiento accionable.',
    valueProposition: '100 PDFs procesados en minutos vs días. Precisión 95% con validación.',
    useCases: [
      {
        industry: 'construction',
        title: 'Digitalización de manuales de seguridad',
        description: '50+ manuales técnicos procesados automáticamente para agentes de obra.',
        beforeAfter: {
          before: 'Transcribir manualmente cada manual (40 horas total)',
          after: 'Extracción automática con IA (30 minutos total)'
        },
        metrics: {
          timeSaved: '98% más rápido',
          costReduction: '$4,000 en costos de transcripción'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 12,
      linesAdded: 1100,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['automation', 'pdf', 'extraction'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-10'),
    title: 'Arquitectura de Agentes',
    subtitle: 'Múltiples asistentes especializados, cada uno con su contexto',
    description: `
Sistema de agentes donde cada asistente tiene configuración, contexto y memoria independiente.

**Concepto:**

\`\`\`
Agente = Configuración + Contexto + Memoria
\`\`\`

**Componentes de un agente:**

- **Modelo:** Flash (rápido) o Pro (preciso)
- **System Prompt:** Personalidad y comportamiento
- **Contexto:** PDFs, docs, APIs específicos para este agente
- **Memoria:** Historial de conversaciones
- **Métricas:** Tokens, costos, calidad

**Ejemplo de agente especializado:**

\`\`\`
Nombre: Asistente Legal Territorial (M001)
Propósito: Consultas sobre normativa urbana
Modelo: Gemini 2.5 Pro
Contexto: 10 PDFs de regulaciones (3.2M tokens)
Conversaciones: 45
Precisión: 95% (validado por expertos)
\`\`\`

**Ventajas vs modelo genérico:**
- 40% mayor precisión en respuestas
- 60% reducción en tokens usados (contexto focused)
- Costo 70% menor que usar Pro para todo
    `.trim(),
    category: 'ai-agents',
    status: 'stable',
    industries: ['banking', 'health', 'real-estate', 'corporate-venture-capital'],
    priority: 'critical',
    impactScore: 10,
    userRequestCount: 20,
    requestedBy: ['All users'],
    alignmentReason: 'Diferenciador clave vs ChatGPT genérico. Especialización = mejor calidad + menor costo.',
    valueProposition: 'Precisión 40% mayor vs modelo genérico. ROI positivo en 2 semanas.',
    useCases: [
      {
        industry: 'banking',
        title: 'Agentes especializados por producto financiero',
        description: 'Banco crea 3 agentes: Préstamos hipotecarios, Inversiones, Cuentas corrientes. Cada uno con contexto específico.',
        metrics: {
          qualityImprovement: '40% mayor precisión',
          timeSaved: '60% respuestas más rápidas'
        }
      }
    ],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 30,
      linesAdded: 3000,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['core', 'ai', 'agents'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  },

  {
    version: '0.1.0',
    releaseDate: new Date('2025-10-10'),
    title: 'Autenticación OAuth 2.0',
    subtitle: 'Login seguro con Google',
    description: `
Sistema de autenticación enterprise-ready con Google OAuth.

**Flujo de autenticación:**

1. Usuario hace clic en "Continuar con Google"
2. Redirect a Google OAuth
3. Usuario autentica con su cuenta Google
4. Google devuelve código de autorización
5. Servidor intercambia código por tokens
6. Genera JWT y lo almacena en cookie segura
7. Usuario accede a la plataforma

**Seguridad implementada:**

\`\`\`typescript
// JWT con expiración
{
  id: "user-123",
  email: "user@company.com",
  role: "admin",
  exp: 1730000000  // 7 días
}

// Cookie segura
{
  httpOnly: true,      // JavaScript no puede acceder
  secure: true,        // Solo HTTPS en producción
  sameSite: 'lax',     // Protección CSRF
  maxAge: 604800       // 7 días
}
\`\`\`

**Features:**
- Single Sign-On (SSO) con Google
- Refresh automático de sesión
- Logout completo (server + client)
- CSRF protection
    `.trim(),
    category: 'security',
    status: 'stable',
    industries: ['banking', 'health', 'fintech', 'multi-family-office'],
    priority: 'critical',
    impactScore: 10,
    userRequestCount: 0,
    requestedBy: ['Security requirement'],
    alignmentReason: 'Base de seguridad. Sin autenticación robusta, no hay plataforma viable.',
    valueProposition: 'Cero incidentes de seguridad. Confianza para clientes enterprise.',
    useCases: [],
    technicalDetails: {
      githubPRs: [],
      commits: [],
      filesChanged: 10,
      linesAdded: 500,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['auth', 'oauth', 'security'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date()
  }
];

async function seedEnhancedChangelog() {
  console.log('🌱 Seeding enhanced changelog...\n');

  try {
    // Clear existing first
    await clearChangelog();

    // Seed new entries
    for (const entry of ENHANCED_CHANGELOG) {
      const docRef = await firestore.collection('changelog_entries').add({
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ ${entry.version} - ${entry.title}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   Industries: ${entry.industries.join(', ')}`);
      console.log(`   Impact: ${entry.impactScore}/10\n`);
    }

    console.log('🎉 Enhanced changelog seeded!\n');
    console.log(`📊 Summary:`);
    console.log(`   Entries: ${ENHANCED_CHANGELOG.length}`);
    console.log(`   Versions: ${[...new Set(ENHANCED_CHANGELOG.map(e => e.version))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to seed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedEnhancedChangelog();



