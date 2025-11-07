/**
 * Test script to verify references fix for non-admin users
 * 
 * This script simulates what happens when a non-admin user sends a message
 * to an agent owned by an admin user.
 * 
 * Usage:
 *   npx tsx scripts/test-references-fix.ts
 */

import { searchByAgent } from '../src/lib/bigquery-agent-search';

async function testReferencesFix() {
  console.log('🧪 Testing References Fix for Non-Admin Users\n');

  // Simulate non-admin user sending message to MAQSA Mantenimiento S2
  const nonAdminUserId = '116745562509015715931'; // alecdickinson@gmail.com
  const adminUserId = '114671162830729001607'; // alec@getaifactory.com
  
  // Find MAQSA agent
  const { firestore, COLLECTIONS } = await import('../src/lib/firestore');
  const agentsSnapshot = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .get();

  const maqsaAgent = agentsSnapshot.docs.find(doc => 
    doc.data().title?.includes('MAQSA Mantenimiento')
  );

  if (!maqsaAgent) {
    console.log('❌ MAQSA Mantenimiento agent not found');
    console.log('\nAvailable agents:');
    agentsSnapshot.docs.slice(0, 10).forEach(doc => {
      console.log(`  - ${doc.data().title} (${doc.id})`);
    });
    process.exit(1);
  }

  const agentId = maqsaAgent.id;
  const agentTitle = maqsaAgent.data().title;
  const agentOwner = maqsaAgent.data().userId;

  console.log('📋 Test Configuration:');
  console.log(`  Agent: ${agentTitle}`);
  console.log(`  Agent ID: ${agentId}`);
  console.log(`  Agent Owner: ${agentOwner}`);
  console.log(`  Current User: ${nonAdminUserId}`);
  console.log('');

  // Test query
  const testQuery = '¿Cómo cambio el filtro de aire de un motor Cummins 6bt5.9?';

  console.log('🔍 Simulating RAG search as non-admin user...');
  console.log(`  Query: "${testQuery}"`);
  console.log('');

  try {
    const results = await searchByAgent(
      nonAdminUserId, // Non-admin user
      agentId, // MAQSA agent (owned by admin)
      testQuery,
      {
        topK: 8,
        minSimilarity: 0.6
      }
    );

    console.log('\n📊 Results:');
    console.log(`  Chunks found: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n  ✅ SUCCESS! References will be generated for non-admin user');
      console.log('\n  Top results:');
      results.slice(0, 3).forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.source_name}`);
        console.log(`       Chunk ${r.chunk_index} - Similarity: ${(r.similarity * 100).toFixed(1)}%`);
        console.log(`       Preview: ${r.text.substring(0, 100)}...`);
      });
    } else {
      console.log('\n  ❌ FAILED: No chunks found - references will NOT be generated');
      console.log('\n  Possible causes:');
      console.log('    1. Agent has no context sources assigned');
      console.log('    2. Context sources are not indexed (no chunks in BigQuery/Firestore)');
      console.log('    3. Query doesn\'t match any content (too low similarity)');
      console.log('\n  Run these diagnostics:');
      console.log('    npx tsx scripts/check-agent-sharing.ts');
      console.log('    npx tsx scripts/check-message-references.ts');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during search:', error);
    console.error('\nThis indicates a problem with the fix or the environment.');
    process.exit(1);
  }
}

testReferencesFix();

