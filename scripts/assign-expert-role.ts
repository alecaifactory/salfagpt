import { getUserByEmail } from '../src/lib/firestore.js';
import { getPermissionsForRole } from '../src/lib/permissions.js';
import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function assignExpertRole() {
  const email = 'alec@salfacloud.cl';
  
  console.log('🔍 Looking for user:', email);
  console.log('');
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found:', email);
    console.log('');
    console.log('💡 This user needs to log in first to create their account.');
    console.log('   After first login, run this script again to assign expert role.');
    process.exit(1);
  }
  
  console.log('✅ User found!');
  console.log('');
  console.log('📋 Current State:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Name:        ', user.name);
  console.log('Email:       ', user.email);
  console.log('User ID:     ', user.id);
  console.log('Role:        ', user.role);
  console.log('Roles:       ', user.roles?.join(', ') || 'N/A');
  console.log('Company:     ', user.company);
  console.log('Department:  ', user.department || 'N/A');
  const currentPerms = user.permissions ? Object.values(user.permissions).filter(v => v === true).length : 0;
  console.log('Permissions: ', currentPerms);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Get expert permissions
  const expertPermissions = getPermissionsForRole('expert');
  
  console.log('🔄 Assigning expert role...');
  console.log('');
  
  await firestore.collection(COLLECTIONS.USERS).doc(user.id).update({
    role: 'expert',
    roles: ['expert'],
    permissions: expertPermissions,
    updatedAt: new Date(),
  });
  
  console.log('✅ Update complete!');
  console.log('');
  
  // Verify
  const updatedUser = await getUserByEmail(email);
  
  if (updatedUser) {
    console.log('📋 Updated State:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Name:        ', updatedUser.name);
    console.log('Email:       ', updatedUser.email);
    console.log('User ID:     ', updatedUser.id);
    console.log('Role:        ', updatedUser.role);
    console.log('Roles:       ', updatedUser.roles?.join(', ') || 'N/A');
    console.log('Company:     ', updatedUser.company);
    const newPerms = updatedUser.permissions ? Object.values(updatedUser.permissions).filter(v => v === true).length : 0;
    console.log('Permissions: ', newPerms, '(expected: 16)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    console.log('🔐 Expert Permissions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (updatedUser.permissions) {
      Object.entries(updatedUser.permissions).forEach(([key, value]) => {
        if (value === true) {
          console.log('  ✓', key);
        }
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Check feedback permissions specifically
    const hasFeedback = updatedUser.permissions?.canProvideFeedbackOnAgents === true;
    const hasReview = updatedUser.permissions?.canReviewAgents === true;
    const hasSignOff = updatedUser.permissions?.canSignOffAgents === true;
    
    if (updatedUser.role === 'expert' && hasFeedback && hasReview && hasSignOff) {
      console.log('✅ VERIFICATION PASSED: User is now a proper expert!');
      console.log('');
      console.log('⚠️  NEXT STEP:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Tell alec@salfacloud.cl to:');
      console.log('1. Log out');
      console.log('2. Log back in');
      console.log('3. Expert feedback button will appear');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('⚠️ WARNING: Some checks failed');
      console.log('  Role is expert:', updatedUser.role === 'expert' ? '✅' : '❌');
      console.log('  Has feedback perm:', hasFeedback ? '✅' : '❌');
      console.log('  Has review perm:', hasReview ? '✅' : '❌');
      console.log('  Has signoff perm:', hasSignOff ? '✅' : '❌');
    }
  }
}

assignExpertRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

