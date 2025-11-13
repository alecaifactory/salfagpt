/**
 * Check if assignedToAgents migration worked
 */
import { firestore } from '../src/lib/firestore';

async function checkMigration() {
  try {
    // Check GOP GPT M3 agent
    const agentDoc = await firestore.collection('conversations').doc('5aNwSMgff2BRKrrVRypF').get();
    const agentData = agentDoc.data();

    console.log('📊 GOP GPT M3 Agent:');
    console.log('  activeContextSourceIds:', agentData?.activeContextSourceIds?.length || 0);
    console.log('  First 5 IDs:', agentData?.activeContextSourceIds?.slice(0, 5));

    // Check one of those sources
    if (agentData?.activeContextSourceIds && agentData.activeContextSourceIds.length > 0) {
      const sourceId = agentData.activeContextSourceIds[0];
      const sourceDoc = await firestore.collection('context_sources').doc(sourceId).get();
      const sourceData = sourceDoc.data();
      
      console.log('\n📄 First Source:', sourceId);
      console.log('  name:', sourceData?.name);
      console.log('  assignedToAgents:', sourceData?.assignedToAgents || 'MISSING ❌');
      console.log('  assignedToAgents length:', sourceData?.assignedToAgents?.length || 0);
      console.log('  Contains 5aNwSMgff2BRKrrVRypF?', sourceData?.assignedToAgents?.includes('5aNwSMgff2BRKrrVRypF') ? 'YES ✅' : 'NO ❌');
      
      // Check all sources
      console.log('\n🔍 Checking all 28 sources...');
      let withField = 0;
      let withoutField = 0;
      let withAgent = 0;
      
      for (const srcId of agentData.activeContextSourceIds.slice(0, 28)) {
        const srcDoc = await firestore.collection('context_sources').doc(srcId).get();
        const srcData = srcDoc.data();
        
        if (srcData?.assignedToAgents) {
          withField++;
          if (srcData.assignedToAgents.includes('5aNwSMgff2BRKrrVRypF')) {
            withAgent++;
          }
        } else {
          withoutField++;
        }
      }
      
      console.log(`\n📊 Results:`);
      console.log(`  ✅ With assignedToAgents field: ${withField}`);
      console.log(`  ❌ Without field: ${withoutField}`);
      console.log(`  ✅ Contains agent ID: ${withAgent}`);
      console.log(`  ❌ Missing agent ID: ${withField - withAgent}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMigration();

