#!/usr/bin/env tsx
/**
 * Script completo para crear datos de prueba en Firestore
 * 
 * Crea datos de muestra para MÚLTIPLES tipos de usuarios y escenarios:
 * - Admin: Usuario administrador con permisos completos
 * - Expert: Usuario experto que valida contenido
 * - User: Usuario estándar
 * - Power User: Usuario avanzado con muchas conversaciones
 * - New User: Usuario nuevo con datos mínimos
 * 
 * Uso:
 *   npx tsx scripts/seed-complete-test-data.ts [environment]
 * 
 * Parámetros:
 *   environment: 'localhost' (default) o 'production'
 * 
 * Ejemplos:
 *   npx tsx scripts/seed-complete-test-data.ts
 *   npx tsx scripts/seed-complete-test-data.ts localhost
 *   npx tsx scripts/seed-complete-test-data.ts production
 */

import { 
  saveUserSettings, 
  saveAgentConfig, 
  saveWorkflowConfig,
  saveConversationContextState,
  logUsage,
  createConversation,
  addMessage,
  COLLECTIONS
} from '../src/lib/firestore';
import { Firestore } from '@google-cloud/firestore';

// Configuración del ambiente
const TARGET_ENV = process.argv[2] || 'localhost';
const IS_PRODUCTION = TARGET_ENV === 'production';

console.log(`🌍 Ambiente objetivo: ${TARGET_ENV}`);
console.log(`📍 Source que se usará: ${TARGET_ENV}\n`);

// Definición de tipos de usuarios para testing
const TEST_USERS = [
  {
    id: 'admin_demo',
    role: 'admin',
    name: 'Admin Demo',
    email: 'admin@demo.com',
    scenarios: ['full_access', 'user_management', 'system_config'],
  },
  {
    id: 'expert_demo',
    role: 'expert',
    name: 'Expert Demo',
    email: 'expert@demo.com',
    scenarios: ['context_validation', 'agent_validation', 'analytics'],
  },
  {
    id: 'user_standard',
    role: 'user',
    name: 'Usuario Estándar',
    email: 'user@demo.com',
    scenarios: ['basic_chat', 'context_usage', 'simple_workflows'],
  },
  {
    id: 'power_user',
    role: 'user',
    name: 'Power User',
    email: 'poweruser@demo.com',
    scenarios: ['multiple_agents', 'advanced_config', 'heavy_usage'],
  },
  {
    id: 'new_user',
    role: 'user',
    name: 'Usuario Nuevo',
    email: 'newuser@demo.com',
    scenarios: ['first_time', 'onboarding'],
  },
] as const;

// Firestore instance con source override
const firestore = new Firestore({
  projectId: 'gen-lang-client-0986191192',
});

/**
 * Override del getEnvironmentSource para testing
 * Permite forzar el source a 'production' cuando se necesite
 */
function getTestSource(): 'localhost' | 'production' {
  return IS_PRODUCTION ? 'production' : 'localhost';
}

async function seedUserData(userId: string, role: string, scenarios: readonly string[]) {
  console.log(`\n👤 Creando datos para: ${userId} (${role})`);
  console.log(`   Escenarios: ${scenarios.join(', ')}`);

  try {
    // 1. User Settings basadas en rol
    const userSettings = await saveUserSettings(userId, getUserSettingsForRole(role));
    console.log(`   ✅ User Settings: ${userSettings.preferredModel}`);

    // 2. Conversaciones según escenarios
    const conversationCount = getConversationCountForScenarios(scenarios);
    const conversations = [];

    for (let i = 0; i < conversationCount; i++) {
      const conv = await createConversation(
        userId,
        getConversationTitle(role, scenarios, i)
      );
      conversations.push(conv);
      console.log(`   ✅ Conversación ${i + 1}: ${conv.title}`);

      // Agregar mensajes de muestra
      if (shouldAddMessages(scenarios)) {
        const messageCount = getMessageCount(role, i);
        for (let j = 0; j < messageCount; j++) {
          await addMessage(
            conv.id,
            userId,
            j % 2 === 0 ? 'user' : 'assistant',
            getSampleMessage(role, j),
            {}
          );
        }
        console.log(`      → ${messageCount} mensajes agregados`);
      }
    }

    // 3. Agent Configs para cada conversación
    for (const conv of conversations) {
      const agentConfig = await saveAgentConfig(conv.id, getAgentConfigForRole(role, conv.id, userId));
      console.log(`   ✅ Agent Config: ${agentConfig.model}`);
    }

    // 4. Workflow Configs según rol
    const workflowTypes = getWorkflowTypesForRole(role);
    for (const wfType of workflowTypes) {
      await saveWorkflowConfig(userId, {
        userId,
        workflowType: wfType.type,
        config: wfType.config,
      });
      console.log(`   ✅ Workflow: ${wfType.name}`);
    }

    // 5. Conversation Context
    for (const conv of conversations.slice(0, Math.min(conversations.length, 2))) {
      await saveConversationContextState(conv.id, {
        conversationId: conv.id,
        userId,
        activeContextSourceIds: getContextSourcesForRole(role),
        contextWindowUsage: getRandomContextUsage(role),
      });
      console.log(`   ✅ Conversation Context configurado`);
    }

    // 6. Usage Logs según escenarios
    const usageActions = getUsageActionsForScenarios(scenarios);
    for (const action of usageActions) {
      await logUsage(userId, action.action, action.details);
    }
    console.log(`   ✅ ${usageActions.length} Usage Logs creados`);

    return {
      userId,
      conversationCount: conversations.length,
      workflowCount: workflowTypes.length,
      usageCount: usageActions.length,
    };

  } catch (error) {
    console.error(`   ❌ Error creando datos para ${userId}:`, error);
    throw error;
  }
}

// ===== Funciones de configuración por rol =====

function getUserSettingsForRole(role: string) {
  const configs = {
    admin: {
      preferredModel: 'gemini-2.5-pro' as const,
      systemPrompt: 'Eres un asistente administrativo con acceso completo al sistema. Proporciona respuestas detalladas y técnicas.',
      language: 'es',
    },
    expert: {
      preferredModel: 'gemini-2.5-pro' as const,
      systemPrompt: 'Eres un experto en validación de contenido. Analiza cuidadosamente y proporciona feedback constructivo.',
      language: 'es',
    },
    user: {
      preferredModel: 'gemini-2.5-flash' as const,
      systemPrompt: 'Eres un asistente útil y amigable. Responde de manera clara y concisa.',
      language: 'es',
    },
  };
  return configs[role as keyof typeof configs] || configs.user;
}

function getAgentConfigForRole(role: string, conversationId: string, userId: string) {
  const isProAgent = conversationId.includes('pro') || role === 'admin' || role === 'expert';
  
  return {
    conversationId,
    userId,
    model: isProAgent ? 'gemini-2.5-pro' as const : 'gemini-2.5-flash' as const,
    systemPrompt: `Configuración específica para agente ${conversationId.substring(0, 8)}`,
    temperature: role === 'expert' ? 0.3 : 0.7,
    maxOutputTokens: role === 'admin' ? 16384 : 8192,
  };
}

function getWorkflowTypesForRole(role: string) {
  const baseWorkflows = [
    { 
      type: 'extract-pdf', 
      name: 'Extracción PDF',
      config: {
        maxFileSize: 10,
        maxOutputLength: 20000,
        language: 'es',
        model: 'gemini-2.5-flash',
      }
    },
    { 
      type: 'parse-csv', 
      name: 'Análisis CSV',
      config: {
        delimiter: ',',
        hasHeaders: true,
        encoding: 'utf-8',
      }
    },
  ];

  const advancedWorkflows = [
    { 
      type: 'scrape-url', 
      name: 'Scraping Web',
      config: {
        timeout: 30000,
        followRedirects: true,
        maxDepth: 2,
      }
    },
    { 
      type: 'api-integration', 
      name: 'Integración API',
      config: {
        method: 'GET',
        timeout: 15000,
        retries: 3,
      }
    },
  ];

  if (role === 'admin' || role === 'expert') {
    return [...baseWorkflows, ...advancedWorkflows];
  }
  return baseWorkflows;
}

function getContextSourcesForRole(role: string): string[] {
  const contexts = {
    admin: ['admin-docs-1', 'system-config-1', 'user-manual-1'],
    expert: ['validation-guide-1', 'quality-standards-1'],
    user: ['getting-started-1'],
  };
  return contexts[role as keyof typeof contexts] || contexts.user;
}

function getRandomContextUsage(role: string): number {
  const ranges = {
    admin: [30, 60],
    expert: [20, 50],
    user: [5, 25],
  };
  const [min, max] = ranges[role as keyof typeof ranges] || [5, 25];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== Funciones de generación de contenido =====

function getConversationCountForScenarios(scenarios: readonly string[]): number {
  if (scenarios.includes('multiple_agents')) return 8;
  if (scenarios.includes('heavy_usage')) return 5;
  if (scenarios.includes('first_time')) return 1;
  if (scenarios.includes('full_access')) return 4;
  return 3;
}

function getConversationTitle(role: string, scenarios: readonly string[], index: number): string {
  const prefixes = {
    admin: ['Sistema:', 'Config:', 'Análisis:', 'Gestión:'],
    expert: ['Validación:', 'Revisión:', 'Evaluación:', 'Certificación:'],
    user: ['Chat:', 'Consulta:', 'Pregunta:', 'Ayuda:'],
  };

  const topics = [
    'Configuración inicial',
    'Análisis de datos',
    'Procesamiento de documentos',
    'Consulta técnica',
    'Integración de APIs',
    'Validación de contenido',
    'Optimización de workflows',
    'Resolución de problemas',
  ];

  const prefix = (prefixes[role as keyof typeof prefixes] || prefixes.user)[index % 4];
  const topic = topics[index % topics.length];
  
  return `${prefix} ${topic}`;
}

function shouldAddMessages(scenarios: readonly string[]): boolean {
  return !scenarios.includes('onboarding'); // No agregar mensajes en onboarding
}

function getMessageCount(role: string, conversationIndex: number): number {
  const baseCounts = {
    admin: 8,
    expert: 6,
    user: 4,
  };
  const base = baseCounts[role as keyof typeof baseCounts] || 4;
  return base + (conversationIndex % 3); // Variación
}

function getSampleMessage(role: string, messageIndex: number): string {
  const userMessages = [
    '¿Cómo puedo configurar esto?',
    'Necesito ayuda con el análisis de datos',
    '¿Qué opciones tengo disponibles?',
    'Explícame cómo funciona',
  ];

  const assistantMessages = [
    'Claro, te ayudo con la configuración. Primero...',
    'Para el análisis de datos, puedes usar las siguientes herramientas...',
    'Tienes varias opciones disponibles: 1) Opción A, 2) Opción B...',
    'Te explico el funcionamiento: El sistema funciona mediante...',
  ];

  return messageIndex % 2 === 0 
    ? userMessages[messageIndex % userMessages.length]
    : assistantMessages[messageIndex % assistantMessages.length];
}

function getUsageActionsForScenarios(scenarios: readonly string[]) {
  const baseActions = [
    { action: 'create_conversation', details: { title: 'Primera conversación' } },
    { action: 'send_message', details: { messageCount: 1, model: 'gemini-2.5-flash' } },
  ];

  const advancedActions = [
    { action: 'add_context_source', details: { sourceType: 'pdf', sourceName: 'documento.pdf' } },
    { action: 'change_model', details: { from: 'flash', to: 'pro' } },
    { action: 'configure_workflow', details: { workflowType: 'extract-pdf' } },
    { action: 'validate_source', details: { sourceId: 'demo-1', validated: true } },
  ];

  const powerActions = [
    { action: 'bulk_import', details: { fileCount: 10, totalSize: 50000 } },
    { action: 'export_data', details: { format: 'json', recordCount: 100 } },
    { action: 'api_integration', details: { endpoint: 'external-api', status: 'success' } },
  ];

  let actions = [...baseActions];

  if (scenarios.includes('advanced_config') || scenarios.includes('full_access')) {
    actions = [...actions, ...advancedActions];
  }

  if (scenarios.includes('heavy_usage')) {
    actions = [...actions, ...powerActions];
  }

  return actions;
}

// ===== Función principal =====

async function seedCompleteTestData() {
  console.log('🌱 Iniciando seeding COMPLETO de datos de prueba\n');
  console.log('═'.repeat(60));

  const summary = {
    totalUsers: 0,
    totalConversations: 0,
    totalWorkflows: 0,
    totalUsageLogs: 0,
    environment: TARGET_ENV,
  };

  try {
    for (const user of TEST_USERS) {
      const result = await seedUserData(user.id, user.role, user.scenarios);
      summary.totalUsers++;
      summary.totalConversations += result.conversationCount;
      summary.totalWorkflows += result.workflowCount;
      summary.totalUsageLogs += result.usageCount;

      // Pausa breve entre usuarios para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ ¡Seeding COMPLETO exitoso!\n');

    console.log('📊 RESUMEN GENERAL:');
    console.log(`   - Ambiente: ${summary.environment}`);
    console.log(`   - Usuarios creados: ${summary.totalUsers}`);
    console.log(`   - Conversaciones: ${summary.totalConversations}`);
    console.log(`   - Workflows configurados: ${summary.totalWorkflows}`);
    console.log(`   - Usage Logs: ${summary.totalUsageLogs}`);

    console.log('\n👥 TIPOS DE USUARIOS CREADOS:');
    for (const user of TEST_USERS) {
      console.log(`   ✅ ${user.id} (${user.role}) - ${user.email}`);
      console.log(`      Escenarios: ${user.scenarios.join(', ')}`);
    }

    console.log('\n🔗 VER DATOS EN FIRESTORE:');
    console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore');

    console.log('\n💡 PROBAR CON DIFERENTES USUARIOS:');
    console.log('   1. Admin:      admin_demo     (admin@demo.com)');
    console.log('   2. Expert:     expert_demo    (expert@demo.com)');
    console.log('   3. User:       user_standard  (user@demo.com)');
    console.log('   4. Power:      power_user     (poweruser@demo.com)');
    console.log('   5. New:        new_user       (newuser@demo.com)');

    console.log('\n🧪 CASOS DE PRUEBA DISPONIBLES:');
    console.log('   ✅ Usuario con acceso completo (admin)');
    console.log('   ✅ Usuario experto con validación (expert)');
    console.log('   ✅ Usuario estándar con uso básico (user_standard)');
    console.log('   ✅ Usuario avanzado con múltiples agentes (power_user)');
    console.log('   ✅ Usuario nuevo sin configuración previa (new_user)');

  } catch (error) {
    console.error('\n❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar
seedCompleteTestData()
  .then(() => {
    console.log('\n✨ Proceso finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

