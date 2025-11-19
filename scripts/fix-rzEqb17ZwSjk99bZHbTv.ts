import { firestore } from '../src/lib/firestore';

async function main() {
  const agentId = 'rzEqb17ZwSjk99bZHbTv';
  
  console.log('\n🔧 Fixing agent structure for:', agentId);
  
  await firestore.collection('conversations').doc(agentId).update({
    agentName: agentId,
    organizationId: 'getaifactory.com',
    messageCount: 0,
    version: 1,
    source: 'cli',
    updatedAt: new Date(),
  });
  
  console.log('✅ Agent structure fixed!');
  console.log('\n📊 Updated fields:');
  console.log('   agentName:', agentId);
  console.log('   organizationId: getaifactory.com');
  console.log('   messageCount: 0');
  console.log('   version: 1');
  console.log('   source: cli');
  console.log('\n💡 Refresh the browser now!');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

