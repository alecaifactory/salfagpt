/**
 * Complete Organization ID Migration Script
 * 
 * SAFETY FEATURES:
 * - Dry-run mode by default
 * - Batch operations (500 per batch - Firestore limit)
 * - Progress logging
 * - Error recovery
 * - Preserves all existing data
 * - Zero data loss guarantee
 * 
 * MIGRATIONS:
 * 1. Users: Add organizationId based on email domain
 * 2. Conversations: Add organizationId from userId lookup
 * 3. Messages: Add organizationId from conversation lookup
 * 4. Context Sources: Add organizationId from userId lookup
 * 
 * USAGE:
 *   DRY RUN:  node scripts/migrate-add-organization-id.js
 *   EXECUTE:  node scripts/migrate-add-organization-id.js --execute
 * 
 * Created: 2025-11-11
 */

const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt'
});

const DRY_RUN = !process.argv.includes('--execute');

// Migration stats
const stats = {
  users: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  conversations: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  messages: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  contextSources: { total: 0, migrated: 0, skipped: 0, errors: 0 },
};

/**
 * ========================================
 * STEP 1: BUILD ORGANIZATION MAP
 * ========================================
 */
async function buildOrganizationMap() {
  console.log('📊 Building organization map from domains...');
  
  const snapshot = await firestore.collection('organizations').get();
  
  // Map: domain -> organizationId
  const domainToOrg = new Map();
  
  // Map: organizationId -> organization data
  const organizations = new Map();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const orgId = doc.id;
    
    organizations.set(orgId, {
      id: orgId,
      name: data.name,
      domains: data.domains || [],
      primaryDomain: data.primaryDomain,
    });
    
    // Map each domain to this org
    (data.domains || []).forEach(domain => {
      domainToOrg.set(domain.toLowerCase(), orgId);
    });
  });
  
  console.log('✅ Loaded', organizations.size, 'organizations');
  console.log('✅ Mapped', domainToOrg.size, 'domains');
  console.log('');
  
  return { domainToOrg, organizations };
}

/**
 * ========================================
 * STEP 2: MIGRATE USERS
 * ========================================
 */
async function migrateUsers(domainToOrg) {
  console.log('👥 MIGRATING USERS');
  console.log('─'.repeat(60));
  
  const snapshot = await firestore.collection('users').get();
  stats.users.total = snapshot.size;
  
  const updates = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has organizationId
    if (data.organizationId) {
      stats.users.skipped++;
      continue;
    }
    
    // Extract domain from email
    const email = data.email || '';
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) {
      console.warn('⚠️  User', doc.id, 'has no email domain');
      stats.users.errors++;
      continue;
    }
    
    // Find organization for this domain
    const orgId = domainToOrg.get(domain);
    
    if (!orgId) {
      console.warn('⚠️  No organization for domain:', domain, '(user:', doc.id + ')');
      stats.users.errors++;
      continue;
    }
    
    updates.push({
      ref: doc.ref,
      data: {
        organizationId: orgId,
        domainId: domain,
        updatedAt: new Date(),
      },
      userId: doc.id,
      email: email,
      orgId: orgId,
    });
    
    stats.users.migrated++;
  }
  
  // Execute updates in batches
  if (!DRY_RUN && updates.length > 0) {
    await executeBatches(updates, 'users');
  }
  
  console.log('✅ Users:', stats.users.migrated, 'migrated,', stats.users.skipped, 'skipped,', stats.users.errors, 'errors');
  console.log('');
  
  return updates;
}

/**
 * ========================================
 * STEP 3: MIGRATE CONVERSATIONS
 * ========================================
 */
async function migrateConversations() {
  console.log('💬 MIGRATING CONVERSATIONS');
  console.log('─'.repeat(60));
  
  const snapshot = await firestore.collection('conversations').get();
  stats.conversations.total = snapshot.size;
  
  const updates = [];
  
  // Build userId -> organizationId map
  const userOrgMap = new Map();
  const users = await firestore.collection('users').get();
  users.docs.forEach(doc => {
    const data = doc.data();
    if (data.organizationId) {
      userOrgMap.set(doc.id, data.organizationId);
    }
  });
  
  console.log('📋 Loaded', userOrgMap.size, 'users with organizations');
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has organizationId
    if (data.organizationId) {
      stats.conversations.skipped++;
      continue;
    }
    
    // Get organization from userId
    const userId = data.userId;
    const orgId = userOrgMap.get(userId);
    
    if (!orgId) {
      console.warn('⚠️  Conversation', doc.id, 'user', userId, 'has no organization');
      stats.conversations.errors++;
      continue;
    }
    
    updates.push({
      ref: doc.ref,
      data: {
        organizationId: orgId,
        version: (data.version || 0) + 1,
        updatedAt: new Date(),
      },
      convId: doc.id,
      userId: userId,
      orgId: orgId,
    });
    
    stats.conversations.migrated++;
  }
  
  // Execute updates in batches
  if (!DRY_RUN && updates.length > 0) {
    await executeBatches(updates, 'conversations');
  }
  
  console.log('✅ Conversations:', stats.conversations.migrated, 'migrated,', stats.conversations.skipped, 'skipped,', stats.conversations.errors, 'errors');
  console.log('');
  
  return updates;
}

/**
 * ========================================
 * STEP 4: MIGRATE MESSAGES
 * ========================================
 */
async function migrateMessages() {
  console.log('💬 MIGRATING MESSAGES');
  console.log('─'.repeat(60));
  
  // Build conversationId -> organizationId map
  const convOrgMap = new Map();
  const convs = await firestore.collection('conversations').get();
  convs.docs.forEach(doc => {
    const data = doc.data();
    if (data.organizationId) {
      convOrgMap.set(doc.id, data.organizationId);
    }
  });
  
  console.log('📋 Loaded', convOrgMap.size, 'conversations with organizations');
  
  // Process messages in chunks (large collection)
  const CHUNK_SIZE = 1000;
  let lastDoc = null;
  let hasMore = true;
  let totalProcessed = 0;
  
  while (hasMore) {
    let query = firestore
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(CHUNK_SIZE);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }
    
    stats.messages.total += snapshot.size;
    const updates = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already has organizationId
      if (data.organizationId) {
        stats.messages.skipped++;
        continue;
      }
      
      // Get organization from conversationId
      const convId = data.conversationId;
      const orgId = convOrgMap.get(convId);
      
      if (!orgId) {
        // Don't warn for every message - conversation might not have org
        stats.messages.errors++;
        continue;
      }
      
      updates.push({
        ref: doc.ref,
        data: {
          organizationId: orgId,
          updatedAt: new Date(),
        },
        msgId: doc.id,
        convId: convId,
        orgId: orgId,
      });
      
      stats.messages.migrated++;
    }
    
    // Execute updates in batches
    if (!DRY_RUN && updates.length > 0) {
      await executeBatches(updates, 'messages');
    }
    
    lastDoc = snapshot.docs[snapshot.size - 1];
    totalProcessed += snapshot.size;
    
    console.log(`  Processed ${totalProcessed} messages (${stats.messages.migrated} migrated, ${stats.messages.skipped} skipped, ${stats.messages.errors} errors)...`);
    
    // Small delay to avoid rate limits
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('✅ Messages:', stats.messages.migrated, 'migrated,', stats.messages.skipped, 'skipped,', stats.messages.errors, 'errors');
  console.log('');
}

/**
 * ========================================
 * STEP 5: MIGRATE CONTEXT SOURCES
 * ========================================
 */
async function migrateContextSources() {
  console.log('📄 MIGRATING CONTEXT SOURCES');
  console.log('─'.repeat(60));
  
  const snapshot = await firestore.collection('context_sources').get();
  stats.contextSources.total = snapshot.size;
  
  const updates = [];
  
  // Build BOTH userId formats -> organizationId map
  const userOrgMap = new Map();
  const users = await firestore.collection('users').get();
  users.docs.forEach(doc => {
    const data = doc.data();
    if (data.organizationId) {
      // Map both hash ID and Google OAuth ID
      userOrgMap.set(doc.id, data.organizationId); // Hash ID (usr_xxx)
      if (data.userId) {
        userOrgMap.set(data.userId, data.organizationId); // Google OAuth ID
      }
    }
  });
  
  console.log('📋 Loaded', userOrgMap.size, 'user ID mappings');
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has organizationId
    if (data.organizationId) {
      stats.contextSources.skipped++;
      continue;
    }
    
    // Get organization from userId (try both formats)
    const userId = data.userId;
    const orgId = userOrgMap.get(userId);
    
    if (!orgId) {
      console.warn('⚠️  Context source', doc.id, 'user', userId, 'has no organization');
      stats.contextSources.errors++;
      continue;
    }
    
    updates.push({
      ref: doc.ref,
      data: {
        organizationId: orgId,
        version: (data.version || 0) + 1,
        updatedAt: new Date(),
      },
      sourceId: doc.id,
      userId: userId,
      orgId: orgId,
    });
    
    stats.contextSources.migrated++;
  }
  
  // Execute updates in batches
  if (!DRY_RUN && updates.length > 0) {
    await executeBatches(updates, 'context_sources');
  }
  
  console.log('✅ Context Sources:', stats.contextSources.migrated, 'migrated,', stats.contextSources.skipped, 'skipped,', stats.contextSources.errors, 'errors');
  console.log('');
  
  return updates;
}

/**
 * ========================================
 * BATCH EXECUTION HELPER
 * ========================================
 */
async function executeBatches(updates, collectionName) {
  const BATCH_SIZE = 500; // Firestore limit
  
  console.log(`🔄 Executing ${updates.length} updates in batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = firestore.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);
    
    chunk.forEach(update => {
      batch.update(update.ref, update.data);
    });
    
    await batch.commit();
    
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
    console.log(`  ✅ Batch ${batchNum}/${totalBatches} complete (${chunk.length} ${collectionName})`);
    
    // Small delay between batches
    if (i + BATCH_SIZE < updates.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

/**
 * ========================================
 * MAIN MIGRATION FLOW
 * ========================================
 */
async function runMigration() {
  console.log('');
  console.log('🚀 ORGANIZATION ID MIGRATION');
  console.log('='.repeat(60));
  console.log('');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be modified');
    console.log('   Run with --execute flag to perform actual migration');
    console.log('');
  } else {
    console.log('🔥 EXECUTE MODE - Data WILL be modified');
    console.log('');
    
    // Safety confirmation
    console.log('⏸️  Waiting 5 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');
  }
  
  const startTime = Date.now();
  
  try {
    // Build organization map
    const { domainToOrg, organizations } = await buildOrganizationMap();
    
    // Step 1: Migrate Users
    await migrateUsers(domainToOrg);
    
    // Step 2: Migrate Conversations
    await migrateConversations();
    
    // Step 3: Migrate Messages
    await migrateMessages();
    
    // Step 4: Migrate Context Sources
    await migrateContextSources();
    
    // Final Report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Users:');
    console.log('  Total:', stats.users.total);
    console.log('  Migrated:', stats.users.migrated);
    console.log('  Skipped (already migrated):', stats.users.skipped);
    console.log('  Errors:', stats.users.errors);
    console.log('');
    console.log('Conversations:');
    console.log('  Total:', stats.conversations.total);
    console.log('  Migrated:', stats.conversations.migrated);
    console.log('  Skipped (already migrated):', stats.conversations.skipped);
    console.log('  Errors:', stats.conversations.errors);
    console.log('');
    console.log('Messages:');
    console.log('  Total:', stats.messages.total);
    console.log('  Migrated:', stats.messages.migrated);
    console.log('  Skipped (already migrated):', stats.messages.skipped);
    console.log('  Errors:', stats.messages.errors);
    console.log('');
    console.log('Context Sources:');
    console.log('  Total:', stats.contextSources.total);
    console.log('  Migrated:', stats.contextSources.migrated);
    console.log('  Skipped (already migrated):', stats.contextSources.skipped);
    console.log('  Errors:', stats.contextSources.errors);
    console.log('');
    console.log('Duration:', duration, 'seconds');
    console.log('');
    
    if (DRY_RUN) {
      console.log('✅ DRY RUN COMPLETE - No data was modified');
      console.log('   Run with --execute to perform actual migration');
    } else {
      console.log('✅ MIGRATION COMPLETE');
      console.log('');
      console.log('VERIFICATION STEPS:');
      console.log('1. Check users have organizationId:');
      console.log('   node -e "require(\'@google-cloud/firestore\').Firestore().collection(\'users\').limit(5).get().then(s => s.docs.forEach(d => console.log(d.id, d.data().organizationId)))"');
      console.log('');
      console.log('2. Check conversations have organizationId:');
      console.log('   node -e "require(\'@google-cloud/firestore\').Firestore().collection(\'conversations\').limit(5).get().then(s => s.docs.forEach(d => console.log(d.id, d.data().organizationId)))"');
      console.log('');
      console.log('3. Test in UI:');
      console.log('   - Organizations menu should show stats');
      console.log('   - All conversations should still load');
      console.log('   - All messages should still appear');
      console.log('   - All context sources should still work');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ MIGRATION FAILED:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
runMigration();

