# 🔧 Troubleshooting: Project Names Not Appearing

## Issue Fixed

The project creation was improved with:

1. ✅ **Trim whitespace** - Names with spaces are now trimmed
2. ✅ **Better validation** - Alert if empty name entered
3. ✅ **Auto-expand** - Projects section expands automatically when created
4. ✅ **Enhanced logging** - More detailed console logs to debug

---

## 🧪 How to Test

### Step 1: Open Browser Console

1. Open http://localhost:3000/chat
2. Open DevTools (F12 or Cmd+Option+J on Mac)
3. Go to Console tab

### Step 2: Create a New Project

1. In the sidebar, find the **"Proyectos"** section
2. Click the **green "+" button** next to "Proyectos"
3. A browser prompt will appear: "Nombre del nuevo proyecto:"
4. Type a name, for example: **"Mi Proyecto de Prueba"**
5. Click **OK**

### Step 3: Watch Console Logs

You should see this sequence:

```
📝 Creating project with name: Mi Proyecto de Prueba
🚀 Starting createNewFolder with name: Mi Proyecto de Prueba
📋 userId: [YOUR-USER-ID]
📡 API response status: 201
✅ Proyecto creado en Firestore: [FOLDER-ID] Name: Mi Proyecto de Prueba
📦 Folder data: {
  "id": "...",
  "userId": "...",
  "name": "Mi Proyecto de Prueba",
  "createdAt": "...",
  "conversationCount": 0
}
🔄 Recargando proyectos desde Firestore para verificar persistencia...
📥 Cargando proyectos desde Firestore...
✅ 1 proyectos cargados desde Firestore
📁 Proyectos: Mi Proyecto de Prueba
✅ Proyecto creado y lista recargada desde Firestore
```

### Step 4: Verify in UI

After creation, you should see:

- ✅ The Projects section is expanded (if it was collapsed)
- ✅ Your new project appears in the list
- ✅ The project has a folder icon
- ✅ The counter shows "Proyectos 1" (or incremented number)
- ✅ The project name is visible

---

## 🚨 Common Issues & Solutions

### Issue 1: Name Doesn't Appear

**Possible Causes:**

**A. Empty name entered**
- Solution: The app now shows an alert if you click OK with empty name
- Action: Try again with a non-empty name

**B. Projects section is collapsed**
- Solution: The app now auto-expands the section when creating
- Action: Look for the "Proyectos" section - it should be open

**C. Name has only whitespace**
- Solution: The app now trims whitespace
- Action: Try with a proper name like "Test Project"

### Issue 2: Error in Console

**Check console for:**

```
❌ API error: [status] [error details]
```

**Common errors:**

**401 Unauthorized**
- Cause: Not logged in
- Solution: Refresh page and login again

**400 Bad Request**
- Cause: Missing userId or name
- Solution: Check console logs for userId value

**500 Internal Server Error**
- Cause: Firestore connection issue
- Solution: Check if Firestore is running:
  ```bash
  gcloud auth application-default login
  ```

### Issue 3: Project Created but Not Visible

**Check in Firestore directly:**

```bash
# Verify project was created in Firestore
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const snapshot = await firestore.collection('folders')
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get();

console.log('Recent folders:', snapshot.size);
snapshot.docs.forEach(doc => {
  const data = doc.data();
  console.log('  -', data.name, '(userId:', data.userId, ')');
});
process.exit(0);
"
```

If the project appears here but not in UI:
- Cause: Frontend state issue
- Solution: Refresh the page (Cmd+R)

---

## 🔍 Debug Mode

If the issue persists, check these in the console:

### 1. Check Current State
```javascript
// In browser console:
console.log('Current folders state:', window.folders);
```

### 2. Check User ID
```javascript
// In browser console:
console.log('Current userId:', window.userId);
```

### 3. Check API Directly
```bash
# In terminal:
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR-USER-ID","name":"Direct API Test"}'
```

Expected response:
```json
{"folder":{"id":"...","userId":"...","name":"Direct API Test","createdAt":"...","conversationCount":0}}
```

---

## ✅ Expected Behavior (After Fix)

1. **Click "+" button** → Prompt appears
2. **Enter name** → Name is validated and trimmed
3. **Click OK** → Console shows detailed logs
4. **Immediate feedback** → Projects section expands
5. **API call** → Folder created in Firestore
6. **Reload** → Folders reloaded from Firestore
7. **UI update** → Project appears in list with proper name

---

## 📞 Still Not Working?

If you still can't see the project name after following these steps:

1. **Copy all console logs** and share them
2. **Take a screenshot** of the UI
3. **Check Firestore** in Firebase Console to see if the project was saved
4. **Try refreshing** the page (Cmd+R) after creating

The enhanced logging will help us identify exactly where the issue is occurring.

---

## 🔥 Quick Test in Browser Console

Open your browser console and run this to test project creation directly:

```javascript
// Test creating a project
async function testCreateProject() {
  const userId = localStorage.getItem('userId') || 'test-user-123';
  
  console.log('Testing project creation for userId:', userId);
  
  const response = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userId: userId, 
      name: 'Console Test Project ' + Date.now() 
    }),
  });
  
  console.log('Response status:', response.status);
  const data = await response.json();
  console.log('Response data:', data);
  
  // Now load folders
  const loadResponse = await fetch(`/api/folders?userId=${userId}`);
  const loadData = await loadResponse.json();
  console.log('Loaded folders:', loadData.folders);
  
  return data;
}

testCreateProject();
```

This will show you:
- ✅ If the API is working
- ✅ If the folder is being created
- ✅ If the folder appears when you load them

---

## 🔍 Firestore Index Note

**Note**: We added a Firestore composite index for the `folders` collection, but it requires admin permissions to deploy. If you're an admin, you can deploy it with:

```bash
firebase deploy --only firestore:indexes --project gen-lang-client-0986191192
```

However, **the query should still work** without the index for small datasets (< 500 folders per user).

