# Testing Guide: API Metrics System

**Purpose:** Validate the high-performance metrics architecture  
**Target:** <100ms response time, >90% cache hit rate  
**Created:** 2025-11-18

---

## 🧪 Testing Strategy

### Test Pyramid

```
┌─────────────────────────┐
│   E2E Tests (5%)        │  Integration with real UI
├─────────────────────────┤
│   Integration (25%)     │  API endpoints + Firestore
├─────────────────────────┤
│   Unit Tests (70%)      │  Individual functions
└─────────────────────────┘
```

---

## 📋 Pre-Test Setup

### 1. Environment Variables

Create `.env.test`:
```bash
GOOGLE_CLOUD_PROJECT=salfagpt
NODE_ENV=test
METRICS_SIGNING_KEY=test-signing-key-change-in-production
JWT_SECRET=test-jwt-secret
```

### 2. Test Data

Create test documents in Firestore:
```typescript
// Test agent
const testAgent = {
  id: 'test-agent-001',
  userId: 'test-user-001',
  title: 'Test Agent',
  organizationId: 'test-org',
  domainId: 'test.com',
  messageCount: 10
};

// Test context sources
const testDocs = [
  {
    id: 'doc-001',
    userId: 'test-user-001',
    name: 'Test PDF 1',
    type: 'pdf',
    status: 'active',
    assignedToAgents: ['test-agent-001'],
    metadata: {
      originalFileSize: 1024000, // 1MB
      tokensEstimate: 5000,
      validated: true,
      ragEnabled: true
    }
  },
  {
    id: 'doc-002',
    userId: 'test-user-001',
    name: 'Test CSV',
    type: 'csv',
    status: 'active',
    assignedToAgents: ['test-agent-001'],
    metadata: {
      originalFileSize: 512000, // 0.5MB
      tokensEstimate: 2500
    }
  }
];
```

---

## 🔬 Unit Tests

### Test: Signature System

```typescript
// tests/unit/signature.test.ts
import { describe, it, expect } from 'vitest';
import { signMetrics, verifySignature, signMetricsObject } from '../src/lib/signature';

describe('Signature System', () => {
  const agentId = 'test-agent-001';
  const count = 5;
  const timestamp = Date.now();
  
  it('should generate consistent signatures', () => {
    const sig1 = signMetrics(agentId, count, timestamp);
    const sig2 = signMetrics(agentId, count, timestamp);
    
    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64); // SHA-256 hex = 64 chars
  });
  
  it('should verify valid signatures', () => {
    const signature = signMetrics(agentId, count, timestamp);
    const isValid = verifySignature(agentId, count, timestamp, signature);
    
    expect(isValid).toBe(true);
  });
  
  it('should reject invalid signatures', () => {
    const signature = signMetrics(agentId, count, timestamp);
    const isValid = verifySignature(agentId, count + 1, timestamp, signature);
    
    expect(isValid).toBe(false);
  });
  
  it('should sign complete objects', () => {
    const metrics = {
      agentId,
      documentCount: count,
      lastUpdated: new Date(timestamp)
    };
    
    const signed = signMetricsObject(metrics);
    
    expect(signed).toHaveProperty('_signature');
    expect(signed._signature).toHaveLength(64);
  });
});
```

**Run:**
```bash
npm test -- signature.test.ts
```

---

### Test: API Key Management

```typescript
// tests/unit/api-keys.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generateAPIKey, 
  hashAPIKey, 
  verifyAPIKeyHash,
  hasPermission 
} from '../src/lib/api-keys';

describe('API Key Management', () => {
  it('should generate valid API keys', () => {
    const key = generateAPIKey('production');
    
    expect(key).toMatch(/^api_production_[a-f0-9]{64}$/);
  });
  
  it('should hash and verify keys', async () => {
    const plainKey = generateAPIKey('localhost');
    const hash = await hashAPIKey(plainKey);
    
    const isValid = await verifyAPIKeyHash(plainKey, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyAPIKeyHash('wrong-key', hash);
    expect(isInvalid).toBe(false);
  });
  
  it('should check permissions correctly', () => {
    const keyData = {
      permissions: ['read:agent-metrics', 'read:context-stats']
    } as any;
    
    expect(hasPermission(keyData, 'read:agent-metrics')).toBe(true);
    expect(hasPermission(keyData, 'write:agent-config')).toBe(false);
  });
  
  it('should grant all permissions with admin:all', () => {
    const adminKey = {
      permissions: ['admin:all']
    } as any;
    
    expect(hasPermission(adminKey, 'read:agent-metrics')).toBe(true);
    expect(hasPermission(adminKey, 'write:agent-config')).toBe(true);
  });
});
```

---

### Test: Agent Metrics Cache

```typescript
// tests/unit/agent-metrics-cache.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  updateAgentMetrics, 
  getAgentMetrics,
  needsRefresh 
} from '../src/lib/agent-metrics-cache';

describe('Agent Metrics Cache', () => {
  beforeEach(async () => {
    // Setup test data
    await setupTestAgent();
    await setupTestDocuments();
  });
  
  afterEach(async () => {
    // Cleanup
    await cleanupTestData();
  });
  
  it('should update metrics correctly', async () => {
    const metrics = await updateAgentMetrics('test-agent-001', 'manual_refresh');
    
    expect(metrics.agentId).toBe('test-agent-001');
    expect(metrics.documentCount).toBe(2);
    expect(metrics.activeCount).toBe(2);
    expect(metrics.updateDurationMs).toBeLessThan(200);
  });
  
  it('should retrieve cached metrics', async () => {
    // Update first
    await updateAgentMetrics('test-agent-001', 'manual_refresh');
    
    // Then retrieve
    const startTime = Date.now();
    const metrics = await getAgentMetrics('test-agent-001');
    const duration = Date.now() - startTime;
    
    expect(metrics).not.toBeNull();
    expect(metrics.documentCount).toBe(2);
    expect(duration).toBeLessThan(100); // <100ms
  });
  
  it('should detect stale metrics', () => {
    const fresh = {
      lastUpdated: new Date()
    } as any;
    
    expect(needsRefresh(fresh, 5)).toBe(false);
    
    const stale = {
      lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 min ago
    } as any;
    
    expect(needsRefresh(stale, 5)).toBe(true);
  });
});
```

---

## 🔗 Integration Tests

### Test: API Endpoint

```typescript
// tests/integration/metrics-api.test.ts
import { describe, it, expect } from 'vitest';

describe('GET /api/agents/:id/metrics', () => {
  let apiKey: string;
  let testAgentId: string;
  
  beforeAll(async () => {
    // Generate API key
    const response = await fetch('/api/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Key',
        permissions: ['read:agent-metrics']
      })
    });
    
    const result = await response.json();
    apiKey = result.apiKey;
    
    // Create test agent
    testAgentId = 'test-agent-001';
  });
  
  it('should return metrics in <100ms', async () => {
    const startTime = Date.now();
    
    const response = await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const duration = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
    
    const data = await response.json();
    expect(data.data.agentId).toBe(testAgentId);
    expect(data.metadata.verified).toBe(true);
  });
  
  it('should reject invalid API key', async () => {
    const response = await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: {
        'Authorization': 'Bearer invalid-key'
      }
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should reject missing permission', async () => {
    // Create key without read:agent-metrics
    const limitedKeyResponse = await fetch('/api/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Limited Key',
        permissions: ['read:context-stats'] // No agent-metrics
      })
    });
    
    const { apiKey: limitedKey } = await limitedKeyResponse.json();
    
    const response = await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: {
        'Authorization': `Bearer ${limitedKey}`
      }
    });
    
    expect(response.status).toBe(403);
  });
  
  it('should enforce rate limit', async () => {
    // Create key with low rate limit
    const rateLimitedResponse = await fetch('/api/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rate Limited Key',
        permissions: ['read:agent-metrics'],
        rateLimit: 2 // Only 2 requests per minute
      })
    });
    
    const { apiKey: rateLimitedKey } = await rateLimitedResponse.json();
    
    // Make 2 successful requests
    await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: { 'Authorization': `Bearer ${rateLimitedKey}` }
    });
    
    await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: { 'Authorization': `Bearer ${rateLimitedKey}` }
    });
    
    // Third should be rate limited
    const response = await fetch(`/api/agents/${testAgentId}/metrics`, {
      headers: { 'Authorization': `Bearer ${rateLimitedKey}` }
    });
    
    expect(response.status).toBe(429);
  });
});
```

---

## 🌐 End-to-End Tests

### Test: Complete User Flow

```typescript
// tests/e2e/metrics-flow.test.ts
import { test, expect } from '@playwright/test';

test('Agent metrics load instantly', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3000/auth/login');
  // ... login flow
  
  // 2. Navigate to chat
  await page.goto('http://localhost:3000/chat');
  
  // 3. Click on an agent
  const startTime = Date.now();
  await page.click('[data-testid="agent-card-001"]');
  
  // 4. Verify document count appears
  await page.waitForSelector('[data-testid="document-count"]');
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(500); // Full UI update in <500ms
  
  // 5. Verify count is correct
  const countText = await page.textContent('[data-testid="document-count"]');
  expect(countText).toContain('3 documentos');
  
  // 6. Upload new document
  await page.click('[data-testid="upload-button"]');
  await page.setInputFiles('[data-testid="file-input"]', 'test.pdf');
  await page.click('[data-testid="confirm-upload"]');
  
  // 7. Wait for upload to complete
  await page.waitForSelector('[data-testid="upload-success"]');
  
  // 8. Verify count updated
  await page.waitForSelector('[data-testid="document-count"]');
  const newCountText = await page.textContent('[data-testid="document-count"]');
  expect(newCountText).toContain('4 documentos');
});
```

---

## ⚡ Performance Tests

### Test: Latency Under Load

```typescript
// tests/performance/latency.test.ts
import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  it('should respond in <50ms for single agent', async () => {
    const times: number[] = [];
    
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      
      await fetch(`/api/agents/test-agent-001/metrics`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      times.push(Date.now() - start);
    }
    
    // Calculate percentiles
    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length * 0.50)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    
    console.log('Latency percentiles:', { p50, p95, p99 });
    
    expect(p50).toBeLessThan(50);
    expect(p95).toBeLessThan(100);
    expect(p99).toBeLessThan(200);
  });
  
  it('should handle bulk requests efficiently', async () => {
    const agentIds = Array.from({ length: 50 }, (_, i) => `agent-${i}`);
    
    const start = Date.now();
    const bulkMetrics = await getBulkAgentMetrics(agentIds);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200); // <200ms for 50 agents
    expect(bulkMetrics.metrics.size).toBe(50);
  });
});
```

---

### Test: Cache Hit Rates

```typescript
// tests/performance/cache.test.ts
import { describe, it, expect } from 'vitest';
import { EdgeCache, BrowserCache } from '../src/lib/cache-manager';

describe('Cache Performance', () => {
  it('should achieve >90% hit rate', async () => {
    const agentIds = ['agent-1', 'agent-2', 'agent-3'];
    
    // First request (cache miss)
    for (const id of agentIds) {
      await getAgentMetrics(id);
    }
    
    // Subsequent requests (should hit cache)
    let hits = 0;
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const randomId = agentIds[Math.floor(Math.random() * agentIds.length)];
      const cached = EdgeCache.get(randomId);
      
      if (cached) hits++;
    }
    
    const hitRate = (hits / iterations) * 100;
    console.log(`Cache hit rate: ${hitRate}%`);
    
    expect(hitRate).toBeGreaterThan(90);
  });
});
```

---

## 🔒 Security Tests

### Test: Authentication & Authorization

```typescript
// tests/security/auth.test.ts
import { describe, it, expect } from 'vitest';

describe('Security Tests', () => {
  it('should require both session and API key', async () => {
    // No session, valid API key
    const response1 = await fetch(`/api/agents/test-agent/metrics`, {
      headers: { 'Authorization': `Bearer ${validApiKey}` }
      // No cookie
    });
    expect(response1.status).toBe(401);
    
    // Valid session, no API key
    const response2 = await fetch(`/api/agents/test-agent/metrics`, {
      headers: { 'Cookie': `flow_session=${validSession}` }
      // No Authorization header
    });
    expect(response2.status).toBe(401);
  });
  
  it('should enforce agent ownership', async () => {
    // User A tries to access User B's agent
    const response = await fetch(`/api/agents/user-b-agent/metrics`, {
      headers: {
        'Authorization': `Bearer ${userAApiKey}`,
        'Cookie': `flow_session=${userASession}`
      }
    });
    
    expect(response.status).toBe(403);
  });
  
  it('should allow SuperAdmin access to all agents', async () => {
    const response = await fetch(`/api/agents/any-agent/metrics`, {
      headers: {
        'Authorization': `Bearer ${superAdminApiKey}`,
        'Cookie': `flow_session=${superAdminSession}`
      }
    });
    
    expect(response.status).toBe(200);
  });
});
```

---

### Test: Signature Tampering Detection

```typescript
// tests/security/tampering.test.ts
import { describe, it, expect } from 'vitest';

describe('Tampering Detection', () => {
  it('should detect modified count', async () => {
    // Get valid metrics
    const response = await fetch(`/api/agents/test-agent/metrics`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const data = await response.json();
    
    // Tamper with count
    data.data.documentCount = 999;
    
    // Verify signature fails
    const verification = verifyMetricsSignature(data.data);
    expect(verification.isValid).toBe(false);
  });
  
  it('should trigger recalculation on invalid signature', async () => {
    // Directly modify Firestore document (simulate tampering)
    await firestore
      .collection('agent_metrics_cache')
      .doc('test-agent')
      .update({ documentCount: 999 }); // Change count without updating signature
    
    // API should detect and trigger recalc
    const response = await fetch(`/api/agents/test-agent/metrics`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const data = await response.json();
    expect(data.metadata.verified).toBe(false);
    
    // Wait for background recalc
    await new Promise(r => setTimeout(r, 200));
    
    // Next request should be valid
    const response2 = await fetch(`/api/agents/test-agent/metrics`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const data2 = await response2.json();
    expect(data2.metadata.verified).toBe(true);
  });
});
```

---

## 🔄 Cloud Function Tests

### Test: Real-Time Updates

```typescript
// tests/integration/cloud-functions.test.ts
import { describe, it, expect } from 'vitest';

describe('Cloud Function Triggers', () => {
  it('should update metrics on document creation', async () => {
    // Get initial metrics
    const before = await getAgentMetrics('test-agent-001');
    const initialCount = before?.documentCount || 0;
    
    // Create new document
    await firestore.collection('context_sources').add({
      userId: 'test-user',
      name: 'New Document',
      type: 'pdf',
      status: 'active',
      assignedToAgents: ['test-agent-001']
    });
    
    // Wait for Cloud Function to execute
    await new Promise(r => setTimeout(r, 500));
    
    // Get updated metrics
    const after = await getAgentMetrics('test-agent-001');
    
    expect(after.documentCount).toBe(initialCount + 1);
    expect(after.updateTrigger).toBe('document_added');
  });
  
  it('should update metrics on document deletion', async () => {
    // Create document
    const docRef = await firestore.collection('context_sources').add({
      userId: 'test-user',
      assignedToAgents: ['test-agent-001'],
      status: 'active'
    });
    
    // Wait for create trigger
    await new Promise(r => setTimeout(r, 500));
    
    const before = await getAgentMetrics('test-agent-001');
    const initialCount = before.documentCount;
    
    // Delete document
    await docRef.delete();
    
    // Wait for delete trigger
    await new Promise(r => setTimeout(r, 500));
    
    const after = await getAgentMetrics('test-agent-001');
    
    expect(after.documentCount).toBe(initialCount - 1);
    expect(after.updateTrigger).toBe('document_removed');
  });
});
```

---

## 📊 Manual Testing Checklist

### Setup
- [ ] Deploy Cloud Functions
- [ ] Create Firestore indexes
- [ ] Generate test API key
- [ ] Create test agent with documents

### Basic Functionality
- [ ] GET /api/agents/:id/metrics returns 200
- [ ] Response time <100ms
- [ ] Document count is correct
- [ ] Signature verification passes
- [ ] Response includes all expected fields

### Caching
- [ ] First request: fromCache=false
- [ ] Second request: fromCache=true
- [ ] Cache age increases over time
- [ ] Browser cache works (check localStorage)
- [ ] Edge cache works (check logs)

### Security
- [ ] Missing API key → 401
- [ ] Invalid API key → 401
- [ ] No permission → 403
- [ ] No access to agent → 403
- [ ] Rate limit enforced → 429

### Real-Time Updates
- [ ] Upload document → count increases (within 1s)
- [ ] Delete document → count decreases (within 1s)
- [ ] Update trigger type is correct
- [ ] Signature remains valid after update

### Error Handling
- [ ] Non-existent agent → 404
- [ ] Invalid signature → Warning logged + recalc triggered
- [ ] Stale cache → Background refresh triggered
- [ ] Rate limit → Clear retry instructions

---

## 🐛 Debugging Guide

### Issue: Slow Response (>100ms)

**Check:**
```bash
# 1. Check cache statistics
curl http://localhost:3000/api/cache/stats

# 2. Check Cloud Function logs
gcloud functions logs read updateAgentMetrics --limit=20

# 3. Check Firestore indexes
gcloud firestore indexes composite list

# 4. Monitor response headers
curl -I http://localhost:3000/api/agents/xxx/metrics \
  -H "Authorization: Bearer ${API_KEY}"
```

**Diagnose:**
- X-Cache-Layer: none → Cache not working
- X-Response-Time: >100ms → Query optimization needed
- X-Cache-Age: >300s → Stale data

---

### Issue: Invalid Signatures

**Check:**
```bash
# 1. Verify signing key is set
echo $METRICS_SIGNING_KEY

# 2. Check signature in Firestore
# agent_metrics_cache/xxx document → _signature field

# 3. Test signature generation
node -e "
const crypto = require('crypto');
const sig = crypto.createHmac('sha256', 'test-key')
  .update('agent:5:1700000000')
  .digest('hex');
console.log(sig);
"
```

---

### Issue: Metrics Not Updating

**Check:**
```bash
# 1. Verify Cloud Function deployed
gcloud functions list --filter="name:updateAgentMetrics"

# 2. Check function logs
gcloud functions logs read onContextSourceCreate --limit=10

# 3. Test manual trigger
curl "https://FUNCTION_URL/updateAgentMetrics?agentId=xxx"

# 4. Check Firestore triggers
gcloud functions describe onContextSourceCreate --format="json" | jq '.eventTrigger'
```

---

## 📈 Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| API Response (p50) | <50ms | <100ms | >200ms |
| API Response (p95) | <100ms | <200ms | >500ms |
| Cache hit rate | >90% | >80% | <70% |
| Update time | <100ms | <200ms | >500ms |
| Signature verify | <1ms | <5ms | >10ms |

### Benchmark Script

```bash
#!/bin/bash
# benchmark-metrics-api.sh

API_KEY="your-api-key"
AGENT_ID="test-agent-001"

echo "🔬 Benchmarking Metrics API"
echo "=========================="

# Run 100 requests
TIMES=()
for i in {1..100}; do
  START=$(date +%s%3N)
  
  curl -s "http://localhost:3000/api/agents/${AGENT_ID}/metrics" \
    -H "Authorization: Bearer ${API_KEY}" \
    > /dev/null
  
  END=$(date +%s%3N)
  DURATION=$((END - START))
  TIMES+=($DURATION)
done

# Calculate percentiles
echo ""
echo "Results:"
echo "--------"

# Sort times
IFS=$'\n' SORTED=($(sort -n <<<"${TIMES[*]}"))

P50=${SORTED[49]}
P95=${SORTED[94]}
P99=${SORTED[98]}

echo "p50: ${P50}ms"
echo "p95: ${P95}ms"
echo "p99: ${P99}ms"

# Pass/Fail
if [ $P50 -lt 50 ] && [ $P95 -lt 100 ]; then
  echo ""
  echo "✅ PASS: Performance targets met!"
else
  echo ""
  echo "❌ FAIL: Performance below targets"
fi
```

**Run:**
```bash
chmod +x benchmark-metrics-api.sh
./benchmark-metrics-api.sh
```

---

## ✅ Test Success Criteria

### All Tests Must Pass

**Unit Tests:**
- [x] Signature generation consistent
- [x] Signature verification accurate
- [x] API key generation valid
- [x] Permission checking correct
- [x] Metrics calculation accurate

**Integration Tests:**
- [x] API responds with valid data
- [x] Authentication enforced
- [x] Authorization enforced
- [x] Rate limiting works
- [x] Cache layers function

**E2E Tests:**
- [x] User flow works end-to-end
- [x] Metrics update in real-time
- [x] UI shows correct counts
- [x] Performance acceptable

**Performance Tests:**
- [x] p50 <50ms
- [x] p95 <100ms
- [x] Cache hit rate >90%

**Security Tests:**
- [x] No unauthorized access
- [x] Signature tampering detected
- [x] Rate limiting enforced
- [x] Audit logging works

---

## 🚀 Running All Tests

```bash
# Unit tests
npm test -- tests/unit

# Integration tests
npm test -- tests/integration

# E2E tests (requires running server)
npm run dev &
npm test -- tests/e2e

# Performance benchmarks
./benchmark-metrics-api.sh

# Full test suite
npm test
```

---

## 📊 Test Coverage

**Target:** >80% code coverage

```bash
# Run with coverage
npm test -- --coverage

# Expected coverage:
src/lib/signature.ts:           95%
src/lib/api-keys.ts:            90%
src/lib/agent-metrics-cache.ts: 85%
src/lib/cache-manager.ts:       80%
```

---

## 🎯 Test Completion Checklist

Before marking as complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks meet targets
- [ ] Security tests pass
- [ ] Code coverage >80%
- [ ] Manual testing complete
- [ ] Documentation reviewed
- [ ] Deployment tested in staging
- [ ] Production deployment planned

---

**Ready for production when all tests pass!** ✅

See `docs/API_METRICS_ARCHITECTURE.md` for complete system documentation.


