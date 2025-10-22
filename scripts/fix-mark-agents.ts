#!/usr/bin/env tsx

/**
 * Mark Existing Conversations as Agents
 * 
 * This script updates all conversations that don't have the isAgent flag
 * and marks them as agents (isAgent: true).
 * 
 * WHY: The system previously treated all conversations as agents.
 * NOW: We distinguish between:
 * - Agents (isAgent: true) - Templates/configurations
 * - Conversations (isAgent: false, agentId: parentId) - Chat sessions within an agent
 */

import 'dotenv/config';
import { firestore } from '../src/lib/firestore.js';

async function markExistingAsAgents() {
  console.log('🔧 Marcando conversaciones existentes como agentes');
  console.log('=================================================\n');

  try {
    // Get all conversations without isAgent flag
    const allConversations = await firestore
      .collection('conversations')
      .get();

    console.log(`📊 Total conversaciones encontradas: ${allConversations.size}\n`);

    const batch = firestore.batch();
    let toUpdate = 0;
    let alreadyMarked = 0;
    let conversationsFound = 0;

    allConversations.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.isAgent === true) {
        alreadyMarked++;
      } else if (data.isAgent === false && data.agentId) {
        conversationsFound++;
        console.log(`   💬 Conversación ya marcada: ${data.title} (agentId: ${data.agentId})`);
      } else {
        // No flag set - mark as agent
        batch.update(doc.ref, {
          isAgent: true,
          updatedAt: new Date(),
        });
        toUpdate++;
        console.log(`   ✅ Marcando como agente: ${data.title} (id: ${doc.id})`);
      }
    });

    if (toUpdate > 0) {
      console.log(`\n🔄 Actualizando ${toUpdate} conversaciones...`);
      await batch.commit();
      console.log('✅ Actualización completada');
    } else {
      console.log('\n✅ No hay conversaciones para actualizar');
    }

    console.log('\n📊 RESUMEN:');
    console.log(`   Agentes ya marcados: ${alreadyMarked}`);
    console.log(`   Conversaciones existentes: ${conversationsFound}`);
    console.log(`   Actualizados a agentes: ${toUpdate}`);
    console.log(`   Total: ${alreadyMarked + conversationsFound + toUpdate}`);

    console.log('\n✅ Proceso completado');
    console.log('💡 Ahora ejecuta: npm run verify:agents');
    console.log('   Para verificar el resultado\n');

  } catch (error) {
    console.error('❌ Error marcando agentes:', error);
    process.exit(1);
  }

  process.exit(0);
}

markExistingAsAgents();

