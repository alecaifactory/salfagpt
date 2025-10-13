#!/usr/bin/env tsx
/**
 * Script para crear datos de muestra en Firestore
 * 
 * Uso:
 *   npx tsx scripts/seed-firestore-data.ts
 * 
 * Crea:
 * - User Settings de muestra
 * - Agent Configs de muestra
 * - Workflow Configs de muestra
 * - Conversation Context de muestra
 * - Usage Logs de muestra
 */

import { 
  saveUserSettings, 
  saveAgentConfig, 
  saveWorkflowConfig,
  saveConversationContextState,
  logUsage,
  getConversations
} from '../src/lib/firestore';

const DEMO_USER_ID = 'builder'; // Usuario de prueba

async function seedFirestoreData() {
  console.log('🌱 Iniciando seeding de datos de muestra en Firestore...\n');

  try {
    // 1. User Settings
    console.log('👤 Creando User Settings...');
    const userSettings = await saveUserSettings(DEMO_USER_ID, {
      preferredModel: 'gemini-2.5-pro',
      systemPrompt: 'Eres un asistente experto en tecnología. Responde de manera clara, precisa y profesional.',
      language: 'es',
    });
    console.log('✅ User Settings creados:', {
      userId: userSettings.userId,
      model: userSettings.preferredModel,
      source: userSettings.source
    });

    // 2. Obtener conversaciones existentes para crear configs
    console.log('\n💬 Obteniendo conversaciones existentes...');
    const conversations = await getConversations(DEMO_USER_ID);
    console.log(`📊 Encontradas ${conversations.length} conversaciones`);

    // 3. Agent Configs (uno por conversación)
    if (conversations.length > 0) {
      console.log('\n🤖 Creando Agent Configs...');
      
      for (const conv of conversations.slice(0, 3)) { // Primeras 3 conversaciones
        const agentConfig = await saveAgentConfig(conv.id, {
          conversationId: conv.id,
          userId: DEMO_USER_ID,
          model: conv.id.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
          systemPrompt: `Sistema específico para: ${conv.title}`,
          temperature: 0.7,
          maxOutputTokens: 8192,
        });
        console.log(`  ✅ Agent Config creado para conversación: ${conv.id.substring(0, 8)}...`);
      }
    }

    // 4. Workflow Configs
    console.log('\n⚙️ Creando Workflow Configs...');
    
    const workflowTypes = [
      { type: 'extract-pdf', name: 'Extracción de PDF' },
      { type: 'parse-csv', name: 'Análisis de CSV' },
      { type: 'scrape-url', name: 'Scraping Web' },
    ];

    for (const wf of workflowTypes) {
      const workflowConfig = await saveWorkflowConfig(DEMO_USER_ID, {
        userId: DEMO_USER_ID,
        workflowType: wf.type,
        config: {
          maxFileSize: 10,
          maxOutputLength: 20000,
          language: 'es',
          model: 'gemini-2.5-flash',
        },
      });
      console.log(`  ✅ Workflow Config creado: ${wf.name}`);
    }

    // 5. Conversation Context (si hay conversaciones)
    if (conversations.length > 0) {
      console.log('\n📚 Creando Conversation Context...');
      
      for (const conv of conversations.slice(0, 2)) { // Primeras 2 conversaciones
        const contextState = await saveConversationContextState(conv.id, {
          conversationId: conv.id,
          userId: DEMO_USER_ID,
          activeContextSourceIds: ['demo-1'], // Source de demo
          contextWindowUsage: 15,
        });
        console.log(`  ✅ Conversation Context creado para: ${conv.id.substring(0, 8)}...`);
      }
    }

    // 6. Usage Logs
    console.log('\n📊 Creando Usage Logs...');
    
    const usageActions = [
      { action: 'create_conversation', details: { title: 'Primera conversación' } },
      { action: 'send_message', details: { messageCount: 1, model: 'gemini-2.5-flash' } },
      { action: 'add_context_source', details: { sourceType: 'pdf', sourceName: 'documento.pdf' } },
      { action: 'change_model', details: { from: 'flash', to: 'pro' } },
      { action: 'validate_source', details: { sourceId: 'demo-1', validated: true } },
    ];

    for (const usage of usageActions) {
      await logUsage(DEMO_USER_ID, usage.action, usage.details);
      console.log(`  ✅ Usage Log: ${usage.action}`);
    }

    console.log('\n✅ ¡Seeding completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`  - 1 User Settings`);
    console.log(`  - ${Math.min(conversations.length, 3)} Agent Configs`);
    console.log(`  - ${workflowTypes.length} Workflow Configs`);
    console.log(`  - ${Math.min(conversations.length, 2)} Conversation Contexts`);
    console.log(`  - ${usageActions.length} Usage Logs`);
    console.log('\n🔗 Ver en Firestore Console:');
    console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore');

  } catch (error) {
    console.error('\n❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar seeding
seedFirestoreData()
  .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

