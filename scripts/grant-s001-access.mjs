import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function grantAccessToS001() {
  try {
    console.log('🔍 Step 1: Finding GESTION BODEGAS GPT (S001)...\n');
    
    // Find the agent
    const agentsSnapshot = await db.collection('conversations')
      .where('title', '==', 'GESTION BODEGAS GPT (S001)')
      .limit(1)
      .get();
    
    if (agentsSnapshot.empty) {
      console.log('❌ Agent not found');
      process.exit(1);
    }
    
    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    
    console.log(`✅ Agent found: ${agentId}\n`);
    
    // Find the user
    console.log('🔍 Step 2: Finding user hcontrerasp@salfamontajes.com...\n');
    
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'hcontrerasp@salfamontajes.com')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found - they may need to login first');
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✅ User found: ${userId}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Domain: ${userData.email.split('@')[1]}\n`);
    
    // Get existing share
    console.log('🔍 Step 3: Getting existing share document...\n');
    
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .limit(1)
      .get();
    
    if (sharesSnapshot.empty) {
      console.log('❌ No share document found - agent has never been shared');
      process.exit(1);
    }
    
    const shareDoc = sharesSnapshot.docs[0];
    const shareData = shareDoc.data();
    
    console.log(`✅ Share document found: ${shareDoc.id}`);
    console.log(`   Currently shared with: ${shareData.sharedWith.length} users\n`);
    
    // Check if user already has access
    const alreadyHasAccess = shareData.sharedWith.some(target => 
      target.id === userId || 
      target.email?.toLowerCase() === userData.email.toLowerCase()
    );
    
    if (alreadyHasAccess) {
      console.log('ℹ️  User already has access to this agent');
      process.exit(0);
    }
    
    // Add user to sharedWith array
    console.log('📝 Step 4: Adding user to share...\n');
    
    const newTarget = {
      type: 'user',
      id: userId,
      email: userData.email,
      domain: userData.email.split('@')[1]
    };
    
    const updatedSharedWith = [...shareData.sharedWith, newTarget];
    
    // Update the share document
    await shareDoc.ref.update({
      sharedWith: updatedSharedWith,
      updatedAt: new Date()
    });
    
    console.log('✅ Successfully granted access!');
    console.log(`\n📊 Updated share statistics:`);
    console.log(`   - Total users with access: ${updatedSharedWith.length}`);
    console.log(`   - New user: ${userData.name} (${userData.email})`);
    console.log(`   - Access level: USE (Usar agente)`);
    console.log(`\n✨ Done! User can now see and use GESTION BODEGAS GPT (S001)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

grantAccessToS001();


