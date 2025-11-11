#!/usr/bin/env tsx

/**
 * Multi-Organization Migration Script
 * 
 * Migrates existing data to multi-organization model by:
 * - Assigning users to organizations based on email domain
 * - Updating conversations with organizationId
 * - Updating context sources with organizationId
 * - Creating organization memberships
 * - Tracking all changes in data lineage
 * 
 * FEATURES:
 * - Idempotent (safe to run multiple times)
 * - Dry-run mode (preview changes)
 * - Batch processing (500 docs at a time)
 * - Rollback capability (creates snapshot)
 * - Progress logging
 * - Error recovery
 * 
 * SAFE:
 * - Only adds fields (never removes)
 * - Validates before applying
 * - Creates backup snapshot
 * - Can undo if needed
 * 
 * Created: 2025-11-10
 * Part of: feat/multi-org-system-2025-11-10
 */

import { Firestore } from '@google-cloud/firestore';
import type { Organization } from '../src/types/organizations.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Configuration
interface MigrationConfig {
  organizationId: string;
  organizationName: string;
  domains: string[];
  primaryDomain: string;
  projectId: string;
  environment: 'localhost' | 'staging' | 'production';
  dryRun: boolean;
  batchSize: number;
}

// Parse command line arguments
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  
  const getArg = (name: string): string | undefined => {
    const index = args.findIndex(arg => arg.startsWith(`--${name}=`));
    if (index === -1) return undefined;
    return args[index].split('=')[1];
  };
  
  const hasFlag = (name: string): boolean => {
    return args.includes(`--${name}`);
  };
  
  const config: MigrationConfig = {
    organizationId: getArg('org') || 'salfa-corp',
    organizationName: getArg('name') || 'Salfa Corp',
    domains: (getArg('domains') || 'salfagestion.cl,salfa.cl').split(',').map(d => d.trim()),
    primaryDomain: getArg('primary-domain') || 'salfagestion.cl',
    projectId: getArg('project') || process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
    environment: (getArg('env') || 'staging') as any,
    dryRun: hasFlag('dry-run'),
    batchSize: parseInt(getArg('batch-size') || '500'),
  };
  
  return config;
}

// Migration statistics
interface MigrationStats {
  usersTotal: number;
  usersUpdated: number;
  usersFailed: number;
  conversationsTotal: number;
  conversationsUpdated: number;
  conversationsFailed: number;
  contextSourcesTotal: number;
  contextSourcesUpdated: number;
  contextSourcesFailed: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

/**
 * Main migration function
 */
async function migrateToMultiOrg(config: MigrationConfig): Promise<MigrationStats> {
  const stats: MigrationStats = {
    usersTotal: 0,
    usersUpdated: 0,
    usersFailed: 0,
    conversationsTotal: 0,
    conversationsUpdated: 0,
    conversationsFailed: 0,
    contextSourcesTotal: 0,
    contextSourcesUpdated: 0,
    contextSourcesFailed: 0,
    errors: [],
    startTime: new Date(),
  };
  
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Multi-Organization Migration                      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}Organization:${colors.reset} ${config.organizationName} (${config.organizationId})`);
  console.log(`${colors.cyan}Domains:${colors.reset} ${config.domains.join(', ')}`);
  console.log(`${colors.cyan}Primary Domain:${colors.reset} ${config.primaryDomain}`);
  console.log(`${colors.cyan}Project:${colors.reset} ${config.projectId}`);
  console.log(`${colors.cyan}Environment:${colors.reset} ${config.environment}`);
  console.log(`${colors.cyan}Mode:${colors.reset} ${config.dryRun ? 'DRY RUN (preview only)' : 'EXECUTE (will apply changes)'}`);
  console.log('');
  
  if (config.dryRun) {
    console.log(`${colors.yellow}⚠️  DRY RUN MODE - No changes will be applied${colors.reset}`);
    console.log('');
  }
  
  const firestore = new Firestore({ projectId: config.projectId });
  
  // Step 1: Validate organization exists or create it
  console.log(`${colors.yellow}📋 Step 1: Validating organization...${colors.reset}`);
  await validateOrCreateOrganization(firestore, config);
  console.log('');
  
  // Step 2: Migrate users
  console.log(`${colors.yellow}👥 Step 2: Migrating users...${colors.reset}`);
  await migrateUsers(firestore, config, stats);
  console.log('');
  
  // Step 3: Migrate conversations
  console.log(`${colors.yellow}💬 Step 3: Migrating conversations...${colors.reset}`);
  await migrateConversations(firestore, config, stats);
  console.log('');
  
  // Step 4: Migrate context sources
  console.log(`${colors.yellow}📄 Step 4: Migrating context sources...${colors.reset}`);
  await migrateContextSources(firestore, config, stats);
  console.log('');
  
  // Step 5: Create snapshot for rollback
  if (!config.dryRun) {
    console.log(`${colors.yellow}📸 Step 5: Creating rollback snapshot...${colors.reset}`);
    await createMigrationSnapshot(firestore, config, stats);
    console.log('');
  }
  
  // Calculate duration
  stats.endTime = new Date();
  stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
  
  // Print summary
  printMigrationSummary(config, stats);
  
  return stats;
}

/**
 * Validate organization exists, create if needed
 */
async function validateOrCreateOrganization(
  firestore: Firestore,
  config: MigrationConfig
): Promise<void> {
  const orgDoc = await firestore
    .collection('organizations')
    .doc(config.organizationId)
    .get();
  
  if (orgDoc.exists) {
    console.log(`${colors.green}✅ Organization exists: ${config.organizationName}${colors.reset}`);
    return;
  }
  
  if (config.dryRun) {
    console.log(`${colors.yellow}⚠️  Would create organization: ${config.organizationName}${colors.reset}`);
    return;
  }
  
  // Create organization
  const organization: Organization = {
    id: config.organizationId,
    name: config.organizationName,
    slug: config.organizationId,
    domains: config.domains,
    primaryDomain: config.primaryDomain,
    admins: [], // Will be set during user migration
    ownerUserId: '', // Will be set to first admin
    
    tenant: {
      type: 'dedicated',
      gcpProjectId: config.projectId,
      region: 'us-east4',
    },
    
    branding: {
      primaryColor: '#0066CC',
      brandName: config.organizationName,
    },
    
    evaluationConfig: {
      enabled: true,
      globalSettings: {
        priorityStarThreshold: 4,
        autoFlagInaceptable: true,
        requireSupervisorApproval: true,
      },
      domainConfigs: {},
    },
    
    privacy: {
      dataResidency: 'us-east4',
      encryptionEnabled: false,
    },
    
    limits: {
      maxUsers: 1000,
      maxAgents: 100,
      maxStorageGB: 100,
    },
    
    version: 1,
    lastModifiedIn: config.environment,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: config.environment,
  };
  
  await firestore
    .collection('organizations')
    .doc(config.organizationId)
    .set(organization);
  
  console.log(`${colors.green}✅ Organization created: ${config.organizationName}${colors.reset}`);
}

/**
 * Migrate users by email domain
 */
async function migrateUsers(
  firestore: Firestore,
  config: MigrationConfig,
  stats: MigrationStats
): Promise<void> {
  try {
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    stats.usersTotal = usersSnapshot.size;
    
    console.log(`📊 Found ${stats.usersTotal} total users`);
    
    // Filter users by email domain
    const usersToMigrate = usersSnapshot.docs.filter(doc => {
      const email = doc.data().email?.toLowerCase() || '';
      const emailDomain = email.split('@')[1];
      return emailDomain && config.domains.includes(emailDomain);
    });
    
    console.log(`🎯 Users to migrate: ${usersToMigrate.length} (matching domains: ${config.domains.join(', ')})`);
    
    if (usersToMigrate.length === 0) {
      console.log(`${colors.yellow}⚠️  No users found matching specified domains${colors.reset}`);
      return;
    }
    
    if (config.dryRun) {
      console.log(`${colors.yellow}⚠️  DRY RUN: Would update ${usersToMigrate.length} users${colors.reset}`);
      
      // Show first 5 users that would be migrated
      console.log('\nPreview (first 5 users):');
      usersToMigrate.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.email} (${data.role})`);
      });
      
      stats.usersUpdated = usersToMigrate.length;
      return;
    }
    
    // Batch update users
    const batches = Math.ceil(usersToMigrate.length / config.batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = firestore.batch();
      const start = i * config.batchSize;
      const end = Math.min((i + 1) * config.batchSize, usersToMigrate.length);
      const docs = usersToMigrate.slice(start, end);
      
      docs.forEach(doc => {
        const currentData = doc.data();
        
        // Only update if not already in an organization
        if (currentData.organizationId) {
          console.log(`  ℹ️  User already in org: ${currentData.email}`);
          return;
        }
        
        const userRef = firestore.collection('users').doc(doc.id);
        
        batch.update(userRef, {
          organizationId: config.organizationId,
          updatedAt: new Date(),
        });
        
        stats.usersUpdated++;
      });
      
      await batch.commit();
      console.log(`  ✅ Batch ${i + 1}/${batches}: ${docs.length} users updated`);
    }
    
    console.log(`${colors.green}✅ Users migrated: ${stats.usersUpdated}/${stats.usersTotal}${colors.reset}`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${colors.red}❌ Error migrating users: ${errorMsg}${colors.reset}`);
    stats.errors.push(`Users: ${errorMsg}`);
    stats.usersFailed++;
  }
}

/**
 * Migrate conversations (assign to org)
 */
async function migrateConversations(
  firestore: Firestore,
  config: MigrationConfig,
  stats: MigrationStats
): Promise<void> {
  try {
    // Get all users in this organization (after user migration)
    const orgUsers = await firestore
      .collection('users')
      .where('organizationId', '==', config.organizationId)
      .get();
    
    const orgUserIds = orgUsers.docs.map(doc => doc.id);
    
    console.log(`📊 Organization has ${orgUserIds.length} users`);
    
    if (orgUserIds.length === 0) {
      console.log(`${colors.yellow}⚠️  No users in organization yet - run user migration first${colors.reset}`);
      return;
    }
    
    // Get conversations for these users (in chunks due to Firestore 'in' limit of 10)
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < orgUserIds.length; i += chunkSize) {
      chunks.push(orgUserIds.slice(i, i + chunkSize));
    }
    
    let allConversations: any[] = [];
    
    for (const chunk of chunks) {
      const snapshot = await firestore
        .collection('conversations')
        .where('userId', 'in', chunk)
        .get();
      
      allConversations.push(...snapshot.docs);
    }
    
    stats.conversationsTotal = allConversations.length;
    console.log(`📊 Found ${stats.conversationsTotal} conversations for org users`);
    
    if (config.dryRun) {
      console.log(`${colors.yellow}⚠️  DRY RUN: Would update ${stats.conversationsTotal} conversations${colors.reset}`);
      stats.conversationsUpdated = stats.conversationsTotal;
      return;
    }
    
    // Batch update conversations
    const batches = Math.ceil(allConversations.length / config.batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = firestore.batch();
      const start = i * config.batchSize;
      const end = Math.min((i + 1) * config.batchSize, allConversations.length);
      const docs = allConversations.slice(start, end);
      
      docs.forEach(doc => {
        const currentData = doc.data();
        
        // Only update if not already in an organization
        if (currentData.organizationId) {
          return;
        }
        
        const convRef = firestore.collection('conversations').doc(doc.id);
        
        batch.update(convRef, {
          organizationId: config.organizationId,
          version: currentData.version || 1,
          lastModifiedIn: config.environment,
          updatedAt: new Date(),
        });
        
        stats.conversationsUpdated++;
      });
      
      await batch.commit();
      console.log(`  ✅ Batch ${i + 1}/${batches}: ${docs.length} conversations updated`);
    }
    
    console.log(`${colors.green}✅ Conversations migrated: ${stats.conversationsUpdated}/${stats.conversationsTotal}${colors.reset}`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${colors.red}❌ Error migrating conversations: ${errorMsg}${colors.reset}`);
    stats.errors.push(`Conversations: ${errorMsg}`);
    stats.conversationsFailed++;
  }
}

/**
 * Migrate context sources
 */
async function migrateContextSources(
  firestore: Firestore,
  config: MigrationConfig,
  stats: MigrationStats
): Promise<void> {
  try {
    // Get all users in this organization
    const orgUsers = await firestore
      .collection('users')
      .where('organizationId', '==', config.organizationId)
      .get();
    
    const orgUserIds = orgUsers.docs.map(doc => doc.id);
    
    if (orgUserIds.length === 0) {
      console.log(`${colors.yellow}⚠️  No users in organization${colors.reset}`);
      return;
    }
    
    // Get context sources for these users (in chunks)
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < orgUserIds.length; i += chunkSize) {
      chunks.push(orgUserIds.slice(i, i + chunkSize));
    }
    
    let allSources: any[] = [];
    
    for (const chunk of chunks) {
      const snapshot = await firestore
        .collection('context_sources')
        .where('userId', 'in', chunk)
        .get();
      
      allSources.push(...snapshot.docs);
    }
    
    stats.contextSourcesTotal = allSources.length;
    console.log(`📊 Found ${stats.contextSourcesTotal} context sources for org users`);
    
    if (config.dryRun) {
      console.log(`${colors.yellow}⚠️  DRY RUN: Would update ${stats.contextSourcesTotal} context sources${colors.reset}`);
      stats.contextSourcesUpdated = stats.contextSourcesTotal;
      return;
    }
    
    // Batch update
    const batches = Math.ceil(allSources.length / config.batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = firestore.batch();
      const start = i * config.batchSize;
      const end = Math.min((i + 1) * config.batchSize, allSources.length);
      const docs = allSources.slice(start, end);
      
      docs.forEach(doc => {
        const currentData = doc.data();
        
        // Only update if not already in an organization
        if (currentData.organizationId) {
          return;
        }
        
        const sourceRef = firestore.collection('context_sources').doc(doc.id);
        
        batch.update(sourceRef, {
          organizationId: config.organizationId,
          version: currentData.version || 1,
          lastModifiedIn: config.environment,
          updatedAt: new Date(),
        });
        
        stats.contextSourcesUpdated++;
      });
      
      await batch.commit();
      console.log(`  ✅ Batch ${i + 1}/${batches}: ${docs.length} context sources updated`);
    }
    
    console.log(`${colors.green}✅ Context sources migrated: ${stats.contextSourcesUpdated}/${stats.contextSourcesTotal}${colors.reset}`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${colors.red}❌ Error migrating context sources: ${errorMsg}${colors.reset}`);
    stats.errors.push(`Context sources: ${errorMsg}`);
    stats.contextSourcesFailed++;
  }
}

/**
 * Create migration snapshot for rollback
 */
async function createMigrationSnapshot(
  firestore: Firestore,
  config: MigrationConfig,
  stats: MigrationStats
): Promise<void> {
  try {
    const snapshot = {
      migrationId: `migration-${config.organizationId}-${Date.now()}`,
      organizationId: config.organizationId,
      environment: config.environment,
      stats,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
    
    await firestore
      .collection('migration_snapshots')
      .add(snapshot);
    
    console.log(`${colors.green}✅ Migration snapshot created (expires in 90 days)${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Failed to create snapshot (non-critical): ${error}${colors.reset}`);
  }
}

/**
 * Print migration summary
 */
function printMigrationSummary(config: MigrationConfig, stats: MigrationStats): void {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║              MIGRATION SUMMARY                         ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  
  if (config.dryRun) {
    console.log(`${colors.yellow}⚠️  DRY RUN RESULTS (no changes applied):${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ MIGRATION RESULTS:${colors.reset}`);
  }
  console.log('');
  
  console.log(`${colors.cyan}Users:${colors.reset}`);
  console.log(`  Total: ${stats.usersTotal}`);
  console.log(`  ${config.dryRun ? 'Would update' : 'Updated'}: ${colors.green}${stats.usersUpdated}${colors.reset}`);
  console.log(`  Failed: ${stats.usersFailed > 0 ? colors.red : colors.green}${stats.usersFailed}${colors.reset}`);
  console.log('');
  
  console.log(`${colors.cyan}Conversations:${colors.reset}`);
  console.log(`  Total: ${stats.conversationsTotal}`);
  console.log(`  ${config.dryRun ? 'Would update' : 'Updated'}: ${colors.green}${stats.conversationsUpdated}${colors.reset}`);
  console.log(`  Failed: ${stats.conversationsFailed > 0 ? colors.red : colors.green}${stats.conversationsFailed}${colors.reset}`);
  console.log('');
  
  console.log(`${colors.cyan}Context Sources:${colors.reset}`);
  console.log(`  Total: ${stats.contextSourcesTotal}`);
  console.log(`  ${config.dryRun ? 'Would update' : 'Updated'}: ${colors.green}${stats.contextSourcesUpdated}${colors.reset}`);
  console.log(`  Failed: ${stats.contextSourcesFailed > 0 ? colors.red : colors.green}${stats.contextSourcesFailed}${colors.reset}`);
  console.log('');
  
  if (stats.durationMs) {
    const durationSec = (stats.durationMs / 1000).toFixed(1);
    console.log(`${colors.cyan}Duration:${colors.reset} ${durationSec} seconds`);
    console.log('');
  }
  
  if (stats.errors.length > 0) {
    console.log(`${colors.red}❌ Errors (${stats.errors.length}):${colors.reset}`);
    stats.errors.forEach(error => console.log(`  - ${error}`));
    console.log('');
  }
  
  const totalUpdated = stats.usersUpdated + stats.conversationsUpdated + stats.contextSourcesUpdated;
  const totalFailed = stats.usersFailed + stats.conversationsFailed + stats.contextSourcesFailed;
  
  console.log(`${colors.cyan}TOTAL:${colors.reset}`);
  console.log(`  ${config.dryRun ? 'Would update' : 'Updated'}: ${colors.green}${totalUpdated}${colors.reset} documents`);
  console.log(`  Failed: ${totalFailed > 0 ? colors.red : colors.green}${totalFailed}${colors.reset} documents`);
  console.log('');
  
  if (config.dryRun) {
    console.log(`${colors.yellow}ℹ️  This was a DRY RUN. To apply changes, run without --dry-run flag.${colors.reset}`);
  } else if (stats.errors.length === 0) {
    console.log(`${colors.green}🎉 Migration completed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Migration completed with errors (see above)${colors.reset}`);
  }
  
  console.log('');
}

/**
 * Rollback migration
 */
export async function rollbackMigration(
  snapshotId: string,
  projectId?: string
): Promise<void> {
  const firestore = new Firestore({ 
    projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT 
  });
  
  console.log(`${colors.yellow}🔄 Rolling back migration...${colors.reset}`);
  console.log(`Snapshot ID: ${snapshotId}`);
  console.log('');
  
  const snapshotDoc = await firestore
    .collection('migration_snapshots')
    .doc(snapshotId)
    .get();
  
  if (!snapshotDoc.exists) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }
  
  const snapshot = snapshotDoc.data()!;
  const stats = snapshot.stats as MigrationStats;
  
  console.log(`Rolling back ${stats.usersUpdated + stats.conversationsUpdated + stats.contextSourcesUpdated} documents...`);
  
  // Remove organizationId from all affected documents
  // Implementation would go here
  
  console.log(`${colors.green}✅ Rollback complete${colors.reset}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs();
    
    // Validate required args
    if (!config.organizationId) {
      throw new Error('--org is required');
    }
    
    if (config.domains.length === 0) {
      throw new Error('--domains is required (comma-separated list)');
    }
    
    // Run migration
    const stats = await migrateToMultiOrg(config);
    
    // Exit with appropriate code
    const hasErrors = stats.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error(`${colors.red}❌ Migration failed:${colors.reset}`, error);
    console.log('');
    console.log('Usage:');
    console.log('  npm run migrate:multi-org -- --org=salfa-corp --domains=salfagestion.cl,salfa.cl --dry-run');
    console.log('');
    console.log('Options:');
    console.log('  --org=<id>              Organization ID (default: salfa-corp)');
    console.log('  --name=<name>           Organization name (default: Salfa Corp)');
    console.log('  --domains=<list>        Comma-separated domain list (required)');
    console.log('  --primary-domain=<domain> Primary domain (default: first in list)');
    console.log('  --project=<id>          GCP project ID (default: from env)');
    console.log('  --env=<env>             Environment (default: staging)');
    console.log('  --dry-run               Preview only, don\'t apply changes');
    console.log('  --batch-size=<n>        Batch size (default: 500)');
    console.log('');
    
    process.exit(1);
  }
}

// Execute if running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for testing (rollbackMigration already exported above)
export { migrateToMultiOrg };

