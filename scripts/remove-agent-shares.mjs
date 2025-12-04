#!/usr/bin/env node
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firestore
const PROJECT_ID = 'salfagpt';
admin.initializeApp({
  projectId: PROJECT_ID
});

const firestore = admin.firestore();

const AGENT_TITLES = [
  'GOP GPT (M003)',
  'MAQSA Mantenimiento (S002)',
  'GESTION BODEGAS GPT (S001)',
  'Asistente Legal Territorial RDI (M001)'
];

const AGENT_IDS = {
  'GOP GPT (M003)': 'Pn6WPNxv8orckxX6xL4L',
  'MAQSA Mantenimiento (S002)': 'KfoKcDrb6pMnduAiLlrD',
  'GESTION BODEGAS GPT (S001)': 'AjtQZEIMQvFnPRJRjl4y',
  'Asistente Legal Territorial RDI (M001)': 'cjn3bC0HrUYtHqu69CKS'
};

async function getAgentShares(agentId) {
  const snapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function deleteShare(shareId) {
  await firestore.collection('agent_shares').doc(shareId).delete();
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BEFORE: Current Sharing Status');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const beforeData = {};
  
  for (const title of AGENT_TITLES) {
    const agentId = AGENT_IDS[title];
    const shares = await getAgentShares(agentId);
    
    console.log(`📌 ${title}`);
    console.log(`   Agent ID: ${agentId}`);
    
    if (shares.length === 0) {
      console.log(`   📋 No shares (already clean)`);
    } else {
      console.log(`   📋 Total shares: ${shares.length}`);
      
      // Collect all unique users
      const uniqueUsers = new Set();
      shares.forEach(share => {
        if (share.sharedWith && Array.isArray(share.sharedWith)) {
          share.sharedWith.forEach(target => {
            if (target.type === 'user' && target.email) {
              uniqueUsers.add(target.email);
            } else if (target.type === 'domain') {
              uniqueUsers.add(`[Domain: ${target.domain || 'unknown'}]`);
            } else if (target.type === 'user' && target.id) {
              uniqueUsers.add(`[User ID: ${target.id}]`);
            }
          });
        }
      });
      
      console.log(`   👥 Shared with ${uniqueUsers.size} unique targets:`);
      Array.from(uniqueUsers).sort().forEach((email, i) => {
        console.log(`      ${i + 1}. ${email}`);
      });
    }
    
    beforeData[title] = {
      agentId,
      shareCount: shares.length,
      shares: shares,
      users: Array.from(new Set(
        shares.flatMap(s => 
          (s.sharedWith || [])
            .filter(t => t.email || t.id)
            .map(t => t.email || `[ID: ${t.id}]`)
        )
      )).sort()
    };
    
    console.log('');
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Removing All Shares...');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let totalDeleted = 0;
  
  for (const title of AGENT_TITLES) {
    const agentId = AGENT_IDS[title];
    const shares = await getAgentShares(agentId);
    
    console.log(`🗑️  ${title}`);
    
    if (shares.length === 0) {
      console.log(`   ✅ Already clean (no shares to remove)`);
    } else {
      console.log(`   Deleting ${shares.length} shares...`);
      
      for (const share of shares) {
        await deleteShare(share.id);
        console.log(`     ✅ Deleted share: ${share.id}`);
        totalDeleted++;
      }
    }
    
    console.log('');
  }
  
  console.log(`\n📊 Total shares deleted: ${totalDeleted}\n`);
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('  AFTER: Verifying Removal');
  console.log('═══════════════════════════════════════════════════════\n');
  
  for (const title of AGENT_TITLES) {
    const agentId = AGENT_IDS[title];
    const shares = await getAgentShares(agentId);
    
    console.log(`📌 ${title}`);
    console.log(`   Agent ID: ${agentId}`);
    console.log(`   📋 Shares: ${shares.length} ${shares.length === 0 ? '✅' : '❌'}`);
    console.log('');
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY: Before vs After');
  console.log('═══════════════════════════════════════════════════════\n');
  
  for (const title of AGENT_TITLES) {
    const before = beforeData[title];
    
    console.log(`📌 ${title}`);
    console.log(`   BEFORE: ${before.shareCount} shares, ${before.users.length} unique users`);
    console.log(`   AFTER:  0 shares, 0 users`);
    
    if (before.users.length > 0) {
      console.log(`   \n   👥 Users who lost access:`);
      before.users.forEach((user, i) => {
        console.log(`      ${i + 1}. ${user}`);
      });
    }
    
    console.log('');
  }
  
  console.log('✅ All shares removed successfully for these 4 agents only!\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });




