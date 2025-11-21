# 🔧 FIX: No mostrar referencias cuando no hay documentos relevantes

**Fecha:** 2025-11-13  
**Issue:** Referencias mostrándose al 100% aunque no hay documentos relevantes  
**Severidad:** Alta - Confunde a usuarios  
**Estado:** ✅ Arreglado

---

## 🐛 Problema

### Comportamiento Incorrecto

Cuando el sistema no encuentra documentos con alta relevancia (>70%), el AI correctamente informa al usuario que no hay documentos disponibles, **PERO** también muestra un badge de "📚 Referencias utilizadas: 10" con un porcentaje de 100%.

**Ejemplo:**
```
SalfaGPT:
No encontré documentos específicos con alta relevancia (>70%) para tu pregunta...

📚 Referencias utilizadas (10)  ← ❌ NO DEBERÍAN MOSTRARSE
[Badges con 100%]               ← ❌ CONFUSO
```

### Por Qué Ocurría

El código estaba construyendo referencias incluso cuando `ragHadFallback = true`:

```typescript
// ❌ ANTES: Construía referencias aunque ragHadFallback = true
if (ragUsed && ragResults.length > 0) {
  references = ragResults.map(...);
}
```

---

## ✅ Solución

### 1. Modificado: `src/pages/api/conversations/[id]/messages.ts`

**Cambio:**
```typescript
// ✅ DESPUÉS: Solo construye referencias si NO hay fallback
if (ragUsed && ragResults.length > 0 && !ragHadFallback) {
  references = ragResults.map(...);
  console.log(`📚 Built ${references.length} references from RAG results`);
} else if (ragHadFallback) {
  console.log(`📚 No references built - ragHadFallback = true (no relevant docs found)`);
}
```

**Razón:**
- Si `ragHadFallback = true` → NO hay docs relevantes → NO mostrar referencias
- El AI ya informará al usuario sobre la falta de documentos

---

### 2. Modificado: `src/pages/api/conversations/[id]/messages-stream.ts`

**Cambio:**
```typescript
// ❌ ANTES: Bloque que construía referencias desde full documents cuando ragHadFallback
} else if (activeSourceIds && activeSourceIds.length > 0 && ragHadFallback) {
  // Construía referencias de documentos completos
  references = sourcesSnapshot.docs.map(...);
}

// ✅ DESPUÉS: Solo log, NO construir referencias
} else if (ragHadFallback) {
  console.log('📚 No references built - ragHadFallback = true (no relevant docs found)');
  console.log('   AI will inform user to use Calificar button to report missing docs');
}
```

**Razón:**
- Removemos completamente el bloque que construía referencias cuando `ragHadFallback = true`
- Solo logueamos que no se construyeron referencias

---

### 3. Modificado: `src/lib/rag-helper-messages.ts`

**Cambio:** Actualizado el mensaje que el AI usa para informar al usuario

**Antes:**
```
"Anima al usuario a dejar feedback en el Roadmap..."
```

**Después:**
```
INSTRUCCIONES PARA TU RESPUESTA:
1. Informa al usuario que no encontramos el documento que estaba buscando
2. Explica que los documentos actuales no contienen información suficientemente relevante
3. Invita al usuario a reportar esto usando el botón "Calificar" (⭐)
4. Sugiere que mencione en los comentarios:
   - Los nombres de los documentos donde debería estar esta información
   - Puede subir los documentos si los tiene, para que el Admin los revise
5. Proporciona contacto del administrador
```

**Ejemplo de respuesta que el AI generará ahora:**
```
No encontramos el documento que buscabas, o la información disponible en los 
documentos actuales no tiene suficiente relevancia para tu pregunta.

📋 **Por favor, repórtalo:**
- Haz clic en el botón **"Calificar"** (⭐) en la esquina superior derecha
- En los comentarios, menciona los nombres de los documentos donde debería 
  estar esta información (si los conoces)
- Si tienes los documentos, puedes subirlos para que el Admin los revise 
  y los agregue a la plataforma

📧 **Contacto directo:**
[admin emails aquí]

💡 **Ayúdanos a mejorar:**
Tu feedback ayuda al equipo a identificar qué documentación hace falta.
```

---

## 🎯 Resultado Esperado

### Cuando hay documentos relevantes (>70%)
```
SalfaGPT:
[Respuesta usando los documentos]

📚 Referencias utilizadas (3)
[1] DOCUMENTO.pdf - 87%  ✅ Doc. Completo
[2] MANUAL.pdf - 92%     ✅ Doc. Completo
[3] GUIA.pdf - 81%       ✅ Doc. Completo
```

### Cuando NO hay documentos relevantes (<70%)
```
SalfaGPT:
No encontramos el documento que buscabas...

📋 Por favor, repórtalo:
- Haz clic en el botón "Calificar" (⭐)
- Menciona los nombres de los documentos...

📧 Contacto directo:
[admin emails]

💡 Ayúdanos a mejorar...

❌ SIN BADGES DE REFERENCIAS  ← ✅ ARREGLADO
```

---

## 🧪 Testing

### Caso de Prueba

1. **Hacer pregunta sin documentos relevantes:**
   ```
   "¿Qué procedimientos están asociados al plan de calidad?"
   ```

2. **Verificar:**
   - ✅ AI informa que no hay docs
   - ✅ Menciona botón "Calificar"
   - ✅ Sugiere reportar docs faltantes
   - ✅ **NO muestra badges de referencias**
   - ✅ **NO muestra "Referencias utilizadas (10)"**

3. **Console logs esperados:**
   ```
   ⚠️ RAG: Best similarity 45.2% < 70%
   📚 No references built - ragHadFallback = true (no relevant docs found)
      AI will inform user to use Calificar button to report missing docs
   ```

---

## 📋 Archivos Modificados

1. ✅ `src/lib/rag-helper-messages.ts` - Mensaje actualizado con instrucciones del botón "Calificar"
2. ✅ `src/pages/api/conversations/[id]/messages.ts` - Condición `!ragHadFallback` agregada
3. ✅ `src/pages/api/conversations/[id]/messages-stream.ts` - Bloque de full-doc references removido

---

## ✅ Verificación

- [ ] Type check: `npm run type-check` → 0 errores
- [ ] Lint check: `npm run lint` → 0 errores ✅
- [ ] Test manual: Preguntar algo sin docs → Sin badges ✅
- [ ] Console logs: Verificar logs correctos ✅

---

## 📚 Relacionado

- `IMPLEMENTACION_UMBRAL_70_PERCENT_2025-11-12.md` - Umbral 70% implementado
- `RAG_COMPLEMENTARY_ARCHITECTURE.md` - Arquitectura RAG completa
- `.cursor/rules/alignment.mdc` - Principio: Feedback & Visibility

---

**Resumen:** Ahora cuando no hay documentos relevantes, el sistema NO muestra badges de referencias y el AI guía al usuario a usar el botón "Calificar" para reportar la falta de documentación. ✅






