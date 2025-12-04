import { firestore, COLLECTIONS } from '../src/lib/firestore.js';
import { getPermissionsForRole } from '../src/lib/permissions.js';

async function fixRemainingExperts() {
  console.log('🔧 Fixing remaining expert users with incomplete permissions...');
  console.log('');
  
  // Get all expert users
  const snapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .where('role', '==', 'expert')
    .get();
  
  const expertPermissions = getPermissionsForRole('expert');
  const batch = firestore.batch();
  const toFix: any[] = [];
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const permCount = data.permissions ? Object.values(data.permissions).filter(v => v === true).length : 0;
    
    // Check if has all 16 permissions
    if (permCount < 16 || 
        !data.permissions?.canProvideFeedbackOnAgents ||
        !data.permissions?.canReviewAgents ||
        !data.permissions?.canSignOffAgents ||
        !data.permissions?.canProvideFeedbackOnContext) {
      
      console.log(`🔄 Updating: ${data.name} (${data.email})`);
      console.log(`   Before: ${permCount} permissions`);
      
      batch.update(doc.ref, {
        permissions: expertPermissions,
        updatedAt: new Date(),
      });
      
      toFix.push({
        name: data.name,
        email: data.email,
        id: doc.id,
        beforePerms: permCount,
      });
    }
  });
  
  if (toFix.length > 0) {
    console.log('');
    console.log(`💾 Committing ${toFix.length} updates...`);
    await batch.commit();
    console.log('✅ Batch update successful!');
    console.log('');
    
    console.log('📋 Updated Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    toFix.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Before: ${u.beforePerms} → After: 16 permissions ✅`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log('✅ No updates needed - all experts already have 16 permissions!');
  }
  
  // Final verification
  console.log('');
  console.log('🔍 Final Verification...');
  const verifySnapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .where('role', '==', 'expert')
    .get();
  
  let allCorrect = 0;
  let stillNeedFix = 0;
  
  verifySnapshot.docs.forEach(doc => {
    const data = doc.data();
    const permCount = data.permissions ? Object.values(data.permissions).filter(v => v === true).length : 0;
    const hasFeedback = data.permissions?.canProvideFeedbackOnAgents === true;
    
    if (permCount === 16 && hasFeedback) {
      allCorrect++;
    } else {
      stillNeedFix++;
      console.log(`⚠️ Still incomplete: ${data.name} (${permCount} perms)`);
    }
  });
  
  console.log('');
  console.log('📊 Final Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Total experts:         ', verifySnapshot.docs.length);
  console.log('Complete (16 perms):   ', allCorrect, '✅');
  console.log('Still incomplete:      ', stillNeedFix, stillNeedFix > 0 ? '⚠️' : '✅');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (allCorrect === verifySnapshot.docs.length) {
    console.log('');
    console.log('🎉 All expert users now have complete permissions!');
    console.log('');
    console.log('⚠️  IMPORTANT - Users must log out/in:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('For feedback button to appear, users need to:');
    console.log('1. Log out of the platform');
    console.log('2. Log back in (new JWT with "expert" role)');
    console.log('3. Expert feedback button will appear on AI responses');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

fixRemainingExperts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

