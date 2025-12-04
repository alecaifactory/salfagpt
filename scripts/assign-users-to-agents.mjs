import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

// Parse user assignments from the provided data
const USER_ASSIGNMENTS = {
  'EgXezLcu4O3IUqFUJhUZ': { // M1-v2: Asistente Legal Territorial RDI
    agentName: 'Asistente Legal Territorial RDI (M1-v2)',
    users: [
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
    ]
  },
  'vStojK73ZKbjNsEnqANJ': { // M3-v2: GOP GPT
    agentName: 'GOP GPT (M3-v2)',
    users: [
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
    ]
  },
  'iQmdg3bMSJ1AdqqlFpye': { // S1-v2: Gestion Bodegas
    agentName: 'Gestion Bodegas (S1-v2)',
    users: [
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
    ]
  },
  '1lgr33ywq5qed67sqCYi': { // S2-v2: Maqsa Mantenimiento
    agentName: 'Maqsa Mantenimiento (S2-v2)',
    users: [
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
  }
};

/**
 * Get current share status for an agent
 */
async function getCurrentShares(agentId) {
  const sharesSnapshot = await db
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  const uniqueUsers = new Set();
  
  sharesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const sharedWith = data.sharedWith || [];
    
    sharedWith.forEach(target => {
      if (target.type === 'user' && target.email) {
        uniqueUsers.add(target.email.toLowerCase());
      }
    });
  });
  
  return uniqueUsers;
}

/**
 * Get user ID from email
 */
async function getUserIdFromEmail(email) {
  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].id;
}

/**
 * Create or update agent share
 */
async function shareAgentWithUsers(agentId, agentName, ownerUserId, userEmails) {
  console.log(`\n📤 Sharing ${agentName} with ${userEmails.length} users...`);
  
  // Get user IDs for all emails
  const usersToShare = [];
  const notFound = [];
  
  for (const email of userEmails) {
    const userId = await getUserIdFromEmail(email);
    
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      usersToShare.push({
        type: 'user',
        id: userId,
        email: email,
        name: userData.name || email.split('@')[0],
        domain: email.split('@')[1]
      });
    } else {
      notFound.push(email);
    }
  }
  
  if (notFound.length > 0) {
    console.log(`   ⚠️  ${notFound.length} users not found (need to login first):`);
    notFound.forEach(email => console.log(`      - ${email}`));
  }
  
  if (usersToShare.length === 0) {
    console.log(`   ❌ No valid users to share with`);
    return { success: false, sharedCount: 0 };
  }
  
  // Create agent share document
  try {
    const shareData = {
      agentId: agentId,
      agentName: agentName,
      ownerId: ownerUserId,
      sharedWith: usersToShare,
      sharedWithUsers: usersToShare.map(u => u.id), // For easier queries
      accessLevel: 'use',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: ownerUserId,
      source: 'production'
    };
    
    // Check if share already exists
    const existingShares = await db
      .collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    if (!existingShares.empty) {
      // Update existing share
      const shareId = existingShares.docs[0].id;
      await db.collection('agent_shares').doc(shareId).update({
        sharedWith: usersToShare,
        sharedWithUsers: usersToShare.map(u => u.id),
        updatedAt: new Date()
      });
      console.log(`   ✅ Updated existing share: ${usersToShare.length} users`);
    } else {
      // Create new share
      await db.collection('agent_shares').add(shareData);
      console.log(`   ✅ Created new share: ${usersToShare.length} users`);
    }
    
    return { success: true, sharedCount: usersToShare.length };
  } catch (error) {
    console.error(`   ❌ Error sharing agent: ${error.message}`);
    return { success: false, sharedCount: 0 };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Assign Users to Agents - Before & After             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  // Step 1: Get BEFORE status
  console.log('📊 STEP 1: Checking current sharing status (BEFORE)...\n');
  
  for (const [agentId, config] of Object.entries(USER_ASSIGNMENTS)) {
    console.log(`🔍 ${config.agentName} (${agentId})...`);
    
    const currentShares = await getCurrentShares(agentId);
    console.log(`   Current: ${currentShares.size} users shared`);
    console.log(`   Target:  ${config.users.length} users to share`);
    
    // Get agent owner
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const ownerUserId = agentDoc.exists ? agentDoc.data().userId : null;
    
    if (!ownerUserId) {
      console.log(`   ❌ Agent owner not found`);
      continue;
    }
    
    results.push({
      agentId,
      agentName: config.agentName,
      ownerUserId,
      beforeCount: currentShares.size,
      targetCount: config.users.length,
      beforeUsers: Array.from(currentShares),
      targetUsers: config.users
    });
  }
  
  // Display BEFORE table
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         ESTADO ANTES DE ASIGNAR                                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌───────────────────────────────────────┬──────────────────┬─────────────────┬─────────────────┐');
  console.log('│ Nombre del Agente                     │ ID del Agente    │ Usuarios Actual │ Usuarios Target │');
  console.log('├───────────────────────────────────────┼──────────────────┼─────────────────┼─────────────────┤');
  
  results.forEach(result => {
    const name = result.agentName.padEnd(37).substring(0, 37);
    const id = result.agentId.padEnd(16).substring(0, 16);
    const before = String(result.beforeCount).padStart(15);
    const target = String(result.targetCount).padStart(15);
    
    console.log(`│ ${name} │ ${id} │ ${before} │ ${target} │`);
  });
  
  console.log('└───────────────────────────────────────┴──────────────────┴─────────────────┴─────────────────┘\n');
  
  // Step 2: Perform assignments
  console.log('📝 STEP 2: Assigning users to agents...\n');
  
  for (const result of results) {
    const config = USER_ASSIGNMENTS[result.agentId];
    
    const shareResult = await shareAgentWithUsers(
      result.agentId,
      result.agentName,
      result.ownerUserId,
      config.users
    );
    
    result.afterCount = shareResult.sharedCount;
    result.shareStatus = shareResult.success ? 'SUCCESS' : 'FAILED';
  }
  
  // Step 3: Verify AFTER status
  console.log('\n📊 STEP 3: Verifying assignments (AFTER)...\n');
  
  for (const result of results) {
    const currentShares = await getCurrentShares(result.agentId);
    result.verifiedCount = currentShares.size;
    console.log(`✅ ${result.agentName}: ${result.verifiedCount} users shared`);
  }
  
  // Display AFTER table
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         ESTADO DESPUÉS DE ASIGNAR                                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌───────────────────────────────────────┬──────────────────┬────────┬────────┬───────────┬──────────┐');
  console.log('│ Nombre del Agente                     │ ID del Agente    │ Antes  │ Target │ Después   │ Estado   │');
  console.log('├───────────────────────────────────────┼──────────────────┼────────┼────────┼───────────┼──────────┤');
  
  results.forEach(result => {
    const name = result.agentName.padEnd(37).substring(0, 37);
    const id = result.agentId.padEnd(16).substring(0, 16);
    const before = String(result.beforeCount).padStart(6);
    const target = String(result.targetCount).padStart(6);
    const after = String(result.verifiedCount).padStart(9);
    const status = (result.shareStatus || 'N/A').padEnd(8);
    
    console.log(`│ ${name} │ ${id} │ ${before} │ ${target} │ ${after} │ ${status} │`);
  });
  
  console.log('└───────────────────────────────────────┴──────────────────┴────────┴────────┴───────────┴──────────┘\n');
  
  // Summary
  const totalBefore = results.reduce((sum, r) => sum + r.beforeCount, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.verifiedCount, 0);
  const successCount = results.filter(r => r.shareStatus === 'SUCCESS').length;
  
  console.log('📊 RESUMEN:');
  console.log(`   Agentes procesados: ${results.length}`);
  console.log(`   Asignaciones exitosas: ${successCount}/${results.length}`);
  console.log(`   Total usuarios compartidos (antes): ${totalBefore}`);
  console.log(`   Total usuarios compartidos (después): ${totalAfter}`);
  console.log(`   Nuevas asignaciones: ${totalAfter - totalBefore}\n`);
  
  // Detailed breakdown per agent
  console.log('📋 DETALLE POR AGENTE:\n');
  
  results.forEach(result => {
    console.log(`📌 ${result.agentName}`);
    console.log(`   ID: ${result.agentId}`);
    console.log(`   Antes: ${result.beforeCount} usuarios`);
    console.log(`   Después: ${result.verifiedCount} usuarios`);
    console.log(`   Nuevos: ${result.verifiedCount - result.beforeCount} usuarios`);
    console.log(`   Estado: ${result.shareStatus}\n`);
  });
  
  console.log('✨ Done!\n');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




