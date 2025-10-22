#!/usr/bin/env tsx

/**
 * Verify Agents vs Conversations
 * 
 * This script checks the current state of conversations in Firestore
 * and shows which ones are agents vs regular conversations.
 */

import 'dotenv/config';
import { firestore } from '../src/lib/firestore.js';

async function verifyAgents() {
  console.log('🔍 Verificando Agentes vs Conversaciones');
  console.log('==========================================\n');

  try {
    // Get all conversations
    const allConversations = await firestore
      .collection('conversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();

    console.log(`📊 Total conversaciones: ${allConversations.size}\n`);

    // Group by isAgent flag
    const agents: any[] = [];
    const conversations: any[] = [];
    const unmarked: any[] = [];

    allConversations.docs.forEach(doc => {
      const data = doc.data();
      const item = {
        id: doc.id,
        title: data.title,
        userId: data.userId,
        isAgent: data.isAgent,
        agentId: data.agentId,
        messageCount: data.messageCount || 0,
        lastMessageAt: data.lastMessageAt?.toDate(),
      };

      if (data.isAgent === true) {
        agents.push(item);
      } else if (data.isAgent === false) {
        conversations.push(item);
      } else {
        unmarked.push(item);
      }
    });

    console.log('✅ AGENTES (isAgent: true):', agents.length);
    agents.slice(0, 5).forEach(a => {
      console.log(`   - ${a.title} (${a.messageCount} msgs, id: ${a.id})`);
    });
    if (agents.length > 5) {
      console.log(`   ... y ${agents.length - 5} más`);
    }

    console.log('\n💬 CONVERSACIONES (isAgent: false):', conversations.length);
    conversations.slice(0, 5).forEach(c => {
      console.log(`   - ${c.title} (agentId: ${c.agentId || 'N/A'}, ${c.messageCount} msgs)`);
    });
    if (conversations.length > 5) {
      console.log(`   ... y ${conversations.length - 5} más`);
    }

    console.log('\n⚠️  SIN MARCAR (isAgent: undefined):', unmarked.length);
    unmarked.slice(0, 10).forEach(u => {
      console.log(`   - ${u.title} (${u.messageCount} msgs, id: ${u.id})`);
    });
    if (unmarked.length > 10) {
      console.log(`   ... y ${unmarked.length - 10} más`);
    }

    console.log('\n📋 RESUMEN:');
    console.log(`   Agentes: ${agents.length}`);
    console.log(`   Conversaciones: ${conversations.length}`);
    console.log(`   Sin marcar: ${unmarked.length}`);
    console.log(`   Total: ${agents.length + conversations.length + unmarked.length}`);

    if (unmarked.length > 0) {
      console.log('\n💡 RECOMENDACIÓN:');
      console.log('   Ejecuta: npm run fix:mark-agents');
      console.log('   Para marcar todas las conversaciones sin flag como agentes');
    }

  } catch (error) {
    console.error('❌ Error verificando agentes:', error);
    process.exit(1);
  }

  process.exit(0);
}

verifyAgents();

