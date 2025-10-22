import { firestore } from './src/lib/firestore';

async function testWrite() {
  console.log('🧪 Testing Firestore write permissions...\n');
  
  const testId = 'TEST_WRITE_' + Date.now();
  const testRef = firestore.collection('context_sources').doc(testId);
  
  console.log('1️⃣  Writing test document...');
  await testRef.set({
    name: 'TEST DOCUMENT',
    userId: '114671162830729001607',
    type: 'pdf',
    assignedToAgents: ['CpB6tE5DvjzgHI3FvpU2'],
    addedAt: new Date(),
    labels: ['TEST'],
  });
  
  console.log('✅ Write successful\n');
  
  console.log('2️⃣  Reading back...');
  const doc = await testRef.get();
  const data = doc.data();
  console.log('✅ Read successful:');
  console.log('   name:', data?.name);
  console.log('   assignedToAgents:', data?.assignedToAgents);
  console.log('');
  
  console.log('3️⃣  Cleaning up...');
  await testRef.delete();
  console.log('✅ Test document deleted\n');
  
  console.log('🎉 FIRESTORE WRITE PERMISSIONS: OK');
  process.exit(0);
}

testWrite().catch(err => {
  console.error('❌ FIRESTORE WRITE FAILED:', err.message);
  process.exit(1);
});
