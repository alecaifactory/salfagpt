# CLI Event Tracking & Traceability

## 🎯 Purpose

Every CLI operation is tracked with full attribution to ensure complete traceability of:
- **Who** performed the action (user email + userId)
- **What** was done (command, files, results)
- **When** it happened (timestamps, duration)
- **Where** it came from (CLI vs webapp, machine, platform)
- **How** it performed (success, errors, costs)

**Created:** 2025-10-19  
**Version:** 0.1.0  
**Status:** ✅ Implemented

---

## 📊 Data Collections

### 1. `cli_events` - Operation-Level Tracking

**Every CLI operation creates events in Firestore:**

```typescript
Collection: cli_events
Document: {
  eventType: 'cli_upload_start' | 'cli_file_uploaded' | ...,
  userId: '114671162830729001607',    // Alec's ID
  userEmail: 'alec@getaifactory.com', // Easy identification
  source: 'cli',                       // Distinguishes from webapp
  cliVersion: '0.1.0',                // Version tracking
  
  operation: 'upload',                // Command type
  folderPath: 'contextos/pdf/agentes/M001',
  fileName: 'manual.pdf',             // For file-level events
  
  success: true,                      // Result
  duration: 2300,                     // Milliseconds
  
  model: 'gemini-2.5-flash',          // AI model used (v0.2+)
  inputTokens: 1234,                  // Tokens in (v0.2+)
  outputTokens: 567,                  // Tokens out (v0.2+)
  estimatedCost: 0.0012,              // USD (v0.2+)
  
  gcsPath: 'gs://bucket/path/file',  // GCS location (v0.2+)
  firestoreDocId: 'source-abc123',    // Created document (v0.2+)
  
  timestamp: Date,                    // When it happened
  sessionId: 'cli-session-123',       // Groups related events
  hostname: 'cli-machine',            // Machine info
  nodeVersion: 'v20.11.0',            // Node version
  platform: 'darwin',                 // OS
}
```

---

### 2. `cli_sessions` - Session-Level Summary

**Each CLI invocation creates a session record:**

```typescript
Collection: cli_sessions
Document: {
  id: 'cli-session-1760917821117-s9011',
  userId: '114671162830729001607',
  userEmail: 'alec@getaifactory.com',
  command: 'upload contextos/pdf/agentes/M001',
  cliVersion: '0.1.0',
  
  startedAt: Date,
  endedAt: Date,
  duration: 45300,  // Total session duration (ms)
  
  eventsCount: 6,              // Events generated
  filesProcessed: 3,           // Files in batch
  filesSucceeded: 3,
  filesFailed: 0,
  success: true,
  
  totalCost: 0.0041,          // Total session cost (v0.2+)
  totalTokens: 5678,          // Total tokens (v0.2+)
  
  source: 'cli',
}
```

---

## 🔍 Event Types

### Upload Events

| Event Type | When It Fires | Data Captured |
|------------|---------------|---------------|
| `cli_upload_start` | Upload command starts | folder, user, session |
| `cli_file_uploaded` | Each file uploaded | fileName, size, gcsPath |
| `cli_file_extracted` | Text extracted from file | model, tokens, cost |
| `cli_file_failed` | File processing fails | fileName, error |
| `cli_upload_complete` | Upload batch finishes | summary stats |
| `cli_upload_failed` | Upload batch fails | error details |

### Search Events (v0.3+)

| Event Type | When It Fires | Data Captured |
|------------|---------------|---------------|
| `cli_search_query` | Search performed | query, results, duration |

### Index Events (v0.3+)

| Event Type | When It Fires | Data Captured |
|------------|---------------|---------------|
| `cli_index_rebuild` | Index rebuilt | agentId, chunks, duration |

### Config Events (v0.4+)

| Event Type | When It Fires | Data Captured |
|------------|---------------|---------------|
| `cli_config_updated` | Config changed | setting, old, new values |

### Error Events

| Event Type | When It Fires | Data Captured |
|------------|---------------|---------------|
| `cli_error` | Any error occurs | error message, stack, context |

---

## 🔎 Query Examples

### Get All Events for Alec

```typescript
const events = await firestore
  .collection('cli_events')
  .where('userId', '==', '114671162830729001607')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();

console.log(`Alec has ${events.size} CLI events`);
```

### Get Events for a Session

```typescript
const sessionEvents = await firestore
  .collection('cli_events')
  .where('sessionId', '==', 'cli-session-123')
  .orderBy('timestamp', 'asc')
  .get();

// Shows complete timeline of what happened in that session
```

### Get Upload Success Rate

```typescript
const uploads = await firestore
  .collection('cli_events')
  .where('eventType', '==', 'cli_file_uploaded')
  .where('userId', '==', '114671162830729001607')
  .get();

const succeeded = uploads.docs.filter(doc => doc.data().success);
const successRate = (succeeded.length / uploads.size) * 100;

console.log(`Upload success rate: ${successRate.toFixed(1)}%`);
```

### Get Total CLI Costs

```typescript
const sessions = await firestore
  .collection('cli_sessions')
  .where('userId', '==', '114671162830729001607')
  .get();

const totalCost = sessions.docs
  .reduce((sum, doc) => sum + (doc.data().totalCost || 0), 0);

console.log(`Total CLI costs: $${totalCost.toFixed(4)}`);
```

---

## 📈 Analytics Queries (BigQuery - Future)

### Daily CLI Usage

```sql
SELECT
  DATE(timestamp) AS date,
  COUNT(DISTINCT userId) AS active_users,
  COUNT(DISTINCT sessionId) AS sessions,
  SUM(filesProcessed) AS files_processed,
  SUM(estimatedCost) AS total_cost
FROM `gen-lang-client-0986191192.flow_analytics.cli_events`
WHERE eventType = 'cli_upload_complete'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

### Most Active CLI Users

```sql
SELECT
  userEmail,
  COUNT(DISTINCT sessionId) AS sessions,
  SUM(filesProcessed) AS total_files,
  SUM(estimatedCost) AS total_cost,
  AVG(duration) AS avg_duration_ms
FROM `gen-lang-client-0986191192.flow_analytics.cli_sessions`
WHERE DATE(startedAt) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY userEmail
ORDER BY sessions DESC
LIMIT 20;
```

### CLI vs Webapp Comparison

```sql
-- Compare upload sources
SELECT
  source,  -- 'cli' or 'webapp'
  COUNT(*) AS uploads,
  AVG(duration) AS avg_duration_ms,
  SUM(estimatedCost) AS total_cost
FROM `gen-lang-client-0986191192.flow_analytics.context_sources`
WHERE DATE(addedAt) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY source;
```

---

## 🔐 Privacy & Security

### User Attribution

**All events linked to user:**
- `userId`: Immutable user identifier
- `userEmail`: Human-readable, easier to search
- `source`: Always 'cli' for CLI operations

**Benefits:**
- ✅ Complete audit trail
- ✅ Cost attribution per user
- ✅ Usage patterns analysis
- ✅ Security monitoring

### Data Isolation

**CLI respects same privacy rules as webapp:**
- Users can only upload to their own context
- Admin can upload for any user (with `--user` flag)
- All events filtered by userId in queries
- No cross-user data leakage

---

## 📝 Log File Integration

### Local Log (`salfagpt-cli-log.md`)

**Enhanced with traceability:**

```markdown
## Upload Session - 2025-10-19T10:30:45.123Z

**Session ID:** `cli-session-1760917821117-s9011`  
**User:** alec@getaifactory.com (`114671162830729001607`)  
**Source:** CLI v0.1.0  
**Folder:** `contextos/pdf/agentes/M001`  
**Total Files:** 3  
**Success:** 3  
**Failed:** 0  

### Files Processed

| File | Size (KB) | Status | Firestore Tracking |
|------|-----------|--------|--------------------|
| manual.pdf | 1,270 | ✅ Success | Logged to `cli_events` |
| policies.pdf | 854 | ✅ Success | Logged to `cli_events` |
| faq.pdf | 432 | ✅ Success | Logged to `cli_events` |

### Traceability

All operations tracked in Firestore:
- **Collection:** `cli_events`
- **Session Collection:** `cli_sessions`
- **User Attribution:** All events linked to `alec@getaifactory.com`
- **Origin Tracking:** Source field = `cli` (distinguishes from webapp)

---
```

**Benefits:**
- Local file for quick review (markdown)
- Links to Firestore for detailed query
- Session ID for correlation
- User attribution for multi-user environments

---

## 🎯 Use Cases

### 1. Cost Attribution

**Question:** How much did Alec spend on CLI uploads this month?

**Answer:**
```typescript
const sessions = await firestore
  .collection('cli_sessions')
  .where('userId', '==', '114671162830729001607')
  .where('startedAt', '>=', startOfMonth)
  .get();

const totalCost = sessions.docs
  .reduce((sum, doc) => sum + (doc.data().totalCost || 0), 0);
```

---

### 2. Debugging Failed Uploads

**Question:** Why did yesterday's upload fail?

**Answer:**
```typescript
const failedEvents = await firestore
  .collection('cli_events')
  .where('userId', '==', '114671162830729001607')
  .where('success', '==', false)
  .where('timestamp', '>=', yesterday)
  .get();

failedEvents.forEach(doc => {
  const data = doc.data();
  console.log(`Failed: ${data.fileName}`);
  console.log(`Error: ${data.errorMessage}`);
  console.log(`Session: ${data.sessionId}`);
});
```

---

### 3. Usage Patterns

**Question:** What documents does Alec upload most often?

**Answer:**
```typescript
const uploads = await firestore
  .collection('cli_events')
  .where('userId', '==', '114671162830729001607')
  .where('eventType', '==', 'cli_file_uploaded')
  .get();

const fileTypes = {};
uploads.forEach(doc => {
  const type = doc.data().fileName.split('.').pop();
  fileTypes[type] = (fileTypes[type] || 0) + 1;
});

console.log('File types uploaded:', fileTypes);
// { pdf: 45, docx: 12, csv: 8, xlsx: 5 }
```

---

### 4. Performance Monitoring

**Question:** Is CLI extraction getting slower?

**Answer:**
```sql
SELECT
  DATE(timestamp) AS date,
  AVG(duration) AS avg_duration_ms,
  COUNT(*) AS extractions
FROM `cli_events`
WHERE eventType = 'cli_file_extracted'
  AND userId = '114671162830729001607'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date;
```

---

## 🔧 Development Mode Behavior

### Local Development

**Events are logged to console, NOT Firestore:**

```typescript
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

if (IS_DEVELOPMENT) {
  console.log('📊 [DEV] Would track CLI event:', {
    type: event.eventType,
    user: event.userEmail,
    operation: event.operation,
    success: event.success,
  });
  return; // Skip Firestore write
}
```

**Why:**
- Avoids polluting Firestore with dev data
- Faster development (no network calls)
- Console output shows what would be tracked

### Production Mode

**Events are saved to Firestore:**
- Full event data persisted
- Session summaries created
- Analytics available
- Complete audit trail

---

## ✅ Benefits

### For Developers
- 🐛 **Debug issues faster:** Complete event history
- 📊 **Monitor performance:** Duration tracking
- 💰 **Track costs:** Per-session cost attribution
- 🔍 **Audit trail:** Know exactly what happened

### For Admins
- 👥 **User activity:** Who's using CLI, how much
- 💵 **Cost allocation:** Charge-back per user/department
- 📈 **Usage patterns:** Popular commands, files
- 🚨 **Error monitoring:** Track failure rates

### For Product
- 📊 **Feature adoption:** CLI vs webapp usage
- ⏱️ **Performance:** Identify slow operations
- 💡 **Improvements:** Data-driven feature decisions
- 🎯 **Success metrics:** Track KPIs

---

## 🔒 Privacy & Compliance

### What We Track

**✅ We DO track:**
- User ID and email (attribution)
- Commands run (audit)
- Files processed (metadata only - names, sizes)
- Success/failure (debugging)
- Duration and performance (optimization)
- Costs (billing)

**❌ We DON'T track:**
- File contents (never logged)
- Personal data in files
- Credentials or API keys
- User's file system structure (beyond folder arg)
- Network details beyond operation success

### Data Retention

**Firestore (Operational):**
- Keep for 90 days
- User can request deletion
- Admin can purge old sessions

**BigQuery (Analytics - Future):**
- Aggregated, anonymized after 30 days
- Individual events purged after 90 days
- Long-term trends (>1 year) anonymized

---

## 📚 Implementation Files

**Created:**
- ✅ `cli/lib/analytics.ts` - Tracking functions
- ✅ `cli/index.ts` - Integrated tracking calls
- ✅ `.cursor/rules/data.mdc` - Schema documentation

**Updated:**
- ✅ `salfagpt-cli-log.md` - Enhanced with session ID and user
- ✅ `docs/features/salfagpt-cli-roadmap.md` - Mentions tracking

---

## 🧪 Testing Tracking

### Test 1: Event Creation

```bash
# Run upload command
npx tsx cli/index.ts upload contextos/pdf/agentes/M001

# Check console output (dev mode)
# Should see: "📊 [DEV] Would track CLI event: ..."
```

**Expected:**
- ✅ Shows user: alec@getaifactory.com
- ✅ Shows session ID
- ✅ Shows event types
- ✅ Logs to salfagpt-cli-log.md with session ID

### Test 2: Firestore Events (Production)

```bash
# Set production mode
export NODE_ENV=production

# Run command
npx tsx cli/index.ts upload contextos/pdf/agentes/M001

# Check Firestore
# Collection: cli_events should have new documents
```

### Test 3: Query Events

```typescript
// Get Alec's CLI activity
const events = await firestore
  .collection('cli_events')
  .where('userEmail', '==', 'alec@getaifactory.com')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();

console.log(`Last 10 CLI operations by Alec:`);
events.forEach(doc => {
  const data = doc.data();
  console.log(`- ${data.eventType}: ${data.operation} (${data.success ? 'success' : 'failed'})`);
});
```

---

## 🎯 Success Metrics

### v0.1.0 ✅
- [x] Events tracked to console in dev mode
- [x] Session IDs generated uniquely
- [x] User attribution (alec@getaifactory.com)
- [x] Source tracking (cli)
- [x] Log file includes session ID
- [x] No errors during tracking

### v0.2.0 (Next)
- [ ] Events saved to Firestore
- [ ] File-level tracking with GCS paths
- [ ] Extraction tracking with model/tokens/cost
- [ ] Session summaries in `cli_sessions`
- [ ] Query API endpoint working

---

## 🔮 Future Enhancements

### v0.3.0 - Advanced Analytics
- Real-time dashboard of CLI usage
- Cost reports per user
- Performance trends over time
- Anomaly detection (unusual patterns)

### v0.4.0 - Alerting
- Slack notification on errors
- Email digest of weekly CLI activity
- Cost threshold alerts
- Performance degradation alerts

### v0.5.0 - Multi-Tenant
- Track CLI usage per organization
- Department-level cost allocation
- Team analytics
- Shared session visibility

---

## 📖 Related Documentation

- `.cursor/rules/data.mdc` - Schema for `cli_events` and `cli_sessions`
- `.cursor/rules/privacy.mdc` - Privacy principles
- `docs/features/salfagpt-cli-roadmap.md` - Full CLI roadmap
- `cli/lib/analytics.ts` - Implementation

---

**Last Updated:** 2025-10-19  
**Version:** 0.1.0  
**Status:** ✅ Tracking Implemented  
**User:** alec@getaifactory.com (default)  
**Next:** v0.2.0 - Real Firestore writes

---

**Remember:** Every CLI operation is traceable. Source field = 'cli' distinguishes from webapp. User attribution ensures accountability.

