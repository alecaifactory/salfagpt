import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function getS2Access() {
  try {
    console.log('🔍 Searching for MAQSA Mantenimiento S2...\n');
    
    // Find the agent
    const agentsSnapshot = await db.collection('conversations')
      .where('title', '==', 'MAQSA Mantenimiento S2')
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
    
    console.log(`📊 Found ${sharesSnapshot.size} share document(s)\n`);
    
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
    
    // Collect all unique users across all share documents
    const allSharedUsers = new Map();
    
    sharesSnapshot.docs.forEach(shareDoc => {
      const shareData = shareDoc.data();
      console.log(`Share Document: ${shareDoc.id}`);
      console.log(`  Users: ${shareData.sharedWith?.length || 0}\n`);
      
      shareData.sharedWith?.forEach(target => {
        const userData = usersMap.get(target.id) || usersMap.get(target.email?.toLowerCase());
        const email = (target.email || userData?.email || 'N/A').toLowerCase();
        
        if (!allSharedUsers.has(email)) {
          allSharedUsers.set(email, {
            email: email,
            name: userData?.name || 'N/A',
            domain: target.domain || (userData?.email?.split('@')[1]) || 'N/A',
            role: userData?.role || 'N/A'
          });
        }
      });
    });
    
    // Convert to array and sort
    const accessList = Array.from(allSharedUsers.values())
      .sort((a, b) => a.email.localeCompare(b.email));
    
    console.log(`📊 Total unique users with access: ${accessList.length}\n`);
    console.log('=== USERS WITH ACCESS ===\n');
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

getS2Access();





