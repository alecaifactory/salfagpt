import { firestore } from '../src/lib/firestore.js';

const emails = ['iojedaa@maqsa.cl', 'vclarke@maqsa.cl', 'salegria@maqsa.cl'];

async function checkUsers() {
  console.log('🔍 Investigating users...\n');

  for (const email of emails) {
    console.log('═'.repeat(80));
    console.log('📧 Email:', email);
    console.log('═'.repeat(80));
    
    try {
      // Find user by email
      const userSnapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (userSnapshot.empty) {
        console.log('❌ USER NOT FOUND IN FIRESTORE\n');
        continue;
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('\n👤 USER INFORMATION:');
      console.log('  ID:', userDoc.id);
      console.log('  Email:', userData.email);
      console.log('  Name:', userData.name || 'N/A');
      console.log('  Role:', userData.role);
      console.log('  Roles:', userData.roles || [userData.role]);
      console.log('  Company:', userData.company || 'N/A');
      console.log('  Department:', userData.department || 'N/A');
      console.log('  Active:', userData.isActive);
      
      console.log('\n📅 CREATION & LOGIN INFO:');
      console.log('  Created By:', userData.createdBy || 'N/A');
      console.log('  Created At:', userData.createdAt || 'N/A');
      console.log('  Admin Updated By:', userData.adminUpdatedBy || 'N/A');
      console.log('  Admin Updated At:', userData.adminUpdatedAt || 'N/A');
      console.log('  Google OAuth ID:', userData.googleUserId || 'N/A');
      console.log('  Last Login:', userData.lastLoginAt || 'N/A');
      
      // Determine creation method
      const creationMethod = userData.createdBy === 'oauth-system' 
        ? '🔑 OAuth (Auto-created on first login)'
        : userData.createdBy 
          ? `👤 Admin (Created by ${userData.createdBy})`
          : '❓ Unknown';
      console.log('  Creation Method:', creationMethod);
      
      if (userData.adminUpdatedBy) {
        console.log('  ⬆️  Upgraded:', `Admin ${userData.adminUpdatedBy} upgraded this OAuth user`);
      }
      
      // Check agent assignments - Method 1: agent_sharing
      console.log('\n🤖 AGENT ASSIGNMENTS:');
      
      const sharingSnapshot = await firestore
        .collection('agent_sharing')
        .where('sharedWithEmails', 'array-contains', email)
        .get();
      
      if (!sharingSnapshot.empty) {
        console.log('  ✅ Found in agent_sharing collection:', sharingSnapshot.size, 'assignments');
        for (const doc of sharingSnapshot.docs) {
          const data = doc.data();
          console.log('\n  📌 Assignment', doc.id);
          console.log('    Agent ID:', data.agentId);
          console.log('    Shared By:', data.sharedBy || 'N/A');
          console.log('    Permissions:', data.permissions || []);
          console.log('    Shared At:', data.sharedAt || 'N/A');
          console.log('    Status:', data.status || 'active');
        }
      } else {
        console.log('  ❌ No assignments found in agent_sharing collection');
      }
      
      // Check agent_access collection
      const accessSnapshot = await firestore
        .collection('agent_access')
        .where('userEmail', '==', email)
        .get();
      
      if (!accessSnapshot.empty) {
        console.log('\n  ✅ Found in agent_access collection:', accessSnapshot.size, 'records');
        for (const doc of accessSnapshot.docs) {
          const data = doc.data();
          console.log('\n  🔑 Access', doc.id);
          console.log('    Agent ID:', data.agentId);
          console.log('    Access Level:', data.accessLevel || 'N/A');
          console.log('    Granted By:', data.grantedBy || 'N/A');
          console.log('    Granted At:', data.grantedAt || 'N/A');
        }
      }
      
      // Check conversations owned by user
      const convsSnapshot = await firestore
        .collection('conversations')
        .where('userId', '==', userDoc.id)
        .get();
      
      console.log('\n💬 OWN CONVERSATIONS:');
      console.log('  Total Owned:', convsSnapshot.size);
      if (convsSnapshot.size > 0) {
        console.log('  (User has created their own conversations)');
      }
      
      // Check for sharedAccess field on conversations
      try {
        const sharedConvsSnapshot = await firestore
          .collection('conversations')
          .where('sharedAccess.emails', 'array-contains', email)
          .get();
        
        if (!sharedConvsSnapshot.empty) {
          console.log('\n  ✅ Shared conversations:', sharedConvsSnapshot.size);
          for (const doc of sharedConvsSnapshot.docs) {
            const data = doc.data();
            console.log('    - Conv ID:', doc.id);
            console.log('      Title:', data.title || 'Untitled');
            console.log('      Owner:', data.userId);
          }
        }
      } catch (err) {
        // Index might not exist, skip
      }
      
      console.log('\n');
    } catch (error) {
      console.error('Error checking user:', email, error.message);
      console.log('\n');
    }
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
