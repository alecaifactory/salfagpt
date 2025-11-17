#!/usr/bin/env -S npx tsx
/**
 * Initialize Ally Prompts for Salfa Corp
 * 
 * Creates:
 * 1. SuperPrompt (platform-wide) - Already exists from ally-init.ts
 * 2. Organization Prompt (Salfa Corp) - NEW
 * 3. Domain Prompt (salfagestion.cl) - NEW
 * 
 * Run: npx tsx scripts/initialize-ally-prompts.ts
 */

import { firestore } from '../src/lib/firestore';
import { initializeAllySuperPrompt } from '../src/lib/ally-init';

const SALFA_CORP_ORG_ID = 'salfa-corp';
const SALFAGESTION_DOMAIN = 'salfagestion.cl';

/**
 * Salfa Corp Organization Prompt
 * 
 * Context that ALL users in Salfa Corp organization have access to
 */
const SALFA_CORP_ORGANIZATION_PROMPT = `# SALFA CORP - CONTEXTO ORGANIZACIONAL

## Infraestructura Técnica

**Proyecto GCP:** salfagpt  
**Region:** us-east4  
**Servicio Principal:** cr-salfagpt-ai-ft-prod  
**Base de Datos:** Firestore + BigQuery  

## Valores Corporativos

1. **Excelencia Operacional**
   - Buscamos la mejora continua en todos nuestros procesos
   - Implementamos las mejores prácticas de la industria
   - Invertimos en tecnología para eficiencia

2. **Seguridad Primero**
   - La seguridad de nuestros colaboradores es prioridad #1
   - Cumplimiento estricto de normativas SSOMA
   - Protocolos de prevención de riesgos

3. **Innovación y Tecnología**
   - Adoptamos IA para potenciar a nuestros equipos
   - Digitalizamos procesos para mayor eficiencia
   - Capacitación continua en nuevas herramientas

4. **Colaboración y Conocimiento**
   - Compartimos conocimiento entre áreas
   - Documentamos procedimientos y best practices
   - Validamos respuestas con expertos

## Áreas de Negocio

**Gestión Territorial (Dominio: salfagestion.cl)**
- Desarrollo inmobiliario y construcción
- Permisos y normativas municipales
- Gestión de proyectos territoriales
- Agente: M001 - Asistente Legal Territorial RDI

**Mantenimiento de Maquinaria (MAQSA)**
- Mantenimiento preventivo y correctivo
- Gestión de flotas de equipos
- Órdenes de trabajo
- Agentes: M003, S002 - Mantenimiento MAQSA

**Gestión de Bodegas**
- Inventarios y stock
- Logística de almacenamiento
- Control de materiales
- Agente: S001 - Gestión de Bodegas

**Seguridad y Salud Ocupacional**
- Protocolos SSOMA
- Prevención de riesgos
- Capacitación en seguridad
- Agente: SSOMA L1

**Gestión y Coordinación**
- Planificación operativa
- Coordinación entre áreas
- Gestión de proyectos
- Agente: KAMKE L2

## Políticas de Uso de IA

1. **Validación de Respuestas Críticas**
   - Las decisiones importantes deben ser validadas por expertos humanos
   - Los agentes de IA son asistentes, no reemplazan el juicio profesional
   - Siempre verifica información crítica con especialistas

2. **Privacidad y Confidencialidad**
   - No compartir información confidencial de clientes
   - Respetar límites organizacionales
   - Documentos sensibles solo para usuarios autorizados

3. **Calidad y Feedback**
   - Califinca las respuestas de los agentes (1-5 estrellas)
   - Da feedback cuando algo no es correcto
   - Los expertos revisan y aprueban respuestas importantes

## Contactos Clave

**SuperAdmin:** alec@getaifactory.com (Soporte técnico)  
**Organization Admin:** (Por configurar)  
**Domain Supervisors:** (Por configurar por dominio)

## Mejores Prácticas

1. **Antes de preguntar a un agente:**
   - Identifica el agente correcto para tu tema
   - Ten clara tu pregunta específica
   - Sube documentos relevantes si es necesario

2. **Al trabajar con respuestas:**
   - Lee las referencias citadas [1], [2], [3]
   - Verifica que la respuesta tenga sentido
   - Da feedback si algo está incorrecto
   - Comparte respuestas útiles con tu equipo

3. **Para aprovechar al máximo:**
   - Sube manuales y documentos de tu área
   - Activa solo las fuentes relevantes por conversación
   - Usa preguntas específicas en vez de genéricas
   - Valida respuestas críticas con expertos

## Soporte

**Stella (AI Assistant):** Para feedback y sugerencias  
**Ally (Personal Assistant):** Para guía sobre la plataforma  
**Agentes Especializados:** Para preguntas técnicas del área  
**SuperAdmin:** Para soporte técnico y configuración`;

/**
 * Salfagestion.cl Domain Prompt
 * 
 * Context specific to users in the salfagestion.cl domain
 */
const SALFAGESTION_DOMAIN_PROMPT = `# DOMINIO: GESTIÓN TERRITORIAL (salfagestion.cl)

## Área de Negocio

**Gestión Territorial RDI** (Regulación, Desarrollo, Inmobiliaria)
- Desarrollo de proyectos inmobiliarios
- Tramitación de permisos de edificación
- Gestión de normativas municipales y ministeriales
- Coordinación con autoridades regulatorias

## Agente Principal

**M001 - Asistente Legal Territorial RDI**
- Especializado en normativa de construcción
- Conocimiento de permisos municipales
- Interpretación de regulaciones territoriales
- Procedimientos legales de edificación

## Procedimientos Clave

**1. Tramitación de Permisos:**
- Identificar tipo de permiso necesario
- Recopilar documentación requerida
- Presentar ante autoridad competente
- Seguimiento hasta aprobación

**2. Consulta de Normativas:**
- Verificar aplicabilidad de normas
- Interpretar requisitos específicos
- Identificar restricciones y condiciones
- Documentar compliance

**3. Gestión de Proyectos:**
- Planificación de hitos regulatorios
- Coordinación con equipos técnicos
- Comunicación con autoridades
- Registro y trazabilidad

## Fuentes de Conocimiento

**Documentos Clave:**
- Ley General de Urbanismo y Construcciones (LGUC)
- Ordenanzas municipales
- Planes reguladores comunales
- Normativas técnicas específicas

**Consulta con M001:**
- Preguntas sobre permisos y normativas
- Interpretación de regulaciones
- Procedimientos específicos
- Casos de uso y precedentes

## Best Practices

1. **Consultas Específicas:**
   - Indica comuna/municipalidad
   - Menciona tipo de proyecto
   - Incluye metros cuadrados y uso
   - Referencia normativa si la conoces

2. **Validación de Respuestas:**
   - Las respuestas de M001 se basan en documentos corporativos
   - Para casos críticos, valida con asesor legal
   - Mantén actualizada la documentación normativa
   - Reporta cambios en regulaciones

3. **Colaboración:**
   - Comparte consultas útiles con el equipo
   - Documenta soluciones a casos comunes
   - Escalona casos complejos a supervisor
   - Contribuye al knowledge base del área

## Contactos del Dominio

**Supervisor:** (Por configurar)  
**Especialistas:** (Por configurar)  
**Soporte:** M001 Agent + Expertos Legales`;

/**
 * Initialize Organization Prompt for Salfa Corp
 */
async function initializeOrganizationPrompt(): Promise<void> {
  console.log('🏢 Initializing Organization Prompt for Salfa Corp...');
  
  try {
    // Check if organization exists
    const orgDoc = await firestore
      .collection('organizations')
      .doc(SALFA_CORP_ORG_ID)
      .get();
    
    if (!orgDoc.exists) {
      console.log('ℹ️ Organization not found, creating...');
      
      await firestore.collection('organizations').doc(SALFA_CORP_ORG_ID).set({
        name: 'Salfa Corp',
        domains: ['salfagestion.cl', 'salfa.cl', 'maqsa.cl'],
        primaryDomain: 'salfagestion.cl',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'alec@getaifactory.com',
        source: 'localhost',
        
        // Ally configuration
        allyConfig: {
          organizationPrompt: SALFA_CORP_ORGANIZATION_PROMPT,
          enableHistory: true,
          historyLimit: 3,  // Last 3 conversations
        },
        
        // Branding
        branding: {
          brandName: 'SalfaGPT',
          primaryColor: '#2563EB', // Blue
          logo: null,
        },
      });
      
      console.log('✅ Organization created with Ally prompt');
    } else {
      // Update existing with Ally prompt
      await firestore
        .collection('organizations')
        .doc(SALFA_CORP_ORG_ID)
        .update({
          'allyConfig.organizationPrompt': SALFA_CORP_ORGANIZATION_PROMPT,
          'allyConfig.enableHistory': true,
          'allyConfig.historyLimit': 3,
          updatedAt: new Date(),
        });
      
      console.log('✅ Organization Prompt updated');
    }
    
    console.log(`   Prompt length: ${SALFA_CORP_ORGANIZATION_PROMPT.length} characters`);
    
  } catch (error) {
    console.error('❌ Error initializing Organization Prompt:', error);
    throw error;
  }
}

/**
 * Initialize Domain Prompt for salfagestion.cl
 */
async function initializeDomainPrompt(): Promise<void> {
  console.log('🏢 Initializing Domain Prompt for salfagestion.cl...');
  
  try {
    // Check if domain config exists
    const domainDoc = await firestore
      .collection('domain_review_config')
      .doc(SALFAGESTION_DOMAIN)
      .get();
    
    if (!domainDoc.exists) {
      console.log('ℹ️ Domain config not found, creating...');
      
      await firestore
        .collection('domain_review_config')
        .doc(SALFAGESTION_DOMAIN)
        .set({
          domainName: 'Gestión Territorial',
          domainPrompt: SALFAGESTION_DOMAIN_PROMPT,  // ← NEW
          supervisors: [],
          specialists: [],
          implementers: [],
          priorityThresholds: {
            userStarThreshold: 3,
            expertRatingThreshold: 'inaceptable',
            autoFlagInaceptable: true,
            minimumSimilarQuestions: 5
          },
          notifications: {
            notifyOnBadRating: true,
            notifyOnNewTicket: true,
            notifyOnAssignment: true
          },
          automation: {
            autoAssignToSpecialist: false,
            autoEscalateCritical: true
          },
          customSettings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'alec@getaifactory.com',
          source: 'localhost'
        });
      
      console.log('✅ Domain config created with prompt');
    } else {
      // Update existing with domain prompt
      await firestore
        .collection('domain_review_config')
        .doc(SALFAGESTION_DOMAIN)
        .update({
          domainPrompt: SALFAGESTION_DOMAIN_PROMPT,  // ← NEW
          updatedAt: new Date(),
        });
      
      console.log('✅ Domain Prompt updated');
    }
    
    console.log(`   Prompt length: ${SALFAGESTION_DOMAIN_PROMPT.length} characters`);
    
  } catch (error) {
    console.error('❌ Error initializing Domain Prompt:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Initializing Ally Prompts for Salfa Corp');
  console.log('==============================================');
  console.log('');
  
  try {
    // 1. Initialize SuperPrompt (platform-wide)
    console.log('1️⃣ Initializing SuperPrompt...');
    const superPromptId = await initializeAllySuperPrompt('alec@getaifactory.com');
    console.log(`✅ SuperPrompt initialized: ${superPromptId}`);
    console.log('');
    
    // 2. Initialize Organization Prompt (Salfa Corp)
    console.log('2️⃣ Initializing Organization Prompt...');
    await initializeOrganizationPrompt();
    console.log('');
    
    // 3. Initialize Domain Prompt (salfagestion.cl)
    console.log('3️⃣ Initializing Domain Prompt...');
    await initializeDomainPrompt();
    console.log('');
    
    console.log('🎉 ALL ALLY PROMPTS INITIALIZED SUCCESSFULLY!');
    console.log('');
    console.log('Summary:');
    console.log('  ✅ SuperPrompt: Platform-wide (all users)');
    console.log('  ✅ Organization Prompt: Salfa Corp');
    console.log('  ✅ Domain Prompt: salfagestion.cl (Gestión Territorial)');
    console.log('');
    console.log('Ally will now:');
    console.log('  - Explain Flow platform correctly');
    console.log('  - Recommend correct agents (M001, M003, S001, etc.)');
    console.log('  - Use Salfa Corp context for all users');
    console.log('  - Use Domain context for salfagestion.cl users');
    console.log('  - Access last 3 conversations for personalization');
    console.log('');
    console.log('🧪 Test by asking Ally:');
    console.log('   "¿Por dónde empiezo?"');
    console.log('   "¿Qué puedo preguntarte?"');
    console.log('   "¿Qué puedo hacer en la plataforma?"');
    console.log('');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run
main();

