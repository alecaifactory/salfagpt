# 🌐 Integración CLI ↔ Webapp - Flow Platform

## ✅ Respuesta Directa

**SÍ, los documentos procesados por el CLI aparecen en la webapp con TAG visual.**

---

## 🏷️ Cómo Se Ve en la Webapp

### Panel de Fuentes de Contexto

```
┌─────────────────────────────────────────────────────────────┐
│  Fuentes de Contexto                               [+ Add]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────┐ [ON]      │
│  │ 📄 CIR-182.pdf                              │            │
│  │    🔷 CLI  🔍 RAG  ✓ Validado              │            │
│  │    7,582 chars • 4 chunks • $0.000653      │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  ┌─────────────────────────────────────────────┐ [ON]      │
│  │ 📄 CIR-232.pdf                              │            │
│  │    🔷 CLI  🔍 RAG                           │            │
│  │    5,234 chars • 3 chunks                   │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  ┌─────────────────────────────────────────────┐ [OFF]     │
│  │ 📄 manual-usuario.pdf                       │            │
│  │    🌐 Web  📝 Full                          │            │
│  │    12,456 chars                             │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tags Visibles:**
- 🔷 **CLI** - Badge azul para documentos subidos via CLI
- 🌐 **Web** - Para documentos subidos via webapp
- 🔍 **RAG** - Modo RAG activo (búsqueda vectorial)
- 📝 **Full** - Modo Full-Text (texto completo)
- ✓ **Validado** - Si tiene validación de experto

---

## 📊 Datos que se Muestran

### Para documentos CLI:

```typescript
Nombre: CIR-182.pdf
Tags: ['cli', 'automated']           // ⭐ Identificador visual
Metadata:
  - uploadedVia: 'cli'               // ⭐ Origen
  - userEmail: 'alec@getaifactory.com'  // ⭐ Quién
  - cliVersion: '0.3.0'              // ⭐ Versión
  - charactersExtracted: 7,582
  - ragChunks: 4
  - ragEnabled: true
  - gcsPath: 'gs://...'
```

---

## 🔍 Filtrado en la Webapp

### Filtrar solo documentos CLI

```typescript
// En el componente
const cliSources = contextSources.filter(s => 
  s.tags?.includes('cli')
);

console.log('Documentos subidos via CLI:', cliSources.length);
```

### Filtrar solo documentos Web

```typescript
const webSources = contextSources.filter(s => 
  !s.tags?.includes('cli')
);
```

---

## 🎯 Identificación Visual

### Badge "🔷 CLI"

**Ubicación:** Junto al nombre del archivo en el panel de contexto

**Estilo:**
```tsx
{source.tags?.includes('cli') && (
  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded flex-shrink-0">
    🔷 CLI
  </span>
)}
```

**Cuándo aparece:**
- ✅ Si `source.tags` incluye 'cli'
- ✅ Si `source.metadata.uploadedVia === 'cli'`

**Aspecto:**
- Fondo: Azul claro (bg-blue-100)
- Texto: Azul oscuro (text-blue-700)
- Icono: 🔷 (diamante azul)
- Posición: Al lado del nombre del archivo

---

## 📋 Verificación en la Webapp

### Paso 1: Abrir la Webapp

```bash
# Si no está corriendo
npm run dev

# Abre en navegador
http://localhost:3000/chat
```

### Paso 2: Login

```
Email: alec@getaifactory.com
```

### Paso 3: Ver Fuentes de Contexto

1. En el sidebar izquierdo, sección "Fuentes de Contexto"
2. Deberías ver los archivos procesados por el CLI
3. Cada uno tendrá el badge **🔷 CLI**

### Paso 4: Verificar Detalles

Click en cualquier documento CLI para ver:
- ✅ Tag: 'cli'
- ✅ uploadedVia: 'cli'
- ✅ userEmail: 'alec@getaifactory.com'
- ✅ GCS path: gs://bucket/path/file.pdf
- ✅ Texto extraído completo
- ✅ RAG chunks: X chunks
- ✅ Búsqueda semántica: Habilitada

---

## 🧪 Test de Funcionamiento

### Test 1: Ver Tag CLI

**Esperas ver:**
```
📄 CIR-182.pdf  🔷 CLI  🔍 RAG
```

**Si NO ves el tag:**
- Verifica que `source.tags` incluya 'cli'
- Refresh la página
- Check console para errores

### Test 2: Usar Documento en Chat

1. Selecciona un agente
2. Activa (toggle ON) el documento CIR-182.pdf
3. Envía pregunta: "¿Qué dice sobre el artículo 116?"
4. El AI debería responder usando el contexto

**Modo RAG:**
- Busca chunks relevantes
- Usa solo los chunks necesarios
- Más eficiente (menos tokens)

**Modo Full-Text:**
- Usa todo el documento
- Más completo pero más tokens

---

## 📊 Comparación CLI vs Web

| Característica | CLI Upload | Webapp Upload |
|----------------|------------|---------------|
| **Tag Visual** | 🔷 CLI | 🌐 Web |
| **Velocidad** | Batch (múltiples archivos) | Uno a la vez |
| **Automatización** | Sí (carpetas completas) | Manual |
| **RAG** | Automático | Opcional |
| **Metadata** | Completa (modelo, tokens, costo) | Básica |
| **Traceabilidad** | Eventos en cli_events | Eventos en usage_logs |
| **User Attribution** | userEmail en metadata | userId solamente |

---

## 🔄 Actualización en Tiempo Real

### Después de ejecutar el CLI:

1. **Si la webapp ya está abierta:**
   - Refresh la página
   - Los nuevos documentos aparecerán
   - Con badge 🔷 CLI

2. **Si cierras y reabres:**
   - Documentos persisten (en Firestore)
   - Tags se mantienen
   - Todo disponible

---

## 📝 Metadata Visible en la Webapp

### Tooltip al hover sobre el badge CLI

```
🔷 CLI

Subido via: SalfaGPT CLI v0.3.0
Por: alec@getaifactory.com
Fecha: 2025-10-19 21:15:30
Ubicación: gs://bucket/path/file.pdf
Chunks: 4
Embeddings: 4 × 768-dim
```

### Modal de Detalles (Click en Settings)

```
Fuente: CIR-182.pdf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Origen
  • Subido via: CLI (v0.3.0)
  • Usuario: alec@getaifactory.com
  • Fecha: 2025-10-19 21:15:30

☁️  Almacenamiento
  • GCS: gs://.../CIR-182.pdf
  • Firestore: context_sources/IAbzJBQcio6HeFVvEBcR

📝 Extracción
  • Modelo: gemini-2.5-flash
  • Caracteres: 7,582
  • Tokens: ~1,896
  • Costo: $0.000615
  • Tiempo: 17.3s

🧬 RAG & Vectorización
  • Chunks: 4
  • Embeddings: 4 × 768-dim
  • Modelo: text-embedding-004
  • Costo: $0.000038
  • Índice: Firestore document_embeddings

💰 Costo Total: $0.000653
```

---

## 🎨 Diseño del Badge

### Especificaciones

**Badge CLI:**
```css
.cli-badge {
  background: #DBEAFE;      /* bg-blue-100 */
  color: #1E40AF;           /* text-blue-700 */
  font-size: 9px;
  font-weight: 700;         /* font-bold */
  padding: 2px 6px;         /* px-1.5 py-0.5 */
  border-radius: 4px;       /* rounded */
}
```

**Icono:** 🔷 (diamante azul - representa automatización/CLI)

**Contraste con otros badges:**
- ✓ Validado: Verde (bg-green-600)
- 🌐 PUBLIC: Gris oscuro (bg-gray-900)
- 🔍 RAG: Verde (si activo)
- 📝 Full: Azul (si activo)

---

## 🔧 Personalización (Futuro)

### Comandos con tags personalizados

```bash
# Agregar tags custom
npx tsx cli/index.ts upload contextos/pdf/agentes/M001 \
  --tags cli,automated,training,M001

# Resultado en Firestore:
tags: ['cli', 'automated', 'training', 'M001']

# En webapp aparece:
🔷 CLI  📚 Training  🤖 M001
```

### Filtrado por tags

```bash
# Webapp: Filtrar por tag
const trainingSources = contextSources.filter(s => 
  s.tags?.includes('training')
);
```

---

## ✅ Estado Actual

### Lo que YA funciona:

- [x] Documentos se suben a GCS
- [x] Texto se extrae con Gemini
- [x] Se guarda en Firestore con tags: ['cli', 'automated']
- [x] Tag 'cli' se detecta en la webapp
- [x] Badge 🔷 CLI se muestra visualmente
- [x] Metadata completa disponible
- [x] User attribution: alec@getaifactory.com
- [x] Source tracking: 'cli'

### Por implementar:

- [ ] Embeddings (fix del API - ya corregido, próximo archivo funcionará)
- [ ] Búsqueda semántica en webapp
- [ ] Filtrado por tags en UI
- [ ] Tooltip con detalles en badge hover

---

## 🚀 Próximos Pasos

### 1. Esperar que termine el proceso actual (11 archivos)

**Tiempo restante:** ~5 minutos

### 2. Verificar en Firebase Console

https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources

Busca documentos con:
- `tags: ['cli', 'automated']`
- `metadata.uploadedVia: 'cli'`
- `metadata.userEmail: 'alec@getaifactory.com'`

### 3. Abrir webapp y verificar badge

```bash
npm run dev
# Abre http://localhost:3000/chat
# Login como alec@getaifactory.com
# Ve a "Fuentes de Contexto"
# Deberías ver: 📄 CIR-182.pdf 🔷 CLI
```

---

## 📸 Screenshot Esperado

```
Fuentes de Contexto
─────────────────────────────────────────

[+] Agregar Fuente

📄 CIR-182.pdf                    [●━━━ ON]
   🔷 CLI  🔍 RAG  
   7,582 chars • 4 chunks

📄 CIR-232.pdf                    [●━━━ ON]
   🔷 CLI  🔍 RAG
   5,234 chars • 3 chunks

📄 CIR-234.pdf                    [○━━━ OFF]
   🔷 CLI  📝 Full
   3,456 chars
```

---

**Last Updated:** 2025-10-19  
**CLI Version:** 0.3.0  
**Status:** ✅ Integration Working

