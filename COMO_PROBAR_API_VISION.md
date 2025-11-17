# 🚀 Cómo Probar la API Vision - Guía Rápida

**Fecha:** 17 de Noviembre, 2025  
**Tiempo:** 2 minutos

---

## ✅ **La API Ya Está Lista**

Todo el sistema de APIs está implementado y funcionando. Aquí está cómo probarlo:

---

## 🎯 **Opción 1: Probar Desde el UI (Más Visual)**

### **Paso 1: Abrir el Menú de Navegación**

```
1. Servidor corriendo: npm run dev
2. Abrir: http://localhost:3000/chat
3. Login como: alec@getaifactory.com
4. Click en tu nombre/avatar (esquina inferior izquierda)
5. Buscar columna "APIs" (badge azul "NEW")
```

### **Paso 2: Abrir API Playground**

```
Click en "Test Vision API"
  ↓
Se abre modal hermoso con:
  - Área de upload
  - Selector de modelo (Flash/Pro)
  - Botón "Extract Document"
  - Área de resultados JSON
```

### **Paso 3: Probar Extracción**

```
1. Arrastra un PDF o click para seleccionar
2. Elige modelo (Flash es más rápido)
3. Click "Extract Document"
4. Espera 2-3 segundos
5. ¡Ve el JSON con el contenido extraído!
```

**Resultado:** JSON completo con todo el texto extraído ✨

---

## 🎯 **Opción 2: Probar Desde Terminal (Más Rápido)**

### **Prueba Rápida con Archivo de Texto**

```bash
# 1. Crear archivo de prueba
echo "Esto es un documento de prueba para la API Vision de Flow" > test-doc.txt

# 2. Extraer
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@test-doc.txt" \
  -F "model=gemini-2.5-flash" \
  -F "extractionMethod=vision-api"

# Respuesta en ~1 segundo
```

### **Prueba con PDF Real**

```bash
# Usa cualquier PDF que tengas
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@tu-documento.pdf" \
  -F "model=gemini-2.5-flash"

# Respuesta en 2-5 segundos dependiendo del tamaño
```

---

## 📊 **Respuesta JSON Esperada**

```json
{
  "success": true,
  "sourceId": "ctx_abc123xyz",
  "extractedData": "Contenido completo del documento extraído aquí...",
  "metadata": {
    "originalFileName": "test-doc.pdf",
    "originalFileSize": 1234567,
    "workflowId": "extract-pdf",
    "extractionDate": "2025-11-17T...",
    "extractionTime": 2345,
    "model": "gemini-2.5-flash",
    "extractionMethod": "vision-api",
    "charactersExtracted": 12450,
    "tokensEstimate": 3112,
    "pageCount": 15
  }
}
```

---

## 🎨 **Lo Que Verás en el UI**

### **API Playground Modal:**

```
┌─────────────────────────────────────────────────┐
│  ⚡ API Playground - Vision API           [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Upload Document          3. JSON Response  │
│  ┌──────────────┐             ┌──────────────┐ │
│  │  📄 Drop or  │             │ {            │ │
│  │  click to    │             │   "success": │ │
│  │  upload      │             │     true,    │ │
│  └──────────────┘             │   "data": .. │ │
│                                └──────────────┘ │
│  2. Select Model                                │
│  ┌─────────┐ ┌─────────┐                       │
│  │ ⚡ Flash │ │ ✨ Pro  │                       │
│  │ Selected│ │         │                       │
│  └─────────┘ └─────────┘                       │
│                                                 │
│  [Extract Document]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✨ **Características de la API**

### **Modelos Disponibles:**

**Flash (Recomendado):**
- ✅ Rápido (2-3 segundos)
- ✅ 94% más económico
- ✅ Perfecto para la mayoría de documentos

**Pro (Avanzado):**
- ✅ Mayor precisión
- ✅ Mejor para documentos complejos
- ✅ Más detallado en tablas e imágenes

### **Formatos Soportados:**
- PDF (hasta 500MB)
- Excel (.xlsx)
- Word (.docx)
- CSV

### **Métodos de Extracción:**
- `vision-api` - Mejor para archivos < 50MB
- `gemini` - Mejor para archivos 50-500MB (auto-seleccionado)

---

## 🔧 **Comandos de Prueba**

### **Test Básico:**
```bash
# Texto simple
echo "Test de API" > test.txt
curl -X POST http://localhost:3000/api/extract-document -F "file=@test.txt"
```

### **Test con Modelo Pro:**
```bash
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@documento.pdf" \
  -F "model=gemini-2.5-pro"
```

### **Test con Método Específico:**
```bash
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@documento.pdf" \
  -F "model=gemini-2.5-flash" \
  -F "extractionMethod=gemini"
```

---

## 📋 **Checklist de Prueba**

### **UI Testing:**
- [ ] Menú de navegación muestra columna "APIs" con badge "NEW"
- [ ] Click "Test Vision API" abre modal
- [ ] Modal es visualmente atractivo
- [ ] Upload de archivo funciona (drag & drop)
- [ ] Selector de modelo funciona (Flash/Pro)
- [ ] Botón "Extract Document" se deshabilita durante extracción
- [ ] JSON response se muestra formateado
- [ ] Botón "Copy JSON" funciona
- [ ] Métricas se muestran (Duration, Characters, Model, Status)

### **API Testing:**
- [ ] Extracción de texto funciona
- [ ] Extracción de PDF funciona
- [ ] Modelo Flash funciona
- [ ] Modelo Pro funciona
- [ ] JSON response tiene todos los campos
- [ ] Metadata incluye pageCount, tokens, etc.
- [ ] Error handling funciona (archivo inválido, muy grande, etc.)

### **API Management:**
- [ ] Click "API Management" abre panel
- [ ] Panel muestra tabs (Invitations, Organizations, Analytics)
- [ ] Botón "Create Invitation" funciona
- [ ] Wizard de 3 pasos se completa
- [ ] Invitation code se genera
- [ ] Copy code funciona

---

## 🎉 **Resultado Esperado**

**Cuando funcione correctamente:**
1. ✅ Subes un PDF
2. ✅ Ves JSON con todo el texto extraído
3. ✅ Copias el JSON
4. ✅ Usas el texto en tu aplicación

**Tiempo total:** < 10 segundos

**Sensación:** "¡Es mágico!" ✨

---

## 📚 **Documentación Completa**

Para más detalles, ver:
- `docs/API_SYSTEM_ARCHITECTURE.md` - Arquitectura completa
- `docs/API_QUICK_REFERENCE.md` - Referencia rápida
- `docs/HOW_TO_TEST_API_SYSTEM.md` - Guía de testing completa

---

## 🚀 **Próximos Pasos**

Después de probar:

1. **Si funciona:** ¡Genial! Sistema listo para producción
2. **Si hay issues:** Revisar console logs y ajustar
3. **Deploy:** Seguir guía en `docs/API_SYSTEM_DEPLOYMENT_PLAN.md`

---

**¡Todo está listo! Abre el chat y prueba la API Vision ahora.** 🚀✨

