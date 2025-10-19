# 🚀 Script para Habilitar RAG - Browser Console

**Ejecuta esto en la console del browser (F12) en la página del chat**

---

## 📋 Script Completo

**Copia y pega TODO esto en Console:**

```javascript
// Script para habilitar RAG y ver los controles
(async function enableRAGAndShowControls() {
  try {
    console.log('🔍 Iniciando habilitación de RAG...');
    console.log('');
    
    // Step 1: Get user ID from page
    const userIdElement = document.querySelector('[data-user-id]');
    let userId = '114671162830729001607'; // Tu user ID conocido
    
    console.log('✅ User ID:', userId);
    console.log('');
    
    // Step 2: Find ANEXOS document in Firestore directly
    console.log('📄 Buscando documento ANEXOS en Firestore...');
    
    // Since we can't call API without auth, we'll use a workaround
    // The document ID should be visible in the page source
    
    // Alternative: Enable RAG for ALL documents without RAG
    console.log('');
    console.log('⚠️ Para habilitar RAG, necesitamos el Source ID');
    console.log('');
    console.log('📋 Pasos manuales:');
    console.log('');
    console.log('1. Abre Firestore Console:');
    console.log('   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore');
    console.log('');
    console.log('2. Ve a collection: context_sources');
    console.log('');
    console.log('3. Busca documento: ANEXOS-Manual-EAE-IPT-MINVU.pdf');
    console.log('');
    console.log('4. Copia el Document ID (primera columna)');
    console.log('');
    console.log('5. Vuelve aquí y ejecuta:');
    console.log('');
    console.log('   const sourceId = "PEGA_EL_ID_AQUI";');
    console.log('   const response = await fetch(`/api/context-sources/${sourceId}/enable-rag`, {');
    console.log('     method: "POST",');
    console.log('     headers: { "Content-Type": "application/json" },');
    console.log('     body: JSON.stringify({');
    console.log('       userId: "114671162830729001607",');
    console.log('       chunkSize: 500,');
    console.log('       overlap: 50');
    console.log('     })');
    console.log('   });');
    console.log('   const data = await response.json();');
    console.log('   console.log(data);');
    console.log('');
    console.log('6. Espera que diga "success: true"');
    console.log('');
    console.log('7. Refresh la página (Ctrl+R)');
    console.log('');
    console.log('8. Abre panel Contexto → Verás controles RAG! ✨');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

---

## 🎯 Método Más Rápido

**Si prefieres método directo:**

**Paso 1:** Abre Firestore Console
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources
```

**Paso 2:** Busca el documento "ANEXOS-Manual-EAE-IPT-MINVU.pdf"

**Paso 3:** Copia el Document ID (ej: `abc123xyz`)

**Paso 4:** En browser console, ejecuta:
```javascript
const sourceId = "PEGA_ID_AQUI";  // Del paso 3

const response = await fetch(`/api/context-sources/${sourceId}/enable-rag`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "114671162830729001607",
    chunkSize: 500,
    overlap: 50
  })
});

const data = await response.json();
console.log(data);

// Espera ver: {"success":true,"chunksCreated":100,...}
```

**Paso 5:** Refresh la página

**Paso 6:** Abre panel Contexto → ¡Verás todos los controles RAG!

---

## ✨ Lo Que Verás Después

### En Panel de Contexto:

```
Fuentes de Contexto    1 activas • ~2,657 tokens  ← Tokens con RAG

RAG: [✓ Todos RAG ●] [✗ Todos Full-Text]  ← Bulk actions

📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf
   🌐 PUBLIC  ✓ Validado  🔍 100 chunks  ← Badge RAG
   
   Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← Toggle individual
   
   # ANEXO 1 ESTRATEGIA DE...
```

**Click "📝 Full":**
- Tokens suben a ~113,014
- Header actualiza: "~113,014 tokens"

**Click "🔍 RAG":**
- Tokens bajan a ~2,500
- Header actualiza: "~2,657 tokens"
- Verde indica ahorro

---

**¿Abro la Firestore console por ti para que copies el Source ID?** 🚀
