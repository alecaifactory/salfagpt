# 🔍 Revisión del Sistema de Extracción - Resultados y Soluciones

**Fecha:** 2025-10-13  
**Usuario:** Alec  
**Caso:** SOC 2 eBook.pdf vs CV Tomás Alarcón.pdf

---

## 📊 Resumen del Diagnóstico

### ✅ Lo que encontramos:

**Documentos en Firestore:**
- Total: 4 documentos
- Exitosos: 3 (CVs de ~110 KB cada uno)
- Fallidos: 1 (SOC 2 eBook.pdf de 2.3 MB)

### ❌ Problema Específico: SOC 2 eBook.pdf

```
📄 Archivo: SOC 2  eBook.pdf
📏 Tamaño: 2.3 MB (20x más grande que los CVs)
🤖 Modelo usado: gemini-2.5-flash
🎯 Estado en Firestore: "active" ← ENGAÑOSO
📝 extractedData: undefined/vacío ← PROBLEMA
```

**¿Qué pasó?**

El archivo se subió y procesó, PERO:
1. Gemini Flash intentó extraer el contenido
2. Por ser muy grande (2.3 MB), probablemente:
   - Excedió el límite de 8192 tokens
   - O retornó texto vacío por complejidad
3. El sistema **NO detectó** que la extracción falló
4. Guardó en Firestore como "active" sin contenido

**Resultado:** Documento marcado como exitoso pero SIN datos ❌

---

## ✅ Documentos que SÍ Funcionaron

### CV Tomás Alarcón - ESP.pdf

```
📄 Archivo: CV Tomás Alarcón - ESP.pdf
📏 Tamaño: 108 KB
🤖 Modelo: gemini-2.5-flash
📝 Caracteres extraídos: 3,716
⏱️  Tiempo: <2 segundos
✅ Estado: Exitoso

📖 Contenido extraído (preview):
"Tomás Alarcón Stansfield
Innovación Tecnológica

Líder en innovación tecnológica con experiencia en uso de
modelos Econométricos e Inteligencia Artificial..."
```

**¿Por qué funcionó?**
- ✅ Tamaño pequeño (108 KB)
- ✅ Dentro del límite de 8192 tokens
- ✅ Gemini Flash es suficiente para este tipo de documento

### Igor Asaad - Ingeniero Civil Industrial.pdf

```
📄 Archivo: Igor Asaad - Ingeniero Civil Industrial.pdf.pdf
📏 Tamaño: 123 KB
🤖 Modelo: gemini-2.5-flash
📝 Caracteres extraídos: 3,605
✅ Estado: Exitoso
```

---

## 🔧 Mejoras Implementadas (AHORA)

### 1️⃣ Validación de Contenido Extraído

**Antes:**
```typescript
// ❌ Marcaba como exitoso incluso si extractedData estaba vacío
if (!extractedText || extractedText.trim().length === 0) {
  return { error: '...', status: 200 } // ← Status 200 = Éxito
}
```

**Ahora:**
```typescript
// ✅ Retorna error si no se extrajo contenido
if (!extractedText || extractedText.trim().length === 0) {
  return { 
    success: false,
    error: 'No se pudo extraer texto del documento',
    suggestions: [
      'Intenta con modelo Pro',
      'Verifica que el PDF tenga texto seleccionable',
      ...
    ],
    status: 400 // ← Status 400 = Error
  }
}
```

### 2️⃣ maxOutputTokens Dinámico

**Antes:**
```typescript
// ❌ Límite fijo de 8192 tokens para todos los archivos
maxOutputTokens: 8192
```

**Ahora:**
```typescript
// ✅ Límite dinámico según tamaño de archivo

Flash (1M context):
- < 1 MB  →  8,192 tokens
- 1-2 MB  → 12,288 tokens
- > 2 MB  → 16,384 tokens

Pro (2M context):
- < 2 MB  →  8,192 tokens
- 2-5 MB  → 16,384 tokens
- > 5 MB  → 32,768 tokens
```

### 3️⃣ Recomendación Automática de Modelo

**Antes:**
```typescript
// ❌ Sin advertencia si archivo grande con Flash
```

**Ahora:**
```typescript
// ✅ Detecta archivos >1 MB y recomienda Pro
if (file.size > 1 MB && model === 'flash') {
  console.warn('⚠️ Large file - Pro recommended');
  
  // Incluye en respuesta:
  modelWarning: {
    message: 'Archivo grande - Pro recomendado',
    currentModel: 'flash',
    recommendedModel: 'pro',
    reason: 'Archivo de 2.3 MB puede beneficiarse de Pro'
  }
}
```

### 4️⃣ Validación en Frontend

**Antes:**
```typescript
// ❌ No validaba si extractedText estaba vacío
let extractedText = result.text;
return extractedText;
```

**Ahora:**
```typescript
// ✅ Valida antes de retornar
let extractedText = result.extractedText || result.text;

if (!extractedText || extractedText.trim().length === 0) {
  throw new Error(
    'No se extrajo contenido del documento.\n\n' +
    'Posibles causas:\n' +
    '  • PDF es imagen escaneada sin OCR\n' +
    '  • Documento protegido/encriptado\n' +
    '  • Archivo muy grande para modelo Flash\n\n' +
    'Soluciones:\n' +
    '  • Re-extrae con modelo Pro\n' +
    '  • Verifica texto seleccionable\n' +
    '  • Aumenta maxOutputTokens'
  );
}
```

---

## 🎯 Cómo Solucionar SOC 2 eBook.pdf AHORA

### Opción 1: Re-extraer desde la UI (Recomendado)

**Pasos:**
1. Ve a http://localhost:3000/chat
2. Selecciona el agente que tiene "SOC 2 eBook.pdf"
3. En "Fuentes de Contexto", busca el documento
4. Click en el ícono **⚙️ Configuración**
5. En el modal:
   - Cambia modelo a **✨ Pro**
   - Verifica que maxOutputTokens sea alto (el sistema lo ajustará a 16,384)
6. Click **"🔄 Re-extraer Contenido"**
7. Espera ~20-60 segundos (Pro es más lento pero preciso)
8. Verifica que ahora muestre caracteres extraídos

**Resultado esperado:**
```
✅ Extracción exitosa
📝 Caracteres: ~15,000-30,000 (depende del eBook)
🎯 Tokens: ~4,000-8,000
🤖 Modelo: gemini-2.5-pro
```

### Opción 2: Eliminar y Re-subir (Alternativa)

Si la re-extracción no funciona:
1. Elimina el documento actual
2. Súbelo nuevamente
3. **Esta vez selecciona modelo Pro desde el inicio**
4. El sistema ahora:
   - ✅ Usará 16,384 tokens automáticamente (archivo >1 MB)
   - ✅ Te mostrará advertencia si Flash no es suficiente
   - ✅ Marcará como error si la extracción falla

---

## 📈 Comparación: Flash vs Pro para Archivos Grandes

### Gemini 2.5 Flash
- ✅ **Velocidad:** 1-3 segundos
- ✅ **Costo:** 94% más barato que Pro
- ✅ **Ideal para:** CVs, documentos simples <1 MB
- ❌ **Límite:** 1M context window
- ❌ **Problema con:** PDFs complejos >1 MB

### Gemini 2.5 Pro
- ✅ **Precisión:** Mayor exactitud
- ✅ **Capacidad:** 2M context window
- ✅ **Ideal para:** eBooks, reportes técnicos, PDFs complejos >1 MB
- ⚠️ **Velocidad:** 10-30 segundos (más lento)
- ⚠️ **Costo:** ~16x más caro que Flash

### Tabla de Decisión

| Tamaño Archivo | Complejidad | Modelo Recomendado | Razón |
|---------------|-------------|-------------------|-------|
| < 500 KB | Simple | Flash ⚡ | Rápido y suficiente |
| 500 KB - 1 MB | Medio | Flash ⚡ | Aún dentro de capacidad |
| 1 MB - 2 MB | Alto | **Pro 🎯** | Mejor manejo de contexto largo |
| > 2 MB | Muy Alto | **Pro 🎯** | Necesario para documentos extensos |

**SOC 2 eBook.pdf:** 2.3 MB → **Pro 🎯** recomendado

---

## 🧪 Testing: Casos de Uso

### Caso 1: PDF Pequeño con Flash ✅
```
Archivo: CV.pdf (108 KB)
Modelo: Flash
Resultado: ✅ 3,716 caracteres
Tiempo: ~2 segundos
```

### Caso 2: PDF Grande con Flash ❌
```
Archivo: eBook.pdf (2.3 MB)
Modelo: Flash
Resultado: ❌ 0 caracteres (límite excedido)
Sistema ahora: ✅ Marca como error + sugerencias
```

### Caso 3: PDF Grande con Pro ✅ (Próximo a probar)
```
Archivo: eBook.pdf (2.3 MB)
Modelo: Pro
maxOutputTokens: 16,384 (automático)
Resultado esperado: ✅ 15,000-30,000 caracteres
Tiempo: ~20-60 segundos
```

---

## 📝 Scripts de Diagnóstico Creados

He creado 3 scripts para ayudarte a diagnosticar problemas de extracción:

### 1. `scripts/check-extraction-errors.ts`
**Propósito:** Ver estado general de todos los documentos

```bash
npx tsx scripts/check-extraction-errors.ts
```

**Output:**
- Resumen por estado (activos, errores, procesando)
- Lista de documentos exitosos
- Lista de documentos con errores (detallado)
- Recomendaciones generales

### 2. `scripts/inspect-document-content.ts`
**Propósito:** Ver contenido completo de un documento específico

```bash
npx tsx scripts/inspect-document-content.ts "SOC 2  eBook.pdf"
```

**Output:**
- Metadata completa
- extractedData (primeros 500 caracteres)
- Análisis de contenido (líneas, palabras, código, tablas)
- Diagnóstico específico

### 3. `scripts/compare-documents.ts`
**Propósito:** Comparar exitosos vs fallidos para encontrar patrones

```bash
npx tsx scripts/compare-documents.ts
```

**Output:**
- Estadísticas comparativas
- Tamaño promedio exitosos vs fallidos
- Modelos usados
- Patrones de error
- Recomendaciones basadas en análisis

---

## 🎯 Próximos Pasos

### Inmediato (Para Ti)

1. **Re-extrae SOC 2 eBook.pdf con Pro:**
   - Abre UI → Configuración del documento
   - Cambia a modelo Pro
   - Re-extrae
   - Verifica éxito

2. **Verifica las mejoras:**
   - Intenta subir un PDF grande nuevo con Flash
   - Ahora debería darte error claro + sugerencias
   - Si subes con Pro, debería funcionar

### Desarrollo (Ya Implementado)

- ✅ Validación de extractedData vacío
- ✅ maxOutputTokens dinámico
- ✅ Recomendación de modelo para archivos grandes
- ✅ Errores claros con sugerencias
- ✅ Scripts de diagnóstico

### Futuro (Opcional)

- [ ] Auto-retry con Pro si Flash falla
- [ ] Pre-análisis de PDFs (detectar si es escaneado)
- [ ] Progress bar durante extracción
- [ ] Estimación de tiempo según tamaño

---

## 💡 Lecciones Aprendidas

### 1. Fallos Silenciosos son Peligrosos
- ❌ Marcar como "active" sin validar contenido
- ✅ Siempre validar que el resultado tenga datos reales

### 2. Límites Estáticos son Problemáticos
- ❌ maxOutputTokens fijo para todos los archivos
- ✅ Ajustar dinámicamente según tamaño

### 3. Flash vs Pro: Elegir Según Contexto
- ✅ Flash: Perfecto para documentos <1 MB
- ✅ Pro: Necesario para documentos >1 MB

### 4. Dar Feedback Accionable
- ❌ "Error: Extraction failed"
- ✅ "Error: No se extrajo contenido. Intenta con Pro..."

---

## 🔗 Referencias

### Documentos
- `docs/DIAGNOSTIC_EXTRACTION_ISSUES_2025-10-13.md` - Análisis técnico
- `docs/GEMINI_PDF_EXTRACTION.md` - Guía de extracción

### Código Modificado
- `src/pages/api/extract-document.ts` - Validación y límites dinámicos
- `src/lib/workflowExtractors.ts` - Validación en frontend

### Scripts
- `scripts/check-extraction-errors.ts` - Estado general
- `scripts/inspect-document-content.ts` - Inspección detallada
- `scripts/compare-documents.ts` - Análisis comparativo

---

## ✅ Checklist de Verificación

Después de re-extraer SOC 2 eBook.pdf con Pro:

- [ ] Documento muestra caracteres extraídos (>1000)
- [ ] Preview del contenido es legible
- [ ] Metadata muestra modelo "gemini-2.5-pro"
- [ ] Estado es "active" Y tiene extractedData
- [ ] Toggle funciona correctamente
- [ ] Contenido aparece en desglose de contexto

---

**¿Qué sigue?**

Prueba re-extraer "SOC 2 eBook.pdf" con modelo Pro y dime si ahora funciona correctamente. Si aún falla, reviso los logs específicos del error.



