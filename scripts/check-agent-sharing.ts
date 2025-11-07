/**
 * Check if agents are properly shared and if users have access
 * 
 * Usage:
 *   npx tsx scripts/check-agent-sharing.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

async function checkAgentSharing() {
  try {
    console.log('🔍 Checking Agent Sharing Configuration\n');

    // Get MAQSA Mantenimiento S2 and GOP GPT M3 agents
    const agentsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('status', '!=', 'archived')
      .get();

    const maqsaAgent = agentsSnapshot.docs.find(doc => 
      doc.data().title?.includes('MAQSA Mantenimiento')
    );
    const gopAgent = agentsSnapshot.docs.find(doc => 
      doc.data().title?.includes('GOP GPT M3')
    );

    if (!maqsaAgent && !gopAgent) {
      console.log('❌ Agents not found');
      process.exit(1);
    }

    const agents = [
      { name: 'MAQSA Mantenimiento S2', doc: maqsaAgent },
      { name: 'GOP GPT M3', doc: gopAgent }
    ].filter(a => a.doc);

    for (const { name, doc } of agents) {
      if (!doc) continue;
      
      const agentData = doc.data();
      console.log(`\n📋 Agent: ${name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Owner userId: ${agentData.userId}`);
      console.log(`   Created: ${agentData.createdAt?.toDate().toISOString()}`);

      // Check if shared
      const sharesSnapshot = await firestore
        .collection(COLLECTIONS.AGENT_SHARES)
        .where('agentId', '==', doc.id)
        .get();

      console.log(`\n   Shares: ${sharesSnapshot.size}`);
      
      if (sharesSnapshot.size > 0) {
        sharesSnapshot.docs.forEach((shareDoc, index) => {
          const shareData = shareDoc.data();
          console.log(`\n   Share ${index + 1}:`);
          console.log(`     Shared with: ${shareData.sharedWithType} ${shareData.sharedWithId}`);
          console.log(`     Access level: ${shareData.accessLevel}`);
          console.log(`     Active: ${shareData.isActive}`);
          console.log(`     Created: ${shareData.createdAt?.toDate().toISOString()}`);
        });
      } else {
        console.log('     ❌ No shares found - Agent is PRIVATE to owner only');
        console.log('     → Non-admin users cannot access this agent\'s context');
      }

      // Check context sources assigned to this agent
      const sourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('assignedToAgents', 'array-contains', doc.id)
        .get();

      console.log(`\n   Context Sources: ${sourcesSnapshot.size}`);
      
      sourcesSnapshot.docs.forEach((sourceDoc, index) => {
        const sourceData = sourceDoc.data();
        console.log(`     ${index + 1}. ${sourceData.name}`);
        console.log(`        Owner: ${sourceData.userId}`);
        console.log(`        Type: ${sourceData.type}`);
        console.log(`        Status: ${sourceData.status}`);
      });

      // Check if sources are indexed (have chunks in BigQuery)
      console.log(`\n   Checking if sources are indexed...`);
      // Note: Would need BigQuery client to check this
      console.log(`     (Run check-bigquery-chunks.ts to verify indexing)`);
    }

    console.log('\n\n📊 Summary:');
    console.log('If agents have:');
    console.log('  ✅ Shares → Non-admin users can access');
    console.log('  ❌ No shares → Only owner can access context');
    console.log('\nIf sources have:');
    console.log('  ✅ Chunks in BigQuery → RAG will work');
    console.log('  ❌ No chunks → RAG will return no results → No references');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAgentSharing();

