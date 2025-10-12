# 📦 Storage Architecture - Flow Platform

**Date**: October 12, 2025  
**Status**: ✅ Configured and Working

---

## 🗂️ Where Files Are Stored

### Cloud Storage Bucket

**Bucket Name**: `gen-lang-client-0986191192-uploads`  
**Location**: `us-central1` (Iowa)  
**Storage Class**: Standard

**Console URL**: https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads?project=gen-lang-client-0986191192

---

## 📁 File Organization

### Directory Structure

```
gs://gen-lang-client-0986191192-uploads/
└── documents/
    ├── 1728778912345-CV_Tomas_Alarcon_ESP.pdf
    ├── 1728778923456-Document_Demo.pdf
    ├── 1728779034567-Sales_Report_Q4.pdf
    └── ... (more files)
```

**Naming Convention**:
```
documents/{timestamp}-{sanitized_filename}
```

**Example**:
- Original: `CV Tomás Alarcón - ESP.pdf`
- Stored as: `1728778912345-CV_Tomas_Alarcon___ESP.pdf`

---

## 🔐 Permissions & Security

### Service Account Permissions

**Cloud Run Service Account**: `1030147139179-compute@developer.gserviceaccount.com`

**Required Roles**:
- `roles/storage.objectAdmin` - To upload, read, and delete files

**How to Grant** (if needed):
```bash
gcloud storage buckets add-iam-policy-binding \
  gs://gen-lang-client-0986191192-uploads \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" \
  --project gen-lang-client-0986191192
```

**Verify Permissions**:
```bash
gcloud storage buckets get-iam-policy \
  gs://gen-lang-client-0986191192-uploads \
  --project gen-lang-client-0986191192
```

---

## 🔄 Lifecycle & Data Flow

### Upload Flow

```
1. User selects PDF file in UI
   ↓
2. Frontend sends to /api/extract-document
   ↓
3. API receives file (in memory)
   ↓
4. API uploads file to Cloud Storage
   - Path: documents/{timestamp}-{filename}
   - Returns: storagePath, storageUrl, bucketName
   ↓
5. API processes file with Gemini AI
   - Sends file content (base64) to Gemini
   - Extracts: text, tables, image descriptions
   ↓
6. API returns extracted data + metadata
   - fullText: Complete extracted text
   - chunks: Content divided for referencing
   - metadata: Including Cloud Storage details
   ↓
7. Frontend stores in Firestore (context_sources)
   - extractedData: Processed text
   - metadata.storagePath: Reference to original file
   - metadata.chunksCount: Number of content chunks
```

---

## 📊 Where Context Is Stored After Processing

### 1. **Original PDF File** - Cloud Storage

**Location**: `gs://gen-lang-client-0986191192-uploads/documents/`

**Purpose**: 
- Source of truth for original file
- Re-processing capability
- Audit trail

**Access**:
- Console: https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads/documents
- CLI: `gsutil ls gs://gen-lang-client-0986191192-uploads/documents/`

### 2. **Extracted Text & Metadata** - Firestore

**Collection**: `context_sources`

**Document Structure**:
```typescript
{
  id: "abc123",
  userId: "user_xyz",
  name: "CV Tomás Alarcón - ESP.pdf",
  type: "pdf",
  enabled: true,
  status: "active",
  addedAt: Timestamp,
  
  // Extracted content
  extractedData: "Complete extracted text...",
  fullText: "Same as extractedData (plain text)",
  
  // Content chunks for referencing
  chunks: [
    {
      id: "chunk_1",
      content: "First section of the document...",
      startLine: 0,
      endLine: 50,
      tokenEstimate: 123,
      relevanceScore: undefined  // Set when used in queries
    },
    // ... more chunks
  ],
  
  // Metadata
  metadata: {
    originalFileName: "CV Tomás Alarcón - ESP.pdf",
    originalFileSize: 245678,
    extractionDate: Timestamp,
    extractionTime: 3456,  // milliseconds
    model: "gemini-2.5-flash",
    charactersExtracted: 12345,
    tokensEstimate: 3456,
    pageCount: 3,
    chunksCount: 8,
    
    // Cloud Storage references
    storagePath: "documents/1728778912345-CV_Tomas_Alarcon___ESP.pdf",
    storageUrl: "https://storage.googleapis.com/...",  // Signed URL (expires)
    bucketName: "gen-lang-client-0986191192-uploads",
    
    // Validation (optional)
    validated: false,
    validatedBy: undefined,
    validatedAt: undefined
  }
}
```

**Access**:
- Console: https://console.cloud.google.com/firestore/data/context_sources?project=gen-lang-client-0986191192
- Query in code: `firestore.collection('context_sources').where('userId', '==', userId).get()`

### 3. **Context Usage Logs** - Firestore (messages collection)

**Collection**: `messages`

**When context is used**:
```typescript
{
  id: "msg_xyz",
  conversationId: "conv_abc",
  role: "assistant",
  content: "AI response using context...",
  timestamp: Timestamp,
  
  // Context sections used in this response
  contextSections: [
    {
      name: "CV Tomás Alarcón - ESP.pdf",
      tokenCount: 234,
      content: "Preview of used content...",
      collapsed: false
    }
  ]
}
```

---

## 🔍 How to View Context in GCP

### Method 1: Cloud Storage (Original Files)

1. **Open Console**: https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads?project=gen-lang-client-0986191192

2. **Navigate**: Click on `documents/` folder

3. **View Files**: You'll see all uploaded PDF files with format `{timestamp}-{filename}`

4. **Download/Preview**: Click on any file to download or preview

### Method 2: Firestore (Extracted Context)

1. **Open Console**: https://console.cloud.google.com/firestore/data?project=gen-lang-client-0986191192

2. **Select Collection**: Click on `context_sources`

3. **Filter**: Optionally filter by `userId` to see specific user's context

4. **View Document**: Click on any document to see:
   - `extractedData`: Full extracted text
   - `chunks`: Content divided for referencing
   - `metadata`: All processing details

### Method 3: BigQuery (Analytics - Future)

When BigQuery sync is enabled:

```sql
SELECT 
  source_id,
  source_name,
  COUNT(*) as usage_count,
  SUM(tokens_used) as total_tokens
FROM `gen-lang-client-0986191192.flow_analytics.context_usage`
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY source_id, source_name
ORDER BY usage_count DESC
```

---

## 🛠️ Troubleshooting

### Issue: Files not appearing in Cloud Storage

**Symptoms**:
- Upload succeeds in UI
- But bucket is empty in Console

**Causes**:
1. **Permissions Issue** (most common)
   - Service Account lacks `storage.objectAdmin` role
   - Fix: Grant permissions (see above)

2. **Bucket Name Mismatch**
   - Code uses different bucket name
   - Verify: Check `BUCKET_NAME` in `extract-document.ts`

3. **Silent Failure**
   - No error logs
   - Check Cloud Run logs: `gcloud logging read ...`

**Verification**:
```bash
# List recent uploads
gsutil ls -l gs://gen-lang-client-0986191192-uploads/documents/ | tail -10

# Check bucket permissions
gcloud storage buckets get-iam-policy \
  gs://gen-lang-client-0986191192-uploads
```

---

### Issue: Context not being used by AI

**Symptoms**:
- Files uploaded successfully
- Context shows as "active"
- But AI responses don't reference uploaded content

**Causes**:
1. **Context not enabled** for the conversation
   - Check: Active context sources in sidebar
   - Fix: Toggle context source to "enabled"

2. **Firestore indexes missing**
   - Error: "The query requires an index"
   - Fix: Deploy indexes with `firebase deploy --only firestore:indexes`

3. **`contextSections` undefined error**
   - Error: "Cannot use 'undefined' as a Firestore value"
   - Fix: Ensure `addMessage()` conditionally includes `contextSections`

**Verification**:
```bash
# Check if context is loaded in conversation
gcloud firestore data query \
  --collection=conversations \
  --filter="activeContextSourceIds:*" \
  --project gen-lang-client-0986191192
```

---

## 📈 Storage Monitoring

### Current Usage
```bash
# Get bucket size
gsutil du -sh gs://gen-lang-client-0986191192-uploads/
```

### Cost Estimation

**Storage Class**: Standard  
**Region**: us-central1  
**Pricing**: $0.020 per GB/month

**Example**:
- 100 PDFs @ 5 MB each = 500 MB
- Monthly cost: 0.5 GB × $0.020 = **$0.01/month**

**Bandwidth** (Egress):
- Signed URLs to Cloud Run (same region): Free
- Signed URLs to users (download): $0.12 per GB

---

## 🔄 Backup & Retention

### Current Policy

**Retention**: Indefinite (no automatic deletion)

**Backup**: Google Cloud Storage provides:
- 11 9's durability (99.999999999%)
- Automatic replication within region
- Versioning (if enabled)

### Enable Versioning (Optional)

```bash
# Enable object versioning
gsutil versioning set on gs://gen-lang-client-0986191192-uploads/

# View versions of a file
gsutil ls -a gs://gen-lang-client-0986191192-uploads/documents/filename.pdf
```

### Set Lifecycle Policy (Optional)

**Example**: Delete files older than 90 days

```json
// lifecycle.json
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 90}
    }]
  }
}
```

```bash
gsutil lifecycle set lifecycle.json gs://gen-lang-client-0986191192-uploads/
```

---

## 📚 Related Documentation

- `PRODUCTION_DEPLOYMENT_2025-10-12.md` - Deployment history and fixes
- `FIX_SUMMARY_2025-10-12.md` - Recent bug fixes
- `.cursor/rules/firestore.mdc` - Firestore schema and rules
- `src/pages/api/extract-document.ts` - Upload & extraction code

---

**Last Updated**: October 12, 2025  
**Status**: ✅ Working - Files saved, permissions configured  
**Bucket**: gen-lang-client-0986191192-uploads  
**Console**: https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads
