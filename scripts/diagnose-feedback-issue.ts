import { getUserByEmail } from '../src/lib/firestore.js';

async function diagnoseFeedbackIssue() {
  const email = 'jefarias@maqsa.cl';
  
  console.log('🔍 Diagnosing feedback button issue for:', email);
  console.log('');
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log('📋 Current Database State:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:       ', user.email);
  console.log('Name:        ', user.name);
  console.log('User ID:     ', user.id);
  console.log('Role:        ', user.role);
  console.log('Roles:       ', user.roles?.join(', ') || 'N/A');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  console.log('🎯 Feedback Button Logic:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Code checks: ["admin", "expert", "superadmin"].includes(userRole)');
  console.log('');
  console.log('Current database role:', user.role);
  console.log('Should see button:', ['admin', 'expert', 'superadmin'].includes(user.role) ? 'YES ✅' : 'NO ❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  console.log('⚠️  IMPORTANT - JWT Token Issue:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('The feedback button checks userRole from JWT token, not database.');
  console.log('');
  console.log('JWT token contains the role from when the user logged in.');
  console.log('If the role was updated AFTER login, the JWT still has the old role.');
  console.log('');
  console.log('📝 Solution:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. User needs to LOG OUT');
  console.log('2. User needs to LOG BACK IN');
  console.log('3. New JWT will be created with updated "expert" role');
  console.log('4. Feedback button will then appear');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  console.log('🔧 Alternative Solution (Force JWT Refresh):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Create endpoint: POST /api/auth/refresh-session');
  console.log('• Reads current JWT');
  console.log('• Fetches latest user from Firestore');
  console.log('• Creates new JWT with updated role');
  console.log('• Updates cookie');
  console.log('• User refreshes page');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  console.log('📊 Permissions Check:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const feedbackPerms = [
    'canProvideFeedbackOnAgents',
    'canReviewAgents',
    'canSignOffAgents',
  ];
  
  feedbackPerms.forEach(perm => {
    const has = user.permissions?.[perm as keyof typeof user.permissions] === true;
    console.log(`${has ? '✅' : '❌'} ${perm}: ${has}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

diagnoseFeedbackIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

