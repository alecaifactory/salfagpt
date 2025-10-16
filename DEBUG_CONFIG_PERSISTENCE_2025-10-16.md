# 🔍 Debug Guide - Configuration Persistence

**Purpose:** Diagnose why configuration might not be persisting or loading  
**Date:** 2025-10-16

---

## 🧪 Debug Process

### Step 1: Upload Configuration

**Actions:**
1. Open agent configuration modal
2. Upload PDF
3. Wait for processing

**Console Logs to Watch:**
```
📥 Received agent config extraction request
📄 Processing file: nombre-archivo.pdf
🔄 File converted to base64, calling Gemini...
✅ Configuration extracted successfully
Agent name: Nombre del Agente

💾 [SAVE] Starting Firestore save for agent: {agentId}
💾 [SAVE] Data prepared, counts: {inputExamples: 10, ...}
💾 [SAVE] Calling Firestore set() for collection agent_setup_docs, doc: {agentId}
✅ [SAVE] Firestore set() completed successfully
✅ [SAVE] Setup document saved for agent: {agentId}
✅ [SAVE] Document path: agent_setup_docs/{agentId}
```

**✅ If you see all these logs:** Configuration WAS saved  
**❌ If you DON'T see "✅ [SAVE] Firestore set() completed":** Save failed

---

### Step 2: Close and Re-Open Modal

**Actions:**
1. Close configuration modal
2. Re-open configuration modal for SAME agent

**Console Logs to Watch:**
```
📥 [CONFIG LOAD] Starting load for agent: {agentId}
📥 [CONFIG LOAD] Calling: /api/agent-setup/get?agentId={agentId}
📥 [CONFIG LOAD] Response status: 200
📥 [CONFIG LOAD] Response OK: true
📥 [CONFIG LOAD] Data received: {...}
📥 [CONFIG LOAD] data.exists: true
📥 [CONFIG LOAD] data.inputExamples: [Array(10)]
📥 [CONFIG LOAD] data.inputExamples?.length: 10
✅ [CONFIG LOAD] FOUND EXISTING CONFIG!
✅ [CONFIG LOAD] Examples count: 10
✅ [CONFIG LOAD] File name: nombre-archivo.pdf
✅ [CONFIG LOAD] Purpose: Descripción del propósito...
✅ [CONFIG LOAD] setExtractedConfig() called with existing data
✅ [CONFIG LOAD] Modal should now show configuration
```

**✅ If you see all these logs:** Configuration IS loading  
**❌ If you see "ℹ️ No existing configuration found":** Not found in Firestore

---

## 🔍 Diagnostic Checks

### Check 1: Verify AgentId is Passed

**In Console after opening modal:**
```javascript
// The agentId prop should be the conversationId
console.log('Modal agentId:', document.querySelector('[data-agent-id]')?.getAttribute('data-agent-id'));
```

Or check the Network tab:
- Look for request to `/api/agents/extract-config`
- Check FormData: should have `agentId` field

---

### Check 2: Verify Firestore Write

**After upload, run in Console:**
```javascript
fetch('/api/agent-setup/get?agentId=YOUR_AGENT_ID')
  .then(r => r.json())
  .then(data => {
    console.log('🔍 Verification:');
    console.log('  exists:', data.exists);
    console.log('  fileName:', data.fileName);
    console.log('  inputExamples:', data.inputExamples?.length || 0);
    console.log('  agentPurpose:', data.agentPurpose?.substring(0, 100));
  });
```

**Expected Output:**
```
🔍 Verification:
  exists: true
  fileName: "nombre-archivo.pdf"
  inputExamples: 10
  agentPurpose: "Este agente está diseñado para..."
```

**If `exists: false`:**
- Configuration was NOT saved to Firestore
- Check server logs for errors

---

### Check 3: Verify in Firebase Console

**Manual check:**
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
2. Navigate to: `agent_setup_docs` collection
3. Look for document with ID = your agentId
4. Check fields:
   - `inputExamples`: Should be an array
   - `fileName`: Should be your PDF name
   - `uploadedAt`: Should be recent timestamp

**If document doesn't exist:**
- Save operation failed
- Check server logs for Firestore errors

---

## 🚨 Common Issues

### Issue 1: No agentId in FormData

**Symptom:**
```
⚠️ [SAVE] No agentId provided, skipping Firestore save
```

**Cause:** Modal not passing agentId to API

**Check:**
```javascript
// In AgentConfigurationModal.tsx, handleUpload function
formData.append('agentId', agentId);  // Must be present
```

---

### Issue 2: Firestore Permission Denied

**Symptom:**
```
❌ [SAVE] Failed to save setup doc: Error: 7 PERMISSION_DENIED
```

**Cause:** Service account doesn't have Firestore write permission

**Fix:**
```bash
# Grant Firestore permissions
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/datastore.user"
```

---

### Issue 3: Data Not Found on Load

**Symptom:**
```
ℹ️ [CONFIG LOAD] No existing configuration found
```

**Possible Causes:**
1. Document wasn't saved (check Issue 1 & 2)
2. Wrong agentId being queried
3. Firestore read permission denied

**Debug:**
```javascript
// Check what agentId is being used
console.log('Loading config for agentId:', agentId);

// Check Firestore directly
fetch('/api/agent-setup/get?agentId=' + agentId)
  .then(r => r.json())
  .then(console.log);
```

---

### Issue 4: extractedConfig Not Displaying

**Symptom:**
- Logs show "✅ Configuration exists"
- Modal still shows upload interface

**Cause:** UI not checking `extractedConfig` state

**Check:** Look for conditional rendering in modal:
```typescript
{extractedConfig ? (
  <div>Show existing config</div>
) : (
  <div>Show upload interface</div>
)}
```

---

## 📊 Expected Log Sequence

### Complete Happy Path:

```
=== UPLOAD ===
📥 Received agent config extraction request
📄 Processing file: test.pdf application/pdf 54321
🔄 File converted to base64, calling Gemini...
✅ Configuration extracted successfully
Agent name: Test Agent

💾 [SAVE] Starting Firestore save for agent: abc123
💾 [SAVE] Data prepared, counts: {inputExamples: 10, correctOutputs: 10, ...}
💾 [SAVE] Calling Firestore set() for collection agent_setup_docs, doc: abc123
✅ [SAVE] Firestore set() completed successfully
✅ [SAVE] Setup document saved for agent: abc123
✅ [SAVE] Document path: agent_setup_docs/abc123

=== RE-OPEN ===
📥 [CONFIG LOAD] Starting load for agent: abc123
📥 [CONFIG LOAD] Calling: /api/agent-setup/get?agentId=abc123
📥 [CONFIG LOAD] Response status: 200
📥 [CONFIG LOAD] Response OK: true
📥 [CONFIG LOAD] Data received: {"exists":true,"agentId":"abc123",...}
📥 [CONFIG LOAD] data.exists: true
📥 [CONFIG LOAD] data.inputExamples: [Array(10)]
📥 [CONFIG LOAD] data.inputExamples?.length: 10
✅ [CONFIG LOAD] FOUND EXISTING CONFIG!
✅ [CONFIG LOAD] Examples count: 10
✅ [CONFIG LOAD] File name: test.pdf
✅ [CONFIG LOAD] Purpose: Este agente...
✅ [CONFIG LOAD] setExtractedConfig() called with existing data
✅ [CONFIG LOAD] Modal should now show configuration
```

---

## 🎯 What to Do Now

### 1. Try Uploading Again

**With Console open:**
1. Clear Console (Ctrl+L or Cmd+K)
2. Open configuration modal
3. Upload PDF
4. Watch logs carefully
5. Copy ALL logs that appear
6. Share if there are errors

---

### 2. Verify Save Happened

**After upload completes:**
```javascript
// Run this in Console
const agentId = 'PASTE_YOUR_AGENT_ID_HERE';

fetch(`/api/agent-setup/get?agentId=${agentId}`)
  .then(r => r.json())
  .then(data => {
    console.log('=== FIRESTORE VERIFICATION ===');
    console.log('Document exists:', data.exists);
    console.log('File name:', data.fileName);
    console.log('Input examples:', data.inputExamples?.length || 0);
    
    if (data.exists && data.inputExamples?.length > 0) {
      console.log('✅ CONFIGURATION IS IN FIRESTORE!');
      console.log('First example:', data.inputExamples[0]);
    } else {
      console.log('❌ CONFIGURATION NOT FOUND IN FIRESTORE');
    }
  });
```

---

### 3. Check Network Tab

**Steps:**
1. Open DevTools → Network tab
2. Filter: `extract-config`
3. Upload PDF
4. Click on the request
5. Check:
   - **Request Payload:** Should have `agentId` field
   - **Response:** Should have `success: true`
6. Filter: `agent-setup/get`
7. Re-open modal
8. Check:
   - **Response:** Should have `exists: true` and `inputExamples`

---

## 🔧 Manual Firestore Check

### Direct Firestore Query:

**In Firebase Console:**
```
Project: gen-lang-client-0986191192
Database: Firestore
Collection: agent_setup_docs
Document ID: {your agentId}

Should see:
- agentId: "abc123..."
- fileName: "your-file.pdf"
- inputExamples: [...]
- uploadedAt: Timestamp
```

**If document doesn't exist:**
- Save failed silently
- Check server terminal logs
- Check Firestore permissions

---

## 📝 What to Report

**Please share:**

1. **Upload Logs:**
   - All logs starting with "📥 Received agent config..."
   - All logs with "[SAVE]"
   - Any errors in red

2. **Re-Open Logs:**
   - All logs with "[CONFIG LOAD]"
   - Any errors in red

3. **Verification Result:**
   - Result of `fetch('/api/agent-setup/get?agentId=xxx')`

4. **Network Tab:**
   - Screenshot or copy of `/api/agents/extract-config` response
   - Screenshot or copy of `/api/agent-setup/get` response

---

**With these logs, we can pinpoint exactly where the persistence is breaking!** 🔍

Try uploading again with Console open and share what you see! 🎯

