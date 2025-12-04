# 📊 Reporte de Preguntas por Agente/Usuario/Día

**Período:** 21 nov 2025 → 28 nov 2025 (7 días)  
**Generado:** 27 nov 2025  
**Fuente:** Firestore `messages` collection

---

## 📈 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total Preguntas** | **258** |
| **Promedio por Día** | **36.9** |
| **Agentes con Actividad** | **210** |
| **Usuarios Activos** | **19** |
| **Preguntas por Usuario** | **13.6** (promedio) |
| **Preguntas por Agente** | **1.2** (promedio) |

---

## 🏆 Top 10 Agentes Más Activos

| # | Agente | Usuario | Total Preguntas | Día Pico |
|---|--------|---------|-----------------|----------|
| 1 | Hola, puede ayudar con siguiente información | INGRID OJEDA ALVARADO | 10 | Lun 25/11 (10) |
| 2 | GOP GPT (M3-v2) | Alec Dickinson | 9 | Lun 25/11 (9) |
| 3 | Nueva Conversación | OSCAR PEDRO JIMENEZ URETA | 4 | Dom 24/11 (4) |
| 4 | Cual Diferencia condominio tipo tipo | FRANCIS ANAIS DIAZ TOBAR | 4 | Mar 26/11 (4) |
| 5 | Qué puedo preguntarte | LAURA GONZALEZ | 4 | Jue 21/11 (4) |
| 6 | Para que sirve transacción SAP, Migo | Alec Dickinson | 3 | Lun 25/11 (3) |
| 7 | Arreglar siguente Script modificar los campos | SEBASTIAN RODRIGO Cortes Rodriguez | 3 | Dom 24/11 (3) |
| 8 | Siguente script parte Json Class hay | SEBASTIAN RODRIGO Cortes Rodriguez | 3 | Lun 25/11 (3) |
| 9 | Por dónde empiezo | Capacitaciones IA | 3 | Dom 24/11 (3) |
| 10 | Cómo hago pedido convenio | Alec Dickinson | 2 | Lun 25/11 (2) |

---

## 📅 Distribución por Día de la Semana

| Día | Preguntas | % del Total |
|-----|-----------|-------------|
| **Lunes 25/11** | **~150** | **~58%** ⭐ Día pico |
| **Martes 26/11** | **~35** | **~14%** |
| **Domingo 24/11** | **~30** | **~12%** |
| **Jueves 21/11** | **~25** | **~10%** |
| **Viernes 22/11** | **~10** | **~4%** |
| **Sábado 23/11** | **~5** | **~2%** |
| **Miércoles 27/11** | **~3** | **~1%** |

**Insight:** El lunes 25/11 concentró más de la mitad de las preguntas (58%).

---

## 👥 Top 5 Usuarios Más Activos

| # | Usuario | Email | Total Preguntas | Agentes Usados |
|---|---------|-------|-----------------|----------------|
| 1 | INGRID OJEDA ALVARADO | IOJEDAA@maqsa.cl | 10 | 1 |
| 2 | Alec Dickinson | alec@getaifactory.com | ~20 | Múltiples |
| 3 | FRANCIS ANAIS DIAZ TOBAR | fdiazt@salfagestion.cl | ~8 | Múltiples |
| 4 | SEBASTIAN RODRIGO Cortes Rodriguez | SCORTESR@salfagestion.cl | ~8 | Múltiples |
| 5 | OSCAR PEDRO JIMENEZ URETA | ojimenez@inoval.cl | 4 | 1 |

---

## 📊 Insights y Patrones

### 🔥 Picos de Actividad

1. **Lunes 25/11** - Día con mayor actividad (58% de preguntas)
   - Posible inicio de semana laboral
   - Múltiples usuarios activos simultáneamente

2. **Domingo 24/11 y Martes 26/11** - Actividad moderada
   - Usuarios trabajando en fin de semana y después del pico

3. **Miércoles 27/11** - Mínima actividad
   - Posible día festivo o reducción post-pico

### 👥 Comportamiento de Usuarios

**Usuarios Power**:
- Alec Dickinson: Usa múltiples agentes especializados (GOP GPT, SAP queries, etc.)
- SEBASTIAN RODRIGO Cortes Rodriguez: Scripts y desarrollo (múltiples conversaciones técnicas)

**Usuarios Focused**:
- INGRID OJEDA ALVARADO: 10 preguntas en 1 agente (uso intensivo concentrado)
- OSCAR PEDRO JIMENEZ URETA: 4 preguntas en 1 agente (exploración inicial)

### 🤖 Tipos de Agentes

**Agentes de Aprendizaje**:
- "Qué puedo preguntarte"
- "Por dónde empiezo"

**Agentes Técnicos**:
- GOP GPT (M3-v2)
- Scripts y desarrollo

**Agentes Operativos**:
- SAP transacciones
- Mantenimiento maquinarias
- Procesos de compra

---

## 📁 Archivos Generados

1. **reporte-preguntas-7dias.csv** - Datos completos exportables
   - Columnas: Agent ID, Title, Owner, User ID, Email, Name, Date, Day, Questions
   - 1,504 filas (210 agentes × 7 días)
   - Importable a Excel/Google Sheets

2. **generate-questions-chart.html** - Visualización interactiva
   - Gráficos de barras apiladas
   - Selector de agente
   - Stats cards
   - Top 10 agentes

3. **Este documento (REPORTE_PREGUNTAS_7_DIAS.md)** - Resumen ejecutivo

---

## 🔧 Cómo Usar los Archivos

### Ver Tabla en Terminal
```bash
npx tsx scripts/report-questions-simplified.ts
```

### Generar CSV
```bash
npx tsx scripts/report-questions-simplified.ts --format=csv > reporte.csv
```

### Generar JSON
```bash
npx tsx scripts/report-questions-simplified.ts --format=json > reporte.json
```

### Ver Gráfico Interactivo
```bash
open scripts/generate-questions-chart.html
```

### Importar a Excel
1. Abrir Excel
2. Datos → Importar desde CSV
3. Seleccionar `reporte-preguntas-7dias.csv`
4. Usar comas como delimitador
5. Crear tabla dinámica para análisis

### Importar a Google Sheets
1. Abrir Google Sheets
2. Archivo → Importar
3. Subir `reporte-preguntas-7dias.csv`
4. Separador: Coma
5. Crear gráficos personalizados

---

## 📊 Ejemplos de Análisis

### Pivot Table sugerida en Excel:

**Filas:** Agent Title  
**Columnas:** Date  
**Valores:** SUM(Questions)  
**Filtros:** User Email

Esto te permitirá ver rápidamente:
- Qué agentes son más usados
- Qué días hay más actividad
- Qué usuarios son power users
- Distribución temporal

### Gráficos recomendados:

1. **Barras Apiladas** - Preguntas por día (colores por agente)
2. **Línea de Tiempo** - Tendencia de preguntas en el tiempo
3. **Heatmap** - Usuario × Agente × Intensidad
4. **Pie Chart** - Distribución por agente (top 10)

---

## 🚀 Próximos Pasos

1. **Automatizar**: Programar generación diaria del reporte
2. **Dashboard**: Integrar en UI de analytics
3. **Alertas**: Notificar cuando hay picos anormales
4. **Segmentación**: Agregar filtros por dominio, rol, departamento
5. **Comparación**: Semana vs semana anterior

---

## 📚 Referencias

- **Script:** `scripts/report-questions-simplified.ts`
- **API:** `src/pages/api/analytics/questions-report.ts`
- **Componente:** `src/components/QuestionsReportChart.tsx`
- **Datos:** Firestore `messages` collection
- **Índices:** `firestore.indexes.json` (role + timestamp)

---

**Generado por:** Flow Analytics System  
**Versión:** 1.0.0  
**Status:** ✅ Production Ready

