/**
 * Reassign Documents to Agent by Name
 * 
 * Finds an agent by its display name and reassigns documents to it
 */

import { firestore } from '../src/lib/firestore';

interface Config {
  agentName: string;      // Display name to search for
  userId: string;         // User ID (hash)
  tag?: string;          // Optional: filter documents by tag
  dryRun?: boolean;      // If true, only show what would be done
}

async function main() {
  const config: Config = {
    agentName: 'TestApiUpload_S001',  // The display name you see in UI
    userId: 'usr_uhwqffaqag1wrryd82tw',
    tag: undefined, // Set to specific tag if you want to filter documents
    dryRun: false, // Set to true to preview without making changes
  };
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Reassign Documents to Agent (by Agent Name)             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Configuration:');
  console.log(`   Agent Name: ${config.agentName}`);
  console.log(`   User ID: ${config.userId}`);
  console.log(`   Tag Filter: ${config.tag || 'None (all documents)'}`);
  console.log(`   Dry Run: ${config.dryRun ? 'YES (preview only)' : 'NO (will make changes)'}`);
  
  // Step 1: Find agent by name
  console.log('\n🔍 STEP 1: Finding agent by name...');
  console.log('═'.repeat(60));
  
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('userId', '==', config.userId)
    .where('isAgent', '==', true)
    .get();
  
  console.log(`   Found ${agentsSnapshot.size} total agents for user`);
  
  let targetAgent: any = null;
  let targetAgentId: string | null = null;
  
  for (const doc of agentsSnapshot.docs) {
    const data = doc.data();
    const displayName = data.name || data.agentName || data.title || '';
    
    if (displayName === config.agentName || 
        data.agentName === config.agentName ||
        data.title === config.agentName) {
      targetAgent = data;
      targetAgentId = doc.id;
      break;
    }
  }
  
  if (!targetAgentId) {
    console.log(`\n❌ ERROR: No agent found with name "${config.agentName}"`);
    console.log('\n📋 Available agents:');
    agentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const displayName = data.name || data.agentName || data.title || 'N/A';
      console.log(`   - "${displayName}" (ID: ${doc.id})`);
    });
    process.exit(1);
  }
  
  console.log(`\n✅ Found agent:`);
  console.log(`   Display Name: ${targetAgent.name || targetAgent.title || 'N/A'}`);
  console.log(`   Agent ID: ${targetAgentId}`);
  console.log(`   Current Active Contexts: ${targetAgent.activeContextSourceIds?.length || 0}`);
  
  // Step 2: Find documents uploaded via CLI
  console.log('\n\n🔍 STEP 2: Finding CLI-uploaded documents...');
  console.log('═'.repeat(60));
  
  let docsQuery = firestore
    .collection('context_sources')
    .where('userId', '==', config.userId)
    .where('metadata.uploadedVia', '==', 'cli');
  
  if (config.tag) {
    docsQuery = docsQuery.where('tags', 'array-contains', config.tag);
  }
  
  const cliDocs = await docsQuery.get();
  
  console.log(`   Found ${cliDocs.size} CLI-uploaded documents`);
  
  if (cliDocs.size === 0) {
    console.log('\n⚠️  No CLI-uploaded documents found. Nothing to reassign.');
    process.exit(0);
  }
  
  console.log('\n📄 Documents to reassign:');
  cliDocs.docs.slice(0, 10).forEach((doc, i) => {
    const data = doc.data();
    const currentAgents = data.assignedToAgents || [];
    console.log(`   ${i + 1}. ${data.name}`);
    console.log(`      Current agents: ${currentAgents.join(', ') || 'NONE'}`);
  });
  
  if (cliDocs.size > 10) {
    console.log(`   ... and ${cliDocs.size - 10} more`);
  }
  
  // Step 3: Reassign documents
  console.log('\n\n🔄 STEP 3: Reassigning documents...');
  console.log('═'.repeat(60));
  
  if (config.dryRun) {
    console.log('   ⚠️  DRY RUN MODE - No changes will be made');
    console.log(`   Would reassign ${cliDocs.size} documents to agent: ${targetAgentId}`);
  } else {
    const batch = firestore.batch();
    let batchCount = 0;
    const maxBatchSize = 500;
    
    for (const doc of cliDocs.docs) {
      const docRef = firestore.collection('context_sources').doc(doc.id);
      batch.update(docRef, {
        assignedToAgents: [targetAgentId],
        updatedAt: new Date(),
      });
      
      batchCount++;
      
      // Commit batch if we hit the limit
      if (batchCount === maxBatchSize) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        batchCount = 0;
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }
    
    console.log(`\n✅ Reassigned ${cliDocs.size} documents to agent: ${targetAgentId}`);
  }
  
  // Step 4: Update agent's activeContextSourceIds
  console.log('\n\n🔗 STEP 4: Updating agent\'s activeContextSourceIds...');
  console.log('═'.repeat(60));
  
  if (config.dryRun) {
    console.log('   ⚠️  DRY RUN MODE - No changes will be made');
    console.log(`   Would update activeContextSourceIds with ${cliDocs.size} document IDs`);
  } else {
    // Get all documents currently assigned to this agent
    const assignedDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', config.userId)
      .where('assignedToAgents', 'array-contains', targetAgentId)
      .get();
    
    const allDocIds = assignedDocs.docs.map(doc => doc.id);
    
    await firestore.collection('conversations').doc(targetAgentId).update({
      activeContextSourceIds: allDocIds,
      updatedAt: new Date(),
    });
    
    console.log(`   ✅ Updated activeContextSourceIds: ${allDocIds.length} documents`);
  }
  
  // Final summary
  console.log('\n\n═'.repeat(60));
  console.log('✅ COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Agent Name: ${config.agentName}`);
  console.log(`   Agent ID: ${targetAgentId}`);
  console.log(`   Documents Reassigned: ${cliDocs.size}`);
  console.log(`   ${config.dryRun ? '⚠️  DRY RUN - No changes made' : '✅ Changes applied'}`);
  
  if (!config.dryRun) {
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Open agent settings for the agent');
    console.log(`   3. You should see ${cliDocs.size} documents`);
  }
  
  console.log('');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

