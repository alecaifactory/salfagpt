# 🔍 Instrucciones para Debugging - Click en Documentos

## Problema

Al hacer click en un documento en el modal de "Configuración de Contexto", no se muestra el panel de detalles.

---

## ✅ Cambios Implementados

He agregado logs de debug extensivos al componente `AgentContextModal.tsx`:

1. **En el click del documento:** Log cuando se hace click
2. **En loadDocumentDetails:** Logs del flujo completo de carga
3. **En la respuesta del API:** Log del status y datos recibidos

---

## 📋 Pasos para Diagnosticar

### 1. Abrir Consola del Navegador

Presiona **F12** o **Cmd+Option+I** (Mac) para abrir Developer Tools

### 2. Ir a la pestaña "Console"

Asegúrate de estar en la pestaña "Console" para ver los logs

### 3. Reproducir el Problema

1. Ve a https://salfagpt.salfagestion.cl/chat
2. Selecciona agente **S2-v2**
3. Click en el ícono de configuración (⚙️) junto al nombre del agente
4. Se abre modal "Configuración de Contexto"
5. Si no están cargados, click en **"Cargar Documentos"**
6. **Click en cualquier documento de la lista**

### 4. Revisar los Logs en Consola

Deberías ver una secuencia como esta:

```
🖱️ Document clicked: Manual de Operaciones Scania P450 B 8x4.pdf ID: abc123
🔍 loadDocumentDetails called with sourceId: abc123
📥 Loading full details for: abc123
📡 Response status: 200
📦 Response data: {source: {...}}
📄 Setting selectedDocument to: Manual de Operaciones Scania P450 B 8x4.pdf
✅ Loaded full source: Manual de Operaciones Scania P450 B 8x4.pdf
```

---

## 🐛 Posibles Problemas y Diagnóstico

### Caso 1: No aparece "🖱️ Document clicked"

**Problema:** El evento onClick no se está ejecutando  
**Causas posibles:**
- Elemento está cubierto por otro (z-index)
- Event listener no está attachado
- Página no recargó después del deploy

**Solución:**
1. Hacer hard refresh: **Cmd+Shift+R** (Mac) o **Ctrl+Shift+R** (Windows)
2. Limpiar cache del navegador
3. Verificar que el botón sea clickeable (no disabled)

### Caso 2: Aparece click pero no aparece "📥 Loading"

**Problema:** La función loadDocumentDetails no se está llamando  
**Solución:** Verificar que no haya error de JavaScript antes del call

### Caso 3: Aparece "📡 Response status: 401"

**Problema:** No estás autenticado  
**Solución:** 
1. Logout y login nuevamente
2. Verificar que la cookie de sesión esté presente

### Caso 4: Aparece "📡 Response status: 404"

**Problema:** El documento no se encuentra en Firestore  
**Solución:** El documento puede haber sido eliminado

### Caso 5: Aparece "📡 Response status: 403"

**Problema:** El documento pertenece a otro usuario  
**Solución:** Verificar userId en Firestore vs session

### Caso 6: Status 200 pero no se muestra panel

**Problema:** `data.source` está undefined o malformado  
**Logs a revisar:**
```
📦 Response data: {...}
```

Si el response data no tiene `source`, hay un problema en el API

---

## 🔧 Endpoints del API a Verificar

### GET /api/context-sources/[id]

**Ubicación:** `src/pages/api/context-sources/[id].ts`

**Debe retornar:**
```json
{
  "source": {
    "id": "abc123",
    "name": "Manual...",
    "extractedData": "...",
    "metadata": {...},
    "ragEnabled": true,
    "ragMetadata": {...}
  }
}
```

### GET /api/agents/[id]/context-sources

**Parámetros:** `?page=0&limit=10`

**Debe retornar:**
```json
{
  "sources": [{...}],
  "total": 350,
  "hasMore": true
}
```

---

## 📸 Qué Compartir si No Funciona

Si después de seguir estos pasos el problema persiste, comparte:

1. **Screenshot de la consola** con los logs completos
2. **Screenshot del modal** mostrando el estado actual
3. **Network tab** mostrando la request a `/api/context-sources/[id]`

Con esa información podré identificar exactamente dónde está fallando el flujo.

---

## ✅ Verificación Exitosa

Cuando funcione correctamente, deberías ver:

1. **Click en documento:** Log "🖱️ Document clicked"
2. **Panel izquierdo:** Documento seleccionado con borde azul
3. **Panel derecho:** 
   - Nombre del documento
   - Metadata (páginas, tokens, etc.)
   - Preview del texto extraído
   - Botón "Ver Detalles Completos"
   - Botón "Quitar"

---

**Commit:** 87a2583  
**Fecha:** 2025-11-24  
**Cambios:** Logs de debug agregados a AgentContextModal.tsx




