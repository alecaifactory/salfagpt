#!/usr/bin/env node
/**
 * Setup Complete Agent Access
 * 
 * This script:
 * 1. Creates missing users
 * 2. Shares agents with expected users
 * 3. Verifies access for all users
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

// Missing users to create
const MISSING_USERS = [
  {
    email: 'afmanriquez@iaconcagua.com',
    name: 'ALVARO FELIPE MANRIQUEZ JIMENEZ',
    company: 'iaconcagua',
    role: 'expert',
    domain: 'iaconcagua.com'
  },
  {
    email: 'cquijadam@iaconcagua.com',
    name: 'CHRISTIAN QUIJADA MARTINEZ',
    company: 'iaconcagua',
    role: 'expert',
    domain: 'iaconcagua.com'
  },
  {
    email: 'jmancilla@iaconcagua.com',
    name: 'JOSE LUIS MANCILLA COFRE',
    company: 'iaconcagua',
    role: 'expert',
    domain: 'iaconcagua.com'
  },
  {
    email: 'recontreras@iaconcagua.com',
    name: 'RAFAEL ESTEBAN CONTRERAS',
    company: 'iaconcagua',
    role: 'expert',
    domain: 'iaconcagua.com'
  }
];

// Agent sharing configuration
const AGENT_SHARING = {
  'Asistente Legal Territorial RDI (M1-v2)': [
    'jriverof@iaconcagua.com',
    'afmanriquez@iaconcagua.com',
    'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com',
    'jmancilla@iaconcagua.com',
    'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com',
    'dundurraga@iaconcagua.com',
    'rfuentesm@inoval.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@salfacloud.cl'
  ],
  'GOP GPT (M3-v2)': [
    'mfuenzalidar@novatec.cl',
    'phvaldivia@novatec.cl',
    'yzamora@inoval.cl',
    'jcancinoc@inoval.cl',
    'lurriola@novatec.cl',
    'fcerda@constructorasalfa.cl',
    'gfalvarez@novatec.cl',
    'dortega@novatec.cl',
    'mburgoa@novatec.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@salfacloud.cl'
  ],
  'Gestion Bodegas (S1-v2)': [
    'abhernandez@maqsa.cl',
    'cvillalon@maqsa.cl',
    'hcontrerasp@salfamontajes.com',
    'iojedaa@maqsa.cl',
    'jefarias@maqsa.cl',
    'msgarcia@maqsa.cl',
    'ojrodriguez@maqsa.cl',
    'paovalle@maqsa.cl',
    'salegria@maqsa.cl',
    'vaaravena@maqsa.cl',
    'vclarke@maqsa.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@salfacloud.cl'
  ],
  'Maqsa Mantenimiento (S2-v2)': [
    'svillegas@maqsa.cl',
    'csolis@maqsa.cl',
    'fmelin@maqsa.cl',
    'riprado@maqsa.cl',
    'jcalfin@maqsa.cl',
    'mmichael@maqsa.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@salfacloud.cl'
  ]
};

async function setupCompleteAccess() {
  console.log('🚀 Setting Up Complete Agent Access\n');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Create missing users
    console.log('\n📝 Step 1: Creating Missing Users\n');
    
    for (const userData of MISSING_USERS) {
      console.log(`Creating user: ${userData.email}...`);
      
      // Check if user already exists
      const existingUser = await firestore
        .collection('users')
        .where('email', '==', userData.email)
        .limit(1)
        .get();
      
      if (!existingUser.empty) {
        console.log(`   ⚠️  User already exists, skipping`);
        continue;
      }
      
      // Create user document
      const userId = userData.email.replace(/[@.]/g, '_');
      await firestore.collection('users').doc(userId).set({
        id: userId,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        role: userData.role,
        domainId: userData.domain,
        organizationId: 'salfa-corp',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: {
          canCreateAgents: true,
          canUploadContext: true,
          canUseAgents: true,
          canViewOwnAgents: true,
          canViewOwnContext: true,
          canDeleteOwnAgents: true,
          canDeleteOwnContext: true
        }
      });
      
      console.log(`   ✅ Created: ${userData.name} (${userData.email})`);
    }
    
    // Step 2: Get all users (including newly created)
    console.log('\n👥 Step 2: Loading All Users\n');
    const usersSnapshot = await firestore.collection('users').get();
    const users = new Map();
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      users.set(data.email, {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role
      });
    });
    
    console.log(`   ✅ Loaded ${users.size} users\n`);
    
    // Step 3: Share agents
    console.log('🔓 Step 3: Sharing Agents with Expected Users\n');
    
    for (const [agentTitle, expectedEmails] of Object.entries(AGENT_SHARING)) {
      console.log(`\n🤖 Processing: ${agentTitle}`);
      console.log('-'.repeat(80));
      
      // Find the agent
      const agentSnapshot = await firestore
        .collection('conversations')
        .where('title', '==', agentTitle)
        .limit(1)
        .get();
      
      if (agentSnapshot.empty) {
        console.log(`   ❌ Agent not found in database!`);
        continue;
      }
      
      const agentDoc = agentSnapshot.docs[0];
      const agentData = agentDoc.data();
      const currentSharedWith = agentData.sharedWith || [];
      
      console.log(`   📍 Found agent (ID: ${agentDoc.id.substring(0, 12)}...)`);
      console.log(`   👤 Created by: ${agentData.userId}`);
      console.log(`   📊 Currently shared with: ${currentSharedWith.length} users`);
      console.log(`   🎯 Expected to share with: ${expectedEmails.length} users`);
      
      // Build new sharedWith array
      const newSharedWith = [];
      const missingUsers = [];
      
      for (const email of expectedEmails) {
        const user = users.get(email);
        
        if (!user) {
          missingUsers.push(email);
          console.log(`   ⚠️  User not found: ${email}`);
          continue;
        }
        
        // Add to sharedWith
        newSharedWith.push({
          type: 'user',
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          addedAt: new Date(),
          addedBy: 'alec@getaifactory.com',
          accessLevel: 'edit' // Full access
        });
      }
      
      if (missingUsers.length > 0) {
        console.log(`   ❌ Cannot share with ${missingUsers.length} missing users`);
        console.log(`      Missing: ${missingUsers.join(', ')}`);
      }
      
      // Update agent with new sharing
      console.log(`\n   💾 Updating agent sharing...`);
      await agentDoc.ref.update({
        sharedWith: newSharedWith,
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Successfully shared with ${newSharedWith.length} users`);
      
      if (missingUsers.length === 0) {
        console.log(`   ✅ ALL expected users have access!`);
      }
    }
    
    // Step 4: Verification
    console.log('\n\n✅ Step 4: Verification\n');
    console.log('='.repeat(80));
    
    for (const [agentTitle, expectedEmails] of Object.entries(AGENT_SHARING)) {
      const agentSnapshot = await firestore
        .collection('conversations')
        .where('title', '==', agentTitle)
        .limit(1)
        .get();
      
      if (!agentSnapshot.empty) {
        const agentData = agentSnapshot.docs[0].data();
        const sharedWith = agentData.sharedWith || [];
        const totalAccess = 1 + sharedWith.length; // creator + shared
        
        console.log(`\n${agentTitle}:`);
        console.log(`   Expected: ${expectedEmails.length} users`);
        console.log(`   Actual: ${totalAccess} users (1 creator + ${sharedWith.length} shared)`);
        
        if (totalAccess >= expectedEmails.length) {
          console.log(`   ✅ COMPLETE`);
        } else {
          console.log(`   ⚠️  Missing ${expectedEmails.length - totalAccess} users`);
        }
      }
    }
    
    console.log('\n\n🎉 Agent Access Setup Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setupCompleteAccess();



