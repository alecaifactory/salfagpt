# Deploy Agent Metrics Cloud Functions

**Purpose:** Deploy real-time metrics update system  
**Target:** <100ms update time  
**Created:** 2025-11-18

---

## 📋 Prerequisites

```bash
# 1. Verify GCP project
gcloud config get-value project
# Should be: salfagpt (or gen-lang-client-0986191192)

# 2. Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com

# 3. Verify authentication
gcloud auth list
# Should show your authenticated account
```

---

## 🚀 Deployment Steps

### Step 1: Deploy HTTP Trigger (Manual Refresh)

```bash
cd functions

# Deploy updateAgentMetrics function
gcloud functions deploy updateAgentMetrics \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./src \
  --entry-point=updateAgentMetrics \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"
```

**Test:**
```bash
# Get function URL
FUNCTION_URL=$(gcloud functions describe updateAgentMetrics \
  --region=us-central1 \
  --gen2 \
  --format='value(serviceConfig.uri)')

# Test manual refresh
curl "${FUNCTION_URL}?agentId=YOUR_AGENT_ID"
```

---

### Step 2: Deploy Firestore Triggers

**onCreate Trigger:**
```bash
gcloud functions deploy onContextSourceCreate \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./src \
  --entry-point=onContextSourceCreate \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
  --trigger-event-filters="database=(default)" \
  --trigger-event-filters-path-pattern="document=context_sources/{sourceId}" \
  --memory=256MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"
```

**onDelete Trigger:**
```bash
gcloud functions deploy onContextSourceDelete \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./src \
  --entry-point=onContextSourceDelete \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.deleted" \
  --trigger-event-filters="database=(default)" \
  --trigger-event-filters-path-pattern="document=context_sources/{sourceId}" \
  --memory=256MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"
```

**onUpdate Trigger:**
```bash
gcloud functions deploy onContextSourceUpdate \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./src \
  --entry-point=onContextSourceUpdate \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.updated" \
  --trigger-event-filters="database=(default)" \
  --trigger-event-filters-path-pattern="document=context_sources/{sourceId}" \
  --memory=256MB \
  --timeout=60s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"
```

---

### Step 3: Deploy Scheduled Refresh

```bash
gcloud functions deploy refreshStaleMetrics \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./src \
  --entry-point=refreshStaleMetrics \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"
```

**Create Cloud Scheduler job:**
```bash
gcloud scheduler jobs create http refresh-stale-agent-metrics \
  --location=us-central1 \
  --schedule="0 */1 * * *" \
  --uri="${FUNCTION_URL}" \
  --http-method=GET \
  --description="Refresh stale agent metrics every hour"
```

---

## ✅ Verification

### Test Manual Refresh

```bash
# 1. Call function
curl "${FUNCTION_URL}?agentId=Pn6WPNxv8orckxX6xL4L"

# Expected response:
{
  "success": true,
  "message": "Metrics updated for agent Pn6WPNxv8orckxX6xL4L",
  "timestamp": "2025-11-18T20:30:00Z"
}

# 2. Verify in Firestore
# Check agent_metrics_cache/Pn6WPNxv8orckxX6xL4L document exists
```

---

### Test Firestore Triggers

```bash
# 1. Create a test context source via API
curl -X POST https://your-api.run.app/api/context-sources \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "name": "Test Document",
    "type": "pdf",
    "assignedToAgents": ["Pn6WPNxv8orckxX6xL4L"],
    "status": "active"
  }'

# 2. Wait 2-3 seconds for function to execute

# 3. Check Cloud Functions logs
gcloud functions logs read onContextSourceCreate \
  --region=us-central1 \
  --gen2 \
  --limit=20

# Expected log:
✅ Updated metrics for Pn6WPNxv8orckxX6xL4L in XXms (trigger: document_added)

# 4. Verify metrics updated in Firestore
# documentCount should have increased by 1
```

---

## 📊 Monitoring

### View Function Logs

```bash
# Real-time logs
gcloud functions logs tail updateAgentMetrics \
  --region=us-central1 \
  --gen2

# Recent logs
gcloud functions logs read updateAgentMetrics \
  --region=us-central1 \
  --gen2 \
  --limit=50
```

---

### Check Function Performance

```bash
# Get function metrics
gcloud functions describe updateAgentMetrics \
  --region=us-central1 \
  --gen2 \
  --format="json" | jq '.serviceConfig.timeoutSeconds, .serviceConfig.availableMemory'
```

---

### Monitor Execution Times

```sql
-- In BigQuery (if logging to BigQuery)
SELECT
  TIMESTAMP_TRUNC(timestamp, MINUTE) as minute,
  AVG(CAST(JSON_EXTRACT_SCALAR(jsonPayload, '$.duration') AS INT64)) as avg_duration_ms,
  COUNT(*) as executions
FROM `salfagpt.logs.cloud_functions`
WHERE resource.labels.function_name = 'updateAgentMetrics'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY minute
ORDER BY minute DESC
LIMIT 100;
```

---

## 🔧 Troubleshooting

### Function Not Triggering

**Check trigger configuration:**
```bash
gcloud functions describe onContextSourceCreate \
  --region=us-central1 \
  --gen2 \
  --format="json" | jq '.eventTrigger'
```

**Verify Firestore is triggering:**
- Check Cloud Functions logs
- Verify document path matches trigger pattern
- Ensure database name is correct: `(default)`

---

### Slow Execution

**If function exceeds 100ms:**

1. **Check document count:**
   - Query: `.where('assignedToAgents', 'array-contains', agentId)`
   - If >1000 documents: Need pagination

2. **Optimize query:**
   - Use `.select()` to fetch only needed fields
   - Add composite indexes if needed

3. **Increase memory:**
   ```bash
   --memory=512MB  # from 256MB
   ```

---

### Permission Errors

**Error:** "Permission denied"

**Fix:**
```bash
# Grant Firestore access to function service account
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:salfagpt@appspot.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 🎯 Success Criteria

- [ ] Functions deploy without errors
- [ ] HTTP trigger responds in <200ms
- [ ] Firestore triggers execute in <100ms
- [ ] Metrics cache updates on document changes
- [ ] Logs show successful executions
- [ ] No permission errors
- [ ] Scheduled job runs successfully

---

## 🔄 Update Process

**When updating function code:**

```bash
# 1. Make changes to functions/src/updateAgentMetrics.ts

# 2. Redeploy (same commands as above)
gcloud functions deploy updateAgentMetrics ...

# 3. Test
curl "${FUNCTION_URL}?agentId=test-agent"

# 4. Monitor
gcloud functions logs tail updateAgentMetrics --gen2
```

---

## 📚 References

- **Architecture:** `docs/API_METRICS_ARCHITECTURE.md`
- **Type definitions:** `src/types/metrics-cache.ts`
- **Core library:** `src/lib/agent-metrics-cache.ts`
- **Cloud Functions:** `functions/src/updateAgentMetrics.ts`

---

**Next:** Deploy these functions, then integrate with UI for <50ms agent metrics! 🚀


