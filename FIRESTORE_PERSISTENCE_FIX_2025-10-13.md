# Firestore Persistence Fix - 2025-10-13

## Problema Reportado

Al refrescar la página `/chat`, todo el historial de conversaciones y mensajes desaparecía, como si no se hubiera guardado nada.

## Diagnóstico

1. **Verificación de datos en Firestore**: ✅
   - Las conversaciones SÍ se estaban guardando correctamente
   - Los mensajes SÍ se estaban guardando correctamente
   - Todos con `source: localhost` como esperado

2. **Verificación de endpoints**: ❌
   - El endpoint `/api/conversations` devolvía `"Firestore not configured"`
   - El endpoint estaba capturando una excepción de Firestore

3. **Causa raíz**: **Faltaban índices compuestos de Firestore**
   - La query en `getConversations()` usa: `.where('userId', '==', userId).orderBy('lastMessageAt', 'desc')`
   - Esta query requiere un índice compuesto: `userId ASC + lastMessageAt DESC`
   - El índice no existía, causando que la query fallara

## Solución Implementada

### 1. Creación de índices compuestos

```bash
# Índice para conversations
gcloud firestore indexes composite create \
  --project=gen-lang-client-0986191192 \
  --database='(default)' \
  --collection-group=conversations \
  --field-config field-path=userId,order=ascending \
  --field-config field-path=lastMessageAt,order=descending

# Índice para messages (ya existía)
# conversationId ASC + timestamp ASC
```

### 2. Verificación de índices

```bash
gcloud firestore indexes composite list --project=gen-lang-client-0986191192
```

**Resultado**:
- ✅ `conversations`: `userId` (ASC) + `lastMessageAt` (DESC) - **READY**
- ✅ `messages`: `conversationId` (ASC) + `timestamp` (ASC) - **READY**

### 3. Pruebas de endpoints

```bash
# Cargar conversaciones
curl "http://localhost:3000/api/conversations?userId=114671162830729001607"
# Resultado: ✅ 47 conversaciones de hoy, 16 de ayer

# Cargar mensajes
curl "http://localhost:3000/api/conversations/cKXOtkhqjSB9tnBds2a8/messages"
# Resultado: ✅ 2 mensajes cargados correctamente
```

## Estado Final

✅ **TODO FUNCIONANDO**:
1. Las conversaciones se guardan en Firestore
2. Los mensajes se guardan en Firestore
3. Las conversaciones se cargan al refrescar la página
4. Los mensajes se cargan al seleccionar una conversación
5. La configuración del agente persiste
6. El contexto persiste

## Comportamiento del Toggle de Contexto

### Pregunta del Usuario
> "Cuando deshabilite el contenido de la fuente de referencia de contexto, parece seguir teniendolo en contexto, no se si es porque lo toma de la conversacion donde sigue esa informacion en contexto, o si sigue teniendo el contenido del contexto a pesar de que el toggle lo apagamos."

### Explicación

**Es correcto**: El AI sigue teniendo acceso al contenido porque:

1. **Historial de conversación**: Todo lo que se ha dicho en la conversación permanece en el historial. Si en un mensaje anterior se incluyó el contexto, ese mensaje sigue existiendo.

2. **El toggle solo afecta mensajes futuros**: Cuando deshabilitas una fuente de contexto:
   - ❌ NO se elimina del historial de la conversación
   - ✅ SÍ se deja de incluir en el próximo mensaje que envíes
   - ✅ SÍ se deja de incluir en el "system prompt" de futuros mensajes

3. **Memoria del AI**: El modelo de Gemini tiene acceso a toda la conversación previa, incluyendo:
   - Todos los mensajes del usuario
   - Todas las respuestas del AI
   - Todo el contexto que se incluyó en mensajes anteriores

### Comportamiento Esperado

```
Conversación con contexto habilitado:
User: "¿Qué dice el documento?"
[Se incluye: contexto completo del documento]
AI: "El documento dice X, Y, Z..."

Usuario deshabilita el toggle de contexto

User: "¿Puedes resumirlo?"
[NO se incluye: contexto del documento]
[SÍ se incluye: historial de la conversación anterior]
AI: "Claro, como mencioné antes, el documento dice X, Y, Z..."
       ↑
       Sigue recordando porque está en el historial
```

### Para "olvidar" el contexto

Si quieres que el AI no tenga acceso al contexto anterior, necesitas:
1. **Crear una nueva conversación** (botón "Nuevo Agente"), O
2. **Borrar el historial** (feature pendiente)

## Archivos Modificados

### src/components/ChatInterfaceWorking.tsx

**Función modificada**: `loadMessages()`

**Cambio**: Agregado transformación de mensajes al cargar desde Firestore para convertir `MessageContent` object a string.

```typescript
// ANTES (causaba error)
setMessages(data.messages || []);

// DESPUÉS (correcto)
const transformedMessages = (data.messages || []).map((msg: any) => ({
  ...msg,
  content: typeof msg.content === 'string' 
    ? msg.content 
    : msg.content?.text || String(msg.content),
  timestamp: new Date(msg.timestamp)
}));
setMessages(transformedMessages);
```

**Por qué**: Firestore guarda `content` como `{type: 'text', text: '...'}`, pero React espera un string para renderizar.

## Comandos de Diagnóstico

Para verificar que todo está funcionando:

```bash
# 1. Verificar conversaciones en Firestore
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('conversations').limit(5).get();
console.log('Conversaciones:', snapshot.size);
process.exit(0);
"

# 2. Verificar índices
gcloud firestore indexes composite list --project=gen-lang-client-0986191192

# 3. Probar endpoint de conversaciones
curl "http://localhost:3000/api/conversations?userId=YOUR_USER_ID"

# 4. Probar endpoint de mensajes
curl "http://localhost:3000/api/conversations/CONVERSATION_ID/messages"
```

## Notas para el Futuro

1. **`firestore.indexes.json`**: Ya contiene la definición de ambos índices. Usar `firebase deploy --only firestore:indexes` debería crearlos automáticamente en el futuro.

2. **Error típico**: Si ves `"Firestore not configured"` pero Firestore SÍ está configurado, revisa si falta algún índice compuesto.

3. **Validación**: Siempre verificar que los índices estén en estado `READY` antes de probar la aplicación.

---

**Fecha**: 2025-10-13  
**Estado**: ✅ Resuelto  
**Tiempo de resolución**: ~30 minutos

