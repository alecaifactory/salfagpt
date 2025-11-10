# 🚀 Quick Start Guide - Sistema de Evaluaciones

**Para:** Expertos y Administradores  
**Tiempo:** 10-15 minutos para primera evaluación  
**Requisito:** Agente configurado con contexto

---

## ⚡ 3 Pasos Rápidos

### 1️⃣ Crear Evaluación (3 mins)

```
1. Abrir menú usuario (esquina inferior izquierda)
2. Click "Sistema de Evaluaciones"
3. Click "Nueva Evaluación"
4. Seleccionar agente (ej: GESTION BODEGAS GPT)
5. Importar preguntas:
   - Click "Importar JSON"
   - Seleccionar S001-questions-v1.json
   - O agregar manualmente
6. Definir criterios de éxito:
   - Calidad mínima: 5.0/10
   - Phantom refs: NO
   - Cobertura CRITICAL: 3+
   - Similitud: 70%+
7. Click "Crear Evaluación"
```

**Resultado:** Evaluación creada con status "Borrador"

---

### 2️⃣ Probar Preguntas (5-10 mins)

```
1. Click en evaluación recién creada
2. Ir a tab "Preguntas"
3. Filtrar por "CRITICAL" priority
4. Click "Probar" en primera pregunta
5. Modal se abre:
   - Click "Ejecutar Prueba"
   - Esperar respuesta del agente (30-60s)
   - Sistema muestra respuesta y referencias
6. Evaluar:
   - Mover slider de calidad (1-10)
   - Marcar "Phantom Refs" si detectas
   - Agregar notas (opcional)
7. Click "Guardar Resultado"
8. Repetir para 3-5 preguntas CRITICAL
```

**Resultado:** 3-5 preguntas probadas, stats actualizados

---

### 3️⃣ Revisar y Aprobar (2 mins)

```
1. Ir a tab "Resumen"
2. Revisar métricas:
   - Calidad promedio
   - Phantom refs
   - Cobertura CRITICAL
   - Similitud referencias
3. Verificar criterios de éxito:
   - ✅ = Verde = Cumplido
   - ❌ = Rojo = No cumplido
4. Decisión:
   - Si todos ✅ → Aprobar
   - Si algunos ❌ → Mejorar agente
```

**Resultado:** Agente aprobado o feedback para mejorar

---

## 📊 Ejemplo Real: S001

### Importar Ejemplo S001

```bash
# Desde terminal
cd /Users/alec/salfagpt
npx tsx scripts/import-s001-evaluation.ts
```

**Qué importa:**
- ✅ Evaluación completa (66 preguntas)
- ✅ 4 resultados de tests (Q001, Q002, Q004, Q009)
- ✅ Criterios de éxito configurados
- ✅ Stats calculados

**Puedes ver:**
1. Abrir "Sistema de Evaluaciones"
2. Ver "GESTION BODEGAS GPT (S001)"
3. Quality: 9.25/10
4. Status: Completado
5. Explorar tabs: Resumen, Preguntas, Resultados

---

## 🎯 Casos de Uso

### Caso 1: Validar Nuevo Agente

**Objetivo:** Antes de compartir con usuarios

**Proceso:**
1. Crear evaluación con 10-15 preguntas representativas
2. Incluir mezcla de CRITICAL, HIGH, MEDIUM
3. Probar todas las preguntas
4. Si promedio ≥ 5/10 y 0 phantom refs → Aprobar
5. Compartir con usuarios

**Tiempo:** 30-45 mins

---

### Caso 2: Validación Rápida (Muestra)

**Objetivo:** Verificar sistema funciona bien

**Proceso:**
1. Crear evaluación con 5 preguntas CRITICAL
2. Probar las 5
3. Si todas ≥ 8/10 y 0 phantom refs → Sistema validado
4. Aprobar con nota: "Validado con muestra"

**Tiempo:** 15-20 mins

**Ejemplo:** S001 usó este método (4 preguntas, 9.25/10)

---

### Caso 3: Testing Exhaustivo

**Objetivo:** Máxima confianza para agente crítico

**Proceso:**
1. Usar set completo (ej: 66 preguntas S001)
2. Probar todas en sesión dedicada
3. Documentar cada resultado
4. Generar reporte comprehensivo
5. Aprobar solo si todos criterios cumplidos

**Tiempo:** 3-4 horas

---

## 🔍 Detección de Phantom References

### ¿Qué son?

Phantom references = Referencias a documentos que no existen

**Ejemplo:**
```
Referencias mostradas: [1] [2] [3]
Texto menciona: "según documento [5]..."
                                  ↑
                          PHANTOM REF!
```

### Cómo Detectar

```
1. Expandir "📚 Referencias utilizadas [N]"
2. Contar badges: [1] [2] [3] ... [N]
3. Leer respuesta del agente
4. Buscar números: [1], [2], etc.
5. Verificar: ¿Todos los números ≤ N?
   - SI → No hay phantom refs ✅
   - NO → Hay phantom refs ❌
```

### Auto-Detection

El sistema detecta automáticamente:
- Extrae números del texto: \[(\d+)\]
- Compara con total de referencias
- Marca checkbox si detecta

**Siempre verifica manualmente - es crítico!**

---

## 📈 Interpretando Resultados

### Calidad por Rango

| Score | Nivel | Significado | Acción |
|-------|-------|-------------|--------|
| 9-10/10 | Excelente | Production-ready | ✅ Aprobar |
| 7-8/10 | Muy bueno | Funcional, mejorable | ⚠️ Revisar |
| 5-6/10 | Aceptable | Básico, funcional | ⚠️ Mejorar |
| 1-4/10 | Insuficiente | No listo | ❌ Rechazar |

### Success Criteria

**Mínimo para aprobar:**
- ✅ Calidad promedio ≥ 5.0/10
- ✅ Phantom refs = 0
- ✅ Al menos 3 CRITICAL probadas
- ✅ Similitud refs ≥ 70%

**Ideal para producción:**
- ⭐ Calidad promedio ≥ 8.0/10
- ⭐ Phantom refs = 0
- ⭐ Todas CRITICAL probadas
- ⭐ Similitud refs ≥ 75%

---

## 🛠️ Troubleshooting

### Problema: No puedo crear evaluación

**Solución:**
- Verifica que eres Expert o Admin
- Check permisos en configuración de usuario
- Revisa console de browser para errores

### Problema: Test no ejecuta

**Solución:**
- Verifica agente tiene contexto activo
- Check que servidor está corriendo (localhost:3000)
- Verifica API key de Gemini está configurada

### Problema: Referencias no cargan

**Solución:**
- Verifica documentos están sincronizados en BigQuery
- Check tabla `document_embeddings` tiene datos
- Revisa configuración RAG

### Problema: Stats no actualizan

**Solución:**
- Refresh página
- Check que resultado se guardó (console logs)
- Verifica permissions de Firestore

---

## 📚 Recursos

### Documentación
- `EVALUATION_SYSTEM.md` - Documentación completa
- `S001_TESTING_RESULTS_SUMMARY.md` - Ejemplo de resultados
- `S001-EVALUATION-REPORT-2025-10-29.md` - Reporte detallado

### Archivos de Ejemplo
- `questions/S001-questions-v1.json` - 66 preguntas listas
- `scripts/import-s001-evaluation.ts` - Script de importación

### Componentes
- `EvaluationPanel.tsx` - UI principal
- `AgentSharingApprovalModal.tsx` - Aprobación para compartir

### APIs
- `POST /api/evaluations` - Crear evaluación
- `POST /api/evaluations/:id/test` - Ejecutar test
- `POST /api/evaluations/:id/results` - Guardar resultado
- `GET /api/evaluations/:id/results` - Ver resultados

---

## ✅ Checklist Primera Evaluación

### Antes de Empezar
- [ ] Soy Expert o Admin
- [ ] Tengo agente con contexto configurado
- [ ] Tengo preguntas de evaluación listas
- [ ] Sé qué criterios usar

### Durante Evaluación
- [ ] Evaluación creada correctamente
- [ ] Preguntas importadas o agregadas
- [ ] Criterios de éxito definidos
- [ ] Al menos 3 preguntas CRITICAL probadas
- [ ] Cada test documentado con calidad y notas

### Después de Tests
- [ ] Todos los resultados guardados
- [ ] Stats actualizados correctamente
- [ ] Criterios de éxito verificados
- [ ] Decisión de aprobar/rechazar tomada
- [ ] Feedback documentado si aplica

---

## 🎓 Tips de Expertos

### 💡 Tip 1: Muestras Representativas
No necesitas probar todas las 66 preguntas. Una muestra de 10-15 preguntas bien elegidas valida el sistema. S001 usó solo 4 preguntas CRITICAL y tuvo confianza ALTA.

### 💡 Tip 2: Prioriza CRITICAL
Enfócate primero en las preguntas CRITICAL. Si estas funcionan bien (8+/10), las demás probablemente también.

### 💡 Tip 3: Documenta TODO
Escribe notas específicas para cada test. Esto ayuda a:
- Entender por qué score fue X/10
- Dar feedback al creador del agente
- Mejorar en próxima versión

### 💡 Tip 4: Usa "Nuevo Chat"
Siempre usa un chat nuevo para cada pregunta. Esto asegura contexto fresco y resultados consistentes.

### 💡 Tip 5: Verifica Phantom Refs
Es el error más crítico. Toma 10 segundos extra verificar, pero previene problemas serios en producción.

---

## 📞 Support

**Problemas técnicos:**
- Check logs en browser console (F12)
- Revisar documentación en `docs/`
- Contactar: alec@getaifactory.com

**Preguntas sobre criterios:**
- Revisar S001 como ejemplo
- Consultar con otros expertos
- Referirse a `EVALUATION_SYSTEM.md`

---

**Última actualización:** 2025-10-29  
**Versión:** 1.0.0  
**Status:** ✅ Ready to Use

---

**¡Empieza con S001 importado como ejemplo! Explora antes de crear tu primera evaluación.** 🎯











