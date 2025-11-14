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
  console.error('❌ Usage: node revoke-access.mjs <agentId> <userEmail>');
  process.exit(1);
}

async function revokeAccess() {
  try {
    console.log(`🔐 Revoking access from agent ${agentId} for ${userEmail}\n`);
    
    // Get agent
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    if (!agentDoc.exists) {
      console.log('❌ Agent not found');
      process.exit(1);
    }
    
    const agentData = agentDoc.data();
    console.log(`✅ Agent: ${agentData.title}\n`);
    
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
    
    console.log(`Current users with access: ${shareData.sharedWith.length}`);
    
    // Remove user
    const updatedSharedWith = shareData.sharedWith.filter(target => 
      target.email?.toLowerCase() !== userEmail.toLowerCase()
    );
    
    if (updatedSharedWith.length === shareData.sharedWith.length) {
      console.log('ℹ️  User does not have access (nothing to revoke)');
      process.exit(0);
    }
    
    await shareDoc.ref.update({
      sharedWith: updatedSharedWith,
      updatedAt: new Date()
    });
    
    console.log('✅ Access revoked successfully!');
    console.log(`   Removed: ${userEmail}`);
    console.log(`   Remaining users with access: ${updatedSharedWith.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

revokeAccess();

