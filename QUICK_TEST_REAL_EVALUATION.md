# 🧪 Quick Test - Sistema de Evaluación Real

**Feature:** Evaluación automatizada de agentes con Gemini AI  
**Status:** ✅ Listo para probar

---

## ⚡ Setup Rápido

### 1. Verificar API Key
```bash
cat .env | grep GOOGLE_AI_API_KEY
# Debe mostrar: GOOGLE_AI_API_KEY=AIzaSy...
```

### 2. Servidor corriendo
```bash
# Ya está corriendo en puerto 3000
lsof -i :3000 | grep LISTEN
# Proceso: 22143
```

---

## 🎯 Flujo de Prueba

### OPCIÓN A: Agente YA Configurado

**Si tienes un agente con configuración:**

1. **Acceder a Evaluaciones**
   ```
   http://localhost:3000/chat
   Login: expert@demo.com
   Bottom menu → "Evaluaciones de Agentes"
   ```

2. **Seleccionar Agente**
   ```
   Click: [Evaluar] en cualquier agente
   ```

3. **Ver Pre-Check**
   ```
   Debe mostrar:
   ✅ Agente Configurado
   ✅ Tabla con ejemplos de entrada
   ✅ Botón "Iniciar Evaluación (X)"
   
   O si no configurado:
   ⚠️ Agente No Configurado
   → Click "Ir a Configuración"
   ```

4. **Iniciar Evaluación**
   ```
   Click: "Iniciar Evaluación"
   
   Ver en tiempo real:
   - Test 1 de 10... ⚪ → 🔄 → ✅
   - Test 2 de 10... ⚪ → 🔄 → ✅
   - ...
   - Test 10 de 10... ⚪ → 🔄 → ✅
   
   Cada test muestra:
   - Pregunta
   - Status (Evaluando... → Score)
   - Feedback al completar
   ```

5. **Ver Resultados**
   ```
   Al terminar:
   ✅ Agente APROBADO (o ⚠️ Requiere Mejoras)
   Score: XX%
   
   Cards:
   - X Tests Aprobados
   - X Tests Fallidos
   - X Total
   
   Criterios:
   - Precisión: XX%
   - Claridad: XX%
   - Completitud: XX%
   - Relevancia: XX%
   
   Tests individuales expandibles
   ```

6. **Ver Detalles de Test**
   ```
   Click en cualquier test para expandir
   
   Ver:
   - INPUT DEL TEST
   - SALIDA ESPERADA
   - RESPUESTA DEL AGENTE (real!)
   - Desglose por criterio
   - Retroalimentación
   - Metadata
   ```

---

### OPCIÓN B: Configurar Nuevo Agente

**Si necesitas configurar un agente primero:**

1. **Crear o Seleccionar Agente**
   ```
   http://localhost:3000/chat
   Crear nuevo agente o usar existente
   ```

2. **Configurar Agente**
   ```
   Header del chat → "Configurar Agente"
   
   Opción 1: Subir PDF
   - Selecciona archivo PDF con requerimientos
   - Debe incluir:
     • Propósito del agente
     • Ejemplos de preguntas
     • Respuestas esperadas
   - Upload y espera extracción
   
   Opción 2: Usar Prompt Manual
   - Completar formulario
   - Agregar ejemplos manualmente
   ```

3. **Verificar Configuración Guardada**
   ```bash
   # En DevTools Console
   fetch('/api/agent-config?conversationId=AGENT_ID')
     .then(r => r.json())
     .then(console.log)
   
   # Debe tener:
   # testExamples: [ { input, expectedOutput, category }, ... ]
   ```

4. **Ejecutar Evaluación**
   ```
   Seguir pasos de OPCIÓN A
   ```

---

## 🔍 Qué Observar

### Durante Ejecución:

**Visual:**
- ✅ Progreso visible (Test 1 de 10, 2 de 10, etc.)
- ✅ Barra de progreso avanza (10%, 20%, ..., 100%)
- ✅ Cada test cambia de estado en tiempo real
- ✅ Spinner en test actual
- ✅ Checkmark en tests completados

**Funcional:**
- ✅ Tests se ejecutan **uno por uno** (secuencial)
- ✅ Cada test llama a `/api/evaluate-agent`
- ✅ Agente genera respuesta real
- ✅ Evaluador analiza con Gemini
- ✅ Score y feedback son relevantes

**Console Logs:**
- ✅ "🧪 Running real agent evaluation..."
- ✅ "Test 1/10 - Running..."
- ✅ "✅ Test 1 completed - Score: XX%"
- ✅ "Test 2/10 - Running..."
- ✅ ...

---

### Al Completar:

**Resultados Generales:**
- ✅ Score entre 0-100% (real, no mock)
- ✅ Número correcto de passed/failed
- ✅ Criterios muestran valores reales
- ✅ Recomendación apropiada (approve/improve)

**Tests Individuales:**
- ✅ Cada test tiene respuesta única del agente
- ✅ Feedback es específico al test
- ✅ Scores varían por test (no todos iguales)
- ✅ Tiempo de ejecución realista (1-3 segundos)

**Export:**
- ✅ JSON válido
- ✅ Contiene todos los tests
- ✅ Datos completos y útiles

---

## 🚨 Posibles Problemas

### Problema 1: "Agente No Configurado"

**Síntoma:** Modal muestra error rojo

**Causa:** Agente no tiene `inputExamples` en su configuración

**Solución:**
```
1. Click "Ir a Configuración"
2. Subir PDF con requerimientos
3. Asegurar que incluya ejemplos de preguntas
4. Esperar extracción
5. Re-intentar evaluación
```

---

### Problema 2: Tests se quedan en "Evaluando..."

**Síntoma:** Test no completa, spinner indefinido

**Causa:** Error en API o Gemini

**Solución:**
```
1. Abrir DevTools Console
2. Buscar error en rojo
3. Verificar:
   - GOOGLE_AI_API_KEY en .env
   - Gemini API responde
   - No hay errores 500
4. Revisar Network tab para ver request/response
```

---

### Problema 3: Score siempre 0% o NaN

**Síntoma:** Resultados muestran scores inválidos

**Causa:** Error en parsing de respuesta del evaluador

**Solución:**
```
1. Console → Ver logs de evaluación
2. Buscar "Raw evaluation text:"
3. Verificar que Gemini retorna JSON válido
4. Ajustar prompt del evaluador si necesario
```

---

### Problema 4: No aparece botón "Certificar"

**Síntoma:** Botón de certificación no visible

**Causa:** Score < 85% o usuario sin permisos

**Solución:**
```
1. Verificar score ≥ 85%
2. Verificar usuario tiene rol apropiado:
   - admin, expert, agent_signoff
3. Si score bajo, mejorar agente y re-evaluar
```

---

## 📊 Métricas Esperadas

### Tiempo de Ejecución:
- **Por Test:** 2-4 segundos
  - Agente genera: ~1-2s
  - Evaluador analiza: ~1-2s
- **10 Tests Total:** ~25-40 segundos

### Scores Típicos:
- **Agente Bien Configurado:** 85-95%
- **Agente Sin Optimizar:** 60-80%
- **Agente Excelente:** >95%

### Pass Rate:
- **Target:** ≥80% de tests pasados
- **Mínimo Aceptable:** 85% score general
- **Excelente:** 90%+ score general

---

## 💡 Tips para Mejores Resultados

### Para el Agente:
1. **System Prompt Claro** - Define bien el rol y tono
2. **Contexto Relevante** - Sube documentos útiles
3. **Ejemplos Específicos** - Tests deben ser realistas
4. **Criterios Medibles** - Define qué es "buena" respuesta

### Para la Evaluación:
1. **10 Tests Mínimo** - Más tests = evaluación más confiable
2. **Categorías Balanceadas** - No todos del mismo tipo
3. **Dificultad Variada** - Algunos fáciles, algunos complejos
4. **Representativo** - Tests deben reflejar uso real

---

## 🎯 Checklist de Testing

### Pre-Test:
- [ ] Servidor corriendo (localhost:3000)
- [ ] Login con usuario apropiado (expert@demo.com)
- [ ] API Key configurada en .env
- [ ] Al menos 1 agente existe
- [ ] DevTools Console abierta (para ver logs)

### Durante Test:
- [ ] Modal de evaluaciones abre
- [ ] Lista de agentes muestra
- [ ] Click "Evaluar" funciona
- [ ] Pre-check muestra configuración
- [ ] Tabla de ejemplos se ve correcta
- [ ] "Iniciar Evaluación" funciona
- [ ] Tests se ejecutan secuencialmente
- [ ] UI se actualiza en tiempo real
- [ ] Cada test muestra feedback

### Post-Test:
- [ ] Resultados generales correctos
- [ ] Scores reflejan calidad real
- [ ] Tests individuales expandibles
- [ ] Detalles completos visibles
- [ ] Export funciona
- [ ] JSON descargado es válido
- [ ] Botón certificar visible si aplica

---

## 📸 Screenshots Esperados

### 1. Pre-Check con Tabla
```
┌───────────────────────────────────────────────┐
│ Configuración de Evaluación                  │
│                                               │
│ ✅ Agente Configurado                         │
│ ┌─────────────┬─────────────┐                │
│ │ Modelo:     │ Tests: 10   │                │
│ │ Flash       │             │                │
│ └─────────────┴─────────────┘                │
│                                               │
│ 📝 Ejemplos de Entrada a Utilizar            │
│ ┌─────────────────────────────────────────┐  │
│ │ # │ Categoría │ Entrada │ Esperada    │  │
│ ├───┼───────────┼─────────┼─────────────┤  │
│ │ 1 │ Técnica   │ ¿Cómo...│ Instruc...  │  │
│ │ 2 │ Soporte   │ ¿Puedo..│ Guía...     │  │
│ │...│           │         │             │  │
│ └─────────────────────────────────────────┘  │
│                                               │
│ [Cancelar]        [Iniciar Evaluación (10)]  │
└───────────────────────────────────────────────┘
```

### 2. Ejecución Progresiva
```
┌───────────────────────────────────────────────┐
│       🔄 Ejecutando Evaluación                │
│                                               │
│ Test 3 de 10                             30%  │
│ ███████░░░░░░░░░░░░░░░░░░░░░░                │
│                                               │
│ Evaluando: Soporte al Cliente                │
│ ¿Cómo resetear contraseña?                   │
│                                               │
│ 📊 Progreso de Tests                          │
│ ┌─────────────────────────────────────────┐  │
│ │ ✅ Test #1 - Técnica       [95%] ✅ PASÓ│  │
│ │    Evaluación: Excelente respuesta      │  │
│ ├─────────────────────────────────────────┤  │
│ │ ✅ Test #2 - Soporte       [92%] ✅ PASÓ│  │
│ │    Evaluación: Clara y completa         │  │
│ ├─────────────────────────────────────────┤  │
│ │ 🔄 Test #3 - Soporte                    │  │
│ │    Evaluando...                         │  │
│ ├─────────────────────────────────────────┤  │
│ │ ⚪ Test #4 - General        Pendiente   │  │
│ │ ⚪ Test #5 - Técnica        Pendiente   │  │
│ └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### 3. Resultados Finales
```
┌───────────────────────────────────────────────┐
│ ✅ Agente APROBADO                            │
│ Score: 92% (Umbral: 85%)                      │
│                                               │
│ ┌──────────┬──────────┬──────────┐           │
│ │ 👍 8     │ 👎 2     │ 🎯 10    │           │
│ │ Aprobados│ Fallidos │ Total    │           │
│ └──────────┴──────────┴──────────┘           │
│                                               │
│ 📊 Score por Criterio                         │
│ Precisión      92% ████████                  │
│ Claridad       90% ███████                   │
│ Completitud    94% ████████                  │
│ Relevancia     88% ███████                   │
│                                               │
│ 🔍 Resultados Detallados (expandibles)       │
│ [← Volver] [📄 Exportar] [🏆 Certificar]     │
└───────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

### 1. Configuración Cargada
```javascript
// En Console
✅ "📋 Loading agent config for: {agentId}"
✅ "✅ Config loaded - {X} test examples found"
```

### 2. Evaluación Ejecutando
```javascript
// En Console durante ejecución
✅ "🧪 Starting test 1/10"
✅ "→ Sending to agent: {question}"
✅ "← Agent responded in {X}ms"
✅ "→ Evaluating with Gemini..."
✅ "✅ Test 1 completed - Score: {X}%"
✅ "🧪 Starting test 2/10"
// ... repite para cada test
```

### 3. Resultados Válidos
```javascript
// En Console al finalizar
✅ "📊 All tests completed"
✅ "Overall score: {X}%"
✅ "Passed: {X}/10"
✅ "Failed: {X}/10"
```

---

## 🐛 Debug Checklist

### Si no funciona:

**1. Verificar API Key:**
```bash
echo $GOOGLE_AI_API_KEY
# Debe mostrar valor
```

**2. Verificar Firestore Connection:**
```bash
# En Console del navegador
fetch('/api/agent-config?conversationId=test-id')
  .then(r => r.json())
  .then(console.log)

# Debe retornar objeto con testExamples
```

**3. Verificar Evaluación API:**
```bash
# Test manual del endpoint
curl -X POST http://localhost:3000/api/evaluate-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test",
    "agentName": "Test Agent",
    "agentContext": "",
    "systemPrompt": "Eres un asistente útil",
    "model": "gemini-2.5-flash",
    "testInput": "¿Qué hora es?",
    "expectedOutput": "Respuesta con la hora",
    "acceptanceCriteria": "Debe ser clara",
    "category": "General"
  }'

# Debe retornar JSON con:
# { agentResponse, passed, score, criteriaScores, feedback }
```

**4. Verificar Console Errors:**
```
Buscar en Console:
❌ Error messages en rojo
⚠️ Warnings en amarillo
📋 Info logs normales

Errores comunes:
- "API Key not configured"
- "Failed to parse evaluation"
- "Network error"
```

---

## 🎨 Visual Indicators

### Estados de Test:

| Estado | Icono | Color | Significado |
|--------|-------|-------|-------------|
| Pending | ⚪ | Gris | No ejecutado aún |
| Running | 🔄 | Azul brillante | Ejecutando ahora |
| Passed | ✅ | Azul | Test pasó (score ≥85%) |
| Failed | ❌ | Rojo | Test falló (score <85%) |
| Error | ⚠️ | Naranja | Error en ejecución |

### Scores:

| Score | Color | Barra |
|-------|-------|-------|
| ≥90% | Azul oscuro | ████████ |
| 85-89% | Azul | ███████ |
| 70-84% | Gris | ██████ |
| <70% | Gris claro | ████ |

---

## 📊 Datos de Ejemplo

### Test Example Input:
```
{
  input: "¿Cómo puedo resetear mi contraseña?",
  expectedOutput: "Guía paso a paso para resetear contraseña con enlace al portal",
  category: "Soporte al Usuario"
}
```

### Expected Agent Response:
```
Para resetear tu contraseña:

1. Ve a https://portal.ejemplo.com/reset
2. Ingresa tu email
3. Revisa tu correo para el enlace
4. Sigue las instrucciones del email
5. Crea nueva contraseña segura

Si tienes problemas, contacta soporte@ejemplo.com
```

### Expected Evaluation:
```json
{
  "passed": true,
  "score": 92,
  "criteriaScores": {
    "precision": 95,
    "clarity": 93,
    "completeness": 90,
    "relevance": 90
  },
  "feedback": "Respuesta clara, completa y precisa. Incluye todos los pasos necesarios y proporciona información de contacto adicional. Excelente."
}
```

---

## 🎯 Success Criteria

### Funcional:
- ✅ Carga configuración desde Firestore
- ✅ Muestra tabla de ejemplos pre-ejecución
- ✅ Ejecuta tests secuencialmente
- ✅ Actualiza UI progresivamente
- ✅ Llama a Gemini para cada evaluación
- ✅ Parsea respuestas correctamente
- ✅ Calcula scores apropiadamente
- ✅ Muestra resultados detallados
- ✅ Export funciona

### Visual:
- ✅ UI clara y profesional
- ✅ Estados bien diferenciados
- ✅ Progreso visible
- ✅ Feedback legible
- ✅ Responsive y fluido

### Calidad:
- ✅ Sin errores TypeScript
- ✅ Sin errores linting
- ✅ Backward compatible
- ✅ Logs útiles
- ✅ Error handling robusto

---

## 🚀 Ready to Test!

**Server:** http://localhost:3000  
**Login:** expert@demo.com  
**Path:** Chat → Bottom Menu → Evaluaciones de Agentes

**Expected Flow:**
```
Lista → Seleccionar → Pre-Check → Ejecutar → Resultados
  ↓         ↓            ↓          ↓          ↓
Modal    Config      Tabla      Tests     Scores
opens    loads      muestra    corren    muestran
```

**Duration:** ~30-40 segundos para 10 tests

**Result:** Evaluación completa con datos reales ✅

---

¡Prueba ahora y reporta cualquier issue! 🎉

