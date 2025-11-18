# 🚀 Stella Server Feedback MVP - Quick Start Guide

**Timeline:** 1 week  
**Effort:** ~15-20 hours  
**Dependencies:** Existing logger.ts, SSE pattern  
**Status:** Ready to implement

---

## 🎯 MVP Goal

**Enable real-time server monitoring in Stella with automatic pattern detection for performance issues.**

### What You'll Get:

✅ Enhanced diagnostic logging in critical endpoints  
✅ Real-time log streaming to Stella (SSE)  
✅ Automatic detection of performance degradation  
✅ Alerts shown in Stella sidebar  
✅ Foundation for future auto-remediation

### What's Out of Scope (Future Sprints):

⏸️ Error spike detection  
⏸️ User friction detection  
⏸️ Security anomaly detection  
⏸️ Auto-fix framework  
⏸️ Full dashboard component

---

## 📋 Implementation Checklist

### Day 1-2: Enhanced Logging

#### Step 1: Create stella-logger.ts

**File:** `src/lib/stella-logger.ts`

**Copy this code:**

```typescript
import { logger, type LogMetadata } from './logger';
import { firestore } from './firestore';

export interface StellaLogMetadata extends LogMetadata {
  stella_actionable?: boolean;
  stella_category?: 'performance' | 'security' | 'data' | 'ui' | 'user_friction';
  stella_severity?: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions?: string[];
  autoFixAvailable?: boolean;
  affectedUsers?: string[];
}

export const stellaLogger = {
  /**
   * Log performance metrics with threshold checking
   */
  queryPerformance: async (
    operation: string,
    duration_ms: number,
    metadata?: LogMetadata
  ) => {
    // Always log metric
    await logger.metric(operation, duration_ms, metadata);
    
    // Check if slow
    const threshold = getThreshold(operation);
    if (duration_ms > threshold) {
      await stellaLogger.diagnostic('performance',
        `Slow ${operation}: ${duration_ms}ms (threshold: ${threshold}ms)`,
        {
          stella_severity: duration_ms > threshold * 2 ? 'high' : 'medium',
          stella_actionable: true,
          duration_ms,
          threshold,
          operation,
          suggestedActions: [
            'Check database indexes',
            'Review query complexity',
            'Consider caching',
          ],
          autoFixAvailable: false,
          ...metadata,
        }
      );
    }
  },

  /**
   * Log diagnostic events
   */
  diagnostic: async (
    category: 'performance' | 'security' | 'data' | 'ui' | 'user_friction',
    issue: string,
    metadata: StellaLogMetadata
  ) => {
    // Log to standard logger
    await logger.warn(`[STELLA:${category.toUpperCase()}] ${issue}`, {
      ...metadata,
      stella_actionable: true,
      stella_category: category,
    });
    
    // If critical, create alert document
    if (metadata.stella_severity === 'critical') {
      await createAlert(category, issue, metadata);
    }
    
    // Emit to SSE subscribers (if any)
    emitToStella({
      timestamp: new Date().toISOString(),
      level: metadata.stella_severity === 'critical' ? 'ERROR' : 'WARN',
      category,
      message: issue,
      ...metadata,
    });
  },
};

function getThreshold(operation: string): number {
  const thresholds: Record<string, number> = {
    'get_conversations': 500,
    'get_shared_agents': 200,
    'load_messages': 300,
    'search_rag': 800,
    'gemini_api_call': 2000,
  };
  return thresholds[operation] || 1000;
}

async function createAlert(category: string, issue: string, metadata: StellaLogMetadata) {
  try {
    await firestore.collection('stella_alerts').add({
      category,
      issue,
      severity: metadata.stella_severity,
      suggestedActions: metadata.suggestedActions || [],
      autoFixAvailable: metadata.autoFixAvailable || false,
      affectedUsers: metadata.affectedUsers || [],
      status: 'new',
      createdAt: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    });
  } catch (error) {
    console.error('Failed to create Stella alert:', error);
  }
}

// SSE emit function (to be implemented in Step 3)
let stellaSubscribers: ((event: any) => void)[] = [];

export function subscribeToStellaLogs(callback: (event: any) => void) {
  stellaSubscribers.push(callback);
  return () => {
    stellaSubscribers = stellaSubscribers.filter(cb => cb !== callback);
  };
}

function emitToStella(event: any) {
  stellaSubscribers.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('Error notifying Stella subscriber:', error);
    }
  });
}
```

#### Step 2: Integrate in Critical Endpoints

**File 1:** `src/pages/api/shared-agents.ts` (example)

```typescript
import { stellaLogger } from '../../lib/stella-logger';
import { logger } from '../../lib/logger';

export const GET: APIRoute = async ({ request, cookies }) => {
  const timer = logger.startTimer();
  
  try {
    // ... existing code ...
    const agents = await getSharedAgents(userId);
    
    // Track performance
    const duration = await timer.end('get_shared_agents', { 
      userId, 
      count: agents.length 
    });
    
    // Stella-specific performance tracking
    await stellaLogger.queryPerformance('get_shared_agents', duration, {
      userId,
      resultCount: agents.length,
      hasEmailLookup: Boolean(emailLookupNeeded), // If you track this
    });
    
    return new Response(JSON.stringify(agents), { status: 200 });
  } catch (error) {
    await stellaLogger.diagnostic('data', 'Failed to get shared agents', {
      stella_severity: 'high',
      stella_actionable: true,
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
      suggestedActions: [
        'Verify user authentication',
        'Check Firestore indexes',
        'Review sharing permissions',
      ],
    });
    throw error;
  }
};
```

**Repeat for:**
- `auth/callback.ts` (login events)
- `api/conversations/index.ts` (conversation queries)
- `api/conversations/[id]/messages.ts` (message handling)
- `api/context-sources/index.ts` (context operations)

---

### Day 3-4: SSE Streaming

#### Step 3: Create SSE Endpoint

**File:** `src/pages/api/stella/server-logs-stream.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { subscribeToStellaLogs } from '../../../lib/stella-logger';

export const GET: APIRoute = async ({ request, cookies }) => {
  // Auth check
  const session = getSession({ cookies } as any);
  if (!session || !['admin', 'superadmin'].includes(session.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  console.log(`📡 Stella SSE started for ${session.email}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Subscribe to stella logs
      const unsubscribe = subscribeToStellaLogs((logEvent) => {
        if (logEvent.stella_actionable) {
          const data = `data: ${JSON.stringify({
            timestamp: logEvent.timestamp,
            level: logEvent.level,
            category: logEvent.category,
            message: logEvent.message,
            severity: logEvent.stella_severity,
            suggestedActions: logEvent.suggestedActions,
            metadata: {
              operation: logEvent.operation,
              duration_ms: logEvent.duration_ms,
              userId: logEvent.userId,
            },
          })}\n\n`;
          
          controller.enqueue(encoder.encode(data));
        }
      });
      
      // Keep-alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);
      
      // Cleanup
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepAlive);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
};
```

#### Step 4: Consume SSE in Stella

**File:** `src/components/StellaSidebarChat.tsx` (add this section)

```typescript
// Add state for server alerts
const [serverAlerts, setServerAlerts] = useState<any[]>([]);
const [sseConnected, setSSEConnected] = useState(false);

// Subscribe to server logs (admins only)
useEffect(() => {
  if (!['admin', 'superadmin'].includes(userRole)) return;
  
  const eventSource = new EventSource('/api/stella/server-logs-stream');
  
  eventSource.onopen = () => {
    setSSEConnected(true);
    console.log('✅ Stella SSE connected');
  };
  
  eventSource.onmessage = (event) => {
    if (event.data === ': ping') return;
    
    const logEvent = JSON.parse(event.data);
    console.log('📨 Stella alert:', logEvent);
    
    setServerAlerts(prev => [logEvent, ...prev].slice(0, 20));
  };
  
  eventSource.onerror = () => {
    setSSEConnected(false);
    console.warn('⚠️ Stella SSE disconnected');
  };
  
  return () => eventSource.close();
}, [userRole]);

// Add to UI (above chat messages)
{['admin', 'superadmin'].includes(userRole) && (
  <>
    {/* Connection indicator */}
    <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-slate-600">
          {sseConnected ? 'Monitoreo Activo' : 'Desconectado'}
        </span>
      </div>
    </div>
    
    {/* Server alerts */}
    {serverAlerts.length > 0 && (
      <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-yellow-700" />
          <span className="text-xs font-bold text-yellow-800">
            Server Alerts ({serverAlerts.length})
          </span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {serverAlerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className="bg-white rounded p-2 border border-yellow-300"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-600">
                  {alert.category}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 mb-1">
                {alert.message}
              </p>
              {alert.suggestedActions && (
                <div className="text-[10px] text-slate-600">
                  • {alert.suggestedActions[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </>
)}
```

---

### Day 5: Firestore Collection Setup

#### Step 5: Create stella_alerts Collection

**File:** `scripts/setup-stella-monitoring.ts`

```typescript
import { firestore } from '../src/lib/firestore';

async function setupStellaMonitoring() {
  console.log('🔧 Setting up Stella monitoring collections...');
  
  // Create sample alert (to establish schema)
  const alertRef = await firestore.collection('stella_alerts').add({
    type: 'performance_degradation',
    severity: 'medium',
    description: 'Sample alert - can be deleted',
    evidence: [],
    suggestedActions: ['Review logs'],
    autoFixAvailable: false,
    affectedUsers: [],
    status: 'resolved',
    acknowledgedAt: new Date(),
    acknowledgedBy: 'system',
    resolvedAt: new Date(),
    resolutionNotes: 'Setup sample',
    detectedAt: new Date(),
    createdAt: new Date(),
    source: 'localhost',
  });
  
  console.log('✅ stella_alerts collection created:', alertRef.id);
  
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Deploy Firestore indexes');
  console.log('2. Test diagnostic logging');
  console.log('3. Test SSE connection');
}

setupStellaMonitoring().catch(console.error);
```

**Run:**
```bash
npx tsx scripts/setup-stella-monitoring.ts
```

#### Step 6: Deploy Firestore Indexes

**Add to `firestore.indexes.json`:**

```json
{
  "indexes": [
    {
      "collectionGroup": "stella_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stella_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Deploy:**
```bash
firebase deploy --only firestore:indexes
```

---

### Day 6-7: Testing & Refinement

#### Step 7: Manual Testing

**Test 1: Trigger Slow Query**

```typescript
// In any endpoint, add artificial delay
await new Promise(resolve => setTimeout(resolve, 1000));

// Should trigger diagnostic log:
// "Slow get_conversations: 1000ms (threshold: 500ms)"
```

**Verify:**
1. Log appears in console
2. Alert appears in Stella sidebar (if SSE connected)
3. Suggested actions shown

**Test 2: SSE Connection**

1. Login as admin
2. Open Stella
3. Check console: "✅ Stella SSE connected"
4. Trigger slow query in another tab
5. Alert should appear in Stella immediately

**Test 3: Multiple Alerts**

1. Trigger 3 different slow operations
2. Verify all 3 appear in Stella
3. Verify sorted by severity/time
4. Verify alerts persist in Firestore

#### Step 8: Performance Baseline

**Measure impact:**

```bash
# Before Stella monitoring
# Check server response times

# After Stella monitoring
# Verify <5% overhead

# SSE connection
# Should add <1MB/hour bandwidth
```

**Expected:**
- Logging overhead: <2ms per operation
- SSE bandwidth: ~500KB/hour
- Memory footprint: <10MB
- CPU impact: <1%

---

## 📊 MVP Success Criteria

### Functional Requirements:

- [x] stella-logger.ts created and working
- [ ] Integrated in 5+ endpoints
- [ ] SSE endpoint streaming logs
- [ ] Stella sidebar shows real-time alerts
- [ ] Performance degradation detected automatically
- [ ] Alerts include suggested actions
- [ ] stella_alerts collection populated

### Non-Functional Requirements:

- [ ] <5% performance overhead
- [ ] SSE stable for >1 hour
- [ ] No memory leaks
- [ ] PII sanitized in logs
- [ ] Works in both localhost and production

### User Experience:

- [ ] Admin sees connection status
- [ ] Alerts appear within 5 seconds
- [ ] UI doesn't freeze with many alerts
- [ ] Alerts are actionable (clear what to do)

---

## 🧪 Testing Scenarios

### Scenario 1: Performance Degradation

**Setup:**
```typescript
// Add delays to simulate slow queries
setTimeout(() => {}, 800); // Exceeds 500ms threshold
```

**Expected:**
1. ⏱️ Metric logged: `get_conversations: 800ms`
2. 🚨 Diagnostic triggered: "Slow get_conversations: 800ms (threshold: 500ms)"
3. 📡 SSE event sent to Stella
4. 💬 Alert appears in Stella sidebar
5. 📋 Suggested actions displayed

---

### Scenario 2: Multiple Slow Queries

**Setup:**
```typescript
// Simulate 5 slow queries in sequence
for (let i = 0; i < 5; i++) {
  await slowOperation();
}
```

**Expected:**
1. 5 separate metric logs
2. 5 diagnostic events
3. All 5 appear in Stella
4. Admin can see pattern of degradation

---

### Scenario 3: SSE Reconnection

**Setup:**
```
1. Start SSE connection
2. Kill server (Ctrl+C)
3. Restart server
4. Check Stella reconnects
```

**Expected:**
1. Connection indicator turns red
2. Browser retries connection automatically
3. Connection indicator turns green
4. New alerts start appearing

---

## 📈 Metrics to Track

### During MVP Week:

**Development Metrics:**
- Lines of code added: ~500
- Endpoints enhanced: 5-10
- New collections: 1 (stella_alerts)
- New API routes: 1 (SSE endpoint)

**Performance Metrics:**
- Logging overhead: <2ms
- SSE bandwidth: <1MB/hour
- Alert latency: <5s
- False positive rate: <20% (acceptable for MVP)

**Quality Metrics:**
- Type errors: 0
- Linter errors: 0
- Broken features: 0
- Regression bugs: 0

---

## 🎯 Daily Goals

### Monday (Day 1):
- [x] Review architecture doc
- [ ] Create stella-logger.ts
- [ ] Test basic diagnostic logging
- [ ] Integrate in 2 endpoints

### Tuesday (Day 2):
- [ ] Integrate in 3 more endpoints
- [ ] Test various severity levels
- [ ] Verify Cloud Logging works (if production)
- [ ] Create setup script

### Wednesday (Day 3):
- [ ] Create SSE endpoint
- [ ] Test SSE connection
- [ ] Implement keep-alive
- [ ] Handle disconnection

### Thursday (Day 4):
- [ ] Update Stella sidebar UI
- [ ] Add connection indicator
- [ ] Add alerts display
- [ ] Test end-to-end flow

### Friday (Day 5):
- [ ] Deploy Firestore indexes
- [ ] Run full testing scenarios
- [ ] Fix any bugs found
- [ ] Document learnings

### Weekend (Optional):
- [ ] Performance tuning
- [ ] Additional endpoint integration
- [ ] Write blog post / demo video
- [ ] Plan Sprint 2

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: SSE Connection Drops

**Problem:** EventSource disconnects frequently

**Solution:**
- Ensure keep-alive pings every 30s
- Handle reconnection gracefully
- Show connection status to user
- Log disconnection events for debugging

### Pitfall 2: Too Many Alerts

**Problem:** Stella UI overwhelmed with alerts

**Solution:**
- Implement severity filtering (show medium+ only)
- Limit display to top 5 most recent
- Aggregate similar alerts
- Add dismiss/snooze functionality

### Pitfall 3: Performance Impact

**Problem:** Logging slows down requests

**Solution:**
- Make all logging async (non-blocking)
- Batch logs if high volume
- Sample (log 1 in N events if under load)
- Circuit breaker (disable if CPU > 80%)

### Pitfall 4: False Positives

**Problem:** Alerts for non-issues

**Solution:**
- Conservative thresholds initially
- Admin feedback ("mark as false positive")
- Tune thresholds based on feedback
- Whitelist known slow operations

---

## 🔍 Debugging Guide

### Issue: Logs not appearing in Stella

**Check:**
```typescript
// 1. Is SSE connected?
console.log('SSE state:', eventSource.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSED

// 2. Are events being emitted?
// Add to stella-logger.ts:
console.log('Emitting to', stellaSubscribers.length, 'subscribers');

// 3. Is metadata.stella_actionable = true?
console.log('Log metadata:', metadata);

// 4. Check browser console for SSE errors
```

**Fix:**
- Verify auth (must be admin)
- Check SSE endpoint returns 200
- Verify Content-Type header
- Check for CORS issues

---

### Issue: Performance overhead too high

**Check:**
```typescript
// Add timing
const start = Date.now();
await stellaLogger.diagnostic(...);
console.log('Logging took:', Date.now() - start, 'ms');
// Should be <5ms
```

**Fix:**
- Make Cloud Logging calls truly async
- Add error handling (don't throw)
- Reduce metadata size
- Batch if necessary

---

### Issue: Alerts not created in Firestore

**Check:**
```typescript
// Verify Firestore connection
const testDoc = await firestore.collection('stella_alerts').add({
  test: true,
  createdAt: new Date(),
});
console.log('Test doc created:', testDoc.id);
```

**Fix:**
- Check GOOGLE_CLOUD_PROJECT env var
- Verify auth: `gcloud auth application-default login`
- Check Firestore rules (admin can write to stella_alerts)
- Review error logs

---

## 📚 Resources

### Code References:
- `src/lib/logger.ts` - Base logger
- `src/pages/api/conversations/[id]/messages-stream.ts` - SSE pattern
- `src/components/StellaSidebarChat.tsx` - Stella UI
- `docs/GCP_OBSERVABILITY_COMPLETE.md` - Logging guide

### Documentation:
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Cloud Logging](https://cloud.google.com/logging/docs)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

## ✅ Definition of Done

### For MVP to be considered complete:

**Code:**
- [ ] stella-logger.ts implemented
- [ ] Integrated in 5+ critical endpoints
- [ ] SSE endpoint working
- [ ] Stella UI shows alerts
- [ ] Type check passes (0 errors)
- [ ] Build succeeds

**Testing:**
- [ ] Manual testing completed
- [ ] All 3 test scenarios pass
- [ ] Performance acceptable
- [ ] No regressions

**Documentation:**
- [ ] Implementation documented
- [ ] API usage examples provided
- [ ] Troubleshooting guide written
- [ ] Success metrics tracked

**Deployment:**
- [ ] Firestore indexes deployed
- [ ] Tested in localhost
- [ ] Ready for production (optional for MVP)

---

## 🚀 Quick Start Commands

```bash
# 1. Create stella-logger.ts
# (Copy code from Step 1 above)

# 2. Create SSE endpoint
# (Copy code from Step 3 above)

# 3. Update Stella sidebar
# (Copy code from Step 4 above)

# 4. Setup collections
npx tsx scripts/setup-stella-monitoring.ts

# 5. Deploy indexes
firebase deploy --only firestore:indexes

# 6. Start dev server
npm run dev

# 7. Test as admin
# - Login as admin
# - Open Stella
# - Trigger slow query
# - Verify alert appears

# 8. Commit
git add .
git commit -m "feat: Stella server feedback MVP - real-time monitoring

Implemented:
- Enhanced diagnostic logging (stella-logger.ts)
- SSE streaming endpoint for server logs
- Real-time alerts in Stella sidebar
- Performance degradation detection
- stella_alerts Firestore collection

Testing:
- Manual testing completed
- SSE connection stable
- Alerts appear in <5s
- Performance overhead <2ms

Next: Pattern detection for errors and user friction
"
```

---

## 🎉 What Success Looks Like

### Week 1 End State:

**Admin opens Stella:**
```
┌─────────────────────────────────────┐
│ Stella - AI Assistant               │
│ ● Monitoreo Activo                  │ ← Green dot
├─────────────────────────────────────┤
│ ⚠️ Server Alerts (2)                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PERFORMANCE                     │ │
│ │ Slow get_shared_agents: 650ms   │ │
│ │ • Check database indexes        │ │
│ │ 2 min ago                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PERFORMANCE                     │ │
│ │ Slow search_rag: 1200ms         │ │
│ │ • Review query complexity       │ │
│ │ 15 min ago                      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Chat interface below]              │
└─────────────────────────────────────┘
```

**Admin can:**
- See real-time system health
- Receive alerts immediately
- Get actionable suggestions
- Click to investigate in logs
- Mark as acknowledged/resolved

**System does:**
- Monitor performance continuously
- Detect degradation automatically
- Alert before users complain
- Provide diagnostic context
- Suggest remediation actions

---

**This guide provides everything needed to implement Stella server feedback MVP in 1 week.** 🚀

**Start with Day 1 and work through sequentially. Each step builds on the previous.** 🏗️






