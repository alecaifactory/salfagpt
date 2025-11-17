# Complete User ID Migration Plan - Hash Format Unification

**Date:** 2025-11-15  
**Purpose:** Migrate entire platform from mixed userId formats to unified hash format  
**Impact:** Fixes agent context loading and prevents future ID mismatch issues  
**Status:** 📋 Plan Ready for Execution

---

## 🎯 Executive Summary

### The Problem
The platform currently uses **TWO different userId formats**:

| Format | Example | Used By |
|--------|---------|---------|
| **Google OAuth numeric** | `114671162830729001607` | Legacy context_sources, document_chunks |
| **Hash format** | `usr_uhwqffaqag1wrryd82tw` | Users, conversations, new data |

This mismatch causes queries to return 0 results even when data exists.

### The Solution
**Migrate ALL collections to use hash-format userId** and remove dependency on `googleUserId` field.

---

## 📊 Affected Collections & Records

### Critical Collections (High Priority)

| Collection | Current Format | Count | Impact |
|------------|----------------|-------|--------|
| **context_sources** | Numeric | 884 | ❌ CRITICAL - Agent context fails |
| **document_chunks** | Numeric | ~10,000+ | ❌ CRITICAL - RAG search fails |
| **document_chunks_vectorized** (BigQuery) | Hash | N/A | ✅ Already correct |

### Secondary Collections (Medium Priority)

| Collection | Mixed Format? | Impact |
|------------|---------------|--------|
| **message_feedback** | Likely numeric | User feedback queries may fail |
| **feedback_tickets** | Likely numeric | Ticket queries may fail |
| **message_queue** | Likely numeric | Queue filtering may fail |
| **user_sessions** | Likely numeric | Session tracking may fail |
| **usage_logs** | Likely numeric | Analytics may be incomplete |
| **cli_events** | Likely numeric | CLI analytics may fail |

### Already Correct (No Migration Needed)

| Collection | Format | Status |
|------------|--------|--------|
| **users** | Hash (with googleUserId) | ✅ Correct |
| **conversations** | Hash | ✅ Correct |
| **messages** | Hash (via conversationId) | ✅ Correct |
| **folders** | Hash | ✅ Correct |
| **agent_shares** | Hash | ✅ Correct |

---

## 🔍 Exhaustive Feature Analysis

### Features Using userId Queries

#### 1. ❌ **CRITICAL - Agent Context Loading**
**Files:**
- `src/pages/api/agents/[id]/context-count.ts`
- `src/pages/api/agents/[id]/context-sources.ts`
- `src/pages/api/conversations/[id]/context-sources-metadata.ts`

**Problem:** Queries `context_sources` with hash userId, but sources have numeric userId  
**Status:** ✅ Temporary fix applied (uses googleUserId), needs migration  
**Priority:** P0 - Already partially fixed

---

#### 2. ❌ **CRITICAL - RAG Search**
**Files:**
- `src/lib/rag-search.ts`
- `src/lib/bigquery-agent-search.ts`
- `src/lib/bigquery-optimized.ts`

**Problem:** Queries `document_chunks` with hash userId, but chunks have numeric userId  
**Status:** ✅ Temporary fix applied (uses googleUserId), needs migration  
**Priority:** P0 - Search functionality affected

---

#### 3. ⚠️ **HIGH - User Feedback System**
**Files:**
- `src/pages/api/feedback/my-feedback.ts`
- `src/pages/api/feedback/my-tickets.ts`
- `src/pages/api/feedback/sessions.ts`
- `src/pages/api/stella/feedback-tickets.ts`

**Problem:** May have numeric userId in feedback documents  
**Status:** 🔍 Needs investigation  
**Priority:** P1 - User-facing feature

---

#### 4. ⚠️ **HIGH - Message Queue**
**Files:**
- `src/pages/api/queue/index.ts`
- `src/pages/api/queue/bulk-add.ts`

**Problem:** Queue items may have numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P1 - Core functionality

---

#### 5. ⚠️ **MEDIUM - Analytics**
**Files:**
- `src/pages/api/analytics/salfagpt-stats.ts`
- `src/pages/api/analytics/user-details.ts`
- `src/pages/api/analytics/agents-conversations.ts`
- `src/pages/api/agent-metrics.ts`
- `src/pages/api/domains/stats.ts`
- `src/pages/api/domains/stats-optimized.ts`
- `src/mcp/usage-stats.ts`

**Problem:** May query with hash userId but have numeric data  
**Status:** 🔍 Some already handle both formats  
**Priority:** P2 - Analytics can tolerate some inaccuracy

---

#### 6. ⚠️ **MEDIUM - Expert Review System**
**Files:**
- `src/lib/expert-review/impact-attribution-service.ts`
- `src/lib/expert-review/experience-tracking-service.ts`
- `src/lib/expert-review/gamification-service.ts`
- `src/pages/api/expert-review/user-metrics.ts`

**Problem:** May use numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P2 - New feature, limited data

---

#### 7. ⚠️ **MEDIUM - Annotations**
**Files:**
- `src/pages/api/annotations/index.ts`
- `src/pages/api/feedback/stella-annotations.ts`

**Problem:** May use numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P2 - New feature

---

#### 8. ⚠️ **LOW - Tool Executions**
**Files:**
- `src/lib/tool-manager.ts`

**Problem:** May use numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P3 - Admin feature

---

#### 9. ⚠️ **LOW - CLI Events**
**Files:**
- `src/pages/api/cli/usage-stats.ts`

**Problem:** CLI events may have numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P3 - Operational data

---

#### 10. ⚠️ **LOW - Notifications & Onboarding**
**Files:**
- `src/lib/notifications.ts`
- `src/lib/feature-onboarding.ts`
- `src/lib/changelog.ts`

**Problem:** May use numeric userId  
**Status:** 🔍 Needs investigation  
**Priority:** P3 - UX enhancements

---

## 🚀 Migration Plan

### Phase 1: Data Migration (Critical - Execute First)

#### Step 1.1: Backup Everything
```bash
# Create complete Firestore backup
./scripts/create-complete-backup.sh --project=salfagpt

# Verify backup
gcloud firestore operations list --project=salfagpt
```

**Duration:** 30-45 minutes  
**Risk:** Low (backup only)

---

#### Step 1.2: Migrate context_sources Collection
```typescript
// scripts/migrate-context-sources-userid.ts
import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function migrateContextSources() {
  const USER_MAPPING = {
    '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw'
  };
  
  console.log('🔄 Migrating context_sources userId to hash format...');
  
  const batch = firestore.batch();
  let migrated = 0;
  
  for (const [googleId, hashId] of Object.entries(USER_MAPPING)) {
    const sourcesSnap = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', googleId)
      .get();
    
    console.log(`  Found ${sourcesSnap.size} sources with userId=${googleId}`);
    
    sourcesSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        userId: hashId,
        googleUserId: googleId, // Preserve for reference
        migratedAt: new Date()
      });
      migrated++;
      
      // Firestore batch limit is 500
      if (migrated % 500 === 0) {
        console.log(`  Committing batch (${migrated} so far)...`);
        await batch.commit();
      }
    });
  }
  
  if (migrated % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Migrated ${migrated} context sources`);
}

migrateContextSources().catch(console.error);
```

**Duration:** 5-10 minutes (884 sources)  
**Risk:** LOW - Additive migration (preserves googleUserId)  
**Rollback:** Restore from backup

---

#### Step 1.3: Migrate document_chunks Collection
```typescript
// scripts/migrate-document-chunks-userid.ts
async function migrateDocumentChunks() {
  const USER_MAPPING = {
    '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw'
  };
  
  console.log('🔄 Migrating document_chunks userId to hash format...');
  
  let migrated = 0;
  const BATCH_SIZE = 500;
  
  for (const [googleId, hashId] of Object.entries(USER_MAPPING)) {
    let lastDoc = null;
    
    while (true) {
      let query = firestore
        .collection('document_chunks')
        .where('userId', '==', googleId)
        .limit(BATCH_SIZE);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const chunksSnap = await query.get();
      if (chunksSnap.empty) break;
      
      const batch = firestore.batch();
      chunksSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          userId: hashId,
          googleUserId: googleId,
          migratedAt: new Date()
        });
        migrated++;
      });
      
      await batch.commit();
      console.log(`  Migrated ${migrated} chunks...`);
      
      lastDoc = chunksSnap.docs[chunksSnap.docs.length - 1];
    }
  }
  
  console.log(`✅ Migrated ${migrated} document chunks`);
}
```

**Duration:** 30-60 minutes (10,000+ chunks)  
**Risk:** MEDIUM - Large collection  
**Rollback:** Restore from backup

---

#### Step 1.4: Migrate Other Collections
```bash
# For each affected collection:
# - message_feedback
# - feedback_tickets
# - message_queue
# - user_sessions
# - usage_logs
# - cli_events

# Run verification script first:
npm run verify:userid-formats

# Then migrate:
npm run migrate:collection -- --collection=message_feedback --dry-run
npm run migrate:collection -- --collection=message_feedback
```

**Duration:** 5-10 minutes per collection  
**Risk:** LOW - Smaller collections  
**Rollback:** Per-collection backup

---

### Phase 2: Code Updates (Remove googleUserId Dependencies)

#### Step 2.1: Remove Temporary Fixes
Once data is migrated, remove the googleUserId workarounds from:

1. `src/pages/api/agents/[id]/context-count.ts`
2. `src/pages/api/agents/[id]/context-sources.ts`
3. `src/lib/rag-search.ts`
4. `src/lib/bigquery-agent-search.ts`
5. `src/lib/bigquery-optimized.ts`

**Pattern:**
```typescript
// ❌ REMOVE THIS (after migration)
const googleUserId = ownerUser?.googleUserId || effectiveUserId;
.where('userId', '==', googleUserId)

// ✅ SIMPLIFY TO THIS
.where('userId', '==', effectiveUserId)
```

---

#### Step 2.2: Update getUserById Function
Remove googleUserId fallback logic:

```typescript
// Current (with workaround)
const googleUserId = user.googleUserId || user.id;

// After migration (clean)
// Just use user.id (hash format everywhere)
```

---

#### Step 2.3: Add Validation
Add checks to prevent numeric userId from being written:

```typescript
// In firestore.ts
function validateUserId(userId: string) {
  if (/^\d+$/.test(userId)) {
    throw new Error('Invalid userId format - must use hash format (usr_xxx), not numeric Google ID');
  }
}

// Use in all write operations
export async function createContextSource(data: Partial<ContextSource>) {
  validateUserId(data.userId);
  // ... rest of function
}
```

---

### Phase 3: Testing & Verification

#### Step 3.1: Automated Tests
```bash
# Verify all collections use hash format
npm run verify:userid-formats

# Expected output:
# ✅ context_sources: 884/884 using hash format
# ✅ document_chunks: 10000/10000 using hash format
# ✅ message_feedback: X/X using hash format
# ✅ All collections migrated successfully
```

---

#### Step 3.2: Manual Testing Checklist

**Agent Context:**
- [ ] Open agent settings
- [ ] See correct document count
- [ ] Load documents successfully
- [ ] All assigned documents visible

**RAG Search:**
- [ ] Send message to agent with documents
- [ ] Verify RAG chunks are found
- [ ] Response includes relevant context
- [ ] Search logs show chunks found

**User Feedback:**
- [ ] View my feedback submissions
- [ ] Create new feedback
- [ ] See all my tickets

**Analytics:**
- [ ] User stats load correctly
- [ ] Domain stats include all users
- [ ] Agent metrics accurate

---

#### Step 3.3: Rollback Test
Before deploying to production:
- [ ] Test backup restore procedure
- [ ] Verify all data intact after restore
- [ ] Document rollback steps clearly

---

## 📋 Migration Scripts

### Script 1: Verification Script
```typescript
// scripts/verify-userid-formats.ts
import { firestore } from '../src/lib/firestore.js';

const COLLECTIONS_TO_CHECK = [
  'context_sources',
  'document_chunks',
  'message_feedback',
  'feedback_tickets',
  'message_queue',
  'user_sessions',
  'usage_logs',
  'cli_events',
  'agent_prompt_versions',
  'tool_executions',
];

async function verifyFormats() {
  console.log('🔍 Verifying userId formats across collections...\n');
  
  let totalIssues = 0;
  
  for (const collection of COLLECTIONS_TO_CHECK) {
    const snapshot = await firestore.collection(collection).limit(1000).get();
    
    const numericIds = snapshot.docs.filter(doc => {
      const userId = doc.data().userId;
      return userId && /^\d+$/.test(userId);
    });
    
    const hashIds = snapshot.docs.filter(doc => {
      const userId = doc.data().userId;
      return userId && /^usr_/.test(userId);
    });
    
    const status = numericIds.length === 0 ? '✅' : '❌';
    console.log(`${status} ${collection}:`);
    console.log(`   Total: ${snapshot.size}`);
    console.log(`   Hash format: ${hashIds.length}`);
    console.log(`   Numeric format: ${numericIds.length}`);
    
    if (numericIds.length > 0) {
      totalIssues += numericIds.length;
      const sample = numericIds[0].data();
      console.log(`   Sample numeric userId: ${sample.userId}`);
    }
    console.log('');
  }
  
  if (totalIssues === 0) {
    console.log('✅ ALL COLLECTIONS CLEAN - No migration needed');
  } else {
    console.log(`❌ Found ${totalIssues} documents with numeric userId - Migration required`);
  }
}

verifyFormats().catch(console.error);
```

---

### Script 2: Migration Script (Generic)
```typescript
// scripts/migrate-collection-userid.ts
import { firestore } from '../src/lib/firestore.js';

const USER_MAPPING = {
  '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw',
  // Add more mappings if multiple users affected
};

async function migrateCollection(collectionName: string, dryRun: boolean = true) {
  console.log(`🔄 Migrating ${collectionName} (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);
  
  let migrated = 0;
  const BATCH_SIZE = 500;
  
  for (const [googleId, hashId] of Object.entries(USER_MAPPING)) {
    console.log(`  Migrating userId: ${googleId} → ${hashId}`);
    
    let lastDoc = null;
    
    while (true) {
      let query = firestore
        .collection(collectionName)
        .where('userId', '==', googleId)
        .limit(BATCH_SIZE);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      if (snapshot.empty) break;
      
      console.log(`    Found ${snapshot.size} documents to migrate`);
      
      if (!dryRun) {
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            userId: hashId,
            googleUserId: googleId, // Preserve for reference
            migratedAt: new Date(),
            migrationVersion: '2025-11-15'
          });
        });
        
        await batch.commit();
      }
      
      migrated += snapshot.size;
      console.log(`    Progress: ${migrated} total`);
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }
  }
  
  console.log(`\n${dryRun ? '🔍 DRY RUN:' : '✅'} Would migrate ${migrated} documents`);
  return migrated;
}

// Usage:
const collectionName = process.argv[2];
const dryRun = process.argv[3] !== '--execute';

if (!collectionName) {
  console.error('Usage: npm run migrate:collection -- --collection=<name> [--execute]');
  process.exit(1);
}

migrateCollection(collectionName, dryRun).catch(console.error);
```

---

### Script 3: User Mapping Discovery
```typescript
// scripts/discover-userid-mappings.ts
import { firestore } from '../src/lib/firestore.js';

async function discoverMappings() {
  console.log('🔍 Discovering userId mappings...\n');
  
  // Get all users with googleUserId
  const usersSnap = await firestore.collection('users').get();
  
  const mappings: Record<string, string> = {};
  
  usersSnap.docs.forEach(doc => {
    const user = doc.data();
    if (user.googleUserId) {
      mappings[user.googleUserId] = doc.id;
      console.log(`  ${user.email}:`);
      console.log(`    Google ID: ${user.googleUserId}`);
      console.log(`    Hash ID: ${doc.id}`);
    }
  });
  
  console.log(`\n✅ Found ${Object.keys(mappings).length} user mappings`);
  console.log('\nGenerate this mapping:');
  console.log(JSON.stringify(mappings, null, 2));
  
  return mappings;
}

discoverMappings().catch(console.error);
```

---

## 📅 Execution Timeline

### Week 1: Preparation
- **Day 1:** Run verification script, document all affected collections
- **Day 2:** Test migration scripts in localhost
- **Day 3:** Create user mapping table
- **Day 4:** Review and approve plan
- **Day 5:** Buffer day

### Week 2: Migration Execution
- **Monday:** Backup production data
- **Tuesday:** Migrate context_sources (P0)
- **Wednesday:** Migrate document_chunks (P0)
- **Thursday:** Migrate feedback collections (P1)
- **Friday:** Migrate remaining collections (P2-P3)

### Week 3: Code Cleanup & Testing
- **Monday:** Remove googleUserId workarounds
- **Tuesday:** Add validation to prevent numeric IDs
- **Wednesday:** Comprehensive testing
- **Thursday:** Deploy to production
- **Friday:** Monitor and verify

---

## 🛡️ Risk Mitigation

### Safeguards

1. **Always dry-run first**
   ```bash
   npm run migrate:collection -- --collection=context_sources --dry-run
   ```

2. **Backup before each collection**
   ```bash
   gcloud firestore export gs://backup/collection-name-$(date +%Y%m%d)
   ```

3. **Preserve original data**
   - Keep `googleUserId` field
   - Add `migratedAt` timestamp
   - Add `migrationVersion` tag

4. **Verify after each collection**
   ```bash
   npm run verify:collection -- --collection=context_sources
   ```

5. **Progressive rollout**
   - Localhost first
   - Staging next (if available)
   - Production last

---

## ✅ Success Criteria

### Data Migration Complete When:
- [ ] All context_sources have hash userId
- [ ] All document_chunks have hash userId
- [ ] All feedback collections have hash userId
- [ ] Verification script shows 100% hash format
- [ ] No numeric userIds remain

### Code Cleanup Complete When:
- [ ] No googleUserId workarounds in queries
- [ ] Validation prevents numeric userId writes
- [ ] All tests pass
- [ ] Type check clean
- [ ] Production deployment successful

### User Impact Verified When:
- [ ] Agent context loads correctly (all agents)
- [ ] RAG search returns results
- [ ] User feedback loads correctly
- [ ] Analytics accurate
- [ ] No user complaints

---

## 📊 Estimated Impact

### Documents to Migrate
- context_sources: **884 documents**
- document_chunks: **~10,000-15,000 documents**
- Other collections: **~1,000-2,000 documents**
- **Total: ~12,000-18,000 documents**

### Duration
- **Data migration:** 2-3 hours total
- **Code cleanup:** 2-3 hours
- **Testing:** 4-6 hours
- **Total: 1-2 days** (with buffer)

### Downtime
- **Zero downtime migration** (additive updates)
- Queries work during migration (both formats supported)
- Code cleanup after migration complete

---

## 🔄 Rollback Plan

### If Migration Fails

**Step 1: Stop migration**
```bash
# Kill running migration script
Ctrl+C
```

**Step 2: Restore from backup**
```bash
gcloud firestore import gs://backup/pre-migration-20251115 --project=salfagpt
```

**Step 3: Revert code changes**
```bash
git revert <migration-commit>
git push origin main
```

**Step 4: Verify system functioning**
```bash
# Test critical paths
curl http://localhost:3000/api/agents/ID/context-count
# Should return data
```

---

## 📚 References

### Related Documentation
- `CONTEXT_SOURCE_USERID_MAPPING.md` - Original issue discovery
- `USERID_MAPPING_TABLE.md` - Complete mapping table
- `docs/fixes/agent-context-userid-mismatch-fix-2025-11-15.md` - Immediate fix
- `.cursor/rules/privacy.mdc` - User data isolation rules
- `.cursor/rules/multiusers.mdc` - Multi-user testing procedures

### Migration Resources
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore Backup/Restore](https://firebase.google.com/docs/firestore/manage-data/export-import)

---

## 🎯 Next Steps

1. **Immediate:** Test the temporary fix in localhost
2. **This Week:** Run verification script to audit all collections
3. **Next Week:** Execute migration for context_sources and document_chunks
4. **Following Week:** Clean up code and deploy to production

---

**Ready to proceed with migration when you approve! 🚀**


