# 🎯 Ver RAG Funcionando AHORA - Método Simple

**Usando solo el browser - 5 minutos**

---

## ✅ Método Más Simple (Browser Console)

### Paso 1: Abre Browser Console en Context Management (1 min)

1. Abre http://localhost:3000/chat
2. Click en "Context Management" (Database icon)
3. Abre Console del browser (F12)
4. Ve a la tab "Console"

---

### Paso 2: Ejecuta Este Script en Console (2 min)

**Copia y pega esto en la console del browser:**

```javascript
// Get first document and enable RAG
async function enableRAGForFirstDocument() {
  try {
    console.log('🔍 Buscando documento...');
    
    // Get sources (already loaded in page)
    const response = await fetch('/api/context-sources?userId=' + window.userId);
    const data = await response.json();
    
    if (!data.sources || data.sources.length === 0) {
      console.log('❌ No hay documentos. Upload uno primero.');
      return;
    }
    
    const source = data.sources[0];
    console.log('✅ Documento encontrado:', source.name);
    console.log('   ID:', source.id);
    console.log('   RAG enabled:', source.ragEnabled || false);
    console.log('');
    
    if (source.ragEnabled) {
      console.log('✅ RAG ya está habilitado');
      console.log('');
      console.log('🎯 Ahora haz una query en el chat!');
      return;
    }
    
    // Enable RAG
    console.log('🔍 Habilitando RAG...');
    const enableResponse = await fetch(`/api/context-sources/${source.id}/enable-rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: source.userId,
        chunkSize: 500,
        overlap: 50
      })
    });
    
    const result = await enableResponse.json();
    
    if (result.success) {
      console.log('✅ RAG habilitado exitosamente!');
      console.log('   Chunks creados:', result.chunksCreated);
      console.log('   Tiempo:', (result.indexingTime / 1000).toFixed(1) + 's');
      console.log('   Costo:', '$' + result.estimatedCost.toFixed(4));
      console.log('');
      console.log('🎯 Ahora cierra y vuelve a abrir Context Management');
      console.log('   Luego haz una query sobre:', source.name);
      console.log('   Verás RAG search logs aquí en console!');
    } else {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Execute
enableRAGForFirstDocument();
```

**Presiona Enter** ✅

**Verás:**
```
🔍 Buscando documento...
✅ Documento encontrado: DDU-ESP-019-07.pdf
   ID: abc123xyz
   RAG enabled: false

🔍 Habilitando RAG...
✅ RAG habilitado exitosamente!
   Chunks creados: 100
   Tiempo: 15.2s
   Costo: $0.0012

🎯 Ahora cierra y vuelve a abrir Context Management
   Luego haz una query sobre: DDU-ESP-019-07.pdf
   Verás RAG search logs aquí en console!
```

---

### Paso 3: Hacer Query y Ver RAG (2 min)

1. **Cierra Context Management modal**
2. **Asegura que el documento está enabled** (toggle ON en sidebar)
3. **Haz pregunta:** "Resume el documento"
4. **Mira Console** - Verás:

```
🔍 Attempting RAG search...
✅ RAG: Using 5 relevant chunks (2,487 tokens)
```

5. **Abre Context Panel** (click botón "Context")
6. **Verás:**
```
Context: 0.5% usado
2,487 tokens (95% menos!)
```

**¡RAG FUNCIONANDO!** 🎉

---

## 🎨 Qué Verás en Acción

### En Console

**RAG Search Process:**
```
🔍 RAG Search starting...
  1/4 Generating query embedding... ✓ (23ms)
  2/4 Loading document chunks... ✓ (123ms) 
  3/4 Calculating similarities... ✓ (12ms)
  4/4 Loading source metadata... ✓ (8ms)

✅ RAG Search complete - 5 results
  1. Document (chunk 23) - 89% similar
  2. Document (chunk 45) - 84% similar
  3. Document (chunk 67) - 79% similar
  4. Document (chunk 12) - 71% similar
  5. Document (chunk 89) - 68% similar
```

### En Context Panel

**Antes (full-text):**
```
Total Tokens: 52,000
Disponible: 948,000
Contexto: 5.2%
```

**Después (RAG):**
```
Total Tokens: 2,487
Disponible: 997,513
Contexto: 0.5%
Ahorro: 95% ✨
```

---

## ✅ Resumen

**Para ver RAG ahora:**

1. **Abre:** http://localhost:3000/chat
2. **Abre Console** (F12)
3. **Pega el script de arriba** en console
4. **Ejecuta** (Enter)
5. **Espera** ~15 segundos
6. **Haz query** sobre el documento
7. **Mira console** → Verás RAG search!

**¿Abro el browser y ejecuto el script por ti?** O **¿prefieres hacerlo manual?** 🚀
