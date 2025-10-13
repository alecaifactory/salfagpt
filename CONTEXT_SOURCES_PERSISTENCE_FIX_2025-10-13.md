# Context Sources Persistence Fix - 2025-10-13

## Problema Reportado

Al subir un PDF a través del workflow "Procesar PDF", el contenido se procesaba correctamente y se podía hacer preguntas sobre él, pero al refrescar la página, la referencia al archivo en "Fuentes de Contexto" desaparecía.

## Causa Raíz

Las fuentes de contexto (`ContextSource`) solo existían en el estado local de React, no se guardaban en Firestore.

**Flujo anterior (incorrecto)**:
```
1. Usuario sube PDF
2. Se extrae contenido con Gemini
3. Se agrega a estado local: setContextSources([...prev, newSource])
4. ✅ Funciona hasta aquí
5. Usuario refresca página
6. Estado local se pierde (React reinicia)
7. ❌ Fuente de contexto desaparece
```

## Solución Implementada

### 1. Funciones CRUD en Firestore (src/lib/firestore.ts)

**Agregadas**:
- `createContextSource()` - Crear nueva fuente de contexto
- `getContextSources()` - Listar fuentes del usuario
- `updateContextSource()` - Actualizar fuente (ej: enabled state)
- `deleteContextSource()` - Eliminar fuente

**Interface**:
```typescript
export interface ContextSource {
  id: string;
  userId: string;
  name: string;
  type: 'pdf' | 'csv' | 'excel' | 'word' | 'web-url' | 'api' | 'folder';
  enabled: boolean;
  status: 'active' | 'processing' | 'error' | 'disabled';
  addedAt: Date;
  extractedData?: string;
  metadata?: {
    originalFileName?: string;
    originalFileSize?: number;
    model?: string;
    charactersExtracted?: number;
    pageCount?: number;
    extractionDate?: Date;
    validated?: boolean;
    validatedBy?: string;
    validatedAt?: Date;
  };
  error?: { ... };
  progress?: { ... };
  source?: 'localhost' | 'production';
}
```

### 2. Endpoints API

**Creados**:
- `GET /api/context-sources?userId={userId}` - Listar fuentes del usuario
- `POST /api/context-sources` - Crear nueva fuente
- `PUT /api/context-sources/:id` - Actualizar fuente
- `DELETE /api/context-sources/:id` - Eliminar fuente

### 3. Frontend Integration (ChatInterfaceWorking.tsx)

**A. useEffect para cargar fuentes al iniciar**:
```typescript
useEffect(() => {
  const loadContextSources = async () => {
    const response = await fetch(`/api/context-sources?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      setContextSources(data.sources);
      console.log(`✅ ${data.sources.length} fuentes cargadas`);
    }
  };
  loadContextSources();
}, [userId]);
```

**B. handleAddSource modificado para guardar en Firestore**:
```typescript
// Después de extraer con Gemini
const savedSource = await fetch('/api/context-sources', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    name: file.name,
    type,
    enabled: true,
    status: 'active',
    extractedData: data.extractedText,
    metadata: {
      originalFileName: file.name,
      originalFileSize: file.size,
      pageCount: data.metadata?.pageCount,
      model: config?.model,
      charactersExtracted: data.metadata?.characters,
      extractionDate: new Date(),
    }
  })
});
```

**C. toggleContext modificado para actualizar Firestore**:
```typescript
const toggleContext = async (sourceId: string) => {
  // Update local state
  setContextSources(prev => prev.map(s => 
    s.id === sourceId ? { ...s, enabled: !s.enabled } : s
  ));

  // Update in Firestore
  await fetch(`/api/context-sources/${sourceId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled: newEnabledState })
  });

  // Save active sources for conversation
  if (currentConversation) {
    saveContextForConversation(currentConversation, newActiveIds);
  }
};
```

### 4. Índice Compuesto en Firestore

**Agregado** a `firestore.indexes.json`:
```json
{
  "collectionGroup": "context_sources",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```

**Creado** con gcloud CLI:
```bash
gcloud firestore indexes composite create \
  --project=gen-lang-client-0986191192 \
  --database='(default)' \
  --collection-group=context_sources \
  --field-config field-path=userId,order=ascending \
  --field-config field-path=addedAt,order=descending
```

**Estado**: ✅ READY

## Flujo Completo (Correcto)

```
1. Usuario sube PDF
   ↓
2. Se extrae contenido con Gemini
   ↓
3. Se guarda en Firestore (collection: context_sources)
   ↓
4. Se actualiza estado local con ID de Firestore
   ↓
5. Usuario puede hacer preguntas
   ↓
6. Usuario refresca página
   ↓
7. useEffect carga fuentes desde Firestore
   ↓
8. ✅ Fuente de contexto sigue disponible
```

## Estado Persistido

### En Firestore (Colección: context_sources)

**Por fuente**:
- Contenido extraído (`extractedData`)
- Metadata completa (nombre, tamaño, páginas, modelo usado)
- Estado enabled/disabled global del usuario
- Estado de validación (si un experto la aprobó)

### En Firestore (Colección: conversation_context)

**Por agente/conversación**:
- Lista de IDs de fuentes activas (`activeContextSourceIds`)
- Uso del contexto window (`contextWindowUsage`)

### Combinación

Al cargar un agente:
1. Se cargan todas las fuentes del usuario desde `context_sources`
2. Se cargan los IDs activos para esa conversación desde `conversation_context`
3. Se aplica `enabled: activeIds.includes(source.id)` a cada fuente
4. Usuario ve todas sus fuentes, con las del agente actual habilitadas

## Nuevo Requirement: Fuentes Públicas vs Privadas

### Pendiente

El usuario solicitó poder marcar fuentes como:
- **Público**: Otros usuarios pueden ver y usar
- **Privado**: Solo visible para el usuario que la subió

### Propuesta de Implementación

**Agregar campos a ContextSource**:
```typescript
interface ContextSource {
  // ... campos existentes
  visibility: 'private' | 'public';  // NEW
  createdBy: string;                 // userId del creador
  sharedWith?: string[];             // IDs de usuarios con acceso
}
```

**Query modificada**:
```typescript
// Cargar fuentes: propias + públicas + compartidas
const ownSources = await firestore
  .collection('context_sources')
  .where('userId', '==', userId)
  .get();

const publicSources = await firestore
  .collection('context_sources')
  .where('visibility', '==', 'public')
  .get();

const allSources = [...ownSources.docs, ...publicSources.docs];
```

**UI**:
- Agregar toggle "Público/Privado" en modal de subida
- Badge visual para fuentes públicas
- Filtro para mostrar solo propias o todas

## Archivos Modificados

### src/lib/firestore.ts
- Agregada interface `ContextSource`
- Agregadas funciones CRUD: `createContextSource`, `getContextSources`, `updateContextSource`, `deleteContextSource`
- Modificada interface `ConversationContext` para hacer `activeContextSourceIds` opcional

### src/pages/api/context-sources.ts (NUEVO)
- Endpoint GET: Listar fuentes del usuario
- Endpoint POST: Crear nueva fuente

### src/pages/api/context-sources/[id].ts (NUEVO)
- Endpoint PUT: Actualizar fuente
- Endpoint DELETE: Eliminar fuente

### src/components/ChatInterfaceWorking.tsx
- Agregado useEffect para cargar fuentes desde Firestore al montar
- Modificado `handleAddSource`: Guarda en Firestore después de extraer
- Modificado `toggleContext`: Actualiza enabled state en Firestore
- Removido demo source hardcodeado, inicializa con array vacío

### firestore.indexes.json
- Agregado índice compuesto para `context_sources` (userId + addedAt)

## Testing

### Manual

```bash
# 1. Subir un PDF
# - Ir a http://localhost:3000/chat
# - Click "Agregar" en Fuentes de Contexto
# - Subir CV Tomás Alarcón - ESP.pdf
# - Esperar extracción
# - ✅ Verificar que aparece en lista

# 2. Hacer preguntas
# - Activar toggle de la fuente
# - Preguntar: "¿Quién es Tomás Alarcón?"
# - ✅ Verificar respuesta correcta con contexto

# 3. Refrescar página
# - F5 o Cmd+R
# - ✅ Verificar que fuente sigue en lista
# - ✅ Verificar que toggle mantiene estado
# - ✅ Verificar que se puede seguir preguntando

# 4. Cambiar de agente
# - Crear nuevo agente
# - ✅ Verificar que fuente aparece (disabled)
# - Activar toggle
# - ✅ Verificar que contexto se aplica
```

### Verificación en Firestore

```bash
# Ver fuentes guardadas
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
async function check() {
  const snapshot = await firestore.collection('context_sources')
    .orderBy('addedAt', 'desc')
    .limit(5)
    .get();
  console.log('Fuentes:', snapshot.size);
  snapshot.docs.forEach(doc => {
    console.log(' -', doc.data().name, '(enabled:', doc.data().enabled, ')');
  });
  process.exit(0);
}
check();
"

# Ver contexto por conversación
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
async function check() {
  const snapshot = await firestore.collection('conversation_context')
    .limit(5)
    .get();
  console.log('Conversaciones con contexto:', snapshot.size);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(' -', doc.id, '- Sources activas:', data.activeContextSourceIds?.length || 0);
  });
  process.exit(0);
}
check();
"
```

## Backward Compatibility

✅ **Mantiene compatibilidad total**:
- Fuentes existentes en estado local siguen funcionando
- Fuentes nuevas se guardan en Firestore automáticamente
- Si Firestore falla, muestra array vacío (no crashea)
- Estado `enabled` se mantiene entre sesiones
- Configuración de agente se mantiene separada

## Estado Final

✅ **TODO FUNCIONANDO**:
1. ✅ Fuentes de contexto se guardan en Firestore
2. ✅ Fuentes persisten al refrescar la página
3. ✅ Estado enabled/disabled persiste
4. ✅ Cada agente mantiene sus fuentes activas
5. ✅ Metadata completa (tamaño, páginas, modelo usado)
6. ✅ Backward compatible con código existente

## Próximos Pasos (Feature Requests)

### 1. Visibilidad Pública/Privada
- [ ] Agregar campo `visibility` a ContextSource
- [ ] UI toggle en modal de subida
- [ ] Query para cargar fuentes públicas
- [ ] Badge visual para fuentes públicas
- [ ] Permisos de validación (solo owner o admin)

### 2. Compartir Fuentes entre Usuarios
- [ ] Colección `context_shares` en Firestore
- [ ] UI para compartir con usuario/grupo específico
- [ ] Permisos de lectura/escritura
- [ ] Notificaciones de recursos compartidos

### 3. Re-extracción con Nuevo Modelo
- [ ] Guardar archivo original en Cloud Storage
- [ ] Permitir re-extraer con Pro si se extrajo con Flash
- [ ] Comparar extracciones lado a lado
- [ ] Versioning de extracciones

## Índices Firestore Creados

```bash
NAME: CICAgJim14AK
COLLECTION_GROUP: context_sources
FIELD_PATHS: userId (ASC) + addedAt (DESC)
STATE: ✅ READY
```

## Comandos de Verificación

```bash
# Verificar índices
gcloud firestore indexes composite list --project=gen-lang-client-0986191192

# Probar endpoint
curl "http://localhost:3000/api/context-sources?userId=YOUR_USER_ID"

# Ver datos directamente
# (use el comando de verificación en Testing arriba)
```

---

**Fecha**: 2025-10-13  
**Estado**: ✅ Resuelto  
**Versión**: 1.0.0

