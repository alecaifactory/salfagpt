# 🔄 INSTRUCCIONES PARA VER LA NUEVA UI

## ✅ El código está correcto - Solo necesitas limpiar el caché

**Commits aplicados:**
- `4d7fa9a` - Chunks movidos a posición correcta (entre RAG y Archivo Original)
- `4b646d9` - Feature de chunks implementada

---

## 🚀 PASO A PASO - Limpiar Caché en Chrome

### 1. Abre DevTools
Presiona **F12** o **Cmd + Option + I** (Mac)

### 2. Abre la pestaña Application
Click en "**Application**" en la barra superior de DevTools

### 3. Clear Site Data
1. En el panel izquierdo, busca "**Storage**"
2. Click en "**Clear site data**"
3. Click en el botón azul "**Clear site data**"

### 4. Reload
**Hard reload:** Presiona **Cmd + Shift + R** (Mac) o **Ctrl + Shift + R** (Windows)

---

## 🎯 Qué Deberías Ver Después

Cuando abras el modal de "Configuración del Documento" para Cir35.pdf:

### Columna Izquierda:
```
┌─────────────────────────────────┐
│ 📄 Texto Extraído               │ ← MAX 40vh (50% del modal)
│ [texto extraído con scroll]     │
│                                 │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ ⚡ Información de Extracción    │
│ [stats de extracción]           │
└─────────────────────────────────┘
```

### Columna Derecha:
```
┌─────────────────────────────────┐
│ 📊 Indexación RAG               │
│ ✓ RAG habilitado                │
│ 4 chunks, 1,529 tokens          │
│ [Re-indexar con RAG]           │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 📄 Fragmentos (Chunks) del      │ ← NUEVA SECCIÓN
│    Último Índice                │   EXPANDIDA
│                                 │
│ Total: 4 | Tokens: 1,529        │
│ Promedio: 382 tokens            │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Chunk #0    393 tokens  │     │
│ │ Pág 1                   │     │
│ │ Aquí está el texto...   │     │
│ │ Click para ver completo →│     │
│ └─────────────────────────┘     │
│ ┌─────────────────────────┐     │
│ │ Chunk #1    511 tokens  │     │
│ │ Pág 1                   │     │
│ │ "Artículo 13.- Los...   │     │
│ │ Click para ver completo →│     │
│ └─────────────────────────┘     │
│ ┌─────────────────────────┐     │
│ │ Chunk #2    478 tokens  │     │
│ └─────────────────────────┘     │
│ ┌─────────────────────────┐     │
│ │ Chunk #3    147 tokens  │     │
│ └─────────────────────────┘     │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 👁️ Archivo Original            │
│ Available in Cloud Storage      │
│ [Ver archivo]                   │
└─────────────────────────────────┘
```

---

## 🔍 Verificación Rápida

Después de limpiar caché, abre la consola del navegador (F12 → Console) y deberías ver:

```
✅ Loaded 4 chunks for Cir35.pdf
```

Si ves este mensaje, significa que los chunks se cargaron correctamente.

---

## ⚡ Opción Más Rápida: Ventana Incógnito

Si tienes prisa:

```
1. Cmd + Shift + N (abre ventana incógnito)
2. Ve a: http://localhost:3000/chat
3. Login con tu cuenta
4. Abre Cir35.pdf
5. Verás la UI nueva inmediatamente
```

---

## 🐛 Si Aún No Funciona

1. **Reinicia el servidor de dev:**
   ```bash
   # En terminal
   pkill -f "astro dev"
   npm run dev
   ```

2. **Verifica el archivo está actualizado:**
   ```bash
   grep "Fragmentos.*Chunks.*Último" src/components/ContextSourceSettingsModal.tsx
   # Debe retornar una línea
   ```

3. **Verifica los commits:**
   ```bash
   git log --oneline -2
   # Debe mostrar:
   # 4d7fa9a fix: Move chunks section below RAG...
   # 4b646d9 feat: Add chunks display in document...
   ```

---

**El código está 100% funcionando. Solo es un tema de caché del navegador.** 🎯

Usa **Cmd + Shift + R** o **ventana incógnito** y lo verás!
