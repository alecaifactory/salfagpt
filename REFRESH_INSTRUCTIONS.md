# 🔄 INSTRUCCIONES DE REFRESH FORZADO

## ✅ Servidor reiniciado - Componente actualizado

**Versión del componente:** v2025-10-20-15:00  
**Commits aplicados:** 34fd7ec, 05f95f5, 4d7fa9a, 4b646d9

---

## 🚨 PASO 1: Cerrar TODO

1. **Cierra el modal** que tienes abierto (click en X o "Cerrar")
2. **Cierra la pestaña** de Chrome completamente
3. **Espera 3 segundos**

---

## 🚨 PASO 2: Limpiar Caché de Chrome

### Opción A: DevTools (Recomendado)
1. Abre Chrome
2. Ve a `http://localhost:3000/chat`
3. **Abre DevTools:** Presiona **F12** (o Cmd+Option+I en Mac)
4. **Click derecho en el botón de reload** (arriba a la izquierda del navegador)
5. Selecciona: **"Empty Cache and Hard Reload"** o **"Vaciar caché y recargar de forma forzada"**

### Opción B: Manual (Si DevTools no funciona)
1. Abre Chrome
2. Presiona **Cmd + Shift + Delete** (Mac) o **Ctrl + Shift + Delete** (Windows)
3. Selecciona:
   - Time range: **Last hour** (última hora)
   - ✅ **Cached images and files** (imágenes y archivos en caché)
   - ✅ **Cookies and site data** (cookies y datos del sitio)
4. Click **Clear data** (borrar datos)
5. Cierra y vuelve a abrir Chrome

### Opción C: Incógnito (Más rápido)
1. **Cmd + Shift + N** (abre ventana incógnito)
2. Ve a `http://localhost:3000/chat`
3. Login
4. Abre Cir35.pdf

---

## 🚨 PASO 3: Verificar en la Consola

Cuando abras el modal de Cir35.pdf, **abre la consola del navegador** (F12 → Console)

**Deberías ver estos mensajes:**

```
🎨 [MODAL v2025-10-20-15:00] Rendering ContextSourceSettingsModal
   Source: Cir35.pdf
   Chunks loaded: 0
   RAG enabled: true

🔄 [CHUNKS MODAL v2025-10-20] Loading chunks for: Cir35.pdf
   RAG enabled: true
   RAG metadata: {chunkCount: 4, ...}

✅ [CHUNKS MODAL v2025-10-20] Loaded 4 chunks for Cir35.pdf
   Chunks should now be visible in UI below "Indexación RAG"
```

**Si ves estos mensajes:** El componente nuevo se está cargando ✅

**Si NO ves estos mensajes:** Aún estás viendo la versión en caché ❌

---

## 🎯 Qué Deberías Ver

### Columna Derecha (después de refresh):

```
┌─────────────────────────────────────────┐
│ 📊 Indexación RAG                       │
│ ✓ RAG habilitado                        │
│ 4 chunks, 1,529 tokens                  │
│ [Re-indexar con RAG]                   │
└─────────────────────────────────────────┘
              ↓ INMEDIATAMENTE DEBAJO
┌─────────────────────────────────────────┐
│ 📄 Fragmentos (Chunks) del Último       │
│    Índice                               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Total    Tokens    Promedio         │ │
│ │   4      1,529      382 tokens      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Chunk #0         393 tokens            │
│ Pág 1                                  │
│ Aquí está el texto...                  │
│ [3 líneas preview]                     │
│ ────────────────────────────────────── │
│                                         │
│ Chunk #1         511 tokens            │
│ Pág 1                                  │
│ "Artículo 13...                        │
│ [3 líneas preview]                     │
│ ────────────────────────────────────── │
│                                         │
│ Chunk #2         478 tokens            │
│ Chunk #3         147 tokens            │
│                                         │
│ [Lista scrollable - max 96 height]     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 👁️ Archivo Original                    │
│ Available in Cloud Storage              │
│ [Ver archivo]                          │
└─────────────────────────────────────────┘
```

---

## 🔍 Si TODAVÍA No Se Ve

### Verifica que el servidor se reinició:
```bash
ps aux | grep "astro dev" | grep -v grep
# Debe mostrar un proceso de astro dev
```

### Revisa que el archivo está actualizado:
```bash
grep "CHUNKS MODAL v2025-10-20" src/components/ContextSourceSettingsModal.tsx
# Debe retornar 2-3 líneas con este texto
```

### Verifica el puerto:
```bash
lsof -i :3000
# Debe mostrar node/astro en el puerto 3000
```

---

## ⚡ MÉTODO NUCLEAR (Si nada funciona)

```bash
# 1. Mata TODO
pkill -f "astro dev"
pkill -f "node"

# 2. Limpia build cache
rm -rf .astro dist node_modules/.vite

# 3. Reinstala
npm install

# 4. Reinicia
npm run dev

# 5. Espera 10 segundos

# 6. Abre NUEVA ventana incógnito
# Cmd + Shift + N
# http://localhost:3000/chat
```

---

## 📝 Checklist de Verificación

- [ ] Servidor reiniciado (proceso astro dev corriendo)
- [ ] Consola del navegador muestra logs v2025-10-20-15:00
- [ ] Modal muestra "Fragmentos (Chunks)" como sección expandida
- [ ] Chunks aparecen ENTRE "Indexación RAG" y "Archivo Original"
- [ ] Texto Extraído limitado a ~40vh de altura

---

**Servidor reiniciado. Ahora abre el navegador en VENTANA INCÓGNITO para ver la versión fresca.** 🎯
