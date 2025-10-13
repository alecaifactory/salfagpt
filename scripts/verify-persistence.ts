#!/usr/bin/env tsx
/**
 * Script para verificar que el sistema de persistencia funciona correctamente
 * 
 * Uso:
 *   npx tsx scripts/verify-persistence.ts
 * 
 * Verifica:
 * - Conexión con Firestore
 * - Existencia de datos en cada colección
 * - Estructura de datos correcta
 * - Campo 'source' presente
 */

import { 
  getUserSettings,
  getAgentConfig,
  getWorkflowConfig,
  getConversationContext,
  getUserUsageLogs,
  getConversations
} from '../src/lib/firestore';

const DEMO_USER_ID = 'builder';

async function verifyPersistence() {
  console.log('🔍 Verificando sistema de persistencia...\n');

  let errorsFound = 0;
  let successCount = 0;

  try {
    // 1. Verificar User Settings
    console.log('1️⃣  Verificando User Settings...');
    try {
      const userSettings = await getUserSettings(DEMO_USER_ID);
      if (userSettings) {
        console.log('   ✅ User Settings encontrados');
        console.log(`   📊 Modelo: ${userSettings.preferredModel}`);
        console.log(`   📊 Source: ${userSettings.source || 'N/A'}`);
        successCount++;
      } else {
        console.log('   ⚠️  No se encontraron User Settings');
        console.log('   💡 Ejecuta: npx tsx scripts/seed-firestore-data.ts');
        errorsFound++;
      }
    } catch (error) {
      console.log('   ❌ Error al cargar User Settings:', error);
      errorsFound++;
    }

    // 2. Verificar Conversaciones
    console.log('\n2️⃣  Verificando Conversaciones...');
    try {
      const conversations = await getConversations(DEMO_USER_ID);
      console.log(`   ✅ ${conversations.length} conversaciones encontradas`);
      
      if (conversations.length > 0) {
        const firstConv = conversations[0];
        console.log(`   📊 Primera conversación: ${firstConv.id.substring(0, 8)}...`);
        console.log(`   📊 Título: ${firstConv.title}`);
        console.log(`   📊 Source: ${firstConv.source || 'N/A'}`);
        successCount++;

        // 3. Verificar Agent Config para primera conversación
        console.log('\n3️⃣  Verificando Agent Config...');
        try {
          const agentConfig = await getAgentConfig(firstConv.id);
          if (agentConfig) {
            console.log('   ✅ Agent Config encontrado');
            console.log(`   📊 Modelo: ${agentConfig.model || 'default'}`);
            console.log(`   📊 Source: ${agentConfig.source || 'N/A'}`);
            successCount++;
          } else {
            console.log('   ℹ️  No hay Agent Config específico (usando defaults)');
          }
        } catch (error) {
          console.log('   ⚠️  Error al cargar Agent Config:', error);
        }

        // 4. Verificar Conversation Context
        console.log('\n4️⃣  Verificando Conversation Context...');
        try {
          const context = await getConversationContext(firstConv.id);
          if (context) {
            console.log('   ✅ Conversation Context encontrado');
            console.log(`   📊 Fuentes activas: ${context.activeContextSourceIds?.length || 0}`);
            console.log(`   📊 Uso de contexto: ${context.contextWindowUsage || 0}%`);
            console.log(`   📊 Source: ${context.source || 'N/A'}`);
            successCount++;
          } else {
            console.log('   ℹ️  No hay Conversation Context guardado');
          }
        } catch (error) {
          console.log('   ⚠️  Error al cargar Conversation Context:', error);
        }
      } else {
        console.log('   ℹ️  No hay conversaciones para verificar Agent Config y Context');
      }
    } catch (error) {
      console.log('   ❌ Error al cargar Conversaciones:', error);
      errorsFound++;
    }

    // 5. Verificar Workflow Configs
    console.log('\n5️⃣  Verificando Workflow Configs...');
    try {
      const workflowConfig = await getWorkflowConfig(DEMO_USER_ID, 'extract-pdf');
      if (workflowConfig) {
        console.log('   ✅ Workflow Config encontrado');
        console.log(`   📊 Tipo: ${workflowConfig.workflowType}`);
        console.log(`   📊 Modelo: ${workflowConfig.config.model || 'N/A'}`);
        console.log(`   📊 Source: ${workflowConfig.source || 'N/A'}`);
        successCount++;
      } else {
        console.log('   ℹ️  No hay Workflow Config para extract-pdf');
      }
    } catch (error) {
      console.log('   ⚠️  Error al cargar Workflow Config:', error);
    }

    // 6. Verificar Usage Logs
    console.log('\n6️⃣  Verificando Usage Logs...');
    try {
      const usageLogs = await getUserUsageLogs(DEMO_USER_ID, 5); // Últimos 5
      console.log(`   ✅ ${usageLogs.length} Usage Logs encontrados`);
      
      if (usageLogs.length > 0) {
        console.log('   📊 Últimas acciones:');
        usageLogs.forEach((log, i) => {
          console.log(`      ${i + 1}. ${log.action} (${log.source || 'N/A'})`);
        });
        successCount++;
      } else {
        console.log('   ℹ️  No hay Usage Logs');
      }
    } catch (error) {
      console.log('   ⚠️  Error al cargar Usage Logs:', error);
    }

    // 7. Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Verificaciones exitosas: ${successCount}`);
    console.log(`❌ Errores encontrados: ${errorsFound}`);
    
    if (errorsFound === 0) {
      console.log('\n✨ ¡Sistema de persistencia funcionando correctamente!');
      console.log('\n🔗 Ver datos en Firestore:');
      console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore');
    } else {
      console.log('\n⚠️  Se encontraron algunos problemas');
      console.log('💡 Sugerencias:');
      console.log('   1. Ejecuta: gcloud auth application-default login');
      console.log('   2. Ejecuta: npx tsx scripts/seed-firestore-data.ts');
      console.log('   3. Verifica que GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192');
    }

    // 8. Instrucciones de testing
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('   1. Iniciar servidor: npm run dev');
    console.log('   2. Abrir: http://localhost:3000/chat');
    console.log('   3. Crear agente y probar funcionalidades');
    console.log('   4. Ver guía completa: docs/TESTING_PERSISTENCE_SYSTEM.md');

  } catch (error) {
    console.error('\n💥 Error fatal durante verificación:', error);
    process.exit(1);
  }
}

// Ejecutar verificación
verifyPersistence()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

