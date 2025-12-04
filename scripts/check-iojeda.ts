import { getUserByEmail } from '../src/lib/firestore.js';

async function checkUser() {
  const email = 'iojedaa@maqsa.cl';
  
  console.log('🔍 Checking user:', email);
  console.log('');
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log('📋 User Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Name:        ', user.name);
  console.log('Email:       ', user.email);
  console.log('User ID:     ', user.id);
  console.log('Role:        ', user.role);
  console.log('Roles:       ', user.roles?.join(', ') || 'N/A');
  console.log('Company:     ', user.company);
  console.log('Department:  ', user.department || 'N/A');
  console.log('Active:      ', user.isActive ? 'Yes ✅' : 'No ❌');
  
  const permCount = user.permissions ? Object.values(user.permissions).filter(v => v === true).length : 0;
  console.log('Permissions: ', permCount);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Check if expert
  const isExpert = user.role === 'expert' && user.roles?.includes('expert');
  const hasFullPerms = permCount === 16;
  const hasFeedback = user.permissions?.canProvideFeedbackOnAgents === true;
  
  console.log('🎯 Expert Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Is Expert:           ', isExpert ? 'YES ✅' : 'NO ❌');
  console.log('Has 16 permissions:  ', hasFullPerms ? 'YES ✅' : 'NO ❌ (has ' + permCount + ')');
  console.log('Has feedback perm:   ', hasFeedback ? 'YES ✅' : 'NO ❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (isExpert && hasFullPerms && hasFeedback) {
    console.log('');
    console.log('✅ This user IS an expert with full permissions!');
  } else if (isExpert && !hasFullPerms) {
    console.log('');
    console.log('⚠️  This user is expert but missing some permissions');
  } else {
    console.log('');
    console.log('❌ This user is NOT an expert (role: ' + user.role + ')');
  }
}

checkUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

