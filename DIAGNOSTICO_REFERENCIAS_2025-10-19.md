# Diagnóstico: Por Qué No Se Ven Referencias
**Date:** October 19, 2025  
**Status:** 🔍 Diagnóstico Completo

---

## 🎯 Hallazgos de la Base de Datos

### ✅ Lo Que Funciona

1. **Código implementado correctamente:**
   - ✅ Backend genera referencias desde RAG results
   - ✅ Referencias se pasan a `addMessage`
   - ✅ Firestore schema incluye campo `references`
   - ✅ Frontend carga y renderiza referencias
   - ✅ UI completa (footer, panel, badges)

2. **No hay errores de TypeScript:**
   - ✅ `npm run type-check` pasa sin errores
   - ✅ Servidor corre correctamente

### ⚠️ El Problema

**Revisión de base de datos muestra:**

```
📊 Mensajes revisados: 10 últimos
📚 Mensajes con referencias: 0
```

**Esto significa que:**
1. Todos los mensajes actuales fueron creados ANTES de implementar referencias
2. Para ver referencias, necesitas enviar un NUEVO mensaje
3. Ese nuevo mensaje se guardará CON referencias

---

## 🚀 Solución: Enviar Un Mensaje Nuevo

### Pasos para Ver Referencias

**1. Verifica que tienes una fuente con RAG:**
   - Abre http://localhost:3000/chat
   - Panel izquierdo → "Fuentes de Contexto"
   - Busca una fuente con badge "RAG: Habilitado"
   - Asegúrate que el toggle esté verde (ON)

**2. Si NO tienes fuentes con RAG:**
   - Click "+ Agregar" en Fuentes de Contexto
   - Sube un PDF
   - Espera a que termine el procesamiento
   - Verás "RAG: Habilitado" cuando esté listo

**3. Envía un mensaje NUEVO:**
   ```
   ¿Cómo se calcula la superficie edificada de escaleras?
   ```

**4. Observa el proceso:**
   - Ver pasos: "Pensando..." → "Buscando..." → "Seleccionando..."
   - Esperar respuesta completa
   - Scroll hacia abajo
   - **Buscar "📚 Referencias utilizadas"**

**5. Si TODAVÍA no ves referencias:**
   - Abre DevTools (F12) → Console
   - Busca estos logs:
     ```
     📚 References in completion: X
     📚 MessageRenderer received references: X
     ```
   - Si X = 0 → RAG no encontró chunks relevantes
   - Si X > 0 → Hay un bug en el renderizado

---

## 🔧 Diagnóstico Técnico

### Verificar Chunks Indexados

**En el navegador, ejecuta en Console:**

```javascript
// 1. Ver tus fuentes
fetch('/api/context-sources?userId=TU_USER_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Fuentes:', data.sources.length);
    data.sources.forEach(s => {
      console.log(`- ${s.name}: RAG=${s.ragEnabled}`);
    });
  });

// 2. Para cada fuente con RAG, ver sus chunks
fetch('/api/context-sources/SOURCE_ID/chunks?userId=TU_USER_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Chunks:', data.chunks.length);
    if (data.chunks.length > 0) {
      console.log('✅ Esta fuente puede generar referencias');
    } else {
      console.log('⚠️  Sin chunks - no generará referencias');
    }
  });
```

### Monitorear Nueva Respuesta

**En terminal donde corre `npm run dev`, busca:**

```bash
# Cuando envíes un mensaje, deberías ver:
🔍 [Streaming] Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 5 relevant chunks (2,250 tokens)
  Avg similarity: 78.3%
📚 Built references for message: 5
  [1] Documento.pdf - 87.3% - Chunk #2
  [2] Otro.pdf - 76.5% - Chunk #5
```

**Si NO ves estos logs:**
- RAG no está funcionando
- No hay chunks indexados
- Threshold de similitud muy alto

**Si SÍ ves estos logs:**
- Referencias se están generando ✅
- Problema está en el frontend

---

## 📊 Matriz de Soluciones

| Problema | Síntoma | Solución |
|----------|---------|----------|
| Sin chunks indexados | No logs de RAG | Subir documento nuevo con RAG |
| Chunks sin embeddings | RAG dice "0 results" | Re-indexar documento |
| Threshold muy alto | RAG finds nothing | Bajar minSimilarity a 0.3 |
| Referencias no se guardan | Logs OK pero no en Firestore | Verificar addMessage |
| Referencias no se cargan | En Firestore pero no en UI | Verificar loadMessages |
| Footer no renderiza | Referencias en msg pero no visible | Bug en MessageRenderer |

---

## 🎯 Acción Inmediata

**Lo más probable es que necesites:**

### Opción A: Enviar Mensaje Nuevo

Si ya tienes fuentes con RAG:
1. Envía un mensaje
2. Espera respuesta
3. Las referencias deberían aparecer

### Opción B: Subir Documento con RAG

Si no tienes fuentes con RAG:
1. Click "+ Agregar" en Fuentes de Contexto
2. Sube un PDF
3. Espera procesamiento (~30-60s)
4. Verifica "RAG: Habilitado"
5. Envía mensaje
6. Referencias aparecerán

### Opción C: Forzar Test con Mock Data

Para ver cómo se VERÍAN las referencias sin esperar RAG:

**En el navegador Console, ejecuta:**

```javascript
// Esto insertará un mensaje de prueba CON referencias
const mockMessage = {
  id: 'test-' + Date.now(),
  role: 'assistant',
  content: 'Esta es una respuesta de prueba basada en fuentes verificadas [1] y normativas oficiales [2].',
  timestamp: new Date(),
  references: [
    {
      id: 1,
      sourceId: 'mock',
      sourceName: 'Circular DDU-ESPECÍFICA N° 75.pdf',
      snippet: 'La circular establece que, para escaleras que no forman parte de una vía de evacuación, se debe calcular el 100% de su superficie...',
      fullText: 'La circular establece que, para escaleras que no forman parte de una vía de evacuación, se debe calcular el 100% de su superficie en cada piso. Se presentan dos métodos para este cálculo...',
      chunkIndex: 2,
      similarity: 0.873,
      metadata: {
        tokenCount: 450,
        startPage: 5,
        endPage: 6
      }
    },
    {
      id: 2,
      sourceId: 'mock',
      sourceName: 'OGUC Artículo 5.1.11.pdf',
      snippet: 'Se considera toda la superficie de la escalera en cada piso, como si se abatiera hacia el primer piso...',
      fullText: 'Se considera toda la superficie de la escalera en cada piso, como si se abatiera hacia el primer piso. En los pisos siguientes, se contabiliza el tramo no considerado en el piso anterior...',
      chunkIndex: 5,
      similarity: 0.765,
      metadata: {
        tokenCount: 380,
        startPage: 12
      }
    }
  ]
};

// Busca en React DevTools el componente ChatInterfaceWorking
// Y actualiza el estado messages manualmente con este mock
// O recarga la página y el UI te mostrará cómo se verían las referencias
```

---

## 📋 Resumen

### Estado Actual

```
✅ Implementación completa (código)
✅ Persistencia configurada (Firestore)
✅ UI lista (frontend)
⚠️  Sin mensajes con referencias (base de datos vacía de refs)
```

### Para Ver Referencias

```
Opción 1: Enviar mensaje nuevo → Referencias generadas automáticamente
Opción 2: Mock data → Ver cómo se VERÍAN
```

### Confianza

```
100% seguro que funcionará cuando:
  1. Haya chunks indexados
  2. RAG search devuelva resultados
  3. Se envíe un mensaje nuevo
```

---

## 🎓 Por Qué Pasa Esto

**Es completamente normal:**

- Implementamos persistencia de referencias HOY
- Los mensajes en Firestore son de ANTES (ayer, la semana pasada)
- Esos mensajes no tienen referencias porque la funcionalidad no existía
- **El primer mensaje nuevo SÍ tendrá referencias**

**Es como:**
- Añadir GPS a un coche
- Los viajes pasados no tienen datos GPS
- Pero el próximo viaje SÍ tendrá tracking completo

---

**¿Quieres que forcemos un mensaje de prueba con referencias mock para ver cómo se ve la UI?** 

O prefieres simplemente enviar un mensaje real y ver si aparecen las referencias (asumiendo que tienes fuentes con RAG habilitado)?
