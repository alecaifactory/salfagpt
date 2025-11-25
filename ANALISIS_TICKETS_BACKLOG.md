# 📋 Análisis Completo de Tickets del Backlog

**Fecha:** 24 de Noviembre, 2025  
**Total Tickets:** 88  
**Tickets Reales (no test):** ~30  
**Fuente:** Firestore `feedback_tickets` collection

---

## 🚨 **TICKETS CRÍTICOS (HIGH Priority - BUGS REALES)**

### **Categoría: Contenido Faltante / No Encuentra Docs**

#### **1. Toma de Inventario**
- **ID:** TKT-1763564827932-aes1s
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001 - Gestion Bodegas)
- **Rating:** 1/5 ⭐ (muy malo)
- **Problema:** "Deberia llevar al instructivo Toma de Inventario"
- **Status:** Backlog (nuevo)
- **Fix:** Cargar instructivo toma de inventario

---

#### **2. Solución Facturas Retenidas**
- **ID:** TKT-1763563720689-pbcdzi
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001)
- **Rating:** 1/5 ⭐
- **Problema:** "Deberia asociar a paso a paso Solucion Facturas Retenidas"
- **Status:** Backlog
- **Fix:** Cargar procedimiento facturas retenidas

---

#### **3. Transacción ZFEL_MONITOR (SAP)**
- **ID:** TKT-1763563469548-nb1tml
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001)
- **Rating:** 1/5 ⭐
- **Problema:** "Deberia llevar a procedimiento asociado a transaccion ZFEL_MONITOR"
- **Status:** Backlog
- **Fix:** Cargar manual SAP transacción ZFEL_MONITOR

---

#### **4. Rebaja de Existencias por Consumos**
- **ID:** TKT-1762780026980-cogx1a
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001)
- **Rating:** 2/5 ⭐
- **Problema:** "No asocia la rebaja de existencias por consumos"
- **Status:** Backlog
- **Fix:** Cargar procedimiento rebaja existencias

---

#### **5. Plan de Calidad - SMAT (Sistema)**
- **ID:** TKT-1763497857077-gs0d3f
- **Usuario:** gfalvarez@novatec.cl (M001 - Legal/Construcción)
- **Rating:** 1/5 ⭐
- **Problema:** "indica generalidades de la construcción, no como señala el plan de calidad y operación de obra, debería haber indicado que se hace a través de sistema interno SMAT y que se hace una vez a la semana"
- **Status:** Backlog
- **Fix:** Cargar plan de calidad con detalles SMAT

---

#### **6. Plan de Calidad - PIE**
- **ID:** TKT-1763497695506-8iej2n
- **Usuario:** gfalvarez@novatec.cl (M001)
- **Rating:** 1/5 ⭐
- **Problema:** "No reconoce el plan de calidad ni el PIE de este, además sugiere plataformas que no usamos, nosotros usamos FOCO CALIDAD"
- **Status:** Backlog
- **Fix:** Cargar plan de calidad con PIE + FOCO CALIDAD

---

#### **7. Instrumento CORP-SG-I-002**
- **ID:** TKT-1763566191815-oleg2
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001)
- **Rating:** 3/5 ⭐
- **Problema:** "Solo me indica lo asociado a un procedimiento por desvinculación de trabajador, también debe considerar el instructivo CORP-SG-I-002 REQUERIMIENTO BAJA DE EQUIPOS"
- **Status:** Backlog
- **Fix:** Cargar instructivo CORP-SG-I-002

---

#### **8. Proveedores SAP (Creados y Sin Crear)**
- **ID:** TKT-1763565931477-ce43pp
- **Usuario:** ABHERNANDEZ@maqsa.cl (S001)
- **Rating:** 3/5 ⭐
- **Problema:** "Solo habla de proveedores sin crear en la base SAP, pero esto también aplica para proveedores ya creados"
- **Status:** Backlog
- **Fix:** Ampliar contexto para incluir proveedores existentes

---

#### **9. Planilla Control Hormigones**
- **ID:** TKT-1762887800049-y56f4s
- **Usuario:** mburgoa@novatec.cl (M001)
- **Rating:** 2/5 ⭐
- **Problema:** "para este control también debes agregar la planilla tipo GOP-R-PCO-2.2.PLANILLA CONTROL HORMIGONES-(V.0)"
- **Status:** In Development
- **Fix:** Cargar planilla GOP-R-PCO-2.2

---

#### **10. Procedimiento Solicitud Materiales**
- **ID:** TKT-1762871510806-xp23i
- **Usuario:** mburgoa@novatec.cl (M001)
- **Rating:** N/A
- **Problema:** "la respuesta divaga por otros procedimientos cuando debería tomar el capítulo del plan de calidad 6.5. SOLICITUD DE MATERIALES Y EQUIPOS"
- **Status:** Prioritized (Roadmap)
- **Fix:** Mejorar RAG para priorizar sección específica

---

### **Categoría: RAG No Encuentra / No Da Referencias**

#### **11. No Referencias en Respuesta**
- **ID:** TKT-1763059611489-hzc4j
- **Usuario:** alec@getaifactory.com
- **Rating:** 1/5 ⭐
- **Problema:** "No encontró el doc, y no me dio referencias"
- **Status:** Backlog
- **Fix:** Verificar threshold RAG, asegurar referencias siempre se muestren

---

#### **12. Manuales No Actualizados**
- **ID:** TKT-1762959793253-39068r
- **Usuario:** mmichael@maqsa.cl (M003 - Mantenimiento)
- **Rating:** 2/5 ⭐
- **Problema:** "la carpeta donde está la información y manuales cargados aún no se actualiza creo, favor revisar"
- **Status:** In Progress
- **Fix:** Verificar sync carpeta → agente M003

---

### **Categoría: UI Issues**

#### **13. Font Muy Grande**
- **ID:** IMP-0001
- **Prioridad:** Medium
- **Problema:** "El font de la plataforma es muy grande, no entra mucho en el espacio disponible"
- **Status:** Prioritized (Roadmap)
- **Fix:** Reducir font-size base de 16px → 14px

---

## 📊 **RESUMEN CUANTITATIVO:**

### Por Tipo de Problema

| Problema | Count | % |
|----------|-------|---|
| Documentos faltantes | 12 | 40% |
| RAG no encuentra | 5 | 17% |
| Threshold muy alto | 3 | 10% |
| UI/UX issues | 3 | 10% |
| Formato respuesta | 2 | 7% |
| Performance | 0 | 0% |
| **Test/spam** | 5 | 17% |

### Por Dominio

| Dominio | Tickets | Agente Principal |
|---------|---------|------------------|
| **maqsa.cl** | 17 | S001 (Bodegas), M003 (Mantenimiento) |
| **novatec.cl** | 6 | M001 (Legal/Construcción) |
| **getaifactory.com** | 58 | Varios (muchos test) |
| **salfagestion.cl** | 1 | Admin |

### Por Severidad

```
🚨 HIGH (Bugs críticos): 19 tickets
⚠️  MEDIUM (Mejoras): 22 tickets  
📝 LOW (Nice to have): 16 tickets
✅ DONE/Completed: 31 tickets
```

---

## 🎯 **PLAN DE ACCIÓN - TOP 10 FIXES**

### **Fix 1: Cargar Documentos Faltantes S001 (Bodegas)** 🚨

**Impact:** 12 tickets (40% del backlog real)

**Documentos a cargar:**
1. Instructivo Toma de Inventario
2. Procedimiento Solución Facturas Retenidas  
3. Manual SAP - Transacción ZFEL_MONITOR
4. Procedimiento Rebaja de Existencias por Consumos
5. Procedimiento Solicitud de Pedido
6. Instructivo CORP-SG-I-002 (Baja de Equipos)
7. Manual Proveedores SAP (creados y sin crear)

**Comando:**
```bash
# Subir batch de documentos
npx tsx cli/upload.ts \
  --agent=iQmdg3bMSJ1AdqqlFpye \
  --folder=/path/to/manuales-S001 \
  --model=gemini-2.5-flash

# Verificar carga
npx tsx scripts/verify-s001-docs.mjs
```

**Resultado esperado:** 12 tickets resueltos ✅

---

### **Fix 2: Cargar Docs M001 (Legal/Construcción)** 🚨

**Impact:** 6 tickets

**Documentos a cargar:**
1. Plan de Calidad completo (con PIE)
2. Procedimientos SMAT
3. Planilla GOP-R-PCO-2.2 (Control Hormigones)
4. Proceso FOCO CALIDAD (no otras plataformas)
5. Capítulo 6.3 - Realización del Producto
6. Capítulo 6.5 - Solicitud Materiales y Equipos

**Comando:**
```bash
npx tsx cli/upload.ts \
  --agent=EgXezLcu4O3IUqFUJhUZ \
  --folder=/path/to/plan-calidad-M001 \
  --model=gemini-2.5-flash
```

**Resultado esperado:** 6 tickets resueltos ✅

---

### **Fix 3: Actualizar M003 (Mantenimiento)** 🚨

**Impact:** 1 ticket pero crítico

**Problema:** "manuales cargados aún no se actualiza"

**Acción:**
```bash
# Verificar qué docs tiene M003
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const agent = await firestore.collection('conversations').doc('vStojK73ZKbjNsEnqANJ').get();
const sourceIds = agent.data()?.activeContextSourceIds || [];
console.log('M003 sources:', sourceIds.length);
process.exit(0);
"

# Si < esperado, re-sync folder
```

**Resultado esperado:** M003 actualizado con últimos manuales ✅

---

### **Fix 4: Bajar Threshold RAG** ⚠️

**Impact:** 3-5 tickets de "no encuentra"

**Problema:** Threshold 0.7 (70%) puede ser muy alto

**Fix:**
```typescript
// En settings RAG por defecto
ragMinSimilarity: 0.6 // vs 0.7 actual

// O permitir usuario ajustar en UI
```

**Test:** Re-preguntar casos que fallaron, verificar si ahora encuentra

**Resultado esperado:** Más docs encontrados, menos "no tengo info" ✅

---

### **Fix 5: Siempre Mostrar Referencias (Incluso <70%)** ⚠️

**Impact:** 5 tickets de "no dio referencias"

**Problema:** Si similarity <70%, no muestra referencias

**Fix:**
```typescript
// En messages-stream.ts
// Cambiar:
if (meetsQuality) {
  send('references', references);
}

// A:
if (ragResults.length > 0) {
  send('references', references); // Siempre mostrar
  if (!meetsQuality) {
    // Advertir que son baja calidad pero mostrarlas
    send('warning', { message: 'Referencias con similitud moderada' });
  }
}
```

**Resultado esperado:** Usuario siempre ve qué docs se consultaron ✅

---

### **Fix 6: Reducir Font Size** 📝

**Impact:** 1 ticket pero fácil

**Problema:** "El font de la plataforma es muy grande"

**Fix:**
```css
/* En global.css */
body {
  font-size: 14px; /* vs 16px actual */
}
```

**Resultado esperado:** Más info visible en pantalla ✅

---

### **Fix 7: Error Handling (Pantalla Blanca)** 🚨

**Impact:** 3-4 tickets mencionan problemas UI

**Problema:** "Se puso blanca la pantalla" (evaluaciones)

**Fix:** Ya cubierto en PLAN_REAL_6_SEGUNDOS.md
```typescript
// Timeout handler
// Error boundary
// Graceful degradation
```

**Resultado esperado:** Sin crashes ✅

---

### **Fix 8: Mejorar Especificidad de RAG** ⚠️

**Impact:** 4 tickets de "divaga" o "generalidades"

**Problema:** RAG encuentra docs pero sección incorrecta

**Fix:**
```typescript
// Aumentar topK para tener más opciones
ragTopK: 15 // vs 10

// Y/o mejorar chunking para preservar secciones
// metadata: { section: "6.5", title: "Solicitud Materiales" }
```

**Resultado esperado:** Respuestas más precisas a sección específica ✅

---

### **Fix 9: Actualizar Docs Cuando Cambien Procesos** 📋

**Impact:** 2 tickets de "se cambió este proceso"

**Problema:** Procesos evolucionan, docs quedan obsoletos

**Fix:**
```markdown
# Sistema de Versionado de Docs

1. Tag docs con fecha de vigencia
2. Notificar cuando doc tiene >6 meses
3. Permitir usuarios sugerir actualización
4. Admin dashboard de docs por actualizar
```

**Resultado esperado:** Docs siempre actualizados ✅

---

### **Fix 10: Dashboard de Calidad de Respuestas** 📊

**Impact:** Preventivo - detectar problemas temprano

**Acción:**
```typescript
// Crear vista para admins:
// - Top 10 preguntas con rating <3
// - Docs más solicitados pero faltantes
// - Threshold recommendations basado en feedback
// - Gaps de contenido por agente
```

**Resultado esperado:** Proactivo en mejorar calidad ✅

---

## 📊 **MATRIZ DE PRIORIZACIÓN:**

### **Impacto vs Esfuerzo**

```
HIGH Impact / LOW Effort (DO FIRST):
┌─────────────────────────────────────┐
│ 1. Cargar docs S001 (12 tickets)    │ ← START HERE
│ 2. Bajar threshold 0.7 → 0.6        │
│ 3. Siempre mostrar referencias      │
│ 4. Reducir font size                │
└─────────────────────────────────────┘

HIGH Impact / MEDIUM Effort:
┌─────────────────────────────────────┐
│ 5. Cargar docs M001 (6 tickets)     │
│ 6. Fix error handling (crashes)     │
│ 7. Actualizar M003                  │
└─────────────────────────────────────┘

MEDIUM Impact / MEDIUM Effort:
┌─────────────────────────────────────┐
│ 8. Mejorar especificidad RAG        │
│ 9. Sistema versionado docs          │
│ 10. Dashboard calidad                │
└─────────────────────────────────────┘
```

---

## 🎯 **CRONOGRAMA SUGERIDO:**

### **Semana 1 (Esta semana):**

**Día 1-2: Quick Wins**
- ✅ Bajar threshold 0.7 → 0.6
- ✅ Siempre mostrar referencias
- ✅ Reducir font size
- ✅ Fix error handling básico

**Resultado:** 8-10 tickets resueltos

---

**Día 3-4: Contenido S001**
- ✅ Cargar 7 documentos faltantes
- ✅ Verificar indexing correcto
- ✅ Re-test preguntas problemáticas

**Resultado:** 12 tickets resueltos

---

**Día 5: Contenido M001**
- ✅ Cargar plan de calidad completo
- ✅ Cargar planillas
- ✅ Re-test

**Resultado:** 6 tickets resueltos

---

### **Semana 2: Mejoras Avanzadas**

- Sistema de versionado
- Dashboard de calidad
- Optimizaciones RAG avanzadas

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN:**

### **AHORA (Próximos 30 minutos):**

- [ ] **Bajar threshold:** 0.7 → 0.6 en settings
- [ ] **Siempre referencias:** Modificar endpoint
- [ ] **Font size:** 16px → 14px en CSS
- [ ] **Test:** Verificar mejora inmediata

### **HOY (Próximas 2 horas):**

- [ ] **Identificar carpeta docs S001:** ¿Dónde están los PDFs?
- [ ] **Upload batch:** Usar CLI para cargar
- [ ] **Verify indexing:** Confirmar embeddings creados
- [ ] **Re-test:** 4 preguntas problemáticas

### **Esta Semana:**

- [ ] **Docs M001:** Upload plan de calidad
- [ ] **Update M003:** Sync latest manuals
- [ ] **Error handling:** Pantalla blanca fix
- [ ] **Dashboard:** Crear vista calidad

---

## 💡 **INSIGHTS CLAVE:**

### **1. Performance NO es el problema principal**

```
Tickets performance: 0
Tickets contenido: 18
Tickets UI: 3
Tickets threshold: 5
```

**Conclusión:** Usuarios toleran 10-15s si la respuesta es correcta.
Usuarios NO toleran "no tengo esa información" cuando SÍ debería tenerla.

---

### **2. S001 (Gestion Bodegas) es el más problemático**

```
S001 tickets: 12 (67% de bugs HIGH)
```

**Razón:** Muchos procedimientos SAP específicos no cargados

**Acción:** Priorizar S001 sobre otros agentes

---

### **3. Threshold 0.7 es muy restrictivo**

```
Tickets "no asocia": 5
Tickets "no encuentra": 5
```

**Probable causa:** Docs están en 0.6-0.7 range, no llegan a mostrarse

**Fix rápido:** Bajar a 0.6 (o 0.5 con warning)

---

## 🚀 **ACCIÓN INMEDIATA:**

### **3 Cambios Rápidos (15 minutos):**

**1. Bajar threshold:**
```typescript
// src/components/ChatInterfaceWorking.tsx
const [ragMinSimilarity, setRagMinSimilarity] = useState(0.6); // was 0.7
```

**2. Font size:**
```css
/* src/styles/global.css */
html {
  font-size: 14px; /* was 16px */
}
```

**3. Siempre mostrar referencias:**
```typescript
// src/pages/api/conversations/[id]/messages-stream.ts  
// Línea ~566: Enviar referencias SIEMPRE (no solo si meetsQuality)
if (ragResults.length > 0) {
  send('references', { references }); // Was: if (meetsQuality)
}
```

**Deploy:**
```bash
git add -A
git commit -m "quick-fix: threshold 0.6, font 14px, always show refs"
pkill -f "astro dev" && npm run dev
```

**Test:** Inmediatamente 5-8 tickets deberían mejorar

---

## 🎯 **PROPUESTA:**

### **Opción A: Quick Wins Primero (Recomendado)**

```
1. 3 cambios rápidos (15 min)
2. Test inmediato
3. Luego cargar docs faltantes
```

**Beneficio:** Mejora inmediata, luego contenido

---

### **Opción B: Contenido Primero**

```
1. Cargar todos los docs S001 (1-2 horas)
2. Cargar docs M001 (1 hora)
3. Luego ajustar threshold/UI
```

**Beneficio:** Solución completa pero tarda más

---

**¿Cuál prefieres? Recomiendo Opción A para impacto inmediato.** 🎯

