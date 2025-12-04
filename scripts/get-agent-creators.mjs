import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_TITLES = [
  'Asistente Legal Territorial RDI (M1-v2)',
  'GOP GPT (M3-v2)',
  'Gestion Bodegas (S1-v2)',
  'Maqsa Mantenimiento (S2-v2)'
];

async function getAgentCreators() {
  console.log('🔍 Finding Agent Creators and Sharing Details\n');
  console.log('='.repeat(80));
  
  // Get users first
  const usersSnap = await firestore.collection('users').get();
  const users = new Map();
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    users.set(doc.id, {
      email: data.email || 'Unknown',
      name: data.name || 'Unknown',
      role: data.role || 'user'
    });
  });
  
  console.log(`👥 Total users in database: ${users.size}\n`);
  
  // For each agent title
  for (const title of AGENT_TITLES) {
    console.log(`\n🤖 Agent: ${title}`);
    console.log('-'.repeat(80));
    
    const conversationsSnap = await firestore
      .collection('conversations')
      .where('title', '==', title)
      .get();
    
    if (conversationsSnap.empty) {
      console.log(`   ❌ NOT FOUND in database\n`);
      continue;
    }
    
    conversationsSnap.docs.forEach((doc, idx) => {
      const data = doc.data();
      const creator = users.get(data.userId);
      const domain = creator?.email ? creator.email.split('@')[1] : 'unknown';
      
      console.log(`\n   Instance #${idx + 1} (ID: ${doc.id.substring(0, 8)}...)`);
      console.log(`   📍 Created by: ${creator?.name || 'Unknown'} (${creator?.email || 'Unknown'})`);
      console.log(`   🌐 Domain: ${domain}`);
      console.log(`   👤 Role: ${creator?.role || 'unknown'}`);
      console.log(`   📅 Created: ${data.createdAt?.toDate().toLocaleDateString() || 'Unknown'}`);
      
      const sharedWith = data.sharedWith || [];
      
      if (sharedWith.length === 0) {
        console.log(`   🔒 Sharing: Private (no sharing)`);
      } else {
        console.log(`   🔓 Sharing: ${sharedWith.length} share(s)`);
        sharedWith.forEach((share, shareIdx) => {
          console.log(`      ${shareIdx + 1}. Type: ${share.type}, Target: ${share.email || share.domain || share.id}`);
        });
        
        // Count total users with access
        let totalUsers = 1; // Creator
        sharedWith.forEach(share => {
          if (share.type === 'user') {
            totalUsers++;
          } else if (share.type === 'domain') {
            // Count users in that domain
            const domainUsers = Array.from(users.values()).filter(u => 
              u.email.endsWith('@' + (share.domain || share.id))
            );
            totalUsers += domainUsers.length;
          }
        });
        
        console.log(`   👥 Total users with access: ${totalUsers}`);
      }
    });
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY\n');
  console.log('='.repeat(80));
  console.log('Agent\t\t\t\t\tInstances\tStatus');
  console.log('-'.repeat(80));
  
  for (const title of AGENT_TITLES) {
    const snap = await firestore.collection('conversations').where('title', '==', title).get();
    const status = snap.empty ? '❌ MISSING' : '✅ Found';
    console.log(`${title.padEnd(40)}\t${snap.size}\t${status}`);
  }
  
  process.exit(0);
}

getAgentCreators().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});



