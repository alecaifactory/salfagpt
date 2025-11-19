# 🚀 API Metrics Architecture - Flow Platform

**Purpose:** High-performance metrics system with <100ms latency  
**Pattern:** Calculate once, use many times, share securely  
**Created:** 2025-11-18  
**Status:** ✅ Infrastructure Complete (Step 1-4)

---

## 🎯 Problem Statement

### Before: Inefficient Pattern
```
UI loads ALL documents → Counts them → Displays number
- Latency: ~2000ms per agent
- Inefficiency: 100 users × same calculation = wasted resources
- No caching: Every refresh repeats the work
- Security risk: UI has access to all document data
```

### After: Optimized Pattern
```
Cloud Function → Calculates once → Stores in derived view → API serves signed result
- Latency: <50ms per agent
- Efficiency: Calculate once when data changes
- Caching: 3 layers (Browser → Edge → Firestore)
- Security: Signed responses, granular permissions
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: BROWSER CACHE (5 min TTL)            │
│  localStorage, instant retrieval                │
└─────────────────────────────────────────────────┘
                    ↓ (if miss)
┌─────────────────────────────────────────────────┐
│  LAYER 2: EDGE CACHE (1 min TTL)               │
│  In-memory Map, <10ms retrieval                 │
└─────────────────────────────────────────────────┘
                    ↓ (if miss)
┌─────────────────────────────────────────────────┐
│  LAYER 3: DATABASE (Real-time)                 │
│  Firestore derived view, <50ms retrieval        │
│  Collection: agent_metrics_cache                │
│  Updated by: Cloud Function triggers            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  SOURCE: RAW DATA                               │
│  context_sources collection                     │
│  Triggers: onCreate, onUpdate, onDelete         │
└─────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### Collection: `agent_metrics_cache`

**Purpose:** Derived view with pre-calculated metrics

```typescript
{
  id: 'agent-id',              // Document ID = agentId
  agentId: 'agent-id',
  userId: 'user-id',
  organizationId: 'org-id',
  domainId: 'domain-id',
  
  // Metrics (pre-calculated)
  documentCount: 5,
  activeCount: 3,
  ragEnabledCount: 2,
  validatedCount: 1,
  
  totalSizeMB: 12.5,
  avgSizeMB: 2.5,
  totalTokensEstimate: 50000,
  
  documentsByType: {
    pdf: 3,
    csv: 1,
    excel: 1,
    // ... others: 0
  },
  
  // Activity
  lastMessageAt: Timestamp,
  messagesCount: 45,
  lastActivityAt: Timestamp,
  
  // Update tracking
  lastUpdated: Timestamp,
  updateTrigger: 'document_added',
  updateDurationMs: 87,
  
  // Security
  _signature: 'a1b2c3...',     // SHA-256 HMAC
  _version: 5,
  source: 'production'
}
```

**Indexes Required:**
```
- agentId ASC (implicit - document ID)
- userId ASC, lastUpdated DESC
- organizationId ASC, lastUpdated DESC
```

**Update Triggers:**
```
context_sources.onCreate → updateAgentMetrics(agentId, 'document_added')
context_sources.onUpdate → updateAgentMetrics(agentId, 'document_updated')
context_sources.onDelete → updateAgentMetrics(agentId, 'document_removed')
```

---

## 🔐 Security Architecture

### Dual Authentication

**Layer 1: Session Cookie (User Auth)**
```typescript
const session = getSession({ cookies });
// Verifies: User is logged in
```

**Layer 2: API Key (Application Auth)**
```typescript
const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
const verification = await verifyAPIKey(apiKey);
// Verifies: Valid API key with correct permissions
```

**Both required:** Session ensures user identity, API key enables programmatic access

---

### Permission Model

**Granular permissions per API key:**

```typescript
// Read permissions
'read:agent-metrics'        // Agent document counts, activity
'read:user-metrics'         // User-level aggregations
'read:org-metrics'          // Organization-level aggregations
'read:context-stats'        // Context source statistics

// Write permissions (admin)
'write:refresh-metrics'     // Trigger manual refresh
'write:invalidate-cache'    // Force cache invalidation
'write:agent-config'        // Modify agent settings

// Admin
'admin:all'                 // Full access (SuperAdmin)
'admin:org'                 // Organization admin
```

**Access Control:**
```typescript
1. SuperAdmin (admin:all) → All agents, all organizations
2. OrgAdmin (admin:org) → Agents in their organization only
3. Owner → Only their own agents
4. Shared → Agents explicitly shared with them
```

---

### Digital Signatures

**Purpose:** Ensure metrics integrity, detect tampering

**Signing:**
```typescript
const data = `${agentId}:${count}:${timestamp}`;
const signature = crypto.createHmac('sha256', SECRET_KEY)
  .update(data)
  .digest('hex');
```

**Verification:**
```typescript
const expected = signMetrics(agentId, count, timestamp);
const isValid = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(signature)
);
```

**On Invalid Signature:**
- Log warning with agentId and timestamp
- Trigger background recalculation
- Return data anyway (with warning in metadata)
- Alert monitoring system

---

## 🔄 Update Flow

### Real-Time Updates (Cloud Function)

```
Document Change Event (Firestore Trigger)
  ↓
Cloud Function: updateAgentMetrics
  ↓
1. Query assigned documents (optimized with select())
2. Calculate all metrics
3. Sign result (SHA-256 HMAC)
4. Save to agent_metrics_cache
  ↓
Total time: <100ms
```

**Trigger Examples:**
```javascript
// onCreate trigger
exports.onContextSourceCreate = functions.firestore
  .document('context_sources/{sourceId}')
  .onCreate(async (snapshot, context) => {
    const source = snapshot.data();
    const agentIds = source.assignedToAgents || [];
    
    // Update metrics for all assigned agents
    await Promise.all(
      agentIds.map(agentId => 
        updateAgentMetrics(agentId, 'document_added')
      )
    );
  });

// onDelete trigger
exports.onContextSourceDelete = functions.firestore
  .document('context_sources/{sourceId}')
  .onDelete(async (snapshot, context) => {
    const source = snapshot.data();
    const agentIds = source.assignedToAgents || [];
    
    // Update metrics for all previously assigned agents
    await Promise.all(
      agentIds.map(agentId => 
        updateAgentMetrics(agentId, 'document_removed')
      )
    );
  });
```

---

### Scheduled Refresh (Stale Data Cleanup)

**Purpose:** Catch any missed updates, ensure data consistency

**Schedule:** Every 1 hour

```typescript
exports.refreshStaleMetrics = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const maxAgeMinutes = 60;
    const refreshed = await refreshStaleMetrics(maxAgeMinutes);
    console.log(`✅ Refreshed ${refreshed} stale metrics`);
  });
```

---

## 📡 API Endpoints

### GET /api/agents/:id/metrics

**Purpose:** Retrieve agent metrics

**Authentication:** Session + API Key

**Request:**
```http
GET /api/agents/Pn6WPNxv8orckxX6xL4L/metrics
Authorization: Bearer api_prod_a1b2c3d4...
Cookie: flow_session=eyJhbGciOi...
```

**Response (Success):**
```json
{
  "data": {
    "agentId": "Pn6WPNxv8orckxX6xL4L",
    "documentCount": 3,
    "activeCount": 2,
    "ragEnabledCount": 1,
    "validatedCount": 1,
    "totalSizeMB": 8.45,
    "avgSizeMB": 2.82,
    "totalTokensEstimate": 42500,
    "documentsByType": {
      "pdf": 2,
      "excel": 1,
      // ... others: 0
    },
    "lastMessageAt": "2025-11-18T19:30:00Z",
    "messagesCount": 23,
    "lastActivityAt": "2025-11-18T20:15:00Z",
    "lastUpdated": "2025-11-18T20:15:00Z",
    "_signature": "a1b2c3d4...",
    "_version": 8
  },
  "metadata": {
    "respondedIn": "45ms",
    "fromCache": true,
    "cacheAge": 120,
    "verified": true,
    "version": 8,
    "timestamp": "2025-11-18T20:17:30Z"
  }
}
```

**Response Headers:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Response-Time: 45ms
X-Cache-Layer: edge
X-Cache-Age: 120s
X-Signature-Verified: true
Cache-Control: private, max-age=300
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 2025-11-18T20:18:00Z
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Missing API key in Authorization header"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "No access to this agent"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Metrics not yet calculated. Please try again in a moment."
}
```

**429 Rate Limit:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Try again in 2025-11-18T20:18:00Z",
  "rateLimitReset": "2025-11-18T20:18:00Z"
}
```

---

### POST /api/api-keys/generate

**Purpose:** Create new API key

**Authentication:** Session only

**Request:**
```json
{
  "name": "Dashboard Production Key",
  "permissions": [
    "read:agent-metrics",
    "read:context-stats"
  ],
  "organizationId": "salfa-corp",
  "rateLimit": 120,
  "expiresAt": "2026-11-18T00:00:00Z",
  "description": "API key for production dashboard",
  "tags": ["production", "dashboard"]
}
```

**Response:**
```json
{
  "apiKey": "api_prod_a1b2c3d4e5f6g7h8...",
  "keyId": "key-doc-id",
  "message": "Save this key securely - you won't see it again",
  "expiresAt": "2026-11-18T00:00:00Z",
  "warning": "⚠️ Save this key securely - you will not be able to see it again!"
}
```

---

### GET /api/api-keys/list

**Purpose:** List user's API keys (safe representation)

**Authentication:** Session

**Response:**
```json
{
  "keys": [
    {
      "id": "key-1",
      "name": "Dashboard Production Key",
      "permissions": ["read:agent-metrics"],
      "isActive": true,
      "expiresAt": "2026-11-18T00:00:00Z",
      "lastUsedAt": "2025-11-18T19:45:00Z",
      "usageCount": 1523,
      "createdAt": "2025-11-18T10:00:00Z",
      "keyPreview": "Dashboard Prod...****"
    }
  ],
  "total": 1,
  "metadata": {
    "respondedIn": "35ms",
    "timestamp": "2025-11-18T20:17:30Z"
  }
}
```

---

### DELETE /api/api-keys/revoke?id=:keyId

**Purpose:** Revoke an API key

**Authentication:** Session (owner or admin)

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "keyId": "key-1",
  "revokedAt": "2025-11-18T20:17:30Z"
}
```

---

## 📈 Performance Targets & Metrics

### Latency Targets

| Endpoint | Target | Typical | P95 |
|----------|--------|---------|-----|
| GET /api/agents/:id/metrics | <50ms | 30-45ms | <100ms |
| POST /api/api-keys/generate | <200ms | 150ms | <300ms |
| GET /api/api-keys/list | <100ms | 50-80ms | <150ms |

### Cache Hit Rates

| Layer | Target Hit Rate | TTL |
|-------|----------------|-----|
| Browser | >80% | 5 min |
| Edge | >90% | 1 min |
| Database | 100% | Real-time |

### Scalability Targets

| Agents | Response Time | Notes |
|--------|---------------|-------|
| 1-100 | <50ms | Single org |
| 100-1,000 | <75ms | Multi-org |
| 1,000-10,000 | <100ms | Edge cache warm |
| 10,000-100,000 | <150ms | Need CDN |

---

## 🔧 Implementation Status

### ✅ Completed (Block 1: Infrastructure)

**Files Created:**
- [x] `src/types/metrics-cache.ts` - Type definitions
- [x] `src/types/api-keys.ts` - API key types
- [x] `src/lib/signature.ts` - Digital signing utilities
- [x] `src/lib/agent-metrics-cache.ts` - Cache management
- [x] `src/lib/api-keys.ts` - API key operations
- [x] `src/lib/cache-manager.ts` - 3-layer caching
- [x] `src/pages/api/agents/[id]/metrics.ts` - Metrics endpoint
- [x] `src/pages/api/api-keys/generate.ts` - Generate key
- [x] `src/pages/api/api-keys/list.ts` - List keys
- [x] `src/pages/api/api-keys/revoke.ts` - Revoke key

**Validation:**
- [x] TypeScript compiles without errors in new files
- [x] Architecture documented
- [x] Security model defined

---

### 🔄 In Progress (Block 2: Cloud Functions)

**Next Steps:**
1. Create Cloud Function for updating metrics
2. Deploy functions to GCP
3. Configure Firestore triggers
4. Test real-time updates

**Files to Create:**
- [ ] `functions/updateAgentMetrics.ts`
- [ ] `functions/refreshStaleMetrics.ts`
- [ ] `functions/cleanupExpiredKeys.ts`

---

### ⏳ Pending (Blocks 3-5)

**Block 3: UI Integration**
- Update `ChatInterfaceWorking.tsx` to use new API
- Add API key management UI component
- Implement browser cache layer
- A/B testing with old vs new approach

**Block 4: Migration**
- Migrate existing endpoints to use cache
- Create bulk metrics endpoints
- Optimize other high-frequency queries
- Performance testing

**Block 5: Documentation & Deployment**
- Complete developer guide
- Create monitoring dashboard
- Deploy to production
- Validate performance targets

---

## 💡 Usage Examples

### Frontend: Fetching Metrics

```typescript
// In ChatInterfaceWorking.tsx
import { BrowserCache } from '../lib/cache-manager';

async function loadAgentMetrics(agentId: string) {
  // Try browser cache first
  let metrics = BrowserCache.get(agentId);
  if (metrics) {
    console.log('✅ Metrics from browser cache');
    return metrics;
  }
  
  // Fetch from API
  const response = await fetch(`/api/agents/${agentId}/metrics`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}` // From user settings
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  
  const result = await response.json();
  
  // Store in browser cache
  BrowserCache.set(agentId, result.data);
  
  console.log(`✅ Metrics fetched in ${result.metadata.respondedIn}`);
  
  return result.data;
}
```

---

### Backend: Updating Metrics (Cloud Function)

```typescript
// functions/updateAgentMetrics.ts
import { updateAgentMetrics } from '../src/lib/agent-metrics-cache';

export async function handleContextSourceChange(
  agentId: string,
  trigger: 'document_added' | 'document_removed' | 'document_updated'
) {
  try {
    const metrics = await updateAgentMetrics(agentId, trigger);
    console.log(`✅ Updated metrics for ${agentId}:`, {
      documentCount: metrics.documentCount,
      updateDuration: metrics.updateDurationMs
    });
  } catch (error) {
    console.error(`❌ Failed to update metrics for ${agentId}:`, error);
    // Don't throw - log error but don't block document operation
  }
}
```

---

## 🎓 Design Principles

### 1. Calculate Once, Use Many Times

**Before:**
```typescript
// Every UI refresh (100 users × 10 times/day = 1000 calculations)
const docs = await getAllDocuments(); // Expensive query
const count = docs.filter(d => d.agentId === id).length;
```

**After:**
```typescript
// Once per document change (5 changes/day = 5 calculations)
// Cloud Function updates cache
// UI reads from cache (1000 reads, 0 calculations)
const metrics = await getAgentMetrics(id); // <50ms
```

**Savings:** 1000 calculations → 5 calculations = 99.5% reduction

---

### 2. Security in Depth

**3 Layers of Security:**
1. **Authentication:** Session + API Key
2. **Authorization:** Granular permissions
3. **Integrity:** Digital signatures

**Why?**
- Session alone: Can't revoke access granularly
- API Key alone: Can't tie to user identity
- No signature: Can't detect tampering

**Together:** Comprehensive security model

---

### 3. Performance Through Caching

**3 Cache Layers:**

```
Browser (localStorage)
  - TTL: 5 minutes
  - Retrieval: 0ms (synchronous)
  - Hit rate: >80%
  ↓ (if miss)
Edge (in-memory Map)
  - TTL: 1 minute
  - Retrieval: <10ms
  - Hit rate: >90% of misses
  ↓ (if miss)
Database (Firestore)
  - TTL: Real-time updates
  - Retrieval: <50ms
  - Hit rate: 100%
```

**Combined:**
- 80% requests: 0ms (browser)
- 18% requests: <10ms (edge)
- 2% requests: <50ms (database)
- **Average: <5ms** 🎯

---

### 4. Fail-Safe Degradation

**If signature invalid:**
- Return data anyway
- Include warning in metadata
- Trigger background recalculation
- Log for investigation

**If cache miss:**
- Return 404 with helpful message
- Trigger background calculation
- Next request succeeds

**If rate limited:**
- Return 429 with retry time
- Log for abuse detection
- Reset after period

**Result:** System always works, even under attack or failure

---

## 🚀 Deployment Plan

### Phase 1: Infrastructure (Complete ✅)
- [x] Create type definitions
- [x] Implement signature system
- [x] Build cache management
- [x] Create API endpoints
- [x] Document architecture

### Phase 2: Cloud Functions (Next)
- [ ] Implement update function
- [ ] Deploy to GCP
- [ ] Configure triggers
- [ ] Test real-time updates

### Phase 3: UI Integration
- [ ] Update ChatInterfaceWorking.tsx
- [ ] Add API key management UI
- [ ] Implement browser caching
- [ ] A/B test performance

### Phase 4: Migration
- [ ] Migrate existing endpoints
- [ ] Performance comparison
- [ ] Rollback plan if needed
- [ ] Documentation

### Phase 5: Production
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Validate targets achieved
- [ ] Celebrate 40x improvement! 🎉

---

## 📊 Success Metrics

### Target Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Agent metrics load | ~2000ms | <50ms | **40x faster** |
| Cache hit rate | 0% | >90% | **∞ improvement** |
| Firestore reads | 100/min | <10/min | **90% reduction** |
| Signature security | None | SHA-256 | **100% integrity** |
| Rate limiting | None | 60/min | **100% protection** |

### ROI Analysis

**Performance:**
- 40x faster response time
- 99.5% reduction in redundant calculations
- 90% reduction in Firestore reads

**Cost:**
- 50% reduction in read costs
- One-time Cloud Function setup
- Negligible storage cost for cache

**Security:**
- Digital signatures prevent tampering
- Granular permissions reduce attack surface
- Rate limiting prevents abuse
- Audit trail for compliance

**Net Result:** 🚀 **Massive performance gain + enhanced security + lower costs**

---

## 🔍 Monitoring & Observability

### Key Metrics to Track

**Performance:**
- Response time (p50, p95, p99)
- Cache hit rates (browser, edge, database)
- Update duration (Cloud Function)
- API endpoint latency

**Security:**
- Failed authentication attempts
- Invalid signatures detected
- Rate limit hits
- Permission denials

**Usage:**
- API calls per minute
- Most accessed agents
- Most used API keys
- Cache memory usage

**Health:**
- Stale cache percentage
- Failed updates
- Signature verification failures
- Background job success rate

---

### Alerts & Thresholds

**Performance Alerts:**
- Response time >100ms (sustained): Warning
- Response time >500ms (sustained): Critical
- Cache hit rate <80%: Warning

**Security Alerts:**
- Invalid signature detected: Warning
- >10 failed auth in 1 min: Alert
- >100 rate limit hits in 1 hour: Investigate

**Health Alerts:**
- Stale cache >10%: Warning
- Failed updates >5%: Critical
- Cloud Function errors: Immediate investigation

---

## 📚 Next Steps

### Immediate (This Session)
1. ✅ Create infrastructure files
2. ⏳ Create Cloud Function
3. Deploy function to GCP
4. Test metrics update flow

### Short-Term (Week 1)
- Implement bulk metrics endpoint
- Add cache statistics endpoint
- Create monitoring dashboard
- Write testing guide

### Medium-Term (Week 2-3)
- Migrate all endpoints to use cache
- UI integration complete
- Performance benchmarks
- Documentation complete

### Long-Term (Week 4)
- Production deployment
- Validate all targets achieved
- Knowledge transfer
- Continuous optimization

---

## 🎯 Expected Outcomes

**For Users:**
- ✅ 40x faster UI loads
- ✅ Instant feedback (<100ms)
- ✅ Reliable, consistent performance
- ✅ No more loading spinners for counts

**For Developers:**
- ✅ Easy-to-use API
- ✅ Clear documentation
- ✅ Secure by default
- ✅ Observable and debuggable

**For Platform:**
- ✅ Scales to 100,000+ agents
- ✅ 90% cost reduction on reads
- ✅ Enhanced security posture
- ✅ Future-proof architecture

---

**This architecture follows the Flow Platform principle:**

> **"Calculate once, use many times, share securely"**

🚀 **Welcome to sub-100ms performance!**

