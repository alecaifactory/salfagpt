# 🔧 Test de Manejo de Errores en Extracción de Documentos

## ✅ Mejoras Implementadas

Se ha mejorado significativamente el manejo de errores cuando se sube un PDF o documento y falla la extracción.

### Antes ❌
- Error genérico: "Error al procesar el documento - Failed to extract document"
- Sin detalles
- Sin forma de saber qué hacer

### Ahora ✅
- **Botón "Ver detalles"** en la tarjeta de error
- **Modal completo** con:
  - Mensaje de error específico
  - Detalles técnicos
  - Timestamp del error
  - **Sugerencias personalizadas** para solucionar
  - Opción de re-extraer con nueva configuración

---

## 🧪 Cómo Probar

### 1. Ver Error Existente

Si ya tienes un documento con error (como "Igor Asa..."):

1. **En el sidebar izquierdo**, en "Fuentes de Contexto"
2. Verás la tarjeta roja con el error
3. **Click en "Ver detalles"** (botón rojo)
4. Se abre modal con:
   - ❌ Error al Procesar el Documento
   - Mensaje de error
   - Detalles técnicos
   - 💡 Posibles soluciones (lista)
   - Opción de cambiar modelo y re-extraer

### 2. Provocar Diferentes Tipos de Error

#### A) Error de API Key (si no está configurada)
```bash
# Temporalmente renombra la variable
# En .env:
# GEMINI_API_KEY=tu_key  →  GEMINI_API_KEY_DISABLED=tu_key

# Reinicia servidor
npm run dev

# Intenta subir PDF
```

**Error Esperado:**
- Mensaje: "Gemini API Key no configurado"
- Sugerencias:
  - Verifica que GEMINI_API_KEY esté en .env
  - Reinicia servidor después de agregar la key
  - Confirma que la key sea válida

#### B) Simular Error de Red
```bash
# Desconecta internet
# O bloquea generativelanguage.googleapis.com en firewall

# Intenta subir PDF
```

**Error Esperado:**
- Mensaje: "Error de conexión a Gemini AI"
- Sugerencias:
  - Verifica tu conexión a internet
  - Comprueba firewall
  - Intenta más tarde

#### C) Archivo Muy Grande
```bash
# Crea un PDF > 50MB
# O modifica maxSize en extract-document.ts para testing
```

**Error Esperado:**
- Status 400
- Mensaje: "File too large. Maximum size: 50MB"

---

## 📊 Tipos de Errores Categorizados

El sistema ahora detecta y categoriza estos errores:

### 1. **API Key no configurado**
- Detecta: `'API key'` o `'GEMINI_API_KEY'` en error
- Mensaje personalizado
- 3 sugerencias específicas

### 2. **Error de red/conexión**
- Detecta: `'network'`, `'fetch'`, `'ENOTFOUND'`
- Mensaje sobre conectividad
- 3 sugerencias de troubleshooting

### 3. **Límite de quota**
- Detecta: `'quota'`, `'rate limit'`
- Mensaje sobre límite alcanzado
- Sugerencias para esperar o actualizar plan

### 4. **Modelo no encontrado**
- Detecta: `'model'`, `'not found'`
- Mensaje sobre modelo no disponible
- Sugerencia de cambiar Flash ↔ Pro

### 5. **Timeout**
- Detecta: `'timeout'`
- Mensaje sobre documento muy grande
- Sugerencias de reducir tamaño o reintentar

### 6. **Genérico**
- Cualquier otro error
- Muestra mensaje + detalles técnicos
- Lista de soluciones generales

---

## 🎨 UI del Modal de Error

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Configuración de Extracción                         [X]│
│  Igor Asa...                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️  ❌ Error al Procesar el Documento              │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────┐   │   │
│  │ │ Mensaje de error:                           │   │   │
│  │ │ Failed to extract document                  │   │   │
│  │ │                                             │   │   │
│  │ │ Detalles técnicos:                          │   │   │
│  │ │ GEMINI_API_KEY not configured               │   │   │
│  │ │                                             │   │   │
│  │ │ Timestamp: 2025-10-12 12:34:56              │   │   │
│  │ └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────┐   │   │
│  │ │ 💡 Posibles soluciones:                     │   │   │
│  │ │ • Verifica que GEMINI_API_KEY esté en .env  │   │   │
│  │ │ • Reinicia el servidor después de agregar   │   │   │
│  │ │ • Confirma que la key sea válida            │   │   │
│  │ │                                             │   │   │
│  │ │ Acción sugerida: Cambia configuración       │   │   │
│  │ │ abajo y click "Re-extraer"                  │   │   │
│  │ └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Resto de la configuración y botón Re-extraer]            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Pruebas

### Funcionalidad Básica
- [ ] Error card muestra icono rojo AlertCircle
- [ ] Mensaje de error visible en card
- [ ] Botón "Ver detalles" presente y clickable
- [ ] Click abre modal completo

### Modal de Error
- [ ] Sección de error es prominente (rojo)
- [ ] Muestra mensaje de error
- [ ] Muestra detalles técnicos (si disponibles)
- [ ] Muestra timestamp del error
- [ ] Sección "Posibles soluciones" visible
- [ ] Lista de sugerencias (específicas o genéricas)
- [ ] Texto de acción sugerida presente

### Re-extracción
- [ ] Puede cambiar modelo (Flash ↔ Pro)
- [ ] Botón "Re-extraer" funcional
- [ ] Después de re-extraer, error se limpia o actualiza

### Diferentes Errores
- [ ] API key: Mensaje + sugerencias específicas
- [ ] Red: Mensaje + sugerencias de conectividad
- [ ] Quota: Mensaje + sugerencias de límite
- [ ] Genérico: Mensaje + sugerencias generales

---

## 🔍 Debugging

### Ver logs en consola del servidor:

```bash
# En la terminal donde corre npm run dev
# Busca:
✅ Gemini AI client initialized
❌ Failed to initialize Gemini AI client
❌ Error extracting document
```

### Ver logs en consola del browser:

```
F12 → Console → Busca:
- Error responses del API
- Network errors
```

### Ver detalles técnicos completos:

1. Network tab → API call a `/api/extract-document`
2. Response tab → Ver JSON completo:
```json
{
  "error": "Gemini API Key no configurado",
  "details": "La variable GEMINI_API_KEY no está disponible",
  "suggestions": [
    "Verifica que GEMINI_API_KEY esté en el archivo .env",
    "Reinicia el servidor después de agregar la key",
    "Confirma que la key sea válida"
  ],
  "timestamp": "2025-10-12T12:34:56.789Z"
}
```

---

## 💡 Para el Usuario Final

**Si ves un error al subir un documento:**

1. ✅ **NO entres en pánico** - el sistema te guiará
2. 👆 **Click en "Ver detalles"** (botón rojo en la tarjeta)
3. 📖 **Lee las sugerencias** - están personalizadas para tu error
4. ⚙️ **Prueba las soluciones sugeridas**:
   - Cambiar modelo (Flash → Pro o viceversa)
   - Verificar archivo
   - Revisar conexión
   - Esperar si hay límite de cuota
5. 🔄 **Re-intenta** con el botón "Re-extraer"
6. 📞 **Si persiste**, contacta soporte con el **mensaje de error completo**

---

## 🚀 Estado

✅ **Implementado y commiteado**
✅ **Sin errores de TypeScript**
✅ **Tipos actualizados**
✅ **UI mejorado**
✅ **Listo para testing en localhost**

**Próximo paso**: Probar en `http://localhost:3000/chat` subiendo un PDF.

