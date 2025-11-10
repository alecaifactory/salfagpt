# 🔍 Debug: Agente No Aparece Después de Compartir

**Issue:** GESTION BODEGAS GPT (S001) no aparece para alecdickinson@gmail.com después de compartirlo

---

## 📊 Lo Que Veo en Logs

### alecdickinson@gmail.com Tiene:
```
✅ MAQSA Mantenimiento S2 (KfoKcDrb6pMnduAiLlrD)
✅ GOP GPT M3 (5aNwSMgff2BRKrrVRypF)
❌ GESTION BODEGAS GPT (S001) - NO APARECE
```

### Shares en Sistema (Total: 9):
```
1. 6D1CDmBSMVtSlpOH5m5a → KfoKcDrb6pMnduAiLlrD (MAQSA) → alecdickinson ✅
2. fLiaLFOBkJfi4xh7awtQ → 5aNwSMgff2BRKrrVRypF (GOP) → alecdickinson ✅
3-9. Otros shares (otros usuarios)

❌ NO HAY share con agentId = GESTION BODEGAS GPT
```

---

## 🔍 Posibles Causas

### 1. Sharing No Se Guardó en Firestore
**Más probable** - El API respondió 200 pero no guardó

**Check:**
```javascript
// En Firestore console buscar:
// Collection: agent_sharing
// Filter: agentId == {ID de GESTION BODEGAS}

// Should exist pero parece que NO
```

### 2. AgentId Incorrecto
**Posible** - Modal usó ID incorrecto

**Check:**
```javascript
// El agente "GESTION BODEGAS GPT (S001)"
// tiene agentId = AjtQZEIMQvFnPRJRjl4y (veo en logs)
// Pero en agent_sharing quizás se guardó con otro ID
```

### 3. Error Silencioso en API
**Menos probable** - API devolvió 200 pero falló

**Check:**
```
13:40:58 [200] /api/agents/AjtQZEIMQvFnPRJRjl4y/share 233ms
// Status 200 = success
// Pero quizás Firestore write failed después
```

---

## ✅ Solución Rápida

### Manual: Verificar en Firestore

```
1. Abrir: https://console.firebase.google.com/project/salfagpt/firestore

2. Collection: agent_sharing

3. Buscar documento con:
   agentId: AjtQZEIMQvFnPRJRjl4y
   
4. Si EXISTE:
   - Ver sharedWith array
   - Debería incluir: usr_l1fiahiqkuj9i39miwib
   - Si está: Problema de query/cache
   - Si NO está: No se guardó

5. Si NO EXISTE el documento:
   - Crear manualmente
   - O re-compartir usando el modal
```

---

## 🔧 Solución Automática

### Re-Compartir el Agente:

```
Como alec@getaifactory.com:

1. Abrir: GESTION BODEGAS GPT (S001)
2. Click 🔗 Compartir
3. Buscar: alecdickinson@gmail.com
4. Ver si ya está en "Accesos Compartidos (1)"
5. Si está: Eliminar (X) y volver a compartir
6. Si no está: Compartir nuevamente
7. Click "3️⃣ Forzar Compartir (SuperAdmin)"
8. Esperar mensaje success
9. Verificar en Firestore que se guardó
10. alecdickinson refresh (Cmd+R)
```

---

## 🐛 Debug Step-by-Step

### Check 1: Verify Share Exists in Firestore

```bash
# Run this in Firestore console query:
agent_sharing
  .where('agentId', '==', 'AjtQZEIMQvFnPRJRjl4y')
  .get()
  
# Expected: 1 document
# Actual: ? (need to check)
```

### Check 2: Verify Share Contains Correct User

```javascript
// In the document, check sharedWith array:
sharedWith: [
  {
    type: 'user',
    id: 'usr_l1fiahiqkuj9i39miwib', // ← Must be this
    email: 'alecdickinson@gmail.com',
    domain: 'gmail.com'
  }
]
```

### Check 3: Verify API Query Finds It

```bash
# Check server logs when alecdickinson loads:
🔍 getSharedAgents called for userId: usr_l1fiahiqkuj9i39miwib
   Total shares in system: 9 (should be 10 if saved)
   Examining share: {...}
   
# Should see share with agentId: AjtQZEIMQvFnPRJRjl4y
# But currently doesn't appear in logs
```

---

## ✅ Quick Fix

### Option A: Re-Share (2 min)

```
1. Como alec@getaifactory.com
2. Abrir GESTION BODEGAS GPT (S001)
3. Compartir → alecdickinson@gmail.com
4. Usar → Admin
5. Force share (opción 3)
6. Verificar success message más largo
7. Check Firestore que documento existe
8. alecdickinson refresh
9. Should appear now
```

### Option B: Manual Firestore (1 min)

```
1. Firestore console
2. agent_sharing collection
3. Add document:
   
   Document ID: (auto)
   agentId: "AjtQZEIMQvFnPRJRjl4y"
   ownerId: "usr_uhwqffaqag1wrryd82tw"
   sharedWith: [
     {
       type: "user",
       id: "usr_l1fiahiqkuj9i39miwib",
       email: "alecdickinson@gmail.com",
       domain: "gmail.com"
     }
   ]
   accessLevel: "use"
   createdAt: (timestamp now)
   
4. Save
5. alecdickinson refresh
6. Should see agent
```

---

## 🎯 Root Cause Investigation

Necesito ver el código del API de sharing para entender por qué devolvió 200 pero no guardó:

```typescript
// src/pages/api/agents/[id]/share.ts
// Check:
// 1. ¿Se hace el write a Firestore?
// 2. ¿Se verifica que se guardó?
// 3. ¿Error silencioso?
```

---

**Next Step:** 
1. Verificar en Firestore si el share existe
2. Si NO: Re-compartir
3. Si SÍ: Debug query de getSharedAgents

