import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function getM001Access() {
  try {
    console.log('🔍 Searching for Asistente Legal Territorial RDI (M001)...\n');
    
    // Find the agent
    const agentsSnapshot = await db.collection('conversations')
      .where('title', '==', 'Asistente Legal Territorial RDI (M001)')
      .limit(1)
      .get();
    
    if (agentsSnapshot.empty) {
      console.log('❌ Agent not found');
      process.exit(1);
    }
    
    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    const agentData = agentDoc.data();
    
    console.log(`✅ Agent found: ${agentId}`);
    console.log(`   Owner: ${agentData.userId}\n`);
    
    // Get agent shares
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    if (sharesSnapshot.empty) {
      console.log('❌ No shares found - agent is not shared');
      process.exit(0);
    }
    
    const shareDoc = sharesSnapshot.docs[0];
    const shareData = shareDoc.data();
    
    // Get all users for matching
    const usersSnapshot = await db.collection('users').get();
    const usersMap = new Map();
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      usersMap.set(doc.id, data);
      if (data.email) {
        usersMap.set(data.email.toLowerCase(), data);
      }
    });
    
    console.log(`📊 Total users with access: ${shareData.sharedWith.length}\n`);
    console.log('=== USERS WITH ACCESS ===\n');
    
    // Build access list
    const accessList = [];
    
    shareData.sharedWith.forEach(target => {
      const userData = usersMap.get(target.id) || usersMap.get(target.email?.toLowerCase());
      
      accessList.push({
        email: (target.email || userData?.email || 'N/A').toLowerCase(),
        name: userData?.name || 'N/A',
        domain: target.domain || (userData?.email?.split('@')[1]) || 'N/A',
        role: userData?.role || 'N/A'
      });
    });
    
    // Sort by email
    accessList.sort((a, b) => a.email.localeCompare(b.email));
    
    // Print table
    console.log('Email\t\t\t\tName\t\t\t\t\tDomain\t\tRole');
    console.log('='.repeat(120));
    
    accessList.forEach(user => {
      const emailPad = user.email.padEnd(30);
      const namePad = user.name.padEnd(35);
      const domainPad = user.domain.padEnd(15);
      console.log(`${emailPad}\t${namePad}\t${domainPad}\t${user.role}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

getM001Access();





