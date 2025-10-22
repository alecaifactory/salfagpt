# 🔄 Instrucciones: Re-indexar Documento ANEXOS para RAG

**Fecha:** 18 de Octubre, 2025  
**Documento:** ANEXOS-Manual-EAE-IPT-MINVU.pdf  
**Problema:** Documento no tiene chunks indexados, RAG cae a Full-Text

---

## 🎯 Solución: Re-extraer desde la UI (2 minutos)

### Paso 1: Localizar el Documento

1. **Abre** http://localhost:3000/chat
2. **Navega** a la sección "Fuentes de Contexto" (sidebar izquierdo)
3. **Busca** el documento: `ANEXOS-Manual-EAE-IPT-MINVU.pdf`

**Deberías ver:**
```
📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf
   🌐 PUBLIC  ✓ Validado  
   
   [Toggle ON/OFF]  [⚙️ Settings]
```

---

### Paso 2: Abrir Configuración

1. **Click** en el ícono **⚙️ Settings** del documento
2. **Se abre** modal de configuración

**Verás algo como:**
```
┌─────────────────────────────────────────────┐
│ ⚙️ Configuración de Extracción          [X]│
│ ANEXOS-Manual-EAE-IPT-MINVU.pdf             │
├─────────────────────────────────────────────┤
│                                             │
│ Fuente Original:                            │
│ • Archivo: ANEXOS-Manual...pdf              │
│ • Tamaño: X MB                              │
│ • Tipo: PDF                                 │
│                                             │
│ Extracción:                                 │
│ • Modelo: Gemini 2.5 Flash                  │
│ • Fecha: ...                                │
│ • Caracteres: XXX,XXX                       │
│ • Tokens: XXX,XXX                           │
│                                             │
│ [🔄 Re-extraer]      [Cerrar]              │
└─────────────────────────────────────────────┘
```

---

### Paso 3: Re-extraer con RAG

1. **Click** en botón **🔄 Re-extraer**
2. **Confirma** si pregunta
3. **Espera** a que complete (1-2 minutos)

**Verás progreso:**
```
⏳ Procesando documento...
   [████████░░] 80%
   Generando embeddings para RAG...
```

**Cuando complete:**
```
✅ Extracción completa
   🔍 46 chunks creados
```

---

### Paso 4: Verificar Chunks Creados

**Después de re-extraer, el documento debería mostrar:**

```
📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf
   🌐 PUBLIC  ✓ Validado  🔍 46 chunks  ← ✅ NUEVO!
   
   [Toggle ON/OFF]  [⚙️ Settings]
```

**Indicador clave:**
- ✅ `🔍 46 chunks` (o número similar) = Indexado correctamente
- ❌ Si NO aparece = Indexación falló o no se habilitó RAG

---

### Paso 5: Probar RAG

1. **Envía mensaje de prueba:**
   ```
   "Describe EL PROCESO DE EVALUACIÓN AMBIENTAL ESTRATÉGICA"
   ```

2. **Espera respuesta**

3. **Abre Context Panel** (botón "Contexto")

4. **Verifica en tabla de logs:**

**Resultado esperado:**
```
Hora  │ Pregunta                  │ Modelo │ Modo      │ Input   │ Output
──────┼───────────────────────────┼────────┼───────────┼─────────┼────────
14:55 │ Describe EL PROCESO...    │ Flash  │ 🔍 RAG    │ 2,543   │ 1,234
                                             └─ ✅ Verde!
```

**Si ves:**
- ✅ **🔍 RAG (verde)** = ¡Éxito! RAG funcionando
- ⚠️ **⚠️ Full (amarillo)** = Todavía fallback, ver diagnóstico
- 📝 **📝 Full (azul)** = RAG deshabilitado, activar en switch

---

### Paso 6: Verificar Detalles

1. **Click** en "Ver detalles completos de cada interacción"
2. **Busca** la última interacción
3. **Verifica sección:**

```
🔍 Configuración RAG:
  Habilitado: Sí
  Realmente usado: Sí ✓  ← ✅ Debe decir "Sí"
  Chunks usados: 5
  Tokens RAG: 2,500
  Similaridad promedio: 78.5%
  TopK: 5
  Min Similaridad: 0.5
  
  Por documento:
  • ANEXOS-Manual-EAE-IPT-MINVU.pdf: 5 chunks, 2,500 tokens
```

**Si dice "Sí ✓":**
- ✅ ¡Perfecto! RAG funcionando correctamente

**Si dice "No (fallback)":**
- ⚠️ Ver sección "Troubleshooting" abajo

---

## 🔧 Troubleshooting

### Si Re-extraer no muestra opción RAG

**Posible causa:** Modal no tiene opción de RAG

**Solución alternativa - Vía API:**

1. Abre DevTools (F12)
2. Ve a Console
3. Ejecuta:

```javascript
// Get the source ID (verifica en la UI o mira Network tab)
const sourceId = 'ID_DEL_DOCUMENTO';  // Reemplaza con ID real
const userId = 'TU_USER_ID';           // Tu userId

fetch('/api/reindex-source', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sourceId, userId })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Re-indexado:', data);
  console.log('Chunks creados:', data.chunksCreated);
  console.log('Total tokens:', data.totalTokens);
})
.catch(err => console.error('❌ Error:', err));
```

---

### Si Chunks Creados pero RAG Sigue Fallback

**Posible causa:** minSimilarity muy alto

**Solución:**

1. **Baja el umbral** en código temporalmente:
   - Archivo: `src/pages/api/conversations/[id]/messages.ts`
   - Línea: `const ragMinSimilarity = body.ragMinSimilarity || 0.5;`
   - Cambiar a: `const ragMinSimilarity = body.ragMinSimilarity || 0.3;`

2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Re-prueba query**

---

### Si Sigue Sin Funcionar

**Diagnóstico avanzado:**

1. **Verifica en Firestore Console:**
   ```
   https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_chunks
   ```

2. **Busca chunks con:**
   - Filter: `userId == TU_USER_ID`
   - Deberías ver múltiples documentos

3. **Si NO hay chunks:**
   - Indexación falló
   - Revisar logs del servidor cuando hiciste re-extracción
   - Buscar errores en consola

4. **Si SÍ hay chunks:**
   - Problema es de similaridad
   - Bajar minSimilarity
   - O usar query más específica

---

## 📝 Notas Importantes

### Sobre la Re-indexación

**Qué hace:**
1. Divide documento en ~46 chunks de ~500 tokens cada uno
2. Genera embedding (vector de 768 dimensiones) para cada chunk
3. Guarda chunks con embeddings en Firestore collection `document_chunks`
4. Actualiza metadata del documento con `ragEnabled: true` y `chunkCount: 46`

**Tiempo:**
- Documento de 100 páginas: ~1-2 minutos
- Depende de: tamaño del documento, velocidad de Gemini API

**Costo:**
- Embeddings: GRATIS (Gemini API)
- Storage: Insignificante (~1KB per chunk = 46KB total)

---

## ✅ Verificación Final

**Después de completar todos los pasos:**

- [ ] Documento muestra `🔍 X chunks`
- [ ] Nueva query muestra modo `🔍 RAG` (verde)
- [ ] Tokens input bajaron de ~7K a ~2.5K
- [ ] Detalles muestran "Realmente usado: Sí ✓"
- [ ] Similaridad promedio >70%

**Si todos marcados ✅:**
- 🎉 ¡RAG funcionando perfectamente!
- 💰 Ahorro confirmado: ~98%
- ⚡ Respuestas más rápidas

---

## 🎯 Próximo Paso

**AHORA:**
1. Re-extrae el documento desde la UI (Settings → Re-extraer)
2. Espera a que complete
3. Verifica aparezca "🔍 chunks"
4. Re-prueba tu query original

**En ~2 minutos deberías ver:**
- ✅ Badge verde 🔍 RAG
- ✅ Tokens ~2,500 (no ~113,000)
- ✅ Ahorro 98%

---

**¿Necesitas ayuda con algún paso específico?**














