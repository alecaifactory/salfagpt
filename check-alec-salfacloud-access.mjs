import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'salfagpt' });
const db = getFirestore(app);

const userEmail = 'alec@salfacloud.cl';

console.log('🔍 Checking access for:', userEmail);
console.log('='.repeat(60));

// 1. Get user
const usersSnapshot = await db.collection('users')
  .where('email', '==', userEmail)
  .get();

if (usersSnapshot.empty) {
  console.log('❌ User not found');
  process.exit(1);
}

const userDoc = usersSnapshot.docs[0];
const userId = userDoc.id;
const userData = userDoc.data();

console.log('\n👤 User found:', {
  id: userId,
  email: userData.email,
  name: userData.name,
  role: userData.role
});

// 2. Find agent shares where this user is included
console.log('\n🔍 Searching agent shares...');
const sharesSnapshot = await db.collection('agent_shares').get();

let sharedAgents = [];

for (const shareDoc of sharesSnapshot.docs) {
  const share = shareDoc.data();
  
  // Check if user is in sharedWith array
  const hasAccess = share.sharedWith?.some(target => 
    target.type === 'user' && 
    (target.id === userId || target.email === userEmail)
  );
  
  if (hasAccess) {
    sharedAgents.push({
      shareId: shareDoc.id,
      agentId: share.agentId,
      accessLevel: share.accessLevel,
      sharedWith: share.sharedWith
    });
  }
}

console.log('\n📋 Shared agents found:', sharedAgents.length);

if (sharedAgents.length === 0) {
  console.log('⚠️ No shared agents found for this user!');
  console.log('💡 This user cannot see any shared documents');
  process.exit(0);
}

// 3. For each shared agent, check assigned documents
console.log('\n📚 Checking documents for each shared agent...\n');

for (const share of sharedAgents) {
  // Get agent details
  const agentDoc = await db.collection('conversations').doc(share.agentId).get();
  
  if (!agentDoc.exists) {
    console.log(`⚠️ Agent not found: ${share.agentId}`);
    continue;
  }
  
  const agent = agentDoc.data();
  
  console.log(`\n🤖 Agent: ${agent.title} (${share.agentId})`);
  console.log(`   Access level: ${share.accessLevel}`);
  
  // Count documents assigned to this agent
  const docsSnapshot = await db.collection('context_sources')
    .where('assignedToAgents', 'array-contains', share.agentId)
    .limit(5)
    .get();
  
  console.log(`   📄 Documents: ${docsSnapshot.size}+ assigned`);
  
  if (docsSnapshot.size > 0) {
    console.log(`   First 5 documents:`);
    docsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`     ${idx + 1}. ${data.name} (${doc.id})`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Analysis complete');
console.log('\nCONCLUSION:');
console.log(`User ${userEmail} has ${sharedAgents.length} shared agents`);
console.log('User SHOULD be able to see documents from those agents');
console.log('\nIf 403 persists, check:');
console.log('1. Hard refresh browser (Cmd+Shift+R)');
console.log('2. Check logs for access verification');
console.log('3. Verify revision 00095-b8f is serving traffic');

process.exit(0);
