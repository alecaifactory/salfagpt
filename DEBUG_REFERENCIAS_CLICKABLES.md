# 🔍 Debug: Referencias Clicables

**Problema Reportado:** Referencias `[1]` aparecen pero no son clicables  
**Fix Aplicado:** DOM manipulation con TreeWalker post-render  
**Commit:** `14d6c7d`

---

## 🔧 Qué Cambió en el Fix

### Problema Original

**Antes:**
- ReactMarkdown parseaba el contenido
- Intentábamos procesar `[1]` dentro del componente `p`
- Los componentes custom no funcionaban correctamente
- Resultado: `[1]` aparecía como texto plano

### Solución Implementada

**Ahora:**
1. ReactMarkdown renderiza el contenido normalmente
2. `useEffect` ejecuta DESPUÉS del render
3. `TreeWalker` busca todos los text nodes con `[1]`, `[2]`, etc.
4. Reemplaza esos text nodes con botones clicables
5. Resultado: `[1]` son botones funcionales ✅

---

## 🧪 Cómo Verificar en el Browser

### Paso 1: Abre DevTools Console

**Presiona:** `Cmd+Option+J` (Mac) o `F12` (Windows/Linux)

### Paso 2: Haz Click Derecho en `[1]`

**Click derecho en el número `[1]` → Inspect Element**

**Debes ver:**
```html
<sup>
  <button 
    class="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold px-0.5 hover:underline transition-colors cursor-pointer"
    title="Ver referencia 1"
  >
    [1]
  </button>
</sup>
```

**SI VES:**
```html
<p>...texto con [1] como texto plano...</p>
```
→ ❌ El DOM manipulation no está funcionando

### Paso 3: Verifica Logs en Console

**Busca en Console:**

```javascript
// Debe aparecer al cargar mensaje:
"📥 Mensaje AI recibido con referencias:", 2
// ↑ Número de referencias encontradas

// Cuando haces click en [1]:
"🔍 Referencia seleccionada:", {id: 1, snippet: "..."}
```

**Si no ves estos logs:**
- El problema está antes del rendering
- Verifica que `msg.references` tiene datos

### Paso 4: React DevTools

**Abre:** React DevTools tab

**Navega a:**
```
Components → MessageRenderer
  Props:
    content: "...texto..."
    references: [...] ← DEBE TENER DATOS
```

**Si `references` está vacío:**
- Problema en el API endpoint
- Las referencias no llegaron del backend

---

## 🐛 Debugging Paso a Paso

### Debug 1: ¿El AI genera referencias?

**Cómo verificar:**
1. Abre Network tab en DevTools
2. Envía mensaje
3. Busca request a `/api/conversations/.../messages`
4. Click en el request → Response tab
5. Busca: `"references": [...]`

**Esperado:**
```json
{
  "message": {...},
  "references": [
    {
      "id": 1,
      "sourceId": "abc123",
      "sourceName": "DDU 181...",
      "snippet": "las construcciones en subterráneo..."
    }
  ]
}
```

**Si no existe `references` en response:**
- El AI no está generando la sección REFERENCIAS
- Verifica que hay contexto activo (toggles verdes)
- Haz pregunta más específica sobre el documento

### Debug 2: ¿Las referencias llegan al componente?

**Cómo verificar:**

Agrega console.log temporal:

```typescript
// En MessageRenderer.tsx, línea ~30
console.log('📥 Referencias recibidas en renderer:', references);
```

**Esperado en Console:**
```
📥 Referencias recibidas en renderer: [{id: 1, snippet: "..."}, {id: 2, ...}]
```

**Si está vacío:**
- Problema en ChatInterfaceWorking
- Verifica que `msg.references` se está pasando

### Debug 3: ¿El useEffect se ejecuta?

**Cómo verificar:**

Agrega console.log en useEffect:

```typescript
// En MessageRenderer.tsx, línea ~34
React.useEffect(() => {
  console.log('🔧 useEffect ejecutado, references:', references?.length);
  if (!contentRef.current || !references || references.length === 0) {
    console.log('⚠️ Saltando: no hay referencias o ref no disponible');
    return;
  }
  
  console.log('✅ Procesando referencias con TreeWalker...');
  // ... resto del código
}, [references]);
```

**Esperado en Console:**
```
🔧 useEffect ejecutado, references: 2
✅ Procesando referencias con TreeWalker...
```

**Si ves "Saltando":**
- contentRef.current no está disponible
- O references está vacío

### Debug 4: ¿TreeWalker encuentra los text nodes?

**Cómo verificar:**

Agrega console.log en el walker:

```typescript
// Después del while loop, línea ~58
console.log('🔍 Nodos encontrados para reemplazar:', nodesToReplace.length);
nodesToReplace.forEach(n => {
  console.log('  → RefId:', n.refId, 'Texto:', n.node.textContent?.substring(0, 50));
});
```

**Esperado en Console:**
```
🔍 Nodos encontrados para reemplazar: 2
  → RefId: 1 Texto: ...disposiciones del PRC son de cumplimiento oblig...
  → RefId: 2 Texto: ...artículo 2.6.3. de la OGUC. Señala que la norm...
```

**Si está vacío:**
- TreeWalker no encuentra `[1]` en el texto
- Verifica que el content tiene `[1]` literal

---

## 🎯 Quick Fix Test

Voy a agregar logs para debugging. **Refresca la página después de que actualice el código:**

### Test Manual Simple

1. **Inspecciona el elemento `[1]`:**
   - Click derecho en `[1]` → Inspect
   - Debe ser un `<button>`, no un `<span>`

2. **Verifica que el botón tiene onClick:**
   - En Elements tab, click en el `<button>`
   - Event Listeners tab → Click → Debe haber handler

3. **Intenta click directo en Console:**
   ```javascript
   document.querySelector('button[title*="Ver referencia"]').click()
   ```
   - Si funciona: El botón existe pero hay problema de styling/evento
   - Si error: El botón no existe en el DOM

---

## 🚨 Posibles Causas y Fixes

### Causa 1: useEffect no se ejecuta

**Síntoma:** `[1]` es texto plano, no hay `<button>` en DOM

**Fix:** Verificar que ContentWithReferences se renderiza

### Causa 2: TreeWalker no encuentra text nodes

**Síntoma:** useEffect se ejecuta pero no reemplaza nada

**Fix:** Verificar que `contentRef.current` tiene contenido

### Causa 3: Referencias vacías

**Síntoma:** useEffect retorna early porque `references.length === 0`

**Fix:** Verificar que API devuelve `references` en response

### Causa 4: Timing issue

**Síntoma:** useEffect ejecuta antes que ReactMarkdown termine

**Fix:** Agregar segundo `useEffect` que escuche cambios en `content`

---

## 🔧 Fix Inmediato: Agregar Debug Logs

Voy a actualizar MessageRenderer con logs para debugging...

