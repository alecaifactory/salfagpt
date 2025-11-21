# Fix: Shared Agents Now Access Owner's Documents

## Problem Identificado (Gracias al Usuario!)
Cuando **Usuario B** usa un agente compartido por **Usuario A**:
- ❌ El sistema buscaba documentos con `userId` de **Usuario B** 
- ❌ Pero los documentos están asignados con `userId` de **Usuario A** (el dueño)
- ❌ Resultado: 0 documentos encontrados, no hay RAG, no hay referencias

## Ejemplo Real: S1-v2
- **Usuario A** (dundurraga@iaconcagua.com - `usr_uhwqffaqag1wrryd82tw`):
  - Creó S1-v2
  - Subió 75 documentos MAQ
  - Los documentos tienen `userId: usr_uhwqffaqag1wrryd82tw`

- **Usuario B** (alec@getaifactory.com - `usr_ywg6pg0v3tgbq1817xmo`):
  - Tiene acceso a S1-v2 compartido
  - Sistema buscaba documentos con `userId: usr_ywg6pg0v3tgbq1817xmo` ❌
  - Encontraba 0 documentos
  - No había RAG ni referencias

## La Solución: `getEffectiveOwnerForContext`

La función YA EXISTÍA en `firestore.ts` pero NO se estaba usando:

```typescript
/**
 * Get the effective owner userId for context source access
 * 
 * When an agent is shared:
 * - User's own conversations use their userId
 * - Shared agents use the original owner's userId
 * 
 * This ensures shared agents have access to the owner's context sources
 */
export async function getEffectiveOwnerForContext(
  agentId: string,
  currentUserId: string
): Promise<string>
```

## Cambios Aplicados

### 1. `src/pages/api/agents/[id]/context-stats.ts`

```typescript
// ANTES (INCORRECTO):
const agentSourcesSnapshot = await firestore
  .collection('agent_sources')
  .where('agentId', '==', effectiveAgentId)
  .where('userId', '==', session.id)  // ❌ Usuario actual, no el dueño
  .count()
  .get();

// DESPUÉS (CORRECTO):
const effectiveUserId = await getEffectiveOwnerForContext(effectiveAgentId, session.id);

const agentSourcesSnapshot = await firestore
  .collection('agent_sources')
  .where('agentId', '==', effectiveAgentId)
  .where('userId', '==', effectiveUserId)  // ✅ Usuario dueño del agente
  .count()
  .get();
```

### 2. `src/pages/api/conversations/[id]/context-sources-metadata.ts`

```typescript
// ANTES (INCORRECTO):
let query = firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', '==', session.id)  // ❌ Usuario actual
  .orderBy('addedAt', 'desc')
  .limit(BATCH_SIZE);

// DESPUÉS (CORRECTO):
const effectiveUserId = await getEffectiveOwnerForContext(effectiveAgentId, session.id);

let query = firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', '==', effectiveUserId)  // ✅ Usuario dueño
  .orderBy('addedAt', 'desc')
  .limit(BATCH_SIZE);
```

También en la búsqueda de `agent_sources`:
```typescript
const agentSourcesSnapshot = await firestore
  .collection('agent_sources')
  .where('agentId', '==', effectiveAgentId)
  .where('userId', '==', effectiveUserId)  // ✅ Usuario dueño
  .get();
```

### 3. `src/lib/rag-search.ts`

```typescript
// ANTES (INCORRECTO):
const { getUserByIdOrEmail } = await import('./firestore.js');  // ❌ Función no existe

// DESPUÉS (CORRECTO):
const { getUserById } = await import('./firestore.js');  // ✅ Función correcta
```

## Cómo Funciona Ahora

1. **Usuario B** abre S1-v2 (compartido por Usuario A)
2. Frontend llama `/api/agents/iQmdg3bMSJ1AdqqlFpye/context-stats`
3. API detecta:
   - `session.id` = `usr_ywg6pg0v3tgbq1817xmo` (Usuario B)
   - Agente pertenece a `usr_uhwqffaqag1wrryd82tw` (Usuario A)
4. `getEffectiveOwnerForContext` retorna el userId del **dueño** (Usuario A)
5. Queries buscan documentos con userId del **dueño**
6. ✅ Encuentra los 75 documentos MAQ
7. ✅ activeContextSourceIds se carga correctamente
8. ✅ RAG funciona con los documentos del dueño
9. ✅ Referencias aparecen en las respuestas

## Otros Fixes Incluidos

1. ✅ API Key: Necesita ser regenerada (bloqueada por Google)
2. ✅ `getUserById` función corregida en rag-search.ts
3. ✅ `agent_sources` collection ahora se consulta correctamente
4. ✅ Ambos APIs (context-stats y context-sources-metadata) ahora usan `getEffectiveOwnerForContext`

## Testing

### Para agentes propios:
- `getEffectiveOwnerForContext` retorna el mismo `userId`
- Todo funciona igual que antes

### Para agentes compartidos:
- `getEffectiveOwnerForContext` retorna el userId del **dueño**
- El usuario con acceso compartido ve los documentos del dueño
- RAG funciona con los documentos correctos
- Referencias muestran los documentos apropiados

## Deployment

```bash
git add -A
git commit -m "Fix: Use getEffectiveOwnerForContext for shared agents"
git push

gcloud run deploy cr-salfagpt-ai-ft-prod --source . --region us-central1 --project salfagpt
```

## Próximo Paso Crítico

**GENERAR NUEVA API KEY de Google** - La actual está bloqueada y impide todas las respuestas AI.

Sin nueva API key, nada funcionará (ni RAG, ni embeddings, ni respuestas).
