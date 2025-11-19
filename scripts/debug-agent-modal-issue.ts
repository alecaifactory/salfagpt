import { firestore } from '../src/lib/firestore';

async function main() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentIdFromUI = 'rzEqb17ZwSjk99bZHbTv'; // From the logs
  const agentIdWeFixed = 'TestApiUpload_S001'; // What we've been fixing
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           DEBUG: Agent Modal Document Loading Issue         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Check the agent from UI
  console.log('🔍 AGENT FROM UI (rzEqb17ZwSjk99bZHbTv):');
  console.log('═'.repeat(60));
  const uiAgent = await firestore.collection('conversations').doc(agentIdFromUI).get();
  if (uiAgent.exists) {
    const data = uiAgent.data();
    console.log('✅ Agent exists');
    console.log('   Name:', data?.name || data?.agentName || data?.title || 'N/A');
    console.log('   agentName:', data?.agentName || 'MISSING');
    console.log('   title:', data?.title || 'MISSING');
    console.log('   userId:', data?.userId);
    console.log('   organizationId:', data?.organizationId || 'MISSING');
    console.log('   activeContextSourceIds:', data?.activeContextSourceIds?.length || 0);
    
    // Count documents
    const docs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('assignedToAgents', 'array-contains', agentIdFromUI)
      .get();
    console.log('   Documents in DB:', docs.size);
    
    if (docs.size > 0 && data?.activeContextSourceIds?.length === 0) {
      console.log('\n❌ PROBLEM FOUND:');
      console.log('   - Documents exist in DB:', docs.size);
      console.log('   - But activeContextSourceIds is empty!');
      console.log('   - This agent needs activeContextSourceIds sync');
    }
  } else {
    console.log('❌ Agent does not exist!');
  }
  
  // Check the agent we fixed
  console.log('\n\n🔧 AGENT WE FIXED (TestApiUpload_S001):');
  console.log('═'.repeat(60));
  const fixedAgent = await firestore.collection('conversations').doc(agentIdWeFixed).get();
  if (fixedAgent.exists) {
    const data = fixedAgent.data();
    console.log('✅ Agent exists');
    console.log('   Name:', data?.name || data?.agentName || data?.title || 'N/A');
    console.log('   agentName:', data?.agentName || 'MISSING');
    console.log('   title:', data?.title || 'MISSING');
    console.log('   userId:', data?.userId);
    console.log('   organizationId:', data?.organizationId || 'MISSING');
    console.log('   activeContextSourceIds:', data?.activeContextSourceIds?.length || 0);
    
    // Count documents
    const docs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('assignedToAgents', 'array-contains', agentIdWeFixed)
      .get();
    console.log('   Documents in DB:', docs.size);
  } else {
    console.log('❌ Agent does not exist!');
  }
  
  console.log('\n\n💡 DIAGNOSIS:');
  console.log('═'.repeat(60));
  if (agentIdFromUI === agentIdWeFixed) {
    console.log('✅ These are the SAME agent');
  } else {
    console.log('⚠️  These are DIFFERENT agents!');
    console.log('   The UI is showing:', agentIdFromUI);
    console.log('   We fixed:', agentIdWeFixed);
    console.log('\n🔧 Solution: Run fix script for the CORRECT agent ID');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

