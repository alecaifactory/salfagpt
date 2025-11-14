/**
 * Assign S001-tagged sources to GESTION BODEGAS GPT agent
 * 
 * Fixes the issue where documents exist but aren't assigned to the agent
 * After running this, the agent will have sources and we can benchmark
 */

import { firestore } from '../src/lib/firestore';
import { FieldValue } from 'firebase-admin/firestore';

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const AGENT_ID = 'AjtQZEIMQvFnPRJRjl4y'; // GESTION BODEGAS GPT (S001)
const TAG = 'S001';

async function assignS001Sources() {
  console.log('🔗 Assigning S001 sources to GESTION BODEGAS agent...');
  console.log('=' + '='.repeat(60));
  console.log(`User: ${USER_ID}`);
  console.log(`Agent: ${AGENT_ID} (GESTION BODEGAS GPT)`);
  console.log(`Tag: ${TAG}`);
  console.log('');

  try {
    // 1. Find all sources with S001 tag
    console.log('Step 1: Finding sources with S001 tag...');
    
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', USER_ID)
      .get();
    
    console.log(`  Found ${sourcesSnapshot.size} total sources for user`);
    
    // Filter by tags or labels
    const s001Sources = sourcesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const tags = data.tags || [];
      const labels = data.labels || [];
      const name = data.name || '';
      
      return tags.includes(TAG) || 
             labels.includes(TAG) ||
             name.includes(TAG);
    });
    
    console.log(`  Found ${s001Sources.length} sources with S001 tag`);
    console.log('');
    
    if (s001Sources.length === 0) {
      console.log('❌ No S001 sources found!');
      console.log('   Check if documents are tagged correctly');
      
      // Show sample sources
      console.log('');
      console.log('Sample sources:');
      sourcesSnapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name}`);
        console.log(`    Tags: ${JSON.stringify(data.tags || [])}`);
        console.log(`    Labels: ${JSON.stringify(data.labels || [])}`);
      });
      
      process.exit(1);
    }
    
    // 2. Show what will be assigned
    console.log('Sources to assign:');
    s001Sources.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name}`);
    });
    console.log('');
    
    // 3. Update assignedToAgents field on each source
    console.log('Step 2: Assigning sources to agent...');
    
    const batch = firestore.batch();
    
    for (const doc of s001Sources) {
      const sourceRef = firestore.collection('context_sources').doc(doc.id);
      
      // Add agent ID to assignedToAgents array (arrayUnion prevents duplicates)
      batch.update(sourceRef, {
        assignedToAgents: FieldValue.arrayUnion(AGENT_ID),
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
    
    console.log(`✅ Assigned ${s001Sources.length} sources to agent!`);
    console.log('');
    
    // 4. Verify assignment
    console.log('Step 3: Verifying assignment...');
    
    const verifySnapshot = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', AGENT_ID)
      .where('userId', '==', USER_ID)
      .get();
    
    console.log(`  ✓ Agent now has ${verifySnapshot.size} sources assigned`);
    console.log('');
    
    // 5. Update conversation's activeContextSourceIds
    console.log('Step 4: Updating agent activeContextSourceIds...');
    
    const sourceIds = s001Sources.map(doc => doc.id);
    
    await firestore
      .collection('conversations')
      .doc(AGENT_ID)
      .update({
        activeContextSourceIds: sourceIds,
        updatedAt: new Date(),
      });
    
    console.log(`  ✓ Updated agent with ${sourceIds.length} active source IDs`);
    console.log('');
    
    console.log('🎉 Assignment complete!');
    console.log('');
    console.log('✅ GESTION BODEGAS agent is now ready for benchmarking');
    console.log('');
    console.log('Next: Run benchmark test');
    console.log('  npx tsx scripts/benchmark-green-vs-blue.ts');
    console.log('');
    console.log('Or test in browser:');
    console.log('  http://localhost:3000/chat');
    console.log('  Select: GESTION BODEGAS GPT (S001)');
    console.log('  Ask: "¿Cuál es el procedimiento para inventario?"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Assignment failed!');
    console.error(error);
    process.exit(1);
  }
}

assignS001Sources().catch(console.error);

