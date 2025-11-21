#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function shareS1v2WithAlec() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw';
  const sharedWithUserId = 'usr_ywg6pg0v3tgbq1817xmo';
  const sharedWithEmail = 'alec@getaifactory.com';
  
  console.log('🤝 Sharing S1-v2 with alec@getaifactory.com...\n');
  
  try {
    // Create agent_sharing record
    const sharingRef = db.collection('agent_sharing').doc();
    
    await sharingRef.set({
      agentId,
      sharedBy: ownerUserId,
      shareType: 'user', // Direct user share
      sharedWith: [
        {
          userId: sharedWithUserId,
          email: sharedWithEmail,
          addedAt: new Date()
        }
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Sharing record created: ${sharingRef.id}`);
    console.log(`   Agent: S1-v2 (${agentId})`);
    console.log(`   Shared with: ${sharedWithEmail}`);
    console.log('\n🎉 Done! Refresh the browser and S1-v2 should appear in the agents list.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

shareS1v2WithAlec();

