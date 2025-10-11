# Lecciones Aprendidas: Integración de Chat con Gemini AI

**Fecha**: 11 de octubre de 2025  
**Contexto**: Integración completa de Gemini 2.5 en SalfaGPT  
**Estado**: ✅ COMPLETADO

---

## 📚 Resumen Ejecutivo

Este documento captura todas las lecciones aprendidas durante la integración del sistema de chat con Gemini AI, incluyendo los errores cometidos, las soluciones aplicadas, y las mejores prácticas para evitar repetirlos.

---

## 🔥 Problemas Encontrados y Soluciones

### 1. API de Gemini Incorrecta

#### ❌ **Error Cometido**
```typescript
// INCORRECTO - Clase que no existe
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(apiKey); // Constructor incorrecto
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Método no existe
```

#### ✅ **Solución Correcta**
```typescript
// CORRECTO - Según @google/genai v1.23.0
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'mensaje del usuario',
  config: {
    systemInstruction: 'Eres un asistente útil.',
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
});

const text = result.text || '';
```

#### 📖 **Lección Aprendida**
- **Siempre verificar** la documentación oficial de la versión específica del SDK
- **No asumir** que las APIs de diferentes SDKs de Google son iguales
- **Consultar** `node_modules/@google/genai/README.md` para ejemplos actuales
- **Usar** `grep` para buscar métodos disponibles en archivos `.d.ts`

---

### 2. Modo Mock Activado por Error

#### ❌ **Error Cometido**
```typescript
// En ChatInterface.tsx
try {
  const response = await fetch('/api/conversations');
  // ...
} catch (error) {
  setUseMockData(true); // ❌ Activa modo mock cuando falla Firestore
}
```

#### ✅ **Solución Correcta**
```typescript
try {
  const response = await fetch('/api/conversations');
  // ...
} catch (error) {
  console.error('Error loading conversations:', error);
  setConversations([]); // ✅ Muestra lista vacía, mantiene API real
}
```

#### 📖 **Lección Aprendida**
- **No usar modo mock como fallback** - debe ser una opción explícita
- **Separar** errores de infraestructura de funcionalidad de la app
- **Permitir** que la app funcione con datos vacíos
- **Logs claros** en consola para debugging

---

### 3. Firestore sin Credenciales en Desarrollo

#### ❌ **Error Cometido**
```typescript
// Sin manejo de errores
const firestore = new Firestore({
  projectId: PROJECT_ID,
});
// Crash si no hay credenciales
```

#### ✅ **Solución Correcta**
```typescript
const IS_DEVELOPMENT = import.meta.env.DEV;

export async function getConversations(userId: string) {
  try {
    const query = firestore.collection('conversations')
      .where('userId', '==', userId);
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    if (IS_DEVELOPMENT) {
      console.warn('⚠️ Firestore unavailable in dev. Returning empty array.');
      return []; // ✅ Retorna array vacío en lugar de crash
    }
    throw error; // En producción, sí lanza error
  }
}
```

#### 📖 **Lección Aprendida**
- **Diseñar para degradación graciosa** en desarrollo
- **Diferenciar** comportamiento dev vs producción
- **Logs útiles** que expliquen qué hacer para habilitar funcionalidad completa
- **Documentar** opciones de setup en `docs/LOCAL_TESTING_GUIDE.md`

---

### 4. BigQuery Requiere Credenciales en Dev

#### ❌ **Error Cometido**
```typescript
// Siempre intenta insertar en BigQuery
export async function insertChatMessage(userId, message, role) {
  await bigquery.dataset(DATASET_ID).table('chat_messages').insert(rows);
}
```

#### ✅ **Solución Correcta**
```typescript
export async function insertChatMessage(userId, message, role) {
  if (IS_DEVELOPMENT) {
    console.log(`📝 [DEV] Would insert chat message:`, { userId, role });
    return; // ✅ Skip en desarrollo
  }
  
  await bigquery.dataset(DATASET_ID).table('chat_messages').insert(rows);
}
```

#### 📖 **Lección Aprendida**
- **Analytics no debe bloquear** funcionalidad principal
- **Auto-deshabilitar servicios opcionales** en desarrollo
- **Logs simulados** para ver qué se insertaría
- **Habilitar opcionalmente** con variable de entorno si se necesita testing

---

### 5. Endpoints sin Manejo de Conversaciones Temporales

#### ❌ **Error Cometido**
```typescript
// POST /api/conversations
const conversation = await createConversation(userId, title);
// ❌ Crash si Firestore no disponible
return new Response(JSON.stringify({ conversation }));
```

#### ✅ **Solución Correcta**
```typescript
try {
  const conversation = await createConversation(userId, title);
  return new Response(JSON.stringify({ conversation }));
} catch (firestoreError) {
  // ✅ Fallback a conversación temporal
  const tempConversation = {
    id: `temp-${Date.now()}`,
    userId,
    title: title || 'New Conversation',
    createdAt: new Date(),
    messageCount: 0,
    contextWindowUsage: 0,
  };
  return new Response(JSON.stringify({ conversation: tempConversation }));
}
```

#### 📖 **Lección Aprendida**
- **Detectar IDs temporales** con prefijo `temp-`
- **Manejar temp IDs** en todos los endpoints relacionados
- **Permitir funcionalidad core** sin persistencia
- **Documentar limitaciones** de modo temporal

---

### 6. Parámetros Faltantes en URLs

#### ❌ **Error Cometido**
```typescript
// GET /api/conversations/:id/context
// Requiere userId pero no se pasa
const response = await fetch(`/api/conversations/${id}/context`);
// ❌ 400 Bad Request
```

#### ✅ **Solución Correcta**
```typescript
const response = await fetch(
  `/api/conversations/${id}/context?userId=${userId}`
);
```

#### 📖 **Lección Aprendida**
- **Revisar params requeridos** en definición de API
- **Validar en frontend** antes de hacer llamadas
- **Logs claros** cuando faltan parámetros
- **TypeScript** para definir interfaces de API

---

### 7. Estados Undefined Causan Crashes de Rendering

#### ❌ **Error Cometido**
```typescript
const [contextWindowUsage, setContextWindowUsage] = useState(2.3);

// Luego...
const data = await response.json();
setContextWindowUsage(data.usage); // ❌ Puede ser undefined

// En render:
<span>{contextWindowUsage.toFixed(1)}%</span> // ❌ Crash si undefined
```

#### ✅ **Solución Correcta**
```typescript
const [contextWindowUsage, setContextWindowUsage] = useState(0); // ✅ Inicial 0

const data = await response.json();
setContextWindowUsage(data.usage || 0); // ✅ Fallback a 0

// En render (aún más seguro):
<span>{(contextWindowUsage || 0).toFixed(1)}%</span>
```

#### 📖 **Lección Aprendida**
- **Inicializar estados con valores seguros** (no undefined)
- **Siempre usar fallbacks** al actualizar estados desde APIs
- **Manejar errores en catch** para resetear a valores seguros
- **Evitar** asumir que las APIs siempre retornan datos

---

## 🎯 Mejores Prácticas Establecidas

### 1. **Desarrollo Local Sin Dependencias Externas**

```typescript
// Patrón: Detectar modo desarrollo
const IS_DEVELOPMENT = import.meta.env.DEV;

// Patrón: Skip servicios opcionales
if (IS_DEVELOPMENT) {
  console.log('[DEV] Skipping BigQuery insert');
  return;
}

// Patrón: Fallback a datos mock
if (IS_DEVELOPMENT) {
  return { id: `temp-${Date.now()}`, ...defaults };
}
```

### 2. **Manejo de Errores en APIs**

```typescript
// Patrón: Try-catch con fallback
try {
  const data = await externalService.fetch();
  return data;
} catch (error) {
  if (IS_DEVELOPMENT) {
    console.warn('Service unavailable, using fallback');
    return fallbackData;
  }
  throw error; // En producción, propagar error
}
```

### 3. **Estados React Seguros**

```typescript
// ✅ SIEMPRE con valores iniciales válidos
const [count, setCount] = useState(0); // No undefined
const [items, setItems] = useState<Item[]>([]); // No undefined
const [user, setUser] = useState<User | null>(null); // Explícito null

// ✅ SIEMPRE con fallbacks en updates
setCount(data.count || 0);
setItems(data.items || []);
setUser(data.user ?? null);

// ✅ SIEMPRE manejo en catch
} catch (error) {
  setCount(0);
  setItems([]);
  setUser(null);
}
```

### 4. **Validación de APIs**

```typescript
// En el servidor - Validar parámetros requeridos
if (!userId || !conversationId) {
  return new Response(
    JSON.stringify({ error: 'Missing required parameters' }),
    { status: 400 }
  );
}

// En el cliente - Incluir todos los parámetros
const response = await fetch(
  `/api/endpoint?userId=${userId}&id=${id}`
);
```

### 5. **Logging Útil**

```typescript
// ✅ En desarrollo - Logs descriptivos
if (IS_DEVELOPMENT) {
  console.log('🔥 Firestore initialized successfully');
  console.warn('⚠️ BigQuery disabled in dev mode');
  console.error('❌ Failed to load conversations:', error);
}

// ✅ Indicadores visuales
console.log('📝 [DEV] Would insert message...');
console.log('✅ AI response generated in 1234ms');
```

---

## 🏗️ Arquitectura Final

### Flujo de Chat Completo

```
Usuario escribe mensaje
    ↓
ChatInterface.tsx
    ↓
POST /api/conversations/:id/messages
    ↓
¿Es temp-*?
    ├─ SÍ → Llamar Gemini directamente (sin Firestore)
    └─ NO → Guardar en Firestore → Llamar Gemini → Guardar respuesta
    ↓
Retornar mensaje del asistente
    ↓
ChatInterface actualiza UI
```

### Servicios por Ambiente

| Servicio | Desarrollo | Producción |
|----------|-----------|------------|
| Gemini AI | ✅ Activo | ✅ Activo |
| Firestore | ⚠️ Opcional | ✅ Activo |
| BigQuery | ❌ Deshabilitado | ✅ Activo |
| Auth | ⚠️ Bypass (test user) | ✅ OAuth |

---

## 📋 Checklist para Nuevas Features

Antes de integrar un nuevo servicio externo:

- [ ] **Definir comportamiento en desarrollo** (skip, mock, o requerido)
- [ ] **Agregar manejo de errores** con fallbacks apropiados
- [ ] **Documentar setup** en `docs/` si es opcional
- [ ] **Logs claros** sobre estado del servicio
- [ ] **Variables de entorno** en `.env.example`
- [ ] **TypeScript** para interfaces de API
- [ ] **Pruebas** sin el servicio para verificar degradación graciosa

---

## 🔍 Debugging Común

### "API Key not working"
```bash
# Verificar que existe
echo $GOOGLE_AI_API_KEY

# Verificar en .env
grep GOOGLE_AI_API_KEY .env

# Reiniciar servidor
npm run dev
```

### "Firestore errors in dev"
```bash
# Opción 1: Deshabilitar
unset GOOGLE_APPLICATION_CREDENTIALS

# Opción 2: Usar emulador
npm run dev:emulator
# En otra terminal:
npm run dev:local
```

### "Mock mode activated"
- **Causa**: Error en API activó fallback a mock
- **Solución**: Ver logs, arreglar error raíz, NO usar mock como solución

### "TypeScript errors"
```bash
# Verificar tipos
npm run type-check

# Ver errores específicos
npx tsc --noEmit
```

---

## 📚 Referencias Creadas

1. **`docs/GEMINI_API_MIGRATION.md`** - Guía completa de API de Gemini
2. **`docs/LOCAL_TESTING_GUIDE.md`** - Setup local y testing
3. **`docs/FIRESTORE_DEV_SETUP.md`** - Opciones de Firestore
4. **`.cursor/rules/gemini-api-usage.mdc`** - Reglas para IA
5. **`GEMINI_2.5_UPGRADE.md`** - Resumen de upgrade

---

## 🎓 Conclusiones Clave

### Lo Más Importante

1. **Verificar documentación oficial** - No asumir APIs
2. **Diseñar para degradación graciosa** - La app debe funcionar sin todos los servicios
3. **Estados seguros en React** - Siempre valores iniciales válidos
4. **Logging descriptivo** - Ayuda enormemente en debugging
5. **Separar dev de prod** - Comportamientos diferentes son OK

### Métricas de Éxito

- ✅ Chat funciona sin Firestore
- ✅ Chat funciona sin BigQuery  
- ✅ Respuestas reales de Gemini AI
- ✅ Cero crashes por undefined
- ✅ Logs útiles en consola
- ✅ Código limpio sin errores de TypeScript

### Tiempo Invertido

- **Integración inicial**: ~1 hora
- **Debugging de errores**: ~2 horas
- **Documentación**: ~1 hora
- **Total**: ~4 horas

**Valor**: Sistema de chat completamente funcional con degradación graciosa y excelente DX.

---

**Última actualización**: 11 de octubre de 2025  
**Estado**: Producción-ready ✅

