# 🧪 Evaluación de S1-v2 - Plan de Pruebas

**Fecha:** 2025-11-19  
**Agente:** S1-v2 ("Como solicito algo bodega")  
**Ambiente:** localhost:3000  
**Chunks en BigQuery:** 585 (74 documentos)

---

## ✅ SETUP COMPLETADO

- [x] 74 documentos indexados en Firestore
- [x] 585 chunks sincronizados a BigQuery
- [x] hashId usado correctamente (usr_uhwqffaqag1wrryd82tw)
- [x] Agente compartido con alec@getaifactory.com
- [x] Servidor corriendo en localhost:3000

---

## 🧪 PRUEBAS A REALIZAR

### **TEST 1: Pedido de Convenio**

**Pregunta exacta:**
```
¿Cómo hago un pedido de convenio?
```

**Información crítica que DEBE aparecer:**
- ✅ Transacción **ME21N** (crear pedido)
- ✅ Tipo de pedido **ZCON** (convenio)
- ✅ Pasos del proceso

**Errores críticos que NO deben aparecer:**
- ❌ **ME51N** (transacción incorrecta)
- ❌ **ZBOL** (tipo incorrecto)
- ❌ "día 15" o plazos inventados

**Formato esperado:**
- Negritas en datos clave (ME21N, ZCON)
- Lista numerada o viñetas para los pasos
- Estructura clara (no muro de texto)
- Referencias al final

**Criterios de evaluación:**

| Calificación | Criterio |
|--------------|----------|
| **Sobresaliente** | ✅ Incluye ME21N y ZCON<br>✅ Formato claro con negritas/listas<br>✅ Muestra referencias<br>✅ Sin errores |
| **Aceptable** | ✅ Info correcta pero omite ZCON<br>⚠️ Formato denso o sin estructura<br>❓ Referencias ausentes o pocas |
| **Inaceptable** | ❌ Info incorrecta (ME51N, ZBOL, plazos falsos)<br>❌ Formato ilegible<br>❌ Tono inadecuado |

---

### **TEST 2: Informe de Consumo de Petróleo**

**Pregunta exacta:**
```
¿Cuándo debo enviar el informe de consumo de petróleo?
```

**Información crítica que DEBE aparecer:**
- ✅ **4to día hábil** del mes siguiente (plazo clave)
- ✅ Transacción **ZMM_IE**
- ✅ "Resumen de Consumo de Petróleo Diésel"
- ✅ Proceso: generación → revisión → envío

**Formato esperado:**
- **4to día hábil** destacado en la primera línea
- Proceso estructurado con viñetas
- Negritas en información crítica
- Referencias al final

**Criterios de evaluación:**

| Calificación | Criterio |
|--------------|----------|
| **Sobresaliente** | ✅ Responde "4to día hábil" al inicio<br>✅ Incluye ZMM_IE y proceso completo<br>✅ Formato impecable (negritas, viñetas)<br>✅ Muestra referencias |
| **Aceptable** | ✅ Toda la info correcta<br>⚠️ Formato denso (muro de texto)<br>⚠️ Info clave no destacada |
| **Inaceptable** | ❌ Omite el plazo<br>❌ Info incorrecta<br>❌ Formato ilegible |

---

## 📋 PLANTILLA DE REPORTE

Para cada test, copiar y completar:

```
═══════════════════════════════════════════════════════════════
TEST X: [Título]
═══════════════════════════════════════════════════════════════

PREGUNTA:
[Pegar pregunta exacta]

RESPUESTA COMPLETA:
───────────────────────────────────────────────────────────────
[Pegar respuesta completa del agente - usar botón "Copiar"]
───────────────────────────────────────────────────────────────

REFERENCIAS:
¿Aparecieron? [SÍ/NO]
Cantidad: [número]
Documentos: [listar nombres]

ANÁLISIS DE CONTENIDO:
─────────────────────────
✅ Información clave presente:
   - [item 1]
   - [item 2]
   - [...]

❌ Información faltante:
   - [item 1]
   - [...]

🚨 Errores críticos detectados:
   - [item 1]
   - [...]

ANÁLISIS DE FORMATO:
─────────────────────────
✅/❌ Usa negritas para destacar datos clave
✅/❌ Usa viñetas o listas numeradas
✅/❌ Estructura clara (secciones, párrafos)
✅/❌ Extensión adecuada (no muy largo/corto)
⚠️  [¿Es un "muro de texto" difícil de leer?]

TIEMPO DE RESPUESTA:
[Aprox. segundos desde envío hasta respuesta completa]

═══════════════════════════════════════════════════════════════
EVALUACIÓN FINAL
═══════════════════════════════════════════════════════════════

CALIFICACIÓN: [Sobresaliente / Aceptable / Inaceptable]

PUNTAJE DE RECOMENDACIÓN (1-5): [número]
(1 = Nada probable, 5 = Muy probable)

NIVEL DE SATISFACCIÓN (1-5): [número]
(1 = Muy insatisfecho, 5 = Muy satisfecho)

NOTAS / RAZONAMIENTO:
[Explicación detallada del por qué de la calificación.
¿Qué funciona bien? ¿Qué debe mejorar?]

MOTIVO ERROR CONTENIDO (si aplica):
[Incorrecto / Incompleto / Definiciones / N/A]

MOTIVO ERROR FORMATO (si aplica):
[Tono / Estructura / Extensión / Gramática / N/A]

═══════════════════════════════════════════════════════════════
```

---

## 🎯 INSTRUCCIONES PASO A PASO

### **Preparación:**
1. Abre http://localhost:3000/chat en tu navegador
2. Inicia sesión (si es necesario)
3. En el menú lateral izquierdo, selecciona el agente **"Como solicito algo bodega"** (S1-v2)
4. Verifica que se cargó el agente (debería decir el nombre en la parte superior)

### **Para cada TEST:**

1. **Enviar pregunta:**
   - Copia la pregunta exacta de arriba
   - Pégala en el campo de texto
   - Presiona Enter o clic en enviar

2. **Observar respuesta:**
   - Espera a que termine de escribir (verás el cursor parpadeando)
   - Observa si aparecen las **📚 Referencias** al final
   - Nota el tiempo aproximado que tardó

3. **Copiar respuesta:**
   - Usa el botón "Copiar" de la respuesta (si está disponible)
   - O selecciona todo el texto y cópialo manualmente
   - **IMPORTANTE:** Copia TODO, incluyendo las referencias si aparecen

4. **Completar plantilla:**
   - Pega la respuesta en la plantilla
   - Analiza contenido y formato según los criterios
   - Completa la evaluación final

5. **Repetir** para el siguiente test

---

## 📊 ENTREGABLES

Después de completar las 2 pruebas, proporcionar:

1. ✅ Plantillas completadas para TEST 1 y TEST 2
2. ✅ Screenshots (opcional pero recomendado)
3. ✅ Observaciones generales sobre el comportamiento del agente
4. ✅ Cualquier bug o problema encontrado en la UI

---

## 🚨 PROBLEMAS CONOCIDOS A VERIFICAR

Durante las pruebas, verificar si estos problemas persisten:

- [ ] ¿Las referencias aparecen al final de CADA respuesta?
- [ ] ¿RAG está encontrando chunks relevantes? (debería mostrar 3-5 refs)
- [ ] ¿El tiempo de respuesta es razonable? (<10 segundos)
- [ ] ¿La respuesta es específica o genérica?
- [ ] ¿Se usan los documentos correctos? (MAQ-LOG, Paso a Paso, etc.)

---

## 📞 SOPORTE

Si encuentras algún problema:
- Servidor no responde → Verificar que esté corriendo en puerto 3000
- Error de autenticación → Iniciar sesión nuevamente
- Agente no aparece → Refrescar página (Cmd+R)
- Sin referencias → Reportar inmediatamente (es el bug que estamos probando)

---

**¿Listo para comenzar las pruebas?**

1. Abre localhost:3000/chat
2. Selecciona S1-v2
3. Envía la primera pregunta
4. Completa la plantilla con los resultados


