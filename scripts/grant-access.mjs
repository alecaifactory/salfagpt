import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

const agentId = process.argv[2];
const userEmail = process.argv[3];

if (!agentId || !userEmail) {
  console.error('❌ Usage: node grant-access.mjs <agentId> <userEmail>');
  process.exit(1);
}

async function grantAccess() {
  try {
    console.log(`🔐 Granting access to agent ${agentId} for ${userEmail}\n`);
    
    // Get agent
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    if (!agentDoc.exists) {
      console.log('❌ Agent not found');
      process.exit(1);
    }
    
    const agentData = agentDoc.data();
    console.log(`✅ Agent: ${agentData.title}\n`);
    
    // Find user
    const usersSnapshot = await db.collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found - they may need to login first');
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✅ User: ${userData.name} (${userData.email})\n`);
    
    // Get share document
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .limit(1)
      .get();
    
    if (sharesSnapshot.empty) {
      console.log('❌ No share document found');
      process.exit(1);
    }
    
    const shareDoc = sharesSnapshot.docs[0];
    const shareData = shareDoc.data();
    
    // Check if already has access
    const alreadyHasAccess = shareData.sharedWith.some(target => 
      target.id === userId || 
      target.email?.toLowerCase() === userEmail.toLowerCase()
    );
    
    if (alreadyHasAccess) {
      console.log('ℹ️  User already has access');
      process.exit(0);
    }
    
    // Add user
    const newTarget = {
      type: 'user',
      id: userId,
      email: userData.email,
      domain: userData.email.split('@')[1]
    };
    
    await shareDoc.ref.update({
      sharedWith: [...shareData.sharedWith, newTarget],
      updatedAt: new Date()
    });
    
    console.log('✅ Access granted successfully!');
    console.log(`   Total users with access: ${shareData.sharedWith.length + 1}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

grantAccess();

