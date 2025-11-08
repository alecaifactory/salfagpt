// Seed Changelog with Platform Features
// Created: 2025-11-08
// Run with: npx tsx scripts/seed-changelog.ts

import { firestore } from '../src/lib/firestore.js';
import type { ChangelogEntry } from '../src/types/changelog';

const SAMPLE_CHANGELOG: Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    version: '0.3.0',
    releaseDate: new Date('2025-11-08'),
    title: 'Sistema de Changelog y Notificaciones',
    subtitle: 'Manténte informado de todas las novedades de la plataforma',
    description: `Inspirado en Cursor Changelog, ahora puedes ver todas las actualizaciones de la plataforma en un solo lugar.

## ¿Qué incluye?

- **Changelog público** con filtros por industria y categoría
- **Notificaciones en tiempo real** con bell icon y badges
- **Tutoriales interactivos** para nuevas funcionalidades
- **Casos de uso** específicos por industria
- **Propuestas de valor** con métricas cuantificadas

## Transparencia total

Cada funcionalidad muestra:
- Cuántos usuarios la solicitaron
- Quién la pidió específicamente
- Por qué se priorizó
- Cómo se alinea con el propósito de la plataforma`,
    category: 'productivity',
    status: 'stable',
    industries: ['construction', 'banking', 'health', 'real-estate', 'smbs'],
    priority: 'high',
    impactScore: 8,
    userRequestCount: 5,
    requestedBy: ['Multiple users'],
    alignmentReason: 'Alineado con principio de transparencia: usuarios deben saber qué cambia y por qué. Mejora confianza y adopción.',
    valueProposition: 'Reduce tiempo de descubrimiento de features en 95%. Usuarios informados aprovechan mejor la plataforma.',
    userFeedbackSource: 'User interviews - Oct 2025',
    useCases: [
      {
        industry: 'construction',
        title: 'Descubrimiento de nuevas herramientas de seguridad',
        description: 'Equipos de obra reciben notificaciones de nuevas features de compliance',
        beforeAfter: {
          before: 'Descubrir features por accidente o por email genérico',
          after: 'Notificación contextual con tutorial de 30 segundos'
        },
        metrics: {
          timeSaved: '2 horas/semana',
          qualityImprovement: '100% adopción de nuevas features'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#changelog-system'],
      commits: [],
      filesChanged: 15,
      linesAdded: 1200,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['ux', 'communication', 'engagement'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-11-08')
  },
  
  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-30'),
    title: 'MCP Servers - Integración con Cursor AI',
    subtitle: 'Consulta métricas de la plataforma directamente desde tu IDE',
    description: `Model Context Protocol (MCP) te permite conectar AI Factory con herramientas como Cursor para análisis instantáneo.

## Características

- **Autenticación multi-capa** con aislamiento por dominio
- **4 tipos de recursos**: summary, agents, users, costs
- **Consultas en lenguaje natural** desde Cursor
- **Acceso segmentado** por rol (SuperAdmin y Admin)

## Ejemplo de uso

Desde Cursor IDE:
\`\`\`
> "Muéstrame las estadísticas de uso de getaifactory.com"

✓ Respuesta estructurada con métricas en tiempo real
\`\`\`

Datos retornados:
- Total de agentes: 45
- Mensajes hoy: 234
- Usuarios activos: 12
- Costo mensual estimado: $127`,
    category: 'developer-tools',
    status: 'stable',
    industries: ['smbs', 'corporate-venture-capital', 'fintech'],
    priority: 'high',
    impactScore: 9,
    userRequestCount: 3,
    requestedBy: ['Developer team'],
    alignmentReason: 'Habilita análisis de datos sin salir del flujo de desarrollo. Aumenta productividad 10x para equipos técnicos.',
    valueProposition: 'Desarrolladores obtienen insights instantáneos sin cambiar de contexto. Toma de decisiones data-driven en segundos.',
    useCases: [
      {
        industry: 'fintech',
        title: 'Monitoreo de costos en desarrollo',
        description: 'CTOs consultan costos de API mientras revisan código',
        metrics: {
          timeSaved: '5 horas/semana',
          costReduction: '$1,500/mes en optimización'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#mcp-implementation'],
      commits: [],
      filesChanged: 13,
      linesAdded: 1500,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['developer-experience', 'integration', 'analytics'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-30')
  },

  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-22'),
    title: 'Sistema de Compartir Agentes',
    subtitle: 'Comparte configuraciones de agentes con tu equipo',
    description: `Los agentes ahora pueden marcarse como **públicos** para compartir con toda tu organización.

## Beneficios

- **Comparte mejores prácticas** entre equipos
- **Reutiliza configuraciones** validadas
- **Acelera onboarding** de nuevos usuarios  
- **Control granular** - público solo dentro de tu dominio

## Cómo funciona

1. Configura y prueba tu agente
2. Marca como "Público" en configuración
3. Aparece en galería de agentes
4. Otros usuarios lo clonan y personalizan

## Seguridad

- Público = visible solo en tu organización
- Usuarios clonan, no modifican original
- Actualizaciones opcionales a clones`,
    category: 'collaboration',
    status: 'stable',
    industries: ['banking', 'health', 'corporate-venture-capital', 'higher-education'],
    priority: 'high',
    impactScore: 8,
    userRequestCount: 8,
    requestedBy: ['Banking team', 'Health compliance team'],
    alignmentReason: 'Maximiza ROI de configuraciones expertas. Conocimiento se comparte, no se reinventa.',
    valueProposition: 'Nuevos usuarios productivos en 30 minutos vs 3 días. Calidad consistente en toda la organización.',
    useCases: [
      {
        industry: 'banking',
        title: 'Estandarización de agentes de compliance',
        description: 'Departamento legal comparte agente validado para análisis AML/KYC',
        beforeAfter: {
          before: 'Cada analista configura su agente manualmente (3 horas)',
          after: 'Clonar agente certificado del experto (5 minutos)'
        },
        metrics: {
          timeSaved: '97% reducción en setup time',
          qualityImprovement: '100% consistency en análisis regulatorio'
        }
      },
      {
        industry: 'health',
        title: 'Protocolos clínicos compartidos',
        description: 'Médico senior comparte agente con protocolos validados',
        metrics: {
          timeSaved: '15 horas/semana en onboarding',
          qualityImprovement: 'Cero errores de protocolo'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#agent-sharing'],
      commits: [],
      filesChanged: 8,
      linesAdded: 450,
      linesRemoved: 0,
      breakingChanges: false
    },
    showcase: {
      imageUrls: [],
      videoUrl: undefined,
      demoUrl: undefined
    },
    tags: ['collaboration', 'knowledge-sharing', 'productivity'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-22')
  },

  {
    version: '0.3.0',
    releaseDate: new Date('2025-10-19'),
    title: 'CLI Tools para Desarrolladores',
    subtitle: 'Automatiza la gestión de documentos desde la línea de comandos',
    description: `**salfagpt CLI** te permite automatizar operaciones desde terminal.

## Comandos disponibles

\`\`\`bash
# Cargar documentos a un agente
npx salfagpt upload contextos/pdf/agentes/M001

# Listar agentes
npx salfagpt list-agents

# Búsqueda semántica
npx salfagpt search "procedimientos de seguridad"
\`\`\`

## Features

- **Upload masivo** de PDFs a carpetas de agentes
- **Búsqueda vectorial** desde CLI
- **Gestión de agentes** programática
- **Tracking completo** de operaciones en Firestore

## Casos de uso

- **CI/CD pipelines** - Actualización automática de contextos
- **Batch processing** - 100+ documentos en una línea
- **Scripting** - Integración con workflows existentes`,
    category: 'developer-tools',
    status: 'stable',
    industries: ['smbs', 'fintech', 'ecommerce'],
    priority: 'medium',
    impactScore: 7,
    userRequestCount: 4,
    requestedBy: ['DevOps teams'],
    alignmentReason: 'Habilita automatización y CI/CD. Desarrolladores integran AI Factory en sus pipelines.',
    valueProposition: 'Automatiza tareas repetitivas. 100+ documentos procesados en minutos vs horas manualmente.',
    useCases: [
      {
        industry: 'fintech',
        title: 'Pipeline de documentación regulatoria',
        description: 'Actualización automática de contextos cuando regulaciones cambian',
        beforeAfter: {
          before: 'Subir 50 PDFs manualmente cada mes (4 horas)',
          after: 'Script automatizado que corre cada noche (0 horas)'
        },
        metrics: {
          timeSaved: '48 horas/año',
          costReduction: '$4,800/año en tiempo de equipo'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#cli-implementation'],
      commits: [],
      filesChanged: 20,
      linesAdded: 800,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['automation', 'devops', 'ci-cd'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-19')
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-13'),
    title: 'Multi-Usuario con Aislamiento Completo',
    subtitle: 'Seguridad y privacidad garantizadas por diseño',
    description: `**Privacidad por defecto** - Cada usuario ve solo sus datos.

## Garantías de seguridad

- **3 capas de protección**
  - Firestore queries filtradas por userId
  - API endpoints verifican ownership
  - Security Rules a nivel de base de datos
  
- **Aislamiento por dominio** para empresas
- **Contexto privado** por agente
- **Audit logs** completos de acceso

## Compliance

- ✅ **GDPR compliant** - Derecho a borrado y exportación
- ✅ **HIPAA ready** - Encriptación y audit trail
- ✅ **SOC 2** controls implementados

## Arquitectura

Cada usuario tiene su propio espacio aislado:
- Conversaciones separadas
- Contexto privado
- Configuraciones independientes
- Cero data leakage entre usuarios`,
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
        description: 'Hospital con 50+ doctores, cada uno con acceso solo a sus pacientes',
        beforeAfter: {
          before: 'No viable usar plataforma por riesgo HIPAA',
          after: 'Implementación certificada con aislamiento total'
        },
        metrics: {
          qualityImprovement: '100% compliance',
          costReduction: '$0 en multas regulatorias'
        }
      },
      {
        industry: 'banking',
        title: 'Análisis de clientes por asesor',
        description: 'Cada asesor financiero ve solo sus clientes',
        metrics: {
          qualityImprovement: '100% data privacy',
          costReduction: 'Cero incidentes de seguridad'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#privacy-framework'],
      commits: [],
      filesChanged: 25,
      linesAdded: 2000,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['security', 'privacy', 'compliance', 'gdpr', 'hipaa'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-13')
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-11'),
    title: 'Workflows de Procesamiento Automático',
    subtitle: 'Extrae información de PDFs, Excel, URLs automáticamente',
    description: `Sistema completo de workflows para procesar diferentes tipos de documentos con IA.

## 7 workflows disponibles

1. **Procesar PDF** - Extracción con Gemini Vision
2. **Importar CSV** - Parsing de datos tabulares
3. **Leer Excel** - Múltiples hojas
4. **Extraer Word** - Formato preservado
5. **Scrape URL** - Contenido web actualizado
6. **Conectar API** - Integraciones en tiempo real
7. **Procesar Carpeta** - Batch de archivos

## Features

- **Configuración por workflow** (modelo, tamaño, idioma)
- **Progress tracking** visual
- **Re-extracción** con nuevos parámetros
- **Validación** por expertos

## Modelos disponibles

- **Flash** - Rápido y económico (94% ahorro)
- **Pro** - Mayor precisión para documentos complejos`,
    category: 'context-management',
    status: 'stable',
    industries: ['construction', 'banking', 'real-estate', 'agriculture', 'retail'],
    priority: 'high',
    impactScore: 9,
    userRequestCount: 15,
    requestedBy: ['Construction', 'Banking', 'Legal teams'],
    alignmentReason: 'Core value prop: Convertir documentos en conocimiento accionable. Sin esto, la plataforma es solo un chatbot.',
    valueProposition: 'Procesa 100 PDFs en minutos vs días manualmente. Precisión 95% con validación experta.',
    useCases: [
      {
        industry: 'construction',
        title: 'Digitalización de manuales de seguridad',
        description: '50+ manuales técnicos procesados automáticamente',
        beforeAfter: {
          before: 'Transcribir manualmente: 40 horas',
          after: 'Extracción automática: 30 minutos'
        },
        metrics: {
          timeSaved: '98% más rápido',
          costReduction: '$4,000 en costos de transcripción'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#workflows-system'],
      commits: [],
      filesChanged: 12,
      linesAdded: 1100,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['automation', 'document-processing', 'ai-extraction'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-11')
  },

  {
    version: '0.2.0',
    releaseDate: new Date('2025-10-10'),
    title: 'Arquitectura de Agentes',
    subtitle: 'Múltiples asistentes especializados con contexto independiente',
    description: `
Cada **agente** es un asistente IA configurado para un propósito específico.

**Agente = Configuración + Contexto + Memoria**

**Características:**
- 🤖 Modelos configurables (Flash/Pro)
- 📚 Contexto privado por agente
- 🧠 Memoria de conversación
- ⚙️ System prompts personalizados
- 📊 Tracking de tokens y costos

**Use case:** Agente para legal, otro para ventas, otro para soporte.
    `.trim(),
    category: 'ai-agents',
    status: 'stable',
    industries: ['banking', 'health', 'real-estate', 'corporate-venture-capital', 'higher-education'],
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
        description: '3 agentes: Préstamos hipotecarios, Inversiones, Cuentas corrientes',
        metrics: {
          qualityImprovement: '40% mayor precisión',
          timeSaved: '60% respuestas más rápidas'
        }
      }
    ],
    technicalDetails: {
      githubPRs: ['#agent-architecture'],
      commits: [],
      filesChanged: 30,
      linesAdded: 3000,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['core-feature', 'ai', 'productivity'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-10')
  },

  {
    version: '0.1.0',
    releaseDate: new Date('2025-10-10'),
    title: 'Autenticación Google OAuth 2.0',
    subtitle: 'Login seguro y gestión de sesiones',
    description: `
Sistema de autenticación enterprise-ready con Google OAuth.

**Features:**
- 🔐 OAuth 2.0 con Google
- 🍪 Sesiones seguras (HTTPOnly cookies)
- 🔄 Refresh automático
- 🚪 Logout completo

**Seguridad:**
- JWT tokens con expiración
- CSRF protection
- Secure cookies en producción
    `.trim(),
    category: 'security',
    status: 'stable',
    industries: ['banking', 'health', 'fintech', 'multi-family-office'],
    priority: 'critical',
    impactScore: 10,
    userRequestCount: 0,
    requestedBy: ['Security requirement'],
    alignmentReason: 'Base fundamental de seguridad. Sin auth seguro, no hay platform viable.',
    valueProposition: 'Cero incidentes de seguridad. Confianza de clientes enterprise.',
    useCases: [],
    technicalDetails: {
      githubPRs: ['#oauth-implementation'],
      commits: [],
      filesChanged: 10,
      linesAdded: 500,
      linesRemoved: 0,
      breakingChanges: false
    },
    tags: ['security', 'authentication', 'oauth'],
    relatedFeatures: [],
    createdBy: 'system',
    publishedBy: 'system',
    publishedAt: new Date('2025-10-10')
  }
];

async function seedChangelog() {
  console.log('🌱 Seeding changelog entries...\n');

  try {
    for (const entry of SAMPLE_CHANGELOG) {
      const docRef = await firestore.collection('changelog_entries').add({
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Created: v${entry.version} - ${entry.title}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   Industries: ${entry.industries.join(', ')}`);
      console.log(`   Impact: ${entry.impactScore}/10`);
      console.log(`   User requests: ${entry.userRequestCount}`);
      console.log('');
    }

    console.log('🎉 Changelog seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total entries: ${SAMPLE_CHANGELOG.length}`);
    console.log(`   Versions: ${[...new Set(SAMPLE_CHANGELOG.map(e => e.version))].join(', ')}`);
    console.log(`   Categories: ${[...new Set(SAMPLE_CHANGELOG.map(e => e.category))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to seed changelog:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedChangelog();

