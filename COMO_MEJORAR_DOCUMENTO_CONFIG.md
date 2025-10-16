# 📝 Cómo Mejorar el Documento de Configuración

**Para obtener mejores test examples automáticos**

---

## 🎯 Estado Actual

### Lo Que Gemini Está Extrayendo:

✅ **SÍ extrae (de tu documento):**
- `agentName`
- `agentPurpose`
- `targetAudience`
- `businessCase`
- `recommendedModel`
- `systemPrompt`
- `qualityCriteria` (3 items)
- `acceptanceCriteria` (4 items)
- `undesirableOutputs` (1 item)

❌ **NO extrae (porque no está en el prompt o documento):**
- `expectedInputExamples` - Ejemplos específicos de preguntas
- `expectedOutputExamples` - Ejemplos específicos de respuestas

---

## ✅ Solución Actual (Funciona Ahora)

**El código ahora genera tests automáticamente desde los criterios:**

De tu config actual generará **6-7 tests:**
1. Respuesta a Preguntas Tipo
2. Citación de Fuentes
3. Entendimiento de Lenguaje Natural
4. Rechazo de Contenido no Textual
5. Precisión y Veracidad
6. Claridad y Relevancia

**Esto ya debería funcionar!**

---

## 💡 Para Mejorar (Opcional - Futuro)

### Si quieres ejemplos MÁS específicos:

**Agrega esta sección a tu PDF de configuración:**

```markdown
## EJEMPLOS DE ENTRADA (Test Cases)

### Pregunta Ejemplo 1 - Urbanismo
**Categoría:** Normativa Técnica
**Pregunta:** ¿Cuál es la diferencia entre un loteo con construcción simultánea y uno con construcción sucesiva según la OGUC?
**Respuesta Esperada:** Explicación detallada citando artículo específico de OGUC

### Pregunta Ejemplo 2 - Permisos
**Categoría:** Trámites
**Pregunta:** ¿Qué requisitos necesito para obtener un permiso de edificación en terreno con pendiente mayor a 20%?
**Respuesta Esperada:** Lista de requisitos con citas a LGUC y OGUC

### Pregunta Ejemplo 3 - Restricciones
**Categoría:** Normativa
**Pregunta:** ¿Puedo edificar en una franja de riesgo de inundación si hago un buen estudio?
**Respuesta Esperada:** Respuesta clara basada en restricciones legales

... (Agrega 7-10 ejemplos más)
```

**Resultado:** Gemini extraerá estos ejemplos específicos → Test examples más realistas

---

## 🎯 Recomendación Actual

### OPCIÓN A: Usar Como Está (Recomendado)

✅ **El sistema actual ya funciona:**
- Genera 6-7 tests desde tus criterios
- No necesitas cambiar tu documento
- Tests son relevantes a los criterios de calidad

**Acción:** 
1. F5 para refresh
2. Upload PDF
3. Verificar que ahora genera 6 tests
4. Evaluar agente con esos tests

---

### OPCIÓN B: Mejorar Documento (Futuro)

✅ **Para tests más específicos:**
- Agrega sección "Ejemplos de Entrada" a tu PDF
- Lista 10+ preguntas reales que el agente recibirá
- Gemini las extraerá como `expectedInputExamples`
- Tests serán más realistas

**Acción:**
1. Actualizar PDF agregando ejemplos
2. Re-upload
3. Gemini extraerá expectedInputExamples
4. Sistema usará esos en lugar de generar desde criterios

---

## 📊 Comparación

### Generados desde Criterios (Actual):
```javascript
{
  question: "Realizar cada una de las 19 preguntas al agente y evaluar...",
  category: "Respuesta a Preguntas Tipo"
}
```

### Extraídos de Ejemplos (Si agregas al PDF):
```javascript
{
  question: "¿Cuál es la diferencia entre loteo con construcción simultánea y sucesiva?",
  category: "Normativa Técnica"
}
```

**Ambos funcionan!** El segundo es más específico.

---

## 🚀 Qué Hacer Ahora

### Prueba PRIMERO con lo que tienes:

1. **F5** - Refresh
2. **Upload tu PDF actual** (sin cambios)
3. **Verifica logs:**
   ```
   💾 [SAVE SETUP] No expectedInputExamples, generating from criteria
   💾 [SAVE SETUP] inputExamples count: 6
   ```
4. **Cierra y re-abre**
5. **Verifica:**
   ```
   📥 [CONFIG LOAD] data.inputExamples?.length: 6
   ✅ [CONFIG LOAD] FOUND EXISTING CONFIG!
   ```

**Si esto funciona (debería), ya tienes un sistema de evaluación funcional!**

---

### DESPUÉS, si quieres mejorar:

1. Actualiza tu PDF agregando sección de "Ejemplos de Entrada"
2. Lista 10 preguntas específicas reales
3. Re-upload
4. Sistema usará esas preguntas exactas

---

## ✅ Estado Actual

```
✅ Código actualizado para generar desde criterios
✅ Prompt actualizado para extraer expectedInputExamples si existe
✅ Sistema flexible (usa lo que esté disponible)
✅ Listo para testing
```

---

**Refresh y prueba ahora!** Debería generar 6 tests desde tus criterios existentes. 🎯🚀

