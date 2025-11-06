# 📊 Sistema de Evaluación de Calidad de Agentes

**Versión:** 1.0.0  
**Última Actualización:** 2025-10-29  
**Status:** ✅ Operacional

---

## 🎯 Propósito

Sistema completo para evaluar, registrar, rastrear y mejorar la calidad de las respuestas de los agentes S001 y M001 a través de iteraciones sucesivas con feedback de expertos.

---

## 📂 Estructura de Directorios

```
docs/evaluations/
├── README.md                          ← Este archivo
│
├── SISTEMA_EVALUACION_AGENTES.md     ← Documentación completa del sistema
│
├── questions/                         ← Banco de preguntas
│   ├── S001-questions-v1.json        ← 66 preguntas S001
│   ├── M001-questions-v1.json        ← 19 preguntas M001
│   └── templates/
│       └── question-template.json
│
├── evaluations/                       ← Evaluaciones realizadas
│   ├── EVAL-S001-2025-10-29-v1/
│   │   ├── metadata.json             ← Info de evaluación
│   │   ├── questions.json            ← Preguntas evaluadas (copia)
│   │   ├── responses/
│   │   │   ├── Q001-response.md      ← Respuesta legible
│   │   │   ├── Q001-response.json    ← Respuesta estructurada
│   │   │   └── ...
│   │   ├── references/
│   │   │   ├── Q001-references.json  ← Referencias obtenidas
│   │   │   └── ...
│   │   ├── expert-feedback/
│   │   │   ├── Q001-feedback.json    ← Feedback de experto
│   │   │   └── ...
│   │   └── summary-report.md         ← Reporte consolidado
│   │
│   └── EVAL-M001-2025-10-29-v1/
│       └── ... (misma estructura)
│
├── iterations/                        ← Mejoras entre versiones
│   ├── S001-v1-to-v2.md
│   └── M001-v1-to-v2.md
│
├── reports/                           ← Reportes comparativos
│   ├── quality-trend-S001.md
│   ├── quality-trend-M001.md
│   └── comparative-analysis.md
│
└── templates/                         ← Templates para evaluación
    ├── response-template.md
    ├── feedback-template.md
    └── report-template.md
```

---

## 🚀 Quick Start

### **1. Ver Preguntas de Benchmark**

```bash
# S001 (66 preguntas)
cat docs/evaluations/questions/S001-questions-v1.json | jq '.questions[] | {id, priority, question}'

# M001 (19 preguntas)
cat docs/evaluations/questions/M001-questions-v1.json | jq '.questions[] | {id, priority, question}'
```

---

### **2. Estado Actual de Evaluaciones**

```bash
# Ver metadata de evaluación activa
cat docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/metadata.json | jq '.scope, .results'
cat docs/evaluations/evaluations/EVAL-M001-2025-10-29-v1/metadata.json | jq '.scope, .results'
```

---

### **3. Ver Respuestas Probadas**

```bash
# Respuestas de S001
ls -la docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/responses/

# Respuestas de M001
ls -la docs/evaluations/evaluations/EVAL-M001-2025-10-29-v1/responses/
```

---

## 📊 Estado Actual

### **EVAL-S001-2025-10-29-v1**

| Métrica | Valor |
|---------|-------|
| **Total Preguntas** | 66 |
| **Probadas** | 1 (1.5%) |
| **Target** | 10 (15%) |
| **Calidad Actual** | 10/10 |
| **Phantom Refs** | 0 |
| **Status** | 🔨 In Progress |

**Pregunta Probada:**
- ✅ Q004: Informe petróleo - 10/10 ⭐

---

### **EVAL-M001-2025-10-29-v1**

| Métrica | Valor |
|---------|-------|
| **Total Preguntas** | 19 |
| **Probadas** | 4 (21%) |
| **Target** | 19 (100%) |
| **Calidad Promedio** | 9.25/10 |
| **Phantom Refs** | 0 |
| **Status** | 🔨 In Progress |

**Preguntas Probadas:**
- ✅ Q001: DFL2 vs Construcción Simultánea - 9.5/10 ⭐
- ✅ Q003: Requisitos permisos edificación - 9.5/10 ⭐
- ✅ Q_Traspaso: Traspaso bodega (honestidad) - 9.0/10 ⭐
- ✅ Q_Edificacion: Permisos (detallado) - 9.5/10 ⭐

---

## 🎯 Próximos Pasos

### **Fase 1: Testing Técnico** ⏳ IN PROGRESS

**Objetivo:** Validar sistema con muestra representativa

**Tareas:**
- [x] ✅ M001: 4 preguntas probadas
- [x] ✅ S001: 1 pregunta probada
- [ ] ⏳ S001: 9 preguntas críticas adicionales
- [ ] ⏳ Generar reportes preliminares

**Tiempo Estimado:** 20-30 mins

---

### **Fase 2: Revisión de Expertos** ⏳ PENDING

**Objetivo:** Validación con especialistas de Salfa

**Tareas:**
- [ ] Preparar paquete de evaluación
- [ ] Enviar a Sebastian + equipo
- [ ] Esperar feedback (2-4 horas)
- [ ] Consolidar resultados

---

### **Fase 3: Mejoras (si necesario)** ⏳ PENDING

**Objetivo:** Iterar basado en feedback

**Tareas:**
- [ ] Identificar patrones de mejora
- [ ] Ajustar sistema RAG
- [ ] Re-extracción de PDFs si necesario
- [ ] Validar mejoras (v2)

---

## 📖 Guías de Uso

### **Para Desarrolladores:**
1. Ver `SISTEMA_EVALUACION_AGENTES.md` para arquitectura completa
2. Ver `questions/` para banco de preguntas
3. Ver `evaluations/EVAL-*/responses/` para ejemplos de respuestas
4. Ver `templates/` para crear nuevas evaluaciones

### **Para Especialistas (Sebastian):**
1. Ver lista de preguntas en `questions/*.json`
2. Probar preguntas en http://localhost:3000/chat
3. Usar template de feedback en `templates/feedback-template.md`
4. Enviar resultados para consolidación

### **Para Gestión:**
1. Ver `reports/` para tendencias de calidad
2. Ver `iterations/` para mejoras aplicadas
3. Ver metadata.json para estado actual
4. Ver summary-report.md para resúmenes ejecutivos

---

## 🔗 Archivos Importantes

### **Documentación:**
- [`SISTEMA_EVALUACION_AGENTES.md`](./SISTEMA_EVALUACION_AGENTES.md) - Arquitectura completa
- [`questions/S001-questions-v1.json`](./questions/S001-questions-v1.json) - 66 preguntas S001
- [`questions/M001-questions-v1.json`](./questions/M001-questions-v1.json) - 19 preguntas M001

### **Evaluaciones Activas:**
- [`EVAL-S001-2025-10-29-v1/`](./evaluations/EVAL-S001-2025-10-29-v1/) - Evaluación S001 v1
- [`EVAL-M001-2025-10-29-v1/`](./evaluations/EVAL-M001-2025-10-29-v1/) - Evaluación M001 v1

### **Reportes:**
- `../TESTING_COMPLETADO_2025-10-29.md` - Testing issues FB-001 a FB-005
- `../RESULTADOS_PRUEBA_FUEGO_M001_2025-10-29.md` - Resultados iniciales M001

---

## 📈 Métricas Globales

### **Total Benchmark:**
- **Total Preguntas:** 85 (66 S001 + 19 M001)
- **Probadas:** 5 (6%)
- **Calidad Promedio:** 9.4/10
- **Phantom Refs:** 0/5 (0%)
- **Target:** 5.0/10
- **Superación:** +88%

### **Por Agente:**

| Agente | Preguntas | Probadas | Calidad | Phantom Refs |
|--------|-----------|----------|---------|--------------|
| S001 | 66 | 1 (1.5%) | 10/10 | 0 |
| M001 | 19 | 4 (21%) | 9.25/10 | 0 |

---

## ✅ Checklist de Evaluación

### **Antes de Enviar a Expertos:**
- [x] ✅ Banco de preguntas creado (S001 + M001)
- [x] ✅ Estructura de evaluación creada
- [x] ✅ Muestra representativa probada (5 preguntas)
- [x] ✅ Validación técnica completada (0 phantom refs)
- [x] ✅ Templates de feedback preparados
- [ ] ⏳ Documentación de respuestas completa (mínimo 10)
- [ ] ⏳ Reporte preliminar generado
- [ ] ⏳ Guía de evaluación para expertos

---

## 🔄 Workflow de Evaluación

```
1. PREPARACIÓN:
   ✅ Crear banco de preguntas
   ✅ Definir categorías y prioridades
   ✅ Establecer criterios de calidad

2. TESTING TÉCNICO:
   ✅ Probar muestra representativa
   ✅ Validar sistema RAG
   ✅ Verificar 0 phantom refs
   ⏳ Documentar todas las respuestas

3. ENTREGA A EXPERTOS:
   ⏳ Preparar paquete completo
   ⏳ Enviar con guías y templates
   ⏳ Proveer acceso al sistema

4. EVALUACIÓN EXPERTA:
   ⏳ Expertos prueban preguntas
   ⏳ Califican calidad 1-10
   ⏳ Validan contenido técnico
   ⏳ Aprueban/rechazan/sugieren

5. CONSOLIDACIÓN:
   ⏳ Recopilar feedback
   ⏳ Generar reporte final
   ⏳ Identificar mejoras
   ⏳ Planificar v2 si necesario
```

---

## 📞 Contacto

**Coordinador de Evaluaciones:** Alec  
**Email:** alec@getaifactory.com

**Experto Validador:** Sebastian  
**Email:** sebastian@salfa.cl  
**Especialidad:** Gestión de Bodegas (S001) + Legal/Territorial (M001)

---

## 🎓 Recursos Adicionales

- [Testing Issues Resueltos](../TESTING_COMPLETADO_2025-10-29.md)
- [Fix Permanente Numeración](../FIX_PERMANENTE_NUMERACION_2025-10-29.md)
- [Guía Testing Sebastian](../GUIA_TESTING_PARA_SEBASTIAN_2025-10-29.md)

---

**🎯 Sistema de Evaluación Operacional - Listo para Uso** ✅










