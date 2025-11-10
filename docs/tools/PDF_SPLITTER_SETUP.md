# PDF Splitter Tool - Setup Guide

## 🎯 Purpose

Enable automatic splitting of large PDFs (50MB+) into 20MB chunks without quality loss, using Cloud Functions for serverless processing.

---

## 🚀 Quick Start (5 minutes)

### 1. Deploy Infrastructure

```bash
# From project root
./scripts/setup-tool-infrastructure.sh
```

This will:
- ✅ Create GCS bucket: `salfagpt-tool-outputs`
- ✅ Configure IAM permissions
- ✅ Deploy Cloud Function: `pdf-splitter-tool`
- ✅ Return function URL

### 2. Configure Environment

Add to `.env`:
```bash
PDF_SPLITTER_FUNCTION_URL=https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool
```

### 3. Restart Dev Server

```bash
npm run dev
```

### 4. Test

1. Open http://localhost:3000/chat
2. Click "+ Agregar" in Context Sources
3. Upload PDF >50MB
4. Click "Dividir PDF Automáticamente" button
5. Wait ~2-3 minutes
6. Receive chunks as individual PDFs

---

## 📊 How It Works

### User Flow

```
User uploads 300MB PDF
    ↓
UI shows "Split PDF" button (files >50MB)
    ↓
User clicks button
    ↓
Frontend uploads to GCS
    ↓
API calls Cloud Function
    ↓
Cloud Function:
  - Downloads PDF from GCS
  - Splits into 20MB chunks
  - Uploads chunks to GCS
  - Returns signed URLs
    ↓
Frontend polls for completion
    ↓
UI shows success + chunk count
    ↓
User can download chunks individually
```

### Architecture

```
┌────────────────┐
│  Frontend      │
│  AddSource     │
│  Modal         │
└───────┬────────┘
        │ FormData (PDF file)
        ↓
┌────────────────┐
│  API Endpoint  │
│  /api/tools/   │
│  split-pdf     │
└───────┬────────┘
        │ 1. Upload to GCS
        │ 2. Invoke Cloud Function
        │ 3. Create execution record
        ↓
┌────────────────┐
│  Cloud         │
│  Function      │
│  pdf-splitter  │
│  -tool         │
└───────┬────────┘
        │ 1. Download from GCS
        │ 2. Split with pdf-lib
        │ 3. Upload chunks to GCS
        │ 4. Return signed URLs
        ↓
┌────────────────┐
│  Firestore     │
│  tool_         │
│  executions    │
└────────────────┘
```

---

## 🔐 Security

### Authentication
- ✅ All API calls require valid session
- ✅ Execution records tied to userId
- ✅ Signed URLs expire in 7 days

### Authorization
- ✅ Users can only access their own executions
- ✅ Cloud Function validates request origin
- ✅ GCS buckets have IAM restrictions

### Data Privacy
- ✅ Input files in user-specific paths: `tool-inputs/{userId}/`
- ✅ Output chunks in execution-specific paths: `tool-outputs/{userId}/{executionId}/`
- ✅ Auto-delete after 30 days (GCS lifecycle policy)

---

## 💰 Cost Estimation

### Per Execution (300MB PDF → 15 chunks)

**Cloud Function:**
- Memory: 4GB
- Duration: ~2.5 min
- Cost: $0.40/GB-sec × 4GB × 150s / 1000 = **$0.024**

**Cloud Storage:**
- Input: 300MB × $0.02/GB/month = **$0.006/month**
- Output: 15 × 20MB × $0.02/GB/month = **$0.006/month**
- Auto-deleted after 30 days

**Network:**
- Upload: 300MB (free - same region)
- Download: 300MB (signed URLs) = **$0.036**

**Total per execution: ~$0.066** (6.6 cents)

### Monthly Costs

| Usage | Executions/Month | Cost/Month |
|-------|------------------|------------|
| Light | 10 | $0.66 |
| Medium | 50 | $3.30 |
| Heavy | 200 | $13.20 |

---

## 🧪 Testing

### Test 1: Small PDF (Should Not Trigger Split)

```bash
# Upload 10MB PDF
# Expected: Normal extraction flow (no split button)
```

### Test 2: Medium PDF (Triggers Split Button)

```bash
# Upload 60MB PDF
# Expected: Split button appears, creates 3 chunks
```

### Test 3: Large PDF (Performance Test)

```bash
# Upload 300MB PDF
# Expected: Completes in 2-3 minutes, creates 15 chunks
```

### Manual API Test

```bash
# Create test execution
curl -X POST http://localhost:3000/api/tools/split-pdf \
  -F "file=@/path/to/large-file.pdf" \
  -F "chunkSizeMB=20" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"

# Response
{
  "success": true,
  "executionId": "exec_20251102_abc123",
  "status": "pending",
  "pollUrl": "/api/tools/status/exec_20251102_abc123"
}

# Poll for status
curl http://localhost:3000/api/tools/status/exec_20251102_abc123 \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue 1: "Cloud Function URL not set"

**Solution:**
```bash
# Add to .env
PDF_SPLITTER_FUNCTION_URL=https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool

# Restart server
npm run dev
```

### Issue 2: "Permission denied" on GCS

**Solution:**
```bash
# Grant permissions to Cloud Function service account
SERVICE_ACCOUNT="gen-lang-client-0986191192@appspot.gserviceaccount.com"

gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://salfagpt-uploads
gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://salfagpt-tool-outputs
```

### Issue 3: "Function timeout"

**Solution:**
- Files >200MB may take >9 minutes
- Increase timeout: `--timeout=900s` (15 min max for Cloud Functions 2nd gen)
- Or split file before uploading

### Issue 4: "Chunks not appearing"

**Diagnosis:**
```bash
# Check execution status in Firestore
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('tool_executions').doc('EXECUTION_ID').get();
console.log(doc.data());
process.exit(0);
"
```

---

## 📈 Monitoring

### Cloud Function Logs

```bash
# View logs
gcloud functions logs read pdf-splitter-tool \
  --region=us-central1 \
  --limit=50

# Follow logs in real-time
gcloud functions logs tail pdf-splitter-tool \
  --region=us-central1
```

### Firestore Executions

Check `tool_executions` collection in Firebase Console:
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Ftool_executions

### GCS Storage

```bash
# List tool outputs
gsutil ls -r gs://salfagpt-tool-outputs/

# Check bucket size
gsutil du -sh gs://salfagpt-tool-outputs/
```

---

## 🔄 Maintenance

### Monthly Cleanup

```bash
# GCS auto-deletes after 30 days (lifecycle policy)
# But you can manually clean old executions:

# Delete executions >30 days old
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const snapshot = await firestore.collection('tool_executions')
  .where('createdAt', '<', cutoff)
  .get();
console.log('Deleting', snapshot.size, 'old executions');
const batch = firestore.batch();
snapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
process.exit(0);
"
```

### Cost Monitoring

```bash
# View Cloud Function costs
gcloud billing accounts list
gcloud billing budgets list
```

---

## 🚀 Next Steps (Future Enhancements)

1. **Document Embedder Tool**
   - Generate embeddings for chunks
   - Store in vector database
   - Enable semantic search

2. **Admin Tool Manager UI**
   - Enable/disable tools
   - Configure quotas
   - View execution history
   - Cost analytics

3. **Advanced Features**
   - OCR for scanned PDFs
   - Table extraction
   - Image analysis
   - Multi-language support

---

## 📚 References

- Cloud Functions: https://cloud.google.com/functions/docs
- GCS: https://cloud.google.com/storage/docs
- pdf-lib: https://pdf-lib.js.org/
- Firestore: https://firebase.google.com/docs/firestore

---

**Last Updated:** 2025-11-02  
**Version:** 1.0.0  
**Status:** ✅ Ready for Deployment







