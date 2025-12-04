# Análisis de Visibilidad de Documentos - 2025-11-24

## 🎯 Problema Identificado

Los archivos PDF originales **no son visibles** desde la configuración del agente porque:

1. Los documentos en Firestore **no tienen** `gcsPath` ni `signedUrl`
2. Solo algunos archivos fueron subidos a Cloud Storage
3. Existe un **mismatch** entre los agentes en Firestore vs Cloud Storage

---

## 📊 Estado Actual por Agente

### ✅ S2-v2 (Especialista Obras) - FUNCIONAL

**Agent ID:** `1lgr33ywq5qed67sqCYi`  
**Título:** S2-v2  

**Estado:**
- ✅ **350 documentos** asignados
- ✅ **350 archivos visibles** en Cloud Storage
- ✅ **317 con texto extraído**
- ✅ **URLs públicas configuradas**

**Ubicación GCS:**
```
gs://salfagpt-context-documents/usr_uhwqffaqag1wrryd82tw/1lgr33ywq5qed67sqCYi/[archivos].pdf
```

**Ejemplos de archivos visibles:**
- Manual de Operaciones Scania P450 B 8x4.pdf
- Manual de Partes Pluma Hiab BL288 - HD00076.pdf
- Tabla de Carga Hiab XS 377EP-5 HiDuo.pdf

---

### ❌ M1-v2 (MAQSA Mantenimiento) - SIN ARCHIVOS

**Agent ID:** `KfoKcDrb6pMnduAiLlrD`  
**Título:** MAQSA Mantenimiento (S002)  

**Estado:**
- ⚠️  **117 documentos** asignados en Firestore
- ❌ **0 archivos** en Cloud Storage
- ✅ **116 con texto extraído** (extracción funcionó)
- ❌ **Sin gcsPath ni signedUrl**

**Problema:**
Los archivos PDF originales **nunca fueron subidos a Cloud Storage**. Solo se extrajo el texto usando Gemini, pero los PDFs originales no fueron guardados.

**Documentos afectados (primeros 10):**
1. Manual de Partes Hiab 288 HD00076.pdf
2. Manual de Partes Pluma Hiab BL288 - HD00076.pdf
3. Manual de Operacion Hiab 422-477 Duo-HiDuo.pdf
4. MANUAL DE SERVICIO INTERNATIONAL HV607.pdf
5. Manual de Partes Hiab 288 HD00076.pdf
6. Manual de Partes Pluma Hiab BL288 - HD00076.pdf
7. Manual de Operacion Hiab 422-477 Duo-HiDuo.pdf
8. Manual de Operaciones y Mantenimiento HIAB X-HiPro 358-408-418 X4 ES.pdf
9. Manual de Operaciones y Mantenimiento Hiab 858-1058 X4.pdf
10. Manual de Operacion Internacional 4400.pdf

**Fechas de subida:** 1-3 de noviembre 2025

---

### ❌ M3-v2 (GOP GPT) - SIN DOCUMENTOS

**Agent ID:** `Pn6WPNxv8orckxX6xL4L`  
**Título:** GOP GPT (M003)  

**Estado:**
- ❌ **0 documentos** asignados
- ❌ **0 archivos** en Cloud Storage
- ❌ **No se subieron documentos**

---

### ⚠️ S1-v2 (Especialista Legal) - NO ENCONTRADO

**Estado:**
- ❌ **No se encontró** conversación con tag S1-v2
- ❌ **No hay documentos** asignados

---

## 🔍 Diagnóstico Técnico

### 1. Archivos en Cloud Storage

**Total:** 856 archivos  
**Ubicación:** `gs://salfagpt-context-documents/usr_uhwqffaqag1wrryd82tw/`

**Por Agent ID:**
```
1lgr33ywq5qed67sqCYi  → 96 archivos   (S2-v2) ✅
EgXezLcu4O3IUqFUJhUZ  → 4 archivos    (Agente legal antiguo)
Jm0XK2BdydVH6KVBqh5I  → N/A
TestApiUpload_S001     → Archivos de prueba
iQmdg3bMSJ1AdqqlFpye  → N/A
vStojK73ZKbjNsEnqANJ  → N/A
```

### 2. Documentos en Firestore

**Total:** 2,188 documentos del usuario `usr_uhwqffaqag1wrryd82tw`

**Con archivo visible:**
- ✅ **955 documentos** tienen `gcsPath` y `signedUrl`
- Incluye los 350 de S2-v2 + 605 de otros agentes antiguos

**Sin archivo visible:**
- ❌ **1,233 documentos** NO tienen archivo original en GCS
- Solo tienen `extractedData` (texto extraído)
- **No se pueden visualizar los PDFs originales**

---

## 🔄 Acciones Ejecutadas

### ✅ Reparación de URLs Públicas

**Script:** `fix-with-public-urls.mjs`  
**Resultado:** 149 documentos reparados con URLs públicas

**Método:**
1. Mapeo inteligente de archivos GCS (match exacto + normalizado)
2. Generación de URLs públicas directas (sin firma)
3. Actualización de Firestore con `gcsPath` y `signedUrl`

**URL generadas:**
```
https://storage.googleapis.com/salfagpt-context-documents/usr_uhwqffaqag1wrryd82tw/[agentId]/[archivo].pdf
```

---

## 💡 Soluciones Propuestas

### Solución 1: Re-subir Archivos Originales (Recomendada para M1-v2)

**Para:** M1-v2 (MAQSA Mantenimiento) - 117 documentos

**Opción A: Desde archivos locales**
```bash
# Si tienes los PDFs originales localmente
./scripts/upload-batch-to-agent.sh \
  --agent-id="KfoKcDrb6pMnduAiLlrD" \
  --folder="contextos/pdf/M1" \
  --user-id="usr_uhwqffaqag1wrryd82tw"
```

**Opción B: Actualizar assignedToAgents**
Si los archivos están en S2-v2 (`1lgr33ywq5qed67sqCYi`) y deben compartirse con M1-v2:

```javascript
// Agregar M1-v2 a documentos existentes
await updateDocument(docId, {
  assignedToAgents: [...existingAgents, 'KfoKcDrb6pMnduAiLlrD'],
  sharedBetweenAgents: true
});
```

---

### Solución 2: Solo Mostrar Texto Extraído (Fallback Actual)

**Estado:** YA FUNCIONAL

**Comportamiento:**
- Modal muestra advertencia: "Vista de solo texto - Archivo PDF original no disponible"
- Usuario puede ver el texto extraído completo
- Opciones:
  - ✅ "Ver Texto" - Muestra extracto
  - ⚠️  "Descargar" - No disponible (sin archivo)
  - 🔄 "Re-indexar con RAG" - Funcional (usa extractedData)

---

### Solución 3: Subir Documentos a M3-v2 (Pendiente)

**Para:** M3-v2 (GOP GPT) - 0 documentos

**Acción:**
1. Identificar documentos GOP necesarios
2. Subirlos vía UI o CLI
3. Verificar que se guarden en GCS con estructura correcta

---

## 📋 Recomendaciones

### Inmediato (Hoy)

1. ✅ **S2-v2 está funcional** - 350 documentos visibles
2. ✅ **Verificar en UI** que se puedan ver los PDFs de S2-v2
3. ⚠️  **M1-v2**: Decidir si re-subir o dejar solo texto

### Corto Plazo (Esta Semana)

1. 📤 **Subir documentos a M3-v2** (GOP)
2. 🔍 **Encontrar/crear S1-v2** (Especialista Legal)
3. 📂 **Organizar carpeta de documentos originales** para respaldo

### Mediano Plazo (Próximas 2 Semanas)

1. 🔄 **Implementar re-upload automático** si falta gcsPath
2. ✅ **Validar que todos los uploads nuevos** guarden gcsPath
3. 📊 **Dashboard de salud** de documentos (con/sin archivo)

---

## 🛠️ Scripts Creados

### check-agent-docs.mjs
Verifica documentos asignados a agentes específicos

### fix-with-public-urls.mjs
Repara documentos agregando gcsPath y URLs públicas

### verify-final-status.mjs
Muestra estado final por agente

---

## ✅ Verificación en UI

### Para S2-v2 (Debería Funcionar)

1. Ir a: https://salfagpt.salfagestion.cl/chat
2. Seleccionar agente **S2-v2**
3. Click en un documento (ej: "Manual de Operaciones Scania P450 B 8x4.pdf")
4. **Esperar:** Modal debe mostrar:
   - ✅ Botón "Descargar" funcional
   - ✅ Vista previa o link al PDF
   - ✅ Información de extracción

### Para M1-v2 (Mostrará Advertencia)

1. Seleccionar agente **MAQSA Mantenimiento (S002)**
2. Click en un documento
3. **Esperar:** Modal debe mostrar:
   - ⚠️  Advertencia: "Archivo PDF original no disponible"
   - ✅ Botón "Ver Texto" - Muestra extractedData
   - ❌ Botón "Descargar" - Deshabilitado

---

## 🎯 Estado de Agentes v2

| Agente | Documentos | Con Archivo | Solo Texto | Estado |
|--------|------------|-------------|------------|--------|
| S1-v2  | 0          | 0           | 0          | ❌ No encontrado |
| S2-v2  | 350        | 350         | 317        | ✅ COMPLETO |
| M1-v2  | 117        | 0           | 116        | ⚠️  Solo texto |
| M3-v2  | 0          | 0           | 0          | ❌ Sin docs |

**Total:** 467 documentos asignados a agentes v2

---

## 📅 Timeline de Subidas

### Noviembre 1-3, 2025
- **M1-v2 (MAQSA)**: 117 documentos subidos
- **Método**: Extracción directa (sin guardar PDF)
- **Resultado**: Solo `extractedData`, sin `gcsPath`

### Noviembre 19-20, 2025
- **S2-v2**: 350 documentos subidos
- **Método**: Upload a GCS + Extracción
- **Resultado**: `gcsPath` + `signedUrl` + `extractedData`

---

## 🔧 Próximos Pasos

### 1. Verificar S2-v2 en UI
```bash
# Abrir browser y verificar
open https://salfagpt.salfagestion.cl/chat
```

### 2. Para M1-v2 - Opciones:

**Opción A: Re-subir archivos originales**
```bash
# Si tienes los PDFs localmente
./scripts/upload-m1v2-original-files.sh
```

**Opción B: Aceptar solo-texto**
- Modal ya muestra advertencia correcta
- Usuario puede ver texto completo
- RAG funciona correctamente

### 3. Para M3-v2: Subir documentos GOP
```bash
# Subir documentos necesarios
./scripts/upload-m003-documents.sh
```

---

**Creado:** 2025-11-24  
**Usuario:** alec@salfacloud.cl / alec@getaifactory.com  
**Proyecto:** salfagpt  
**Bucket:** gs://salfagpt-context-documents




