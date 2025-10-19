# 📦 Cloud Storage Implementation Plan

**Date:** October 18, 2025  
**Status:** 🚧 NOT IMPLEMENTED YET

---

## 🔍 Current Situation

### What We Have

**Documentation says:**
- ✅ Files should be saved to Cloud Storage
- ✅ Bucket exists: `gen-lang-client-0986191192-uploads`
- ✅ Permissions configured

**Reality:**
- ❌ `extract-document.ts` does NOT save to Cloud Storage
- ❌ Files only processed in memory
- ❌ No `originalFileUrl` saved to Firestore
- ❌ **Cannot re-index without re-uploading**

### Impact

**Problem for RAG re-indexing:**
```
User wants to re-index document
  ↓
Need original file
  ↓
❌ File not in Cloud Storage
  ↓
❌ Cannot re-index
  ↓
User must re-upload file
```

---

## 🎯 Solution: Implement Cloud Storage

### Option 1: Full Implementation (Recommended)

**What to do:**

1. **Install package:**
   ```bash
   npm install @google-cloud/storage
   ```

2. **Create storage utility:**
   ```typescript
   // src/lib/storage.ts
   import { Storage } from '@google-cloud/storage';
   
   const storage = new Storage({
     projectId: process.env.GOOGLE_CLOUD_PROJECT
   });
   
   const BUCKET_NAME = 'gen-lang-client-0986191192-uploads';
   
   export async function uploadFile(
     buffer: Buffer,
     filename: string,
     contentType: string,
     metadata?: Record<string, any>
   ): Promise<{ storagePath: string; publicUrl: string }> {
     const timestamp = Date.now();
     const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
     const storagePath = `documents/${timestamp}-${sanitized}`;
     
     const file = storage.bucket(BUCKET_NAME).file(storagePath);
     
     await file.save(buffer, {
       contentType,
       metadata: {
         originalName: filename,
         uploadedAt: new Date().toISOString(),
         ...metadata
       }
     });
     
     const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storagePath}`;
     
     return { storagePath, publicUrl };
   }
   
   export async function getFile(storagePath: string): Promise<Buffer> {
     const file = storage.bucket(BUCKET_NAME).file(storagePath);
     const [buffer] = await file.download();
     return buffer;
   }
   
   export async function deleteFile(storagePath: string): Promise<void> {
     const file = storage.bucket(BUCKET_NAME).file(storagePath);
     await file.delete();
   }
   ```

3. **Update extract-document.ts:**
   ```typescript
   import { uploadFile } from '../../lib/storage';
   
   export const POST: APIRoute = async ({ request }) => {
     const formData = await request.formData();
     const file = formData.get('file') as File;
     
     // Convert to buffer
     const arrayBuffer = await file.arrayBuffer();
     const buffer = Buffer.from(arrayBuffer);
     
     // SAVE TO CLOUD STORAGE FIRST
     const { storagePath, publicUrl } = await uploadFile(
       buffer,
       file.name,
       file.type,
       { model, userId }
     );
     
     console.log('✅ File saved to:', storagePath);
     
     // Then process with Gemini...
     const base64Data = buffer.toString('base64');
     // ... extraction logic
     
     // Return with storage info
     return new Response(JSON.stringify({
       success: true,
       extractedText,
       metadata: {
         ...documentMetadata,
         storagePath,      // ✅ Save path to Firestore
         originalFileUrl: publicUrl,
         bucketName: BUCKET_NAME
       }
     }));
   };
   ```

4. **Update context source in Firestore:**
   ```typescript
   // When saving context source
   await createContextSource(userId, {
     name: file.name,
     type: 'pdf',
     extractedData: extractedText,
     metadata: {
       ...extractionMetadata,
       storagePath: storagePath,        // ✅ Path to original
     },
     originalFileUrl: publicUrl,         // ✅ URL to download
   });
   ```

5. **Create re-indexing endpoint:**
   ```typescript
   // src/pages/api/context-sources/[id]/reindex.ts
   import { getFile } from '../../../../lib/storage';
   import { chunkAndIndexDocument } from '../../../../lib/rag-indexing';
   
   export const POST: APIRoute = async ({ params, request }) => {
     const sourceId = params.id;
     
     // Get source from Firestore
     const source = await getContextSource(sourceId);
     
     if (!source.metadata?.storagePath) {
       return new Response(JSON.stringify({
         error: 'Original file not found in storage. Please re-upload.'
       }), { status: 404 });
     }
     
     // Download original file from Cloud Storage
     const fileBuffer = await getFile(source.metadata.storagePath);
     
     // Re-process with Gemini for fresh extraction
     // ... extraction logic
     
     // Index with RAG
     await chunkAndIndexDocument({
       sourceId,
       userId: source.userId,
       sourceName: source.name,
       text: extractedText,
     });
     
     return new Response(JSON.stringify({ success: true }));
   };
   ```

---

### Option 2: Quick Workaround (Temporary)

**If you can't implement full Cloud Storage now:**

**Store base64 in Firestore** (not recommended for large files):

```typescript
// In extract-document.ts
const base64Data = buffer.toString('base64');

// Save to Firestore
await createContextSource(userId, {
  name: file.name,
  extractedData: extractedText,
  metadata: {
    originalFileBase64: base64Data,  // ⚠️ Only for small files (<1MB)
    originalFileName: file.name,
    originalFileSize: file.size,
  }
});
```

**Limitations:**
- ⚠️ Firestore document limit: 1MB
- ⚠️ Large PDFs will fail
- ⚠️ Expensive on storage
- ⚠️ Slow reads

---

### Option 3: Hybrid Approach (Balanced)

**Store small files in Firestore, large files in Cloud Storage:**

```typescript
const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB

if (file.size < SIZE_THRESHOLD) {
  // Small file - save base64 in Firestore
  metadata.originalFileBase64 = base64Data;
} else {
  // Large file - save to Cloud Storage
  const { storagePath, publicUrl } = await uploadFile(...);
  metadata.storagePath = storagePath;
  metadata.originalFileUrl = publicUrl;
}
```

---

## 🚀 Recommended Solution

**Go with Option 1 (Full Cloud Storage)**

### Why:

1. ✅ **Scalable** - Works for any file size
2. ✅ **Fast** - Cloud Storage is optimized
3. ✅ **Cheap** - $0.02/GB/month
4. ✅ **Proper** - Industry standard
5. ✅ **Future-proof** - Supports versioning, lifecycle policies

### Estimated Implementation Time:

- Install package: 1 min
- Create `storage.ts`: 15 min
- Update `extract-document.ts`: 10 min
- Create reindex endpoint: 15 min
- Testing: 10 min

**Total: ~50 minutes**

---

## 📋 Implementation Checklist

### Phase 1: Storage Setup

- [ ] Install `@google-cloud/storage`
- [ ] Create `src/lib/storage.ts` with upload/download/delete functions
- [ ] Test upload to bucket
- [ ] Verify permissions work

### Phase 2: Integration

- [ ] Update `extract-document.ts` to save files
- [ ] Update Firestore schema to include `storagePath`
- [ ] Test file upload + extraction flow
- [ ] Verify `originalFileUrl` saved

### Phase 3: Re-indexing

- [ ] Create `/api/context-sources/[id]/reindex` endpoint
- [ ] Download file from storage
- [ ] Re-extract text
- [ ] Index with RAG
- [ ] Update metadata

### Phase 4: UI

- [ ] "Re-index" button calls new endpoint
- [ ] Progress indicator during re-indexing
- [ ] Success/error messages
- [ ] Verify RAG chunks created

---

## 💰 Cost Estimate

**Cloud Storage pricing:**
- Storage: $0.02/GB/month
- Downloads: $0.12/GB (for re-indexing)

**Example:**
- 100 PDFs × 5MB each = 500MB = $0.01/month
- Re-index 10 docs/month = 50MB downloads = $0.006/month

**Total: ~$0.02/month** (negligible)

---

## 🎯 Benefits After Implementation

**Current (Without Storage):**
```
User uploads PDF
  ↓
Extract text ✅
  ↓
Save to Firestore ✅
  ↓
Original file LOST ❌
  ↓
Re-index? Must re-upload ❌
```

**After (With Storage):**
```
User uploads PDF
  ↓
Save to Cloud Storage ✅
  ↓
Extract text ✅
  ↓
Save to Firestore with storagePath ✅
  ↓
Original file PRESERVED ✅
  ↓
Re-index? Just download from storage ✅
```

---

## 🔄 Re-indexing Flow (After Implementation)

```
User clicks "Habilitar RAG" or "Re-extraer"
  ↓
Frontend calls /api/context-sources/{id}/reindex
  ↓
Backend:
  1. Get source from Firestore
  2. Check source.metadata.storagePath exists
  3. Download original file from Cloud Storage
  4. Re-extract with Gemini (fresh)
  5. Chunk text into pieces
  6. Generate embeddings
  7. Save chunks to Firestore
  8. Update source.ragEnabled = true
  ↓
Frontend:
  ✅ Document now shows "🔍 46 chunks"
  ✅ RAG toggle works
  ✅ Next query uses RAG
```

---

## 🚨 Decision Needed

**Question for you:**

Do you want me to implement Cloud Storage now (Option 1)?

**If YES:**
- I'll implement full Cloud Storage integration
- ~50 minutes of work
- Proper, scalable solution

**If NOT NOW:**
- I can document it for later
- Use Option 2 (base64) for small files temporarily
- Or skip re-indexing feature until storage is ready

---

**What would you prefer?**

1. ✅ Implement Cloud Storage now (recommended)
2. ⏸️ Document for later, skip re-indexing for now
3. 🔧 Temporary workaround with base64 (small files only)

Let me know and I'll proceed!





