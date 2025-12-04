import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'salfagpt' });
const db = getFirestore(app);

// Simular la función userHasAccessToAgent
async function testAccess(userId, agentId, userEmail) {
  console.log('\n🔍 Testing access:', {
    userId,
    agentId: agentId.substring(0, 20) + '...',
    userEmail
  });
  
  // Check ownership
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  if (!agentDoc.exists) {
    console.log('❌ Agent not found');
    return false;
  }
  
  const agent = agentDoc.data();
  if (agent.userId === userId) {
    console.log('✅ User is owner');
    return true;
  }
  
  // Check shares
  const sharesSnapshot = await db.collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  console.log(`   Found ${sharesSnapshot.size} shares`);
  
  for (const shareDoc of sharesSnapshot.docs) {
    const share = shareDoc.data();
    
    const match = share.sharedWith?.some(target => {
      if (target.type === 'user') {
        // ID match
        if (target.id === userId) {
          console.log('   ✅ Match by userId:', userId);
          return true;
        }
        
        // Email match
        if (target.email && userEmail && target.email === userEmail) {
          console.log('   ✅ Match by email:', userEmail);
          return true;
        }
      }
      return false;
    });
    
    if (match) {
      console.log('   ✅ Has access via share');
      return true;
    }
  }
  
  console.log('   ❌ No access found');
  return false;
}

// Test case: alec@salfacloud.cl trying to access GOP GPT
const result = await testAccess(
  'usr_ywg6pg0v3tgbq1817xmo',
  'vStojK73ZKbjNsEnqANJ',
  'alec@salfacloud.cl'
);

console.log('\n' + '='.repeat(60));
console.log('RESULT:', result ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED');
console.log('='.repeat(60));

process.exit(0);
