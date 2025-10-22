# BigQuery Agent-Source Assignments Setup

## 🎯 Purpose

This document explains how to set up the `agent_source_assignments` table in BigQuery to enable fast agent-based vector search without querying Firestore first.

## 📊 Architecture

### Before (Slow - 48+ seconds)
```
1. Frontend loads all 89 sources from Firestore (48s)
2. Frontend filters to assigned sources
3. Frontend sends source IDs to backend
4. Backend searches chunks by source IDs
```

### After (Fast - <500ms)
```
1. Frontend sends agentId only
2. Backend queries BigQuery assignments table (50ms)
3. Backend searches chunks directly
4. Everything stays in BigQuery - no Firestore loading!
```

## 🚀 Setup Instructions

### Step 1: Create BigQuery Table

Run the SQL script to create the table:

```bash
# Make script executable
chmod +x scripts/create-assignments-table.sh

# Run script
./scripts/create-assignments-table.sh
```

Or manually:

```bash
bq query --project_id=salfagpt \
  --use_legacy_sql=false \
  < sql/create_agent_source_assignments_table.sql
```

### Step 2: Backfill Existing Assignments

Sync all existing Firestore assignments to BigQuery:

```bash
# Run backfill script
npx tsx scripts/backfill-agent-assignments.ts
```

This will:
- Load all context sources from Firestore
- Extract agent assignments
- Bulk insert into BigQuery
- Report progress and errors

**Expected output:**
```
🔄 Starting backfill of agent-source assignments to BigQuery...

1/3 Loading context sources from Firestore...
   ✓ Found 150 sources with assignments

2/3 Grouping assignments by agent...
   ✓ Found 45 unique agents with assignments

3/3 Syncing to BigQuery...
   Progress: 10/45 agents synced...
   Progress: 20/45 agents synced...
   ...

✅ Backfill complete!
   Success: 45 agents
   Errors: 0 agents
   Total assignments: 342

🎉 All done! Agent-based search should now work optimally.
```

### Step 3: Verify Setup

Check that assignments were created:

```bash
bq query --project_id=salfagpt \
  --use_legacy_sql=false \
  "SELECT agentId, COUNT(*) as sourceCount 
   FROM \`salfagpt.flow_analytics.agent_source_assignments\`
   WHERE isActive = true
   GROUP BY agentId
   ORDER BY sourceCount DESC
   LIMIT 10"
```

## 🔄 How It Works

### When Chat is Created

1. **Frontend:** User clicks "Nuevo Chat" on an agent
2. **Backend:** Chat inherits context from parent agent (Firestore)
3. **Frontend:** Calls `PUT /api/conversations/{chatId}/context-sources`
4. **Backend:** 
   - Saves `activeContextSourceIds` to Firestore ✅
   - Syncs assignments to BigQuery (new!) ✅

### When Source is Uploaded

1. **Frontend:** User uploads PDF to current agent/chat
2. **Backend:** 
   - Creates source in Firestore with `assignedToAgents: [agentId]` ✅
   - Syncs assignment to BigQuery (new!) ✅

### When Message is Sent

1. **Frontend:** Sends `agentId` + `message` (no source IDs needed!)
2. **Backend:**
   - Queries BigQuery assignments table by `agentId` (fast!)
   - Gets source IDs
   - Searches chunks with source filter
   - Returns references ✅

## 📋 Table Schema

```sql
CREATE TABLE agent_source_assignments (
  agentId STRING NOT NULL,           -- Agent/chat ID
  sourceId STRING NOT NULL,          -- Context source ID
  userId STRING NOT NULL,            -- Owner
  assignedAt TIMESTAMP NOT NULL,     -- When assigned
  isActive BOOLEAN NOT NULL,         -- false when unassigned
  unassignedAt TIMESTAMP,            -- When unassigned
  source STRING NOT NULL,            -- 'localhost' | 'production'
  syncedAt TIMESTAMP NOT NULL,       -- When synced to BigQuery
  assignmentId STRING,               -- For deduplication
  sourceName STRING,                 -- For reporting
  sourceType STRING,                 -- For analytics
  createdBy STRING,                  -- Who created assignment
  inheritedFrom STRING               -- If chat inherited from agent
)
PARTITION BY DATE(assignedAt)
CLUSTER BY agentId, userId, isActive;
```

## 🔍 Monitoring

### Check Assignment Count

```bash
# Total assignments
bq query --project_id=salfagpt --use_legacy_sql=false \
  "SELECT COUNT(*) as total FROM \`salfagpt.flow_analytics.agent_source_assignments\` WHERE isActive = true"

# Per agent
bq query --project_id=salfagpt --use_legacy_sql=false \
  "SELECT agentId, COUNT(*) as sources 
   FROM \`salfagpt.flow_analytics.agent_source_assignments\` 
   WHERE isActive = true 
   GROUP BY agentId 
   ORDER BY sources DESC"
```

### Check Sync Lag

```bash
# Sources in Firestore vs BigQuery
bq query --project_id=salfagpt --use_legacy_sql=false \
  "SELECT 
     DATE(assignedAt) as date,
     COUNT(*) as assignments,
     COUNT(DISTINCT agentId) as agents,
     COUNT(DISTINCT sourceId) as sources
   FROM \`salfagpt.flow_analytics.agent_source_assignments\`
   WHERE isActive = true
   GROUP BY date
   ORDER BY date DESC
   LIMIT 7"
```

## 🐛 Troubleshooting

### Agent search returns 0 results

**Check:** Are assignments in BigQuery?

```bash
# Check for specific agent
bq query --project_id=salfagpt --use_legacy_sql=false \
  "SELECT * FROM \`salfagpt.flow_analytics.agent_source_assignments\`
   WHERE agentId = 'YOUR_AGENT_ID' AND isActive = true"
```

**If 0 rows:** Run backfill script or check sync logs

### Assignments not syncing

**Check:** Backend logs for sync errors

Look for:
- ✅ `🔗 Syncing source X to Y agents in BigQuery`
- ⚠️ `⚠️ Failed to sync assignment to BigQuery`

**Common causes:**
- BigQuery table doesn't exist (run Step 1)
- Permissions issue (check service account)
- Network timeout (retry)

## 📈 Performance Impact

### Before (Firestore-only)
- Load sources: **48+ seconds** ❌
- Filter assignments: **in-memory**
- Total: **48+ seconds per agent switch**

### After (BigQuery-synced)  
- Query assignments: **<50ms** ✅
- Search chunks: **<200ms** ✅
- Total: **<500ms per message**

**Improvement: 96x faster!** 🚀

## ✅ Success Criteria

After setup, verify:

1. **Table exists:**
   ```bash
   bq show salfagpt.flow_analytics.agent_source_assignments
   ```

2. **Has data:**
   ```bash
   bq query "SELECT COUNT(*) FROM \`salfagpt.flow_analytics.agent_source_assignments\`"
   # Should return > 0
   ```

3. **Agent search works:**
   - Create new chat
   - Send message
   - Check backend logs for: `✓ Found N sources from BigQuery assignments table`
   - Verify references appear in response

4. **Sync works:**
   - Upload new PDF
   - Check logs for: `🔗 Syncing source X to Y agents in BigQuery`
   - Query BigQuery to confirm new row

## 🔐 Security

- ✅ All queries filter by `userId` (user isolation)
- ✅ Assignments table respects same userId boundaries
- ✅ No cross-user data leakage possible
- ✅ Sync is non-blocking (won't crash app if fails)

## 📝 Maintenance

### Daily
- Monitor sync error rate in logs
- Check assignment count growth

### Weekly  
- Compare Firestore vs BigQuery counts
- Investigate any discrepancies

### Monthly
- Run full reconciliation
- Backfill any missing assignments

## 🎓 Lessons Learned

1. ✅ **BigQuery is source of truth for search** - faster than Firestore
2. ✅ **Dual write pattern** - Firestore (durable) + BigQuery (fast)
3. ✅ **Non-blocking sync** - don't wait for BigQuery, fail gracefully
4. ✅ **Fallback to Firestore** - graceful degradation if BigQuery fails
5. ✅ **Development mode skips BigQuery** - faster local iteration

---

**Last Updated:** 2025-10-22  
**Status:** ✅ Ready for Production  
**Performance:** 96x faster than Firestore-only approach

