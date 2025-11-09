# 🔍 Diagnóstico: No Cargan Agentes/Proyectos/Chats

## 🎯 Síntoma

User alec@getaifactory.com no ve sus conversaciones existentes:
- Agentes: 0 (debería tener 65+)
- Proyectos: 0
- Chats: 0

## 🔍 Posibles Causas

### Causa 1: useEffect no se ejecuta
```typescript
// Line 545 en ChatInterfaceWorking.tsx
useEffect(() => {
  loadConversations();
  loadFolders();
}, [userId]);
```

**Check:** ¿userId está definido cuando monta?

### Causa 2: API falla silenciosamente
```typescript
// Line 639
const response = await fetch(`/api/conversations?userId=${userId}`);
```

**Check:** ¿La API responde? ¿Hay errores?

### Causa 3: Firestore query falla
```typescript
// En backend
firestore.collection('conversations')
  .where('userId', '==', userId)
  .orderBy('lastMessageAt', 'desc')
  .get()
```

**Check:** ¿El índice existe? ¿userId correcto?

### Causa 4: userId format cambió
```typescript
// En chat.astro
userId = decoded.id || decoded.sub; // Google OAuth ID
```

**Check:** ¿El formato del userId cambió vs lo que está en Firestore?

## 🧪 Tests de Diagnóstico

### Test 1: Check Browser Console

Look for these logs:
```
✅ User authenticated: { userId: '...', email: '...' }
📥 Cargando conversaciones desde Firestore...
```

If you see "Cargando" but NOT "X conversaciones cargadas":
→ API is failing

If you DON'T see "Cargando":
→ useEffect not running

### Test 2: Check Network Tab

1. Open DevTools → Network
2. Refresh page
3. Filter: "conversations"
4. Check request:
   - URL: /api/conversations?userId=...
   - Status: Should be 200
   - Response: Should have data

If 200 but response empty:
→ Firestore query returning empty

If 4xx/5xx:
→ API error

### Test 3: Check Firestore Direct

```bash
# In terminal
curl "http://localhost:3000/api/conversations?userId=usr_uhwq..."

# Should return JSON with conversations
```

If empty:
→ userId mismatch or query issue

### Test 4: Check userId Format

In browser console, type:
```javascript
// Should show current userId
document.cookie
```

Look for flow_session cookie, decode JWT to see userId format.

## 🔧 Quick Fixes

### Fix 1: Force Reload
```typescript
// Add to ChatInterfaceWorking after loadConversations() call
console.log('🔍 DEBUG: userId =', userId);
console.log('🔍 DEBUG: Calling loadConversations...');
```

### Fix 2: Check API Response
```typescript
// In loadConversations(), add logging:
console.log('📊 API Response:', data);
console.log('📊 Groups:', data.groups?.length);
console.log('📊 First group:', data.groups?.[0]);
```

### Fix 3: Bypass Cache
```typescript
// Change API call to bypass cache
const response = await fetch(
  `/api/conversations?userId=${userId}&t=${Date.now()}`
);
```

## 🚨 Most Likely Cause

Based on symptoms, most likely:

**API is returning empty because userId format doesn't match Firestore data**

Your data was saved with userId: "114671162830729001607" (Google ID)
But now userId might be: "usr_uhwq..." (hashed)

**Solution:** Check what userId is being used and match it to Firestore data.

## 📊 Next Steps

1. Screenshot browser console (Console tab)
2. Screenshot network tab (conversations request)
3. Tell me what userId shows in logs
4. I'll fix the mismatch immediately

---

**Need browser console screenshot to diagnose** 🔍

