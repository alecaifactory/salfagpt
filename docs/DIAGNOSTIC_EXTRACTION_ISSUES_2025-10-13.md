# 🔍 Diagnóstico: Problemas de Extracción de PDFs
**Fecha:** 2025-10-13  
**Análisis:** Sistema de extracción con Gemini AI

---

## 📊 Hallazgos del Análisis

### Estadísticas
- **Total documentos:** 4
- **✅ Exitosos:** 3 (75%)
- **❌ Fallidos/Vacíos:** 1 (25%)

### Patrón Identificado

#### Documentos Exitosos
```
1. Igor Asaad CV: 123 KB → 3,605 caracteres ✅
2. CV Tomás Alarcón: 108 KB → 3,848 caracteres ✅
3. CV Tomás Alarcón (dup): 108 KB → 3,716 caracteres ✅

Promedio:
- Tamaño: ~113 KB
- Modelo: gemini-2.5-flash
- Extracción: Exitosa
```

#### Documento Fallido
```
SOC 2 eBook.pdf: 2.3 MB → 0 caracteres ❌

Características:
- Tamaño: 2,307 KB (20x más grande que exitosos)
- Modelo: gemini-2.5-flash
- Estado en Firestore: "active" (engañoso)
- extractedData: undefined/vacío
```

---

## 🚨 Problema Identificado

### Causa Raíz: Fallo Silencioso en Extracción

El documento "SOC 2 eBook.pdf" falló porque:

1. **Archivo muy grande (2.3 MB)**
   - Los CVs exitosos son ~110 KB
   - El eBook es 20x más grande

2. **Límite de tokens insuficiente**
   - Actual: `maxOutputTokens: 8192`
   - Para un PDF de 2.3 MB, esto puede ser muy poco
   - Gemini puede truncar o retornar vacío si excede el límite

3. **Modelo Flash limitado**
   - Flash es rápido y económico
   - Pero puede tener problemas con PDFs complejos/grandes
   - Pro tiene mejor manejo de documentos extensos

4. **Fallo silencioso**
   - ❌ **El sistema guardó status: "active"** a pesar de que extractedData está vacío
   - ✅ **Debería haber guardado status: "error"**

### Flujo Actual (Problemático)

```
PDF grande (2.3 MB)
    ↓
Gemini Flash con maxOutputTokens: 8192
    ↓
result.text = '' (vacío o truncado)
    ↓
API retorna success: true, text: '' ❌ PROBLEMA
    ↓
Frontend guarda con status: 'active' ❌ PROBLEMA
    ↓
Firestore: { status: 'active', extractedData: undefined } ❌ PROBLEMA
```

**El usuario ve:** ✓ Documento agregado (pero sin contenido)

---

## 🔧 Mejoras Propuestas

### 1. Validación de Extracción Exitosa

**Problema:** `result.text` vacío se marca como exitoso

**Solución:** Validar que el texto extraído no esté vacío

```typescript
// En src/pages/api/extract-document.ts (línea 122-130)

// ❌ ACTUAL:
if (!extractedText || extractedText.trim().length === 0) {
  return new Response(
    JSON.stringify({ 
      error: 'No text found in document',
      warning: 'The document may be empty or contain only images without text'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } } // ❌ Status 200!
  );
}

// ✅ MEJORADO:
if (!extractedText || extractedText.trim().length === 0) {
  return new Response(
    JSON.stringify({ 
      success: false, // ← Marcar como no exitoso
      error: 'No se pudo extraer texto del documento',
      details: 'El documento puede estar vacío, ser una imagen escaneada sin OCR, o exceder el límite de tokens',
      suggestions: [
        'Intenta re-extraer con modelo Pro (mejor manejo de documentos complejos)',
        'Verifica que el PDF contenga texto seleccionable (no solo imágenes)',
        'Si el documento es muy largo, aumenta el límite de tokens en configuración'
      ],
      metadata: {
        fileSize: file.size,
        fileName: file.name,
        attemptedModel: model
      }
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } } // ✅ Status 400
  );
}
```

### 2. Recomendación Automática de Modelo

**Problema:** Flash usado para archivos grandes que requieren Pro

**Solución:** Detectar tamaño y recomendar modelo

```typescript
// En src/pages/api/extract-document.ts (después de validar tamaño)

// Recommend Pro for large files
let recommendedModel = model;
let modelWarning = undefined;

if (file.size > 1 * 1024 * 1024 && model === 'gemini-2.5-flash') {
  // File > 1 MB
  modelWarning = {
    currentModel: 'gemini-2.5-flash',
    recommendedModel: 'gemini-2.5-pro',
    reason: 'Archivo grande (>1 MB) - Pro maneja mejor documentos extensos',
    fileSize: file.size,
    fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
  };
  console.log('⚠️ Large file detected, Pro model recommended:', modelWarning);
}

// Include in response
return new Response(
  JSON.stringify({
    success: true,
    extractedText: extractedText,
    metadata: {
      ...documentMetadata,
      modelWarning // ← Incluir advertencia
    }
  }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);
```

### 3. Aumentar maxOutputTokens para PDFs Grandes

**Problema:** 8192 tokens es insuficiente para documentos largos

**Solución:** Escalar dinámicamente según tamaño del archivo

```typescript
// En src/pages/api/extract-document.ts (línea 113-116)

// ❌ ACTUAL: Fixed limit
config: {
  temperature: 0.1,
  maxOutputTokens: 8192,
}

// ✅ MEJORADO: Dynamic limit based on file size
const calculateMaxOutputTokens = (fileSizeBytes: number, model: string): number => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  
  if (model === 'gemini-2.5-pro') {
    // Pro has 2M context, can handle larger outputs
    if (fileSizeMB > 5) return 32768;
    if (fileSizeMB > 2) return 16384;
    return 8192;
  } else {
    // Flash has 1M context
    if (fileSizeMB > 2) return 16384;
    if (fileSizeMB > 1) return 12288;
    return 8192;
  }
};

const maxOutputTokens = calculateMaxOutputTokens(file.size, model);
console.log(`🎯 Using maxOutputTokens: ${maxOutputTokens} for ${(file.size / 1024 / 1024).toFixed(2)} MB file`);

config: {
  temperature: 0.1,
  maxOutputTokens: maxOutputTokens, // ✅ Dynamic
}
```

### 4. Manejo de Errores en Frontend

**Problema:** Frontend no valida si extractedData está vacío

**Solución:** Validar y marcar como error

```typescript
// En src/lib/workflowExtractors.ts (línea 23-26)

// ❌ ACTUAL:
if (!result.success) {
  throw new Error(result.error || 'Extraction failed');
}

// ✅ MEJORADO:
if (!result.success) {
  const suggestions = result.suggestions || [
    'Intenta con modelo Pro',
    'Verifica que el PDF tenga texto seleccionable',
    'Aumenta el límite de tokens en configuración'
  ];
  throw new Error(
    `${result.error || 'Extraction failed'}\n\nSugerencias:\n${suggestions.map(s => `  • ${s}`).join('\n')}`
  );
}

let extractedText = result.extractedText || result.text;

// ✅ NUEVO: Validate extracted content
if (!extractedText || extractedText.trim().length === 0) {
  throw new Error(
    'No se extrajo contenido del documento.\n\nPosibles causas:\n' +
    '  • El PDF es una imagen escaneada sin OCR\n' +
    '  • El documento está protegido/encriptado\n' +
    '  • El archivo es muy grande para el modelo Flash\n\n' +
    'Soluciones:\n' +
    '  • Re-extrae con modelo Pro (mejor para documentos complejos)\n' +
    '  • Verifica que el PDF tenga texto seleccionable\n' +
    '  • Aumenta maxOutputTokens en configuración'
  );
}

if (extractedText.length < 50) {
  console.warn(`⚠️ Very short extraction (${extractedText.length} chars) for ${file.name}`);
}
```

---

## 🎯 Plan de Implementación

### Prioridad Alta (Crítico)

1. **Validar extractedData no vacío**
   - Archivo: `src/pages/api/extract-document.ts`
   - Línea: 122-130
   - Cambio: Retornar error (status 400) si texto vacío

2. **Validar en frontend antes de guardar**
   - Archivo: `src/lib/workflowExtractors.ts`
   - Línea: 23-35
   - Cambio: Lanzar error si extractedText vacío

### Prioridad Media (Mejora)

3. **maxOutputTokens dinámico**
   - Archivo: `src/pages/api/extract-document.ts`
   - Línea: 113-116
   - Cambio: Calcular según tamaño de archivo

4. **Recomendación de modelo**
   - Archivo: `src/pages/api/extract-document.ts`
   - Añadir: Detectar archivos >1 MB y sugerir Pro

### Prioridad Baja (Futuro)

5. **Retry automático con Pro**
   - Si Flash falla en archivo grande
   - Reintentar automáticamente con Pro

6. **Pre-validación de PDFs**
   - Detectar si es imagen escaneada
   - Detectar si está protegido
   - Alertar al usuario ANTES de intentar extracción

---

## 📋 Caso Específico: SOC 2 eBook.pdf

### Diagnóstico
```
📄 Archivo: SOC 2  eBook.pdf
📏 Tamaño: 2.3 MB (muy grande)
🤖 Modelo usado: gemini-2.5-flash
🎯 maxOutputTokens: 8192 (probablemente insuficiente)
📊 Resultado: extractedData = undefined
❌ Problema: Fallo silencioso (guardado como "active" sin datos)
```

### Solución Inmediata (Manual)
1. Abre configuración del documento en la UI (ícono ⚙️)
2. Cambia modelo a **Gemini 2.5 Pro**
3. Click en "🔄 Re-extraer Contenido"
4. Pro debería manejar el archivo grande correctamente

### Solución a Largo Plazo (Automática)
Implementar las mejoras 1-4 arriba para:
- ✅ Detectar automáticamente archivos grandes
- ✅ Recomendar Pro desde el inicio
- ✅ Marcar como error si extracción falla
- ✅ Dar sugerencias claras al usuario

---

## 🧪 Testing Plan

### Test Cases a Validar

1. **PDF pequeño (<500 KB) con Flash**
   - Expected: Extracción exitosa ✅

2. **PDF mediano (500 KB - 1 MB) con Flash**
   - Expected: Extracción exitosa con advertencia

3. **PDF grande (>1 MB) con Flash**
   - Expected: Error con sugerencia de usar Pro

4. **PDF grande (>1 MB) con Pro**
   - Expected: Extracción exitosa ✅

5. **PDF vacío/corrupto**
   - Expected: Error claro con sugerencias

6. **PDF escaneado (solo imágenes)**
   - Expected: Advertencia + recomendación Pro (mejor OCR)

### Validación
```bash
# Después de implementar mejoras
npm run test:extraction

# Casos de prueba:
# - CV pequeño.pdf (Flash) → ✅
# - Documento mediano.pdf (Flash) → ✅ con advertencia
# - eBook grande.pdf (Flash) → ❌ con sugerencia Pro
# - eBook grande.pdf (Pro) → ✅
```

---

## 📈 Métricas de Éxito

**Antes:**
- Tasa de éxito: 75%
- Fallos silenciosos: 1 (100% de fallos)
- Tiempo promedio: N/A

**Después (Meta):**
- Tasa de éxito: >95%
- Fallos silenciosos: 0%
- Errores claros con sugerencias: 100%
- Recomendación de modelo: Automática

---

## 🎯 Conclusiones

### Problema Principal
El sistema **NO valida** que la extracción haya tenido éxito real. Marca documentos como "active" incluso cuando `extractedData` está vacío.

### Causa Específica de SOC 2 eBook.pdf
- Archivo demasiado grande (2.3 MB) para Flash con límite de 8192 tokens
- Gemini retornó texto vacío o truncado completamente
- Sistema lo guardó como "exitoso" sin verificar el contenido

### Solución Inmediata
Re-extraer "SOC 2 eBook.pdf" con:
- ✅ Modelo: **Gemini 2.5 Pro** (mejor para documentos largos)
- ✅ maxOutputTokens: **32768** (4x el actual)

### Soluciones a Largo Plazo
1. Validar extractedData antes de marcar como exitoso
2. maxOutputTokens dinámico según tamaño
3. Recomendación automática de modelo
4. Mejor manejo de errores en UI

---

## 📝 Archivos Afectados

### Backend
- `src/pages/api/extract-document.ts` - Validación de resultado
- `src/lib/gemini.ts` - Configuración dinámica

### Frontend
- `src/lib/workflowExtractors.ts` - Validación antes de guardar
- `src/components/ChatInterfaceWorking.tsx` - Manejo de errores

### Testing
- `scripts/check-extraction-errors.ts` - ✅ Creado
- `scripts/inspect-document-content.ts` - ✅ Creado
- `scripts/compare-documents.ts` - ✅ Creado

---

## ✅ Próximos Pasos

### Inmediato (Para Usuario)
1. Abre la UI en http://localhost:3000/chat
2. Selecciona agente con "SOC 2 eBook.pdf"
3. En panel de contexto, click en el documento
4. Click ícono ⚙️ (configuración)
5. Cambia modelo a **Pro**
6. Click "🔄 Re-extraer Contenido"
7. Espera ~10-30 segundos (Pro es más lento pero más preciso)
8. Verifica que ahora tenga contenido

### Desarrollo (Para Implementar)
1. Implementar validación de extractedData vacío
2. Implementar maxOutputTokens dinámico
3. Implementar recomendación de modelo
4. Agregar tests para casos edge
5. Actualizar documentación de usuario

---

**Resultado Esperado:**
- ✅ Fallos detectados y reportados claramente
- ✅ Usuarios reciben guía para resolver problemas
- ✅ Sistema recomienda configuración óptima automáticamente
- ✅ Tasa de éxito >95% en todas las extracciones


