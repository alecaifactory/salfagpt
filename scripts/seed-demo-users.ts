/**
 * Script to seed demo users for testing user personas
 * Run with: npx tsx scripts/seed-demo-users.ts
 */

import { firestore } from '../src/lib/firestore';
import { getPermissionsForRole } from '../src/lib/permissions';
import type { UserRole } from '../src/types/user';

const DEMO_USERS = [
  // Primary Admin
  {
    email: 'alec@getaifactory.com',
    name: 'Alec (Admin Principal)',
    role: 'admin' as UserRole,
    company: 'GetAI Factory',
    department: 'Leadership',
  },
  
  // Demo Users by Role
  {
    email: 'admin@demo.com',
    name: 'Admin Demo',
    role: 'admin' as UserRole,
    company: 'Demo Corp',
    department: 'Administration',
  },
  {
    email: 'expert@demo.com',
    name: 'Expert Demo',
    role: 'expert' as UserRole,
    company: 'Demo Corp',
    department: 'Advanced Operations',
  },
  {
    email: 'user@demo.com',
    name: 'User Demo',
    role: 'user' as UserRole,
    company: 'Demo Corp',
    department: 'General',
  },
  
  // Context-focused roles
  {
    email: 'context_signoff@demo.com',
    name: 'Context Signoff Demo',
    role: 'context_signoff' as UserRole,
    company: 'Demo Corp',
    department: 'Quality Assurance',
  },
  {
    email: 'context_reviewer@demo.com',
    name: 'Context Reviewer Demo',
    role: 'context_reviewer' as UserRole,
    company: 'Demo Corp',
    department: 'Quality Assurance',
  },
  {
    email: 'context_creator@demo.com',
    name: 'Context Creator Demo',
    role: 'context_creator' as UserRole,
    company: 'Demo Corp',
    department: 'Knowledge Management',
  },
  {
    email: 'context_feedback@demo.com',
    name: 'Context Feedback Demo',
    role: 'context_feedback' as UserRole,
    company: 'Demo Corp',
    department: 'Quality Assurance',
  },
  
  // Agent-focused roles
  {
    email: 'agent_signoff@demo.com',
    name: 'Agent Signoff Demo',
    role: 'agent_signoff' as UserRole,
    company: 'Demo Corp',
    department: 'AI Governance',
  },
  {
    email: 'agent_reviewer@demo.com',
    name: 'Agent Reviewer Demo',
    role: 'agent_reviewer' as UserRole,
    company: 'Demo Corp',
    department: 'AI Governance',
  },
  {
    email: 'agent_creator@demo.com',
    name: 'Agent Creator Demo',
    role: 'agent_creator' as UserRole,
    company: 'Demo Corp',
    department: 'AI Development',
  },
  {
    email: 'agent_feedback@demo.com',
    name: 'Agent Feedback Demo',
    role: 'agent_feedback' as UserRole,
    company: 'Demo Corp',
    department: 'AI Governance',
  },
];

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...\n');
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const userData of DEMO_USERS) {
    const userId = userData.email.replace('@', '_').replace(/\./g, '_');
    
    try {
      // Check if user exists
      const existingUser = await firestore.collection('users').doc(userId).get();
      
      const user = {
        id: userId,
        ...userData,
        permissions: getPermissionsForRole(userData.role),
        createdAt: existingUser.exists ? existingUser.data()?.createdAt : new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      
      if (existingUser.exists) {
        // Update existing user
        await firestore.collection('users').doc(userId).update({
          ...user,
          createdAt: existingUser.data()?.createdAt, // Preserve original creation date
        });
        console.log(`🔄 Updated: ${user.email} (${user.role})`);
        updated++;
      } else {
        // Create new user
        await firestore.collection('users').doc(userId).set(user);
        console.log(`✅ Created: ${user.email} (${user.role})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${userData.email}:`, error);
      skipped++;
    }
  }
  
  console.log('\n🎉 Demo users seeding complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${created + updated + skipped}\n`);
  
  // List all users
  console.log('📋 Current users in database:');
  const snapshot = await firestore.collection('users').orderBy('email').get();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.email} (${data.role})`);
  });
}

// Run seeding
seedDemoUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

