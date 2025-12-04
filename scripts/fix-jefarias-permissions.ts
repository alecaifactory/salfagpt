import { getUserByEmail } from '../src/lib/firestore.js';
import { getPermissionsForRole } from '../src/lib/permissions.js';
import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function fixUserPermissions() {
  const email = 'jefarias@maqsa.cl';
  
  console.log('🔧 Fixing permissions for:', email);
  console.log('');
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log('📋 Before Fix:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Role:        ', user.role);
  console.log('Roles:       ', user.roles?.join(', ') || 'N/A');
  const currentPerms = user.permissions ? Object.values(user.permissions).filter(v => v === true).length : 0;
  console.log('Permissions: ', currentPerms);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Get correct expert permissions
  const expertPermissions = getPermissionsForRole('expert');
  
  console.log('🔄 Applying expert permissions...');
  console.log('');
  
  await firestore.collection(COLLECTIONS.USERS).doc(user.id).update({
    permissions: expertPermissions,
    updatedAt: new Date(),
  });
  
  console.log('✅ Update complete!');
  console.log('');
  
  // Verify
  const updatedUser = await getUserByEmail(email);
  
  if (updatedUser) {
    console.log('📋 After Fix:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Role:        ', updatedUser.role);
    console.log('Roles:       ', updatedUser.roles?.join(', ') || 'N/A');
    const newPerms = updatedUser.permissions ? Object.values(updatedUser.permissions).filter(v => v === true).length : 0;
    console.log('Permissions: ', newPerms);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    console.log('🔐 Feedback-Critical Permissions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const criticalPerms = [
      'canProvideFeedbackOnAgents',
      'canReviewAgents',
      'canSignOffAgents',
    ];
    
    criticalPerms.forEach(perm => {
      const has = updatedUser.permissions?.[perm as keyof typeof updatedUser.permissions] === true;
      console.log(`${has ? '✅' : '❌'} ${perm}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const allCorrect = 
      updatedUser.role === 'expert' &&
      updatedUser.roles?.includes('expert') &&
      updatedUser.permissions?.canProvideFeedbackOnAgents === true;
    
    if (allCorrect) {
      console.log('✅ All permissions correctly applied!');
      console.log('');
      console.log('⚠️  NEXT STEP FOR USER:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Tell jefarias@maqsa.cl to:');
      console.log('1. Log out of the platform');
      console.log('2. Log back in');
      console.log('3. The expert feedback button will appear');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('⚠️ Some permissions still missing');
    }
  }
}

fixUserPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

