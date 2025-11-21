import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function grantAccessToM3() {
  try {
    console.log('🔍 Step 1: Finding GOP GPT M3...\n');
    
    // Find the agent
    const agentsSnapshot = await db.collection('conversations')
      .where('title', '==', 'GOP GPT M3')
      .limit(1)
      .get();
    
    if (agentsSnapshot.empty) {
      console.log('❌ Agent not found');
      process.exit(1);
    }
    
    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    
    console.log(`✅ Agent found: ${agentId}\n`);
    
    // Expected users
    const expectedUsers = [
      'mfuenzalidar@novatec.cl',
      'phvaldivia@novatec.cl',
      'yzamora@inoval.cl',
      'jcancinoc@inoval.cl',
      'lurriola@novatec.cl',
      'fcerda@constructorasalfa.cl',
      'gfalvarez@novatec.cl',
      'dortega@novatec.cl',
      'mburgoa@novatec.cl'
    ];
    
    console.log('🔍 Step 2: Finding users in system...\n');
    
    // Get all users
    const allUsersSnapshot = await db.collection('users').get();
    const usersMap = new Map();
    allUsersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        usersMap.set(data.email.toLowerCase(), {
          id: doc.id,
          ...data
        });
      }
    });
    
    // Find which users exist
    const existingUsers = [];
    const missingUsers = [];
    
    for (const email of expectedUsers) {
      const userData = usersMap.get(email.toLowerCase());
      if (userData) {
        existingUsers.push({
          email: email,
          id: userData.id,
          name: userData.name,
          domain: email.split('@')[1]
        });
        console.log(`✅ ${email} - Found (${userData.name})`);
      } else {
        missingUsers.push(email);
        console.log(`⚠️  ${email} - Not found`);
      }
    }
    
    console.log(`\n📊 Found ${existingUsers.length} users, ${missingUsers.length} missing\n`);
    
    if (existingUsers.length === 0) {
      console.log('❌ No users found to grant access');
      process.exit(1);
    }
    
    // Get existing share
    console.log('🔍 Step 3: Getting existing share document...\n');
    
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    let shareDoc, shareData;
    
    if (sharesSnapshot.empty) {
      console.log('⚠️  No share document exists - creating new one...\n');
      
      // Create new share document
      const agentData = agentDoc.data();
      const newShareRef = await db.collection('agent_shares').add({
        agentId: agentId,
        ownerId: agentData.userId,
        sharedWith: [],
        accessLevel: 'use',
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'localhost'
      });
      
      shareDoc = await newShareRef.get();
      shareData = shareDoc.data();
      console.log(`✅ Created share document: ${shareDoc.id}\n`);
    } else {
      shareDoc = sharesSnapshot.docs[0];
      shareData = shareDoc.data();
      console.log(`✅ Share document found: ${shareDoc.id}`);
      console.log(`   Currently shared with: ${shareData.sharedWith.length} users\n`);
    }
    
    // Check which users need to be added
    const usersToAdd = [];
    
    for (const user of existingUsers) {
      const alreadyHasAccess = shareData.sharedWith.some(target => 
        target.id === user.id || 
        target.email?.toLowerCase() === user.email.toLowerCase()
      );
      
      if (!alreadyHasAccess) {
        usersToAdd.push(user);
      }
    }
    
    if (usersToAdd.length === 0) {
      console.log('ℹ️  All existing users already have access');
      console.log(`✅ ${existingUsers.length}/${expectedUsers.length} users have access`);
      if (missingUsers.length > 0) {
        console.log(`⚠️  ${missingUsers.length} users need to be created first`);
      }
      process.exit(0);
    }
    
    console.log(`📝 Step 4: Adding ${usersToAdd.length} user(s) to share...\n`);
    
    // Build new targets
    const newTargets = usersToAdd.map(user => ({
      type: 'user',
      id: user.id,
      email: user.email,
      domain: user.domain
    }));
    
    const updatedSharedWith = [...shareData.sharedWith, ...newTargets];
    
    // Update the share document
    await shareDoc.ref.update({
      sharedWith: updatedSharedWith,
      updatedAt: new Date()
    });
    
    console.log('✅ Successfully granted access to:');
    usersToAdd.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    
    console.log(`\n📊 Updated share statistics:`);
    console.log(`   - Total users with access: ${updatedSharedWith.length}`);
    console.log(`   - Users from your list: ${existingUsers.length}/${expectedUsers.length}`);
    if (missingUsers.length > 0) {
      console.log(`   - Missing users: ${missingUsers.length}`);
    }
    console.log(`\n✨ Done!`);
    
    if (missingUsers.length > 0) {
      console.log(`\n⚠️  These users need to be created first:`);
      missingUsers.forEach(email => console.log(`   - ${email}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

grantAccessToM3();






