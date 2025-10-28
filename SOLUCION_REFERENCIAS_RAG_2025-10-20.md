# 🔧 Solución: Referencias RAG Correctas con % Similitud - 2025-10-20

## 🎯 Problemas Identificados

### Problema 1: AI No Cita Chunks Específicos
**Issue:** El AI recibe chunks RAG pero no sabe que debe citarlos con sus índices.

**Root Cause:** El system prompt no indica al AI qué chunks específicos recibió ni cómo citarlos.
Chunk #1
371 tokens
Aquí está el texto completo del documento, incluyendo su estructura y la tabla en formato Markdown: --- DDU 32 **CIRCULAR ORD. N° 0177** **MAT.:** Ley N°19.537 Copropiedad Inmobiliaria. **COPROPIEDAD INMOBILIARIA; SUBDIVISION TERRENO.** SANTIAGO, 6 de Marzo de 1998 **DE :** JEFE DIVISION DE DESARROLLO URBANO. **A :** SEGUN DISTRIBUCION. 1. La División de Desarrollo Urbano en cumplimiento al artículo 4º de la Ley General de Urbanismo y Construcciones ha estimado conveniente transcribir aquellas partes del informe en derecho emitido por la División Jurídica de este Ministerio, relativo a la posibilidad de subdividir inmuebles acogido a la Ley Nº6.071 sobre Propiedad Horizontal. 2. Con fecha 16 de Diciembre de 1997 se publicó en el Diario Oficial, la ley N°19.537, sobre Copropiedad Inmobiliaria, que regula un régimen especial de propiedad inmobiliaria, con el objeto de establecer condominios integrados por inmuebles divididos en unidades sobre las cuales se pueda constituir dominio exclusivo a favor de distintos propietarios, manteniendo uno o más bienes en el dominio común de todos ellos. 3. La ley Nº19.537 en el artículo 48 deroga expresamente la ley Nº6.071, cuyo texto definitivo se había fijado en el Capítulo V del decreto supremo N°880, del Ministerio de Obras Públicas, de 1963, subsistente hasta esa fecha por expresa disposición del inciso segundo del artículo 169 del decreto con fuerza de ley N°458, de 1975, Ley General de Urbanismo y Construcciones.

Chunk #2
465 tokens
4. Conforme al artículo 49 de la ley N°19.537, ella se aplica a las comunidades de copropietarios acogidos a la ley Nº6.071, de Propiedad Horizontal, con anterioridad a su vigencia, excepto en lo relativo al cambio de destino de las unidades, a la proporción o porcentaje que a cada propietario corresponde sobre los bienes comunes y en el pago de los gastos comunes y a derechos de uso y goce exclusivo sobre bienes de dominio común legalmente constituidos, sin perjuicio que por acuerdo unánime los copropietarios resuelvan que también estas materias quedarán regidas por la nueva legislación. 5. Lo expuesto hasta ahora lleva a una primera conclusión cual es que el caso en consulta debe resolverse teniendo presente la Ley Nº19.537, desde el momento que la ley N°6.071 hoy en día se encuentra derogada y la materia en análisis no dice relación con las situaciones de excepción que se han consignado, como quiera que en la especie se trata de subdividir el predio en que se encuentra construido el condominio de manera de segregar del terreno de mayor extensión un lote en que se encontraba edificada una construcción desde el momento que se solicitó el permiso municipal para edificar el condominio, oportunidad en que se planteó mantenerla en el predio y destinarla a casa-club del mismo. 6. La ley N°19.537 no contiene entre sus disposiciones una norma que prohiba subdividir el terreno en que se encuentra construido un condominio, como sí la contenía la ley N°6.071 cuyo artículo 60 inciso primero disponía expresamente que mientras existiera el edificio, ninguno de los propietarios podía pedir la división del suelo y de los demás bienes comunes, lo que lleva a una segunda conclusión cual es que no existiría impedimento por esta causa para que los copropietarios pidieran a la Dirección de Obras Municipales permiso para subdividir el terreno.

Chunk #3
429 tokens
7. La conclusión anterior no se ve alterada por lo dispuesto en el inciso segundo del artículo 14 de la ley Nº19.537, en orden a que los bienes comunes a que se refieren la letras a), b) y c) del número 3 del artículo 2º de dicha ley, entre ellos los terrenos de dominio común, no pueden dejar de ser comunes mientras mantengan las características que determina su clasificación en estas categorías, toda vez que la clasificación del terreno como bien común en el caso en informe tuvo su origen en la aplicación de la ley Nº6.071 que no categorizaba los bienes de dominio común como lo hace la actual ley N°19.537 de manera que el terreno era siempre un bien común cuya división, como se ha expresado, estaba siempre prohibida por la ley mientras existiera la edificación acogida a la copropiedad. 8. La posibilidad de subdividir el terreno en que se encuentra emplazado el condominio en informe se ve confirmada por otra parte si se considera que tal subdivisión tendrá por objeto enajenar el terreno que se segregará del resto del terreno común, circunstancia que hace aplicable a su respecto lo dispuesto en el artículo 14 inciso tercero de la ley Nº19.537 que señala que pueden enajenarse, previo acuerdo de la asamblea de copropietarios, los bienes de dominio común mencionados en las letra a), b) y c), entre ellos el terreno común, cuando por circunstancias sobrevivientes dejen de tener las características señaladas en dichas letras, esto es, dejen de ser necesarios para la existencia, seguridad y conservación del condominio, no sean de aquellos que permitan a todos y a cada uno de los copropietarios el uso y goce de las unidades de su dominio exclusivo y no colinden con un unidad del condominio.".

Chunk #4
512 tokens
9. A mayor abundamiento debe tenerse presente el artículo 17 de la ley N°19.537 que prescribe que todo lo concerniente a la administración del condominio debe ser resuelto por los copropietarios reunidos en asamblea y agrega en el inciso quinto número 4 que debe tratarse en sesiones extraordinarias de la asamblea la enajenación de bienes de dominio común, con lo que reconoce una vez más que los bienes de dominio común pueden ser objeto de enajenación. 10. Finalmente debe también traerse a colación el número 6 del inciso quinto del artículo 17 de la ley N°19.537 que reconoce que puede solicitarse a la Dirección de Obras Municipales que modifique la declaración que acogió el condominio al régimen de copropiedad inmobiliaria, lo que procedería en el caso en informe, debiendo tratarse la materia en sesión extraordinaria, conforme a lo prescrito, en el artículo 19 inciso tercero de la ley N°19.537, esto es, con la asistencia de los copropietarios que representen, a lo menos, el 80% de los derechos en el condominio y adoptarse el acuerdo respectivo con el voto favorable de los asistentes que representen, a lo menos, el 75% de los derechos en el condominio. 11. En conclusión, y de acuerdo a los preceptos legales que se citan como fundamento, en opinión de esta División sería legalmente procedente la subdivisión del terreno en que se encuentra emplazado el condominio a que alude la consulta, trámite que, luego de adoptarse el acuerdo respectivo con los quórum que señala la ley, conforme a lo prescrito en el artículo 38 de la ley N°19.537 en la práctica debe materializarse requiriendo de la Dirección de Obras Municipales que modifique la declaratoria que acogió el condominio al régimen de copropiedad, de manera de proceder luego a segregar el paño de terreno que interesa del resto del condominio, terreno respecto del cual, conforme a lo prescrito en el artículo 38 inciso segundo de la misma ley se formará una comunidad entre los copropietarios que se regirá por las normas del derecho común y hará factible su enajenación.”.

Chunk #5
241 tokens
Saluda atentamente a Ud., **JAIME SILVA ARANCIBIA** Jefe División Desarrollo Urbano **CIRCULARES VIGENTES DE ESTA SERIE** | 1 | 3 | 4 | 6 | 7 | 9 | 10 | 12 | 14 | 15 | | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | | 26 | 27 | 28 | 29 | 30 | 31 | | | | | ESE/MBH/cga. **DISTRIBUCION** 1. Sr. Ministro de Vivienda y
**Screenshot Evidence:**
- Se ve "100.0% similar" en lugar del % real
- Referencias show "Chunk #0 • 2,023 tokens" pero debería mostrar el chunk real usado

### Problema 2: Referencias No Clickeables
**Issue:** Los [1], [2], [3] aparecen como texto plano, no como badges azules clickeables.

**Root Cause:** El AI no está incluyendo los números de referencia inline en su respuesta.

### Problema 3: Inconsistencia en Cantidad de Referencias
**Issue:** Se ven múltiples [índices] en el texto pero solo 1 referencia aparece debajo.

**Root Cause:** Solo se muestra la primera referencia, las demás no se procesan.

### Problema 4: Modo Full-Text Cuando Debería Ser RAG
**Issue:** El log muestra "Full-Text (Completo)" cuando RAG está habilitado y chunks existen.

**Root Cause:** La detección de modo en el log depende de chunkIndex === -1, pero esto no refleja si RAG fue realmente usado.

---

## ✅ Solución Completa

### Cambio 1: Mejorar System Prompt para RAG

**Archivo:** `src/lib/gemini.ts` - función `streamAIResponse`

**Cambio:**
Cuando se envían chunks RAG al AI, el system prompt debe:
1. Indicar que se enviaron fragmentos específicos (no el documento completo)
2. Pedir al AI que cite cada fragmento por su número
3. Explicar el formato esperado de las citas

```typescript
// ANTES (líneas 386-399):
if (userContext) {
  fullUserMessage = `Context:\n${userContext}\n\nUser Message:\n${userMessage}`;
  
  enhancedSystemInstruction = `${systemInstruction}

IMPORTANTE: Cuando uses información de los documentos de contexto:
- Incluye referencias numeradas inline usando el formato [1], [2], etc.
- Coloca la referencia INMEDIATAMENTE después de la información que uses
- Sé específico: cada dato del documento debe tener su referencia

Ejemplo:
"Las construcciones en subterráneo deben cumplir con distanciamientos[1]. La DDU 189 establece zonas inexcavables[2]."`;
}

// DESPUÉS (NUEVO):
if (userContext) {
  // Detectar si el contexto contiene chunks RAG numerados
  const isRAGContext = userContext.includes('[Fragmento ') || userContext.includes('Relevancia:');
  
  if (isRAGContext) {
    // Modo RAG: Extraer números de fragmentos
    const fragmentMatches = userContext.match(/\[Fragmento (\d+),/g) || [];
    const fragmentNumbers = fragmentMatches.map(m => {
      const match = m.match(/\[Fragmento (\d+),/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    fullUserMessage = `FRAGMENTOS RELEVANTES DEL CONTEXTO:
${userContext}

PREGUNTA DEL USUARIO:
${userMessage}`;

    enhancedSystemInstruction = `${systemInstruction}

MODO RAG - INSTRUCCIONES CRÍTICAS:
Te he proporcionado ${fragmentNumbers.length} fragmentos específicos del documento, numerados como: ${fragmentNumbers.join(', ')}.

DEBES:
1. Citar cada fragmento que uses con su número entre corchetes [N]
2. Colocar la cita INMEDIATAMENTE después del dato que proviene de ese fragmento
3. Si un dato viene de múltiples fragmentos, cita todos: [1][2]
4. NO inventes información que no esté en los fragmentos
5. Si la respuesta requiere información que no está en los fragmentos, di "No tengo información sobre..."

FORMATO REQUERIDO:
"La Ley N°19.537 derogó expresamente la Ley N°6.071[1]. Esta ley se aplica a comunidades de copropietarios que estaban acogidas a la ley anterior[2]. Las construcciones en subterráneo deben cumplir con distanciamientos[3]."

Fragmentos disponibles: ${fragmentNumbers.join(', ')}
SIEMPRE cita el fragmento cuando uses su información.`;
  } else {
    // Modo Full-Text
    fullUserMessage = `Context:\n${userContext}\n\nUser Message:\n${userMessage}`;
    
    enhancedSystemInstruction = `${systemInstruction}

MODO FULL-TEXT:
Tienes acceso a los documentos completos. Usa la información necesaria para responder.
Incluye referencias al documento cuando sea útil: "Según [nombre del documento], ..."`;
  }
}
```

---

### Cambio 2: Pasar Información de Chunks al Frontend

**Archivo:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Cambio:** Al construir las referencias, incluir el chunk number real desde ragResults:

```typescript
// ANTES (líneas 251-268):
if (ragUsed && ragResults.length > 0) {
  references = ragResults.map((result, index) => ({
    id: index + 1,
    sourceId: result.sourceId,
    sourceName: result.sourceName,
    chunkIndex: result.chunkIndex,
    similarity: result.similarity,
    snippet: result.text.substring(0, 300),
    fullText: result.text,
    // ... metadata
  }));
}

// DESPUÉS (MEJORADO - agregar fragmentNumber):
if (ragUsed && ragResults.length > 0) {
  references = ragResults.map((result, index) => ({
    id: index + 1,
    sourceId: result.sourceId,
    sourceName: result.sourceName,
    chunkIndex: result.chunkIndex, // Original chunk index in document
    fragmentNumber: result.chunkIndex, // Same as chunkIndex for now
    similarity: result.similarity, // Real similarity score (0-1)
    snippet: result.text.substring(0, 300),
    fullText: result.text,
    metadata: {
      startChar: result.metadata.startChar,
      endChar: result.metadata.endChar,
      tokenCount: result.metadata.tokenCount,
      startPage: result.metadata.startPage,
      endPage: result.metadata.endPage,
      isRAGChunk: true, // NEW: Explicitly mark as RAG chunk
    }
  }));
  
  console.log('📚 Built RAG references:');
  references.forEach(ref => {
    console.log(`  [${ref.id}] Fragmento ${ref.chunkIndex} de ${ref.sourceName} - ${(ref.similarity * 100).toFixed(1)}% similar`);
  });
}
```

---

### Cambio 3: Enviar Mapping de Fragmentos al Cliente

**Archivo:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Nuevo:** Después de enviar los chunks seleccionados, enviar también un mapping de ID → Fragmento:

```typescript
// DESPUÉS de línea 188 (envío de chunks):
if (ragUsed && ragResults.length > 0) {
  const chunkData = `data: ${JSON.stringify({ 
    type: 'chunks',
    chunks: ragStats.sources.map((s: any) => ({
      sourceId: s.id,
      sourceName: s.name,
      chunkCount: s.chunkCount,
      tokens: s.tokens
    }))
  })}\n\n`;
  controller.enqueue(encoder.encode(chunkData));
  
  // NUEVO: Enviar mapping de referencias para que el frontend sepa qué esperar
  const fragmentMapping = ragResults.map((result, index) => ({
    refId: index + 1,
    fragmentNumber: result.chunkIndex,
    sourceName: result.sourceName,
    similarity: result.similarity,
  }));
  
  const mappingData = `data: ${JSON.stringify({ 
    type: 'fragmentMapping',
    mapping: fragmentMapping
  })}\n\n`;
  controller.enqueue(encoder.encode(mappingData));
}
```

---

### Cambio 4: Recibir y Almacenar Fragment Mapping en Frontend

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**Cambio:** En el streaming loop, capturar el fragmentMapping:

```typescript
// DENTRO del while loop de streaming (después de línea 1049):
else if (data.type === 'chunks') {
  // Store chunk information for later display
  console.log('📊 Chunks seleccionados:', data.chunks);
} 
// NUEVO:
else if (data.type === 'fragmentMapping') {
  // Store expected fragment citations
  console.log('🗺️ Fragment mapping received:', data.mapping);
  // data.mapping = [{ refId: 1, fragmentNumber: 3, sourceName: 'Cir32.pdf', similarity: 0.89 }, ...]
  
  // Store in a ref or state for validation later
  fragmentMappingRef.current = data.mapping;
}
else if (data.type === 'chunk') {
  // ... existing code
}
```

---

### Cambio 5: Validar Citas del AI vs Fragmentos Enviados

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**Nuevo:** Al terminar el streaming, validar que el AI citó los fragmentos correctos:

```typescript
else if (data.type === 'complete') {
  // ... código existente para marcar mensaje como completo
  
  // NUEVO: Validar citas si tenemos fragment mapping
  if (fragmentMappingRef.current && fragmentMappingRef.current.length > 0) {
    const expectedCitations = fragmentMappingRef.current.map((m: any) => `[${m.refId}]`);
    const foundCitations = [];
    
    for (const citation of expectedCitations) {
      if (accumulatedContent.includes(citation)) {
        foundCitations.push(citation);
      }
    }
    
    console.log('📋 Citation validation:');
    console.log(`  Expected: ${expectedCitations.join(', ')}`);
    console.log(`  Found: ${foundCitations.join(', ')}`);
    console.log(`  Coverage: ${foundCitations.length}/${expectedCitations.length} (${(foundCitations.length / expectedCitations.length * 100).toFixed(0)}%)`);
    
    if (foundCitations.length === 0) {
      console.warn('⚠️ AI did not include any references - this may indicate the prompt was not followed');
    }
  }
}
```

---

### Cambio 6: Mejorar Detección de Modo en Context Log

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**Cambio:** Al crear el context log, usar ragConfiguration.actuallyUsed para determinar el modo:

```typescript
// Línea ~1140 - al guardar context log:
contextSources: activeContextSources.map(source => ({
  name: source.name,
  tokens: source.ragEnabled && ragWasUsed 
    ? ragStatsFromCompletion?.sources?.find((s: any) => s.id === source.id)?.tokens || 2500
    : Math.ceil((source.extractedData?.length || 0) / 4),
  // NUEVO: Mode basado en si RAG fue realmente usado
  mode: ragWasUsed && source.ragEnabled ? 'rag' : 'full-text'
})),

// NUEVO: Agregar flag ragWasUsed del completion event
const ragWasUsed = data.ragConfiguration?.actuallyUsed || false;
const ragStatsFromCompletion = data.ragConfiguration?.stats;
```

---

## 🧪 Testing Plan

### Test 1: Verificar RAG Realmente Busca Chunks

**Pasos:**
1. Abrir agente con PDF indexado (Cir32.pdf con 5 chunks)
2. Hacer pregunta específica: "¿Qué dice sobre la Ley 19.537?"
3. Verificar en console backend:
   ```
   ✅ RAG: Using 3 relevant chunks (1,234 tokens)
     Avg similarity: 78.5%
   ```
4. Verificar NO aparezca:
   ```
   ⚠️ Falling back to full documents
   ```

**Expected:** Console muestra chunks seleccionados con % de similitud real

---

### Test 2: Verificar AI Cita Fragmentos

**Pasos:**
1. Leer la respuesta del AI
2. Buscar números entre corchetes: [1], [2], [3]
3. Verificar que son badges azules clickeables (no texto negro)

**Expected:**
- ✅ [1], [2], [3] son badges azules con hover effect
- ✅ Click abre ReferencePanel con chunk details
- ✅ % de similitud mostrado es el real (ej: 78.5%, no 100%)

---

### Test 3: Verificar Context Log Muestra Modo Correcto

**Pasos:**
1. Abrir "Desglose del Contexto"
2. Ver tabla de "Log de Contexto por Interacción"
3. Verificar columna "Modo"

**Expected:**
- ✅ Muestra "🔍 RAG" cuando RAG fue usado
- ✅ Muestra "5 chunks" debajo del badge
- ✅ NO muestra "📝 Full" cuando RAG está activo

---

### Test 4: Verificar Todas las Referencias Son Clickeables

**Pasos:**
1. Contar cuántos [N] aparecen en la respuesta del AI
2. Verificar que todos sean clickeables
3. Click en cada uno
4. Verificar abre ReferencePanel con info correcta

**Expected:**
- ✅ Cada [N] en texto → badge azul clickeable
- ✅ ReferencePanel muestra chunk específico
- ✅ % similitud es el real del RAG search

---

## 📋 Checklist de Implementación

### Backend Changes
- [ ] `src/lib/gemini.ts` - Mejorar system prompt para RAG mode
- [ ] `src/lib/gemini.ts` - Detectar si context es RAG y ajustar instrucciones
- [ ] `src/pages/api/conversations/[id]/messages-stream.ts` - Enviar fragmentMapping al frontend
- [ ] `src/pages/api/conversations/[id]/messages-stream.ts` - Marcar referencias con isRAGChunk: true

### Frontend Changes
- [ ] `src/components/ChatInterfaceWorking.tsx` - Agregar fragmentMappingRef
- [ ] `src/components/ChatInterfaceWorking.tsx` - Capturar fragmentMapping event
- [ ] `src/components/ChatInterfaceWorking.tsx` - Validar citas del AI
- [ ] `src/components/ChatInterfaceWorking.tsx` - Usar ragConfiguration.actuallyUsed para mode en logs

### Component Updates
- [ ] `src/components/MessageRenderer.tsx` - Verificar procesa múltiples referencias
- [ ] `src/components/ReferencePanel.tsx` - Verificar muestra % similitud correcto

### Testing
- [ ] Test 1: RAG realmente busca chunks
- [ ] Test 2: AI cita fragmentos inline
- [ ] Test 3: Context log muestra modo correcto
- [ ] Test 4: Todas las referencias son clickeables

---

## 🎯 Resultado Esperado

### Antes (Actual - INCORRECTO):
```
Respuesta del AI:
"La Ley N°19.537 derogó la Ley N°6.071. Esta ley se aplica a comunidades..."

Referencias debajo:
[1] Cir32.pdf - 100.0% similar - Chunk #0 - 2,023 tokens
    Full-Text (Completo)
```

### Después (Esperado - CORRECTO):
```
Respuesta del AI:
"La Ley N°19.537 derogó expresamente la Ley N°6.071[1]. Esta ley se aplica a las 
comunidades de copropietarios que estaban acogidas a la ley anterior[2]. Las construcciones 
en subterráneo deben cumplir con distanciamientos[3]."

Referencias debajo (todas clickeables):
[1] Cir32.pdf - 89.2% similar - Fragmento 3 - 512 tokens
    🔍 RAG Chunk
    
[2] Cir32.pdf - 76.5% similar - Fragmento 1 - 487 tokens
    🔍 RAG Chunk
    
[3] Cir32.pdf - 68.3% similar - Fragmento 4 - 523 tokens
    🔍 RAG Chunk
```

**Context Log:**
```
Modo: 🔍 RAG
      3 chunks
```

---

## 🔑 Key Insights

### Insight 1: El AI Necesita Saber Qué Fragmentos Recibió
Sin esta información, el AI no puede citar correctamente.

**Solución:** System prompt explícito que lista los números de fragmento disponibles.

### Insight 2: Referencias Deben Crearse del RAG Output Real
No podemos crear referencias genéricas después. Deben reflejar el RAG search actual.

**Solución:** Usar ragResults directamente, con chunkIndex y similarity reales.

### Insight 3: Frontend Necesita Validar Citas
Para debugging y QA, debemos verificar que el AI siguió las instrucciones.

**Solución:** Fragment mapping permite comparar lo enviado vs lo citado.

---

## 📚 Referencias

- `RAG_FLUJO_COMPLETO_2025-10-20.md` - Flujo general de RAG
- `SOLUCION_COMPLETA_REFERENCIAS_2025-10-20.md` - Referencias clickeables
- `src/lib/rag-search.ts` - Vector search implementation
- `src/lib/embeddings.ts` - Embedding generation

---

**Status:** 📝 Documentado - Listo para implementar
**Next Steps:** Implementar cambios 1-6 y ejecutar tests 1-4

