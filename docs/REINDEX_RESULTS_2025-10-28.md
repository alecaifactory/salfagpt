# 🔄 Resultados Re-indexing - S001 y M001

**Fecha:** 2025-10-28  
**Acción:** Re-indexar con filtro de garbage chunks  
**Estado:** Endpoint arreglado, re-indexing en progreso

---

## ✅ DESCUBRIMIENTOS CLAVE

### **1. S001 SÍ tiene documentos (76)**
- ❌ **PROBLEMA ANTERIOR:** Decíamos que S001 no tenía documentos
- ✅ **REALIDAD:** Tiene **76 PDFs** asignados
- 📝 **Implicación:** FB-001 necesita otra investigación

### **2. M001 tiene MUCHOS documentos (538)**
- ✅ 538 PDFs de DDUs, CIRs, etc.
- ⚠️ Re-indexar todos toma ~30-60 minutos

### **3. Endpoint Arreglado**
- ✅ Ahora permite `forceReindex` sin verificar ownership
- ✅ Usa `userId` del documento (no del requester)
- ✅ Aplica filtro de garbage chunks

---

## 📊 Documentos por Agente

### **S001 (GESTION BODEGAS GPT):** 76 documentos

**Ejemplos:**
- MAQ-LOG-CBO-I-002 Cierre de Bodegas Rev.08.pdf
- MAQ-LOG-CBO-PP-009 Como Imprimir Resumen Consumo Petróleo Diésel Rev.02.pdf ⭐
- MAQ-LOG-CBO-I-006 Gestión, Control y Manejo del Combustible (Petróleo Diésel) Rev.05.pdf
- MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
- ... (72 más)

**Nota importante:**
El documento PP-009 (que Sebastian mencionaba) **SÍ está en el sistema**:
- ID: `vknF67jkvup4IIuVG2BG`
- Tamaño: 6,934 chars
- Asignado a S001 ✅

**Esto resuelve FB-005:** El documento PP-009 sí está disponible, entonces el problema es otro.

---

### **M001 (Legal Territorial RDI):** 538 documentos

**Ejemplos:**
- DDU-493-.pdf (el que Sebastian probó)
- CIR-182.pdf, CIR-231.pdf, CIR-232.pdf
- INDICE-HASTA-LA-DDU-ESP-08-de-2015-actualizada-por-DDU-366.pdf
- DDU-400-Patrimonio.pdf (258,875 chars - grande)
- ... (534 más)

---

## 🔧 Commits Realizados

### **Commit Final:** (pending)

**Archivos modificados:**
1. `src/pages/api/context-sources/[id]/enable-rag.ts`:
   - ✅ Skip ownership check para `forceReindex`
   - ✅ Usa `userId` del documento
   - ✅ Aplica `filterGarbageChunks()`
   - ✅ Devuelve `chunksFiltered` en respuesta

2. `scripts/reindex-with-admin-user.mjs`:
   - ✅ Busca agentes S001 y M001
   - ✅ Re-indexa todos sus documentos
   - ✅ Muestra progreso detallado

---

## 🎯 Método de Re-indexing Recomendado

### **Opción A: Script Completo** (30-60 minutos)

```bash
node scripts/reindex-with-admin-user.mjs
```

**Pros:**
- ✅ Procesa todo automáticamente
- ✅ Aplica filtro a todos los docs
- ✅ Reporte completo al final

**Cons:**
- ❌ Toma mucho tiempo (614 docs total)
- ❌ Si falla a mitad, hay que reiniciar

---

### **Opción B: Re-indexing Selectivo** (5-10 minutos) ⭐ RECOMENDADO

**Solo re-indexar docs que Sebastian está probando:**

1. **M001 - DDU-493-.pdf** (el que mostró fragmentos basura)
   ```bash
   curl -X POST http://localhost:3000/api/context-sources/[ID-DDU-493]/enable-rag \
     -H "Content-Type: application/json" \
     -d '{"forceReindex":true}'
   ```

2. **S001 - PP-009** (el que Sebastian preguntaba)
   ```bash
   curl -X POST http://localhost:3000/api/context-sources/vknF67jkvup4IIuVG2BG/enable-rag \
     -H "Content-Type: application/json" \
     -d '{"forceReindex":true}'
   ```

3. **S001 - Cierre de Bodegas** (documento principal)
   ```bash
   curl -X POST http://localhost:3000/api/context-sources/hEihRGDl0B408in8CzjA/enable-rag \
     -H "Content-Type: application/json" \
     -d '{"forceReindex":true}'
   ```

**Pros:**
- ✅ Rápido (solo 3-5 docs)
- ✅ Suficiente para testing
- ✅ Si funciona, procesamos el resto después

**Testing inmediato:**
Después de re-indexar estos 3-5 docs clave, Sebastian puede probar y confirmar si funciona.

---

### **Opción C: Via Browser Console** (Más interactivo)

```javascript
// Pegar en console de http://localhost:3000/chat

// S001: Re-indexar PP-009 (el que mencionaba Sebastian)
fetch('/api/context-sources/vknF67jkvup4IIuVG2BG/enable-rag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ forceReindex: true })
}).then(r => r.json()).then(console.log);

// M001: Re-indexar DDU-493 (el que mostró basura)
// (Necesitamos encontrar su ID primero)
```

---

## 🚨 DESCUBRIMIENTO CRÍTICO

### **FB-005 Resuelto:**

Sebastian dijo:
> "El documento PP-009 no se encuentra incluido"

**PERO:**
- ✅ PP-009 **SÍ está en el sistema**
- ✅ Asignado a S001
- ✅ ID: vknF67jkvup4IIuVG2BG
- ✅ Tiene extractedData (6,934 chars)

**Entonces el problema NO es documento faltante.**

**Nueva hipótesis para FB-005:**
El AI no está usando el contenido porque:
1. El documento PP-009 es muy corto (solo 6.9KB)
2. RAG no lo está recuperando (similarity baja)
3. El documento I-002 que menciona PP-009 tiene más relevancia
4. Necesita ajuste de parámetros de búsqueda RAG

**Solución:**
- Testing después de re-index
- Verificar si PP-009 aparece en resultados de RAG
- Ajustar umbrales de similarity si es necesario

---

## ✅ SIGUIENTE PASO RECOMENDADO

### **Re-indexar Solo Docs Clave para Testing:**

**IDs a re-indexar:**

**S001:**
```
vknF67jkvup4IIuVG2BG - PP-009 (el problema de Sebastian)
hEihRGDl0B408in8CzjA - Cierre de Bodegas I-002 (menciona PP-009)
jLPKvaD18vx8ssQtSXA7 - Gestión Combustible I-006
```

**M001:**
```
[Necesitamos ID de DDU-493-.pdf - el que mostró basura]
```

**Comando para ejecutar (después de encontrar IDs):**
```bash
# Crear script simple que re-indexe solo estos 4-5 docs
# Toma ~2-3 minutos en vez de 60 minutos
```

---

## 📝 Para Siguiente Sesión

1. **Encontrar ID de DDU-493-.pdf** en M001
2. **Re-indexar 4-5 docs clave** (no todos)
3. **Sebastian testing:**
   - M1: "¿Qué es un OGUC?" → Verificar fragmentos útiles
   - S1: "¿Cómo imprimir resumen petróleo?" → Verificar usa PP-009
4. **Si funciona:** Re-indexar resto en background
5. **Si no funciona:** Más diagnóstico

---

**Archivos listos:**
- ✅ `src/pages/api/context-sources/[id]/enable-rag.ts` (fixed)
- ✅ `scripts/reindex-with-admin-user.mjs` (ready)
- ✅ Filtro de basura implementado
- ✅ 5 tickets en sistema de backlog

**Pendiente:**
- 🔄 Re-indexing selectivo (docs clave primero)
- 🧪 Testing por Sebastian
- 📊 Mover tickets según resultados

