# 🧪 Instrucciones para Testing - Threshold 70%

## ⚠️ IMPORTANTE: Estás viendo mensajes ANTIGUOS

El **50%** que ves es de conversaciones ANTERIORES que se guardaron en Firestore ANTES de implementar el cambio.

Para ver el nuevo comportamiento:

---

## ✅ Pasos para Testing Correcto

### **Paso 1: Refrescar Navegador**

```
Cmd + R (Mac) o F5 (Windows)
```

**Por qué:** Para cargar el código JavaScript nuevo del frontend (threshold 70%)

---

### **Paso 2: Crear NUEVO Chat**

**IMPORTANTE:** No uses el chat existente "GOP GPT M3"

**Hacer:**
1. Click en **"+ Nuevo Agente"** (botón azul arriba)
2. O click en **"+ Nuevo Chat"** (botón morado)
3. Esto crea una conversación NUEVA sin mensajes viejos

---

### **Paso 3: Hacer Pregunta de Prueba**

**Opción A - Query General (esperado: <70% similitud)**

Pregunta algo general que probablemente NO tenga docs muy específicos:

```
¿Cómo solicito permisos especiales para trabajos en altura?
```

**Esperado:**
- ✅ AI responde: "No encontré documentos con alta relevancia (>70%)..."
- ✅ Muestra email admin: sorellanac@salfagestion.cl
- ✅ Menciona Roadmap
- ✅ **Referencias: 0** (NO muestra 10 referencias con 50%)

---

**Opción B - Query Específica (esperado: >70% similitud)**

Pregunta algo MUY específico que SÍ esté en los documentos:

```
¿Cuáles son los pasos exactos para la mantención semanal de grúas HIAB según el manual?
```

**Esperado:**
- ✅ AI responde con referencias
- ✅ Referencias muestran 72-95% (NO 50%)
- ✅ Variedad de porcentajes
- ✅ Solo referencias de alta calidad

---

### **Paso 4: Verificar en Console Logs**

Abre DevTools (F12) → Console tab

**Buscar estos mensajes:**

Si hay docs >70%:
```javascript
✅ RAG: Using 5 relevant chunks (3,245 tokens)
  Avg similarity: 78.3%
```

Si NO hay docs >70%:
```javascript
⚠️ RAG: Found 8 chunks but best similarity 62.3% < threshold 70%
  → Informing user that no relevant documents are available
📧 Admin contacts provided: sorellanac@salfagestion.cl
```

---

## 🔍 Troubleshooting

### Problema: Sigo viendo 50%

**Causa:** Estás viendo un mensaje VIEJO guardado en Firestore

**Solución:**
1. ✅ Crear NUEVO chat (no reusar el viejo)
2. ✅ Hacer pregunta NUEVA
3. ✅ Esperar respuesta nueva

---

### Problema: No veo email del admin

**Causa posible 1:** Query tiene >70% similitud (entonces SÍ muestra referencias normales)

**Solución:** Hacer query más general

**Causa posible 2:** No se pasó userEmail

**Verificar en Network tab:**
```javascript
// Request payload debe incluir:
{
  "userId": "...",
  "userEmail": "fdiazt@salfagestion.cl", // ← Debe estar aquí
  "message": "...",
  // ...
}
```

---

## 📊 Qué Esperar Según Query

| Tipo de Query | Similitud Esperada | Referencias | Mensaje AI |
|---------------|-------------------|-------------|------------|
| **Muy específica** ("paso 3 del procedimiento X") | 80-95% | 2-5 refs con 72-95% | Respuesta con citas |
| **Específica** ("procedimiento de mantenimiento grúas") | 70-85% | 3-8 refs con 70-85% | Respuesta con citas |
| **General** ("cómo se hace mantenimiento") | 50-70% | **0 refs** | "No hay docs >70%, contacta admin@..." |
| **Muy general** ("qué es una grúa") | 30-50% | **0 refs** | "No hay docs >70%, contacta admin@..." |

---

## ✅ Confirmación de Éxito

**Sabrás que funciona cuando veas:**

### **Caso 1: Query Específica**
```
📚 Referencias utilizadas (5)
  [1] Manual HIAB - 82.3% 🟢  ← NO 50%!
  [2] Procedimiento - 76.5% 🟢  ← NO 50%!
  [3] Guía Operador - 71.2% 🟢  ← NO 50%!
```

### **Caso 2: Query General**
```
📚 Referencias utilizadas (0)  ← Sin referencias!

AI Mensaje:
"No encontré documentos específicos con alta relevancia (>70%)...

📧 Puedes contactar a tu administrador:
  • sorellanac@salfagestion.cl  ← Email del admin!

💡 Deja feedback en el Roadmap..."  ← Invitación!
```

---

## 🚀 Resumen Ejecutivo

**Cambio principal:** Threshold 60% → 70%

**Impacto:**
- Menos queries tienen referencias (más estricto)
- Pero cuando hay referencias, son REALES (72-95%)
- Cuando NO hay, usuario recibe ayuda clara

**Beneficio:**
- ✅ Calidad > Cantidad
- ✅ Transparencia total
- ✅ Usuario siempre sabe qué hacer
- ✅ No más "50% en todo" (confuso)

---

**SIGUIENTE ACCIÓN:** Crear nuevo chat y hacer pregunta de prueba





