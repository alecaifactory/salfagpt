# ⚡ RAG Setup - Quick Commands

**Run these commands in order:**

---

## 1️⃣ Setup Infrastructure (5 minutes)

```bash
# Run automated setup script
./scripts/setup-rag.sh
```

**Expected output:**
```
🔍 Setting up RAG for Flow Platform
====================================

1️⃣  Enabling Vertex AI API...
   ✅ Vertex AI API enabled

2️⃣  Granting IAM permissions to service account...
   ✅ Service account has aiplatform.user role

3️⃣  Deploying Firestore indexes...
   ✅ Firestore indexes deployed

4️⃣  Verifying setup...
   ✅ Vertex AI API is enabled
   ✅ Service account has correct permissions
   ✅ Firestore indexes include document_chunks

✅ RAG Setup Complete!
```

---

## 2️⃣ Start Development Server

```bash
npm run dev
```

**Wait for:**
```
  ╭─────────────────────────╮
  │                         │
  │   ●  Astro  v5.14.1     │
  │   ready in XXX ms       │
  │                         │
  ╰─────────────────────────╯

  ➜  Local:   http://localhost:3000/
```

---

## 3️⃣ Test RAG (Browser)

1. Open: http://localhost:3000/chat
2. Login as admin: alec@getaifactory.com
3. Upload a test PDF (>10 pages recommended)
4. Watch console for:
   ```
   🔍 Starting RAG indexing...
   ✅ RAG indexing complete
   ```

5. Ask a question about the document
6. Watch console for:
   ```
   🔍 Attempting RAG search...
   ✅ RAG: Using 5 relevant chunks
   ```

7. Verify in Context Panel:
   - Token usage significantly reduced
   - "RAG Active" indicator (future)

---

## 4️⃣ Access Admin Panel

1. Click your name (bottom-left)
2. Click "Configuración RAG"
3. Explore 3 tabs:
   - **Configuración** - System settings
   - **Estadísticas** - Usage stats
   - **Mantenimiento** - Bulk operations

---

## 5️⃣ Verify Firestore Data

```bash
# Check chunks were created
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function check() {
  const count = await firestore.collection('document_chunks').count().get();
  console.log('✅ Total chunks:', count.data().count);
  
  if (count.data().count > 0) {
    const sample = await firestore.collection('document_chunks').limit(1).get();
    const chunk = sample.docs[0].data();
    console.log('Sample chunk:');
    console.log('  - sourceId:', chunk.sourceId);
    console.log('  - embedding length:', chunk.embedding.length);
    console.log('  - text length:', chunk.text.length);
  }
  
  process.exit(0);
}

check();
"
```

**Expected:**
```
✅ Total chunks: 96
Sample chunk:
  - sourceId: abc123xyz
  - embedding length: 768
  - text length: 2041
```

---

## 6️⃣ Deploy to Production (When Ready)

```bash
# Build
npm run build

# Deploy
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --project gen-lang-client-0986191192

# Verify
curl https://your-service-url/api/health/firestore
```

---

## 🐛 If Something Fails

### "Vertex AI API not enabled"

```bash
gcloud services enable aiplatform.googleapis.com \
  --project=gen-lang-client-0986191192
```

### "Permission denied"

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Wait 1-2 minutes for propagation
```

### "Index not found"

```bash
firebase deploy --only firestore:indexes \
  --project gen-lang-client-0986191192

# Wait 1-2 minutes for index to build
```

### "No chunks created"

**Check console logs during upload:**
- Should see: "🔍 Starting RAG indexing..."
- If not, check: ragEnabled is not explicitly false

---

## ✅ Success Indicators

After running all commands:

- ✅ Setup script completes with all checkmarks
- ✅ Dev server starts without errors
- ✅ Document upload shows RAG indexing logs
- ✅ Chunks appear in Firestore
- ✅ Query shows RAG search logs
- ✅ Token usage reduced 90%+
- ✅ Admin panel accessible and functional

**All checks passed?** → Deploy to production! 🚀

---

## 📞 Need Help?

- **Setup issues:** Check `RAG_QUICK_START.md`
- **Testing guide:** Run `./scripts/test-rag.sh`
- **Admin panel help:** Read `RAG_ADMIN_PANEL_VISUAL.md`
- **Technical details:** See `RAG_IMPLEMENTATION_PLAN.md`

---

**Ready? Run the first command now!** ⚡

```bash
./scripts/setup-rag.sh
```

