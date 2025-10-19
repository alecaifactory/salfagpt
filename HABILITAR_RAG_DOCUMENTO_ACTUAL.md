# 🚀 Habilitar RAG para Tu Documento Actual

**Documento:** ANEXOS-Manual-EAE-IPT-MINVU.pdf  
**Tokens:** ~113,014

---

## ⚡ Paso 1: Ejecuta Esto en Browser Console

**Abre Console (F12)** y pega esto:

```javascript
// Get the ANEXOS document and enable RAG
async function enableRAGForANEXOS() {
  try {
    console.log('🔍 Buscando documento ANEXOS...');
    
    // Get all sources
    const sourcesResponse = await fetch('/api/context-sources?userId=' + localStorage.getItem('userId'));
    const sourcesData = await sourcesResponse.json();
    
    // Find ANEXOS document
    const anexosDoc = sourcesData.sources?.find(s => s.name.includes('ANEXOS-Manual'));
    
    if (!anexosDoc) {
      console.log('❌ Documento ANEXOS no encontrado');
      return;
    }
    
    console.log('✅ Documento encontrado:', anexosDoc.name);
    console.log('   ID:', anexosDoc.id);
    console.log('   RAG Enabled:', anexosDoc.ragEnabled || false);
    
    if (anexosDoc.ragEnabled) {
      console.log('✅ RAG ya está habilitado');
      console.log('   Chunks:', anexosDoc.ragMetadata?.totalChunks);
      console.log('');
      console.log('🎯 Refresh la página para ver los controles RAG');
      return;
    }
    
    // Enable RAG
    console.log('🔍 Habilitando RAG...');
    console.log('   (Esto tomará ~15-30 segundos)');
    
    const enableResponse = await fetch(`/api/context-sources/${anexosDoc.id}/enable-rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: anexosDoc.userId,
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
      console.log('🎯 Ahora refresh la página (Ctrl+R)');
      console.log('   Verás los controles RAG en "Fuentes de Contexto"');
    } else {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Execute
enableRAGForANEXOS();
```

**Presiona Enter** y espera ~30 segundos

---

## 📊 Lo Que Verás

**En Console:**
```
🔍 Buscando documento ANEXOS...
✅ Documento encontrado: ANEXOS-Manual-EAE-IPT-MINVU.pdf
   ID: abc123xyz
   RAG Enabled: false

🔍 Habilitando RAG...
   (Esto tomará ~15-30 segundos)

✅ RAG habilitado exitosamente!
   Chunks creados: 100
   Tiempo: 15.2s
   Costo: $0.0012

🎯 Ahora refresh la página (Ctrl+R)
   Verás los controles RAG en "Fuentes de Contexto"
```

---

## ✅ Después del Refresh

**Verás en panel de contexto:**

```
Fuentes de Contexto    1 activas • ~2,657 tokens

RAG: [✓ Todos RAG] [✗ Todos Full-Text]  ← NUEVO

📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf
   🌐 PUBLIC  ✓ Validado  🔍 100 chunks  ← Badge RAG
   
   Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← Toggle individual
   
   # ANEXO 1 ESTRATEGIA...
```

---

## 🎯 Entonces Podrás

**Probar diferentes modos:**
- Click "📝 Full" → Tokens suben a ~113K
- Click "🔍 RAG" → Tokens bajan a ~2.5K
- Ver el número actualizarse en header

**Hacer query:**
- Con RAG: Verás búsqueda vectorial en console
- Con Full: Verás documento completo usado

---

## 📝 Resumen de Pasos

1. **Abre Console** (F12)
2. **Pega script** de arriba
3. **Espera ~30s** (habilitando RAG)
4. **Refresh página** (Ctrl+R)
5. **Abre panel Contexto**
6. **Verás controles RAG** funcionando

---

**¿Ejecuto el script por ti o prefieres pegarlo en console?** 🚀

