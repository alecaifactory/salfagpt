import { firestore } from '../src/lib/firestore';

const emails = ['iojedaa@maqsa.cl', 'vclarke@maqsa.cl', 'salegria@maqsa.cl'];

async function checkUsers() {
  console.log('🔍 Investigating users: iojedaa@maqsa.cl, vclarke@maqsa.cl, salegria@maqsa.cl\n');

  for (const email of emails) {
    console.log('═'.repeat(80));
    console.log(`📧 EMAIL: ${email}`);
    console.log('═'.repeat(80));
    
    try {
      // Find user by email
      const userSnapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (userSnapshot.empty) {
        console.log('❌ USER NOT FOUND IN FIRESTORE');
        console.log('   → User needs to login via OAuth first to be created\n');
        continue;
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      // USER INFO
      console.log('\n👤 USER INFORMATION:');
      console.log('─'.repeat(40));
      console.log(`  Document ID: ${userDoc.id}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Name: ${userData.name || 'N/A'}`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Roles: ${JSON.stringify(userData.roles || [userData.role])}`);
      console.log(`  Company: ${userData.company || 'N/A'}`);
      console.log(`  Department: ${userData.department || 'N/A'}`);
      console.log(`  Active: ${userData.isActive ? '✅ Yes' : '❌ No'}`);
      
      // CREATION INFO
      console.log('\n📅 CREATION & LOGIN HISTORY:');
      console.log('─'.repeat(40));
      
      const createdByOAuth = userData.createdBy === 'oauth-system';
      const createdByAdmin = userData.createdBy && userData.createdBy !== 'oauth-system';
      
      if (createdByOAuth) {
        console.log('  Creation Method: 🔑 OAuth (Auto-created on first login)');
      } else if (createdByAdmin) {
        console.log(`  Creation Method: 👤 Admin (Created by ${userData.createdBy})`);
      } else {
        console.log('  Creation Method: ❓ Unknown');
      }
      
      console.log(`  Created At: ${userData.createdAt || 'N/A'}`);
      console.log(`  Created By: ${userData.createdBy || 'N/A'}`);
      
      if (userData.adminUpdatedBy) {
        console.log(`\n  ⬆️  ADMIN UPGRADE:`);
        console.log(`     Upgraded By: ${userData.adminUpdatedBy}`);
        console.log(`     Upgraded At: ${userData.adminUpdatedAt || 'N/A'}`);
        console.log(`     (OAuth user was upgraded by admin)`);
      }
      
      console.log(`\n  Google OAuth ID: ${userData.googleUserId || 'Not logged in via OAuth yet'}`);
      console.log(`  First Login: ${userData.createdAt || 'N/A'}`);
      console.log(`  Last Login: ${userData.lastLoginAt || 'Never logged in'}`);
      
      // AGENT ASSIGNMENTS
      console.log('\n🤖 AGENT ASSIGNMENTS:');
      console.log('─'.repeat(40));
      
      let foundAssignments = false;
      
      // Check agent_sharing collection
      const sharingSnapshot = await firestore
        .collection('agent_sharing')
        .where('sharedWithEmails', 'array-contains', email)
        .get();
      
      if (!sharingSnapshot.empty) {
        console.log(`  ✅ Found ${sharingSnapshot.size} assignment(s) in agent_sharing:\n`);
        foundAssignments = true;
        
        for (const doc of sharingSnapshot.docs) {
          const data = doc.data();
          console.log(`  📌 Assignment ID: ${doc.id}`);
          console.log(`     Agent ID: ${data.agentId}`);
          console.log(`     Shared By: ${data.sharedBy || 'N/A'}`);
          console.log(`     Permissions: ${JSON.stringify(data.permissions || [])}`);
          console.log(`     Shared At: ${data.sharedAt || 'N/A'}`);
          console.log(`     Status: ${data.status || 'active'}`);
          console.log('');
        }
      }
      
      // Check agent_access collection
      const accessSnapshot = await firestore
        .collection('agent_access')
        .where('userEmail', '==', email)
        .get();
      
      if (!accessSnapshot.empty) {
        console.log(`  ✅ Found ${accessSnapshot.size} record(s) in agent_access:\n`);
        foundAssignments = true;
        
        for (const doc of accessSnapshot.docs) {
          const data = doc.data();
          console.log(`  🔑 Access ID: ${doc.id}`);
          console.log(`     Agent ID: ${data.agentId}`);
          console.log(`     Access Level: ${data.accessLevel || 'N/A'}`);
          console.log(`     Granted By: ${data.grantedBy || 'N/A'}`);
          console.log(`     Granted At: ${data.grantedAt || 'N/A'}`);
          console.log('');
        }
      }
      
      if (!foundAssignments) {
        console.log('  ❌ NO AGENT ASSIGNMENTS FOUND');
        console.log('  → This user has not been assigned any agents yet');
        console.log('  → Admin needs to share agents with this email');
      }
      
      // OWN CONVERSATIONS
      const convsSnapshot = await firestore
        .collection('conversations')
        .where('userId', '==', userDoc.id)
        .get();
      
      console.log('\n💬 OWN CONVERSATIONS:');
      console.log('─'.repeat(40));
      console.log(`  Total Owned: ${convsSnapshot.size}`);
      if (convsSnapshot.size > 0) {
        console.log('  (User has created their own conversations)');
      } else {
        console.log('  (User has not created any conversations yet)');
      }
      
      console.log('\n');
      
    } catch (error: any) {
      console.error(`❌ Error checking ${email}:`, error.message);
      console.log('\n');
    }
  }
}

checkUsers()
  .then(() => {
    console.log('✅ Investigation complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

