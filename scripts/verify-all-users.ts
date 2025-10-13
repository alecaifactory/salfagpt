#!/usr/bin/env tsx
/**
 * Script para verificar que todos los tipos de usuarios tienen datos correctos
 * 
 * Uso:
 *   npx tsx scripts/verify-all-users.ts
 * 
 * Verifica:
 * - 5 tipos de usuarios existen
 * - Cada usuario tiene sus colecciones completas
 * - Campo 'source' presente
 * - Configuraciones apropiadas según rol
 */

import { 
  getUserSettings,
  getConversations,
  getUserWorkflowConfigs,
  getUserUsageLogs,
  COLLECTIONS
} from '../src/lib/firestore';

const TEST_USERS = [
  {
    id: 'admin_demo',
    role: 'admin',
    expectedConversations: 4,
    expectedWorkflows: 4,
    expectedModel: 'gemini-2.5-pro',
  },
  {
    id: 'expert_demo',
    role: 'expert',
    expectedConversations: 3,
    expectedWorkflows: 4,
    expectedModel: 'gemini-2.5-pro',
  },
  {
    id: 'user_standard',
    role: 'user',
    expectedConversations: 3,
    expectedWorkflows: 2,
    expectedModel: 'gemini-2.5-flash',
  },
  {
    id: 'power_user',
    role: 'user',
    expectedConversations: 8,
    expectedWorkflows: 2,
    expectedModel: 'gemini-2.5-flash',
  },
  {
    id: 'new_user',
    role: 'user',
    expectedConversations: 1,
    expectedWorkflows: 2,
    expectedModel: 'gemini-2.5-flash',
  },
] as const;

async function verifyUser(user: typeof TEST_USERS[number]) {
  console.log(`\n👤 Verificando: ${user.id} (${user.role})`);
  
  let checks = 0;
  let errors = 0;

  try {
    // 1. User Settings
    const userSettings = await getUserSettings(user.id);
    if (userSettings) {
      checks++;
      console.log(`   ✅ User Settings encontrado`);
      
      if (userSettings.preferredModel === user.expectedModel) {
        checks++;
        console.log(`   ✅ Modelo correcto: ${userSettings.preferredModel}`);
      } else {
        errors++;
        console.log(`   ❌ Modelo incorrecto: esperado ${user.expectedModel}, recibido ${userSettings.preferredModel}`);
      }
      
      if (userSettings.source) {
        checks++;
        console.log(`   ✅ Campo 'source' presente: ${userSettings.source}`);
      } else {
        errors++;
        console.log(`   ❌ Campo 'source' faltante`);
      }
    } else {
      errors++;
      console.log(`   ❌ User Settings NO encontrado`);
    }

    // 2. Conversaciones
    const conversations = await getConversations(user.id);
    if (conversations.length >= user.expectedConversations) {
      checks++;
      console.log(`   ✅ Conversaciones: ${conversations.length} (esperado: ${user.expectedConversations})`);
    } else {
      errors++;
      console.log(`   ❌ Conversaciones: ${conversations.length} (esperado: ${user.expectedConversations})`);
    }

    // 3. Workflow Configs
    const workflows = await getUserWorkflowConfigs(user.id);
    if (workflows.length >= user.expectedWorkflows) {
      checks++;
      console.log(`   ✅ Workflows: ${workflows.length} (esperado: ${user.expectedWorkflows})`);
    } else {
      errors++;
      console.log(`   ❌ Workflows: ${workflows.length} (esperado: ${user.expectedWorkflows})`);
    }

    // 4. Usage Logs
    const usageLogs = await getUserUsageLogs(user.id, 100);
    if (usageLogs.length > 0) {
      checks++;
      console.log(`   ✅ Usage Logs: ${usageLogs.length} registros`);
    } else {
      errors++;
      console.log(`   ❌ Usage Logs: 0 registros (esperado: >0)`);
    }

    return { checks, errors };

  } catch (error) {
    console.error(`   ❌ Error verificando ${user.id}:`, error);
    return { checks, errors: errors + 1 };
  }
}

async function verifyAllUsers() {
  console.log('🔍 Verificando TODOS los tipos de usuarios\n');
  console.log('═'.repeat(60));

  let totalChecks = 0;
  let totalErrors = 0;

  for (const user of TEST_USERS) {
    const result = await verifyUser(user);
    totalChecks += result.checks;
    totalErrors += result.errors;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   ✅ Verificaciones exitosas: ${totalChecks}`);
  console.log(`   ❌ Errores encontrados: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log('\n✨ ¡Todos los usuarios tienen datos correctos!');
    console.log('\n🎯 USUARIOS DISPONIBLES PARA TESTING:');
    console.log('   1. admin_demo      → Admin completo');
    console.log('   2. expert_demo     → Expert validador');
    console.log('   3. user_standard   → Usuario estándar');
    console.log('   4. power_user      → Usuario avanzado (8 agentes)');
    console.log('   5. new_user        → Usuario nuevo');
    
    console.log('\n💡 PROBAR:');
    console.log('   npm run dev');
    console.log('   Login con cualquiera de los usuarios de arriba');
    
    console.log('\n🔗 VER EN FIRESTORE:');
    console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore');
    
    return true;
  } else {
    console.log('\n⚠️  Algunos usuarios tienen datos incompletos.');
    console.log('   Ejecuta: npm run seed:complete');
    return false;
  }
}

// Ejecutar
verifyAllUsers()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

