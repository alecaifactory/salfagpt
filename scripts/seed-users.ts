/**
 * Seed script to create demo users in Firestore
 * Run with: npx tsx scripts/seed-users.ts
 */

import { createUser, getUserByEmail } from '../src/lib/firestore';
import type { UserRole } from '../src/types/users';

interface DemoUser {
  email: string;
  name: string;
  role: UserRole;
  company: string;
  department?: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'alec@getaifactory.com',
    name: 'Alec Dickinson',
    role: 'admin',
    company: 'AI Factory LLC',
    department: 'Engineering',
  },
  {
    email: 'admin@demo.com',
    name: 'Admin Demo',
    role: 'admin',
    company: 'Demo Company',
    department: 'Administration',
  },
  {
    email: 'expert@demo.com',
    name: 'Expert Demo',
    role: 'expert',
    company: 'Demo Company',
    department: 'Operations',
  },
  {
    email: 'user@demo.com',
    name: 'User Demo',
    role: 'user',
    company: 'Demo Company',
    department: 'General',
  },
  {
    email: 'context_signoff@demo.com',
    name: 'Context SignOff',
    role: 'context_signoff',
    company: 'Demo Company',
    department: 'Quality Assurance',
  },
  {
    email: 'agent_signoff@demo.com',
    name: 'Agent SignOff',
    role: 'agent_signoff',
    company: 'Demo Company',
    department: 'Quality Assurance',
  },
  {
    email: 'context_reviewer@demo.com',
    name: 'Context Reviewer',
    role: 'context_reviewer',
    company: 'Demo Company',
    department: 'Review',
  },
  {
    email: 'agent_reviewer@demo.com',
    name: 'Agent Reviewer',
    role: 'agent_reviewer',
    company: 'Demo Company',
    department: 'Review',
  },
  {
    email: 'context_creator@demo.com',
    name: 'Context Creator',
    role: 'context_creator',
    company: 'Demo Company',
    department: 'Content',
  },
  {
    email: 'agent_creator@demo.com',
    name: 'Agent Creator',
    role: 'agent_creator',
    company: 'Demo Company',
    department: 'Content',
  },
  {
    email: 'context_collaborator@demo.com',
    name: 'Context Collaborator',
    role: 'context_collaborator',
    company: 'Demo Company',
    department: 'Collaboration',
  },
  {
    email: 'agent_collaborator@demo.com',
    name: 'Agent Collaborator',
    role: 'agent_collaborator',
    company: 'Demo Company',
    department: 'Collaboration',
  },
  {
    email: 'context_owner@demo.com',
    name: 'Context Owner',
    role: 'context_owner',
    company: 'Demo Company',
    department: 'Management',
  },
  {
    email: 'agent_owner@demo.com',
    name: 'Agent Owner',
    role: 'agent_owner',
    company: 'Demo Company',
    department: 'Management',
  },
];

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const demoUser of DEMO_USERS) {
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(demoUser.email);
      
      if (existingUser) {
        console.log(`⏭️  Skipping ${demoUser.email} - already exists`);
        skipped++;
        continue;
      }

      // Create user
      await createUser(
        demoUser.email,
        demoUser.name,
        demoUser.role,
        demoUser.company,
        demoUser.department
      );

      console.log(`✅ Created ${demoUser.email} - ${demoUser.role}`);
      created++;

    } catch (error) {
      console.error(`❌ Error creating ${demoUser.email}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total: ${DEMO_USERS.length}`);
  console.log('\n✨ Seeding complete!\n');
}

// Run the seeding function
seedUsers()
  .then(() => {
    console.log('👋 Done! Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  });

