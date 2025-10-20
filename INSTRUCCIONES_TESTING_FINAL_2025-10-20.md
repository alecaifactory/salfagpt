# 🚀 INSTRUCCIONES FINALES - Testing RAG con Embeddings Semánticos

## ✅ ESTADO ACTUAL

**Commits realizados:** 2
- feat: Implementar embeddings semánticos + referencias RAG
- fix: Cargar GOOGLE_AI_API_KEY desde .env file

**Servidor:** Corriendo en http://localhost:3000 ✅

**Cambios aplicados:**
1. ✅ Embeddings semánticos con Gemini AI
2. ✅ API key se lee directamente del .env
3. ✅ System prompt específico para RAG
4. ✅ Fragment mapping y validación
5. ✅ Threshold a 0 para debugging
6. ✅ Cir32.pdf re-indexado con embeddings semánticos

---

## 🧪 TESTING AHORA MISMO

### Paso 1: Refresh Browser

**Hard refresh:**
- Mac: `Cmd + Shift + R`
- PC: `Ctrl + Shift + R`

**URL:** http://localhost:3000/chat

---

### Paso 2: Abre Console del Navegador

- Press `F12` o `Cmd + Option + I`
- Ve a pestaña **"Console"**
- Deja abierta para ver logs

---

### Paso 3: Haz la Pregunta

En el chat input, escribe:
```
¿Qué dice sobre la Ley 19.537?
```

Press Enter

---

### Paso 4: Observa BACKEND Logs (Terminal)

**En tu terminal** donde corre `npm run dev`, busca:

**✅ SI FUNCIONA verás:**
```
🔍 [Streaming] Attempting RAG search...
  1/4 Generating query embedding...
🔑 [Embeddings] Loaded API key from .env file  ← ESTO ES CRÍTICO
🧮 [Gemini AI] Generating semantic embedding (¿Qué dice sobre...)
✅ [Gemini AI] Generated SEMANTIC embedding: 768 dimensions
  
  3/4 Calculating similarities...
  ✓ Found 3 similar chunks  ← NO dice 0!
  
✅ RAG: Using 3 relevant chunks (1,234 tokens)
  Avg similarity: 67.8%  ← NO es 0%!
  1. Cir32.pdf (chunk 1) - 89.2% similar  ← Similitud REAL
  2. Cir32.pdf (chunk 0) - 68.5% similar
  3. Cir32.pdf (chunk 2) - 45.7% similar
```

**❌ SI NO FUNCIONA verás:**
```
⚠️ GOOGLE_AI_API_KEY not available  ← Problema persiste
✓ Found 0 similar chunks  ← Similarity = 0
⚠️ No chunks above similarity threshold
⚠️ Using full documents  ← Fallback
```

---

### Paso 5: Observa FRONTEND Logs (Console del Navegador)

**✅ SI FUNCIONA verás:**
```javascript
🗺️ Fragment mapping received: (3) [{…}, {…}, {…}]
📋 Expected citations in response: [1], [2], [3]
  [1] → Fragmento 1 (Cir32.pdf) - 89.2%
  [2] → Fragmento 0 (Cir32.pdf) - 68.5%
  [3] → Fragmento 2 (Cir32.pdf) - 45.7%

📋 Citation validation:
  Expected: [1], [2], [3]
  Found in text: [1], [2], [3]
  Coverage: 3/3 (100%)
✅ All fragments were cited correctly by the AI!

📚 References in completion: 3
📚 Reference details: (3) [{similarity: 0.892, …}, {similarity: 0.685, …}, {similarity: 0.457, …}]
```

**❌ SI NO FUNCIONA verás:**
```javascript
📚 References in completion: 1
📚 Reference details: (1) [{similarity: 1.0, chunkIndex: -1, …}]
// NO hay fragment mapping
// Similarity = 1.0 (100%)
```

---

### Paso 6: Observa la UI

**✅ SI FUNCIONA verás:**

**En la respuesta:**
- `[1]`, `[2]`, `[3]` como badges azules clickeables (NO texto negro)

**Debajo de la respuesta:**
```
📚 Referencias utilizadas (3)

[1] Cir32.pdf - 89.2% similar  ← NO 100%!
    Fragmento 1 - 🔍 RAG  ← NO "Doc. Completo"
    465 tokens
    
[2] Cir32.pdf - 68.5% similar
    Fragmento 0 - 🔍 RAG
    371 tokens
    
[3] Cir32.pdf - 45.7% similar
    Fragmento 2 - 🔍 RAG
    429 tokens
```

**En el Context Log:**
```
Modo: 🔍 RAG  ← Verde
      3 chunks
```

---

## 🚨 Troubleshooting

### Si TODAVÍA dice "GOOGLE_AI_API_KEY not available"

**Fix inmediato:**

1. Stop server (Ctrl+C en terminal)

2. Run con variable explícita:
```bash
cd /Users/alec/salfagpt
GOOGLE_AI_API_KEY=$(grep GOOGLE_AI_API_KEY .env | cut -d= -f2) npm run dev
```

3. Verás en logs:
```
🔑 [Embeddings] Loaded API key from .env file
```

---

### Si dice "Gemini API error 400"

**Possible causes:**
- API key inválida
- Request format incorrecto

**Check:**
```bash
# Test API key manualmente
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=$(grep GOOGLE_AI_API_KEY .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"model":"models/text-embedding-004","content":{"parts":[{"text":"test"}]}}'
```

---

## 📊 Expected Results Summary

| Aspecto | Antes (Broken) | Ahora (Fixed) |
|---------|----------------|---------------|
| **API Key** | ⚠️ Not available | ✅ Loaded from .env |
| **Embedding Type** | Deterministic (hash) | Semantic (Gemini AI) |
| **Similarity** | 0% | 45-95% (real) |
| **Chunks Found** | 0 | 3-5 |
| **Mode** | 📝 Full-Text | 🔍 RAG |
| **References** | [1] 100% Doc Completo | [1] 89% Fragmento 1 |
| **Tokens Used** | 2,023 (full) | ~1,200 (chunks) |

---

## ✅ Confirmation Checklist

Después de testing, confirma:

- [ ] Backend logs muestran: "🔑 [Embeddings] Loaded API key from .env file"
- [ ] Backend logs muestran: "✅ [Gemini AI] Generated SEMANTIC embedding"
- [ ] Backend logs muestran: "✓ Found X similar chunks" (X > 0)
- [ ] Frontend logs muestran: "🗺️ Fragment mapping received"
- [ ] UI muestra: Similarity < 100% (ej: 89.2%, 68.5%)
- [ ] UI muestra: "Fragmento N" (NO "Doc. Completo")
- [ ] UI muestra: Badge "🔍 RAG" (verde, NO azul "📝 Full")
- [ ] Log muestra: "🔍 RAG" con "N chunks"

---

## 🎯 Next Steps

**Si TODO funciona:**
1. Document success
2. Adjust minSimilarity back to 0.3 (from 0)
3. Test with different questions
4. Deploy to production

**Si NO funciona:**
1. Share backend logs (terminal)
2. Share frontend logs (console)
3. Share screenshot
4. We'll debug together

---

**SERVER STATUS:** ✅ Running on port 3000
**READY FOR TESTING:** YES
**ACTION REQUIRED:** Refresh browser + ask question + share results

🚀

