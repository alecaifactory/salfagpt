# 🔄 Cómo Ver la Nueva Sección de Chunks

## ✅ El código está implementado correctamente

Los cambios están en el archivo y el servidor está corriendo, pero necesitas **limpiar el caché del navegador** para ver la nueva UI.

---

## 🚀 Pasos para Refrescar (Elige UNO)

### Opción 1: Hard Refresh (Más Rápido) ⭐
```
1. En la página del modal, presiona:
   - Mac: Cmd + Shift + R
   - Windows/Linux: Ctrl + Shift + R

2. Cierra el modal y vuelve a abrirlo
```

### Opción 2: Limpiar Caché Completamente
```
1. Abre DevTools (F12 o Cmd+Option+I)
2. Click derecho en el botón de refresh
3. Selecciona "Empty Cache and Hard Reload"
```

### Opción 3: Ventana Incógnito (100% Seguro)
```
1. Abre ventana incógnita: Cmd+Shift+N (Mac) o Ctrl+Shift+N (Windows)
2. Ve a http://localhost:3000/chat
3. Login
4. Abre cualquier documento con RAG habilitado
```

---

## 🎯 Qué Deberías Ver

Cuando abras un documento con RAG habilitado (como Cir35.pdf):

```
Right column (columna derecha):

┌─────────────────────────────────────┐
│ 📊 Indexación RAG                   │
│ ✓ RAG habilitado                    │
│ Búsqueda inteligente activa con 4   │
│ chunks                               │
│                                      │
│ Total de chunks: 4                  │
│ Tokens totales: 1,529               │
│ Tamaño promedio: 382 tokens        │
│ Dimensiones de embedding: 768       │
│ Indexado: 20 oct 2025, 08:45       │
│                                      │
│ [🔄 Re-indexar con RAG]            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 📄 Fragmentos (Chunks) del Último   │ ← NUEVA SECCIÓN
│    Índice                            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Total    Tokens    Promedio     │ │
│ │   4      1,529      382 tokens  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Chunk #0           393 tokens   │ │
│ │ Pág 1                           │ │
│ │                                  │ │
│ │ Aquí está el texto completo     │ │
│ │ del documento, incluyendo su... │ │
│ │                                  │ │
│ │ 1,571 caracteres                │ │
│ │         Click para ver completo →│ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Chunk #1           511 tokens   │ │
│ │ Pág 1                           │ │
│ │                                  │ │
│ │ "Artículo 13.- Los propieta...  │ │
│ │                                  │ │
│ │ 2,044 caracteres                │ │
│ │         Click para ver completo →│ │
│ └─────────────────────────────────┘ │
│                                      │
│ [Más chunks... scrollable]          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 👁️ Archivo Original                │
│ Available in Cloud Storage          │
│ [Ver archivo]                       │
└─────────────────────────────────────┘
```

---

## 🔍 Verificación Rápida

Si después de refrescar **NO ves** la sección de chunks:

1. **Verifica que el documento tiene RAG habilitado**
   - Debe mostrar "✓ RAG habilitado" en verde
   - Debe tener "Total de chunks: X" en la sección superior

2. **Abre la consola del navegador** (F12)
   - Busca el mensaje: "✅ Loaded X chunks for [nombre]"
   - Si ves error, cópialo y muéstralo

3. **Revisa la URL del modal**
   - Debe ser el modal de "Configuración del Documento"
   - NO el modal simple de contexto

---

## 💡 Características de la Nueva Sección

### Stats Card (Resumen)
- Total de chunks
- Tokens totales
- Tamaño promedio
- Fondo indigo claro

### Chunk Cards (Lista)
- Cada chunk es clickable
- Muestra preview de 3 líneas
- Badge con número de chunk (Chunk #0, #1, etc.)
- Número de página (si disponible)
- Contador de tokens
- Hover: "Click para ver completo →"

### Chunk Detail Modal (Al hacer click)
- Texto completo del chunk
- Metadata: índice, páginas, posición, tokens
- Preview del embedding vector (primeros 20 valores)
- Botón para cerrar

---

## 🚨 Si Aún No Se Ve

1. **Reinicia el servidor:**
   ```bash
   # Mata el proceso
   pkill -f "astro dev"
   
   # Espera 2 segundos
   sleep 2
   
   # Reinicia
   npm run dev
   ```

2. **Luego hard refresh en el navegador**

3. **Verifica que estás viendo el documento correcto:**
   - Debe tener RAG habilitado
   - Debe tener chunks creados (no solo indexación pendiente)

---

**Commit aplicado:** 4d7fa9a  
**Archivo modificado:** `src/components/ContextSourceSettingsModal.tsx`  
**Líneas:** +89, -87 (reposicionamiento de la sección)

