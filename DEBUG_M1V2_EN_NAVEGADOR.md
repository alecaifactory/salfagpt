# 🔍 Debug M1-v2 en el Navegador

**Problema:** M1-v2 no muestra usuarios ni siquiera en incógnito  
**Causa:** NO es cache, debe ser problema de API o frontend  
**Siguiente paso:** Debug en el navegador

---

## 🔧 **INSTRUCCIONES DE DEBUG**

### **Paso 1: Abrir DevTools**

1. Abre: https://salfagpt.salfagestion.cl (incógnito)
2. Login como alec@getaifactory.com
3. Presiona: **F12** (o **Cmd+Option+I**)
4. Ve a tab: **Console**

---

### **Paso 2: Ejecutar Test del API**

**Copia y pega esto en Console:**

```javascript
// Test M1-v2 API
fetch('/api/agents/cjn3bC0HrUYtHqu69CKS/share')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('=== M1-v2 API RESPONSE ===');
    console.log('shares array:', data.shares);
    console.log('shares.length:', data.shares?.length || 0);
    
    if (data.shares && data.shares[0]) {
      console.log('First share ID:', data.shares[0].id);
      console.log('sharedWith:', data.shares[0].sharedWith);
      console.log('sharedWith.length:', data.shares[0].sharedWith?.length || 0);
      
      if (data.shares[0].sharedWith && data.shares[0].sharedWith.length > 0) {
        console.log('✅ USERS FOUND:', data.shares[0].sharedWith.length);
        console.log('First 3 users:');
        data.shares[0].sharedWith.slice(0, 3).forEach(u => {
          console.log(`  - ${u.email} (${u.name})`);
        });
      } else {
        console.log('❌ sharedWith array is EMPTY or MISSING');
      }
    } else {
      console.log('❌ shares array is EMPTY');
    }
  })
  .catch(error => console.error('❌ API Error:', error));
```

---

### **Paso 3: Compara con M3-v2 (que funciona)**

```javascript
// Test M3-v2 API para comparar
fetch('/api/agents/vStojK73ZKbjNsEnqANJ/share')
  .then(response => response.json())
  .then(data => {
    console.log('=== M3-v2 API RESPONSE ===');
    console.log('shares.length:', data.shares?.length || 0);
    console.log('sharedWith.length:', data.shares?.[0]?.sharedWith?.length || 0);
  });
```

---

## 📊 **QUÉ BUSCAR EN LOS RESULTADOS**

### **Escenario A: API retorna los datos** ✅

```javascript
// Si ves esto:
M1-v2 API RESPONSE
shares.length: 1
sharedWith.length: 14
✅ USERS FOUND: 14
```

**Significa:** API funciona, problema es en React component

**Solución:** Problema de frontend, necesito ver el código del componente

---

### **Escenario B: API NO retorna los datos** ❌

```javascript
// Si ves esto:
M1-v2 API RESPONSE
shares.length: 0
❌ shares array is EMPTY
```

**Significa:** API no encuentra el documento

**Solución:** Hay problema en la query o índice de Firestore

---

### **Escenario C: API da error** ❌

```javascript
// Si ves esto:
❌ API Error: ...
```

**Significa:** Endpoint tiene error

**Solución:** Revisar logs del servidor

---

## 🎯 **QUÉ HACER CON LOS RESULTADOS**

### **Si API retorna 14 usuarios:**

**Problema:** React component no renderiza los datos

**Posibles causas:**
1. Estado React no se actualiza
2. Condición en el render oculta los usuarios
3. Mapping del array tiene error

**Necesito:**
- Screenshot de Console con el output
- Y te digo cómo arreglar el componente

---

### **Si API retorna 0 usuarios:**

**Problema:** Backend no encuentra el documento

**Verificaré:**
1. Índices de Firestore
2. Estructura del documento
3. Query en el API endpoint

---

## 🚀 **ACCIÓN INMEDIATA**

**POR FAVOR:**

1. Abre incógnito: https://salfagpt.salfagestion.cl
2. Login
3. Abre DevTools: **F12**
4. Ve a **Console** tab
5. Copia y pega el código del **Paso 2** arriba
6. **Toma screenshot del output**
7. Envíamelo

**Con esa información sabré exactamente qué está fallando** y te daré la solución precisa. 🎯

---

**⏰ Hazlo ahora y mándame screenshot de la Console** 🔍


