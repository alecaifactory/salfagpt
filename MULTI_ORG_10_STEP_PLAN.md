# 🏢 Multi-Organization System - 10-Step Implementation Plan

**Created:** 2025-11-10  
**Status:** 🚀 Ready to Execute  
**Estimated Duration:** 5-6 weeks (206-261 hours)  
**Backward Compatible:** ✅ YES - All existing functionality preserved

---

## 🎯 Core Strategy

### Backward Compatibility Guarantee

**✅ ALL existing data works without modification:**
- Conversations without `organizationId` → User-level isolation (current behavior)
- Users without `organizationId` → Full access to their data (current behavior)
- Security rules remain user-centric → No breakage

**✅ NEW features are ADDITIVE:**
- `organizationId?: string` (optional on all collections)
- Organization-aware queries are NEW paths, not replacements
- Enhanced admin panels are NEW UI, existing UI unchanged

**✅ Migration is OPTIONAL:**
- System works perfectly without organizations
- Organizations enable multi-tenancy when needed
- Admin can migrate data progressively

---

## 📋 10-Step Plan

### **STEP 1: Enhanced Data Model (Additive Only)** ⏱️ 8-12 hours

**Objective:** Add organization fields to ALL collections WITHOUT breaking existing data

**Actions:**

1. **Update TypeScript Interfaces** (src/types/organizations.ts - NEW FILE)
   ```typescript
   // NEW: Expanded organization schema
   interface Organization {
     id: string;
     name: string;
     slug: string;
     domains: string[];              // MULTIPLE domains per org
     primaryDomain: string;
     admins: string[];               // Can manage entire org
     ownerUserId: string;            // Created by
     
     tenant: {
       type: 'dedicated' | 'saas' | 'self-hosted';
       gcpProjectId?: string;
       cloudRunService?: string;
       region?: string;
     };
     
     branding: {
       logo?: string;
       primaryColor: string;
       brandName: string;
     };
     
     evaluationConfig: {
       enabled: boolean;
       domainConfigs: Record<string, DomainEvalConfig>;
     };
     
     privacy: {
       encryptionEnabled: boolean;
       encryptionKeyId?: string;
     };
     
     // Versioning (Best Practice #1)
     version: number;
     lastModifiedIn: 'localhost' | 'staging' | 'production';
     stagingVersion?: number;
     productionVersion?: number;
     hasConflict?: boolean;
     
     // Promotion tracking (Best Practice #7)
     promotedFromStaging?: boolean;
     promotedAt?: Date;
     stagingId?: string;
     
     isActive: boolean;
     createdAt: Date;
     updatedAt: Date;
     source: 'localhost' | 'staging' | 'production';
   }
   ```

2. **Add organizationId to existing interfaces** (src/types/*.ts)
   ```typescript
   // ✅ ADDITIVE - All optional fields
   interface Conversation {
     // ... existing fields ...
     organizationId?: string;        // NEW: Optional org reference
     version?: number;                // NEW: Conflict detection
     lastModifiedIn?: DataSource;     // NEW: Staging/prod tracking
     stagingVersion?: number;         // NEW: Staging sync
     productionVersion?: number;      // NEW: Production sync
     hasConflict?: boolean;           // NEW: Conflict flag
   }
   
   interface User {
     // ... existing fields ...
     organizationId?: string;         // NEW: Primary org
     assignedOrganizations?: string[]; // NEW: Multi-org access
     domainId?: string;               // NEW: Specific domain
   }
   
   interface ContextSource {
     // ... existing fields ...
     organizationId?: string;         // NEW: Org isolation
     version?: number;                // NEW: Versioning
   }
   ```

3. **Update DataSource type** (expand from 2 → 3 sources)
   ```typescript
   // Before: type DataSource = 'localhost' | 'production';
   // After:
   type DataSource = 'localhost' | 'staging' | 'production';
   ```

**Deliverables:**
- ✅ `src/types/organizations.ts` (NEW)
- ✅ Updated `src/types/users.ts` (additive)
- ✅ Updated `src/types/conversations.ts` (additive)
- ✅ Updated `src/types/context-sources.ts` (additive)

**Testing:**
```bash
npm run type-check  # Must pass with 0 errors
# Existing code continues to compile
```

**Backward Compatibility:**
- ✅ All new fields are optional (`field?: type`)
- ✅ No fields removed
- ✅ No field types changed
- ✅ Existing code compiles without changes

---

### **STEP 2: Firestore Schema Migration** ⏱️ 6-8 hours

**Objective:** Add new collections and indexes WITHOUT disrupting existing data

**Actions:**

1. **Create new collections** (Firestore Console or gcloud)
   ```javascript
   // NEW collections (no impact on existing):
   - organizations          // Org configurations
   - promotion_requests     // Staging → production workflow
   - promotion_snapshots    // Rollback capability  
   - data_lineage          // Tracking data journey
   - conflict_resolutions  // Manual conflict handling
   ```

2. **Update firestore.indexes.json** (ADDITIVE ONLY)
   ```json
   {
     "indexes": [
       // ... existing indexes (preserve ALL) ...
       
       // NEW: Organization-scoped queries
       {
         "collectionGroup": "conversations",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "organizationId", "order": "ASCENDING" },
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
         ]
       },
       {
         "collectionGroup": "users",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "organizationId", "order": "ASCENDING" },
           { "fieldPath": "isActive", "order": "ASCENDING" }
         ]
       },
       {
         "collectionGroup": "context_sources",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "organizationId", "order": "ASCENDING" },
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "addedAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

3. **Deploy indexes** (non-breaking)
   ```bash
   firebase deploy --only firestore:indexes --project salfagpt
   # Existing indexes remain, new ones build in background
   ```

**Deliverables:**
- ✅ Updated `firestore.indexes.json`
- ✅ New collections created
- ✅ Indexes deployed (READY state)

**Testing:**
```bash
# Verify existing queries still work
curl "http://localhost:3000/api/conversations?userId=TEST_USER_ID"
# Should return conversations (unaffected)

# Verify new indexes building
gcloud firestore indexes composite list --project=salfagpt
```

**Backward Compatibility:**
- ✅ Existing indexes unchanged
- ✅ Existing queries unaffected
- ✅ New collections isolated
- ✅ Zero downtime

---

### **STEP 3: Backend Library - Organization Management** ⏱️ 12-16 hours

**Objective:** Create org management functions WITHOUT modifying existing functions

**Actions:**

1. **Create src/lib/organizations.ts** (NEW FILE)
   ```typescript
   // Complete CRUD for organizations
   export async function createOrganization(data: CreateOrgInput): Promise<Organization>
   export async function getOrganization(orgId: string): Promise<Organization | null>
   export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void>
   export async function deleteOrganization(orgId: string): Promise<void>
   export async function listOrganizations(): Promise<Organization[]>
   
   // Multi-domain support
   export async function addDomainToOrganization(orgId: string, domain: string): Promise<void>
   export async function removeDomainFromOrganization(orgId: string, domain: string): Promise<void>
   export async function getOrganizationByDomain(domain: string): Promise<Organization | null>
   
   // Admin management
   export async function addOrgAdmin(orgId: string, userId: string): Promise<void>
   export async function removeOrgAdmin(orgId: string, userId: string): Promise<void>
   export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean>
   
   // Hierarchy validation (Best Practice #6)
   export async function validateUserInOrganization(userId: string, orgId: string): Promise<boolean>
   export async function validateDomainInOrganization(domain: string, orgId: string): Promise<boolean>
   ```

2. **Create src/lib/promotion.ts** (NEW FILE)
   ```typescript
   // Promotion workflow functions
   export async function createPromotionRequest(data: PromotionRequestInput): Promise<PromotionRequest>
   export async function approvePromotion(requestId: string, approverId: string): Promise<void>
   export async function rejectPromotion(requestId: string, approverId: string, reason: string): Promise<void>
   export async function executePromotion(requestId: string): Promise<void>
   export async function rollbackPromotion(snapshotId: string): Promise<void>
   
   // Conflict detection (Best Practice #1)
   export async function detectConflicts(stagingId: string, productionId: string): Promise<Conflict[]>
   export async function resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>
   ```

3. **ENHANCE (not replace) src/lib/firestore.ts**
   ```typescript
   // ADD new org-scoped variants (don't modify existing)
   export async function getConversationsByOrganization(
     orgId: string, 
     userId?: string  // Optional - for admin viewing all org data
   ): Promise<Conversation[]> {
     // NEW function, existing getConversations(userId) unchanged
   }
   
   export async function getUsersByOrganization(orgId: string): Promise<User[]> {
     // NEW function, existing getUser(userId) unchanged
   }
   ```

**Deliverables:**
- ✅ `src/lib/organizations.ts` (NEW - ~400 lines)
- ✅ `src/lib/promotion.ts` (NEW - ~300 lines)
- ✅ Enhanced `src/lib/firestore.ts` (additive - +200 lines)

**Testing:**
```typescript
// Test org creation
const org = await createOrganization({
  name: 'Test Org',
  domains: ['test.com'],
  ownerUserId: 'user-123'
});
console.log('✅ Organization created:', org.id);

// Test existing functions still work
const convs = await getConversations('user-123');
console.log('✅ Existing function works:', convs.length);
```

**Backward Compatibility:**
- ✅ All existing functions UNCHANGED
- ✅ New functions are ADDITIONS
- ✅ No breaking changes to API contracts

---

### **STEP 4: Update Firestore Security Rules** ⏱️ 6-8 hours

**Objective:** Add org-level security WITHOUT breaking user-level security

**Actions:**

1. **Enhance firestore.rules** (ADDITIVE)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       // Helper functions (ENHANCED, not replaced)
       function isAuthenticated() {
         return request.auth != null;
       }
       
       function isOwner(userId) {
         return request.auth.uid == userId;
       }
       
       function isAdmin() {
         return isAuthenticated() && 
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // NEW: Organization access helpers
       function isSuperAdmin() {
         return isAuthenticated() && 
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
       }
       
       function isOrgAdmin(orgId) {
         let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
         return user.role == 'admin' && 
                (user.organizationId == orgId || 
                 (user.assignedOrganizations != null && user.assignedOrganizations.hasAny([orgId])));
       }
       
       function userCanAccessOrg(orgId) {
         return isSuperAdmin() || isOrgAdmin(orgId);
       }
       
       // ENHANCED: Conversations (backward compatible + org-aware)
       match /conversations/{conversationId} {
         allow read: if isAuthenticated() && (
           // EXISTING: User owns conversation (backward compatible)
           resource.data.userId == request.auth.uid ||
           
           // NEW: Org admin can view (if organizationId exists)
           (exists(resource.data.organizationId) && userCanAccessOrg(resource.data.organizationId))
         );
         
         allow create: if isAuthenticated() && (
           // EXISTING: User creates for themselves
           request.resource.data.userId == request.auth.uid
         );
         
         allow update, delete: if isAuthenticated() && (
           // EXISTING: User owns conversation
           resource.data.userId == request.auth.uid ||
           
           // NEW: Org admin can manage
           (exists(resource.data.organizationId) && userCanAccessOrg(resource.data.organizationId))
         );
       }
       
       // Similar patterns for messages, context_sources, etc.
       
       // NEW: Organizations collection
       match /organizations/{orgId} {
         allow read: if isAuthenticated() && userCanAccessOrg(orgId);
         allow create: if isSuperAdmin();
         allow update: if isSuperAdmin() || isOrgAdmin(orgId);
         allow delete: if isSuperAdmin();
       }
       
       // NEW: Promotion workflow collections
       match /promotion_requests/{requestId} {
         allow read: if isSuperAdmin() || isOrgAdmin(resource.data.organizationId);
         allow create: if isOrgAdmin(resource.data.organizationId);
         allow update: if isSuperAdmin();
       }
     }
   }
   ```

2. **TEST rules with emulator**
   ```bash
   firebase emulators:start --only firestore
   # Run test suite against emulator
   # Verify existing user-level access works
   # Verify new org-level access works
   ```

**Deliverables:**
- ✅ Updated `firestore.rules` (enhanced)
- ✅ Test results (all passing)
- ✅ Documentation of new rules

**Backward Compatibility:**
- ✅ All existing user-level rules PRESERVED
- ✅ New org-level rules are ADDITIONS
- ✅ Existing data access unaffected

---

### **STEP 5: Staging Mirror Infrastructure** ⏱️ 12-16 hours

**Objective:** Create complete staging environment as exact mirror of production

**Actions:**

1. **Create salfagpt-staging project setup script**
   ```bash
   # scripts/create-staging-mirror.sh
   #!/bin/bash
   # Complete staging infrastructure setup
   # - Creates GCP project
   # - Sets up Firestore in us-east4
   # - Copies production data (READ-ONLY)
   # - Deploys Cloud Run service
   # - Sets up promotion collections
   ```

2. **Implement source tagging enhancement**
   ```typescript
   // Update getEnvironmentSource() in firestore.ts
   export function getEnvironmentSource(): DataSource {
     // Detect from K_SERVICE or ENV var
     if (process.env.ENVIRONMENT_NAME === 'staging') return 'staging';
     if (process.env.K_SERVICE?.includes('staging')) return 'staging';
     
     // Existing logic for localhost/production
     return isLocalhost() ? 'localhost' : 'production';
   }
   ```

3. **Create read-only production access** (Best Practice #4)
   ```typescript
   // src/lib/staging-sync.ts (NEW)
   export async function syncFromProduction(): Promise<void> {
     // Read-only access to production Firestore
     // Periodic sync to keep staging current
     // Conflict detection before promotion
   }
   ```

**Deliverables:**
- ✅ `scripts/create-staging-mirror.sh` (production-ready)
- ✅ Enhanced source tagging (3 sources)
- ✅ `src/lib/staging-sync.ts` (NEW)
- ✅ Staging environment fully operational

**Backward Compatibility:**
- ✅ Production UNAFFECTED (read-only access)
- ✅ Existing localhost continues working
- ✅ New staging environment isolated

---

### **STEP 6: Migration Script (Idempotent & Safe)** ⏱️ 16-20 hours

**Objective:** Script to migrate existing data to org model (OPTIONAL, non-breaking)

**Actions:**

1. **Create migration script** (scripts/migrate-to-multi-org.ts)
   ```typescript
   /**
    * IDEMPOTENT: Safe to run multiple times
    * NON-DESTRUCTIVE: Only adds fields, never removes
    * REVERSIBLE: Can undo if needed
    */
   export async function migrateToMultiOrg(options: {
     dryRun?: boolean;           // Preview changes only
     organizationId: string;     // Target org
     domains: string[];          // Domains to include
     batchSize?: number;         // Chunk size (default: 100)
   }): Promise<MigrationReport> {
     // 1. Validation
     // 2. User filtering by domain
     // 3. Conversation assignment
     // 4. Context source assignment
     // 5. Audit trail
     // 6. Rollback preparation
   }
   ```

2. **Add migration validation** (Best Practice #6)
   ```typescript
   // Validate before migration:
   // - All target users exist
   // - Domains are valid
   // - No circular references
   // - No conflicts
   ```

3. **Create rollback mechanism**
   ```typescript
   export async function rollbackMigration(snapshotId: string): Promise<void> {
     // Restore pre-migration state
     // Remove organizationId from all affected documents
   }
   ```

**Deliverables:**
- ✅ `scripts/migrate-to-multi-org.ts` (NEW - ~500 lines)
- ✅ Validation logic
- ✅ Rollback capability
- ✅ Migration report generator

**Testing:**
```bash
# Dry run first
npm run migrate:dry-run -- \
  --org="salfa-corp" \
  --domains="salfagestion.cl,salfa.cl"

# Actual migration (staging only)
npm run migrate:execute -- \
  --org="salfa-corp" \
  --domains="salfagestion.cl,salfa.cl" \
  --env=staging
```

**Backward Compatibility:**
- ✅ DRY RUN mode prevents accidents
- ✅ Rollback available
- ✅ Only adds fields (never removes)
- ✅ Un-migrated data continues working

---

### **STEP 7: Backend API Enhancements** ⏱️ 18-24 hours

**Objective:** Add org-aware API endpoints WITHOUT breaking existing ones

**Actions:**

1. **Create NEW org management APIs**
   ```typescript
   // src/pages/api/organizations/index.ts (NEW)
   export const GET: APIRoute  // List orgs (superadmin/org-admin only)
   export const POST: APIRoute // Create org (superadmin only)
   
   // src/pages/api/organizations/[id].ts (NEW)
   export const GET: APIRoute    // Get org details
   export const PUT: APIRoute    // Update org
   export const DELETE: APIRoute // Delete org (superadmin only)
   
   // src/pages/api/organizations/[id]/users.ts (NEW)
   export const GET: APIRoute  // List org users
   export const POST: APIRoute // Add user to org
   
   // src/pages/api/organizations/[id]/stats.ts (NEW)
   export const GET: APIRoute  // Org analytics
   ```

2. **ADD org-scoped variants to existing APIs** (don't replace)
   ```typescript
   // src/pages/api/conversations/index.ts (ENHANCED)
   export const GET: APIRoute = async ({ request, cookies }) => {
     const session = getSession({ cookies });
     if (!session) return unauthorized();
     
     const url = new URL(request.url);
     const userId = url.searchParams.get('userId');
     const orgId = url.searchParams.get('organizationId'); // NEW: Optional
     
     // EXISTING path (backward compatible)
     if (userId && !orgId) {
       // Verify ownership (existing logic)
       if (session.id !== userId) return forbidden();
       return getConversations(userId);
     }
     
     // NEW path (org-scoped)
     if (orgId) {
       // Verify org access
       if (!await canAccessOrg(session.id, orgId)) return forbidden();
       
       // Return all org conversations (filtered by userId if not admin)
       return getConversationsByOrganization(orgId, session.role === 'admin' ? undefined : session.id);
     }
     
     return badRequest('Missing userId or organizationId');
   };
   ```

3. **Create promotion workflow APIs**
   ```typescript
   // src/pages/api/promotions/index.ts (NEW)
   export const GET: APIRoute  // List pending promotions
   export const POST: APIRoute // Create promotion request
   
   // src/pages/api/promotions/[id]/approve.ts (NEW)
   export const POST: APIRoute // Approve promotion
   
   // src/pages/api/promotions/[id]/reject.ts (NEW)
   export const POST: APIRoute // Reject promotion
   ```

**Deliverables:**
- ✅ NEW API endpoints (15+ new files)
- ✅ ENHANCED existing endpoints (backward compatible)
- ✅ Complete API documentation

**Testing:**
```bash
# Test existing API (unchanged)
curl "http://localhost:3000/api/conversations?userId=user-123"
# Should work exactly as before

# Test new org API
curl "http://localhost:3000/api/organizations" \
  -H "Cookie: flow_session=ADMIN_TOKEN"
# Should return organizations list
```

**Backward Compatibility:**
- ✅ All existing API paths UNCHANGED
- ✅ New paths are ADDITIONS
- ✅ Query parameters are OPTIONAL
- ✅ Existing clients unaffected

---

### **STEP 8: Promotion Workflow Implementation** ⏱️ 14-18 hours

**Objective:** Build staging-to-production promotion system

**Actions:**

1. **Implement promotion request system**
   ```typescript
   // Create request when admin wants to promote
   const request = await createPromotionRequest({
     organizationId: 'salfa-corp',
     resourceType: 'agent',
     resourceId: 'agent-123',
     source: 'staging',
     destination: 'production',
     requestedBy: adminUserId,
     changes: detectChanges(stagingDoc, productionDoc)
   });
   ```

2. **Implement approval workflow** (Best Practice #7)
   ```typescript
   // Two-stage approval
   // Stage 1: Org admin approves
   await approvePromotion(requestId, orgAdminId);
   
   // Stage 2: SuperAdmin approves
   await approvePromotion(requestId, superAdminId);
   
   // Both required before execution
   if (request.approvals.length >= 2) {
     await executePromotion(requestId);
   }
   ```

3. **Implement conflict detection** (Best Practice #1)
   ```typescript
   // Before promotion, check versions
   const stagingDoc = await getStagingDocument(id);
   const prodDoc = await getProductionDocument(id);
   
   if (stagingDoc.productionVersion !== prodDoc.version) {
     // CONFLICT: Production was modified since staging branched
     flagConflict(id);
     notifyAdmins(id);
   }
   ```

4. **Implement snapshot system** (Best Practice #10)
   ```typescript
   // Before each promotion, create snapshot
   const snapshot = await createPromotionSnapshot({
     requestId,
     timestamp: new Date(),
     stagingState: stagingDoc,
     productionState: prodDoc,
     changes: diff(stagingDoc, prodDoc)
   });
   
   // Enable rollback
   export async function rollbackToSnapshot(snapshotId: string) {
     const snapshot = await getSnapshot(snapshotId);
     await restoreState(snapshot.productionState);
   }
   ```

**Deliverables:**
- ✅ `src/lib/promotion-workflow.ts` (NEW - ~400 lines)
- ✅ Snapshot system (NEW)
- ✅ Conflict detection (NEW)
- ✅ Approval workflow (NEW)

**Testing:**
```bash
# Test in staging
1. Modify agent in staging
2. Create promotion request
3. Admin approves
4. SuperAdmin approves
5. Promotion executes
6. Verify production updated
7. Test rollback
```

**Backward Compatibility:**
- ✅ Production unchanged until explicit promotion
- ✅ Staging isolated from production
- ✅ Rollback capability for safety

---

### **STEP 9: Frontend - SuperAdmin Organization Dashboard** ⏱️ 20-26 hours

**Objective:** Create org management UI for SuperAdmin (NEW component, no changes to existing)

**Actions:**

1. **Create src/components/OrganizationManagementDashboard.tsx** (NEW)
   ```typescript
   /**
    * SuperAdmin-only dashboard for managing all organizations
    * NEW COMPONENT - does not modify existing UI
    */
   export default function OrganizationManagementDashboard() {
     // List all organizations
     // Create new organization
     // Edit organization
     // Manage domains
     // Manage admins
     // View org analytics
   }
   ```

2. **Add to AdminPanel.tsx** (ADDITIVE)
   ```typescript
   // In AdminPanel.tsx, add new tab
   {currentUser?.role === 'superadmin' && (
     <Tab>
       <TabButton onClick={() => setActiveTab('organizations')}>
         🏢 Organizations
       </TabButton>
     </Tab>
   )}
   
   {activeTab === 'organizations' && (
     <OrganizationManagementDashboard />
   )}
   ```

3. **Create OrganizationConfigModal.tsx** (NEW)
   ```typescript
   // 7-tab modal for full org configuration
   // - General (name, domains)
   // - Admins (manage org admins)
   // - Branding (logo, colors)
   // - Evaluation (domain configs)
   // - Privacy (encryption)
   // - Limits (quotas)
   // - Advanced (tenant config)
   ```

**Deliverables:**
- ✅ `src/components/OrganizationManagementDashboard.tsx` (NEW - ~800 lines)
- ✅ `src/components/OrganizationConfigModal.tsx` (NEW - ~600 lines)
- ✅ Enhanced `src/components/AdminPanel.tsx` (+50 lines)

**Testing:**
```bash
# Login as superadmin
# Navigate to Admin Panel
# Click "Organizations" tab
# Verify:
- List organizations
- Create new org
- Edit org
- All existing admin features still work
```

**Backward Compatibility:**
- ✅ NEW components only
- ✅ Existing AdminPanel unchanged (only enhanced)
- ✅ Non-superadmin users see no changes

---

### **STEP 10: Frontend - Org-Scoped Admin Views** ⏱️ 18-22 hours

**Objective:** Scope existing admin views to organization (for org admins)

**Actions:**

1. **Create useOrganizationScope hook** (NEW)
   ```typescript
   // src/hooks/useOrganizationScope.ts (NEW)
   export function useOrganizationScope() {
     const { currentUser } = useAuth();
     const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
     
     // Load user's primary organization
     useEffect(() => {
       if (currentUser?.organizationId) {
         loadOrganization(currentUser.organizationId)
           .then(setCurrentOrg);
       }
     }, [currentUser]);
     
     // Filter functions
     const filterByOrg = useCallback(<T extends { organizationId?: string }>(items: T[]) => {
       if (currentUser?.role === 'superadmin') return items; // See all
       if (!currentOrg) return items.filter(i => !i.organizationId); // Backward compat
       return items.filter(i => i.organizationId === currentOrg.id);
     }, [currentUser, currentOrg]);
     
     return { currentOrg, filterByOrg, isOrgAdmin: !!currentOrg };
   }
   ```

2. **Update ChatInterfaceWorking.tsx** (MINIMAL changes)
   ```typescript
   // ONLY for org admins viewing org data
   const { filterByOrg } = useOrganizationScope();
   
   // Apply filter to conversations (if org admin)
   const displayConversations = currentUser?.role === 'admin' 
     ? filterByOrg(conversations)
     : conversations; // EXISTING behavior for users
   ```

3. **Create OrgSelector component** (NEW - for admins with multiple orgs)
   ```typescript
   // Dropdown to switch between assigned organizations
   // Only visible for multi-org admins
   ```

**Deliverables:**
- ✅ `src/hooks/useOrganizationScope.ts` (NEW - ~150 lines)
- ✅ `src/components/OrgSelector.tsx` (NEW - ~200 lines)
- ✅ MINIMAL updates to ChatInterfaceWorking.tsx (~20 lines)

**Testing:**
```bash
# Test as regular user (no org)
# - See all their conversations (unchanged)

# Test as org admin
# - See only org conversations
# - Can switch orgs if assigned to multiple

# Test as superadmin
# - See all organizations
# - Can switch between orgs
```

**Backward Compatibility:**
- ✅ Regular users see NO changes
- ✅ Admins without orgs work as before
- ✅ Org features only activate if org assigned

---

### **STEP 7: Promotion UI** ⏱️ 16-20 hours

**Objective:** Build UI for staging-to-production promotion workflow

**Actions:**

1. **Create PromotionRequestModal.tsx** (NEW)
   ```typescript
   // Modal to create promotion request
   // - Select what to promote (agents, context, config)
   // - Preview changes (diff view)
   // - Submit for approval
   ```

2. **Create PromotionApprovalDashboard.tsx** (NEW)
   ```typescript
   // Dashboard for admins to review/approve promotions
   // - Pending requests
   // - Change preview
   // - Conflict alerts
   // - Approve/reject buttons
   // - Execution status
   ```

3. **Create ConflictResolutionModal.tsx** (NEW)
   ```typescript
   // UI for resolving staging/production conflicts
   // - Side-by-side diff
   // - Choose staging/production/merge
   // - Apply resolution
   ```

**Deliverables:**
- ✅ `src/components/PromotionRequestModal.tsx` (NEW - ~400 lines)
- ✅ `src/components/PromotionApprovalDashboard.tsx` (NEW - ~600 lines)
- ✅ `src/components/ConflictResolutionModal.tsx` (NEW - ~300 lines)

**Testing:**
```bash
# In staging:
1. Modify agent
2. Click "Request Promotion"
3. Fill form, submit
4. Verify request created

# In production (as admin):
1. Open Promotion Dashboard
2. See pending request
3. Review changes
4. Approve/reject

# Conflict scenario:
1. Modify same agent in staging and production
2. Create promotion request
3. Verify conflict detected
4. Open resolution modal
5. Resolve conflict
```

**Backward Compatibility:**
- ✅ NEW components only
- ✅ No changes to existing workflow
- ✅ Promotion is opt-in feature

---

### **STEP 8: KMS Encryption Integration** ⏱️ 12-16 hours

**Objective:** Implement per-organization encryption (Best Practice #8)

**Actions:**

1. **Create src/lib/encryption.ts** (NEW)
   ```typescript
   import { KeyManagementServiceClient } from '@google-cloud/kms';
   
   const kms = new KeyManagementServiceClient();
   
   // Per-org encryption
   export async function encryptForOrganization(
     plaintext: string,
     orgId: string
   ): Promise<string> {
     const org = await getOrganization(orgId);
     if (!org.privacy.encryptionEnabled) return plaintext;
     
     const keyName = org.privacy.encryptionKeyId;
     const [result] = await kms.encrypt({
       name: keyName,
       plaintext: Buffer.from(plaintext),
     });
     
     return result.ciphertext.toString('base64');
   }
   
   export async function decryptForOrganization(
     ciphertext: string,
     orgId: string
   ): Promise<string> {
     // Similar decrypt logic
   }
   ```

2. **Integrate with firestore.ts** (ADDITIVE)
   ```typescript
   // When saving org data
   export async function createContextSource(
     userId: string, 
     data: Partial<ContextSource>
   ): Promise<ContextSource> {
     // EXISTING logic ...
     
     // NEW: Encrypt if org requires it
     if (data.organizationId) {
       const org = await getOrganization(data.organizationId);
       if (org?.privacy.encryptionEnabled && data.extractedData) {
         data.extractedData = await encryptForOrganization(
           data.extractedData,
           data.organizationId
         );
         data.encrypted = true; // NEW field
       }
     }
     
     // EXISTING save logic ...
   }
   ```

3. **Create KMS key rings per organization**
   ```bash
   # scripts/setup-org-encryption.sh
   # Create key ring for each organization
   # Grant decrypt permission to service account
   ```

**Deliverables:**
- ✅ `src/lib/encryption.ts` (NEW - ~200 lines)
- ✅ Enhanced firestore.ts (encryption integration)
- ✅ `scripts/setup-org-encryption.sh` (NEW)

**Testing:**
```bash
# Create org with encryption enabled
# Upload context source
# Verify encrypted in Firestore (base64)
# Retrieve source
# Verify decrypted correctly
```

**Backward Compatibility:**
- ✅ Encryption is OPTIONAL (per org)
- ✅ Existing data remains unencrypted (works as before)
- ✅ NEW data encrypted only if org enables it

---

### **STEP 9: Data Lineage & Audit Trail** ⏱️ 10-14 hours

**Objective:** Track data journey from staging to production (Best Practice #9)

**Actions:**

1. **Create lineage tracking**
   ```typescript
   // src/lib/data-lineage.ts (NEW)
   export async function trackLineage(event: {
     documentId: string;
     collection: string;
     action: 'created' | 'updated' | 'promoted' | 'deleted';
     source: DataSource;
     organizationId?: string;
     performedBy: string;
     changes?: any;
   }): Promise<void> {
     await firestore.collection('data_lineage').add({
       ...event,
       timestamp: new Date(),
     });
   }
   ```

2. **Integrate with all write operations**
   ```typescript
   // In firestore.ts, add to all create/update/delete
   export async function createConversation(/* ... */) {
     const conv = await firestore.collection('conversations').add({/* ... */});
     
     // NEW: Track lineage
     await trackLineage({
       documentId: conv.id,
       collection: 'conversations',
       action: 'created',
       source: getEnvironmentSource(),
       organizationId: data.organizationId,
       performedBy: userId
     });
     
     return conv;
   }
   ```

3. **Create lineage query APIs**
   ```typescript
   // Get document history
   export async function getDocumentLineage(
     collection: string,
     documentId: string
   ): Promise<LineageEvent[]>
   
   // Get organization lineage
   export async function getOrganizationLineage(
     orgId: string,
     startDate?: Date,
     endDate?: Date
   ): Promise<LineageEvent[]>
   ```

**Deliverables:**
- ✅ `src/lib/data-lineage.ts` (NEW - ~250 lines)
- ✅ Integrated tracking in all write operations
- ✅ Lineage query APIs

**Testing:**
```bash
# Create document
# Check lineage
# Update document
# Check lineage shows both events
# Promote to production
# Check lineage shows promotion
```

**Backward Compatibility:**
- ✅ Lineage tracking is NON-BLOCKING
- ✅ Failures don't affect main operations
- ✅ Existing operations unaffected

---

### **STEP 10: Comprehensive Testing & Documentation** ⏱️ 24-32 hours

**Objective:** Verify everything works, document everything

**Actions:**

1. **Create test suite**
   ```typescript
   // __tests__/multi-org/
   // - organization-crud.test.ts
   // - user-organization-isolation.test.ts
   // - promotion-workflow.test.ts
   // - conflict-detection.test.ts
   // - backward-compatibility.test.ts
   // - evaluation-org-scoping.test.ts
   ```

2. **Execute comprehensive testing checklist**
   ```markdown
   ### Security Tests
   - [ ] Admin in Org A cannot see Org B data
   - [ ] Supervisors only see assigned org/domain
   - [ ] Especialistas only see their org assignments
   - [ ] SuperAdmin can see all orgs
   - [ ] Firestore rules enforce boundaries
   
   ### Functionality Tests
   - [ ] Create organization (superadmin)
   - [ ] Add users to organization
   - [ ] Multi-domain organization works
   - [ ] Evaluation system respects org boundaries
   - [ ] Branding customization works
   
   ### Staging-Production Tests
   - [ ] Staging mirror exact copy of production
   - [ ] All data tagged with source='staging'
   - [ ] Promotion requires dual approval
   - [ ] Conflicts detected correctly
   - [ ] Rollback works
   
   ### Backward Compatibility Tests
   - [ ] Existing users without org work normally
   - [ ] Existing conversations load correctly
   - [ ] Existing APIs unchanged
   - [ ] Un-migrated data functions perfectly
   - [ ] Zero production downtime
   - [ ] Zero data loss
   ```

3. **Create comprehensive documentation**
   ```markdown
   # Documentation to Create:
   
   ## For Developers
   - MULTI_ORG_ARCHITECTURE.md
   - PROMOTION_WORKFLOW_GUIDE.md
   - ORG_ADMIN_GUIDE.md
   - MIGRATION_RUNBOOK.md
   
   ## For SuperAdmins
   - ORGANIZATION_SETUP.md
   - DOMAIN_MANAGEMENT.md
   - USER_ASSIGNMENT.md
   
   ## For Org Admins  
   - ORG_ADMIN_DASHBOARD.md
   - EVALUATION_MANAGEMENT.md
   - ANALYTICS_GUIDE.md
   
   ## Updated Rules
   - .cursor/rules/organizations.mdc (NEW)
   - Updated data.mdc (org collections)
   - Updated privacy.mdc (org isolation)
   ```

**Deliverables:**
- ✅ Complete test suite (15+ test files)
- ✅ All tests passing
- ✅ Comprehensive documentation (8+ guides)
- ✅ Updated cursor rules

**Testing:**
```bash
# Run full test suite
npm run test:multi-org

# Manual UAT with admin (sorellanac@)
# - Create test organization
# - Assign users
# - Test evaluation workflow
# - Test promotion workflow
# - Verify no impact on existing users
```

**Backward Compatibility:**
- ✅ All existing tests still pass
- ✅ New tests verify new functionality
- ✅ Documentation explains migration path

---

## 📊 Implementation Timeline

### Week 1: Foundation
- **Day 1-2:** Step 1 (Data Model)
- **Day 3:** Step 2 (Firestore Schema)
- **Day 4-5:** Step 3 (Backend Library)

### Week 2: Infrastructure
- **Day 6:** Step 4 (Security Rules)
- **Day 7-9:** Step 5 (Staging Mirror)
- **Day 10:** Step 6 (Migration Script) - start

### Week 3: Backend & Promotion
- **Day 11-12:** Step 6 (Migration Script) - complete
- **Day 13-15:** Step 7 (Backend APIs)
- **Day 16-17:** Step 8 (Promotion Workflow)

### Week 4-5: Frontend
- **Day 18-20:** Step 9 (SuperAdmin Dashboard)
- **Day 21-23:** Step 10 (Org-Scoped Views)
- **Day 24-25:** Step 10 (Promotion UI)

### Week 6: Testing & Launch
- **Day 26-28:** Step 10 (Comprehensive Testing)
- **Day 29:** UAT with admin (sorellanac@)
- **Day 30:** Production deployment

---

## ✅ Success Criteria

### Must Pass Before Production:

**Security** ✅
- [ ] Admin in Org A sees ZERO data from Org B
- [ ] Firestore rules enforce org boundaries
- [ ] KMS encryption works per org
- [ ] Audit trail complete

**Functionality** ✅
- [ ] SuperAdmin can create/manage orgs
- [ ] Admins scoped to their orgs
- [ ] Multi-domain orgs work
- [ ] Evaluation system org-aware
- [ ] Promotion workflow complete

**Backward Compatibility** ✅
- [ ] Existing users work unchanged
- [ ] Un-migrated data functions
- [ ] All existing APIs work
- [ ] Zero data loss
- [ ] Zero downtime

**Quality** ✅
- [ ] All tests pass (existing + new)
- [ ] Type check: 0 errors
- [ ] Documentation complete
- [ ] Admin UAT approved

---

## 🚨 Risk Mitigation

### Risk 1: Production Data Corruption
**Mitigation:**
- All development in staging FIRST
- Migration is OPTIONAL (additive)
- Dry-run mode for all operations
- Snapshot system for rollback
- SuperAdmin approval required

### Risk 2: Evaluation System Breaking
**Mitigation:**
- Evaluation logic ENHANCED, not replaced
- Domain-org mapping validated
- Backward compatible evaluation queries
- Test with real Salfa data in staging

### Risk 3: Performance Degradation
**Mitigation:**
- All new queries indexed
- Org lookups cached
- Lazy loading for org data
- Monitor query performance

### Risk 4: User Experience Disruption
**Mitigation:**
- No UI changes for regular users
- Org features opt-in
- Clear admin communication
- Gradual rollout (staging → production)

---

## 📋 Pre-Step Checklist

**BEFORE starting Step 1, confirm:**

- [ ] **Production backup created**
  ```bash
  gcloud firestore export gs://salfagpt-backups/$(date +%Y%m%d) \
    --project=salfagpt
  ```

- [ ] **Branch created**
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feat/multi-org-system-2025-11-10
  ```

- [ ] **BranchLog.md entry created**
  ```markdown
  ## feat/multi-org-system-2025-11-10
  
  **Purpose:** Implement enterprise multi-organization system
  **Duration:** 5-6 weeks
  **Backward Compatible:** YES
  **Production Safe:** YES (all changes additive)
  ```

- [ ] **Confirmations received:**
  - [ ] Domains for Salfa Corp: [LIST]
  - [ ] Branding details: [DETAILS]
  - [ ] Admin list: [ADMINS]
  - [ ] Budget approved: [YES/NO]

---

## 🎯 Execution Mode

**Choose one:**

### Option A: Agent Mode (Recommended)
- ✅ I implement each step directly
- ✅ You review and approve at each step
- ✅ Faster iteration
- ✅ Continuous validation

### Option B: Ask Mode
- I provide complete code for each step
- You copy/paste and test
- I wait for your feedback
- Slower but more control

**Your choice:** _______________

---

## 🚀 Ready to Begin

**Next immediate action:**

1. Confirm all pre-step checklist items ✅
2. Choose execution mode (A or B)
3. Provide required information:
   - Salfa Corp domains
   - Branding details
   - Admin confirmations
4. I begin with **STEP 1: Enhanced Data Model**

**Estimated time for Step 1:** 8-12 hours
**Your involvement:** Review TypeScript interfaces, approve schema

---

**Last Updated:** 2025-11-10  
**Status:** 📋 Plan Ready, Awaiting Confirmation  
**Backward Compatible:** ✅ Guaranteed  
**Production Safe:** ✅ All changes additive

