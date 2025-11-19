import { firestore } from '../src/lib/firestore';

async function main() {
  const agentId = 'TestApiUpload_S001';
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('\n🔧 Fixing agent structure for:', agentId);
  
  const agentDoc = await firestore.collection('conversations').doc(agentId).get();
  
  if (!agentDoc.exists) {
    console.log('❌ Agent not found!');
    return;
  }
  
  const currentData = agentDoc.data();
  
  console.log('\n📋 Current structure:');
  console.log('   agentName:', currentData?.agentName || 'MISSING ❌');
  console.log('   title:', currentData?.title || 'MISSING ❌');
  console.log('   organizationId:', currentData?.organizationId || 'MISSING ❌');
  console.log('   messageCount:', currentData?.messageCount || 'MISSING ❌');
  
  // Prepare updates to match working agents
  const updates: any = {
    agentName: 'TestApiUpload_S001', // ✅ Add agentName (same as ID for CLI agents)
    title: 'Test Upload Agent (S001)', // ✅ Add friendly title
    organizationId: 'getaifactory.com', // ✅ Add organization
    messageCount: 0, // ✅ Initialize message count
    version: 1, // ✅ Add version
    source: 'cli', // ✅ Indicate this was created via CLI
    updatedAt: new Date(),
  };
  
  // Keep existing fields but ensure critical ones are set
  if (!currentData?.createdAt) {
    updates.createdAt = new Date();
  }
  
  console.log('\n🔄 Applying updates...');
  console.log('   Setting agentName:', updates.agentName);
  console.log('   Setting title:', updates.title);
  console.log('   Setting organizationId:', updates.organizationId);
  console.log('   Setting messageCount:', updates.messageCount);
  console.log('   Setting source:', updates.source);
  
  await firestore.collection('conversations').doc(agentId).update(updates);
  
  console.log('\n✅ Agent structure fixed!');
  
  // Verify
  const verifyDoc = await firestore.collection('conversations').doc(agentId).get();
  const verifyData = verifyDoc.data();
  
  console.log('\n📊 Verification:');
  console.log('   agentName:', verifyData?.agentName, verifyData?.agentName ? '✅' : '❌');
  console.log('   title:', verifyData?.title, verifyData?.title ? '✅' : '❌');
  console.log('   organizationId:', verifyData?.organizationId, verifyData?.organizationId ? '✅' : '❌');
  console.log('   messageCount:', verifyData?.messageCount, verifyData?.messageCount !== undefined ? '✅' : '❌');
  console.log('   activeContextSourceIds:', verifyData?.activeContextSourceIds?.length || 0, 'documents');
  
  console.log('\n💡 Now refresh the UI and check if the agent appears correctly!');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

