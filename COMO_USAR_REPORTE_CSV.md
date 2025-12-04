# 📊 Cómo Usar el Reporte de Preguntas (CSV)

## ✅ Archivo Generado

**Nombre:** `preguntas-7dias-limpio.csv`  
**Ubicación:** `/Users/alec/salfagpt/preguntas-7dias-limpio.csv`  
**Tamaño:** 1,471 líneas (1,470 registros + 1 header)  
**Período:** 21 nov → 28 nov 2025 (últimos 7 días)

---

## 📋 Estructura del CSV

```
Agent_ID,Agent_Title,Agent_Owner,User_ID,User_Email,User_Name,Date,Day_Name,Questions
```

**Columnas:**
1. `Agent_ID` - ID único del agente
2. `Agent_Title` - Nombre del agente
3. `Agent_Owner` - ID del dueño del agente
4. `User_ID` - ID del usuario que hizo la pregunta
5. `User_Email` - Email del usuario
6. `User_Name` - Nombre completo del usuario
7. `Date` - Fecha (YYYY-MM-DD)
8. `Day_Name` - Día de la semana en español
9. `Questions` - Número de preguntas ese día

---

## 📊 Importar en Excel

### Método 1: Drag & Drop
1. Abrir Excel
2. Arrastrar `preguntas-7dias-limpio.csv` al Excel
3. Excel detecta automáticamente el formato CSV
4. ✅ Datos listos para analizar

### Método 2: Importar desde Datos
1. Abrir Excel
2. **Datos** → **Obtener datos externos** → **Desde texto/CSV**
3. Seleccionar `preguntas-7dias-limpio.csv`
4. **Delimitador:** Coma
5. **Codificación:** UTF-8
6. Importar

---

## 📈 Análisis Recomendados en Excel

### 1. Tabla Dinámica: Preguntas por Agente

**Configuración:**
- **Filas:** Agent_Title
- **Valores:** SUMA de Questions
- **Ordenar:** Descendente por suma
- **Filtros:** Date (rango), User_Email

**Resultado:** Verás qué agentes son más usados

---

### 2. Tabla Dinámica: Preguntas por Usuario

**Configuración:**
- **Filas:** User_Name, User_Email
- **Valores:** SUMA de Questions
- **Ordenar:** Descendente por suma
- **Filtros:** Date (rango)

**Resultado:** Verás qué usuarios hacen más preguntas

---

### 3. Tabla Dinámica: Preguntas por Día

**Configuración:**
- **Filas:** Date, Day_Name
- **Valores:** SUMA de Questions
- **Ordenar:** Por fecha

**Resultado:** Verás la distribución temporal

---

### 4. Tabla Dinámica: Heatmap (Usuario × Agente)

**Configuración:**
- **Filas:** User_Name
- **Columnas:** Agent_Title
- **Valores:** SUMA de Questions
- **Formato condicional:** Escala de colores

**Resultado:** Mapa de calor mostrando qué usuario usa qué agente

---

## 📊 Gráficos Recomendados

### Gráfico 1: Barras - Top 20 Agentes
- **Tipo:** Barras horizontales
- **Datos:** Agent_Title vs SUM(Questions)
- **Filtrar:** Top 20

### Gráfico 2: Línea - Tendencia Temporal
- **Tipo:** Línea
- **Eje X:** Date
- **Eje Y:** SUM(Questions)
- **Series:** Por agente (top 5)

### Gráfico 3: Barras Apiladas - Diario por Usuario
- **Tipo:** Barras apiladas
- **Eje X:** Date
- **Eje Y:** Questions
- **Colores:** Por User_Name

### Gráfico 4: Pie Chart - Distribución por Usuario
- **Tipo:** Circular
- **Valores:** SUM(Questions) por User_Name
- **Filtrar:** Top 10 usuarios

---

## 🔍 Filtros Útiles

### Filtro por Período
```excel
=SI(Y(Date >= "2025-11-21", Date <= "2025-11-28"), ...)
```

### Filtro por Usuario Específico
```excel
=SI(User_Email = "alec@getaifactory.com", ...)
```

### Filtro por Día de la Semana
```excel
=SI(Day_Name = "lunes", ...)
```

### Solo Días con Actividad
```excel
=SI(Questions > 0, ...)
```

---

## 📊 Importar en Google Sheets

1. Ir a Google Sheets: https://sheets.google.com
2. **Archivo** → **Importar**
3. **Subir** → Seleccionar `preguntas-7dias-limpio.csv`
4. **Tipo de separador:** Coma
5. **Convertir texto a números:** Sí
6. Importar datos

### Crear Gráfico en Sheets:
1. Seleccionar datos
2. **Insertar** → **Gráfico**
3. **Tipo de gráfico:** Barras apiladas / Línea / Circular
4. **Configurar ejes** según análisis deseado

---

## 💡 Insights Rápidos

### Ver Total de Preguntas
```excel
=SUMA(I:I)  // Columna Questions
```

### Ver Usuarios Únicos
```excel
=CONTAR.SI.CONJUNTO(E:E, E:E, ">0")  // User_Email no vacío
```

### Ver Agentes Únicos
```excel
=CONTAR.SI.CONJUNTO(A:A, A:A, "<>")  // Agent_ID únicos
```

### Día con Más Actividad
```excel
=SUMAR.SI(G:G, "2025-11-25", I:I)  // Suma si Date = 2025-11-25
```

---

## 🎯 Preguntas de Análisis que Puedes Responder

✅ **¿Qué agentes son más usados?**
- Tabla dinámica: Agent_Title vs SUMA(Questions)

✅ **¿Qué usuarios son más activos?**
- Tabla dinámica: User_Name vs SUMA(Questions)

✅ **¿Qué día hubo más preguntas?**
- Tabla dinámica: Date vs SUMA(Questions)

✅ **¿Qué usuario usa qué agente?**
- Tabla dinámica: User_Name (filas) × Agent_Title (columnas)

✅ **¿Cuál es la tendencia en el tiempo?**
- Gráfico de línea: Date vs Questions

✅ **¿Hay patrones por día de la semana?**
- Tabla dinámica: Day_Name vs SUMA(Questions)

✅ **¿Qué agentes usa cada usuario?**
- Filtrar por User_Email, ver Agent_Title únicos

✅ **¿Cuándo fue el pico de actividad?**
- MAX(Questions) y buscar Date correspondiente

---

## 🔄 Regenerar el Reporte

Si necesitas actualizar los datos:

```bash
# Generar nuevo CSV
cd /Users/alec/salfagpt
npx tsx scripts/export-questions-csv.ts 2>/dev/null > nuevo-reporte.csv

# Limpiar logs (si los hay)
tail -n +10 nuevo-reporte.csv > reporte-limpio.csv
```

---

## 📧 Compartir el Análisis

### Enviar por Email
1. Adjuntar `preguntas-7dias-limpio.csv`
2. Incluir este documento (`COMO_USAR_REPORTE_CSV.md`) como guía

### Presentación
1. Crear gráficos en Excel/Sheets
2. Exportar como imágenes (PNG)
3. Insertar en PowerPoint/Google Slides
4. Añadir insights principales

---

## ✅ Resumen

**Tienes:**
- ✅ CSV con 1,470 registros
- ✅ 9 columnas de datos
- ✅ 210 agentes con actividad
- ✅ 19 usuarios activos
- ✅ 258 preguntas totales
- ✅ Desglose diario (7 días)

**Puedes:**
- ✅ Importar en Excel/Sheets
- ✅ Crear tablas dinámicas
- ✅ Generar gráficos
- ✅ Filtrar por cualquier columna
- ✅ Hacer análisis personalizados

---

**Archivo listo:** `preguntas-7dias-limpio.csv` ✅

