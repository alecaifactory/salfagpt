/**
 * Verify that all agents with context sources can generate references
 * for both admin and non-admin users
 * 
 * Usage:
 *   npx tsx scripts/verify-all-agents-references.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import { searchByAgent } from '../src/lib/bigquery-agent-search';

const ADMIN_USER_ID = '114671162830729001607'; // alec@getaifactory.com
const NON_ADMIN_USER_ID = '116745562509015715931'; // alecdickinson@gmail.com

const TEST_QUERIES = [
  '¿Cómo funciona este procedimiento?',
  '¿Cuáles son los pasos a seguir?',
  '¿Qué dice el documento sobre este tema?',
];

async function verifyAllAgents() {
  try {
    console.log('🔍 Verifying References for All Agents\n');
    console.log('This will test if RAG search works for both admin and non-admin users\n');

    // Get all active agents (not archived)
    const agentsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('isAgent', '==', true)
      .where('status', '!=', 'archived')
      .get();

    console.log(`Found ${agentsSnapshot.size} active agents\n`);

    const results: Array<{
      agent: string;
      agentId: string;
      owner: string;
      sources: number;
      adminCanSearch: boolean;
      nonAdminCanSearch: boolean;
    }> = [];

    for (const agentDoc of agentsSnapshot.docs) {
      const agentData = agentDoc.data();
      const agentId = agentDoc.id;
      const agentTitle = agentData.title || 'Untitled';
      const agentOwner = agentData.userId;

      console.log(`\n📋 Testing: ${agentTitle}`);
      console.log(`   ID: ${agentId}`);
      console.log(`   Owner: ${agentOwner}`);

      // Check how many sources are assigned to this agent
      const sourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('assignedToAgents', 'array-contains', agentId)
        .get();

      const sourceCount = sourcesSnapshot.size;
      console.log(`   Context Sources: ${sourceCount}`);

      if (sourceCount === 0) {
        console.log('   ⏭️  Skipping (no context sources)');
        results.push({
          agent: agentTitle,
          agentId,
          owner: agentOwner,
          sources: 0,
          adminCanSearch: false,
          nonAdminCanSearch: false,
        });
        continue;
      }

      // Test with admin user
      console.log('\n   Testing as ADMIN user...');
      let adminResults = [];
      try {
        adminResults = await searchByAgent(
          ADMIN_USER_ID,
          agentId,
          TEST_QUERIES[0],
          { topK: 5, minSimilarity: 0.5 }
        );
        console.log(`   ✅ Admin: ${adminResults.length} chunks found`);
      } catch (error) {
        console.log(`   ❌ Admin: Search failed -`, error instanceof Error ? error.message : error);
      }

      // Test with non-admin user
      console.log('\n   Testing as NON-ADMIN user...');
      let nonAdminResults = [];
      try {
        nonAdminResults = await searchByAgent(
          NON_ADMIN_USER_ID,
          agentId,
          TEST_QUERIES[0],
          { topK: 5, minSimilarity: 0.5 }
        );
        console.log(`   ✅ Non-admin: ${nonAdminResults.length} chunks found`);
      } catch (error) {
        console.log(`   ❌ Non-admin: Search failed -`, error instanceof Error ? error.message : error);
      }

      results.push({
        agent: agentTitle,
        agentId,
        owner: agentOwner,
        sources: sourceCount,
        adminCanSearch: adminResults.length > 0,
        nonAdminCanSearch: nonAdminResults.length > 0,
      });
    }

    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80) + '\n');

    const withSources = results.filter(r => r.sources > 0);
    const adminWorking = withSources.filter(r => r.adminCanSearch).length;
    const nonAdminWorking = withSources.filter(r => r.nonAdminCanSearch).length;

    console.log(`Total agents: ${results.length}`);
    console.log(`With context sources: ${withSources.length}`);
    console.log(`Admin can search: ${adminWorking}/${withSources.length}`);
    console.log(`Non-admin can search: ${nonAdminWorking}/${withSources.length}`);

    console.log('\n📋 Details:\n');
    console.log('Agent'.padEnd(40) + ' Sources  Admin  Non-Admin');
    console.log('-'.repeat(80));

    results.forEach(r => {
      const name = r.agent.substring(0, 37).padEnd(40);
      const sources = r.sources.toString().padStart(7);
      const admin = r.adminCanSearch ? '  ✅   ' : '  ❌   ';
      const nonAdmin = r.nonAdminCanSearch ? '    ✅     ' : '    ❌     ';
      
      console.log(name + sources + admin + nonAdmin);
    });

    // Final verdict
    console.log('\n' + '='.repeat(80));
    if (nonAdminWorking === withSources.length && withSources.length > 0) {
      console.log('✅ SUCCESS: All agents with sources work for both admin and non-admin users!');
    } else if (nonAdminWorking > 0) {
      console.log('⚠️  PARTIAL: Some agents work for non-admin users');
      console.log(`   ${nonAdminWorking}/${withSources.length} agents working`);
    } else {
      console.log('❌ FAILED: Non-admin users cannot get references from any agent');
      console.log('   The fix may not be working correctly');
    }
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAllAgents();

