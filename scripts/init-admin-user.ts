/**
 * Initialize Admin User
 * 
 * Creates the first admin user in Firestore so the User Management panel works.
 * Run this once to bootstrap the system.
 */

import { firestore } from '../src/lib/firestore';

async function initAdminUser() {
  const userId = 'alec_getaifactory_com';
  const email = 'alec@getaifactory.com';
  const now = new Date();
  
  try {
    // Check if user already exists
    const existing = await firestore.collection('users').doc(userId).get();
    
    if (existing.exists) {
      console.log('✅ User already exists:', email);
      const data = existing.data();
      console.log('   Roles:', data?.roles || [data?.role]);
      console.log('   Company:', data?.company);
      return;
    }
    
    // Create admin user
    const userData = {
      email,
      name: 'Alec Dickinson',
      role: 'admin',
      roles: ['admin', 'expert', 'context_signoff', 'agent_signoff'],
      company: 'GetAI Factory',
      department: 'Engineering',
      permissions: {
        canManageUsers: true,
        canManageSystem: true,
        canCreateContext: true,
        canEditContext: true,
        canDeleteContext: true,
        canReviewContext: true,
        canSignOffContext: true,
        canShareContext: true,
        canCreateAgent: true,
        canEditAgent: true,
        canDeleteAgent: true,
        canReviewAgent: true,
        canSignOffAgent: true,
        canShareAgent: true,
        canCollaborate: true,
        canViewAnalytics: true,
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      isActive: true,
      createdBy: 'system-init',
    };
    
    await firestore.collection('users').doc(userId).set(userData);
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', email);
    console.log('   Roles:', userData.roles.join(', '));
    console.log('   Company:', userData.company);
    console.log('');
    console.log('Now refresh the User Management panel to see the user!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

initAdminUser()
  .then(() => {
    console.log('✅ Initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });

