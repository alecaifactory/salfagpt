#!/usr/bin/env node
/**
 * Fix Alec Admin Role
 * 
 * This script ensures alec@getaifactory.com has admin privileges
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

// Full admin permissions
const ADMIN_PERMISSIONS = {
  // System
  canManageUsers: true,
  canImpersonateUsers: true,
  canAccessSystemSettings: true,
  canViewAllData: true,
  
  // Context
  canUploadContext: true,
  canDeleteOwnContext: true,
  canDeleteAnyContext: true,
  canViewOwnContext: true,
  canViewAllContext: true,
  canReviewContext: true,
  canSignOffContext: true,
  canProvideFeedbackOnContext: true,
  canShareContext: true,
  
  // Agents
  canCreateAgents: true,
  canDeleteOwnAgents: true,
  canDeleteAnyAgent: true,
  canViewOwnAgents: true,
  canViewAllAgents: true,
  canReviewAgents: true,
  canSignOffAgents: true,
  canProvideFeedbackOnAgents: true,
  canShareAgents: true,
  
  // Analytics
  canAccessAnalytics: true,
  canViewOwnCosts: true,
  canViewAllCosts: true,
  canExportData: true,
};

async function fixAlecAdmin() {
  console.log('🔧 Fixing admin role for alec@getaifactory.com...\n');
  
  const email = 'alec@getaifactory.com';
  const userId = email.replace(/[@.]/g, '_');
  
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ User document does NOT exist. Creating...\n');
      
      const newUser = {
        email,
        name: 'Alec',
        role: 'admin',
        roles: ['admin', 'expert', 'context_signoff', 'agent_signoff'],
        permissions: ADMIN_PERMISSIONS,
        company: 'GetAI Factory',
        department: 'Engineering',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        createdBy: 'system-init',
        agentAccessCount: 0,
        contextAccessCount: 0,
      };
      
      await firestore.collection('users').doc(userId).set(newUser);
      console.log('✅ Admin user created successfully!\n');
      
    } else {
      console.log('✅ User document exists. Checking current state...\n');
      
      const data = userDoc.data();
      console.log('Current data:');
      console.log('  Email:', data.email);
      console.log('  Name:', data.name);
      console.log('  Role:', data.role);
      console.log('  Roles:', data.roles);
      console.log('  Has admin in roles:', data.roles?.includes('admin') ? '✅ YES' : '❌ NO');
      console.log('');
      
      // Update to admin roles if not already admin
      if (!data.roles?.includes('admin')) {
        console.log('🔄 Updating to admin roles...\n');
        
        await firestore.collection('users').doc(userId).update({
          role: 'admin',
          roles: ['admin', 'expert', 'context_signoff', 'agent_signoff'],
          permissions: ADMIN_PERMISSIONS,
          updatedAt: new Date(),
        });
        
        console.log('✅ User updated to admin successfully!\n');
      } else {
        console.log('✅ User already has admin role. Ensuring all permissions...\n');
        
        await firestore.collection('users').doc(userId).update({
          permissions: ADMIN_PERMISSIONS,
          updatedAt: new Date(),
        });
        
        console.log('✅ Permissions updated!\n');
      }
    }
    
    // Verify the update
    const updatedDoc = await firestore.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();
    
    console.log('📋 Final verification:');
    console.log('  Email:', updatedData.email);
    console.log('  Name:', updatedData.name);
    console.log('  Role:', updatedData.role);
    console.log('  Roles:', updatedData.roles);
    console.log('  Has admin role:', updatedData.roles?.includes('admin') ? '✅ YES' : '❌ NO');
    console.log('  Permissions count:', Object.keys(updatedData.permissions || {}).length);
    console.log('  canManageUsers:', updatedData.permissions?.canManageUsers ? '✅ YES' : '❌ NO');
    console.log('');
    console.log('✅ SUCCESS! alec@getaifactory.com is now a full admin with all permissions!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Refresh your browser (hard reload: Cmd+Shift+R)');
    console.log('   2. Try creating a user again');
    console.log('   3. If still issues, logout and login again to refresh your session');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Ensure you ran: gcloud auth application-default login');
    console.error('   - Verify GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192 in .env');
    process.exit(1);
  }
}

fixAlecAdmin().then(() => process.exit(0));
