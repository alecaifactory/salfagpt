# ⚡ Prueba Rápida - API Vision (1 minuto)

**El servidor ya está corriendo en http://localhost:3000**

---

## 🚀 **Prueba Visual (UI)**

### **Paso 1: Abrir el Menú**

```
1. Abrir: http://localhost:3000/chat
2. Login: alec@getaifactory.com  
3. Click en tu nombre/avatar (esquina inferior izquierda)
```

### **Paso 2: Buscar Columna "APIs"**

```
Deberías ver un grid con columnas:
- GESTIÓN DE DOMINIOS
- GESTIÓN DE AGENTES  
- ANALÍTICAS
- APIs ← Nueva columna (fondo azul gradiente, badge "NEW")
- EVALUACIONES
- PRODUCTO
- CHANNELS
- BUSINESS MANAGEMENT
```

### **Paso 3: Click en "Test Vision API"**

```
En la columna APIs verás:
┌──────────────────────────┐
│ APIs                NEW │
├──────────────────────────┤
│ ⚡ Test Vision API       │
│    Upload & Extract JSON │
│                          │
│ 🔑 API Management        │
│    Invitations & Keys    │
│                          │
│ 🌐 Developer Portal   ↗ │
│    Docs & Examples       │
└──────────────────────────┘

Click: "Test Vision API"
```

### **Paso 4: Probar Extracción**

```
Modal se abre mostrando:

1. Upload Document
   [Área de drag & drop]

2. Select Model
   [⚡ Flash] [✨ Pro]

3. [Extract Document]

4. JSON Response
   [Área de resultados]
```

### **Paso 5: Subir y Extraer**

```
1. Arrastra cualquier PDF
   O click para seleccionar archivo

2. Elige Flash (más rápido)

3. Click "Extract Document"

4. Espera 2-3 segundos

5. ¡VE EL JSON COMPLETO!
```

---

## 💻 **Prueba Desde Terminal (Más Rápido)**

### **Si el UI no funciona aún, prueba directo:**

```bash
# 1. Crear archivo de prueba
echo "Este es un documento de prueba para Flow Vision API.
Tiene múltiples líneas.
Y contenido variado." > test-document.txt

# 2. Extraer usando el API endpoint
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@test-document.txt" \
  -F "model=gemini-2.5-flash" \
  -F "extractionMethod=vision-api"

# 3. Ver el resultado (debería ser JSON)
```

### **Respuesta Esperada:**

```json
{
  "success": true,
  "sourceId": "ctx_...",
  "extractedData": "Este es un documento de prueba para Flow Vision API.\nTiene múltiples líneas.\nY contenido variado.",
  "metadata": {
    "originalFileName": "test-document.txt",
    "originalFileSize": 123,
    "model": "gemini-2.5-flash",
    "extractionMethod": "vision-api",
    "charactersExtracted": 95,
    "tokensEstimate": 24,
    "extractionTime": 234
  }
}
```

---

## 🎯 **Con PDF Real:**

```bash
# Usa cualquier PDF que tengas
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@/path/to/your/document.pdf" \
  -F "model=gemini-2.5-flash"

# Debería devolver TODO el texto del PDF en JSON
```

---

## 🔍 **Verificación**

### **En el UI, deberías ver:**

✅ Columna "APIs" en el menú de navegación  
✅ Badge "NEW" en azul  
✅ 3 opciones:
   - Test Vision API (⚡)
   - API Management (🔑)
   - Developer Portal (🌐)

### **Al hacer click en "Test Vision API":**

✅ Modal hermoso se abre  
✅ Área de upload visible  
✅ Selector Flash/Pro  
✅ Botón "Extract Document"  
✅ Área de JSON response  

### **Al extraer documento:**

✅ JSON response se muestra  
✅ Botón "Copy JSON" funciona  
✅ Métricas se muestran (Duration, Characters, etc.)  
✅ Sin errores en consola  

---

## 🐛 **Si NO Ves la Columna APIs**

### **Debug:**

```javascript
// Abrir DevTools console
// Verificar:
console.log('User email:', userEmail);
// Debe mostrar: alec@getaifactory.com

// Verificar si showUserMenu está true
console.log('Show menu:', showUserMenu);

// Refrescar página (Cmd+R)
```

### **Si sigue sin aparecer:**

```bash
# 1. Detener servidor
pkill -f "astro dev"

# 2. Rebuild
cd /Users/alec/salfagpt
npm run build

# 3. Restart
npm run dev

# 4. Refrescar navegador
open http://localhost:3000/chat
```

---

## ✨ **Alternativamente: Prueba Directo con cURL**

### **Mientras arreglo el UI, puedes probar el API endpoint:**

```bash
# Test 1: Archivo de texto
echo "Contenido de prueba" > test.txt
curl -X POST http://localhost:3000/api/extract-document -F "file=@test.txt"

# Test 2: JSON formateado
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@test.txt" \
  -F "model=gemini-2.5-flash" | jq .

# Test 3: Con PDF
curl -X POST http://localhost:3000/api/extract-document \
  -F "file=@documento.pdf" \
  -F "model=gemini-2.5-flash" | jq .
```

**Esto prueba que el API funciona perfectamente!** ✅

---

## 🎉 **Resultado**

**Si ves el JSON con el contenido extraído:** 

✅ API Vision funciona perfectamente  
✅ Extracción es precisa  
✅ JSON está bien formateado  
✅ Metadata completa  
✅ Listo para usar en aplicaciones  

**Esto es lo que los developers externos usarán!** 🚀

---

**Prueba primero con cURL para confirmar que el API funciona, luego revisamos el UI.** 💙

