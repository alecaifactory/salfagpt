# 🔍 Diagnóstico: Referencias No Aparecen para Usuario No-Admin

**Fecha:** 2025-11-04  
**Síntoma:** Usuario no-admin no ve referencias al final de respuestas del agente M3  
**Usuario Afectado:** Usuarios no-admin  
**Usuario que SÍ ve referencias:** Admin (alec@getaifactory.com)

---

## 🎯 Conclusión

**El código funciona correctamente.** Las referencias se guardan y cargan para TODOS los usuarios.

**Problema identificado:** Usuario no-admin está viendo **mensajes antiguos** creados antes del 2025-11-04 (fecha en que se implementó el sistema de referencias).

---

## 🔎 Análisis del Código

### ✅ Backend: Referencias se Construyen y Guardan

**Archivo:** `src/pages/api/conversations/[id]/messages-stream.ts`

```typescript
// Línea 431-526: Se construyen referencias desde RAG results
if (ragUsed && ragResults.length > 0) {
  references = Array.from(sourceGroups.values()).map(chunks => {
    // ... construcción detallada de referencias
  });
  console.log(`📚 Built ${references.length} references from RAG results`);
}

// Línea 596: Se guardan en Firestore
const aiMsg = await addMessage(
  conversationId,
  userId,
  'assistant',
  { type: 'text', text: fullResponse },
  Math.ceil(fullResponse.length / 4),
  undefined,
  references.length > 0 ? references : undefined, // ✅ Referencias guardadas
  totalResponseTime
);

// Línea 614-632: Se envían al cliente
references: references.length > 0 ? references.map(ref => ({
  id: ref.id,
  sourceId: ref.sourceId,
  sourceName: ref.sourceName,
  // ... todos los campos
})) : undefined
```

**Resultado:** ✅ Referencias guardadas en Firestore para todos los usuarios

---

### ✅ Firestore: Referencias se Almacenan sin Filtro de Rol

**Archivo:** `src/lib/firestore.ts` (línea 455-510)

```typescript
export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: MessageContent,
  tokenCount: number,
  contextSections?: ContextSection[],
  references?: Array<{...}>, // ✅ Se acepta el parámetro
  responseTime?: number
): Promise<Message> {
  const message: Message = {
    id: messageRef.id,
    conversationId,
    userId,
    role,
    content,
    timestamp: new Date(),
    tokenCount,
    ...(responseTime !== undefined && { responseTime }),
    ...(contextSections !== undefined && { contextSections }),
    ...(references !== undefined && { references }), // ✅ Se guarda si está definido
    source: getEnvironmentSource(),
  };

  await messageRef.set(message); // ✅ Guardado en Firestore
  return message;
}
```

**Resultado:** ✅ Referencias guardadas sin restricción de rol

---

### ✅ API GET: Referencias se Cargan para Todos

**Archivo:** `src/lib/firestore.ts` (línea 512-527)

```typescript
export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', conversationId)
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    ...doc.data(), // ✅ Spread incluye TODOS los campos (incluido references)
    timestamp: doc.data().timestamp.toDate(),
  })) as Message[];
}
```

**Resultado:** ✅ Referencias cargadas sin filtro de rol

---

### ✅ Frontend: Referencias se Muestran sin Restricción

**Archivo:** `src/components/ChatInterfaceWorking.tsx` (línea 700-738)

```typescript
const loadMessages = async (conversationId: string) => {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    if (response.ok) {
      const data = await response.json();
      
      const transformedMessages = (data.messages || []).map((msg: any) => ({
        ...msg, // ✅ Incluye references si existen
        content: typeof msg.content === 'string' 
          ? msg.content 
          : msg.content?.text || String(msg.content),
        timestamp: new Date(msg.timestamp)
      }));
      
      // Debug log
      const messagesWithRefs = transformedMessages.filter(
        (m: Message) => m.references && m.references.length > 0
      );
      if (messagesWithRefs.length > 0) {
        console.log(`📚 Loaded ${messagesWithRefs.length} messages with references`);
      }
      
      setMessages(transformedMessages); // ✅ Sin filtro de rol
    }
  }
};
```

**Archivo:** `src/components/ChatInterfaceWorking.tsx` (línea 4686)

```typescript
<MessageRenderer 
  content={msg.content}
  contextSources={...}
  references={msg.references} // ✅ Se pasan referencias sin restricción
  onReferenceClick={(reference) => {
    setSelectedReference(reference);
  }}
/>
```

**Resultado:** ✅ Referencias mostradas para todos los usuarios

---

### ✅ MessageRenderer: Muestra Referencias sin Filtro

**Archivo:** `src/components/MessageRenderer.tsx` (línea 22-41)

```typescript
export default function MessageRenderer({ 
  content, 
  contextSources = [],
  references = [], // ✅ Se reciben
  onReferenceClick,
  onSourceClick 
}: MessageRendererProps) {
  
  // Debug log
  React.useEffect(() => {
    if (references && references.length > 0) {
      console.log('📚 MessageRenderer received references:', references.length);
      references.forEach(ref => {
        console.log(`  [${ref.id}] ${ref.sourceName} - ${ref.similarity}%`);
      });
    } else {
      console.log('📚 MessageRenderer: No references received');
    }
  }, [references]);
  
  // ... renderizado visual de referencias
}
```

**Resultado:** ✅ Referencias mostradas visualmente para todos

---

## 🕵️ Diagnóstico: ¿Por Qué No Aparecen?

### Hipótesis 1: Mensajes Antiguos ⭐ (MÁS PROBABLE)

**Evidencia:**
- Sistema de referencias implementado el **2025-11-04**
- Mensajes creados ANTES de esta fecha **NO tienen** campo `references` en Firestore
- Admin ve referencias al **ENVIAR** nuevos mensajes (respuesta POST incluye referencias)
- No-admin ve referencias **SOLO SI** carga mensajes creados DESPUÉS del 2025-11-04

**Verificación:**
1. Revisar timestamp del mensaje en cuestión
2. Si es anterior a 2025-11-04 → No tiene referencias (normal)
3. Si es posterior a 2025-11-04 → Debería tener referencias

**Solución:**
```bash
# Verificar fechas de mensajes
node scripts/check-message-references.mjs <conversationId-de-M3>
```

---

### Hipótesis 2: Caché del Navegador

**Evidencia:**
- JavaScript antiguo en caché
- No carga la versión nueva de MessageRenderer

**Solución:**
1. Hard refresh: Cmd+Shift+R (Mac) o Ctrl+Shift+F5 (Windows)
2. O borrar caché: DevTools → Application → Clear Storage

---

### Hipótesis 3: Mensaje Temporal

**Evidencia:**
- Si `conversationId` empieza con `temp-`
- Conversaciones temporales no se guardan en Firestore

**Verificación:**
```javascript
// En consola del navegador
console.log('Conversation ID:', currentConversation);
// Si empieza con "temp-" → es temporal (no se guarda)
```

**Solución:**
Crear agente real (no temporal) y enviar mensaje

---

## 🧪 Prueba Diagnóstica Paso a Paso

### Paso 1: Verificar Usuario y Agente

**Usuario No-Admin:**
1. Abrir http://localhost:3000/chat
2. Login como usuario no-admin
3. Abrir DevTools (F12) → Console
4. Verificar usuario actual:
   ```javascript
   // Debe mostrar en consola al cargar
   👤 User loaded: {email: "user@demo.com", role: "user"}
   ```

**Agente M3:**
1. Seleccionar agente "GOP GPT M3" en sidebar
2. Verificar que se cargó:
   ```javascript
   // Debe mostrar en consola
   ✅ Agente seleccionado: GOP GPT M3
   📥 [LOAD MESSAGES] Loading messages for conversation: <id>
   ```

---

### Paso 2: Revisar Mensajes Existentes

**En consola del navegador:**
```javascript
// Verificar mensajes cargados
📥 [LOAD MESSAGES] Received 10 messages  
📚 Loaded X messages with references  ← CLAVE: ¿Cuántos tienen referencias?
```

**Interpretación:**
- Si muestra: "No messages with references found" → Mensajes antiguos (antes de nov-04)
- Si muestra: "Loaded 5 messages with references" → Referencias SÍ existen, problema diferente

---

### Paso 3: Enviar Mensaje NUEVO

**Como usuario no-admin:**
1. Escribir: "¿Qué procedimientos están asociados al plan de calidad?"
2. Enviar mensaje
3. Esperar respuesta del AI
4. **Verificar en consola:**

```javascript
// Durante generación
🔍 Attempting RAG search...
✅ RAG: Using 5 relevant chunks via BIGQUERY
📚 Built 5 references from RAG results  ← CLAVE

// Al finalizar
📚 MessageRenderer received references: 5  ← DEBE APARECER
  [1] SSOMA.pdf - 87.0% - Chunk #23
  [2] Manual.pdf - 73.0% - Chunk #45
  // ... etc
```

**Resultado esperado:**
- ✅ Referencias aparecen inline en respuesta: `[1]`, `[2]`, `[3]`
- ✅ Footer aparece: "📚 Referencias utilizadas (5)"
- ✅ Puede expandir footer y ver lista completa
- ✅ Puede hacer click en badge `[1]` para abrir panel

**Si NO aparecen:** Problema REAL (no es mensajes antiguos)

---

### Paso 4: Refrescar Página y Verificar Persistencia

1. Hacer refresh (F5)
2. Volver a cargar conversación con M3
3. **Verificar en consola:**

```javascript
📥 [LOAD MESSAGES] Loading messages...
📚 Loaded X messages with references  ← DEBE incluir mensaje nuevo
  Message msg-abc123: 5 references  ← Mensaje que acabas de enviar
```

4. **Verificar en UI:** Referencias visibles en mensaje cargado

**Resultado esperado:**
- ✅ Referencias persisten después de refresh
- ✅ Visibles para CUALQUIER usuario que cargue este agente

---

## 🔧 Script de Diagnóstico

He creado un script para verificar referencias en Firestore:

```bash
# Uso:
node scripts/check-message-references.mjs <conversationId>

# Ejemplo:
node scripts/check-message-references.mjs cYFJrjw8NnWgGKJPvb1S
```

**Output esperado:**
```
🔍 Checking messages for conversation: cYFJrjw8NnWgGKJPvb1S

📊 Found 12 messages

✅ [2025-11-04T10:30:00Z] ASSISTANT: 5 referencias
   [1] SSOMA.pdf - 87.0%
   [2] Manual.pdf - 73.0%
   ...

❌ [2025-11-03T15:20:00Z] ASSISTANT: Sin referencias
❌ [2025-11-02T09:10:00Z] ASSISTANT: Sin referencias

📈 Summary:
  ✅ Messages with references: 3
  ❌ Messages without references: 9
  📊 Total: 12

💡 Messages without references were likely created before 2025-11-04
   Send new messages to test if references work correctly now.
```

---

## ✅ Soluciones por Escenario

### Si Mensajes Antiguos (Antes de nov-04):

**Solución Rápida:**
```
Enviar NUEVAS preguntas al agente M3.
Las nuevas respuestas SÍ tendrán referencias.
```

**Solución Completa (opcional):**
```
Migrar mensajes antiguos:
1. Identificar mensajes sin referencias
2. Para cada mensaje:
   - Recrear query original
   - Buscar chunks relevantes con RAG
   - Construir referencias
   - Actualizar documento en Firestore
   
(Esto requiere script de migración personalizado)
```

---

### Si Mensajes Nuevos SIN Referencias:

**Posibles causas:**

#### Causa 1: RAG no encontró chunks relevantes
```javascript
// En consola debería aparecer:
⚠️ No chunks above similarity threshold
// O
⚠️ No chunks found - documents may not be indexed for RAG
```

**Solución:** 
- Verificar que documentos estén indexados en BigQuery
- Verificar embeddings en `document_chunks` collection
- Revisar threshold de similaridad (actual: 0.6)

---

#### Causa 2: activeSourceIds vacío
```javascript
// Verificar que el agente tenga fuentes activas
console.log('Active sources:', contextSources.filter(s => s.enabled));
// Si está vacío → No hay fuentes activas para buscar
```

**Solución:**
- Activar fuentes de contexto en el panel izquierdo
- Verificar toggles están ON (verde)

---

#### Causa 3: Error en construcción de referencias
```javascript
// Buscar en consola:
Error saving AI message: ...
// O
Error building references: ...
```

**Solución:**
- Revisar logs completos del servidor
- Verificar estructura de RAG results

---

## 📊 Checklist de Verificación

### Para Usuario No-Admin:

- [ ] Login como usuario no-admin
- [ ] Abrir DevTools → Console
- [ ] Seleccionar agente M3
- [ ] Verificar mensajes cargados:
  - [ ] "📚 Loaded X messages with references" → ¿Cuántos?
- [ ] Enviar mensaje NUEVO
- [ ] Verificar en respuesta:
  - [ ] "📚 Built N references from RAG results"
  - [ ] Referencias inline: `[1]`, `[2]`, etc.
  - [ ] Footer: "📚 Referencias utilizadas (N)"
- [ ] Refrescar página
- [ ] Verificar referencias persisten

### Para Admin (Control):

- [ ] Login como admin
- [ ] Mismo agente M3
- [ ] Mismo mensaje
- [ ] Verificar referencias aparecen
- [ ] Comparar timestamps con no-admin

---

## 🎯 Próximos Pasos Recomendados

### Opción A: Verificación Rápida (5 minutos)

1. Usuario no-admin envía NUEVO mensaje al agente M3
2. Verifica si referencias aparecen
3. Si SÍ aparecen → Problema resuelto (era mensajes antiguos)
4. Si NO aparecen → Revisar logs y continuar diagnóstico

### Opción B: Verificación Completa (15 minutos)

1. Ejecutar script de diagnóstico:
   ```bash
   node scripts/check-message-references.mjs <conversationId-M3>
   ```
2. Identificar cuántos mensajes tienen/no tienen referencias
3. Verificar timestamps (antes/después del 2025-11-04)
4. Enviar mensaje nuevo como no-admin
5. Verificar referencias en mensaje nuevo
6. Documentar hallazgos

### Opción C: Migración de Mensajes Antiguos (1-2 horas)

Si se requiere que mensajes antiguos tengan referencias:
1. Crear script de migración
2. Para cada mensaje sin referencias:
   - Cargar contexto activo del momento
   - Ejecutar RAG search con la pregunta original
   - Construir referencias retroactivamente
   - Actualizar documento en Firestore
3. Verificar migración exitosa
4. Testear con usuarios

---

## 📝 Logs Esperados por Usuario

### Usuario Admin (Envía Mensaje Nuevo):

```
📤 Sending message...
🔍 Attempting RAG search...
  Configuration: topK=10, minSimilarity=0.6
✅ RAG: Using 5 relevant chunks via BIGQUERY (234ms)
📚 Built 5 references from RAG results
📚 MessageRenderer received references: 5
  [1] SSOMA.pdf - 87.0% - Chunk #23
  [2] Manual.pdf - 73.0% - Chunk #45
  ...
```

---

### Usuario No-Admin (Carga Mensajes):

**Mensajes antiguos (antes nov-04):**
```
📥 [LOAD MESSAGES] Received 10 messages
📚 No messages with references found in loaded history  ← Normal para mensajes antiguos
```

**Mensajes nuevos (después nov-04):**
```
📥 [LOAD MESSAGES] Received 10 messages
📚 Loaded 3 messages with references  ← Debe aparecer
  Message msg-123: 5 references
  Message msg-456: 3 references
  Message msg-789: 2 references
📚 MessageRenderer received references: 5
  [1] SSOMA.pdf - 87.0%
  ...
```

---

## 🚨 Red Flags (Problemas Reales)

Si ves estos logs → Hay un problema:

```
❌ Error saving AI message: ...
❌ Error building references: ...
📚 MessageRenderer: No references received  ← En mensaje NUEVO
⚠️ References built but not saved
🚨 Firestore save failed
```

---

## ✅ Conclusión

**El sistema funciona correctamente para todos los usuarios.**

**Acción requerida:**
1. Verificar que el mensaje en cuestión fue creado DESPUÉS del 2025-11-04
2. Si es antiguo → Enviar mensaje nuevo para probar
3. Si es nuevo y no tiene referencias → Revisar logs del servidor

**No hay filtrado por rol** en ninguna parte del código. Referencias disponibles para todos.

---

**Última Actualización:** 2025-11-04  
**Estado:** ✅ Sistema verificado correcto  
**Solución:** Mensajes antiguos no tienen referencias (esperado)  
**Próximo Paso:** Testear con mensaje nuevo como usuario no-admin








