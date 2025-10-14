/**
 * Seed Demo Users Script
 * Creates demo users with @demo.com domain for testing
 * 
 * Usage:
 * npx tsx scripts/seed-demo-users.ts
 */

import { createUser } from '../src/lib/firestore';
import type { UserRole } from '../src/types/users';

const DEMO_USERS = [
  {
    email: 'admin@demo.com',
    name: 'Admin Demo',
    roles: ['admin'] as UserRole[],
    company: 'Demo Corp',
    department: 'Administración',
  },
  {
    email: 'expert@demo.com',
    name: 'Expert Demo',
    roles: ['expert'] as UserRole[],
    company: 'Demo Corp',
    department: 'Consultoría',
  },
  {
    email: 'user@demo.com',
    name: 'User Standard Demo',
    roles: ['user'] as UserRole[],
    company: 'Demo Corp',
    department: 'Operaciones',
  },
  {
    email: 'context_signoff@demo.com',
    name: 'Context Signoff Demo',
    roles: ['context_signoff'] as UserRole[],
    company: 'Demo Corp',
    department: 'Control de Calidad',
  },
  {
    email: 'context_reviewer@demo.com',
    name: 'Context Reviewer Demo',
    roles: ['context_reviewer'] as UserRole[],
    company: 'Demo Corp',
    department: 'Control de Calidad',
  },
  {
    email: 'context_creator@demo.com',
    name: 'Context Creator Demo',
    roles: ['context_creator'] as UserRole[],
    company: 'Demo Corp',
    department: 'Gestión de Conocimiento',
  },
  {
    email: 'agent_signoff@demo.com',
    name: 'Agent Signoff Demo',
    roles: ['agent_signoff'] as UserRole[],
    company: 'Demo Corp',
    department: 'Gobernanza de IA',
  },
  {
    email: 'agent_reviewer@demo.com',
    name: 'Agent Reviewer Demo',
    roles: ['agent_reviewer'] as UserRole[],
    company: 'Demo Corp',
    department: 'Gobernanza de IA',
  },
  {
    email: 'agent_creator@demo.com',
    name: 'Agent Creator Demo',
    roles: ['agent_creator'] as UserRole[],
    company: 'Demo Corp',
    department: 'Desarrollo de IA',
  },
  {
    email: 'multi_role@demo.com',
    name: 'Multi Role Demo',
    roles: ['expert', 'context_creator', 'agent_creator'] as UserRole[],
    company: 'Demo Corp',
    department: 'Equipo Multifuncional',
  },
  {
    email: 'power_user@demo.com',
    name: 'Power User Demo',
    roles: ['context_signoff', 'agent_signoff', 'context_reviewer', 'agent_reviewer'] as UserRole[],
    company: 'Demo Corp',
    department: 'Calidad y Gobernanza',
  },
];

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...');
  console.log('================================================');

  let created = 0;
  let errors = 0;

  for (const userData of DEMO_USERS) {
    try {
      const user = await createUser(
        userData.email,
        userData.name,
        userData.roles,
        userData.company,
        'system', // Created by system
        userData.department
      );
      console.log(`✅ Created: ${user.email} (${user.roles.join(', ')})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error instanceof Error ? error.message : error);
      errors++;
    }
  }

  console.log('================================================');
  console.log(`✅ Successfully created: ${created} users`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors} users`);
  }
  console.log('🎉 Demo users seeding complete!');
  process.exit(0);
}

seedDemoUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
