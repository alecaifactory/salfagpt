# PDF Splitter Tool - Quick Start ⚡

**Get large PDF splitting working in 5 minutes!**

---

## 🚀 Deploy (One Command)

```bash
./scripts/setup-tool-infrastructure.sh
```

**What this does:**
1. Creates GCS bucket for tool outputs
2. Configures permissions
3. Deploys Cloud Function
4. Returns function URL

---

## ⚙️ Configure

### Add to `.env`:
```bash
# Copy the URL from script output
PDF_SPLITTER_FUNCTION_URL=https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool
```

### Restart server:
```bash
npm run dev
```

---

## ✅ Test

1. **Open chat:** http://localhost:3000/chat
2. **Add context:** Click "+ Agregar" button
3. **Upload large PDF:** Select file >50MB
4. **Split PDF:** Click blue "Dividir PDF Automáticamente" button
5. **Wait:** ~0.5 seconds per MB (300MB = ~2.5 min)
6. **Success:** Alert shows chunk count

---

## 📦 What You Get

**Input:** 300MB PDF (450 pages)

**Output:**
- ✅ 15 chunks × 20MB each
- ✅ Signed download URLs (expire in 7 days)
- ✅ Page range metadata (chunk-001: pages 1-30)
- ✅ Preserved quality (no compression)

**Firestore Record:**
```typescript
tool_executions/{executionId}:
  - status: 'completed'
  - chunks: 15
  - totalPages: 450
  - processingTime: 150000ms
  - outputFiles: [
      { url: '...', fileName: 'chunk-001.pdf', pageRange: '1-30' }
    ]
```

---

## 💰 Cost

**Per 300MB PDF:**
- Cloud Function compute: $0.024
- GCS storage (30 days): $0.012
- Network transfer: $0.036
- **Total: ~$0.07** (7 cents)

---

## 🐛 Common Issues

### "Function not found"
```bash
# Check deployment
gcloud functions list --project=gen-lang-client-0986191192 --region=us-central1

# Redeploy
cd functions/pdf-splitter
npm run deploy
```

### "Permission denied"
```bash
# Grant service account access
gsutil iam ch serviceAccount:gen-lang-client-0986191192@appspot.gserviceaccount.com:objectAdmin gs://salfagpt-uploads
```

### "Timeout"
Files >200MB may exceed 9min limit. Increase timeout:
```bash
gcloud functions deploy pdf-splitter-tool --timeout=900s
```

---

## 📊 Next Steps

Once working, you can add:
1. **Document Embedder** - Generate embeddings for chunks
2. **Admin UI** - Manage tools, view executions, set quotas
3. **Progress UI** - Real-time progress bars
4. **Cost Analytics** - Track spending per user

---

## 🔗 Full Documentation

- **Architecture:** `docs/architecture/TOOL_MANAGER_ARCHITECTURE.md`
- **Setup Guide:** `docs/tools/PDF_SPLITTER_SETUP.md`
- **Cloud Function Code:** `functions/pdf-splitter/src/index.ts`
- **API Endpoints:** `src/pages/api/tools/`

---

**Version:** 1.0.0 (Simplest Form)  
**Status:** ✅ Ready to Deploy  
**Estimated Setup Time:** 5 minutes







