# 🔍 Diagnóstico: RAG Fallback a Full-Text

**Fecha:** 18 de Octubre, 2025  
**Problema:** RAG hizo fallback a Full-Text en vez de encontrar chunks relevantes

---

## 📊 Evidencia del Log

Basado en tu captura de pantalla:

```
Hora  │ Pregunta                  │ Modelo │ Modo      │ Input │ Output │ Total
──────┼───────────────────────────┼────────┼───────────┼───────┼────────┼──────
13:39 │ resume el documento       │ Flash  │ ⚠️ Full   │   5   │ 7,582  │ 7,587
13:42 │ Describe EL PROCESO DE... │ Flash  │ ⚠️ Full   │  29   │ 7,668  │ 7,696
```

**Observaciones:**
1. ✅ RAG intentó ejecutarse (badge amarillo ⚠️, no azul 📝)
2. ❌ No encontró chunks relevantes (cayó a Full-Text)
3. ✅ Tokens input muy bajos (5, 29) = solo mensaje usuario
4. ⚠️ Tokens de contexto no aparecen sumados en input

---

## 🔎 Causas Posibles

### Causa 1: Documento NO tiene chunks indexados ⚠️ **MÁS PROBABLE**

**Síntoma:**
```
⚠️ No chunks found - documents may not be indexed for RAG
```

**Por qué pasa:**
- Documento fue subido ANTES de habilitar RAG
- Documento fue subido con RAG deshabilitado
- Indexación falló silenciosamente
- Chunks no se crearon en Firestore

**Cómo verificar:**
1. Mira el documento en UI
2. ¿Muestra "🔍 100 chunks" o similar?
3. Si NO muestra → Chunks no existen

**Solución:**
```bash
1. Click en Settings (⚙️) del documento
2. Click "Re-extraer"
3. Asegura que RAG esté HABILITADO
4. Espera a que complete
5. Verifica que muestre "🔍 X chunks"
6. Re-prueba la query
```

---

### Causa 2: Query muy diferente del contenido

**Síntoma:**
```
✓ Found 0 similar chunks
⚠️ No chunks above similarity threshold
```

**Por qué pasa:**
- Query: "resume el documento"
- Chunks: Texto técnico específico
- Similaridad: <50% (bajo umbral)

**Cómo verificar:**
- Pregunta debería haber encontrado algo
- Pero umbral 0.5 es alto
- Chunks con 30-40% similaridad son ignorados

**Solución:**
```bash
1. Baja minSimilarity a 0.3
2. O usa pregunta más específica: "¿Qué dice sobre X?"
```

---

### Causa 3: Configuración RAG no se está enviando

**Síntoma:**
```typescript
// Request no incluye:
ragEnabled: true
ragTopK: 5
ragMinSimilarity: 0.5
```

**Por qué pasa:**
- Frontend no envía configuración RAG
- API usa defaults pero pueden estar mal

**Cómo verificar:**
- Revisa console del navegador
- Busca payload del POST
- Verifica si incluye `ragEnabled`

**Solución:**
```typescript
// En sendMessage(), asegurar:
body: JSON.stringify({
  userId,
  message,
  model,
  systemPrompt,
  contextSources: [...],
  ragEnabled: agentRAGMode !== 'full-text',  // ✅
  ragTopK: 5,
  ragMinSimilarity: 0.5
})
```

---

## 🧪 Diagnóstico Paso a Paso

### Paso 1: Verificar chunks existen

**En UI del documento:**
```
📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf
   🌐 PUBLIC  ✓ Validado  🔍 46 chunks  ← ¿Ves esto?
```

**Si NO ves "🔍 X chunks":**
- ❌ Documento no tiene chunks indexados
- 💡 Acción: Re-extraer con RAG habilitado

**Si SÍ ves "🔍 X chunks":**
- ✅ Chunks existen
- 💡 Ir a Paso 2

---

### Paso 2: Verificar configuración en request

**Abre DevTools → Network → XHR:**
1. Envía mensaje de prueba
2. Busca request `POST .../messages`
3. Click en request → Payload
4. Verifica incluye:
   ```json
   {
     "ragEnabled": true,
     "ragTopK": 5,
     "ragMinSimilarity": 0.5
   }
   ```

**Si NO está:**
- ❌ Frontend no envía config RAG
- 💡 Acción: Verificar código de sendMessage

**Si SÍ está:**
- ✅ Config se envía
- 💡 Ir a Paso 3

---

### Paso 3: Revisar logs del servidor

**En terminal donde corre `npm run dev`:**

Busca output de RAG search:
```
🔍 RAG Search starting...
  Query: "resume el documento"
  TopK: 5, MinSimilarity: 0.5
  1/4 Generating query embedding... (152ms)
  2/4 Loading document chunks... (87ms)
  ✓ Loaded 0 chunks  ← ⚠️ PROBLEMA AQUÍ
  ⚠️ No chunks found
```

**Si dice "Loaded 0 chunks":**
- ❌ Firestore no tiene chunks para este userId/sourceId
- 💡 Acción: Re-indexar documento

**Si dice "Found 0 similar chunks":**
- ⚠️ Chunks existen pero similaridad <0.5
- 💡 Acción: Bajar minSimilarity

---

### Paso 4: Verificar en Firestore Console

**URL:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_chunks
```

**Buscar:**
- Collection: `document_chunks`
- Filter: `userId == TU_USER_ID`
- Filter: `sourceId == ID_DEL_DOCUMENTO`

**Si no hay documentos:**
- ❌ Chunks no indexados
- 💡 Acción: Re-extraer documento

**Si hay documentos:**
- ✅ Chunks existen
- 💡 Verifica tienen campo `embedding` (array de 768 números)
- 💡 Si no tiene embedding → Re-indexar

---

## 🛠️ Soluciones por Causa

### Solución 1: Re-indexar Documento (MÁS COMÚN)

**Pasos:**

1. **Abre configuración del documento:**
   ```
   Click ⚙️ Settings en el documento
   ```

2. **Re-extraer con RAG:**
   ```
   1. Verifica "Modelo de IA": Flash o Pro
   2. Asegura RAG esté HABILITADO (si hay opción)
   3. Click "🔄 Re-extraer"
   4. Espera procesamiento
   ```

3. **Verifica chunks creados:**
   ```
   Documento ahora debe mostrar: 🔍 100 chunks (o similar)
   ```

4. **Re-prueba query:**
   ```
   Envía misma pregunta
   Ahora debería usar RAG ✅
   ```

---

### Solución 2: Ajustar Configuración RAG

**Si chunks existen pero no se encuentran:**

1. **Baja minSimilarity:**
   ```
   De: 0.5 → A: 0.3
   ```
   
2. **Sube topK:**
   ```
   De: 5 → A: 10
   ```

3. **Usa pregunta más específica:**
   ```
   ❌ "resume el documento"
   ✅ "¿Qué dice sobre proceso de evaluación?"
   ```

---

### Solución 3: Verificar Modo RAG Activo

**En UI de fuentes de contexto:**

```
⚙️ Modo de Búsqueda

[📝 Full-Text] [🔍 RAG ●]  ← Debe estar en RAG
```

**Si está en Full-Text:**
- Click en 🔍 RAG
- Aplicar
- Re-intentar query

---

## 📝 Checklist de Diagnóstico

Revisa en orden:

- [ ] **Documento muestra "🔍 X chunks"?**
  - NO → Re-extraer con RAG
  - SÍ → Continuar

- [ ] **Modo de Búsqueda en 🔍 RAG?**
  - NO → Cambiar a RAG
  - SÍ → Continuar

- [ ] **Request incluye `ragEnabled: true`?**
  - NO → Bug en frontend
  - SÍ → Continuar

- [ ] **Server logs muestran "Loaded X chunks" > 0?**
  - NO → Chunks no en Firestore
  - SÍ → Continuar

- [ ] **Server logs muestran "Found 0 similar chunks"?**
  - SÍ → Bajar minSimilarity
  - NO → Otro problema

---

## 🎯 Diagnóstico Más Probable

Basado en la evidencia:

### 🔴 PROBLEMA: Documento NO tiene chunks indexados

**Razón:**
```
El documento "ANEXOS-Manual-EAE-IPT-MINVU.pdf" fue subido ANTES de:
- Habilitar RAG globalmente
- Implementar indexación automática
- Activar chunking en extracción
```

**Evidencia:**
1. Badge muestra ⚠️ Full (amarillo) = Fallback
2. No dice "chunks no encontrados" en UI
3. Tokens input muy bajos (5, 29) = sin contexto

**Solución:**
```
1. Settings del documento
2. Re-extraer
3. Esperar completar
4. Verificar "🔍 chunks" aparece
5. Re-probar query
```

---

## 🔄 Acción Inmediata Recomendada

### Para Este Documento

```bash
# 1. Re-indexar
Settings → Re-extraer → Esperar

# 2. Verificar chunks creados
UI debe mostrar: 🔍 100 chunks (aproximadamente)

# 3. Test simple
Pregunta: "¿Qué contiene el documento?"
Esperado: 🔍 RAG (verde)

# 4. Test específico
Pregunta: "¿Qué dice sobre evaluación ambiental?"
Esperado: 🔍 RAG (verde) con alta similaridad
```

---

### Para Futuros Documentos

```bash
# Al subir nuevo documento:
1. ✅ Asegurar RAG habilitado ANTES de subir
2. ✅ Verificar "🔍 chunks" aparece después
3. ✅ Test query para confirmar funciona
4. ✅ Revisar log muestra 🔍 RAG (verde)
```

---

## 📊 Verificación Post-Solución

**Después de re-indexar, deberías ver:**

```
Hora  │ Pregunta                  │ Modelo │ Modo      │ Input   │ Output
──────┼───────────────────────────┼────────┼───────────┼─────────┼────────
14:30 │ Describe EL PROCESO...    │ Flash  │ 🔍 RAG    │ 2,543   │ 1,234
                                             └─ Verde   └─ Bajo   └─ Normal
```

**Y en detalles:**
```
🔍 Configuración RAG:
  Habilitado: Sí
  Realmente usado: Sí ✓
  Chunks usados: 5
  Tokens RAG: 2,500
  Similaridad promedio: 78.5%
  
  Por documento:
  • ANEXOS-Manual-EAE-IPT-MINVU.pdf: 5 chunks, 2,500 tokens
```

---

## 💡 Resumen

**Problema identificado:**
- ⚠️ Documento no tiene chunks indexados en Firestore
- ⚠️ RAG intentó buscar pero no encontró nada
- ⚠️ Sistema cayó correctamente a Full-Text (graceful degradation)

**Solución:**
1. Re-extraer documento con RAG habilitado
2. Verificar chunks se crearon
3. Re-probar query

**Tiempo estimado:** 2-3 minutos para re-indexar

---

**Estado:** Problema diagnosticado ✅  
**Solución:** Re-indexar documento  
**Urgencia:** Media (sistema funciona, solo sin optimización RAG)

---

**Siguiente paso:** Re-extraer el documento y confirmar que aparezcan chunks en la UI.





