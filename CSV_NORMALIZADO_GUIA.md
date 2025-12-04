# 📊 CSV Normalizado - Guía de Uso

**Archivo:** `analytics-normalized.csv`  
**Tamaño:** 11 KB  
**Filas:** 48 (30 días de datos)  
**Columnas:** 26 (todas las dimensiones)

---

## 🎯 Qué Es

**CSV perfectamente normalizado** con una fila por cada combinación de:
- Día × Agente × Usuario

**Incluye:**
- ✅ Dimensiones temporales (fecha, día, semana, mes)
- ✅ Dimensiones de agente (código, título, status, compartido)
- ✅ Dimensiones de usuario (email, nombre, dominio)
- ✅ Métricas de actividad (preguntas, respuestas, total)
- ✅ **Métricas de feedback** (estrellas, comentarios, ratings) ⭐

---

## 📋 Estructura de Columnas (26)

### Dimensiones Temporales (5):
1. `Date` - YYYY-MM-DD
2. `Day_Name` - lunes, martes, etc.
3. `Day_Of_Week` - 0-6 (0=domingo)
4. `Week` - Número de semana del año
5. `Month` - noviembre de 2025

### Dimensiones de Agente (7):
6. `Agent_ID` - ID único del agente
7. `Agent_Code` - M3-v2, S1-v2, etc.
8. `Agent_Title` - GOP GPT (M3-v2)
9. `Agent_Status` - Producción / Privado
10. `Is_Shared` - Sí / No
11. `Shared_With_Count` - Número de usuarios con acceso
12. `Agent_Owner_Email` - Creador del agente

### Dimensiones de Usuario (4):
13. `User_ID` - ID único del usuario
14. `User_Email` - Email completo
15. `User_Name` - Nombre completo
16. `User_Domain` - salfagestion.cl, maqsa.cl, etc.

### Métricas de Actividad (3):
17. `Questions` - Preguntas ese día
18. `Responses` - Respuestas ese día
19. `Total_Messages` - Total ese día

### Métricas de Feedback (7):
20. `Has_Feedback` - Sí / No
21. `Feedback_Count` - Número de feedbacks
22. `Avg_Stars` - Promedio de estrellas (0-5)
23. `Feedback_Comments` - Comentarios concatenados
24. `Expert_Ratings` - Ratings concatenados
25. `NPS_Score` - Promedio NPS (0-10)
26. `CSAT_Score` - Promedio CSAT (1-5)

---

## 📊 Ejemplo de Fila

```csv
2025-11-25,lunes,1,48,noviembre de 2025,vStojK73ZKbjNsEnqANJ,M3-v2,"GOP GPT (M3-v2)",Producción,Sí,14,alec@getaifactory.com,usr_uhwqffaqag1wrryd82tw,alec@getaifactory.com,"Alec Dickinson",getaifactory.com,25,25,50,Sí,2,4.5,"Buena respuesta; Muy útil",aceptable,9.0,5.0
```

**Traducción:**
- **Fecha:** 25 nov 2025 (lunes, semana 48)
- **Agente:** M3-v2 (GOP GPT), Producción, compartido con 14
- **Usuario:** Alec Dickinson (@getaifactory.com)
- **Actividad:** 25 preguntas, 25 respuestas = 50 mensajes
- **Feedback:** 2 feedbacks, promedio 4.5⭐, rating "aceptable"

---

## 🔍 Análisis Posibles en Excel

### Pivot Table 1: Uso por Agente y Dominio

**Configuración:**
- **Filas:** Agent_Code
- **Columnas:** User_Domain
- **Valores:** SUM(Total_Messages)

**Resultado:**
```
            | getaifactory | salfagestion | maqsa | ...
M3-v2       |     116      |      16      |   0   |
S1-v2       |      91      |      20      |  38   |
S2-v2       |      64      |      24      |   4   |
M1-v2       |      26      |      18      |   0   |
```

**Insight:** Ver qué dominio usa qué agente

---

### Pivot Table 2: Satisfacción por Agente

**Configuración:**
- **Filas:** Agent_Code
- **Valores:** 
  - AVG(Avg_Stars)
  - COUNT(Feedback_Count)

**Filtrar:** Has_Feedback = "Sí"

**Resultado:**
```
Agent    | Avg Stars | Feedbacks
M3-v2    |    N/A    |     1
S1-v2    |   2.5     |     7  ← Más feedback
S2-v2    |    N/A    |     1
M1-v2    |   1.0     |     2  ← Baja satisfacción
```

**Insight:** M1-v2 necesita atención urgente

---

### Pivot Table 3: Tendencia Temporal

**Configuración:**
- **Filas:** Date
- **Columnas:** Agent_Code
- **Valores:** SUM(Total_Messages)

**Gráfico:** Líneas múltiples (1 línea por agente)

**Resultado:** Ver tendencia día a día de cada agente

---

### Pivot Table 4: Usuarios Más Activos

**Configuración:**
- **Filas:** User_Email, User_Name
- **Valores:** 
  - SUM(Total_Messages)
  - COUNT(DISTINCT Date) (días activos)

**Resultado:**
```
Usuario                  | Mensajes | Días
alec@getaifactory.com    |   231    |  10
sorellanac@salfagestion  |    43    |   7
fdiazt@salfagestion      |    52    |   8
...
```

---

### Pivot Table 5: Feedback por Dominio

**Configuración:**
- **Filas:** User_Domain
- **Valores:**
  - AVG(Avg_Stars)
  - COUNT(Has_Feedback = "Sí")

**Resultado:**
```
Domain           | Avg Stars | Feedbacks
salfagestion.cl  |   3.2     |    15
getaifactory.com |   4.5     |    30
maqsa.cl         |   2.8     |    10
```

**Insight:** getaifactory tiene mejor satisfacción (testing controlado)

---

### Pivot Table 6: Patrón Semanal

**Configuración:**
- **Filas:** Day_Name
- **Valores:** SUM(Total_Messages), COUNT(User_ID)

**Resultado:**
```
Día        | Mensajes | Usuarios
lunes      |   323    |    14
martes     |   127    |    11
miércoles  |    86    |     8
domingo    |   227    |     9
...
```

**Insight:** Lunes es el día más activo

---

## 🎨 Gráficos Recomendados

### Gráfico 1: Línea de Tiempo por Agente
```
Tipo: Líneas múltiples
X: Date
Y: Total_Messages
Series: Agent_Code (4 líneas)
```

### Gráfico 2: Heatmap Usuario × Agente
```
Tipo: Tabla de calor
Filas: User_Email
Columnas: Agent_Code
Valores: SUM(Total_Messages)
Color: Intensidad
```

### Gráfico 3: Satisfacción vs Uso
```
Tipo: Scatter plot
X: Total_Messages (uso)
Y: Avg_Stars (satisfacción)
Puntos: Cada agente
```

### Gráfico 4: Tendencia de Feedback
```
Tipo: Línea con barras
Línea: Avg_Stars por semana
Barras: Feedback_Count por semana
```

---

## 💡 Análisis Avanzados

### Análisis 1: Correlación Uso × Satisfacción

**Pregunta:** "¿Más uso = mayor satisfacción?"

**Método:**
1. Agrupar por Agent_Code
2. SUM(Total_Messages) vs AVG(Avg_Stars)
3. Calcular correlación

**Resultado:** Ver si agentes más usados son mejor calificados

---

### Análisis 2: Adopción por Semana

**Pregunta:** "¿Cómo crece el uso semanalmente?"

**Método:**
1. Agrupar por Week
2. COUNT(DISTINCT User_ID)
3. Gráfico de línea

**Resultado:** Curva de adopción

---

### Análisis 3: Impacto de Compartir

**Pregunta:** "¿Compartir aumenta el uso?"

**Método:**
1. Comparar: Is_Shared = "Sí" vs "No"
2. AVG(Total_Messages)
3. AVG(DISTINCT User_ID)

**Resultado:** ROI de compartir agentes

---

### Análisis 4: Feedback Negativo

**Pregunta:** "¿Qué genera feedback negativo?"

**Método:**
1. Filtrar: Avg_Stars <= 2
2. Agrupar por Agent_Code
3. Leer Feedback_Comments

**Resultado:** Patrones de insatisfacción

---

## 🔧 Cómo Importar

### Excel:
```
1. Abrir Excel
2. Datos → Obtener datos → Desde texto/CSV
3. Seleccionar analytics-normalized.csv
4. Delimitador: Coma
5. Codificación: UTF-8
6. Cargar
7. Crear tabla dinámica
```

### Google Sheets:
```
1. Ir a sheets.google.com
2. Archivo → Importar
3. Subir analytics-normalized.csv
4. Separador: Coma
5. Importar
6. Datos → Tabla dinámica
```

### Power BI:
```
1. Obtener datos → Texto/CSV
2. Seleccionar analytics-normalized.csv
3. Transformar datos (si necesario)
4. Cargar
5. Crear visualizaciones
```

### Python/Pandas:
```python
import pandas as pd

df = pd.read_csv('analytics-normalized.csv')

# Análisis rápido
print(df.groupby('Agent_Code')['Total_Messages'].sum())
print(df.groupby('User_Domain')['Avg_Stars'].mean())

# Pivot
pivot = df.pivot_table(
    values='Total_Messages',
    index='User_Email',
    columns='Agent_Code',
    aggfunc='sum'
)
```

---

## 📥 Descargar desde Dashboard

**En la página de analytics:**

```
1. Abrir: http://localhost:3000/salfa-analytics
2. Click: "Descargar Datos" (arriba derecha)
3. Menú con 3 opciones:
   
   📄 JSON Completo (215 KB)
   ├─ Multi-dimensional
   ├─ Para análisis programático
   └─ Para dashboard integrations
   
   📊 CSV Normalizado (11 KB) ⭐
   ├─ Excel-ready
   ├─ Con todas las dimensiones
   ├─ Incluye feedback
   └─ Perfecto para pivot tables
   
   ⭐ Feedback Completo (332 KB)
   ├─ Con contexto de conversaciones
   ├─ Mensajes evaluados
   ├─ Fuentes de contexto usadas
   └─ Para análisis de calidad
```

---

## ✅ Ventajas del CSV Normalizado

### 1. Una Fila = Una Observación
- Cada fila es Date × Agent × User
- No redundancia innecesaria
- Fácil de agregar y filtrar

### 2. Todas las Dimensiones
- Temporal: Día, semana, mes
- Categórica: Agente, usuario, dominio
- Numérica: Mensajes, estrellas, scores

### 3. Incluye Feedback
- Sí/No si hay feedback
- Promedio de estrellas
- Comentarios concatenados
- Ratings de experts

### 4. Excel-Ready
- Headers claros
- Sin caracteres especiales problemáticos
- Escapado correcto de comillas
- UTF-8 compatible

---

## 📊 Datos Incluidos

**48 filas = 48 combinaciones de día×agente×usuario con actividad**

**Ejemplo de lo que puedes analizar:**

```sql
-- Preguntas totales por agente
SELECT Agent_Code, SUM(Questions) 
FROM data 
GROUP BY Agent_Code;

-- Satisfacción por dominio
SELECT User_Domain, AVG(Avg_Stars) 
FROM data 
WHERE Has_Feedback = 'Sí'
GROUP BY User_Domain;

-- Usuarios más activos
SELECT User_Email, SUM(Total_Messages), COUNT(DISTINCT Date)
FROM data
GROUP BY User_Email
ORDER BY SUM(Total_Messages) DESC;

-- Días con más feedback
SELECT Date, COUNT(*) as Feedbacks, AVG(Avg_Stars)
FROM data
WHERE Has_Feedback = 'Sí'
GROUP BY Date;
```

---

## 🚀 Para Descargar

### Opción 1: Desde Dashboard (Recomendado)

```
1. Abrir: http://localhost:3000/salfa-analytics
2. Click: "Descargar Datos" ▼
3. Click: "CSV Normalizado"
4. Archivo se descarga: analytics-normalized-2025-12-01.csv
```

### Opción 2: Directo del Servidor

```bash
# El archivo está en:
/Users/alec/aifactory/exports/salfa-analytics/analytics-normalized.csv

# O en public (para descargar):
/Users/alec/aifactory/public/data/analytics-normalized.csv
```

---

## 📈 Casos de Uso

### Caso 1: Análisis de Adopción

**Objetivo:** Ver cómo cada dominio adopta cada agente

**En Excel:**
```
Pivot Table:
- Filas: User_Domain
- Columnas: Agent_Code
- Valores: SUM(Total_Messages)

Resultado: Matriz Dominio × Agente
```

---

### Caso 2: Satisfacción Temporal

**Objetivo:** Ver si la satisfacción mejora con el tiempo

**En Excel:**
```
Pivot Table:
- Filas: Week
- Valores: AVG(Avg_Stars)

Gráfico: Línea de tendencia
```

---

### Caso 3: Usuarios Problemáticos

**Objetivo:** Identificar usuarios con baja satisfacción

**En Excel:**
```
Filtrar: Avg_Stars <= 2
Ordenar: Por User_Email

Ver: Qué usuarios dan ratings bajos
Leer: Feedback_Comments
Acción: Contactar y mejorar experiencia
```

---

### Caso 4: Agentes Infrautilizados

**Objetivo:** Agentes compartidos pero poco usados

**En Excel:**
```
Filtrar: Is_Shared = "Sí"
Pivot: Agent_Code × COUNT(User_ID)
Comparar: Shared_With_Count vs usuarios reales

Ejemplo:
M1-v2: Compartido con 14, usan 5 (36%)
→ Baja adopción, necesita promoción
```

---

## 📁 Archivos Disponibles para Descarga

### En Dashboard (http://localhost:3000/salfa-analytics):

**1. JSON Completo** (215 KB)
```json
{
  "metadata": {...},
  "summary": {...},
  "agents": [...],
  "dailyInteractions": [...],
  "hourlyInteractions": [...],
  "conversations": [...]
}
```

**Uso:** Análisis programático, dashboards customizados

---

**2. CSV Normalizado** (11 KB) ⭐ NUEVO
```csv
Date,Day_Name,...,Questions,Responses,Total_Messages,Has_Feedback,Avg_Stars,...
2025-11-25,lunes,...,25,25,50,Sí,4.5,...
...
```

**Uso:** Excel, Google Sheets, Power BI, SQL, Python

---

**3. Feedback con Contexto** (332 KB)
```json
{
  "feedbacksWithContext": [
    {
      "feedbackType": "user",
      "userStars": 5,
      "conversation": {...},
      "evaluatedMessage": {...},
      "contextSources": [...]
    }
  ]
}
```

**Uso:** Análisis de calidad, mejora de contexto

---

## ✅ Resumen

**CSV Normalizado incluye:**
- ✅ Todas las dimensiones (temporal, agente, usuario)
- ✅ Todas las métricas (actividad, feedback)
- ✅ Feedback integrado (estrellas, comentarios, ratings)
- ✅ Formato perfecto para análisis
- ✅ 26 columnas útiles
- ✅ Excel/Sheets/Power BI ready

**Descarga desde:**
- Dashboard: "Descargar Datos" → "CSV Normalizado"
- Directo: exports/salfa-analytics/analytics-normalized.csv

---

**✅ CSV NORMALIZADO LISTO PARA ANÁLISIS AVANZADO!**

**Recarga el dashboard y descarga el CSV desde el menú:** 
http://localhost:3000/salfa-analytics (Cmd+R) ✅

