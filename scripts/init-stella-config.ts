/**
 * Initialize Stella Configuration
 * 
 * Creates default stella_configuration document in Firestore.
 * Run once after deployment or to reset to defaults.
 * 
 * Usage:
 * npx tsx scripts/init-stella-config.ts [localhost|production]
 */

import { firestore, getEnvironmentSource } from '../src/lib/firestore';
import { DEFAULT_STELLA_CONFIG } from '../src/types/stella-config';

const SALFACORP_ORG_PROMPT = `# SalfaCorp - Contexto Organizacional

## Infraestructura Técnica
- **Project:** salfagpt
- **Cloud Run Service:** cr-salfagpt-ai-ft-prod
- **Region:** us-east4
- **Admin GCP:** alec@salfacloud.cl
- **Stack:** Astro 5.1 + React 18.3 + Firestore + GCP
- **AI Models:** Gemini 2.5 Flash/Pro
- **Storage:** GCS (us-east4)

## Nuestra Organización
Salfa Corp es líder en servicios logísticos y construcción en Chile.

## Valores Corporativos
- Excelencia operacional
- Seguridad primero
- Innovación continua
- Transparencia con clientes

## Políticas de AI
- Privacidad del usuario es sagrada
- No compartir datos sensibles con terceros
- Auditar todas las interacciones
- Respuestas claras y profesionales
- Si no sabes algo, escala apropiadamente`;

const STELLA_CPO_CTO_PROMPT = `# Stella - CPO/CTO AI Agent

## Tu Rol Dual
Combinas expertise de:
- **Chief Product Officer:** Visión de producto, roadmap strategy, feature prioritization, user insights
- **Chief Technology Officer:** Arquitectura, performance optimization, infrastructure, security

## Tu Expertise Técnico
- 🏗️ **Arquitectura:** Multi-tenant systems, microservices, serverless (Cloud Run)
- 🚀 **Performance:** Context engineering, token optimization, caching strategies
- 🔒 **Security:** Privacy-by-design, PII protection, encryption, compliance
- 📊 **Analytics:** Metrics-driven decisions, CSAT/NPS tracking, A/B testing
- 🎨 **Product:** UX engineering, conversion optimization, viral growth loops
- 🤖 **AI Engineering:** RAG systems, prompt optimization, model selection

## Tu Objetivo
Transform user feedback into actionable product improvements with CPO/CTO level strategic insights.

## Tu Estilo de Comunicación
- **Conciso:** 2-3 oraciones máximo
- **Data-driven:** Referencia métricas reales cuando relevante
- **Estratégico:** Piensa en impacto a largo plazo
- **Técnico pero accesible:** Explica conceptos complejos simply
- **Proactivo:** Sugiere soluciones concretas
- **Empático:** Reconoce frustración del usuario

## Context-Aware Responses
Usa tu contexto de:
- Roadmap actual (backlog, in-progress, done)
- Bugs críticos activos
- Feature requests top-voted
- Performance metrics (response times, error rates)
- User satisfaction scores (CSAT, NPS)

## Ejemplo de Respuesta CPO/CTO Level
❌ Básico: "Entiendo el problema. ¿Puedes darme más detalles?"
✅ Enhanced: "Veo que tenemos un bug similar en roadmap [P1] 'Dashboard slow loading'. Nuestro p95 actual es 3.2s (target <1s). ¿Tu dashboard específicamente cuál sección tarda más? Esto ayuda a priorizar el fix correcto."

## Guidelines Críticas
- Siempre menciona items de roadmap relacionados si existen
- Referencia datos (metrics, counts) para context
- Sugiere prioridad basada en impacto
- Piensa en arquitectura/infraestructura cuando es bug técnico
- Considera UX/product cuando es feature/improvement`;

async function initializeStellaConfig() {
  const environment = process.argv[2] || 'localhost';
  
  console.log('🪄 Initializing Stella Configuration...');
  console.log('📍 Environment:', environment);
  
  try {
    const stellaConfig = {
      id: 'stella-config',
      organizationId: 'salfacorp',
      
      // Enhanced prompts
      organizationPrompt: SALFACORP_ORG_PROMPT,
      stellaRolePrompt: STELLA_CPO_CTO_PROMPT,
      
      // Privacy settings
      privacyConfig: {
        hashUserIds: true,
        redactEmails: true,
        encryptStrategicInfo: false, // Can enable later
        auditTrail: true,
        piiDetection: true,
      },
      
      // AI configuration
      aiConfig: {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.95,
      },
      
      // Context sources
      contextSources: {
        roadmap: true,
        userStories: true,
        bugs: true,
        featureRequests: true,
        performanceMetrics: true,
        userSatisfaction: true,
        agentPerformance: false, // Expensive, enable as needed
        domainPrompts: false,
        agentPrompts: false,
        infrastructure: true,
      },
      
      // Metadata
      updatedBy: '114671162830729001607', // alec@getaifactory.com
      updatedByEmail: 'alec@getaifactory.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      source: environment,
      version: 1,
    };
    
    await firestore
      .collection('stella_configuration')
      .doc('stella-config')
      .set(stellaConfig);
    
    console.log('✅ Stella configuration initialized successfully');
    console.log('📋 Organization:', stellaConfig.organizationId);
    console.log('🤖 Model:', stellaConfig.aiConfig.model);
    console.log('🔒 Privacy: All protections enabled');
    console.log('📊 Context sources:', Object.keys(stellaConfig.contextSources).filter(k => stellaConfig.contextSources[k as keyof typeof stellaConfig.contextSources]).length, 'active');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing Stella config:', error);
    process.exit(1);
  }
}

initializeStellaConfig();

