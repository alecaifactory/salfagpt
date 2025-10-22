# 🧪 Test de Persistencia de Proyectos

## 🎯 Problema Reportado

**Síntoma:** Al crear un nuevo proyecto, desaparece al refrescar la página.

**Fix Aplicado:** Se agregó `loadFolders()` después de crear el proyecto para recargar desde Firestore.

---

## ✅ Prueba de Verificación

### Paso 1: Verificar Estado Inicial

1. Abre http://localhost:3000/chat
2. Abre DevTools Console (Cmd+Option+J en Mac)
3. Observa los logs de carga inicial:
   ```
   📥 Cargando proyectos desde Firestore...
   ✅ X proyectos cargados desde Firestore
   📁 Proyectos: Proyecto 1, Proyecto 2, ...
   ```
   O si no hay proyectos:
   ```
   ℹ️ No hay proyectos guardados
   ```

### Paso 2: Crear Nuevo Proyecto

1. En el sidebar izquierdo, busca la sección **"Proyectos"** (con ícono de documento)
2. Click en el botón **"+"** verde al lado del título "Proyectos"
3. Se abrirá un prompt nativo del navegador
4. Escribe un nombre, por ejemplo: `"Mi Proyecto de Prueba"`
5. Click **OK**

### Paso 3: Verificar Creación Inmediata

**En la consola, debes ver:**
```
✅ Proyecto creado en Firestore: [ID_DEL_PROYECTO] Name: Mi Proyecto de Prueba
🔄 Recargando proyectos desde Firestore para verificar persistencia...
📥 Cargando proyectos desde Firestore...
✅ X proyectos cargados desde Firestore
📁 Proyectos: ..., Mi Proyecto de Prueba
✅ Proyecto creado y lista recargada desde Firestore
```

**En la UI, debes ver:**
- ✅ El proyecto aparece inmediatamente en la sección "Proyectos"
- ✅ El contador de proyectos se incrementa (ej: "Proyectos **3**")
- ✅ El proyecto tiene un ícono de carpeta verde

### Paso 4: **REFRESCAR LA PÁGINA** 🔄

1. Presiona **Cmd+R** (Mac) o **Ctrl+R** (Windows/Linux)
2. La página se recarga completamente
3. Observa los logs de carga:
   ```
   📥 Cargando proyectos desde Firestore...
   ✅ X proyectos cargados desde Firestore
   📁 Proyectos: ..., Mi Proyecto de Prueba
   ```

**RESULTADO ESPERADO:**
- ✅ El proyecto "Mi Proyecto de Prueba" **DEBE aparecer** en la lista
- ✅ El contador de proyectos debe ser el mismo que antes de refrescar
- ✅ El proyecto debe ser clickable y funcional

---

## 🔍 Verificación en Firestore

### Opción A: Firebase Console (Recomendado)

1. Abre: https://console.firebase.google.com/project/salfagpt/firestore
2. Ve a la colección **`folders`**
3. Busca documentos con:
   - `userId`: tu user ID
   - `name`: "Mi Proyecto de Prueba"
4. Verifica campos:
   - ✅ `id`: un ID único
   - ✅ `userId`: tu user ID
   - ✅ `name`: "Mi Proyecto de Prueba"
   - ✅ `createdAt`: timestamp de creación
   - ✅ `conversationCount`: 0

### Opción B: Verificar con comando

```bash
cd /Users/alec/salfagpt
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function check() {
  const snapshot = await firestore.collection('folders')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  console.log('📁 Últimos 5 proyectos en Firestore:');
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(\`  - \${data.name} (ID: \${doc.id}, creado: \${data.createdAt.toDate()})\`);
  });
  
  process.exit(0);
}

check();
"
```

---

## ❌ Si el Problema Persiste

### Diagnóstico 1: Verificar Conexión a Firestore

```bash
# Verificar autenticación
gcloud auth application-default print-access-token > /dev/null 2>&1 && echo "✅ Auth OK" || echo "❌ Auth failed"

# Verificar variable de entorno
cat .env | grep GOOGLE_CLOUD_PROJECT
# Debe mostrar: GOOGLE_CLOUD_PROJECT=salfagpt
```

### Diagnóstico 2: Verificar Logs de Error

En la consola del navegador, busca:
- ❌ `Error loading folders:` - Problema al cargar
- ❌ `Error creating folder:` - Problema al crear
- ⚠️ `Firestore unavailable` - Firestore no conectado

### Diagnóstico 3: Verificar API Response

En DevTools → Network tab:
1. Crea un proyecto
2. Busca la request **POST** a `/api/folders`
3. Verifica la respuesta:
   - ✅ Status: **201 Created**
   - ✅ Body: `{ "folder": { "id": "...", "name": "...", ... } }`

Si la respuesta es **500** o tiene un error, revisa los logs del servidor.

---

## 🔧 Soluciones Comunes

### Problema 1: Firestore No Conectado

**Síntoma:** Logs muestran "Firestore unavailable"

**Solución:**
```bash
# Re-autenticar
gcloud auth application-default login

# Reiniciar servidor
# Presiona Ctrl+C en la terminal donde corre npm run dev
npm run dev
```

### Problema 2: userId Incorrecto

**Síntoma:** Proyectos se crean pero no aparecen para tu usuario

**Verificar userId:**
1. En console: Busca el log `📥 Cargando proyectos desde Firestore...`
2. Justo después debe haber un fetch a `/api/folders?userId=TU_USER_ID`
3. Verifica que ese userId sea el correcto

### Problema 3: Índice Faltante

**Síntoma:** Error `The query requires an index`

**Solución:**
```bash
# Desplegar índices de Firestore
firebase deploy --only firestore:indexes --project salfagpt
```

---

## ✅ Criterio de Éxito

La persistencia funciona correctamente si:

1. ✅ Proyecto aparece inmediatamente después de crear
2. ✅ Proyecto persiste después de refrescar (Cmd+R)
3. ✅ Proyecto existe en Firestore (verificable en console)
4. ✅ No hay errores en console del navegador
5. ✅ Logs muestran "recargada desde Firestore"

---

## 📊 Antes y Después

### ❌ ANTES (Bug)

```
Usuario crea proyecto
  ↓
Proyecto aparece en UI
  ↓
Usuario refresca página
  ↓
❌ Proyecto desaparece (solo estaba en memoria local)
```

### ✅ DESPUÉS (Fix)

```
Usuario crea proyecto
  ↓
POST /api/folders → Firestore guarda ✅
  ↓
loadFolders() recarga desde Firestore ✅
  ↓
Proyecto aparece en UI
  ↓
Usuario refresca página
  ↓
loadFolders() recarga desde Firestore ✅
  ↓
✅ Proyecto persiste (cargado desde Firestore)
```

---

## 🔍 Código del Fix

### Cambio 1: Recargar después de crear

```typescript
// ANTES
const createNewFolder = async (name: string) => {
  // ... create folder
  setFolders(prev => [...prev, newFolder]); // Solo actualiza estado local
};

// DESPUÉS
const createNewFolder = async (name: string) => {
  // ... create folder
  console.log('✅ Proyecto creado en Firestore:', data.folder.id);
  
  // CRITICAL: Reload from Firestore
  await loadFolders(); // ⭐ Recarga desde Firestore
  console.log('✅ Proyecto creado y lista recargada desde Firestore');
};
```

### Cambio 2: Logs más informativos

```typescript
// ANTES
console.log('✅ Folders loaded:', foldersWithDates.length);

// DESPUÉS
if (foldersWithDates.length > 0) {
  console.log(`✅ ${foldersWithDates.length} proyectos cargados desde Firestore`);
  console.log('📁 Proyectos:', foldersWithDates.map(f => f.name).join(', '));
} else {
  console.log('ℹ️ No hay proyectos guardados');
}
```

---

## 📝 Notas Técnicas

### ¿Por qué funcionaba antes y luego desaparecía?

**Flujo anterior (con bug):**
1. `createNewFolder` llamaba al API ✅
2. API guardaba en Firestore ✅
3. Función actualizaba estado React con `setFolders(prev => [...prev, newFolder])` ✅
4. Proyecto aparecía en UI ✅
5. **Usuario refrescaba página** 🔄
6. `loadFolders()` se ejecutaba en `useEffect` ✅
7. Cargaba proyectos desde Firestore ✅
8. **PERO**: Si había algún error silencioso o el proyecto no se guardó correctamente, no aparecía ❌

**Flujo nuevo (fix):**
- Después de crear, **inmediatamente recarga desde Firestore**
- Esto garantiza que el proyecto realmente se guardó
- Si el proyecto no aparece después del reload, sabemos que hay un problema de Firestore
- Los logs son mucho más claros y nos permiten debuggear

### Beneficios del Fix

1. ✅ **Detección temprana**: Si Firestore falla, lo sabemos inmediatamente
2. ✅ **Consistencia garantizada**: Lo que ves es lo que está guardado
3. ✅ **Mejor debugging**: Logs claros muestran cada paso
4. ✅ **Mismo patrón**: Igual que `createNewAgent` (líneas 1278-1280)

---

## 🚀 Siguientes Pasos

Después de verificar que funciona:

1. ✅ Cierra este archivo de prueba
2. ✅ Haz pruebas adicionales (crear varios proyectos, renombrarlos, etc.)
3. ✅ Si todo funciona, considera commitear los cambios

---

**Última Actualización**: 2025-10-22  
**Status**: ✅ Fix aplicado  
**Archivo Modificado**: `src/components/ChatInterfaceWorking.tsx`  
**Líneas Cambiadas**: 1100-1115, 387-411

