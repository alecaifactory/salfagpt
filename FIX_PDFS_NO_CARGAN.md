# 🔧 FIX: PDFs No Cargan desde Referencias

**Problema Reportado:** "no cargan los documentos de referencia"  
**Síntoma:** Modal muestra "Vista de solo texto - Archivo PDF original no disponible"  
**Fecha Fix:** 24 Noviembre 2025, 10:30 PM

---

## 🐛 **EL PROBLEMA:**

### **Observado:**
```
Usuario click en referencia [1] Manual Scania
  ↓
Modal abre
  ↓
Muestra: ⚠️ "Vista de solo texto - Archivo PDF original no disponible"
  ↓
Solo muestra texto extraído, no PDF visual
```

### **Root Cause:**

**Código intentaba descargar de:**
```typescript
const bucket = storage.bucket(BUCKET_NAME);
// BUCKET_NAME = 'salfagpt-context-documents-east4'
```

**Pero archivos pueden estar en:**
- `salfagpt-context-documents-east4` (nuevos, post-migración)
- `salfagpt-uploads` (viejos, pre-migración)

**Problema:** Solo buscaba en UN bucket, fallaba si archivo en otro

---

## ✅ **LA SOLUCIÓN:**

### **Implementado: Fallback a Múltiples Buckets**

```typescript
// src/lib/storage.ts - downloadFile()

const bucketsToTry = [
  'salfagpt-context-documents-east4',  // GREEN: us-east4 (try first)
  'salfagpt-uploads',                   // BLUE: us-central1 (fallback)
];

for (const bucketName of bucketsToTry) {
  const bucket = storage.bucket(bucketName);
  const [exists] = await file.exists();
  
  if (exists) {
    const [buffer] = await file.download();
    return buffer; // ✅ Found and downloaded
  }
}

throw new Error('File not found in any bucket');
```

### **Beneficios:**

1. ✅ **Archivos nuevos:** Cargan rápido desde us-east4
2. ✅ **Archivos viejos:** Cargan desde us-central1 (fallback)
3. ✅ **Migración transparente:** Usuario no nota diferencia
4. ✅ **No breaking changes:** Todo sigue funcionando

---

## 🧪 **TESTING:**

### **Casos a Verificar:**

**1. Archivo Nuevo (post-migración):**
```
Manual Scania L P G R y S.pdf
→ Debería estar en: salfagpt-context-documents-east4
→ Carga rápido (~1-2s)
```

**2. Archivo Viejo (pre-migración):**
```
Cualquier PDF subido antes de Noviembre 2025
→ Podría estar en: salfagpt-uploads  
→ Carga desde fallback (~2-3s)
```

### **Validación:**

**Refresh browser:** http://localhost:3000/chat

**Test:**
1. Selecciona agente con respuesta anterior (ej: M3-v2)
2. Click en referencia [1] Manual Scania
3. **Debería ver:**
   - ✅ PDF se carga visualmente
   - ✅ NO mensaje "no disponible"
   - ✅ Puede hacer zoom
   - ✅ Puede anotar

**Si funciona:** Fix exitoso ✅  
**Si aún falla:** Archivo no existe en NINGÚN bucket (reportar bug)

---

## 📊 **LOGS A OBSERVAR:**

**En servidor cuando click referencia:**
```
📥 Downloading from Cloud Storage: documents/1234-Manual_Scania.pdf
  🔍 Trying bucket: salfagpt-context-documents-east4
  ✅ File downloaded from salfagpt-context-documents-east4: 253184 bytes

O:

📥 Downloading from Cloud Storage: documents/1234-Manual_Scania.pdf
  🔍 Trying bucket: salfagpt-context-documents-east4
  ⚠️  File not in salfagpt-context-documents-east4
  🔍 Trying bucket: salfagpt-uploads
  ✅ File downloaded from salfagpt-uploads: 253184 bytes
```

**Si ves ✅ en cualquiera de los dos buckets:** Funcionando ✅

**Si ves:**
```
❌ File not found in any bucket
```

**Entonces:** Archivo realmente no existe, necesita re-upload

---

## 🎯 **IMPACTO:**

### **Antes del Fix:**
```
Click referencia
  ↓
❌ "Vista de solo texto"
  ↓
Usuario frustrado (no puede ver PDF)
```

### **Después del Fix:**
```
Click referencia
  ↓
Busca en us-east4 (rápido)
  ↓
Si no está, busca en us-central1 (fallback)
  ↓
✅ PDF se muestra correctamente
```

### **Tickets Impactados:**

**Directamente:**
- Cualquier caso donde usuario click referencia
- Mejora UX significativamente

**Indirectamente:**
- Validación de respuestas mejorada
- Usuarios pueden verificar fuente original
- Confianza en el sistema aumenta

---

## ✅ **ESTADO ACTUAL:**

```
✅ downloadFile() modificado
✅ Intenta ambos buckets
✅ Fallback transparente
✅ Logs informativos
✅ Servidor reiniciado
✅ Ready para testing
```

---

## 🚀 **PRÓXIMO PASO:**

**REFRESH BROWSER:** http://localhost:3000/chat

**Click en cualquier referencia que tenga badge [1], [2], etc.**

**Debería:**
- ✅ Abrir modal con PDF visual
- ✅ NO mostrar "no disponible"
- ✅ Permitir zoom, scroll, anotaciones

**Commit:** `1b2588b` - PDF loading con fallback a ambos buckets

**🎯 REFRESH Y PRUEBA CLICK EN REFERENCIA 🎯**

