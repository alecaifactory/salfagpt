# Context Upload Testing Guide
**Date:** 2025-10-15
**Feature:** File Upload with Gemini 2.5 Pro Extraction

---

## ✅ What Was Implemented

### 1. Default Model Changed to Gemini 2.5 Pro
- **Model:** gemini-2.5-pro (best quality for document extraction)
- **Alternative:** gemini-2.5-flash (faster, 94% cheaper)
- **Selection:** User can choose in modal, Pro is recommended default

### 2. Enhanced Error Handling
- **Better error messages** with specific categorization
- **Suggestions** for how to fix each type of error
- **Alert dialogs** to inform user immediately
- **Console logging** for debugging

### 3. Labels & Qualification Fields Added
New fields in ContextSource:
- `labels`: string[] - User-defined labels (e.g., "CV", "Contrato")
- `qualityRating`: number - 1-5 stars
- `qualityNotes`: string - Expert notes on quality

### 4. Expert Certification Fields Added
- `certified`: boolean - Expert has certified this extraction
- `certifiedBy`: string - Email or userId of certifier
- `certifiedAt`: Date - When it was certified
- `certificationNotes`: string - Notes from certifier

### 5. Enhanced UI Display
- **Extracted content preview** in sidebar (120 chars)
- **Character count** in metadata
- **Certified badge** in source cards
- **Quality rating** display with stars
- **Labels** display with tags
- **Certification info** in detail modal

---

## 🧪 How to Test

### Step 1: Start the Dev Server
```bash
npm run dev
# Server starts on http://localhost:3000
```

### Step 2: Login
1. Navigate to http://localhost:3000
2. Click "Continuar con Google"
3. Login with your account

### Step 3: Create or Select an Agent
1. Click "+ Nuevo Agente" if needed
2. Or select an existing conversation from sidebar

### Step 4: Upload a Document
1. In the "Fuentes de Contexto" section (left sidebar)
2. Click "+ Agregar"
3. Select "Archivo"
4. Click "Subir Documento"
5. Choose a PDF file (test with a small PDF first, < 5MB)
6. **Model Selection:**
   - **Pro (Recomendado)** - Selected by default
   - Or choose Flash for testing speed
7. Click "Agregar Fuente"

### Step 5: Monitor the Upload
Watch the progress:
1. **Uploading** (10%) - File being uploaded
2. **Processing** (50%) - Gemini extracting content
3. **Complete** (100%) - Extraction finished

**Console Logs to Watch:**
```
📤 Uploading file: [filename] ([size] MB) with model: gemini-2.5-pro
✅ Extraction successful: [n] characters extracted
✅ Fuente de contexto guardada en Firestore: [sourceId]
✅ Fuente activada automáticamente para agente [agentId]
```

### Step 6: Verify in UI

#### In Sidebar (ContextManager):
- ✅ Source card appears with green toggle ON
- ✅ File name displayed
- ✅ Preview of extracted content (first 120 chars)
- ✅ Metadata: file size, page count, character count
- ✅ Type badge (PDF)

#### Click on Source Card:
- ✅ Detail modal opens
- ✅ Full extracted content visible
- ✅ Metadata section shows:
  - Original filename
  - File size (MB)
  - Extraction date
  - Page count
  - Model used
- ✅ Quality rating (if set)
- ✅ Labels (if set)
- ✅ Certification badge (if certified)

### Step 7: Ask Questions About the Document
1. In the chat input, type a question about the document
2. Example: "¿Qué información contiene este documento?"
3. Click "Enviar" or press Enter
4. **Verify:**
   - ✅ AI response references the document content
   - ✅ Context panel shows the source was used
   - ✅ Token counts update

---

## 🔍 What to Check

### Upload Success Indicators
- [ ] File uploads without error
- [ ] Progress bar shows all stages
- [ ] Source appears in sidebar with toggle ON
- [ ] Extracted content preview visible
- [ ] Source is assigned to current agent only

### Extraction Quality
- [ ] Extracted text is accurate (not empty)
- [ ] Character count makes sense for file size
- [ ] Preview shows actual document content
- [ ] Full content visible in detail modal

### Agent Assignment
- [ ] Source only visible in agent it was uploaded to
- [ ] Switching to different agent: source NOT visible
- [ ] Switching back: source IS visible with toggle state preserved

### AI Integration
- [ ] Can ask questions about document
- [ ] AI responses use document content
- [ ] Context panel shows source was included
- [ ] Token usage is tracked

---

## 🚨 Troubleshooting

### Upload Fails Immediately
**Symptoms:**
- Error alert appears
- Source shows error status

**Check:**
1. Console for error message
2. Verify GOOGLE_AI_API_KEY is set in .env
3. Restart server after adding key: `npm run dev`

**Common Errors:**
```javascript
// API Key not configured
Error: GOOGLE_AI_API_KEY not configured
Fix: Add to .env and restart server

// Network error
Error: Failed to fetch
Fix: Check internet connection

// Quota exceeded
Error: Rate limit exceeded
Fix: Wait a few minutes, or use Flash model
```

### Upload Succeeds but No Content
**Symptoms:**
- Source appears in sidebar
- No preview text
- Detail modal shows "No hay contenido disponible"

**Check:**
1. Console log: `✅ Extraction successful: [n] characters`
2. If 0 characters: extraction failed
3. Try re-extracting with Pro model
4. Check if PDF is image-based (needs OCR)

### Source Not Appearing
**Symptoms:**
- Upload completes
- No source in sidebar

**Check:**
1. Console for "Fuente guardada en Firestore"
2. Verify agent is selected (not empty state)
3. Check Network tab for API errors

### Source Appears in All Agents
**Symptoms:**
- Upload to Agent A
- Also visible in Agent B

**Check:**
1. Console: Should show `assignedToAgents: [agentId]`
2. Verify filter logic in loadContextForConversation
3. This should NOT happen - contact developer

---

## 📋 Future Enhancements (Not Yet Implemented)

### Labeling System
- [ ] Add labels UI in detail modal
- [ ] Edit labels inline
- [ ] Filter sources by label
- [ ] Label suggestions based on content

### Quality Rating
- [ ] Star rating UI in detail modal
- [ ] Save rating to Firestore
- [ ] Display average quality per model
- [ ] Quality-based sorting

### Expert Certification
- [ ] "Certify" button for experts
- [ ] Certification modal with notes
- [ ] Certification history log
- [ ] Filter: show only certified sources

### Advanced Features
- [ ] Chunking for large documents
- [ ] Semantic search within document
- [ ] Compare extractions (Flash vs Pro)
- [ ] Batch upload multiple files
- [ ] Export extracted content

---

## 🎯 Success Criteria

A successful upload should:
1. ✅ File uploads without errors
2. ✅ Gemini 2.5 Pro extracts content
3. ✅ Extracted content is saved to Firestore
4. ✅ Source appears in sidebar with preview
5. ✅ Source is assigned to current agent only
6. ✅ Toggle is ON by default
7. ✅ Can view full content in detail modal
8. ✅ Can ask AI questions about the document

---

## 🔧 Quick Test Command

```bash
# Start server
npm run dev

# In browser:
# 1. http://localhost:3000
# 2. Login
# 3. Create/select agent
# 4. Upload small PDF (<1MB)
# 5. Watch console and UI
# 6. Verify all checkboxes above
```

---

## 📊 Model Comparison

### Gemini 2.5 Pro (Default)
- **Best for:** Complex documents, tables, technical content
- **Speed:** ~5-10 seconds for 1MB PDF
- **Cost:** $0.03125 per 1M tokens
- **Accuracy:** Highest

### Gemini 2.5 Flash
- **Best for:** Simple documents, quick testing
- **Speed:** ~2-5 seconds for 1MB PDF
- **Cost:** $0.001875 per 1M tokens (94% cheaper)
- **Accuracy:** Good for most cases

**Recommendation:** Start with Pro, switch to Flash if quality is sufficient.

---

**Status:** ✅ Ready for Testing  
**Last Updated:** 2025-10-15  
**Next:** Test upload → verify display → ask questions

